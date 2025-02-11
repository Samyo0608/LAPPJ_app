import asyncio
from pymodbus.client import ModbusSerialClient  # 改回同步版本
from models.heater_model import ModbusData
from datetime import datetime

class ModbusService:
    def __init__(self):
        self.client = None
        self.address = None
        self._lock = asyncio.Lock()
        
    def connect(self, port, address):
        """ 連線到 Heater """
        try:
            self.client = ModbusSerialClient(
                port=port,
                baudrate=19200,
                parity="N",
                stopbits=1,
                bytesize=8,
                timeout=3
            )
            self.address = int(address)
            
            # 先檢查連接是否成功
            if not self.client.connect():
                return {"status": "failure", "message": f"無法連接到端口 {port}"}, 500
                
            # 連接成功後，測試讀取一個重要寄存器
            test_value = self.read_register(0x0041)  # 讀取 PV 值
            if test_value is None:
                self.disconnect()
                return {
                    "status": "failure", 
                    "message": f"端口 {port} 連接成功但無法讀取數據，可能不是正確的設備"
                }, 500

            # 讀取初始數據
            data = ModbusData(
                SV=self.read_register(0x0023) or 0,
                PV=self.read_register(0x0041) or 0,
                SV2=self.read_register(0x0027) or 0,
                Gain=self.read_register(0x0016) or 0,
                P=self.read_register(0x0013) or 0,
                I=self.read_register(0x0014) or 0,
                D=self.read_register(0x0015) or 0,
                M=self.read_register(0x0025) or 0,
                rAP=self.read_register(0x000D) or 0,
                SLH=self.read_register(0x0007) or 0,
                decimal_point=self.read_register(0x0019) or 0
            )

            return {
                "status": "success",
                "message": f"Heater 連接成功，地址: {address}，端口: {port}",
                "data": data.__dict__
            }, 200
                
        except Exception as e:
            if self.client:
                self.disconnect()
            return {
                "status": "failure",
                "message": f"連接異常: {str(e)}"
            }, 500

    def disconnect(self):
        """ 斷開 Heater 連線 """
        if self.client:
            self.client.close()
            self.client = None

    def get_decimal_point_setting(self):
        """ 讀取小數點設定 """
        if not self.client:
            print("Heater未初始化")
            return None
        try:
            response = self.client.read_holding_registers(
                address=0x0019, 
                count=1, 
                slave=self.address
            )
            
            if response is None or (hasattr(response, 'isError') and response.isError()):
                return 0  # 如果無法讀取，預設為無小數點
                
            return response.registers[0] if hasattr(response, 'registers') else 0
                
        except Exception as e:
            print(f"讀取小數點設定異常: {type(e).__name__} - {str(e)}")
            return 0

    def read_register(self, reg_addr):
        """ 讀取 Heater Holding Register """
        if not self.client:
            print("Heater未初始化")
            return None
        try:
            response = self.client.read_holding_registers(
                address=reg_addr, 
                count=1, 
                slave=self.address
            )
            
            if response is None:
                return None
                
            if hasattr(response, 'isError') and response.isError():
                print(f"讀取錯誤: {response}")
                return None
                
            value = response.registers[0] if hasattr(response, 'registers') else None
            
            if value is not None:
                decimal_point = self.get_decimal_point_setting()
                
                # PV 和 SV 都需要轉換，因為這是設備返回的實際值
                if decimal_point == 1 and reg_addr == 0x0041:  # PV 和 SV 都需要轉換
                    print(f"讀取到的原始值: {value}, 寄存器: {hex(reg_addr)}")  # 添加調試信息
                    return value / 10.0
                elif reg_addr == 0x0016:  # Gain
                    return value / 10.0
                elif reg_addr == 0x000D:  # rAP
                    return value / 100.0
                        
            return value
                    
        except Exception as e:
            print(f"讀取異常: {type(e).__name__} - {str(e)}")
            return None
    
    def update_modbus_data(self, data: ModbusData):
        """ 更新 Heater 參數 """
        if not self.client:
            return {"status": "failure", "message": "Modbus 未連線"}
        
        # 獲取非 None 的值
        data_dict = {k: v for k, v in data.__dict__.items() if v is not None}
        
        # 驗證提供的數據
        validation_errors = self.validate_partial_data(data_dict)
        if validation_errors:
            return {
                "status": "failure",
                "message": "數據驗證失敗",
                "details": validation_errors
            }
        
        failed_registers = []
        # 所有可能的更新映射
        update_map = {
            'SV': (0x0023, "SV"),
            'SV2': (0x0027, "SV2"),
            'Gain': (0x0016, "Gain"),
            'P': (0x0013, "P"),
            'I': (0x0014, "I"),
            'D': (0x0015, "D"),
            'M': (0x0025, "M"),
            'rAP': (0x000D, "rAP"),
            'SLH': (0x0007, "SLH"),
            'decimal_point': (0x0019, "decimal_point")
        }
        
        # 只更新提供的參數
        for param_name, value in data_dict.items():
            if param_name in update_map:
                addr, name = update_map[param_name]
                if not self.write_register(addr, value):
                    failed_registers.append(name)
        
        if failed_registers:
            return {
                "status": "failure", 
                "message": f"這些參數更新失敗: {', '.join(failed_registers)}"
            }
        return {
            "status": "success",
            "message": "溫度參數更新成功"
            }

    def validate_partial_data(self, data_dict):
        """ 驗證部分數據是否在有效範圍內 """
        validations = []
        
        # 只驗證提供的參數
        if 'SV' in data_dict:
            validations.append((0 <= data_dict['SV'] <= 9999, "SV 超出範圍 (0-9999)"))
        if 'SV2' in data_dict:
            validations.append((-999 <= data_dict['SV2'] <= 9999, "SV2 超出範圍 (-999-9999)"))
        if 'Gain' in data_dict:
            validations.append((0 <= data_dict['Gain'] <= 9.9, "Gain 超出範圍 (0-9.9)"))
        if 'P' in data_dict:
            validations.append((0 <= data_dict['P'] <= 999, "P 超出範圍 (0-999)"))
        if 'I' in data_dict:
            validations.append((0 <= data_dict['I'] <= 3999, "I 超出範圍 (0-3999)"))
        if 'D' in data_dict:
            validations.append((0 <= data_dict['D'] <= 3999, "D 超出範圍 (0-3999)"))
        if 'M' in data_dict:
            validations.append((data_dict['M'] in [0, 1], "M 必須為 0 或 1"))
        if 'rAP' in data_dict:
            validations.append((0 <= data_dict['rAP'] <= 99.99, "rAP 超出範圍 (0-99.99)"))
        if 'SLH' in data_dict:
            validations.append((0 <= data_dict['SLH'] <= 9999, "SLH 超出範圍 (0-9999)"))
        
        errors = [msg for valid, msg in validations if not valid]
        return errors
    
    def write_register(self, reg_addr, value):
        """ 寫入 Heater Holding Register """
        if not self.client:
            print("Modbus未初始化")
            return False
        try:
            value = int(value)  # 直接將收到的值寫入，讓前端負責轉換
            print(f"寫入寄存器 {hex(reg_addr)}:")
            print(f"  - Slave ID: {self.address}")
            print(f"  - 值: {value}")
            
            response = self.client.write_register(
                address=reg_addr,
                value=value,
                slave=self.address
            )
            
            return not (response.isError() if hasattr(response, 'isError') else True)
            
        except Exception as e:
            print(f"寫入異常: {type(e).__name__} - {str(e)}")
            return False
        
    def read_modbus_data(self):
        """ 讀取所有 Heater 參數 """
        try:
            data = {
                "SV": self.read_register(0x0023),
                "PV": self.read_register(0x0041),
                "SV2": self.read_register(0x0027),
                "Gain": self.read_register(0x0016),
                "P": self.read_register(0x0013),
                "I": self.read_register(0x0014),
                "D": self.read_register(0x0015),
                "M": self.read_register(0x0025),
                "rAP": self.read_register(0x000D),
                "SLH": self.read_register(0x0007),
                "decimal_point": self.read_register(0x0019) or 0
            }
            
            return {
                "data": data,
                "status": "success"
            }
                
        except Exception as e:
            print(f"讀取全部數據時發生錯誤: {str(e)}")
            return None