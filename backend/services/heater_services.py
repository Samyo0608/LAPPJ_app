from pymodbus.client import ModbusSerialClient
from models.heater_model import ModbusData
from datetime import datetime

class ModbusService:
    def __init__(self):
        self.client = None
        self.address = None

    def connect(self, port, address):
        """ 連線到 Modbus 設備 """
        try:
            self.client = ModbusSerialClient(
                port=port,
                baudrate=19200,  # 修改為 19200
                parity="N",
                stopbits=1,
                bytesize=8,
                timeout=3
            )
            self.address = int(address)
            
            # 連接診斷
            connection_status = self.client.connect()
            print(f"連接狀態: {'✅ 成功' if connection_status else '❌ 失敗'}")
            print(f"Port: {port}")
            print(f"Address: {self.address}")
            print(f"Client 狀態: {self.client.is_socket_open()}")
            
            if connection_status:
                print("串口設置:", self.client.socket.get_settings())
                
            return connection_status
                
        except Exception as e:
            print(f"❌ Modbus 連接異常: {str(e)}")
            print(f"異常類型: {type(e).__name__}")
            return False

    def disconnect(self):
        """ 斷開 Modbus 連線 """
        if self.client:
            self.client.close()
            self.client = None

    def read_register(self, reg_addr):
        """ 讀取 Modbus Holding Register """
        if not self.client:
            print("❌ Modbus 客戶端未初始化")
            return None
        try:
            print(f"📍 嘗試讀取寄存器 {hex(reg_addr)}:")
            print(f"  - Slave ID: {self.address}")
            print(f"  - 客戶端狀態: {'已連接' if self.client.connected else '未連接'}")
            
            response = self.client.read_holding_registers(
                address=reg_addr, 
                count=1, 
                slave=self.address
            )
            
            if response is None:
                print(f"❌ 讀取超時")
                return None
                
            if hasattr(response, 'isError') and response.isError():
                print(f"⚠️ 讀取錯誤: {response}")
                return None
                
            return response.registers[0] if hasattr(response, 'registers') else None
            
        except Exception as e:
            print(f"❌ 讀取異常: {type(e).__name__} - {str(e)}")
            return None

    def write_register(self, reg_addr, value):
        """ 寫入 Modbus Holding Register (對應 C# 的 write_data_to_modbus) """
        if not self.client:
            return False
        response = self.client.write_register(address=reg_addr, value=value, slave=self.address)
        if response.isError():
            print(f"⚠️ 寫入寄存器 {hex(reg_addr)} 失敗！")
            return False
        return True

    def read_modbus_data(self):
        """ 讀取所有 Modbus 參數 """
        try:
            data = ModbusData(
                # 使用文檔中的正確地址
                SV=self.read_register(0x0023) or 0,     # 0023H: SV Setting value
                PV=self.read_register(0x0041) or 0,     # 0041H: PV Process value
                SV2=self.read_register(0x0027) or 0,    # 0027H: SV2 Soft start selecting
                Gain=self.read_register(0x0016) or 0,   # 0016H: GAin
                P=self.read_register(0x0013) or 0,      # 0013H: P Proportion band
                I=self.read_register(0x0014) or 0,      # 0014H: I Integral time
                D=self.read_register(0x0015) or 0,      # 0015H: D Derivative time
                M=self.read_register(0x0025) or 0,      # 0025H: M.A Auto/Manual selecting
                rAP=self.read_register(0x000D) or 0,    # 000DH: rAP Ramp control
                SLH=self.read_register(0x0007) or 0     # 0007H: SLH High limit of set
            )
            
            return {
                "data": data.__dict__,
                "status": {
                    "connected": True,
                    "timestamp": datetime.now().isoformat()
                }
            }
            
        except Exception as e:
            print(f"❌ 讀取全部數據時發生錯誤: {str(e)}")
            return None
        
    def update_modbus_data(self, data: ModbusData):
        """ 更新 Modbus 設備參數 """
        if not self.client:
            return {"status": "failed", "message": "Modbus 未連線"}
        
        validation_errors = self.validate_data(data)

        if validation_errors:
            return {
                "status": "failed",
                "message": "數據驗證失敗",
                "details": validation_errors
            }
            
        failed_registers = []
        
        # 使用文檔中的正確地址進行寫入
        if not self.write_register(0x0023, data.SV): failed_registers.append("SV")        # 0023H: SV Setting value
        if not self.write_register(0x0027, data.SV2): failed_registers.append("SV2")      # 0027H: SV2 Soft start
        if not self.write_register(0x0016, data.Gain): failed_registers.append("Gain")    # 0016H: GAin
        if not self.write_register(0x0013, data.P): failed_registers.append("P")          # 0013H: P Proportion band
        if not self.write_register(0x0014, data.I): failed_registers.append("I")          # 0014H: I Integral time
        if not self.write_register(0x0015, data.D): failed_registers.append("D")          # 0015H: D Derivative time
        if not self.write_register(0x0025, data.M): failed_registers.append("M")          # 0025H: M.A Auto/Manual
        if not self.write_register(0x000D, data.rAP): failed_registers.append("rAP")      # 000DH: rAP Ramp control
        if not self.write_register(0x0007, data.SLH): failed_registers.append("SLH")      # 0007H: SLH High limit
        
        if failed_registers:
            return {
                "status": "failed", 
                "message": f"這些參數更新失敗: {', '.join(failed_registers)}"
            }
        return {"status": "success"}
    
    def validate_data(self, data: ModbusData):
        """ 驗證數據是否在有效範圍內 """
        validations = [
            (0 <= data.SV <= 9999, "SV 超出範圍 (0-9999)"),
            (-999 <= data.SV2 <= 9999, "SV2 超出範圍 (-999-9999)"),
            (0 <= data.Gain <= 9.9, "Gain 超出範圍 (0-9.9)"),
            (0 <= data.P <= 999, "P 超出範圍 (0-999)"),
            (0 <= data.I <= 3999, "I 超出範圍 (0-3999)"),
            (0 <= data.D <= 3999, "D 超出範圍 (0-3999)"),
            (data.M in [0, 1], "M 必須為 0 或 1"),
            (0 <= data.rAP <= 99.99, "rAP 超出範圍 (0-99.99)"),
            (0 <= data.SLH <= 9999, "SLH 超出範圍 (0-9999)")
        ]
        
        errors = [msg for valid, msg in validations if not valid]
        return errors