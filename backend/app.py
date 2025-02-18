from flask import Flask, jsonify, send_file, request # type: ignore
from flask_cors import CORS # type: ignore
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import JWTManager
from flask_migrate import Migrate
from config import Config
from models.connect_log_model import ConnectionLog
from txt_to_transmittance_data import txt_to_transmittance
from transmittance_to_figure import plot_data, plot_data_filter
from routes.alicat_routes import alicat_bp
from routes.recipe_routes import recipe_bp
from routes.auth_routes import auth_bp
from routes.co2_laser_routes import uc2000_bp
from routes.port_connect_routes import port_scanner_bp
from routes.heater_routes import heater_bp
from routes.ultrasonic_routes import modbus_bp
from routes.azbil_MFC_routes import azbil_MFC_bp
import pandas as pd
import matplotlib.pyplot as plt
import io
import os
from database import db, jwt

def create_app():
    app = Flask(__name__, instance_path=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))
    CORS(app, resources={r"/*": {"origins": "*"}})
    app.config.from_object(Config)

    migrate = Migrate(app, db, directory=os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'migrations'))
    
    # SQLite 資料庫設定
    app.config["SQLALCHEMY_DATABASE_URI"] = "sqlite:///database.db"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = "supersecretjwt"
    app.config["JWT_VERIFY_SUB"]=False

    # 初始化擴展
    db.init_app(app)
    jwt.init_app(app)

    # 確保資料庫表格存在
    with app.app_context():
        if not os.path.exists("database.db"):
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

    return app

# 創建應用程式實例
app = create_app()

@app.errorhandler(404)
def not_found(error):
    """處理 404 錯誤"""
    return jsonify({"error": "API 找不到"}), 404

@app.errorhandler(500)
def internal_server_error(error):
    """處理 500 內部伺服器錯誤"""
    return jsonify({"error": "伺服器錯誤"}), 500

# 會從前端接收一個物件，裡面包含initial_file_path、group_number、file_number、max_spectrum和min_spectrum
# 這個物件會被傳遞給txt_to_transmittance函數
# 這裡面會是一個object，包含檔案名稱和平均值，要回傳給前端
# 這逼會接收前端的資料，並且將資料傳遞給txt_to_transmittance函數
@app.route('/api/transmittanceData', methods=['POST'])
def get_transmittance():
    data = request.get_json()
    file_path = data['filePath']
    group_number = data['groupNumber']
    file_number = data['fileNumber']
    max_spectrum = data['maxSpectrum']
    min_spectrum = data['minSpectrum']
    averages_list = txt_to_transmittance(file_path, group_number, file_number, max_spectrum, min_spectrum)
    return jsonify(averages_list)

# API 路由，接收前端發送的數據，並繪製圖表
@app.route('/api/transmittancePlot', methods=['POST'])
def plot():
    data = request.get_json()
    
    # 前端傳遞過來的檔案數據和其他參數
    file_data = data.get('fileData', [])  # 檔案數據陣列
    selected_files = data.get('selectedFiles', [])  # 要比對的檔案名稱列表
    x_label = data.get('xLabel', 'File Name')  # X 軸標籤
    y_label = data.get('yLabel', 'Transmittance %')  # Y 軸標籤
    
    print('old selected_files:', selected_files)
    
    # 如果 selected_files 為空，則默認使用所有檔案
    if not selected_files:
        selected_files = [file['fileName'] for file in file_data]
    
    print(f'selected_files: {selected_files}')

    # 繪製圖表
    img = plot_data(file_data, selected_files, x_label, y_label)
    
    # 返回圖片
    return send_file(img, mimetype='image/png')

@app.route('/api/transmittancePlotFilter', methods=['POST'])
def plot_filter():
    # data, plot_flag
    data = request.get_json()
    file_data = data.get('fileData', [])
    plot_flag = data.get('plotFlag', [])
    
    img = plot_data_filter(file_data, plot_flag)
    
    return send_file(img, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True, port=5000)

# 啟動方式: source venv/Scripts/activate -> python backend/app.py