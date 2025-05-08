from flask import Flask, jsonify, send_file, request
from flask_cors import CORS
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
from routes.robot_arm_routes import robot_bp
import pandas as pd
import matplotlib.pyplot as plt
import io
import os
import sys
import signal
import json
import tempfile
import atexit
from flask_socketio import SocketIO
import threading
import logging
import traceback
import ipaddress
from database import db, jwt

# 配置日誌
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('app.log', encoding='utf-8')
    ]
)
logger = logging.getLogger(__name__)

class UnbufferedStream:
    def __init__(self, stream, encoding="utf-8"):
        self.stream = io.TextIOWrapper(stream.buffer, encoding=encoding, errors="replace", newline="\n")

    def write(self, data):
        self.stream.write(data)
        self.stream.flush()

    def __getattr__(self, attr):
        return getattr(self.stream, attr)

sys.stdout = UnbufferedStream(sys.stdout)
sys.stderr = UnbufferedStream(sys.stderr)

# 配置文件路徑
CONFIG_FILE = "host_config.json"

# 默認配置
DEFAULT_CONFIG = {
    "host": "127.0.0.1",    # 默認為本地連接
    "port": 5555,           # 默認端口
    "allow_remote": False,  # 是否允許遠程連接
    "allowed_ips": [],      # 額外允許的 IP 地址列表
    "allowed_prefixes": ["140.114"]  # 允許的 IP 前綴
}

def is_valid_ip(ip):
    """檢查是否為有效的 IP 地址"""
    try:
        ipaddress.ip_address(ip)
        return True
    except ValueError:
        return False

def load_config():
    """載入主機配置"""
    if os.path.exists(CONFIG_FILE):
        try:
            with open(CONFIG_FILE, 'r') as f:
                config = json.load(f)
                # 確保所有新增的配置欄位都存在
                for key, value in DEFAULT_CONFIG.items():
                    if key not in config:
                        config[key] = value
                return config
        except Exception as e:
            logger.error(f"載入配置失敗，使用默認配置: {e}")
    
    # 如果載入失敗或文件不存在，使用默認配置並保存
    save_config(DEFAULT_CONFIG)
    return DEFAULT_CONFIG.copy()

def save_config(config):
    """保存主機配置"""
    try:
        with open(CONFIG_FILE, 'w') as f:
            json.dump(config, f, indent=2)
        return True
    except Exception as e:
        logger.error(f"保存配置失敗: {e}")
        return False

# 載入當前配置
current_config = load_config()
HOST = current_config.get("host", "127.0.0.1")
PORT = current_config.get("port", 5555)
ALLOWED_IPS = current_config.get("allowed_ips", [])
ALLOWED_PREFIXES = current_config.get("allowed_prefixes", ["140.114"])

# 路徑設置
BASE_DIR = os.path.dirname(os.path.abspath(__file__))  # backend/
DB_PATH = os.path.join(BASE_DIR, "database.db")
temp_dir = tempfile.gettempdir()
pid_file_path = os.path.join(temp_dir, "lappj_flask_pid.txt")

def cleanup_pid_file():
    """清理 PID 文件"""
    try:
        if os.path.exists(pid_file_path):
            os.remove(pid_file_path)
            logger.info("已刪除 PID 文件")
    except Exception as e:
        logger.error(f"刪除 PID 文件時出錯: {e}")

atexit.register(cleanup_pid_file)

def is_ip_allowed(ip):
    """檢查 IP 是否被允許訪問"""
    # 本地 IP 總是允許
    if ip == "127.0.0.1":
        return True
    
    # 檢查是否在允許的 IP 列表中
    if ip in ALLOWED_IPS:
        return True
    
    # 檢查是否符合允許的 IP 前綴
    for prefix in ALLOWED_PREFIXES:
        if ip.startswith(prefix):
            return True
    
    return False

