from models.ultrasonic_model import ModbusDevice

class ModbusService:
    def __init__(self):
        self.device = None

    def connect(self, port, baudrate, device_id):
        """連接霧化器"""
        self.device = ModbusDevice(port, baudrate, device_id)
        return self.device.connect()

    def disconnect(self):
        """斷開霧化器連線"""
        if self.device:
            return self.device.disconnect()
        return {"status": "failure", "message": "設備未初始化"}

    def write_register(self, address, value):
        """寫入霧化器註冊表(Function 6)"""
        if not self.device or not self.device.is_connected():
            return {"status": "failure", "message": "霧化器未連接"}
        try:
            response = self.device.client.write_register(address, value, unit=self.device.device_id)
            if response.isError():
                return {"status": "failure", "message": "霧化器寫入失敗"}
            return {"status": "success", "message": f"成功寫入 設備ID={self.device.device_id}, 地址={hex(address)}, 數值={value}"}
        except Exception as e:
            return {"status": "failure", "message": str(e)}

    def read_register(self, address):
        """讀取霧化器註冊表(Function 3)"""
        if not self.device or not self.device.is_connected():
            return {"status": "failure", "message": "霧化器未連接"}
        try:
            response = self.device.client.read_holding_registers(address, 1, unit=self.device.device_id)
            if response.isError():
                return {"status": "failure", "message": "霧化器讀取失敗"}
            return {"status": "success", "data": response.registers[0]}
        except Exception as e:
            return {"status": "failure", "message": str(e)}
