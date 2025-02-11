from fastapi import APIRouter, Depends
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

@router.get("/judge-spot")
async def judge_spot(lat: float, lng: float):
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
    
    # どのスポットとも10以上ならFalseを返す
    return "該当なし"
