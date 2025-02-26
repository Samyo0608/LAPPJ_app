from flask import Blueprint, request, jsonify
from services.azbil_MFC_services import AzbilMFCService
from services.connect_log_services import ConnectionLogService
from flask_jwt_extended import get_jwt_identity
from threading import Lock

azbil_service = AzbilMFCService()
azbil_MFC_bp = Blueprint("azbilMfc", __name__)

write_lock = Lock()

@azbil_MFC_bp.route("/connect", methods=["POST"])
async def connect_device():
    data = request.json
    port = data.get("port", "COM1")
    baudrate = 38400
    device_id = data.get("address", 1)
    
    if not port:
        return jsonify({"status": "failure", "message": "請提供 port"}), 400
      
    try:
        try:
            current_user_id = get_jwt_identity()
        except:
            current_user_id = None
        
        # 進行設備連線
        result, status_code = await azbil_service.connect(port, baudrate, device_id)
        
        if status_code == 200:
            # 記錄連線日誌
            ConnectionLogService.create_log(
                device_id='azbilMfc',
                device_name='Azbil MFC (Main Gas)',
                port=port,
                address=device_id,
                status='connected',
                created_by=current_user_id
            )
            
        else:
            ConnectionLogService.create_log(
                device_id='azbilMfc',
                device_name='Azbil MFC (Main Gas)',
                port=port,
                address=device_id,
                status='connected failed',
                created_by=current_user_id
            )
            
        return jsonify(result), status_code
    
    except Exception as e:
        ConnectionLogService.create_log(
            device_id='azbilMfc',
            device_name='Azbil MFC (Main Gas)',
            port=port,
            address=device_id,
            status='connected failed',
            created_by=current_user_id
        )
        return jsonify({
            "status": "error",
            "message": f"連接請求處理失敗: {str(e)}"
        }), 500

@azbil_MFC_bp.route("/disconnect", methods=["POST"])
async def disconnect_device():
    data = request.json
    port = data.get("port", "COM1")
    device_id = data.get("address", 1)
    
    if not port:
        return jsonify({"status": "failure", "message": "請提供 port"}), 400
      
    try:
        try:
            current_user_id = get_jwt_identity()
        except:
            current_user_id = None
        
        # 進行設備中斷連線
        result, status_code = await azbil_service.disconnect()
        
        if status_code == 200:
            # 記錄連線日誌
            ConnectionLogService.create_log(
                device_id='azbilMfc',
                device_name='Azbil MFC (Main Gas)',
                port=port,
                address=device_id,
                status='disconnected',
                created_by=current_user_id
            )
        else:
            ConnectionLogService.create_log(
                device_id='azbilMfc',
                device_name='Azbil MFC (Main Gas)',
                port=port,
                address=device_id,
                status='disconnected failed',
                created_by=current_user_id
            )
            
        return jsonify(result), status_code
    
    except Exception as e:
        ConnectionLogService.create_log(
            device_id='azbilMfc',
            device_name='Azbil MFC (Main Gas)',
            port=port,
            address=device_id,
            status='disconnected failed',
            created_by=current_user_id
        )
        return jsonify({
            "status": "error",
            "message": f"中斷連線請求處理失敗: {str(e)}"
        }), 500

@azbil_MFC_bp.route("/set_flow", methods=["POST"])
async def set_flow():
    data = request.json
    flow_rate = data.get("flow", 50)
    
    with write_lock:
        result, status_code = await azbil_service.set_flow(flow_rate)
        
    return jsonify(result), status_code
  
@azbil_MFC_bp.route("/get_status", methods=["GET"])
async def get_status():
    result, status_code = await azbil_service.get_status()
    
    if status_code == 200:
        return jsonify({
            "status": "success",
            "data": result
        }), status_code
    else:
        return jsonify({
            "status": "failure",
            "message": result
        }), status_code
        
@azbil_MFC_bp.route("/get_main_status", methods=["GET"])
async def get_main_status():
    result, status_code = await azbil_service.get_main_status()
    return jsonify(result), status_code
  
@azbil_MFC_bp.route("/flow_turn_on", methods=["POST"])
async def flow_turn_on():

    with write_lock:
        result, status_code = await azbil_service.set_flow_turn_on()
        
    return jsonify(result), status_code
  
@azbil_MFC_bp.route("/flow_turn_off", methods=["POST"])
async def flow_turn_off():
  
    with write_lock:
        result, status_code = await azbil_service.set_flow_turn_off()
        
    return jsonify(result), status_code
  
@azbil_MFC_bp.route("/flow_turn_full", methods=["POST"])
async def flow_turn_full():
  
    with write_lock:
        result, status_code = await azbil_service.set_flow_turn_full()
        
    return jsonify(result), status_code
  
@azbil_MFC_bp.route("/update", methods=["POST"])
async def update():
    data = request.json
    result, status_code = await azbil_service.set_setting_update(data)
    return jsonify(result), status_code

@azbil_MFC_bp.route("/restart_accumlated_flow", methods=["POST"])
async def restart_accumlated_flow():
    with write_lock:
        result, status_code = await azbil_service.restart_accumlated_flow()
        
    return jsonify(result), status_code