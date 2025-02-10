from flask import Blueprint, request, jsonify
import asyncio
from services.heater_services import ModbusService
from models.heater_model import ModbusData

modbus_service = ModbusService()
heater_bp = Blueprint("heater", __name__)

@heater_bp.route("/connect", methods=["POST"])
async def connect():
    """ 連線到 Modbus 設備 """
    try:
        data = request.json
        if not data or "port" not in data or "address" not in data:
            return jsonify({"status": "failure", "message": "缺少 port 或 address"}), 400
            
        result, status_code = await modbus_service.connect(data["port"], data["address"])
        return jsonify(result), status_code
        
    except Exception as e:
        return jsonify({
            "status": "failure",
            "message": f"連接請求處理失敗: {str(e)}"
        }), 500

@heater_bp.route("/disconnect", methods=["POST"])
async def disconnect():
    """ 斷開 Modbus 連線 """
    await modbus_service.disconnect()
    return jsonify({"status": "disconnected"})

@heater_bp.route("/status", methods=["GET"])
async def get_modbus_data():
    """ 讀取所有 Modbus 數據 """
    try:
        if not modbus_service.client:
            return jsonify({
                "status": "failure",
                "message": "Modbus 未連接，請先建立連接"
            }), 400
            
        data = await modbus_service.read_modbus_data()
        if data is None:
            return jsonify({
                "status": "failure",
                "message": "讀取數據失敗"
            }), 500
            
        return jsonify({
            "status": "success",
            "data": data
        })
        
    except Exception as e:
        return jsonify({
            "status": "failure",
            "message": f"讀取異常: {str(e)}"
        }), 500

@heater_bp.route("/update", methods=["POST"])
async def update_modbus_data():
    """ 更新 Modbus 設備參數 """
    try:
        data = request.json
        modbus_data = ModbusData(**data)
        result = await modbus_service.update_modbus_data(modbus_data)
        return jsonify(result)
    except TypeError as e:
        return jsonify({
            "status": "failure",
            "message": "數據格式錯誤",
            "details": str(e)
        }), 400