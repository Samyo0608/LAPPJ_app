from flask import Blueprint, jsonify, request
from services.co2_laser_services import UC2000Service
from services.connect_log_services import ConnectionLogService
from flask_jwt_extended import get_jwt_identity

uc2000_bp = Blueprint('uc2000', __name__)
controller_service = UC2000Service()

@uc2000_bp.route('/connect', methods=['POST'])
def connect():
    """連接 UC-2000 設備"""
    data = request.get_json()
    port = data.get('port')

    if not port:
        return jsonify({"status": "error", "message": "請提供 port"}), 400

    try:
        try:
            current_user_id = get_jwt_identity()
        except:
            current_user_id = None
        
        # 進行設備連線
        result, status_code = controller_service.connect(port)
        
        if status_code == 200:
            # 記錄連線日誌
            ConnectionLogService.create_log(
                device_id='uc2000',
                device_name='UC-2000 CO2雷射控制器',
                port=port,
                address='- -',
                status='connected',
                created_by=current_user_id
            )
        else:
            ConnectionLogService.create_log(
                device_id='uc2000',
                device_name='UC-2000 CO2雷射控制器',
                port=port,
                address='- -',
                status='connected failed',
                created_by=current_user_id
            )
            
        return jsonify(result), status_code
    
    except Exception as e:
        ConnectionLogService.create_log(
            device_id='uc2000',
            device_name='UC-2000 CO2雷射控制器',
            port=port,
            address='- -',
            status='connected failed',
            created_by=current_user_id
        )
        return jsonify({
            "status": "error",
            "message": f"連接請求處理失敗: {str(e)}"
        }), 500

@uc2000_bp.route('/disconnect', methods=['POST'])
def disconnect():
    """斷開 UC-2000 連線"""
    data = request.get_json()
    port = data.get('port')

    if not port:
        return jsonify({"status": "error", "message": "請提供 port"}), 400
    
    try:
        try:
            current_user_id = get_jwt_identity()
        except:
            current_user_id = None
            
        result, status_code = controller_service.disconnect()
        
        if status_code == 200:
            # 記錄斷開連線日誌
            ConnectionLogService.create_log(
                device_id='uc2000',
                device_name='UC-2000 CO2雷射控制器',
                port=port,
                address='- -',
                status='disconnected',
                created_by=current_user_id
            )
        else:
            ConnectionLogService.create_log(
                device_id='uc2000',
                device_name='UC-2000 CO2雷射控制器',
                port=port,
                address='- -',
                status='disconnected failed',
                created_by=current_user_id
            )
            
        return jsonify(result), status_code
    
    except Exception as e:
        ConnectionLogService.create_log(
            device_id='uc2000',
            device_name='UC-2000 CO2雷射控制器',
            port=port,
            address='- -',
            status='disconnected failed',
            created_by=current_user_id
        )
        return jsonify({
            "status": "error",
            "message": f"斷開連線請求處理失敗: {str(e)}"
        }), 500

@uc2000_bp.route('/status', methods=['GET'])
def get_status():
    """獲取 UC-2000 狀態"""
    return controller_service.get_status()

@uc2000_bp.route('/set_pwm_freq', methods=['POST'])
def set_pwm_frequency():
    """設定 PWM 頻率"""
    data = request.get_json()
    print("Received data:", data)  # 添加這行來看收到的數據
    freq = data.get('freq')
    if freq is None:
        return jsonify({"status": "error", "message": "請提供 freq"}), 400
    
    print("Frequency value:", freq)  # 添加這行來看處理後的值
    result = controller_service.set_pwm_frequency(freq)
    print("Result:", result)  # 添加這行來看結果
    return result

@uc2000_bp.route('/set_laser', methods=['POST'])
def set_laser():
    """啟動/關閉 雷射"""
    data = request.get_json()
    enable = data.get('enable')
    if enable is None:
        return jsonify({"status": "error", "message": "請提供 enable"}), 400
    return controller_service.set_laser_enabled(enable)

@uc2000_bp.route('/set_pwm', methods=['POST'])
def set_pwm():
    """設置 PWM 佔空比"""
    data = request.get_json()
    percentage = data.get('percentage')
    
    # 處理帶 % 符號的輸入
    try:
        # 移除 % 符號並轉換為浮點數
        if isinstance(percentage, str):
            percentage = percentage.replace('%', '').strip()
        
        percentage = float(percentage)
    except (ValueError, TypeError):
        return jsonify({"status": "error", "message": "請提供有效的 percentage"}), 400

    # 確保在 0-99 範圍
    if not (0 <= percentage <= 99):
        return jsonify({"status": "error", "message": "Percentage 必須在 0-99 之間"}), 400
    
    return controller_service.set_pwm_percentage(percentage)

@uc2000_bp.route('/set_mode', methods=['POST'])
def set_mode():
    """設定 UC-2000 模式"""
    data = request.get_json()
    mode = data.get('mode')
    
    # 擴展有效的模式列表
    valid_modes = {
        "manual", "anc", "anv", 
        "manual_closed", "manual closed",
        "anv_closed", "anv closed"
    }
    
    # 將輸入的模式轉換為小寫並移除多餘空格
    if mode:
        normalized_mode = mode.lower().strip()
    else:
        return jsonify({
            "status": "error", 
            "message": "請提供 mode 參數"
        }), 400

    if normalized_mode not in valid_modes and normalized_mode.replace("_", " ") not in valid_modes:
        return jsonify({
            "status": "error", 
            "message": f"無效的模式: {mode}. 有效的模式為: manual, anc, anv, manual_closed, anv_closed"
        }), 400
        
    return controller_service.set_mode(mode)

@uc2000_bp.route('/set_lase_on_powerup', methods=['POST'])
def set_lase_on_powerup():
    """設定開機時是否自動開啟雷射"""
    data = request.get_json()
    enable = data.get('enable')
    if enable is None:
        return jsonify({"status": "error", "message": "請提供 enable 參數"}), 400
    return controller_service.set_lase_on_powerup(enable)

@uc2000_bp.route('/set_max_pwm_95', methods=['POST'])
def set_max_pwm_95():
    """設定最大 PWM 限制 (95% 或 99%)"""
    data = request.get_json()
    enable = data.get('enable')
    if enable is None:
        return jsonify({"status": "error", "message": "請提供 enable 參數"}), 400
    return controller_service.set_max_pwm_95(enable)

@uc2000_bp.route('/set_gate_pull_up', methods=['POST'])
def set_gate_pull_up():
    """設定 Gate Pull Up 狀態"""
    data = request.get_json()
    enable = data.get('enable')
    if enable is None:
        return jsonify({"status": "error", "message": "請提供 enable 參數"}), 400
    return controller_service.set_gate_pull_up(enable)

@uc2000_bp.route('/update_settings', methods=['POST'])
def update_settings():
    """更新所有設定"""
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "請提供設定資料"}), 400
        
    return controller_service.update_all_settings(data)