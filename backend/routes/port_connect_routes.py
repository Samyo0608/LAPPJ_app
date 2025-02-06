from flask import Blueprint, jsonify
from services.port_connect_services import PortScannerService

port_scanner_bp = Blueprint('port_scanner', __name__)
scanner_service = PortScannerService()

@port_scanner_bp.route('/ports', methods=['GET'])
async def get_ports():
    """獲取所有可用的串口"""
    return await scanner_service.get_available_ports()

@port_scanner_bp.route('/ports/<port_name>', methods=['GET'])
async def check_port(port_name):
    """檢查特定串口的狀態"""
    return await scanner_service.check_port_status(port_name)