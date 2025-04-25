from flask import Blueprint, request, jsonify, current_app
from services.azbil_MFC_services import AzbilMFCService
from services.connect_log_services import ConnectionLogService
from flask_jwt_extended import get_jwt_identity
from threading import Lock, Thread
import asyncio

# 創建服務實例
azbil_service = AzbilMFCService()
azbil_MFC_bp = Blueprint("azbilMfc", __name__)

write_lock = Lock()

# 輔助函數：在單獨的線程中執行異步操作
def run_async_task(coroutine):
    """在新線程中執行異步任務並返回結果"""
    result_container = []
    
    def thread_target():
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(coroutine)
            result_container.append(result)
        finally:
            loop.close()
    
    thread = Thread(target=thread_target)
    thread.start()
    thread.join()
    
    if result_container:
        return result_container[0]
    return None, 500

@azbil_MFC_bp.route("/connect", methods=["POST"])
def connect_device():
    """連接設備 - 同步版本"""
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
        
        # 在新線程中執行異步連接操作
        result, status_code = run_async_task(
            azbil_service.connect(port, baudrate, device_id)
        )
        
        data, data_status_code = run_async_task(
            azbil_service.get_main_status()
        )
        
        # 發送 Socket.IO 事件和記錄連接日誌
        if status_code == 200:
            print(f"✅ 準備發送 Socket 事件: azbil - connected")
            
            try:
                current_app.emit_device_status('azbil', 'connected', {
                    "message": f"Azbil主氣連線成功，{port} {device_id}",
                    "port": port,
                    "address": device_id,
                    "status_data": 'connected',
                    "data": data if data_status_code == 200 else {}
                })
                print(f"✅ Socket 事件已發送完成: azbil - connected")
            except Exception as e:
                print(f"❌ Socket 事件發送失敗: {str(e)}")
            
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
            try:
                current_app.emit_device_status('azbil', 'connect_failed', {
                    "message": f"Azbil主氣連線失敗，{port} {device_id}",
                    "port": port,
                    "address": device_id,
                    "status_data": 'connected failed',
                    "data": {}
                })
                print(f"✅ Socket 事件已發送完成: azbil - connect_failed")
            except Exception as e:
                print(f"❌ Socket 事件發送失敗: {str(e)}")
                
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
        print(f"處理連接請求時出錯: {str(e)}")
        
        try:
            current_app.emit_device_status('azbil', 'connect_failed', {
                "message": f"Azbil主氣連線失敗，{port} {device_id}",
                "port": port,
                "address": device_id,
                "status_data": 'connected failed',
                "error": str(e),
                "data": {}
            })
        except Exception as emit_error:
            print(f"❌ Socket 事件發送失敗: {str(emit_error)}")
            
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
def disconnect_device():
    """斷開設備連接 - 同步版本"""
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
        
        # 取得資料，斷線失敗的時候還是要有資料
        data, data_status_code = run_async_task(
            azbil_service.get_main_status()
        )
        
        # 在新線程中執行異步斷開連接操作
        result, status_code = run_async_task(azbil_service.disconnect())
        
        if status_code == 200:
            try:
                current_app.emit_device_status('azbil', 'disconnected', {
                    "message": f"Azbil主氣中斷連線成功，{port} {device_id}",
                    "port": port,
                    "address": device_id,
                    "status_data": 'disconnected',
                    "data": {}
                })
                print(f"✅ Socket 事件已發送完成: azbil - disconnected")
            except Exception as e:
                print(f"❌ Socket 事件發送失敗: {str(e)}")
                
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
            try:
                current_app.emit_device_status('azbil', 'connected', {
                    "message": f"Azbil主氣中斷連線失敗，{port} {device_id}",
                    "port": port,
                    "address": device_id,
                    "status_data": 'disconnected failed',
                    "data": data if data_status_code == 200 else {}
                })
            except Exception as e:
                print(f"❌ Socket 事件發送失敗: {str(e)}")
                
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
        try:
            current_app.emit_device_status('azbil', 'disconnect_failed', {
                "message": f"Azbil主氣中斷連線失敗，{port} {device_id}",
                "port": port,
                "address": device_id,
                "status_data": 'disconnected failed',
                "data": data if data_status_code == 200 else {},
            })
        except Exception as emit_error:
            print(f"❌ Socket 事件發送失敗: {str(emit_error)}")
            
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
def set_flow():
    """設置流量 - 同步版本"""
    data = request.json
    flow_rate = data.get("flow", 50)
    
    with write_lock:
        result, status_code = run_async_task(azbil_service.set_flow(flow_rate))
        
        data, data_status_code = run_async_task(
            azbil_service.get_main_status()
        )
        
        # 發送 Socket.IO 事件
        if status_code == 200:
            try:
                current_app.emit_device_status('azbil', 'connected', {
                    "message": f"Azbil主氣流量設定成功: {flow_rate}",
                    "flow_rate": flow_rate,
                    "data": data if data_status_code == 200 else {}
                })
            except Exception as e:
                print(f"❌ Socket 事件發送失敗: {str(e)}")
        
    return jsonify(result), status_code
  
