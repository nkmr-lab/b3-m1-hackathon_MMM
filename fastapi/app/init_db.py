import time
from sqlalchemy import create_engine, text
from sqlalchemy.exc import OperationalError
from sqlalchemy.orm import sessionmaker, Session
from db import Base  # ORM定義
from routers.mar import Base as MarBase
from routers.kaiji import Base as KaijiBase
from routers.micchi import Base as MicchiBase
from routers.micchi import Spot
import json, os
from dotenv import load_dotenv
load_dotenv()

from log_conf import logger

# DB接続情報
MYSQL_USER = os.getenv("MYSQL_USER")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD")
MYSQL_HOST = os.getenv("MYSQL_HOST")
MYSQL_DATABASE = os.getenv("MYSQL_DATABASE")


PROD_DB_URL = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}/{MYSQL_DATABASE}?charset=utf8"
DEV_DB_URL = "mysql+pymysql://root@db:3306/mmm_db?charset=utf8"

DB_URL = PROD_DB_URL if os.getenv("ENV") == "production" else DEV_DB_URL

logger.info(f"DB_URL: {DB_URL}")
logger.info(f"ENV: {os.getenv('ENV')}")

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

def add_records_from_sql(filename, session: Session):
    with open(filename, "r", encoding="utf-8") as file:
        sql_statements = file.read().split(";")  # SQLを `;` で分割
    try:
        for sql in sql_statements:
            if sql.strip():  # 空のSQLを無視
                session.execute(text(sql))
        session.commit()
        print("✅ SQL data inserted successfully.")
    except Exception as e:
        session.rollback()
        print(f"❌ Failed to insert SQL data: {e}")

def add_records_from_json(filename: str, session: Session):
    """JSONファイルからデータを読み込んでデータベースに挿入"""
    with open(filename, "r", encoding="utf-8") as file:
        data = json.load(file)
    try:
        # spots テーブルにデータを挿入
        if "spots" in data:
            for spot in data["spots"]:
                session.add(Spot(**spot))
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
            add_records_from_sql("guest_user_spots.sql", session) # guestアカウント用のアチーブメントの初期化
    else:
        print("❌ Failed to initialize the database due to connection issues.")

if __name__ == "__main__":
    initialize_database()