from typing import Dict, Any, Optional
from models.ultrasonic_model import ModbusDevice

class ModbusService:
    def __init__(self):
        self.device: Optional[ModbusDevice] = None

    def connect(self, port: str, baudrate: int, device_id: int) -> Dict[str, Any]:
        """連接霧化器"""
        try:
            self.device = ModbusDevice(port, baudrate, device_id)
            return self.device.connect()
        except Exception as e:
            return {"status": "failure", "message": f"連接異常: {str(e)}"}

    def disconnect(self) -> Dict[str, Any]:
        """斷開霧化器連線"""
        if self.device:
            return self.device.disconnect()
        return {"status": "failure", "message": "設備未初始化"}

    def turn_on(self) -> Dict[str, Any]:
        """開啟霧化器"""
        if not self.device or not self.device.is_connected():
            return {"status": "failure", "message": "霧化器未連接"}
        
        try:
            # 0x0100 + 7 = 0x0107 開啟命令
            command = 0x0107
            result = self.device.write_command(command)
            if result["status"] == "success":
                return {"status": "success", "message": "霧化器已開啟"}
            return result
        except Exception as e:
            return {"status": "failure", "message": f"開啟操作失敗: {str(e)}"}

    def turn_off(self) -> Dict[str, Any]:
        """關閉霧化器"""
        if not self.device or not self.device.is_connected():
            return {"status": "failure", "message": "霧化器未連接"}
        
        try:
            # 0x0100 + 8 = 0x0108 關閉命令
            command = 0x0108
            result = self.device.write_command(command)
            if result["status"] == "success":
                return {"status": "success", "message": "霧化器已關閉"}
            return result
        except Exception as e:
            return {"status": "failure", "message": f"關閉操作失敗: {str(e)}"}

    def get_status(self) -> Dict[str, Any]:
        """獲取霧化器狀態"""
        if not self.device or not self.device.is_connected():
            return {"status": "failure", "message": "霧化器未連接"}
        
        try:
            status_result = self.device.read_status()
            if status_result["status"] != "success":
                return status_result
                
            status_value = status_result["data"]
            return {
                "status": "success",
                "data": {
                    "raw_status": status_value,
                    "is_running": bool(status_value & 0x0001)
                }
            }
        except Exception as e:
            return {"status": "failure", "message": f"狀態讀取失敗: {str(e)}"}