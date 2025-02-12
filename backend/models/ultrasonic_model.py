from dataclasses import dataclass
from pymodbus.client import ModbusSerialClient
from typing import Optional, Dict, Any, Tuple
import time

@dataclass
class ModbusDevice:
    port: str = "COM1"
    baudrate: int = 38400
    device_id: int = 1
    client: Optional[ModbusSerialClient] = None

    def verify_device(self) -> Tuple[bool, str]:
        """確認設備是否為霧化器"""
        try:
            # 讀取設備狀態 (Status_adr = 3)
            status_response = self.client.read_holding_registers(
                address=3,  # Status_adr
                count=1,
                slave=self.device_id
            )
            if status_response.isError():
                return False, "無法讀取設備狀態"
            
            print('status_response', status_response)

            # 讀取數位輸入狀態 (di_adr = 41)
            di_response = self.client.read_holding_registers(
                address=41,  # di_adr
                count=1,
                slave=self.device_id
            )
            if di_response.isError():
                return False, "無法讀取數位輸入狀態"
            
            print('di_response', di_response)

            # 這裡可以根據實際的霧化器狀態值進行驗證
            # 例如檢查特定位元或值的範圍
            status_value = status_response.registers[0]
            di_value = di_response.registers[0]

            # 在這裡加入您的霧化器特定驗證邏輯
            # 例如: 檢查狀態值是否在預期範圍內
            if 0 <= status_value <= 0xFFFF and 0 <= di_value <= 0xFFFF:
                return True, "設備驗證成功"
            
            return False, "非預期的設備狀態值"

        except Exception as e:
            return False, f"設備驗證過程發生錯誤: {str(e)}"

    def connect(self) -> Dict[str, Any]:
        """連接霧化器設備並驗證設備類型"""
        if self.client and self.client.connected:
            return {"status": "warning", "message": "設備已連接"}
        
        # 初始化 RS232 連線
        self.client = ModbusSerialClient(
            port=self.port,
            baudrate=self.baudrate,
            parity="N",
            stopbits=1,
            bytesize=8,
            timeout=1
        )

        if not self.client.connect():
            return {"status": "failure", "message": "無法連接設備，請檢查端口"}

        # 驗證設備類型
        is_valid, message = self.verify_device()
        if not is_valid:
            self.client.close()
            return {"status": "failure", "message": f"連接的設備不是霧化器: {message}"}

        return {"status": "success", "message": f"已成功連接霧化器 (Port: {self.port})"}

    def disconnect(self) -> Dict[str, Any]:
        """斷開 Modbus 連線"""
        if self.client and self.client.connected:
            self.client.close()
            return {"status": "success", "message": "設備已斷開連線"}
        return {"status": "warning", "message": "設備未連接"}

    def is_connected(self) -> bool:
        """檢查設備是否已連線"""
        return bool(self.client and self.client.connected)

    def write_command(self, command: int) -> Dict[str, Any]:
        """寫入命令到設備"""
        if not self.is_connected():
            return {"status": "failure", "message": "設備未連接"}
            
        try:
            response = self.client.write_register(
                address=1,  # Command_adr
                value=command,
                slave=self.device_id
            )
            if response.isError():
                return {"status": "failure", "message": "命令寫入失敗"}
            return {"status": "success", "message": f"成功寫入命令: {hex(command)}"}
        except Exception as e:
            return {"status": "failure", "message": f"命令寫入異常: {str(e)}"}

    def read_status(self) -> Dict[str, Any]:
        """讀取設備狀態"""
        if not self.is_connected():
            return {"status": "failure", "message": "設備未連接"}
            
        try:
            # 讀取狀態暫存器 (Status_adr = 3)
            response = self.client.read_holding_registers(
                address=3,
                count=1,
                slave=self.device_id
            )
            if response.isError():
                return {"status": "failure", "message": "狀態讀取失敗"}

            # 讀取數位輸入狀態 (di_adr = 41)
            di_response = self.client.read_holding_registers(
                address=41,
                count=1,
                slave=self.device_id
            )
            
            return {
                "status": "success", 
                "data": {
                    "status_register": response.registers[0],
                    "di_register": di_response.registers[0] if not di_response.isError() else None
                }
            }
        except Exception as e:
            return {"status": "failure", "message": f"狀態讀取異常: {str(e)}"}