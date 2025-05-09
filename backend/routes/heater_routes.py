from flask import Blueprint, request, jsonify, current_app
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
            current_app.emit_device_status('heater', 'disconnected', {
                "message": f"Heater缺少 port 或 address",
                "status_data": 'disconnected'
            })
            return jsonify({"status": "failure", "message": "缺少 port 或 address"}), 400
        
        try:
            current_user_id = get_jwt_identity()
        except:
            current_user_id = None
        
        # 進行設備連線
        result, status_code = modbus_service.connect(data["port"], data["address"])
        
        current_app.emit_device_status('heater', 'connected' if status_code == 200 else 'disconnected', {
            "message": 'Heater連線成功' if status_code == 200 else 'Heater連線失敗',
            "port": data["port"],
            "address": data["address"],
            "status_data": 'connected' if status_code == 200 else 'connected failed',
            "data": modbus_service.read_modbus_data()["data"] if status_code == 200 else {}
        })
        # 記錄連線日誌
        ConnectionLogService.create_log(
            device_id='heater',
            device_name='加熱控制器',
            port=data["port"],
            address=data["address"],
            status='connected' if status_code == 200 else 'connected failed',
            created_by=current_user_id
        )
        
        return jsonify(result), status_code
        
    except Exception as e:
        current_app.emit_device_status('heater', 'disconnected', {
            "message": f"Heater連線失敗，{data["port"]}",
            "port": data["port"],
            "address": data["address"],
            "status_data": 'connected failed',
            "data": {}
        })
        ConnectionLogService.create_log(
            device_id='heater',
            device_name='加熱控制器',
            port=data["port"],
            address=data["address"],
            status='connected failed',
            created_by=current_user_id
        )
        return jsonify({
            "status": "failure",
            "message": f"連接請求處理失敗: {str(e)}"
        }), 500

@heater_bp.route("/disconnect", methods=["POST"])
def disconnect():
    data = request.json
    if not data or "port" not in data or "address" not in data:
        current_app.emit_device_status('heater', 'connected', {
            "message": f"Heater中斷連線失敗，{data["port"]}",
            "port": data["port"],
            "address": data["address"],
            "status_data": 'disconnected failed',
            "data": {}
        })
        return jsonify({"status": "failure", "message": "缺少 port 或 address"}), 400
    
    try:
        current_user_id = get_jwt_identity()
    except:
        current_user_id = None
        
    current_app.emit_device_status('heater', 'disconnected', {
        "message": f"Heater中斷連線成功，{data["port"]}",
        "port": data["port"],
        "address": data["address"],
        "status_data": 'disconnected',
        "data": {}
    })

    ConnectionLogService.create_log(
        device_id='heater',
        device_name='加熱控制器',
        port=data['port'],
        address=data['address'],
        status='disconnected',
        created_by=current_user_id
    )
    
    """ 斷開 Modbus 連線 """
    modbus_service.disconnect()
    return jsonify({"status": "success"})

@heater_bp.route("/status", methods=["GET"])
def get_modbus_data():
    """ 讀取所有 Modbus 數據 """
    try:
        if not modbus_service.client:
            current_app.emit_device_status('heater', 'connected', {
                "message": "Heater尚未連線",
                "data": {}
            })
            return jsonify({
                "status": "failure",
                "message": "Heater尚未連線"
            }), 400
            
        data = modbus_service.read_modbus_data()
        if data is None:
            current_app.emit_device_status('heater', 'connected', {
                "message": "Heater讀取失敗",
                "data": {}
            })

            return jsonify({
                "status": "failure",
                "message": "讀取數據失敗"
            }), 500
        
        current_app.emit_device_status('heater', 'connected', {
            "message": "Heater讀取成功",
            "data": data["data"]
        })
            
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

        current_app.emit_device_status('heater', 'connected', {
            "message": "Heater修改成功",
            "data": modbus_service.read_modbus_data()["data"]
        })

        return jsonify(result)
    except TypeError as e:
        return jsonify({
            "status": "failure",
            "message": "數據格式錯誤",
            "details": str(e)
        }), 400