@azbil_MFC_bp.route("/get_status", methods=["GET"])
def get_status():
    """獲取狀態 - 同步版本"""
    result, status_code = run_async_task(azbil_service.get_status())
    
    if status_code == 200:
        try:
            current_app.emit_device_status('azbil', 'connected', {
                "message": "主氣資料取得成功",
                "data": result
            })
            print(f"✅ Socket 事件已發送完成: azbil - connected")
        except Exception as e:
            print(f"❌ Socket 事件發送失敗: {str(e)}")
            
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
def get_main_status():
    """獲取主狀態 - 同步版本"""
    result, status_code = run_async_task(azbil_service.get_main_status())
    return jsonify(result), status_code
  
@azbil_MFC_bp.route("/flow_turn_on", methods=["POST"])
def flow_turn_on():
    """開啟流量 - 同步版本"""
    with write_lock:
        result, status_code = run_async_task(azbil_service.set_flow_turn_on())
        
        data, data_status_code = run_async_task(
            azbil_service.get_main_status()
        )
        
        if status_code == 200:
            try:
                current_app.emit_device_status('azbil', 'connected', {
                    "message": "Azbil主氣流量已開啟",
                    "data": data if data_status_code == 200 else {}
                })
            except Exception as e:
                print(f"❌ Socket 事件發送失敗: {str(e)}")
        
    return jsonify(result), status_code
  
@azbil_MFC_bp.route("/flow_turn_off", methods=["POST"])
def flow_turn_off():
    """關閉流量 - 同步版本"""
    with write_lock:
        result, status_code = run_async_task(azbil_service.set_flow_turn_off())
        
        data, data_status_code = run_async_task(
            azbil_service.get_main_status()
        )
        
        if status_code == 200:
            try:
                current_app.emit_device_status('azbil', 'connected', {
                    "message": "Azbil主氣流量已關閉",
                    "data": data if data_status_code == 200 else {}
                })
            except Exception as e:
                print(f"❌ Socket 事件發送失敗: {str(e)}")
        
    return jsonify(result), status_code
  
@azbil_MFC_bp.route("/flow_turn_full", methods=["POST"])
def flow_turn_full():
    """全開流量 - 同步版本"""
    with write_lock:
        result, status_code = run_async_task(azbil_service.set_flow_turn_full())
        
        data, data_status_code = run_async_task(
            azbil_service.get_main_status()
        )
        
        if status_code == 200:
            try:
                current_app.emit_device_status('azbil', 'connected', {
                    "message": "Azbil主氣流量已設為最大",
                    "data": data if data_status_code == 200 else {}
                })
            except Exception as e:
                print(f"❌ Socket 事件發送失敗: {str(e)}")
        
    return jsonify(result), status_code
  
@azbil_MFC_bp.route("/update", methods=["POST"])
def update():
    """更新設置 - 同步版本"""
    data = request.json
    result, status_code = run_async_task(azbil_service.set_setting_update(data))
    
    if status_code == 200:
        try:
            current_app.emit_device_status('azbil', 'connected', {
                "message": "Azbil主氣設定已更新",
                "settings": data
            })
        except Exception as e:
            print(f"❌ Socket 事件發送失敗: {str(e)}")
    
    return jsonify(result), status_code

@azbil_MFC_bp.route("/restart_accumlated_flow", methods=["POST"])
def restart_accumlated_flow():
    """重置累計流量 - 同步版本"""
    with write_lock:
        result, status_code = run_async_task(azbil_service.restart_accumlated_flow())
        
        if status_code == 200:
            try:
                current_app.emit_device_status('azbil', 'connected', {
                    "message": "Azbil主氣累計流量已重置"
                })
            except Exception as e:
                print(f"❌ Socket 事件發送失敗: {str(e)}")
        
    return jsonify(result), status_code