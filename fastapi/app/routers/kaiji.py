from fastapi import APIRouter, Depends, HTTPException
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import select
from db import get_db
from pydantic import BaseModel, Field
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
    level = Column(Integer, index=True)
    user_id = Column(String(255), index=True)


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

# post?get?
@router.post("/openai")
async def get_openai(
    haiku: HaikuCreate,
):
    try:
        # image_bytes = await haiku.image.read()

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
            f"以下の情報を元に，俳句を読んでください．以下の三つの条件を必ず守ってください．一つ目は，俳句のみを出力すること．二つ目は，改行をしないこと．三つ目は，上五，中七，下五をカンマ区切りで出力する．\n"
            f"あなたの俳句を書く能力はレベルを3をMaxとしたときの{haiku.quality}です" # GPTのレベル設定
            f"画像の内容： {image_description}\n"
        )

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
    
    
@router.post("/level")
async def upload_level(post_data: HaikuCreate, db: AsyncSession = Depends(get_db)):
    try:
        # データベースに保存
        db_post = Kaiji(
            level = post_data.quality,
            user_id = "user_id"
        )
        db.add(db_post)
        await db.commit()
        await db.refresh(db_post)

        return{"message": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



#   completion = client.chat.completions.create(
  #      model="gpt-4o-2024-11-20",
   #     messages=[
    #        {"role": "user", "content": "東京都中野区の住民に，ほとんど知られていない置物やスポットを一つ教えてください．ほとんど知られていないことが重要です．そのスポットの名前だけで大丈夫です．"}
     #   ]
    #)

    #return {"message": completion.choices[0].message.content}
