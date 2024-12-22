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
    completion = client.chat.completions.create(
        model="gpt-4o-2024-11-20",
        messages=[
            {"role": "user", "content": "Who is Shohei Ohtani?"}
        ]
    )

    return {"message": completion.choices[0].message.content}