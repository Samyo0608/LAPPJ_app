from typing import Dict, Any, Optional
from models.ultrasonic_model import ModbusDevice
import time

class ModbusService:
    def __init__(self):
        self.device: Optional[ModbusDevice] = None
        self.last_command = None  # 用於記錄最後發送的命令
        self.is_device_running = False  # 用於記錄設備運行狀態

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
            command = 0x0107
            result = self.device.write_command(command)
            if result["status"] == "success":
                # 記錄最後一次命令
                self.last_command = command
                return {"status": "success", "message": "霧化器已開啟"}
            return result
        except Exception as e:
            return {"status": "failure", "message": f"開啟操作失敗: {str(e)}"}

    def turn_off(self) -> Dict[str, Any]:
        """關閉霧化器"""
        if not self.device or not self.device.is_connected():
            return {"status": "failure", "message": "霧化器未連接"}
        
        try:
            command = 0x0108
            result = self.device.write_command(command)
            if result["status"] == "success":
                # 記錄最後一次命令
                self.last_command = command
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
                
            status_data = status_result["data"]
            if not isinstance(status_data, dict):
                return {"status": "failure", "message": "狀態資料格式錯誤"}
            
            # 我們可以使用一個內部記錄來跟踪最後一次發送的命令
            # 這裡假設我們已經在turn_on/turn_off時設置了self.last_command
            if hasattr(self, 'last_command'):
                is_running = self.last_command == 0x0107  # 開啟命令
            else:
                # 如果沒有記錄，默認使用之前的邏輯
                status_register = status_data.get("status_register")
                is_running = bool(status_register & 0x0200) if status_register is not None else None
            
            return {
                "status": "success",
                "data": {
                    **status_data,  # 保留所有原始狀態數據
                    "is_running": is_running  # 使用我們的邏輯判斷
                }
            }
        except Exception as e:
            return {"status": "failure", "message": f"狀態讀取失敗: {str(e)}"}