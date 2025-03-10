from models.alicat_model import FlowControllerModel

class FlowControllerService:
    def __init__(self):
        self.model = None

    def initialize(self, port, address):
        """初始化流量控制器"""
        self.model = FlowControllerModel(port, address)
        return self.model.connect()

    def shutdown(self):
        """關閉流量控制器"""
        if self.model:
            self.model.disconnect()
            self.model = None

    def modify_flow_rate(self, flow_rate):
        """修改流量"""
        if self.model:
            self.model.set_flow_rate(flow_rate)

    def modify_pressure(self, pressure):
        """修改壓力"""
        if self.model:
            self.model.set_pressure(pressure)

    def modify_gas(self, gas):
        """修改氣體"""
        if self.model:
            self.model.set_gas(gas)

    def read_status(self):
        """讀取流量控制器的狀態"""
        if self.model:
            try:
                status = self.model.read_status()
                return {
                    "status": "success",
                    "data": status
                }
            except Exception as e:
                if "Unexpected register value" in str(e):
                    return {
                        "status": "success",
                        "data": {
                            "connected": True,
                            "message": "設備已連接，但無法讀取完整狀態"
                        }
                    }
                return {
                    "status": "error",
                    "message": str(e)
                }

    def define_mix(self, mix_no, name, gases):
        """定義混合氣"""
        if self.model:
            self.model.create_mix(mix_no, name, gases)

    def delete_mix(self, mix_no):
        """刪除混合氣"""
        if self.model:
            self.model.delete_mix(mix_no)