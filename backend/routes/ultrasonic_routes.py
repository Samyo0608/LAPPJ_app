from flask import Blueprint, request, jsonify
from services.ultrasonic_services import ModbusService
from typing import Dict, Any
from services.connect_log_services import ConnectionLogService
from flask_jwt_extended import get_jwt_identity

modbus_bp = Blueprint("ultrasonic", __name__)
modbus_service = ModbusService()

@modbus_bp.route("/connect", methods=["POST"])
def connect_modbus() -> Dict[str, Any]:
    """API: 連接霧化器"""
    data = request.get_json()
    port = data.get("port")
    baudrate = int(data.get("baudrate", 38400))
    device_id = int(data.get("address", 1))

    if not port:
        return jsonify({"status": "failure", "message": "請提供 port"}), 400
    
    try:
        current_user_id = get_jwt_identity()
    except:
        current_user_id = None

    try:
        result = modbus_service.connect(port, baudrate, device_id)
        
        if result["status"] == "success":
            ConnectionLogService.create_log(
                device_id='ultrasonic',
                device_name='霧化器',
                port=port,
                address=device_id,
                status='connected',
                created_by=current_user_id
            )
        else:
            ConnectionLogService.create_log(
                device_id='ultrasonic',
                device_name='霧化器',
                port=port,
                address=device_id,
                status='connected failed',
                created_by=current_user_id
            )
        
        return jsonify(result)
    except ValueError as e:
        ConnectionLogService.create_log(
            device_id='ultrasonic',
            device_name='霧化器',
            port=port,
            address=device_id,
            status='connected failed',
            created_by=current_user_id
        )
        return jsonify({"status": "failure", "message": f"參數錯誤: {str(e)}"}), 400
    except Exception as e:
        ConnectionLogService.create_log(
            device_id='ultrasonic',
            device_name='霧化器',
            port=port,
            address=device_id,
            status='connected failed',
            created_by=current_user_id
        )
        return jsonify({"status": "failure", "message": f"連接異常: {str(e)}"}), 500

@modbus_bp.route("/disconnect", methods=["POST"])
def disconnect_modbus() -> Dict[str, Any]:
    """API: 斷開霧化器"""
    result = modbus_service.disconnect()
    
    if result["status"] == "success":
        data = request.get_json()
        port = data.get("port")
        device_id = data.get("address")
        current_user_id = get_jwt_identity()
        
        ConnectionLogService.create_log(
            device_id='ultrasonic',
            device_name='霧化器',
            port=port,
            address=device_id,
            status='disconnected',
            created_by=current_user_id
        )
    else:
        data = request.get_json()
        port = data.get("port")
        device_id = data.get("address")
        current_user_id = get_jwt_identity()
        
        ConnectionLogService.create_log(
            device_id='ultrasonic',
            device_name='霧化器',
            port=port,
            address=device_id,
            status='disconnected failed',
            created_by=current_user_id
        )
    
    return jsonify(result)

@modbus_bp.route("/turn_on", methods=["POST"])
def turn_on_modbus() -> Dict[str, Any]:
    """API: 開啟霧化器"""
    result = modbus_service.turn_on()
    return jsonify(result)

@modbus_bp.route("/turn_off", methods=["POST"])
def turn_off_modbus() -> Dict[str, Any]:
    """API: 關閉霧化器"""
    result = modbus_service.turn_off()
    return jsonify(result)

@modbus_bp.route("/status", methods=["GET"])
def get_modbus_status() -> Dict[str, Any]:
    """API: 讀取霧化器狀態"""
    result = modbus_service.get_status()
    return jsonify(result)