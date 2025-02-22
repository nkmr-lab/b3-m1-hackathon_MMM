import time
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker, Session
import os
from db import Base  # ORM定義
from routers.mar import Base as MarBase
from routers.kaiji import Base as KaijiBase
from routers.micchi import Base as MicchiBase
from routers.micchi import Spots
import json

# DB接続情報
DB_URL = os.getenv("DATABASE_URL", "mysql+pymysql://root@db:3306/mmm_db?charset=utf8")
engine = create_engine(DB_URL, echo=True)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def wait_for_db_connection(max_retries=5, wait_interval=5):
    """データベース接続をリトライしながら待機する"""
    retries = 0
    while retries < max_retries:
        try:
            with engine.connect() as conn:
                conn.execute(text("SELECT 1"))
            print("✅ Database connection successful")
            return True
        except OperationalError:
            retries += 1
            print(f"⚠️ Database connection failed. Retrying in {wait_interval} seconds...")
            time.sleep(wait_interval)
    print("❌ Could not connect to the database. Exiting.")
    return False

def add_records_from_sql(filename):
    with open(filename, "r", encoding="utf-8") as file:
        sql_statements = file.read().split(";")  # SQLを `;` で分割

    with engine.connect() as conn:
        for sql in sql_statements:
            if sql.strip():  # 空のSQLを無視
                conn.execute(text(sql))
        conn.commit()

def add_records_from_json(filename: str, session: Session):
    """JSONファイルからデータを読み込んでデータベースに挿入"""
    with open(filename, "r", encoding="utf-8") as file:
        data = json.load(file)

    try:
        # spots テーブルにデータを挿入
        if "spots" in data:
            for spot in data["spots"]:
                session.add(Spots(**spot))
        session.commit()
        print("✅ Initial data inserted successfully from JSON.")
    except Exception as e:
        session.rollback()
        print(f"❌ Failed to insert initial data: {e}")

def initialize_database():
    """データベースをリセットし、初期データを挿入"""
    if wait_for_db_connection():
        print("🔄 Dropping and recreating tables...")
        Base.metadata.drop_all(bind=engine)  # テーブル削除
        Base.metadata.create_all(bind=engine)  # テーブル作成
        print("✅ Database schema reset.")

        # 初期データを挿入
        print("📥 Inserting initial data from data.json...")
        with SessionLocal() as session:
            add_records_from_json("spots.json", session)
    else:
        print("❌ Failed to initialize the database due to connection issues.")

if __name__ == "__main__":
    initialize_database()