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

@router.get("/micchi")
async def test():
    return "micchi"