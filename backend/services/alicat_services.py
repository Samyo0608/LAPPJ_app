from models.alicat_model import FlowControllerModel

class FlowControllerService:
    def __init__(self):
        self.model = None

    async def initialize(self, port, address):
        # """初始化流量控制器"""
        self.model = FlowControllerModel(port, address)
        await self.model.connect()

    async def shutdown(self):
        # """關閉流量控制器"""
        if self.model:
            await self.model.disconnect()
            self.model = None

    async def modify_flow_rate(self, flow_rate):
        # """修改流量"""
        if self.model:
            await self.model.set_flow_rate(flow_rate)

    async def modify_pressure(self, pressure):
        # """修改壓力"""
        if self.model:
            await self.model.set_pressure(pressure)

    async def modify_gas(self, gas):
        # """修改氣體"""
        if self.model:
            await self.model.set_gas(gas)

    async def read_status(self):
        """讀取流量控制器的狀態"""
        if self.model:
            try:
                status = await self.model.read_status()
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

    async def define_mix(self, mix_no, name, gases):
        # """定義混合氣"""
        if self.model:
            await self.model.create_mix(mix_no, name, gases)

    async def delete_mix(self, mix_no):
        # """刪除混合氣"""
        if self.model:
            await self.model.delete_mix(mix_no)
