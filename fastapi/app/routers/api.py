from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.sql import select
from db import get_db
from pydantic import BaseModel

# api schema
class TestProductCreate(BaseModel):
    name: str
    description: str
    price: int
    category: str

class UserCreate(BaseModel):
    uid: str
    name: str
    email: str


# routers
router = APIRouter()

## products (test)
@router.get("/test-products")
async def read_products(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(TestProduct))
    db_products = result.scalars().all()
    return db_products

@router.post("/test-product")
async def create_product(product: TestProductCreate, db: AsyncSession = Depends(get_db)):
    db_product = TestProduct(
        name=product.name,
        description=product.description,
        price=product.price,
        category=product.category
    )
    db.add(db_product)
    await db.commit()
    await db.refresh(db_product)
    return db_product

## users
@router.get("/users")
async def read_user(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User))
    db_users = result.scalars().all()
    return db_users

@router.post("/user")
async def find_or_create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    # uidでユーザーを探す
    result = await db.execute(select(User).where(User.uid == user.uid))
    db_user = result.scalars().first()

    if db_user:
        # すでに存在する場合、そのユーザー情報を返し、200 OKを返す
        return {"message": "User already exists", "user": db_user}

    # ユーザーが存在しない場合、新しく作成
    new_user = User(
        uid=user.uid,
        name=user.name,
        email=user.email
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # 新しいユーザーが作成されたので、201 Createdを返す
    return {"message": "New user created", "user": new_user}, 201

# db models
from db import Base
from sqlalchemy import Column, Integer, String

class TestProduct(Base):
    __tablename__ = "test_products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), index=True)
    description = Column(String(255), index=True)
    price = Column(Integer, index=True)
    category = Column(String(255), index=True)

class User(Base):
    __tablename__ = "users"
    uid = Column(String(255), primary_key=True, index=True)
    name = Column(String(255), index=True)
    email = Column(String(255), unique=True, index=True)