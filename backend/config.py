import os
import sys
from dotenv import load_dotenv
from datetime import timedelta

# 確保 .env 檔案變數被讀取
load_dotenv()

# 檢測是否是 PyInstaller 打包的應用
if getattr(sys, 'frozen', False):
    basedir = sys._MEIPASS  # PyInstaller 運行時的臨時目錄
else:
    basedir = os.path.abspath(os.path.dirname(__file__))

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "default_secret")
    JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "default_jwt_secret")

    # 直接指定資料庫路徑 (適用於開發與打包後的應用)
    SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(basedir, 'database.db')}"
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=12)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
