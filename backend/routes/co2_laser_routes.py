from flask import Blueprint, jsonify, request, current_app
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
        current_app.emit_device_status('co2laser', 'disconnected', {
            "message": f"CO2 laser連線失敗，{port}",
            "port": port,
            "status_data": 'connected failed',
            "data": {}
        })
        return jsonify({"status": "error", "message": "請提供 port"}), 400

    try:
        try:
            current_user_id = get_jwt_identity()
        except:
            current_user_id = None
        
        # 進行設備連線
        result, status_code = controller_service.connect(port)
        
        data, data_status_code = controller_service.get_status()
        
        if status_code == 200:
            current_app.emit_device_status('co2laser', 'connected', {
                "message": f"CO2 laser連線成功，{port}",
                "port": port,
                "status_data": 'connected',
                "data": data if data_status_code == 200 else {}
            })
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
            current_app.emit_device_status('co2laser', 'disconnected', {
                "message": f"CO2 laser連線失敗，{port}",
                "port": port,
                "status_data": 'connected failed',
                "data": {}
            })
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
        current_app.emit_device_status('co2laser', 'disconnected', {
            "message": f"CO2 laser連線失敗，{port}",
            "port": port,
            "status_data": 'connected failed',
            "data": {}
        })
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
    
    data, data_status_code = controller_service.get_status()

    if not port:
        current_app.emit_device_status('co2laser', 'connected', {
            "message": f"CO2 laser中斷連線失敗，{port}",
            "port": port,
            "status_data": 'disconnected failed',
            "data": data if data_status_code == 200 else {}
        })
        return jsonify({"status": "error", "message": "請提供 port"}), 400
    
    try:
        try:
            current_user_id = get_jwt_identity()
        except:
            current_user_id = None
            
        result, status_code = controller_service.disconnect()
        
        if status_code == 200:
            current_app.emit_device_status('co2laser', 'disconnected', {
                "message": f"CO2 laser中斷連線成功，{port}",
                "port": port,
                "status_data": 'disconnected',
                "data": {}
            })
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
            current_app.emit_device_status('co2laser', 'connected', {
                "message": f"CO2 laser中斷連線失敗，{port}",
                "port": port,
                "status_data": 'disconnected failed',
                "data": data if data_status_code == 200 else {}
            })
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
        current_app.emit_device_status('co2laser', 'connected', {
            "message": f"CO2 laser 中斷連線失敗，{port}",
            "port": port,
            "status_data": 'disconnected failed',
            "data": data if data_status_code == 200 else {}
        })
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
    data, data_status_code = controller_service.get_status()
    
    current_app.emit_device_status('co2laser', 'connected', {
        "message": "Co2 laser 修改成功",
        "data": data if data_status_code == 200 else {}
    })
    return data

@uc2000_bp.route('/set_pwm_freq', methods=['POST'])
def set_pwm_frequency():
    """設定 PWM 頻率"""
    input_data = request.get_json()

    freq = input_data.get('freq')
    if freq is None:
        return jsonify({"status": "error", "message": "請提供 freq"}), 400
    
    result = controller_service.set_pwm_frequency(freq)
    
    data, data_status_code = controller_service.get_status()
    
    current_app.emit_device_status('co2laser', 'connected', {
        "message": "Co2 laser 修改成功",
        "data": data if data_status_code == 200 else {}
    })
    
    return result

@uc2000_bp.route('/set_laser', methods=['POST'])
def set_laser():
    """啟動/關閉 雷射"""
    input_data = request.get_json()
    enable = input_data.get('enable')
    
    if enable is None:
        return jsonify({"status": "error", "message": "請提供 enable"}), 400
    
    start_data, start_status_code = controller_service.set_laser_enabled(enable)
    
    data, data_status_code = controller_service.get_status()
    
    current_app.emit_device_status('co2laser', 'connected', {
        "message": "Co2 laser 修改成功",
        "data": data if data_status_code == 200 else {}
    })
    
    return start_data, start_status_code

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
    
    set_pwm_data, set_pwm_status_code = controller_service.set_pwm_percentage(percentage)
    
    data, data_status_code = controller_service.get_status()
    
    current_app.emit_device_status('co2laser', 'connected', {
        "message": "Co2 laser 修改成功",
        "data": data if data_status_code == 200 else {}
    })
    
    return set_pwm_data, set_pwm_status_code

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