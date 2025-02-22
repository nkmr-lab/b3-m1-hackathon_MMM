from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import select
from sqlalchemy import DECIMAL, Text
from db import get_db
from pydantic import BaseModel, Field

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client=OpenAI()

router = APIRouter()

import base64
import uuid
import os

# api schema
class PostCreate(BaseModel):
    image: str = Field(
        default="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA",
        title="Image Data",
        description="Base64 encoded image data with MIME type prefix",
        pattern=r"^data:image/.+;base64,[a-zA-Z0-9+/=]+$"  # データURI形式をチェック
    )
    user_id: str = Field(
        ...,
        title="User ID",
        description="ID of the user who uploads the image",
        min_length=1,  # 空文字列を防ぐ
        max_length=36  # UUIDを想定
    )
    gps_lat: float = Field(
        default = 35.70697515393131,
        title="Latitude",
        description="Latitude of the image location",
        ge=-90.0,  # 南緯90度（下限値）
        le=90.0  # 北緯90度（上限値）
    )
    gps_lon: float = Field(
        default = 139.65934722365049,
        title="Longitude",
        description="Longitude of the image location",
        ge=-180.0,  # 西経180度
        le=180.0  # 東経180度
    )
    comment: str = Field(
        default="This is a comment.",
        title="Comment",
        description="Comment about the image",
        max_length=255
    )


@router.post("/upload")
async def upload_image(post_data: PostCreate, db: AsyncSession = Depends(get_db)):
    try:
        # データURLから画像データをデコード
        header, data = post_data.image.split(',', 1)
        image_data = base64.b64decode(data)  # 別の変数に代入

        # 一意のファイル名を生成
        file_name = f"{uuid.uuid4()}.png"
        file_path = os.path.join("images", file_name)

        # ディレクトリが存在しない場合は作成
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # 画像をファイルに保存
        with open(file_path, "wb") as f:
            f.write(image_data)
        
        # データベースに保存
        db_post = Post(
            img_path=file_path,
            user_id=post_data.user_id,  # post_data から正しく取得
            gps_lat=post_data.gps_lat,
            gps_lon=post_data.gps_lon,
            comment=post_data.comment
        )
        db.add(db_post)
        await db.commit()
        await db.refresh(db_post)

        return {"message": "Image saved successfully", "file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# db models
from db import Base
from sqlalchemy import Column, Integer, String

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    img_path = Column(String(255), index=True)
    gps_lat = Column(DECIMAL(9, 6), index=True)  # 精度を指定
    gps_lon = Column(DECIMAL(9, 6), index=True)  # 精度を指定
    comment = Column(Text)
    user_id = Column(String(255), index=True)