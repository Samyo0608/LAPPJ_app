from pymodbus.client import ModbusSerialClient
from models.heater_model import ModbusData

class ModbusService:
    def __init__(self):
        self.client = None
        self.address = None

    def connect(self, port, address):
        """ 連線到 Modbus 設備 """
        self.client = ModbusSerialClient(
            method='rtu',
            port=port,
            baudrate=9600,
            parity='N',
            stopbits=1,
            bytesize=8,
            timeout=1
        )
        self.address = address
        return self.client.connect()

    def disconnect(self):
        """ 斷開 Modbus 連線 """
        if self.client:
            self.client.close()
            self.client = None

    def read_register(self, reg_addr):
        """ 讀取 Modbus Holding Register """
        if not self.client:
            return None
        response = self.client.read_holding_registers(reg_addr, 1, unit=self.address)
        if response.isError():
            return None
        return response.registers[0]

    def write_register(self, reg_addr, value):
        """ 寫入 Modbus Holding Register """
        if not self.client:
            return False
        response = self.client.write_register(reg_addr, value, unit=self.address)
        return not response.isError()

    def read_modbus_data(self):
        """ 讀取所有 Modbus 參數，並返回 `ModbusData` """
        return ModbusData(
            SV=self.read_register(0x0040) or -1,   # 設定溫度
            PV=self.read_register(0x0041) or -1,   # 目前溫度
            SV2=self.read_register(0x0042) or -1,  # 緩啟動設定
            Gain=self.read_register(0x0034) or -1, # 增益
            P=self.read_register(0x0031) or -1,    # PID 比例
            I=self.read_register(0x0032) or -1,    # PID 積分
            D=self.read_register(0x0033) or -1,    # PID 微分
            M=self.read_register(0x0025) or -1,    # 模式切換 (自動/手動)
            rAP=self.read_register(0x000D) or -1,  # Ramp 控制
            SLH=self.read_register(0x0007) or -1   # 最大溫度上限
        )

    def update_modbus_data(self, data: ModbusData):
        """ 更新 Modbus 設備參數 """
        if not self.client:
            return {"status": "failed", "error": "Modbus 未連線"}

        failed_registers = []

        if not self.write_register(0x0040, data.SV): failed_registers.append("SV")
        if not self.write_register(0x0042, data.SV2): failed_registers.append("SV2")
        if not self.write_register(0x0034, data.Gain): failed_registers.append("Gain")
        if not self.write_register(0x0031, data.P): failed_registers.append("P")
        if not self.write_register(0x0032, data.I): failed_registers.append("I")
        if not self.write_register(0x0033, data.D): failed_registers.append("D")
        if not self.write_register(0x0025, data.M): failed_registers.append("M")
        if not self.write_register(0x000D, data.rAP): failed_registers.append("rAP")
        if not self.write_register(0x0007, data.SLH): failed_registers.append("SLH")

        if failed_registers:
            return {"status": "failed", "error": f"這些參數更新失敗: {', '.join(failed_registers)}"}

        return {"status": "updated"}
