from fastapi import APIRouter, File, uploadFile, Form, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import select
from db import get_db
from pydantic import BaseModel

from PIL import Image
import io

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client=OpenAI()

# db models
from db import Base
from sqlalchemy import Column, Integer, String

class Kaiji(Base):
    __tablename__ = "kaiji"
    id = Column(Integer, primary_key=True, index=True)
    kaiji = Column(String(255), index=True)

# routers
router = APIRouter()

@router.get("/kaiji")
async def test():
    return "kaiji"

# post?get?
@router.post("/openai")
async def get_openai(
    image: UploadFile = File(...),
    text: Optional[str] = Form(None),
    quality: int = Form(3) # GPTのレベル
):
    try:
        # 画像をPILで読み込む
        image_bytes = await image.read()
        pil_image = Image.open(io.BytesIO(image_bytes))

        # 画像の内容をGPT-4oVisionに解析させる
        image_analysis_prompt = "この画像について説明してください"

        image_analysis_response = client.chat.completions.create(
            model = "gpt-4o-2024-11-20",
            messages = [
                {"role": "user", "content": image_analysis_prompt, "image": image_bytes}
            ]
        )
        
        image_description = image_analysis_response.choices[0].message.content.strip()

        # 俳句生成プロンプトを作成
        haiku_prompt = (
            f"以下の情報を元に，俳句を読んでください\n"
            f"あなたの俳句を書く能力はレベルを100をMaxとしたときの{quality}です" # GPTのレベル設定
            f"画像の内容： {image_description}\n"
        )

        if text:
            haiku_prompt += f"その場所での感想： {text}\n"

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
            "haiku": haiku
        }

    except Exception as e:
        # エラーハンドリング
        return {"error": str(e)}


#   completion = client.chat.completions.create(
  #      model="gpt-4o-2024-11-20",
   #     messages=[
    #        {"role": "user", "content": "東京都中野区の住民に，ほとんど知られていない置物やスポットを一つ教えてください．ほとんど知られていないことが重要です．そのスポットの名前だけで大丈夫です．"}
     #   ]
    #)

    #return {"message": completion.choices[0].message.content}
