from flask import Blueprint, request, jsonify, current_app
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
            
            current_app.emit_device_status('ultrasonic', 'connected', {
                "message": f"霧化器連線成功，{port}: {device_id}",
                "address": device_id,
                "port": port,
                "status_data": 'connected'
            })
            
            ConnectionLogService.create_log(
                device_id='ultrasonic',
                device_name='霧化器',
                port=port,
                address=device_id,
                status='connected',
                created_by=current_user_id
            )
        else:
            
            current_app.emit_device_status('ultrasonic', 'disconnected', {
                "message": f"霧化器連線失敗，{port} : {device_id}",
                "address": device_id,
                "port": port,
                "status_data": 'connected failed'
            })
            
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
        
        current_app.emit_device_status('ultrasonic', 'disconnected', {
            "message": f"霧化器連線失敗，{port} : {device_id}",
            "address": device_id,
            "port": port,
            "status_data": 'connected failed'
        })
        
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
        
        current_app.emit_device_status('ultrasonic', 'disconnected', {
            "message": f"霧化器連線失敗，{port} : {device_id}",
            "address": device_id,
            "port": port,
            "status_data": 'connected failed'
        })
        
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
    data = request.get_json()
    port = data.get("port")
    device_id = data.get("address")
    
    try:
        current_user_id = get_jwt_identity()
    except RuntimeError:
        current_user_id = None
    
    if result["status"] == "success":
        
        current_app.emit_device_status('ultrasonic', 'disconnected', {
            "message": f"霧化器中斷連線成功，{port}: {device_id}",
            "address": device_id,
            "port": port,
            "status_data": 'disconnected'
        })
        
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
        
        current_app.emit_device_status('ultrasonic', 'connected', {
            "message": f"霧化器中斷連線失敗，{port} : {device_id}",
            "address": device_id,
            "port": port,
            "status_data": 'disconnected failed'
        })
        
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
    current_app.emit_device_status('ultrasonic', 'connected', {
        "data": result,
    })
    return jsonify(result)

@modbus_bp.route("/turn_off", methods=["POST"])
def turn_off_modbus() -> Dict[str, Any]:
    """API: 關閉霧化器"""
    result = modbus_service.turn_off()
    current_app.emit_device_status('ultrasonic', 'connected', {
        "data": result,
    })
    return jsonify(result)

@modbus_bp.route("/status", methods=["GET"])
def get_modbus_status() -> Dict[str, Any]:
    """API: 讀取霧化器狀態"""
    result = modbus_service.get_status()
    return jsonify(result)