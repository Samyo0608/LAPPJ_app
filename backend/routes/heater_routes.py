from flask import Blueprint, request, jsonify
from services.heater_services import ModbusService
from models.heater_model import ModbusData

modbus_service = ModbusService()
heater_bp = Blueprint("heater", __name__)

@heater_bp.route("/connect", methods=["POST"])
def connect():
    """ 連線到 Modbus 設備 """
    try:
        data = request.json
        if not data or "port" not in data or "address" not in data:
            return jsonify({"message": "缺少 port 或 address"}), 400
            
        success = modbus_service.connect(data["port"], data["address"])
        if not success:
            return jsonify({
                "status": "failed",
                "message": "Modbus 連接失敗"
            }), 500
            
        # 測試讀取
        test_value = modbus_service.read_modbus_data()
        
        return jsonify({
            "status": "connected",
            "data": {
                "port": data["port"],
                "address": data["address"],
                "test_read": test_value
            }
        })
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": str(e)
        }), 500

@heater_bp.route("/disconnect", methods=["POST"])
def disconnect():
    """ 斷開 Modbus 連線 """
    modbus_service.disconnect()
    return jsonify({"status": "disconnected"})

@heater_bp.route("/status", methods=["GET"])
def get_modbus_data():
    """ 讀取所有 Modbus 數據 """
    try:
        # 檢查是否已連接
        if not modbus_service.client or not modbus_service.client.is_socket_open():
            return jsonify({
                "status": "error",
                "message": "Modbus 未連接，請先建立連接"
            }), 400
            
        # 讀取所有數據
        data = modbus_service.read_modbus_data()

        if data is None:
            return jsonify({
                "status": "error",
                "message": "讀取數據失敗"
            }), 500
            

        return jsonify({
            "status": "success",
            "data": data
        })
    
        
    except Exception as e:
        return jsonify({
            "status": "error",
            "message": f"讀取異常: {str(e)}"
        }), 500

@heater_bp.route("/update", methods=["POST"])
def update_modbus_data():
    """ 更新 Modbus 設備參數 """
    data = request.json
    try:
        modbus_data = ModbusData(**data)  # 確保數據符合 `ModbusData`
    except TypeError as e:
        return jsonify({"error": "數據格式錯誤", "details": str(e)}), 400

    success = modbus_service.update_modbus_data(modbus_data)
    return jsonify({"status": "updated" if success else "failed"})
