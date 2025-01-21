from flask import Blueprint, jsonify, request
import asyncio
from models.alicat_model import FlowControllerModel
from concurrent.futures import ThreadPoolExecutor, TimeoutError
import serial

alicat_bp = Blueprint('alicat', __name__)
flow_controller = None  # 全局流量控制器實例

@alicat_bp.route('/connect', methods=['POST'])
def connect():
    # """連接設備"""
    global flow_controller
    data = request.get_json()
    port = data.get('port')
    address = data.get('address', 'A')

    if not port:
        return jsonify({"status": "error", "message": "需要提供端口號"}), 400

    try:
        async def async_connect():
            global flow_controller
            
            # 如果已有連接的設備，先斷開
            try:
                if flow_controller:
                    await flow_controller.disconnect()
                    print(f"已關閉先前的連接 {flow_controller.port}")
            except Exception as e:
                print(f"斷開先前連接時發生錯誤: {e}")
                # 繼續執行，因為我們要建立新連接

            # 創建新的控制器實例
            flow_controller = FlowControllerModel(port, address)
            initial_status = await flow_controller.connect()
            
            return flow_controller.format_status_data(initial_status)

        # 使用 asyncio.run 執行異步操作
        formatted_status = asyncio.run(async_connect())
        
        return jsonify({
            "message": f"已連接到端口 {port}",
            "port": port,
            "address": address,
            "status": "success"
        }), 200

    except Exception as e:
        # 確保在發生錯誤時清理資源
        global flow_controller
        try:
            if flow_controller:
                asyncio.run(flow_controller.disconnect())
        except:
            pass
        flow_controller = None
        return jsonify({"status": "error", "message": str(e)}), 500
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

def is_port_available(port):
    # """檢查指定的端口是否有效"""
    import serial
    try:
        with serial.Serial(port, baudrate=19200, timeout=1) as ser:
            return True
    except serial.SerialException:
        return False

@alicat_bp.route('/disconnect', methods=['POST'])
def disconnect():
    # """斷開設備連接"""
    global flow_controller
    if not flow_controller:
        return jsonify({"status": "error", "message": "Device not connected"}), 400

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(flow_controller.disconnect())
        flow_controller = None
        return jsonify({"status": "success", "message": "Disconnected"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@alicat_bp.route('/status', methods=['GET'])
def get_status():
    # """獲取設備狀態"""
    if not flow_controller:
        return jsonify({"status": "error", "message": "設備未連接"}), 400

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        status = loop.run_until_complete(flow_controller.read_status())
        return jsonify({
            "status": "success", 
            "data": status
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@alicat_bp.route('/set_flow_rate', methods=['POST'])
def set_flow_rate():
    # """設定流量"""
    if not flow_controller:
        return jsonify({"status": "error", "message": "Device not connected"}), 400

    data = request.get_json()
    flow_rate = data.get('flow_rate')

    if flow_rate is None:
        return jsonify({"status": "error", "message": "Flow rate is required"}), 400

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(flow_controller.set_flow_rate(flow_rate))
        return jsonify({"status": "success", "message": f"Flow rate set to {flow_rate} slpm"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@alicat_bp.route('/gases', methods=['GET'])
def get_all_gases():
    # """獲取所有氣體資訊（標準氣體和混合氣體）"""
    if not flow_controller:
        return jsonify({"status": "error", "message": "設備未連接"}), 400

    # 獲取搜尋參數（可選）
    search_term = request.args.get('search', None)

    try:
        async def async_get_gases():
            return await flow_controller.get_all_gases(search_term)

        gases_data = asyncio.run(async_get_gases())
        return jsonify({
            "status": "success",
            "data": gases_data
        }), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500

@alicat_bp.route('/set_gas', methods=['POST'])
def set_gas():
    # """設定氣體"""
    if not flow_controller:
        return jsonify({"status": "error", "message": "Device not connected"}), 400

    data = request.get_json()
    gas = data.get('gas')

    if gas is None:
        return jsonify({"status": "error", "message": "Gas is required"}), 400

    try:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        # 如果給編號，則需要轉換成數字，如果是字串，則不需要轉換
        if isinstance(gas, str) and gas.isdigit():
            gas = int(gas)
        loop.run_until_complete(flow_controller.set_gas(gas))
        return jsonify({"status": "success", "message": f"Gas set to {gas}"}), 200
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
