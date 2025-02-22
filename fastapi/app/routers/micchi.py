from fastapi import APIRouter, Depends
from sqlalchemy import DECIMAL
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import select
from db import get_db
from pydantic import BaseModel
import math

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client=OpenAI()

# routers
router = APIRouter()

@router.get("/micchi")
async def test():
    return "micchi"

@router.get("/spots")
async def read_spots(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Spots))
    db_spots = result.scalars().all()
    return db_spots

@router.get("/judge-spot")
async def judge_spot(lat: float, lng: float, db: AsyncSession = Depends(get_db)):
    # 複数のスポットをリストにして登録
    spots = [
        {"name": "明治大学", "lat": 10, "lng": 10},
        {"name": "セントラルパーク", "lat": 20, "lng": 20},
        {"name": "帝京平成大学", "lat": 30, "lng": 30},
    ]
    
    spot_range = 10 
    
    for spot in spots:
        distance = math.sqrt((spot["lat"] - lat) ** 2 + (spot["lng"] - lng) ** 2)
        if distance <= spot_range:
            return spot["name"]
    
    return "該当なし"

# db models
from db import Base
from sqlalchemy import Column, Integer, String

class Micchi(Base):
    __tablename__ = "micchi"
    id = Column(Integer, primary_key=True, index=True)
    micchi = Column(String(255), index=True)

class Spots(Base):
    __tablename__ = "spots"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    lat = Column(DECIMAL(9, 6), index=True)
    lon = Column(DECIMAL(9, 6), index=True)