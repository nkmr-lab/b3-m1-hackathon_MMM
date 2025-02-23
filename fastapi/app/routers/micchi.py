from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import Boolean, Integer, ForeignKey, Column, DateTime, DECIMAL
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import relationship
from sqlalchemy.sql import select
from sqlalchemy.exc import IntegrityError
from db import get_db
from pydantic import BaseModel
import math
from decimal import Decimal

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client=OpenAI()

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
    user_spots = relationship("UserSpot", back_populates="spot") # UserSpotのspot属性に対応．tablenameではない！！

class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    uid = Column(String(255), unique=True, index=True)
    name = Column(String(255), index=True)
    email = Column(String(255), unique=True, index=True)
    user_spots = relationship("UserSpot", back_populates="user") # tablenameではない！！
    
class UserSpot(Base):
    __tablename__ = "user_spots"
    id = Column(Integer, primary_key=True, index=True)
    user_uid = Column(String(255), ForeignKey('users.uid'), index=True) # Foreignキーのusersはtablename．
    spot_id = Column(Integer, ForeignKey('spots.id'), index=True)
    is_achieved = Column(Boolean, index=True)
    user=relationship("User", back_populates="user_spots")
    spot=relationship("Spot", back_populates="user_spots")

# api schema
class CreateUser(BaseModel):
    uid: str
    name: str
    email: str

class CreateUserSpot(BaseModel):
    uid: str
    spot_id: int # is_achievedをTrueにするターゲット．

# routers
router = APIRouter()

@router.get("/spots")
async def read_spots(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Spot))
    db_spots = result.scalars().all()
    return db_spots

@router.get("/spots-with-achievement")
async def read_spots_with_achievement(user_uid: str, db: AsyncSession = Depends(get_db)):
    """特定のユーザのuser_spotのis_achievedをspotsと紐付けて取得"""
    result = await db.execute(select(Spot))
    db_spots = result.scalars().all()
    spots = []
    for spot in db_spots:
        user_spot = await db.execute(select(UserSpot).filter_by(user_uid=user_uid, spot_id=spot.id))
        user_spot = user_spot.scalars().first()
        spots.append({
            "name": spot.name,
            "lat": spot.lat,
            "lon": spot.lon,
            "is_achieved": user_spot.is_achieved if user_spot else None
        })
    return spots

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

@router.post("/create-user")
async def create_user(request: CreateUser, db: AsyncSession = Depends(get_db)):
    """新規ユーザのサインアップ時に初期データを挿入"""
    try:
        # userの追加
        user = User(uid=request.uid, level=1, name=request.name, email=request.email)
        db.add(user)
        await db.flush()

        # user_spotの追加
        spots = await db.execute(select(Spot))
        spots = spots.scalars().all()

        user_spots = []
        for spot in spots:
            user_spot = UserSpot(user_uid=user.uid, spot_id=spot.id, is_achieved=False)
            user_spots.append(user_spot)
        db.add_all(user_spots)

        await db.commit()
        return {"message": "New user added successfully"}
    except IntegrityError:
        await db.rollback()
        raise HTTPException(status_code=400, detail="User ID already exists")
    
@router.post("/achieve-user-spot")
async def achieve_user_spot(request: CreateUserSpot, db: AsyncSession = Depends(get_db)):
    """ユーザがスポットを訪れた際にデータを更新"""
    user_spot = await db.execute(select(UserSpot).filter_by(user_uid=request.uid, spot_id=request.spot_id))
    user_spot = user_spot.scalars().first() # filter条件的に明らかに1個以下だが，executeは結果をリスト形式で返すのでfirst()を使う
    if user_spot:
        if user_spot.is_achieved:
            raise HTTPException(status_code=409, detail="User spot is already achieved")
        user_spot.is_achieved = True
        await db.commit()
        return {"message": "User spot updated successfully"}
    else:
        raise HTTPException(status_code=400, detail="User spot not found")