from flask import Blueprint, request, jsonify
import asyncio
import traceback
from services.power_supply_services import SpikService

power_supply_service = SpikService()

power_supply_bp = Blueprint("power_supply", __name__)

@power_supply_bp.route("/connect", methods=["POST"])
async def connect_device():
    try:
        # 使用 get_json() 並提供默認值和強制解析
        data = request.get_json(force=True, silent=True) or {}
        port = data.get("port", "COM12")
        baudrate = int(data.get("baudrate", 19200))
        
        power_supply_service.device.port = port
        power_supply_service.device.baudrate = baudrate
        
        connected = await asyncio.to_thread(power_supply_service.connect)
        if connected:
            return jsonify({"status": "success", "message": f"已連線至 {port}"}), 200
        else:
            return jsonify({"status": "failure", "message": "連線失敗"}), 400
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": f"連線過程發生錯誤: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500

@power_supply_bp.route("/disconnect", methods=["POST"])
async def disconnect_device():
    try:
        disconnected = await asyncio.to_thread(power_supply_service.disconnect)
        if disconnected:
            return jsonify({"status": "success", "message": "已斷線"}), 200
        else:
            return jsonify({"status": "failure", "message": "斷線失敗"}), 400
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": f"斷線過程發生錯誤: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500

@power_supply_bp.route("/write_voltage", methods=["POST"])
async def write_voltage_route():
    try:
        data = request.get_json(force=True, silent=True) or {}
        voltage = data.get("voltage")
        
        if voltage is None:
            return jsonify({"status": "failure", "message": "請提供 voltage 值"}), 400
        
        result, status_code = await power_supply_service.write_voltage(float(voltage))
        return jsonify(result), status_code
    except ValueError:
        return jsonify({"status": "failure", "message": "voltage 值必須為數字"}), 400
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": f"寫入電壓時發生錯誤: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500

@power_supply_bp.route("/write_current", methods=["POST"])
async def write_current_route():
    try:
        data = request.get_json(force=True, silent=True) or {}
        current = data.get("current")
        
        if current is None:
            return jsonify({"status": "failure", "message": "請提供 current 值"}), 400
        
        result, status_code = await power_supply_service.write_current(float(current))
        return jsonify(result), status_code
    except ValueError:
        return jsonify({"status": "failure", "message": "current 值必須為數字"}), 400
    except Exception as e:
        return jsonify({
            "status": "error", 
            "message": f"寫入電流時發生錯誤: {str(e)}",
            "traceback": traceback.format_exc()
        }), 500

# 其他路由（read_mode, read_voltage, read_current 等）保持原有邏輯
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

@power_supply_bp.route("/read_current", methods=["GET"])
async def read_current_route():
    current, err = await power_supply_service.read_current()
    if err == 1:
        return jsonify({"status": "success", "current": current}), 200
    else:
        return jsonify({"status": "failure", "message": f"讀取電流失敗，錯誤碼: {err}"}), 400

@power_supply_bp.route("/dc1_turn_on", methods=["POST"])
async def turn_on_dc1():
    """
    開啟 DC1
    """
    err = await power_supply_service.set_dc1_on()
    if err == 1:
        return jsonify({"status": "success", "message": "DC1 已開啟"}), 200
    return jsonify({"status": "failure", "message": "DC1 開啟失敗"}), 400

@power_supply_bp.route("/dc1_turn_off", methods=["POST"])
async def turn_off_dc1():
    """
    關閉 DC1
    """
    err = await power_supply_service.set_dc1_off()
    if err == 1:
        return jsonify({"status": "success", "message": "DC1 已關閉"}), 200
    return jsonify({"status": "failure", "message": "DC1 關閉失敗"}), 400

@power_supply_bp.route("/set_clear_error", methods=["POST"])
async def clear_error():
    """
    清除error
    """
    err = await power_supply_service.clear_error()
    if err == 1:
        return jsonify({"status": "success", "message": "error cleared"}), 200
    return jsonify({"status": "failure", "message": "error clear failed"}), 400

@power_supply_bp.route("/power_on", methods=["POST"])
async def power_on():
    """
    開啟電源
    """
    err = await power_supply_service.set_running_on()
    if err == 1:
        return jsonify({"status": "success", "message": "電源已開啟"}), 200
    return jsonify({"status": "failure", "message": "電源開啟失敗"}), 400

@power_supply_bp.route("/power_off", methods=["POST"])
async def power_off():
    """
    關閉電源
    """
    err = await power_supply_service.set_running_off()
    if err == 1:
        return jsonify({"status": "success", "message": "電源已關閉"}), 200
    return jsonify({"status": "failure", "message": "電源關閉失敗"}), 400

@power_supply_bp.route("/status", methods=["GET"])
async def status():
    """
    讀取電源狀態
    """
    try:
        status = await power_supply_service.read_status()
        return jsonify({"status": "success", "data": status}), 200
    except Exception as e:
        return jsonify({
            "status": "failure", 
            "message": f"讀取電源狀態失敗：{str(e)}",
            "traceback": traceback.format_exc()
        }), 400