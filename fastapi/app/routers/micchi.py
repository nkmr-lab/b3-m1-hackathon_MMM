from fastapi import APIRouter, Depends
from sqlalchemy import Boolean, Integer, ForeignKey, Column, DateTime, DECIMAL
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import select
from db import get_db
from pydantic import BaseModel
import math
from decimal import Decimal

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
    result = await db.execute(select(Spot))
    db_spots = result.scalars().all()
    return db_spots

@router.get("/judge-spot")
async def judge_spot(lat: Decimal, lng: Decimal, db: AsyncSession = Depends(get_db)):
    # 複数のスポットをリストにして登録
    spot_query = await db.execute(select(Spot))
    db_spots = spot_query.scalars().all()
    spots = [{"name": spot.name, "lat": spot.lat, "lng": spot.lon} for spot in db_spots]

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

class Spot(Base):
    __tablename__ = "spots"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    lat = Column(DECIMAL(9, 6), index=True)
    lon = Column(DECIMAL(9, 6), index=True)
    user_spots = Column("UserSpot", backref="spots")

class User(Base):
    __tablename__ = "user"
    id = Column(Integer, primary_key=True, index=True)
    level = Column(Integer, index=True)
    user_id = Column(String(255), index=True)
    user_spots = Column("UserSpot", backref="user")

class UserSpot(Base):
    __tablename__ = "user_spot"
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    spot_id = Column(Integer, index=True)
    is_achieved = Column(Boolean, index=True)
    user = Column("User", backref="user_spot")
    spot = Column("Spot", backref="user_spot")
