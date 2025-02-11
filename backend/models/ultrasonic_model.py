from pymodbus.client import ModbusSerialClient

class ModbusDevice:
    def __init__(self, port="COM1", baudrate=38400, device_id=1):
        self.port = port
        self.baudrate = baudrate
        self.device_id = device_id
        self.client = None

    def connect(self):
        """連接 霧化器 設備 (並檢查是否為 Ultrasonic)"""
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
            return {"status": "failure", "message": "無法連接霧化器，請檢查端口"}

        # 嘗試讀取 0x00 (或其他 Ultrasonic 設備識別碼寄存器)
        try:
            response = self.client.read_holding_registers(0x00, 1, self.device_id)  # ✅ 修正參數格式
            if response.isError():
                self.client.close()
                return {"status": "failure", "message": "連接的設備不是 Ultrasonic，已自動斷開連線"}

            # **這裡替換為你的 Ultrasonic 設備應該返回的值**
            if response.registers[0] != 1234:  # 假設 Ultrasonic 設備會返回 1234
                self.client.close()
                return {"status": "failure", "message": "連接的設備不是 Ultrasonic，已自動斷開"}

            return {"status": "success", "message": f"已成功連接 Ultrasonic 設備 (Port: {self.port})"}
        
        except Exception as e:
            self.client.close()
            return {"status": "failure", "message": f"設備檢測失敗: {str(e)}"}

    def disconnect(self):
        """斷開 Modbus 連線"""
        if self.client and self.client.connected:
            self.client.close()
            return {"status": "success", "message": "設備已斷開連線"}
        return {"status": "warning", "message": "設備未連接"}

    def is_connected(self):
        """檢查設備是否已連線"""
        return self.client and self.client.connected
