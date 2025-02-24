from dataclasses import dataclass
from typing import Optional, Dict, Any, Tuple, TypedDict
import serial
import struct
import asyncio
from enum import Enum

class MFCData(TypedDict, total=False):
    GAS_TYPE: str
    FLOW_DECIMAL: Optional[int]
    TOTAL_FLOW_DECIMAL: Optional[int]
    FLOW_UNIT: Optional[int]
    TOTAL_FLOW_UNIT: Optional[int]
    GATE_CONTROL: Optional[int]
    SP_NO_SETTING: Optional[int]
    SP_0_SETTING: Optional[int]
    SP_1_SETTING: Optional[int]
    SP_2_SETTING: Optional[int]
    SP_3_SETTING: Optional[int]
    SP_4_SETTING: Optional[int]
    SP_5_SETTING: Optional[int]
    SP_6_SETTING: Optional[int]
    SP_7_SETTING: Optional[int]
    SETTING_SP_FLOW: Optional[int]
    PV_FLOW: Optional[int]
    FLOW_RATE: Optional[int]
    KEY_LOCK: Optional[int]
    FLOW_CONTROL_SETTING: Optional[int]
    SIMULATION_FLOW: Optional[int]
    FLOW_LIMIT: Optional[int]
    GATE_ERROR_FIX: Optional[int]
    FLOW_INITIAL_TEMP: Optional[int]
    DEVICE_ID_SETTING: Optional[int]
    DEVICE_INSTALL_DIR: Optional[int]
    FLOW_INPUT_LIMIT: Optional[int]
    FLOW_SENSOR_TYPE: Optional[int]
    KEY_DIRECTION: Optional[int]
    TOTAL_FLOW_LOW: Optional[int]
    TOTAL_FLOW_HIGH: Optional[int]
    TOTAL_FLOW_RESTART: Optional[int]
    
class MFCStatus(TypedDict, total=False):
    status: str
    message: str
    data: MFCData
    
class OperationType(Enum):
    READ = "read"
    WRITE = "write"
