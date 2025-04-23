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
    
    return jsonify({
        'success': success,
        'message': message
    }), 200 if success else 400

@robot_bp.route('/disconnect', methods=['POST'])
def disconnect():
    """中斷連接"""
    success, message = robot_service.disconnect()
    
    return jsonify({
        'success': success,
        'message': message
    }), 200 if success else 400

@robot_bp.route('/status', methods=['GET'])
def get_status():
    """獲取機械手臂狀態"""
    success, message, data = robot_service.read_status()
    
    response = {
        'success': success,
        'message': message
    }
    
    if data:
        response['data'] = data
    
    return jsonify(response), 200 if success else 400

@robot_bp.route('/start', methods=['POST'])
def start_robot():
    """啟動或停止機械手臂"""
    data = request.get_json()
    
    start = data.get('start', True)
    
    success, message = robot_service.start_robot(start)
    
    return jsonify({
        'success': success,
        'message': message
    }), 200 if success else 400

@robot_bp.route('/speed', methods=['POST'])
def set_adjustment_rate():
    """設定調整倍率"""
    data = request.get_json()
    
    enabled = data.get('enabled', False)
    value = data.get('value')
    
    success, message = robot_service.set_adjustment_rate(enabled, value)
    
    return jsonify({
        'success': success,
        'message': message
    }), 200 if success else 400

@robot_bp.route('/gap_adjustment', methods=['POST'])
def set_height_adjustment():
    """設定調整間距高度"""
    data = request.get_json()
    
    enabled = data.get('enabled', False)
    offset_value = data.get('offset_value')
    
    success, message = robot_service.set_height_adjustment(enabled, offset_value)
    
    return jsonify({
        'success': success,
        'message': message
    }), 200 if success else 400

@robot_bp.route('/times_adjustment', methods=['POST'])
def set_count_adjustment():
    """設定調整次數"""
    data = request.get_json()
    
    enabled = data.get('enabled', False)
    count_value = data.get('count_value')
    
    success, message = robot_service.set_count_adjustment(enabled, count_value)
    
    return jsonify({
        'success': success,
        'message': message
    }), 200 if success else 400

@robot_bp.route('/history', methods=['GET'])
def get_operation_history():
    """獲取操作歷史"""
    if robot_service.model:
        return jsonify({
            'success': True,
            'data': robot_service.model.operation_history
        }), 200
    else:
        return jsonify({
            'success': False,
            'message': '服務未初始化'
        }), 400
        
@robot_bp.route('/reset', methods=['POST'])
def reset_robot_signal():
    """歸零機械手臂啟動訊號"""
    success, message = robot_service.reset_robot_signal()
    
    return jsonify({
        'success': success,
        'message': message
    }), 200 if success else 400