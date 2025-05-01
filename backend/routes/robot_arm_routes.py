from flask import Blueprint, request, jsonify, current_app
from services.robot_arm_services import RobotArmService

# 初始化 Blueprint
robot_bp = Blueprint('robot', __name__, url_prefix='/api/robot')

# 初始化服務
robot_service = RobotArmService()

@robot_bp.route('/connect', methods=['POST'])
def connect():
    """連接機械手臂"""
    data = request.get_json()
    
    ip_address = data.get('ip_address', '192.168.0.5')
    port = data.get('port', 502)
    slave_id = data.get('slave_id', 5)
    
    success, message = robot_service.connect(ip_address, port, slave_id)

    if success:
        current_app.emit_device_status('robotarm', 'connected', {
            "message": f"機械手臂連線成功，{ip_address}",
            "address": ip_address,
            "status_data": 'connected'
        })
    else:
        current_app.emit_device_status('robotarm', 'disconnected', {
            "message": f"機械手臂連線失敗，{ip_address}",
            "address": ip_address,
            "status_data": 'connected failed'
        })
    
    if success:
        data_success, data_message, data = robot_service.read_status()
    
        current_app.emit_device_status('robotarm', 'connected', {
            "message": f"機械手臂連線成功，ip_address: {ip_address}",
            "ip_address": ip_address,
            "status_data": 'connected',
            "data" : ({
              "satus": 'success' if data_success else 'failure',
              "message": data_message,
              "data": data if data_success else {}
            })
        })
    else:
        current_app.emit_device_status('robotarm', 'disconnected', {
            "message": f"機械手臂連線失敗，ip_address: {ip_address}",
            "ip_address": ip_address,
            "status_data": 'connected failed',
            "data" : {}
        })
    
    return jsonify({
        'status': 'success' if success else 'failure',
        'message': message
    }), 200

@robot_bp.route('/disconnect', methods=['POST'])
def disconnect():
    """中斷連接"""
    success, message = robot_service.disconnect()

    if success:
        current_app.emit_device_status('robotarm', 'disconnected', {
            "message": f"機械手臂中斷連線成功",
            "status_data": 'disconnected'
        })
    else:
        current_app.emit_device_status('robotarm', 'connected', {
            "message": f"機械手臂中斷連線失敗",
            "status_data": 'disconnected failed'
        })
    
    if success:
        current_app.emit_device_status('robotarm', 'disconnected', {
            "message": "機械手臂中斷連線成功",
            "status_data": 'disconnected'
        })
    else:
        data_success, data_message, data = robot_service.read_status()
        
        current_app.emit_device_status('robotarm', 'connected', {
            "message": "機械手臂中斷連線失敗",
            "status_data": 'disconnected failed',
            "data" : ({
              "satus": 'success' if data_success else 'failure',
              "message": data_message,
              "data": data if data_success else {}
            })
        })
    
    return jsonify({
        'status': 'success' if success else 'failure',
        'message': message
    }), 200

@robot_bp.route('/status', methods=['GET'])
def get_status():
    """獲取機械手臂狀態"""
    success, message, data = robot_service.read_status()
    
    response = {
        'status': 'success' if success else 'failure',
        'message': message,
        'data': data if success else {}
    }
    
    current_app.emit_device_status('robotarm', 'connected', {
        "message": "機械手臂讀取資料成功",
        "data" : response
    })
    
    return response, 200

@robot_bp.route('/start', methods=['POST'])
def start_robot():
    """啟動或停止機械手臂"""
    input_data = request.get_json()
    
    start = input_data.get('start', True)
    
    success, message = robot_service.start_robot(start)

    print("success", success)
    print("message", message)
    
    if success:
        data_success, data_message, data = robot_service.read_status()
        
        current_app.emit_device_status('robotarm', 'connected', {
            "message": "機械手臂啟動成功" if start else "機械手臂停止成功",
            "status_data": 'connected',
            "data" : ({
              "satus": 'success' if data_success else 'failure',
              "message": data_message,
              "data": data if data_success else {}
            })
        })
    
    return jsonify({
        'status': 'success' if success else 'failure',
        'message': message
    }), 200

@robot_bp.route('/speed', methods=['POST'])
def set_adjustment_rate():
    """設定調整倍率"""
    input_data = request.get_json()
    
    enabled = input_data.get('enabled', False)
    value = input_data.get('value')
    
    success, message = robot_service.set_adjustment_rate(enabled, value)
    
    if success:
        data_success, data_message, data = robot_service.read_status()
        
        current_app.emit_device_status('robotarm', 'connected', {
            "message": "機械手臂倍率調整成功" if success else "機械手臂倍率調整失敗",
            "data" : ({
              "satus": 'success' if data_success else 'failure',
              "message": data_message,
              "data": data if data_success else {}
            })
        })
    
    return jsonify({
        'status': 'success' if success else 'failure',
        'message': message
    }), 200

@robot_bp.route('/gap_adjustment', methods=['POST'])
def set_height_adjustment():
    """設定調整間距高度"""
    input_data = request.get_json()
    
    enabled = input_data.get('enabled', False)
    offset_value = input_data.get('offset_value')
    
    success, message = robot_service.set_height_adjustment(enabled, offset_value)
  
    if success:
        data_success, data_message, data = robot_service.read_status()
        
        current_app.emit_device_status('robotarm', 'connected', {
            "message": "機械手臂調整間距成功" if success else "機械手臂調整間距失敗",
            "data" : ({
              "satus": 'success' if data_success else 'failure',
              "message": data_message,
              "data": data if data_success else {}
            })
        })
    
    return jsonify({
        'status': 'success' if success else 'failure',
        'message': message
    }), 200

@robot_bp.route('/times_adjustment', methods=['POST'])
def set_count_adjustment():
    """設定調整次數"""
    input_data = request.get_json()
    
    enabled = input_data.get('enabled', False)
    count_value = input_data.get('count_value')
    
    success, message = robot_service.set_count_adjustment(enabled, count_value)
    
    if success:
        data_success, data_message, data = robot_service.read_status()
        
        current_app.emit_device_status('robotarm', 'connected', {
            "message": "機械手臂調整次數成功" if success else "機械手臂調整次數失敗",
            "data" : ({
              "satus": 'success' if data_success else 'failure',
              "message": data_message,
              "data": data if data_success else {}
            })
        })
    
    return jsonify({
        'status': 'success' if success else 'failure',
        'message': message
    }), 200

@robot_bp.route('/history', methods=['GET'])
def get_operation_history():
    """獲取操作歷史"""
    if robot_service.model:
        return jsonify({
            'status': 'success',
            'message': '成功獲取操作歷史',
            'data': robot_service.model.operation_history
        }), 200
    else:
        return jsonify({
            'status': 'failure',
            'message': '服務未初始化'
        }), 200

@robot_bp.route('/reset', methods=['POST'])
def reset_robot_signal():
    """歸零機械手臂啟動訊號"""
    success, message = robot_service.reset_robot_signal()
    
    if success:
        data_success, data_message, data = robot_service.read_status()
        
        current_app.emit_device_status('robotarm', 'connected', {
            "message": "機械手臂復歸成功" if success else "機械手臂復歸失敗",
            "data" : ({
              "satus": 'success' if data_success else 'failure',
              "message": data_message,
              "data": data if data_success else {}
            })
        })
    
    return jsonify({
        'status': 'success' if success else 'failure',
        'message': message
    }), 200