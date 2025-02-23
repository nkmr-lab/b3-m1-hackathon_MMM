from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import select
from sqlalchemy import DECIMAL, Text, DateTime, func
from db import get_db
from pydantic import BaseModel, Field
from routers.micchi import User, Spot, UserSpot
from log_conf import logger
import math

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client=OpenAI()

router = APIRouter()

import base64
import uuid
import os

# util
def haversine(lat1, lon1, lat2, lon2):
    """
    ハバースインの公式を使用して2点間の距離を計算する関数
    :param lat1: 始点の緯度
    :param lon1: 始点の経度
    :param lat2: 終点の緯度
    :param lon2: 終点の経度
    :return: 2点間の距離（メートル）
    """
    # 地球の半径（キロメートル）
    R = 6371000.0

    # 度をラジアンに変換
    lat1_rad = math.radians(lat1)
    lon1_rad = math.radians(lon1)
    lat2_rad = math.radians(lat2)
    lon2_rad = math.radians(lon2)

    # ハバースインの公式
    dlat = lat2_rad - lat1_rad
    dlon = lon2_rad - lon1_rad
    a = math.sin(dlat / 2)**2 + math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    # 距離を計算
    distance = R * c

    return distance

# api schema
class PostCreate(BaseModel):
    image_encoded: str = Field(
        default="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA",
        title="Image Data",
        description="Base64 encoded image data with MIME type prefix",
        pattern=r"^data:image/.+;base64,[a-zA-Z0-9+/=]+$"
    )
    user_uid: str = Field(
        ...,
        title="User ID like UUID, not a number",
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

@router.post("/haiku")
async def upload_haiku(post_data: PostCreate, db: AsyncSession = Depends(get_db)):
    """画像+コメントから俳句を生成・登録 → スポットアチーブメントを判定しUserテーブルを更新する"""
    try:
        # データURLから画像データをデコード
        header, data = post_data.image_encoded.split(',', 1)
        image_data = base64.b64decode(data)

        # 一意のファイル名を生成
        file_name = f"{uuid.uuid4()}.png"
        file_path = os.path.join("images", file_name)

        # ディレクトリが存在しない場合は作成
        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # 画像をファイルに保存
        with open(file_path, "wb") as f:
            f.write(image_data)
        
        # 現在のレベルを取得
        user_spots = await db.execute(select(UserSpot).filter_by(user_uid=post_data.user_uid))
        user_spots = user_spots.scalars().all()
        achieved_count = sum(1 for spot in user_spots if spot.is_achieved)
        total_count = len(user_spots)
        achieved_ratio = 0
        if total_count > 0:
            achieved_ratio = achieved_count / total_count

        # レベルの計算
        achievement_level = 1
        if achieved_ratio >= 0.66:
            achievement_level = 3
        elif achieved_ratio >= 0.33:
            achievement_level = 2

        # 俳句生成
        haiku_data = await generate_haiku(base64_image=post_data.image_encoded, comment=post_data.comment, quality=achievement_level)
        haiku = haiku_data["text"]
        haiku_image_description = haiku_data["image_description"]
        # デバッグ：俳句生成カット
        # haiku = "debug"
        # haiku_image_description = "debug"

        # Spotに登録できるか判定
        spots = await db.execute(select(Spot))
        spots = spots.scalars().all()
        near_spot_id = -1
        threshold = 50
        for spot in spots:
            dist = haversine(post_data.gps_lat, post_data.gps_lon, float(spot.lat), float(spot.lon))
            logger.info(f"SPOT ID: {spot.id} DIST:{dist},gps:({post_data.gps_lat},{post_data.gps_lon}),spot:({spot.lat},{spot.lon})")
            if dist < threshold:
                near_spot_id = spot.id
                db_user_spot = await db.execute(
                    select(UserSpot).filter_by(user_uid=post_data.user_uid, spot_id=spot.id)
                )
                user_spot = db_user_spot.scalars().first()
                logger.info(f"NEAR SPOT ID: {near_spot_id} is achieved")
                if user_spot:
                    user_spot.is_achieved = True
                    db.add(user_spot)
                else:
                    logger.info("OKASIIYO")
                break
            
        await db.commit()

        # データベースに保存
        db_post = Post(
            img_file_name=file_name,
            user_uid=post_data.user_uid,  # post_dataから取得
            gps_lat=post_data.gps_lat,
            gps_lon=post_data.gps_lon,
            haiku=haiku,
            comment=post_data.comment,
            near_spot_id=near_spot_id,
            image_description=haiku_image_description,
            level = achievement_level  # 俳句作成時のユーザのレベルを記録
        )
        db.add(db_post)
        await db.commit()
        await db.refresh(db_post)
        
        return {"message": "Haiku uploaded successfully", "haiku": haiku, "level":achievement_level}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

#funcs
async def generate_haiku(base64_image: str, comment: str, quality: int):
    try:
        # 画像の内容をGPT-4oVisionに解析させる
        image_analysis_prompt = "この画像について説明してください"

        image_analysis_response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "text",
                            "text": image_analysis_prompt,
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": base64_image,
                                "detail": "low",
                            },
                        },
                    ],
                }
            ],
        )
        
        image_description = image_analysis_response.choices[0].message.content.strip()

        # 俳句生成プロンプトを作成
        haiku_prompt = (
            f"以下の情報を元に，俳句を読んでください．\n"
            f"以下の四つの条件を必ず守ってください．\n"
            f"一つ目は，俳句のみを出力すること．\n"
            f"二つ目は，改行をしないこと．\n"
            f"三つ目は，上五，中七，下五をカンマ','区切りで出力すること．\n"
            f"四つ目は，与えられた写真に関する記述、および写真を投稿した人の感想を元に俳句を詠むこと。\n"
        )

        # haiku.qualityに応じてプロンプトを変更
        if quality == 1:
            haiku_prompt += (
               "あなたは小学生です。簡単な言葉を使って俳句を作ってください。\n"
               "感情はシンプルで素直なものにしてください。\n"
            )
        elif quality == 2:
            haiku_prompt += (
                "あなたは成人です。自然や季節を表現し、感情を込めた俳句を作ってください。\n"
                "難しすぎないが、美しい言葉を使ってください。\n"
            )
        elif quality == 3:
            haiku_prompt += (
                "あなたはプロの詩人です。芸術的で奥深い俳句を作ってください。\n"
                "言葉の選び方にこだわり、哲学的または象徴的な表現を含めてください。\n"
            )
        else:
            haiku_prompt += "通常のレベルで俳句を作成してください。\n"

        # 感想をプロンプトに追加
        if comment:
            haiku_prompt += f"写真を投稿した人の感想： {comment}\n"

        # 画像の記述をプロンプトに追加
        if image_description:
            haiku_prompt += f"写真の記述： {image_description}\n"

        # 俳句生成
        haiku_response = client.chat.completions.create(
            model="gpt-4o-2024-11-20",
            messages=[
                {"role": "user", "content": haiku_prompt}
            ]
        )

        haiku_text = haiku_response.choices[0].message.content.strip()

        # 結果を返す
        return {
            "text": haiku_text,
            "image_description": image_description
        }

    except Exception as e:
        # エラーハンドリング
        raise Exception(f"Error generating haiku: {str(e)}")
    
@router.get("/haiku-posts")
async def read_haiku_post(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Post))
    db_posts = result.scalars().all()
    # 必要なフィールドだけを抽出
    posts = [{"img_file_name": post.img_file_name, "haiku": post.haiku} for post in db_posts]
    return posts

# db models
from db import Base
from sqlalchemy import Column, Integer, String

class Post(Base):
    __tablename__ = "posts"
    id = Column(Integer, primary_key=True, index=True)
    img_file_name = Column(String(255), index=True)
    gps_lat = Column(DECIMAL(9, 6), index=True)  # 精度を指定
    gps_lon = Column(DECIMAL(9, 6), index=True)  # 精度を指定
    comment = Column(Text)
    image_description = Column(Text)
    haiku = Column(String(225))
    level = Column(Integer)
    user_uid = Column(String(255), index=True)
    near_spot_id = Column(Integer)
    created_at = Column(DateTime, server_default=func.now())