def create_app():
    """創建 Flask 應用"""
    app = Flask(__name__, instance_path=os.path.dirname(os.path.abspath(__file__)))
    CORS(app, resources={r"/*": {"origins": "*"}})
    
    # 初始化 SocketIO
    socketio = SocketIO(
        app, 
        cors_allowed_origins="*",
        async_mode='threading',
        ping_timeout=60,
        ping_interval=25,
        logger=True,
        engineio_logger=True
    )

    # 全域函數用於發送 Socket 事件
    def emit_device_status(device_type, status, data=None):
        def emit_task():
            try:
                if data:
                    event_data = json.loads(json.dumps(data, default=str))
                else:
                    event_data = {}
                
                socketio.emit('device_status_update', {
                    'device_type': device_type,
                    'status': status,
                    'data': event_data
                })
                logger.info(f"Socket 事件已發送: {device_type} - {status}")
            except Exception as e:
                error_trace = traceback.format_exc()
                logger.error(f"Socket 事件發送失敗: {e}\n{error_trace}")
        
        threading.Thread(target=emit_task, daemon=True).start()

    app.emit_device_status = emit_device_status
    app.socketio = socketio
    
    # 應用設定
    app.config.from_object(Config)
    
    # SQLite 資料庫設定
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = "supersecretjwt"
    app.config["JWT_VERIFY_SUB"] = False
    
    # 初始化擴展
    migrate = Migrate(app, db, directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), 'migrations'))
    db.init_app(app)
    jwt.init_app(app)
    
    # 確保資料庫表格存在
    with app.app_context():
        if not os.path.exists(DB_PATH):
            db.create_all()
            logger.info("資料庫已建立！")
        else:
            logger.info("資料庫已存在，跳過建立步驟")
    
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
    app.register_blueprint(robot_bp, url_prefix='/api/robot_api')
    
    # =================================================================
    # 主機切換和 IP 白名單相關路由
    # =================================================================
    
    @app.route('/api/host/status', methods=['GET'])
    def get_host_status():
        """獲取當前主機設定狀態"""
        global HOST, PORT, ALLOWED_IPS, ALLOWED_PREFIXES
        current_config = load_config()
        
        # 更新全局變數，以防配置文件被手動修改
        HOST = current_config.get("host", "0.0.0.0")
        PORT = current_config.get("port", 5555)
        ALLOWED_IPS = current_config.get("allowed_ips", [])
        ALLOWED_PREFIXES = current_config.get("allowed_prefixes", ["140.114"])
        
        return jsonify({
            "status": "success",
            "data": {
                "host": HOST,
                "port": PORT,
                "allow_remote": HOST == "0.0.0.0",
                "allowed_ips": ALLOWED_IPS,
                "allowed_prefixes": ALLOWED_PREFIXES,
                "server_pid": os.getpid()
            }
        })

    @app.route('/api/host/switch', methods=['POST'])
    def switch_host():
        """切換主機設定"""
        global HOST, PORT, ALLOWED_IPS, ALLOWED_PREFIXES
        data = request.get_json()
        allow_remote = data.get('allow_remote')
        
        if allow_remote is not None:
            current_config = load_config()
            current_config["allow_remote"] = bool(allow_remote)
            current_config["host"] = "0.0.0.0" if allow_remote else "127.0.0.1"
            
            if save_config(current_config):
                # 更新全局變數
                HOST = current_config["host"]
                PORT = current_config["port"]
                ALLOWED_IPS = current_config.get("allowed_ips", [])
                ALLOWED_PREFIXES = current_config.get("allowed_prefixes", ["140.114"])
                
                logger.info(f"主機設定已更改為: {HOST} (允許遠端: {allow_remote})")
                return jsonify({
                    "status": "success",
                    "message": f"主機設定已更改為 {'允許遠端' if allow_remote else '僅本地'}",
                    "data": current_config
                })
            else:
                return jsonify({
                    "status": "error",
                    "message": "保存設定失敗"
                }), 500
        else:
            return jsonify({
                "status": "error",
                "message": "請提供 allow_remote 參數"
            }), 400
    
    @app.route('/api/ip/whitelist', methods=['GET'])
    def get_ip_whitelist():
        """獲取 IP 白名單"""
        current_config = load_config()
        return jsonify({
            "status": "success",
            "data": {
                "allowed_ips": current_config.get("allowed_ips", []),
                "allowed_prefixes": current_config.get("allowed_prefixes", ["140.114"])
            }
        })

    @app.route('/api/ip/add', methods=['POST'])
    def add_allowed_ip():
        """添加允許的 IP 地址"""
        global ALLOWED_IPS
        data = request.get_json()
        ip = data.get('ip')
        
        if not ip:
            return jsonify({
                "status": "error",
                "message": "請提供 IP 地址"
            }), 400
        
        # 檢查 IP 格式是否有效
        if not is_valid_ip(ip):
            return jsonify({
                "status": "error",
                "message": "無效的 IP 地址格式"
            }), 400
        
        current_config = load_config()
        allowed_ips = current_config.get("allowed_ips", [])
        
        # 檢查 IP 是否已在列表中
        if ip in allowed_ips:
            return jsonify({
                "status": "warning",
                "message": f"IP {ip} 已在白名單中"
            })
        
        # 添加 IP 到白名單
        allowed_ips.append(ip)
        current_config["allowed_ips"] = allowed_ips
        
        if save_config(current_config):
            # 更新全局變數
            ALLOWED_IPS = allowed_ips
            
            logger.info(f"IP 地址 {ip} 已添加到白名單")
            return jsonify({
                "status": "success",
                "message": f"IP {ip} 已添加到白名單",
                "data": {"allowed_ips": allowed_ips}
            })
        else:
            return jsonify({
                "status": "error",
                "message": "保存白名單失敗"
            }), 500

    @app.route('/api/ip/remove', methods=['POST'])
    def remove_allowed_ip():
        """移除允許的 IP 地址"""
        global ALLOWED_IPS
        data = request.get_json()
        ip = data.get('ip')
        
        if not ip:
            return jsonify({
                "status": "error",
                "message": "請提供 IP 地址"
            }), 400
        
        current_config = load_config()
        allowed_ips = current_config.get("allowed_ips", [])
        
        # 檢查 IP 是否在列表中
        if ip not in allowed_ips:
            return jsonify({
                "status": "warning",
                "message": f"IP {ip} 不在白名單中"
            })
        
        # 從白名單移除 IP
        allowed_ips.remove(ip)
        current_config["allowed_ips"] = allowed_ips
        
        if save_config(current_config):
            # 更新全局變數
            ALLOWED_IPS = allowed_ips
            
            logger.info(f"IP 地址 {ip} 已從白名單移除")
            return jsonify({
                "status": "success",
                "message": f"IP {ip} 已從白名單移除",
                "data": {"allowed_ips": allowed_ips}
            })
        else:
            return jsonify({
                "status": "error",
                "message": "保存白名單失敗"
            }), 500

    @app.route('/api/prefix/add', methods=['POST'])
    def add_allowed_prefix():
        """添加允許的 IP 前綴"""
        global ALLOWED_PREFIXES
        data = request.get_json()
        prefix = data.get('prefix')
        
        if not prefix:
            return jsonify({
                "status": "error",
                "message": "請提供 IP 前綴"
            }), 400
        
        current_config = load_config()
        allowed_prefixes = current_config.get("allowed_prefixes", ["140.114"])
        
        # 檢查前綴是否已在列表中
        if prefix in allowed_prefixes:
            return jsonify({
                "status": "warning",
                "message": f"前綴 {prefix} 已在白名單中"
            })
        
        # 添加前綴到白名單
        allowed_prefixes.append(prefix)
        current_config["allowed_prefixes"] = allowed_prefixes
        
        if save_config(current_config):
            # 更新全局變數
            ALLOWED_PREFIXES = allowed_prefixes
            
            logger.info(f"IP 前綴 {prefix} 已添加到白名單")
            return jsonify({
                "status": "success",
                "message": f"前綴 {prefix} 已添加到白名單",
                "data": {"allowed_prefixes": allowed_prefixes}
            })
        else:
            return jsonify({
                "status": "error",
                "message": "保存白名單失敗"
            }), 500

    @app.route('/api/prefix/remove', methods=['POST'])
    def remove_allowed_prefix():
        """移除允許的 IP 前綴"""
        global ALLOWED_PREFIXES
        data = request.get_json()
        prefix = data.get('prefix')
        
        if not prefix:
            return jsonify({
                "status": "error",
                "message": "請提供 IP 前綴"
            }), 400
        
        current_config = load_config()
        allowed_prefixes = current_config.get("allowed_prefixes", ["140.114"])
        
        # 檢查前綴是否在列表中
        if prefix not in allowed_prefixes:
            return jsonify({
                "status": "warning",
                "message": f"前綴 {prefix} 不在白名單中"
            })
        
        # 從白名單移除前綴
        allowed_prefixes.remove(prefix)
        current_config["allowed_prefixes"] = allowed_prefixes
        
        if save_config(current_config):
            # 更新全局變數
            ALLOWED_PREFIXES = allowed_prefixes
            
            logger.info(f"IP 前綴 {prefix} 已從白名單移除")
            return jsonify({
                "status": "success",
                "message": f"前綴 {prefix} 已從白名單移除",
                "data": {"allowed_prefixes": allowed_prefixes}
            })
        else:
            return jsonify({
                "status": "error",
                "message": "保存白名單失敗"
            }), 500
    
    # =================================================================
    # 原始應用程序路由
    # =================================================================
    
    @app.before_request
    def security_middleware():
        """安全中間件，IP 限制等"""
        # 1. 檢查IP地址是否允許訪問
        client_ip = request.remote_addr
        
        # 先檢查是否為 API 路由，如果是切換 API 相關的路由則放行
        if request.path.startswith('/api/host/') or request.path.startswith('/api/ip/') or request.path.startswith('/api/prefix/'):
            # API 路由直接放行，避免切換 host 設定時出現問題
            return None
        
        # 只有在遠程模式下 (0.0.0.0) 才進行 IP 檢查
        if HOST == '0.0.0.0':
            if not is_ip_allowed(client_ip):
                logger.warning(f"拒絕來自非授權IP的請求: {client_ip}")
                return jsonify({"error": "Access denied - Unauthorized IP"}), 403
        # 在本地模式下，只允許本地訪問
        elif HOST == '127.0.0.1' and client_ip != '127.0.0.1':
            logger.warning(f"拒絕來自非本地IP的請求: {client_ip}")
            return jsonify({"error": "Access denied - Local mode enabled"}), 403
        
        # 檢查是否有惡意請求頭或內容
        try:
            request_data = request.get_data().decode('utf-8', errors='ignore')
            headers_str = str(request.headers)
            
            suspicious_patterns = ['CNXN', 'shell:exec', 'pkill', 'toybox', 'busybox wget']
            for pattern in suspicious_patterns:
                if pattern in request_data or pattern in headers_str:
                    logger.warning(f"檢測到惡意請求: {client_ip}, 模式: {pattern}")
                    return jsonify({"error": "Malicious request detected"}), 403
        except Exception as e:
            logger.error(f"檢查請求時出錯: {e}")
            
        # 通過所有安全檢查
        return None

    @app.route("/shutdown", methods=["POST"])
    def shutdown():
        """關閉伺服器"""
        logger.info("收到關閉請求，Flask 伺服器即將關閉...")
        cleanup_pid_file()  # 先清理 PID 文件
        os._exit(0)  # 強制終止
        return jsonify({"message": "伺服器正在關閉..."})

    @app.route("/")
    def home():
        """首頁"""
        return "Flask Server Running"

    @app.route('/health')
    def health_check():
        """健康檢查"""
        return jsonify({"status": "ok"}), 200
    
    @app.route('/api/client_info')
    def client_info():
        """獲取客戶端訪問信息"""
        client_ip = request.remote_addr
        is_allowed = is_ip_allowed(client_ip)
        
        return jsonify({
            "client_ip": client_ip,
            "is_allowed": is_allowed,
            "host_mode": "remote" if HOST == "0.0.0.0" else "local"
        })
    
    # 添加錯誤處理器
    @app.errorhandler(404)
    def not_found(error):
        """處理 404 錯誤"""
        return jsonify({"error": "API 找不到"}), 404

    @app.errorhandler(500)
    def internal_server_error(error):
        """處理 500 內部伺服器錯誤"""
        error_trace = traceback.format_exc()
        logger.error(f"500 伺服器錯誤: {error}\n{error_trace}")
        return jsonify({"error": "伺服器錯誤"}), 500

    # 添加全局錯誤處理
    @app.errorhandler(Exception)
    def handle_exception(e):
        """處理未捕獲的異常"""
        error_trace = traceback.format_exc()
        logger.error(f"未捕獲的異常: {e}\n{error_trace}")
        return jsonify({"error": f"發生錯誤: {str(e)}"}), 500
    
    return app, socketio

