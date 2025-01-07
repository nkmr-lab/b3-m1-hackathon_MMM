from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import select
from db import get_db
from pydantic import BaseModel

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client=OpenAI()

# routers
router = APIRouter()

@router.get("/kaiji")
async def test():
    return "kaiji"

@router.get("/openai")
async def get_openai():
    try:
        # 1回目のプロンプト
        first_prompt = (
            "東京都中野区の住民に，ほとんど知られていないスポットを一つ教えてください．"
            "ほとんど知られていないことが重要です．そのスポットの名前のみを返してください．"
        )

        first_completion = client.chat.completions.create(
            model="gpt-4o-2024-11-20",
            messages=[
                {"role": "user", "content": first_prompt}
            ]
        )

        # 1回目のレスポンス内容を取得
        first_response = first_completion.choices[0].message.content.strip()

        # 2回目のプロンプトを作成
        second_prompt = (
            f"先ほど挙げたスポット『{first_response}』について、"
            "そのスポットに関連するキーワードを一つ教えてください．抽象的でない，よりそのスポットを表したキーワードでお願いします．その地区の名前などはやめてください．キーワードのみを返してください．"
        )

        second_completion = client.chat.completions.create(
            model="gpt-4o-2024-11-20",
            messages=[
                {"role": "user", "content": second_prompt}
            ]
        )

        # 2回目のレスポンス内容を取得
        second_response = second_completion.choices[0].message.content.strip()

        # 結果を返す
        return {
            "spot": first_response,
            "word": second_response
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