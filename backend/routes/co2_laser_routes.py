from flask import Blueprint, jsonify, request
from services.co2_laser_services import UC2000Service

uc2000_bp = Blueprint('uc2000', __name__)
controller_service = UC2000Service()

@uc2000_bp.route('/connect', methods=['POST'])
async def connect():
    """連接 UC-2000 設備"""
    data = request.get_json()
    port = data.get('port')

    if not port:
        return jsonify({"status": "error", "message": "請提供 port"}), 400

    return await controller_service.connect(port)

@uc2000_bp.route('/disconnect', methods=['POST'])
async def disconnect():
    """斷開 UC-2000 連線"""
    return await controller_service.disconnect()

@uc2000_bp.route('/status', methods=['GET'])
async def get_status():
    """獲取 UC-2000 狀態"""
    return await controller_service.get_status()

@uc2000_bp.route('/set_pwm_freq', methods=['POST'])
async def set_pwm_frequency():
    """設定 PWM 頻率"""
    data = request.get_json()
    print("Received data:", data)  # 添加這行來看收到的數據
    freq = data.get('freq')
    if freq is None:
        return jsonify({"status": "error", "message": "請提供 freq"}), 400
    
    print("Frequency value:", freq)  # 添加這行來看處理後的值
    result = await controller_service.set_pwm_frequency(freq)
    print("Result:", result)  # 添加這行來看結果
    return result

@uc2000_bp.route('/set_laser', methods=['POST'])
async def set_laser():
    """啟動/關閉 雷射"""
    data = request.get_json()
    enable = data.get('enable')
    if enable is None:
        return jsonify({"status": "error", "message": "請提供 enable"}), 400
    return await controller_service.set_laser_enabled(enable)

@uc2000_bp.route('/set_pwm', methods=['POST'])
async def set_pwm():
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
    
    return await controller_service.set_pwm_percentage(percentage)

@uc2000_bp.route('/set_mode', methods=['POST'])
async def set_mode():
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
        
    return await controller_service.set_mode(mode)

@uc2000_bp.route('/set_lase_on_powerup', methods=['POST'])
async def set_lase_on_powerup():
    """設定開機時是否自動開啟雷射"""
    data = request.get_json()
    enable = data.get('enable')
    if enable is None:
        return jsonify({"status": "error", "message": "請提供 enable 參數"}), 400
    return await controller_service.set_lase_on_powerup(enable)

@uc2000_bp.route('/set_max_pwm_95', methods=['POST'])
async def set_max_pwm_95():
    """設定最大 PWM 限制 (95% 或 99%)"""
    data = request.get_json()
    enable = data.get('enable')
    if enable is None:
        return jsonify({"status": "error", "message": "請提供 enable 參數"}), 400
    return await controller_service.set_max_pwm_95(enable)

@uc2000_bp.route('/set_gate_pull_up', methods=['POST'])
async def set_gate_pull_up():
    """設定 Gate Pull Up 狀態"""
    data = request.get_json()
    enable = data.get('enable')
    if enable is None:
        return jsonify({"status": "error", "message": "請提供 enable 參數"}), 400
    return await controller_service.set_gate_pull_up(enable)

@uc2000_bp.route('/update_settings', methods=['POST'])
async def update_settings():
    """更新所有設定"""
    data = request.get_json()
    if not data:
        return jsonify({"status": "error", "message": "請提供設定資料"}), 400
        
    return await controller_service.update_all_settings(data)