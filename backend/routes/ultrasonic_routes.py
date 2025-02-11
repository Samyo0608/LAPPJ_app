from flask import Blueprint, request, jsonify
from services.ultrasonic_services import ModbusService

modbus_bp = Blueprint("ultrasonic", __name__)
modbus_service = ModbusService()

@modbus_bp.route("/connect", methods=["POST"])
def connect_modbus():
    """API: 連接霧化器"""
    data = request.get_json()
    port = data.get("port")
    baudrate = data.get("baudrate", 38400)
    device_id = data.get("address", 1)

    if not port:
        return jsonify({"status": "failure", "message": "請提供 port"}), 400

    result = modbus_service.connect(port, baudrate, device_id)
    return jsonify(result)

@modbus_bp.route("/disconnect", methods=["POST"])
def disconnect_modbus():
    """API: 斷開霧化器"""
    result = modbus_service.disconnect()
    return jsonify(result)

@modbus_bp.route("/update", methods=["POST"])
def write_modbus():
    """API: 寫入霧化器設備"""
    data = request.get_json()
    address = data.get("address")
    value = data.get("value")

    if address is None or value is None:
        return jsonify({"status": "failure", "message": "請提供 address 和 value"}), 400

    result = modbus_service.write_register(address, value)
    return jsonify(result)

@modbus_bp.route("/status", methods=["GET"])
def read_modbus():
    """API: 讀取霧化器設備"""
    address = request.args.get("address", type=int)

    if address is None:
        return jsonify({"status": "failure", "message": "請提供 address"}), 400

    result = modbus_service.read_register(address)
    return jsonify(result)