# 使用所有可能的信號
def handle_shutdown(signal, frame):
    logger.info("Flask 伺服器正在關閉...")
    cleanup_pid_file()
    sys.exit(0)

signal.signal(signal.SIGTERM, handle_shutdown)
signal.signal(signal.SIGINT, handle_shutdown)
# Windows特有的信號
if hasattr(signal, 'SIGBREAK'):
    signal.signal(signal.SIGBREAK, handle_shutdown)
# 確保在主程序中添加這部分
if hasattr(signal, 'SIGABRT'):
    signal.signal(signal.SIGABRT, handle_shutdown)

if __name__ == '__main__':
    # 創建應用程式實例
    app, socketio = create_app()
    
    # 將 PID 寫入文件
    with open(pid_file_path, "w") as pid_file:
        pid_file.write(str(os.getpid()))
    
    logger.info(f"伺服器已啟動，PID: {os.getpid()} 已寫入 {pid_file_path}")
    logger.info(f"伺服器運行在 {HOST}:{PORT}")
    
    # 如果是0.0.0.0，提示可能的安全風險
    if HOST == "0.0.0.0":
        logger.warning("注意: 伺服器允許遠程連接，請確保您的網絡環境安全")
        logger.info(f"允許的 IP 地址: {ALLOWED_IPS}")
        logger.info(f"允許的 IP 前綴: {ALLOWED_PREFIXES}")
    
    try:
        socketio.run(
            app,
            host=HOST,
            port=PORT,
            debug=True,
            allow_unsafe_werkzeug=True  # 新版 Socket.IO 需要這個參數
        )
    except Exception as e:
        error_trace = traceback.format_exc()
        logger.error(f"伺服器啟動失敗: {e}\n{error_trace}")
        cleanup_pid_file()