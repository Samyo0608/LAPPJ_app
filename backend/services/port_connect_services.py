import asyncio
from models.port_connect_model import PortScanner

class PortScannerService:
    def __init__(self):
        self.scanner = PortScanner()
        self.lock = asyncio.Lock()
    
    async def get_available_ports(self):
        """獲取所有可用的串口"""
        async with self.lock:
            try:
                ports = self.scanner.list_available_ports()
                return {
                    "status": "success",
                    "data": {
                        "ports": ports,
                        "count": len(ports)
                    }
                }, 200
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"掃描串口時發生錯誤: {str(e)}"
                }, 500
    
    async def check_port_status(self, port_name):
        """檢查特定串口的狀態"""
        async with self.lock:
            try:
                is_available = self.scanner.check_port_availability(port_name)
                return {
                    "status": "success",
                    "data": {
                        "port": port_name,
                        "available": is_available
                    }
                }, 200
            except Exception as e:
                return {
                    "status": "error",
                    "message": f"檢查串口時發生錯誤: {str(e)}"
                }, 500