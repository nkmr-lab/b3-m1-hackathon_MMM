from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import select
from db import get_db
from pydantic import BaseModel, Field
import io, os
from log_conf import logger

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client=OpenAI()

# db models
from db import Base
from sqlalchemy import Column, Integer, String

from routers.micchi import User

# schemas
class HaikuCreate(BaseModel):
    image: str = Field(default="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUA", title="Image Data", description="Base64 encoded image data with MIME type prefix", pattern=r"^data:image/.+;base64,[a-zA-Z0-9+/=]+$"),
    text: Optional[str] = Field(default=None),
    quality: int = Field(default=2, title="Quality", description="Quality of the haiku generated by GPT-4o. The higher the value, the better the quality.")

# routers
router = APIRouter()

@router.get("/kaiji")
async def test():
    return "kaiji"


@router.post("/openai")
async def get_openai(
    haiku: HaikuCreate,
):
    try:
        # 画像の内容をGPT-4oVisionに解析させる
        image_analysis_prompt = "この画像について説明してください"

        image_analysis_response = client.chat.completions.create(
            model = "gpt-4o-2024-11-20",
            messages = [
                {"role": "user", "content": image_analysis_prompt, "image": haiku.image}
            ]
        )
        
        image_description = image_analysis_response.choices[0].message.content.strip()

        # 俳句生成プロンプトを作成
        haiku_prompt = (
            f"以下の情報を元に，俳句を読んでください．\n"
            f"以下の三つの条件を必ず守ってください．\n"
            f"一つ目は，俳句のみを出力すること．\n"
            f"二つ目は，改行をしないこと．\n"
            f"三つ目は，上五，中七，下五をカンマ','区切りで出力する．\n"
        )

        # haiku.qualityに応じてプロンプトを変更
        if haiku.quality == 1:
            haiku_prompt += (
               "あなたは小学生です。簡単な言葉を使って俳句を作ってください。\n"
               "感情はシンプルで素直なものにしてください。\n"
            )
        elif haiku.quality == 2:
            haiku_prompt += (
                "あなたは成人です。自然や季節を表現し、感情を込めた俳句を作ってください。\n"
                "難しすぎないが、美しい言葉を使ってください。\n"
            )
        elif haiku.quality ==3:
            haiku_prompt += (
                "あなたはプロの詩人です。芸術的で奥深い俳句を作ってください。\n"
                "言葉の選び方にこだわり、哲学的または象徴的な表現を含めてください。\n"
            )
        else:
            haiku_prompt += "通常のレベルで俳句を作成してください。\n"

        # 感想をプロンプトに追加
        if haiku.text:
            haiku_prompt += f"その場所での感想： {haiku.text}\n"

        # 俳句生成
        haiku_response = client.chat.completions.create(
            model = "gpt-4o-2024-11-20",
            messages = [
                {"role": "user", "content": haiku_prompt}
            ]
        )

        haiku = haiku_response.choices[0].message.content.strip()

        # 結果を返す
        return {
            haiku
        }

    except Exception as e:
        # エラーハンドリング
        return {"error": str(e)}

@router.get("/image/{img_file_name}", response_class=FileResponse)
async def get_image(img_file_name: str):
    img_path = os.path.join("images", img_file_name)
    if not os.path.exists(img_path):
        raise HTTPException(status_code=404, detail="Image not found")
    return FileResponse(img_path)