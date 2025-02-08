from flask import Blueprint, request, jsonify
from services.heater_services import ModbusService
from models.heater_model import ModbusData

heater_bp = Blueprint("heater", __name__)
modbus_service = ModbusService()

@heater_bp.route("/connect", methods=["POST"])
def connect():
    """ 連線到 Modbus 設備 """
    data = request.json
    if not data or "port" not in data or "address" not in data:
        return jsonify({"message": "缺少 port 或 address"}), 400

    success = modbus_service.connect(data["port"], data["address"])
    return jsonify({"status": "connected" if success else "failed"})

@heater_bp.route("/disconnect", methods=["POST"])
def disconnect():
    """ 斷開 Modbus 連線 """
    modbus_service.disconnect()
    return jsonify({"status": "disconnected"})

@heater_bp.route("/status", methods=["GET"])
def get_modbus_data():
    """ 讀取 Modbus 設備參數，回傳 `ModbusData` """
    data = modbus_service.read_modbus_data()
    return jsonify(data.__dict__)  # 轉換成 JSON

@heater_bp.route("/update_datas", methods=["POST"])
def update_modbus_data():
    """ 更新 Modbus 設備參數 """
    data = request.json
    try:
        modbus_data = ModbusData(**data)  # 確保數據符合 `ModbusData`
    except TypeError as e:
        return jsonify({"message": "數據格式錯誤", "details": str(e)}), 400

    success = modbus_service.update_modbus_data(modbus_data)
    return jsonify({"status": "updated" if success else "failed"})
