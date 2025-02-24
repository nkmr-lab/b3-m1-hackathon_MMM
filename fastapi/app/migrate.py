# """deprecated"""
# import time
# from sqlalchemy import create_engine, text, MetaData
# from sqlalchemy.exc import OperationalError
# # from routers.test import Base
# from db import Base
# from routers.mar import Base as MarBase
# from routers.kaiji import Base as KaijiBase
# from routers.micchi import Base as MicchiBase

# DB_URL = "mysql+pymysql://root@db:3306/mmm_db?charset=utf8"
# engine = create_engine(DB_URL, echo=True)

# # 各Baseのメタデータを統合
# combined_metadata = MetaData()
# for base in [MarBase, MicchiBase, KaijiBase]:
#     try:
#         base.metadata.reflect(bind=engine)  # 既存のテーブル構造を読み込む
#         for table_name, table in base.metadata.tables.items():
#             if table_name not in combined_metadata.tables:
#                 table.tometadata(combined_metadata)
#     except OperationalError as e:
#         print(f"Failed to reflect metadata for {base}: {e}")

# def wait_for_db_connection(max_retries=5, wait_interval=5):
#     retries = 0
#     while retries < max_retries:
#         try:
#             with engine.connect() as conn:
#                 conn.execute(text("SELECT 1"))
#             print("Database connection successful")
#             return True
#         except OperationalError:
#             retries += 1
#             print(f"Database connection failed. Retrying in {wait_interval} seconds...")
#             time.sleep(wait_interval)
#     print("Could not connect to the database. Exiting.")
#     return False

# def apply_sql_from_file(file_path):
#     """ファイルからSQLを読み込み、データベースに適用"""
#     with open(file_path, "r", encoding="utf-8") as f:
#         sql = f.read()
    
#     try:
#         with engine.connect() as conn:
#             conn.execute(text(sql))
#         print(f"Successfully applied SQL from {file_path}")
#     except OperationalError as e:
#         print(f"Failed to apply SQL from {file_path}: {e}")

# def reset_and_apply_sql():
#     """データベースをリセットし、SQLファイルの適用"""
#     if wait_for_db_connection():
#         apply_sql_from_file("schema.sql")
#     else:
#         print("Could not connect to the database. Exiting.")

# if __name__ == "__main__":
#     reset_and_apply_sql()