@dataclass
class AzbilMFC:
    port: str = "COM1"
    baudrate: int = 38400
    device_id: int = 1
    client: Optional[serial.Serial] = None

    # 寄存器地址定義
    REGISTERS = {
        'GAS_TYPE': 0x07E2,             # 氣體類型寄存器，讀寫皆可，0: 用戶設定, 1: Air/N2, 2: O2, 3: Ar, 4: CO2, 6: 丙烷100%, 7: 甲烷100%, 8: 丁烷100%, 11: 城市煤氣13A，寫入後需要等2秒才能生效
        'FLOW_DECIMAL': 0x07F6,        # 流量小數點寄存器，0~3(小數點)，讀寫皆可
        'TOTAL_FLOW_DECIMAL': 0x0803,  # 總流量小數點寄存器，0~3(小數點)，讀寫皆可
        'FLOW_UNIT': 0x07F5,           # 流量單位寄存器，0: mL/min, 1: L/min, 2: m^3/h，讀寫皆可
        'TOTAL_FLOW_UNIT': 0x07FB,     # 總流量單位寄存器，0: mL, 1: L, 2: m^3，讀寫皆可
        'GATE_CONTROL': 0x04B4,        # 閘閥控制寄存器，0: 閥門全關, 1: 閥門控制, 2: 閥門全開，讀寫皆可
        'SP_NO_SETTING': 0x04B5,       # SP No 設定寄存器，讀寫皆可，0~7(共8個檔位可以設定)
        'SP_0_SETTING': 0x0579,        # SP 0 設定值，讀寫皆可
        'SP_1_SETTING': 0x057A,        # SP 1 設定值，讀寫皆可
        'SP_2_SETTING': 0x057B,        # SP 2 設定值，讀寫皆可
        'SP_3_SETTING': 0x057C,        # SP 3 設定值，讀寫皆可
        'SP_4_SETTING': 0x057D,        # SP 4 設定值，讀寫皆可
        'SP_5_SETTING': 0x057E,        # SP 5 設定值，讀寫皆可
        'SP_6_SETTING': 0x057F,        # SP 6 設定值，讀寫皆可
        'SP_7_SETTING': 0x0580,        # SP 7 設定值，讀寫皆可
        'SETTING_SP_FLOW': 0x04B6,     # 使用中的流量值，只能讀取
        'PV_FLOW': 0x04B7,             # 當前流量值，只能讀取
        'FLOW_RATE': 0x04B9,           # 流量讀取/設定寄存器，讀寫皆可
        'KEY_LOCK': 0x07D1,            # 鍵盤鎖定寄存器，0: 無鎖定, 1: 特定按鍵鎖定, 2: 全部按鍵鎖定，讀寫皆可
        'FLOW_CONTROL_SETTING': 0x07D3,# 流量控制方法設定寄存器，0: 透過設定SP0~7, 1: 模擬設定, 2: 直接調整流量值，讀寫皆可
        'SIMULATION_FLOW': 0x07D6,     # 模擬流量值，0: 0~5V(PV輸出), 1: 1~5V(PV輸出), 3: 4~20mA(PV輸出), 5: 1~5V(SP輸出), 7: 4~20mA(SP輸出)，讀寫皆可
        'FLOW_LIMIT': 0x07DF,          # 流量上限設定寄存器，0: 無效, 1: 僅上限, 2: 僅下限, 3: 上下限皆成立，讀寫皆可
        'GATE_ERROR_FIX': 0x07E0,      # 閘閥異常時的做動寄存器，1: 無變化, 2: 強制全關, 3: 強制全開，讀寫皆可
        'FLOW_INITIAL_TEMP': 0x07E3,   # 流量初始溫度設定寄存器，0: 20, 1: 0, 2: 25, 3: 35，讀寫皆可，單位皆為攝氏度
        'DEVICE_ID_SETTING': 0x07EE,   # 設備 ID 設定寄存器，0: 不使用通訊功能, 1~127: 設備地址選擇，讀寫皆可
        'DEVICE_INSTALL_DIR': 0x07F2,  # 設備安裝方向設定寄存器，0: 水平, 1: 垂直向上, 2: 垂直向下，讀寫皆可
        'FLOW_INPUT_LIMIT': 0x07F3,    # 流量輸入上限設定寄存器，0: 無效, 1: 僅上限, 2: 僅下限, 3: 上下限皆有，讀寫皆可
        'FLOW_SENSOR_TYPE': 0x07F4,    # 流量感測器類型設定寄存器，0: 快速到達SV, 1: 標準, 2: 穩定優先, 3: 自訂PID，讀寫皆可
        'KEY_DIRECTION': 0x0804,       # 按鍵方向，0: LED: 左 KEY: 右, 1: LED: 下 KEY: 上, 2: LED: 上 KEY: 下, 3: LED: 右 KEY: 左，讀寫皆可
        'TOTAL_FLOW_LOW': 0x0643,      # 總流量低位字節，只能讀取
        'TOTAL_FLOW_HIGH': 0x0644,     # 總流量高位字節，只能讀取
    }
    
    # 新增寄存器的值範圍定義
    REGISTER_RANGES = {
        'GAS_TYPE': (0, 11),            # 0-11 的值範圍
        'FLOW_DECIMAL': (0, 3),         # 0-3 的值範圍
        'TOTAL_FLOW_DECIMAL': (0, 3),   # 0-3 的值範圍
        'FLOW_UNIT': (0, 2),            # 0-2 的值範圍
        'TOTAL_FLOW_UNIT': (0, 2),      # 0-2 的值範圍
        'GATE_CONTROL': (0, 2),         # 0-2 的值範圍
        'SP_NO_SETTING': (0, 7),        # 0-7 的值範圍
        'KEY_LOCK': (0, 2),             # 0-2 的值範圍
        'FLOW_CONTROL_SETTING': (0, 2),  # 0-2 的值範圍
        'SIMULATION_FLOW': (0, 7),       # 0-7 的值範圍
        'FLOW_LIMIT': (0, 3),           # 0-3 的值範圍
        'GATE_ERROR_FIX': (1, 3),       # 1-3 的值範圍
        'FLOW_INITIAL_TEMP': (0, 3),    # 0-3 的值範圍
        'DEVICE_ID_SETTING': (0, 127),  # 0-127 的值範圍
        'DEVICE_INSTALL_DIR': (0, 2),   # 0-2 的值範圍
        'FLOW_INPUT_LIMIT': (0, 3),     # 0-3 的值範圍
        'FLOW_SENSOR_TYPE': (0, 3),     # 0-3 的值範圍
        'KEY_DIRECTION': (0, 3),        # 0-3 的值範圍
        'FLOW_RATE': (0, 50000)         # 0-50000 的值範圍
    }

    # 寄存器的中文描述
    REGISTER_DESCRIPTIONS = {
        'GAS_TYPE': "氣體類型",
        'FLOW_DECIMAL': "流量小數點",
        'TOTAL_FLOW_DECIMAL': "總流量小數點",
        'FLOW_UNIT': "流量單位",
        'TOTAL_FLOW_UNIT': "總流量單位",
        'GATE_CONTROL': "閘閥控制",
        'SP_NO_SETTING': "SP No 設定",
        'KEY_LOCK': "鍵盤鎖定",
        'FLOW_CONTROL_SETTING': "流量控制方法",
        'SIMULATION_FLOW': "模擬流量",
        'FLOW_LIMIT': "流量上限設定",
        'GATE_ERROR_FIX': "閘閥異常設定",
        'FLOW_INITIAL_TEMP': "流量初始溫度",
        'DEVICE_ID_SETTING': "設備 ID",
        'DEVICE_INSTALL_DIR': "設備安裝方向",
        'FLOW_INPUT_LIMIT': "流量輸入上限",
        'FLOW_SENSOR_TYPE': "流量感測器類型",
        'KEY_DIRECTION': "按鍵方向"
    }

    def __post_init__(self):
        """確保初始化時數值型別正確"""
        self.baudrate = int(self.baudrate)
        self.device_id = int(self.device_id)
        self.write_queue = asyncio.Queue()
        self.is_writing = False  # 標記寫入狀態
        self.is_reading = False  # 標記讀取狀態
        
    async def process_write_queue(self):
        """處理等待中的寫入操作"""
        while not self.write_queue.empty():
            func, args, kwargs = await self.write_queue.get()
            self.current_operation = OperationType.WRITE
            try:
                await func(*args, **kwargs)
            finally:
                self.current_operation = None
                self.write_queue.task_done()

    def calculate_crc(self, data: bytes) -> int:
        """計算 CRC16 Modbus"""
        crc = 0xFFFF
        for byte in data:
            crc ^= byte
            for _ in range(8):
                if crc & 0x0001:
                    crc = (crc >> 1) ^ 0xA001
                else:
                    crc >>= 1
        return crc

    def verify_crc(self, data: bytes) -> bool:
        """驗證接收數據的 CRC"""
        if len(data) < 3:  # 至少需要3字節才能有效驗證
            return False
        received_crc = struct.unpack('<H', data[-2:])[0]
        calculated_crc = self.calculate_crc(data[:-2])
        return received_crc == calculated_crc
      
    def is_connected(self) -> bool:
      """檢查連線狀態"""
      return bool(self.client and self.client.is_open)

    async def send_modbus_command(self, function_code: int, register_address: int, values: Optional[int] = None) -> bytes:
        """發送 Modbus RTU 指令並等待回應"""
        is_write = function_code == 0x06

        # 如果是寫入操作，等待任何讀取操作完成
        while is_write and self.is_reading:
            await asyncio.sleep(0.1)

        # 如果是讀取操作，等待任何寫入操作完成
        while not is_write and self.is_writing:
            await asyncio.sleep(0.1)

        try:
            if is_write:
                self.is_writing = True
            else:
                self.is_reading = True

            async with asyncio.timeout(1):
                try:
                    # 構建請求
                    request = bytearray([self.device_id, function_code])
                    request += struct.pack(">H", register_address)
                    
                    if function_code == 0x03:  # 讀取寄存器
                        request += struct.pack(">H", 1)  # 讀取1個寄存器
                    elif function_code == 0x06:  # 寫入寄存器
                        request += struct.pack(">H", values if values is not None else 0)
                    
                    crc = self.calculate_crc(request)
                    request += struct.pack('<H', crc)
                    
                    # 清空接收緩衝區
                    self.client.reset_input_buffer()
                    
                    self.client.write(request)
                    await asyncio.sleep(0.1)
                    
                    # 讀取回應
                    if function_code == 0x03:  
                        response = self.client.read(7)
                    else:  
                        response = self.client.read(8)

                    if response:
                        if not self.verify_crc(response):
                            print("CRC 校驗失敗")
                            return b''

                    if len(response) >= 3 and response[1] == (function_code | 0x80):
                        error_code = response[2]
                        error_msg = {
                            1: "非法功能",
                            2: "非法數據地址",
                            3: "非法數據值",
                            4: "設備故障",
                            5: "確認",
                            6: "設備忙",
                        }.get(error_code, f"未知錯誤碼: {error_code}")
                        raise Exception(f"Modbus 異常: {error_msg}")
                    
                    return response
                        
                except Exception as e:
                    print(f"命令執行錯誤: {str(e)}")
                    raise
                finally:
                    # 確保緩衝區被清空
                    self.client.reset_input_buffer()
                    self.client.reset_output_buffer()

        finally:
            if is_write:
                self.is_writing = False
            else:
                self.is_reading = False

    async def read_flow_rate_decimal(self) -> Dict[str, Any]:
        """讀取當前流量值"""
        try:
            if not self.is_connected():
                return {"status": "failure", "message": "設備未連接"}

            response_decimal = await self.send_modbus_command(0x03, self.REGISTERS['FLOW_DECIMAL'])
            
            if response_decimal and len(response_decimal) >= 5:
                # 解析流量值 (2 bytes)
                flow_value_decimal = struct.unpack('>H', response_decimal[3:5])[0]
                if flow_value_decimal in range(0, 4):
                    return {
                        "status": "success",
                        "message": "成功讀取流量",
                        "value": flow_value_decimal
                    }
            return {"status": "failure", "message": "讀取流量失敗"}
        except Exception as e:
            return {"status": "failure", "message": f"讀取流量時發生錯誤: {str(e)}"}
          
    async def read_accumulated_flow(self) -> Dict[str, Any]:
      """讀取累計流量 (Total Flow)"""
      try:
          if not self.is_connected():
              return {"status": "failure", "message": "設備未連接"}

          # 讀取低位和高位數據
          low_response = await self.send_modbus_command(0x03, self.REGISTERS['TOTAL_FLOW_LOW'])
          high_response = await self.send_modbus_command(0x03, self.REGISTERS['TOTAL_FLOW_HIGH'])

          if not low_response or not high_response or len(low_response) < 5 or len(high_response) < 5:
              return {"status": "failure", "message": "讀取累計流量失敗"}

          # 解析低位和高位
          low_word = struct.unpack('>H', low_response[3:5])[0]
          high_word = struct.unpack('>H', high_response[3:5])[0]

          # 合併數據 (高16位 + 低16位)
          accumulated_flow = (high_word << 16) | low_word

          # 讀取小數點位數
          decimal_response = await self.send_modbus_command(0x03, self.REGISTERS['TOTAL_FLOW_DECIMAL'])
          decimal_places = struct.unpack('>H', decimal_response[3:5])[0] if decimal_response and len(decimal_response) >= 5 else 0

          # 處理小數點
          final_flow = accumulated_flow / (10 ** decimal_places)

          return {
              "status": "success",
              "message": "成功讀取累計流量",
              "value": final_flow
          }

      except Exception as e:
          return {"status": "failure", "message": f"讀取累計流量時發生錯誤: {str(e)}"}

    async def verify_device(self) -> Tuple[bool, str]:
        """確認設備是否可用"""
        try:
            # 等待設備初始化
            await asyncio.sleep(2)
            
            # 嘗試讀取流量值來驗證設備
            response = await self.read_flow_rate_decimal()
            if response["status"] == "success":
                return True, "設備驗證成功"
            
            return False, response["message"]
            
        except Exception as e:
            return False, f"設備驗證失敗: {str(e)}"

    async def connect(self) -> Dict[str, Any]:
        """連接設備並進行初始化"""
        if self.client and self.client.is_open:
            return {"status": "warning", "message": "設備已連接"}, 400
        
        try:
            self.client = serial.Serial(
                port=str(self.port),
                baudrate=int(self.baudrate),
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_EVEN,
                stopbits=serial.STOPBITS_ONE,
                timeout=1
            )

            # 檢查設備回應
            is_valid, message = await self.verify_device()
            if is_valid:
                flow_result = await self.read_flow_rate_decimal()

                if flow_result["status"] == "success":
                    return {
                        "status": "success", 
                        "message": f"已成功連接 Azbil MFC (Port: {self.port})",
                        "value": flow_result["value"]
                    }, 200
                return {"status": "failure", "message": f"Azbil MFC 連接失敗 (Port: {self.port})"}, 400
            
            self.client.close()
            return {"status": "failure", "message": f"連接失敗: {message}"}, 400
            
        except Exception as e:
            if self.client and self.client.is_open:
                self.client.close()
            return {"status": "failure", "message": f"連接請求處理失敗: {str(e)}"}, 400

    async def disconnect(self) -> Dict[str, Any]:
        """斷開連線"""
        if self.client and self.client.is_open:
            self.client.close()
            print("已斷開連線")
            return {"status": "success", "message": "設備已斷開連線"}, 200
        return {"status": "warning", "message": "設備未連接"}, 400
      
    async def get_status(self) -> MFCStatus:
        """獲取設備狀態"""
        if not self.is_connected():
            return {"status": "failure", "message": "設備未連接", "data": {}}

        try:
            status_data: MFCData = {}
            for key, address in self.REGISTERS.items():
                if address == 0x270c:
                    continue
                response = await self.send_modbus_command(0x03, address)
                if response and len(response) >= 5:
                    value = struct.unpack('>H', response[3:5])[0]
                    status_data[key] = value
            
            read_accumulated_flow = await self.read_accumulated_flow()

            if read_accumulated_flow["status"] == "success":
                status_data["TOTAL_FLOW"] = read_accumulated_flow["value"]
            else:
                status_data["TOTAL_FLOW"] = 0

            return {
                "status": "success",
                "data": status_data
            }
        except Exception as e:
            return {"status": "failure", "message": f"讀取設備狀態時發生錯誤: {str(e)}", "data": {}}

    async def update_settings(self, settings: Dict[str, int]) -> Dict[str, Any]:
        """
        更新多個設定值
        
        Args:
            settings: Dict[str, int] - 要更新的設定，格式為 {"寄存器名稱": 設定值}
            
        Returns:
            Dict[str, Any] - 包含更新結果的字典
        """
        if not self.is_connected():
            return {
                "status": "error",
                "message": "設備未連接",
                "data": {}
            }

        results = {
            "status": "success",
            "message": "設定更新完成",
            "data": {}
        }
        
        errors = []
        successes = []

        for register_name, value in settings.items():
            # 檢查寄存器是否存在
            if register_name not in self.REGISTERS:
                errors.append(f"未知的寄存器: {register_name}")
                continue

            # 檢查值範圍
            if register_name in self.REGISTER_RANGES:
                min_val, max_val = self.REGISTER_RANGES[register_name]
                if not (min_val <= value <= max_val):
                    desc = self.REGISTER_DESCRIPTIONS.get(register_name, register_name)
                    errors.append(f"{desc}的值必須在 {min_val}-{max_val} 之間")
                    continue

            try:
                async with asyncio.timeout(2):
                    # 發送設定命令
                    response = await self.send_modbus_command(
                        0x06,
                        self.REGISTERS[register_name],
                        value
                    )

                    if response:
                        # 驗證設定
                        verify_response = await self.send_modbus_command(
                            0x03,
                            self.REGISTERS[register_name]
                        )
                        
                        if verify_response and len(verify_response) >= 5:
                            actual_value = struct.unpack('>H', verify_response[3:5])[0]
                            if actual_value == value:
                                desc = self.REGISTER_DESCRIPTIONS.get(register_name, register_name)
                                successes.append(desc)
                                results["data"][register_name] = actual_value
                            else:
                                desc = self.REGISTER_DESCRIPTIONS.get(register_name, register_name)
                                errors.append(f"{desc}驗證失敗")
                        else:
                            desc = self.REGISTER_DESCRIPTIONS.get(register_name, register_name)
                            errors.append(f"{desc}驗證失敗")
                    else:
                        desc = self.REGISTER_DESCRIPTIONS.get(register_name, register_name)
                        errors.append(f"{desc}設定失敗")

            except Exception as e:
                desc = self.REGISTER_DESCRIPTIONS.get(register_name, register_name)
                errors.append(f"{desc}發生錯誤: {str(e)}")

        # 更新結果狀態
        if errors:
            results["status"] = "failure" if not successes else "success"
            results["message"] = "設備繁忙中，請重新再試一次" if not successes else "部分設定更新成功"
            results["errors"] = errors
        
        if successes:
            results["successes"] = successes

        return results

    async def get_main_status(self) -> MFCStatus:
        """獲取主要設備狀態 (減少讀取寄存器數量，加快速度)"""
        if not self.is_connected():
            return {
                "status": "failure",
                "message": "設備未連接",
                "data": {}
            }

        try:
            # 主要需要讀取的寄存器
            main_registers = [
                "FLOW_DECIMAL",
                "TOTAL_FLOW_DECIMAL",
                "FLOW_UNIT",
                "TOTAL_FLOW_UNIT",
                "SETTING_SP_FLOW",
                "GATE_CONTROL",
                "PV_FLOW",
                "FLOW_CONTROL_SETTING"
            ]

            status_data: MFCData = {}

            # 讀取主要寄存器
            for key in main_registers:
                response = await self.send_modbus_command(0x03, self.REGISTERS[key])
                if response and len(response) >= 5:
                    value = struct.unpack('>H', response[3:5])[0]
                    status_data[key] = value

            # 判斷是否需要讀取 SP 設定
            if status_data.get("FLOW_CONTROL_SETTING") == 0:
                sp_registers = [
                    "SP_NO_SETTING", "SP_0_SETTING", "SP_1_SETTING", "SP_2_SETTING",
                    "SP_3_SETTING", "SP_4_SETTING", "SP_5_SETTING", "SP_6_SETTING",
                    "SP_7_SETTING"
                ]
                for key in sp_registers:
                    response = await self.send_modbus_command(0x03, self.REGISTERS[key])
                    if response and len(response) >= 5:
                        value = struct.unpack('>H', response[3:5])[0]
                        status_data[key] = value

            read_accumulated_flow = await self.read_accumulated_flow()
            if read_accumulated_flow["status"] == "success":
                status_data["TOTAL_FLOW"] = read_accumulated_flow["value"]
            else:
                status_data["TOTAL_FLOW"] = 0

            return {
                "status": "success",
                "message": "成功讀取設備狀態",
                "data": status_data
            }
        except Exception as e:
            return {
                "status": "failure",
                "message": f"讀取設備狀態時發生錯誤: {str(e)}",
                "data": {}
            }
            
    async def set_flow(self, flow_value: int) -> Dict[str, Any]:
        """設定流量值"""
        if not self.is_connected():
            return {"status": "failure", "message": "設備未連接"}

        try:
            # 移除 operation_type 參數
            response = await self.send_modbus_command(
                0x06, 
                self.REGISTERS['FLOW_RATE'], 
                flow_value
            )
            
            if response:
                return {"status": "success", "message": f"成功設定流量"}
            return {"status": "failure", "message": "設備繁忙中，請重新再試一次"}
            
        except Exception as e:
            return {"status": "failure", "message": f"設定流量值時發生錯誤: {str(e)}"}
        
    async def reset_accumulated_flow(self) -> Dict[str, Any]:
        """將累積流量的低位和高位都設為 0"""
        if not self.is_connected():
            return {"status": "failure", "message": "設備未連接"}

        try:
            # 設定寄存器地址
            register_address = self.REGISTERS['TOTAL_FLOW_LOW']  # 假設你已經在 REGISTERS 定義了這個地址
            
            # 準備數據: 寫入 2 個寄存器 (低位和高位)
            request_data = bytearray([self.device_id, 0x10])  # Function Code 0x10
            request_data += struct.pack(">H", register_address)  # 寄存器起始地址
            request_data += struct.pack(">H", 2)  # 寫入 2 個寄存器
            request_data += struct.pack("B", 4)  # 總共 4 個字節
            request_data += struct.pack(">HH", 0x0000, 0x0000)  # 設定低位和高位為 0

            # 計算 CRC
            crc = self.calculate_crc(request_data)
            request_data += struct.pack('<H', crc)

            # 發送指令
            self.client.reset_input_buffer()
            self.client.write(request_data)
            await asyncio.sleep(0.1)

            # 讀取回應
            response = self.client.read(8)
            if response and self.verify_crc(response):
                return {"status": "success", "message": "成功將累積流量清零"}
            else:
                return {"status": "failure", "message": "寫入失敗或 CRC 驗證失敗"}

        except Exception as e:
            return {"status": "failure", "message": f"重設累積流量時發生錯誤: {str(e)}"}

