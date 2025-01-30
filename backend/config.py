import os
from dotenv import load_dotenv
from datetime import timedelta

# 確保 .env 檔案變數被讀取
load_dotenv()
# 取得專案根目錄的絕對路徑
basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "default_secret")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default_jwt_secret")
    
    # 直接指定資料庫路徑
    SQLALCHEMY_DATABASE_URI = os.getenv(
        "DATABASE_URI", 
        f"sqlite:///{os.path.join(basedir, 'database.db')}"
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
