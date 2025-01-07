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

# db models
from db import Base
from sqlalchemy import Column, Integer, String

class Micchi(Base):
    __tablename__ = "micchi"
    id = Column(Integer, primary_key=True, index=True)
    micchi = Column(String(255), index=True)