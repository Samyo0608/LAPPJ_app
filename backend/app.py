from flask import Flask, jsonify, send_file, request # type: ignore
from flask_cors import CORS # type: ignore
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from config import Config
from models.connect_log_model import ConnectionLog
from routes.alicat_routes import alicat_bp
from routes.recipe_routes import recipe_bp
from routes.auth_routes import auth_bp
from routes.co2_laser_routes import uc2000_bp
from routes.port_connect_routes import port_scanner_bp
from routes.heater_routes import heater_bp
from routes.ultrasonic_routes import modbus_bp
from routes.azbil_MFC_routes import azbil_MFC_bp
from routes.transmittance_routes import transmittance_bp
from routes.power_supply_routes import power_supply_bp
import pandas as pd
import matplotlib.pyplot as plt
import io
import os
import sys
import signal
from database import db, jwt
import tempfile
import atexit

class UnbufferedStream:
    def __init__(self, stream):
        self.stream = stream

    def write(self, data):
        self.stream.write(data)
        self.stream.flush()

    def __getattr__(self, attr):
        return getattr(self.stream, attr)

sys.stdout = UnbufferedStream(sys.stdout)
sys.stderr = UnbufferedStream(sys.stderr)

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # backend/
DB_PATH = os.path.join(BASE_DIR, "database.db")

temp_dir = tempfile.gettempdir()
pid_file_path = os.path.join(temp_dir, "lappj_flask_pid.txt")

def cleanup_pid_file():
    try:
        if os.path.exists(pid_file_path):
            os.remove(pid_file_path)
            print("✅ 已刪除 PID 文件")
    except Exception as e:
        print(f"❌ 刪除 PID 文件時出錯: {e}")

atexit.register(cleanup_pid_file)

def create_app():
    app = Flask(__name__, instance_path=os.path.dirname(os.path.abspath(__file__)))
    CORS(app, resources={r"/*": {"origins": "*"}})
    app.config.from_object(Config)

    migrate = Migrate(app, db, directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'migrations'))
    
    # SQLite 資料庫設定
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = "supersecretjwt"
    app.config["JWT_VERIFY_SUB"]=False

    # 初始化擴展
    db.init_app(app)
    jwt.init_app(app)

    # 確保資料庫表格存在
    with app.app_context():
        if not os.path.exists(DB_PATH):
            db.create_all()
            print("✅ 資料庫已建立！")
        else:
            print("📂 資料庫已存在，跳過建立步驟")

    # 註冊 Blueprints
    app.register_blueprint(alicat_bp, url_prefix='/api/alicat_api')
    app.register_blueprint(recipe_bp, url_prefix='/api/recipe_api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(uc2000_bp, url_prefix='/api/uc2000')
    app.register_blueprint(port_scanner_bp, url_prefix='/api/port_scanner')
    app.register_blueprint(heater_bp, url_prefix='/api/heater')
    app.register_blueprint(modbus_bp, url_prefix='/api/ultrasonic')
    app.register_blueprint(azbil_MFC_bp, url_prefix='/api/azbil_api')
    app.register_blueprint(transmittance_bp, url_prefix='/api/transmittance_api')
    app.register_blueprint(power_supply_bp, url_prefix='/api/power_supply')

    return app

# 創建應用程式實例
app = create_app()

@app.route("/shutdown", methods=["POST"])
def shutdown():
    print("🚀 收到關閉請求，Flask 伺服器即將關閉...")
    cleanup_pid_file()  # 先清理 PID 文件
    os._exit(0)  # 強制終止
    return jsonify({"message": "伺服器正在關閉..."})

@app.route("/")
def home():
    return "Flask Server Running"

@app.route('/health')
def health_check():
    return jsonify({"status": "ok"}), 200

def handle_shutdown(signal, frame):
    print("🚀 Flask 伺服器正在關閉...")
    cleanup_pid_file()
    sys.exit(0)

@app.errorhandler(404)
def not_found(error):
    """處理 404 錯誤"""
    return jsonify({"error": "API 找不到"}), 404

@app.errorhandler(500)
def internal_server_error(error):
    """處理 500 內部伺服器錯誤"""
    return jsonify({"error": "伺服器錯誤"}), 500

# 使用所有可能的信號
signal.signal(signal.SIGTERM, handle_shutdown)
signal.signal(signal.SIGINT, handle_shutdown)
# Windows特有的信號
if hasattr(signal, 'SIGBREAK'):
    signal.signal(signal.SIGBREAK, handle_shutdown)
# 確保在主程序中添加這部分
if hasattr(signal, 'SIGABRT'):
    signal.signal(signal.SIGABRT, handle_shutdown)

if __name__ == '__main__':
    app.run(debug=True, port=5555)

# 啟動方式: source venv/Scripts/activate -> python backend/app.py

# build 方式:
# pyinstaller --onefile --noconsole   --add-data "routes:routes" --add-data "models:models" --add-data "services:services" --add-data "migrations:migrations"  --add-data "database.db:."   --add-data "config.py:."   --add-data "transmittance_to_figure.py:." --add-data "recipes.xlsx:."   --add-data "txt_to_transmittance_data.py:."   app.py