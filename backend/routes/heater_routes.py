from flask import Blueprint, request, jsonify
import asyncio
from services.heater_services import ModbusService
from models.heater_model import ModbusData
from services.connect_log_services import ConnectionLogService
from flask_jwt_extended import get_jwt_identity

modbus_service = ModbusService()
heater_bp = Blueprint("heater", __name__)

@heater_bp.route("/connect", methods=["POST"])
def connect():
    """ 連線到 Modbus 設備 """
    try:
        data = request.json
        if not data or "port" not in data or "address" not in data:
            return jsonify({"status": "failure", "message": "缺少 port 或 address"}), 400
        
        # current_user_id = get_jwt_identity()
        
        # 進行設備連線
        result, status_code = modbus_service.connect(data["port"], data["address"])
        
        # 記錄連線日誌
        # ConnectionLogService.create_log(
        #     device_id='heater',
        #     device_name='加熱器',
        #     port=data["port"],
        #     address=data["address"],
        #     status='success' if status_code == 200 else 'failure',
        #     created_by=current_user_id
        # )
        
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({
            "status": "failure",
            "message": f"連接請求處理失敗: {str(e)}"
        }), 500

@heater_bp.route("/disconnect", methods=["POST"])
def disconnect():
    """ 斷開 Modbus 連線 """
    modbus_service.disconnect()
    return jsonify({"status": "success"})

@heater_bp.route("/status", methods=["GET"])
def get_modbus_data():
    """ 讀取所有 Modbus 數據 """
    try:
        if not modbus_service.client:
            return jsonify({
                "status": "failure",
                "message": "Modbus 未連接，請先建立連接"
            }), 400
            
        data = modbus_service.read_modbus_data()
        if data is None:
            return jsonify({
                "status": "failure",
                "message": "讀取數據失敗"
            }), 500
            
        return jsonify({
            "status": "success",
            "data": data["data"]
        })
        
    except Exception as e:
        return jsonify({
            "status": "failure",
            "message": f"讀取異常: {str(e)}"
        }), 500

@heater_bp.route("/update", methods=["POST"])
def update_modbus_data():
    """ 更新 Modbus 設備參數 """
    try:
        data = request.json
        # 只傳入存在的參數
        modbus_data = ModbusData(**{k: v for k, v in data.items() if k in ModbusData.__annotations__})
        result = modbus_service.update_modbus_data(modbus_data)
        return jsonify(result)
    except TypeError as e:
        return jsonify({
            "status": "failure",
            "message": "數據格式錯誤",
            "details": str(e)
        }), 400