from flask import Blueprint, request, jsonify
import asyncio
from services.power_supply_services import SpikService

power_supply_service = SpikService()

power_supply_bp = Blueprint("power_supply", __name__)

@power_supply_bp.route("/connect", methods=["POST"])
async def connect_device():
    data = request.json
    port = data.get("port", "COM12")
    baudrate = int(data.get("baudrate", 19200))
    power_supply_service.device.port = port
    power_supply_service.device.baudrate = baudrate
    connected = await asyncio.to_thread(power_supply_service.connect)
    if connected:
        return jsonify({"status": "success", "message": f"已連線至 {port} (baud={baudrate})"}), 200
    else:
        return jsonify({"status": "failure", "message": "連線失敗"}), 400

@power_supply_bp.route("/disconnect", methods=["POST"])
async def disconnect_device():
    disconnected = await asyncio.to_thread(power_supply_service.disconnect)
    if disconnected:
        return jsonify({"status": "success", "message": "已斷線"}), 200
    else:
        return jsonify({"status": "failure", "message": "斷線失敗"}), 400

@power_supply_bp.route("/read_mode", methods=["GET"])
async def read_mode_route():
    mode, err = await power_supply_service.read_mode()
    if err == 1:
        return jsonify({"status": "success", "mode": mode}), 200
    else:
        return jsonify({"status": "failure", "message": f"讀取 Mode 失敗，錯誤碼: {err}"}), 400

@power_supply_bp.route("/read_voltage", methods=["GET"])
async def read_voltage_route():
    voltage, err = await power_supply_service.read_voltage()
    if err == 1:
        return jsonify({"status": "success", "voltage": voltage}), 200
    else:
        return jsonify({"status": "failure", "message": f"讀取電壓失敗，錯誤碼: {err}"}), 400

@power_supply_bp.route("/write_voltage", methods=["POST"])
async def write_voltage_route():
    data = request.json
    voltage = data.get("voltage")
    if voltage is None:
        return jsonify({"status": "failure", "message": "請提供 voltage 值"}), 400
    result, status_code = await power_supply_service.write_voltage(float(voltage))
    return jsonify(result), status_code

@power_supply_bp.route("/read_current", methods=["GET"])
async def read_current_route():
    current, err = await power_supply_service.read_current()
    if err == 1:
        return jsonify({"status": "success", "current": current}), 200
    else:
        return jsonify({"status": "failure", "message": f"讀取電流失敗，錯誤碼: {err}"}), 400

@power_supply_bp.route("/write_current", methods=["POST"])
async def write_current_route():
    data = request.json
    current = data.get("current")
    if current is None:
        return jsonify({"status": "failure", "message": "請提供 current 值"}), 400
    result, status_code = await power_supply_service.write_current(float(current))
    return jsonify(result), status_code
