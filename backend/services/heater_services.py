import asyncio
from pymodbus.client import AsyncModbusSerialClient  # 改用異步客戶端
from models.heater_model import ModbusData
from datetime import datetime

class ModbusService:
    def __init__(self):
        self.client = None
        self.address = None
        self.lock = asyncio.Lock()  # 添加鎖來控制並發

    async def connect(self, port, address):
        """ 連線到 Modbus 設備 """
        async with self.lock:  # 使用鎖確保連接操作的原子性
            try:
                self.client = AsyncModbusSerialClient(
                    port=port,
                    baudrate=19200,
                    parity="N",
                    stopbits=1,
                    bytesize=8,
                    timeout=3
                )
                self.address = int(address)
                
                # 先檢查連接是否成功
                if not await self.client.connect():
                    return {"status": "failure", "message": f"無法連接到端口 {port}"}, 500
                    
                # 連接成功後，測試讀取一個重要寄存器
                test_value = await self.read_register(0x0041)
                if test_value is None:
                    await self.disconnect()
                    return {
                        "status": "failure", 
                        "message": f"端口 {port} 連接成功但無法讀取數據，可能不是正確的設備"
                    }, 500

                data = ModbusData(
                    SV=await self.read_register(0x0023) or 0,
                    PV=await self.read_register(0x0041) or 0,
                    SV2=await self.read_register(0x0027) or 0,
                    Gain=await self.read_register(0x0016) or 0,
                    P=await self.read_register(0x0013) or 0,
                    I=await self.read_register(0x0014) or 0,
                    D=await self.read_register(0x0015) or 0,
                    M=await self.read_register(0x0025) or 0,
                    rAP=await self.read_register(0x000D) or 0,
                    SLH=await self.read_register(0x0007) or 0
                )

                return {
                    "status": "success",
                    "message": f"Heater 連接成功，地址: {address}，端口: {port}",
                    "data": data.__dict__
                }, 200
                    
            except Exception as e:
                if self.client:
                    await self.disconnect()
                return {
                    "status": "failure",
                    "message": f"連接異常: {str(e)}"
                }, 500

    async def disconnect(self):
        """ 斷開 Modbus 連線 """
        async with self.lock:
            if self.client:
                await self.client.close()
                self.client = None

    async def read_register(self, reg_addr):
        """ 讀取 Modbus Holding Register """
        async with self.lock:
            if not self.client:
                print("Modbus 客戶端未初始化")
                return None
            try:
                response = await self.client.read_holding_registers(
                    address=reg_addr, 
                    count=1, 
                    slave=self.address
                )
                
                if response is None:
                    return None
                    
                if hasattr(response, 'isError') and response.isError():
                    print(f"讀取錯誤: {response}")
                    return None
                    
                return response.registers[0] if hasattr(response, 'registers') else None
                
            except Exception as e:
                print(f"讀取異常: {type(e).__name__} - {str(e)}")
                return None

    async def write_register(self, reg_addr, value):
        """ 寫入 Modbus Holding Register """
        async with self.lock:
            if not self.client:
                return False
            try:
                response = await self.client.write_register(
                    address=reg_addr, 
                    value=value, 
                    slave=self.address
                )
                return not (response.isError() if hasattr(response, 'isError') else True)
            except Exception as e:
                print(f"寫入異常: {str(e)}")
                return False

    async def read_modbus_data(self):
        """ 讀取所有 Modbus 參數 """
        async with self.lock:
            try:
                data = ModbusData(
                    SV=await self.read_register(0x0023) or 0,
                    PV=await self.read_register(0x0041) or 0,
                    SV2=await self.read_register(0x0027) or 0,
                    Gain=await self.read_register(0x0016) or 0,
                    P=await self.read_register(0x0013) or 0,
                    I=await self.read_register(0x0014) or 0,
                    D=await self.read_register(0x0015) or 0,
                    M=await self.read_register(0x0025) or 0,
                    rAP=await self.read_register(0x000D) or 0,
                    SLH=await self.read_register(0x0007) or 0
                )
                
                return {
                    "data": data.__dict__,
                    "status": "success",
                }
                
            except Exception as e:
                print(f"讀取全部數據時發生錯誤: {str(e)}")
                return None

    async def update_modbus_data(self, data: ModbusData):
        """ 更新 Modbus 設備參數 """
        async with self.lock:
            if not self.client:
                return {"status": "failure", "message": "Modbus 未連線"}
            
            validation_errors = self.validate_data(data)
            if validation_errors:
                return {
                    "status": "failure",
                    "message": "數據驗證失敗",
                    "details": validation_errors
                }
                
            failed_registers = []
            
            updates = [
                (0x0023, data.SV, "SV"),
                (0x0027, data.SV2, "SV2"),
                (0x0016, data.Gain, "Gain"),
                (0x0013, data.P, "P"),
                (0x0014, data.I, "I"),
                (0x0015, data.D, "D"),
                (0x0025, data.M, "M"),
                (0x000D, data.rAP, "rAP"),
                (0x0007, data.SLH, "SLH")
            ]
            
            for addr, value, name in updates:
                if not await self.write_register(addr, value):
                    failed_registers.append(name)
            
            if failed_registers:
                return {
                    "status": "failure", 
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