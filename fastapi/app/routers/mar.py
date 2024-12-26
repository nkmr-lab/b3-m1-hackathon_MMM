from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import select
from db import get_db
from pydantic import BaseModel

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client=OpenAI()

router = APIRouter()

import base64
import uuid
import os

class ImageData(BaseModel):
    image: str

@router.post("/upload")
async def upload_image(image_data: ImageData):
    try:
        # データURLから画像データをデコード
        header, data = image_data.image.split(',', 1)
        image_data = base64.b64decode(data)

        # 一意のファイル名を生成
        file_name = f"{uuid.uuid4()}.png"
        file_path = os.path.join("images", file_name)

        # ディレクトリが存在しない場合は作成
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # 画像をファイルに保存
        with open(file_path, "wb") as f:
            f.write(image_data)

        return {"message": "Image saved successfully", "file_path": file_path}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))