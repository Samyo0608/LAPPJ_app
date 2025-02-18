from models.azbil_MFC_model import AzbilMFC
from typing import Optional, Dict, Any, Tuple

GAS_TYPE_MAP = {
    0: "用戶設定",
    1: "Air/N2",
    2: "O2",
    3: "Ar",
    4: "CO2",
    6: "丙烷100%",
    7: "甲烷100%",
    8: "丁烷100%",
    11: "城市煤氣13A"
}

FLOW_UNIT_MAP = {
    0: "mL/min",
    1: "L/min",
    2: "m^3/h"
}

TOTAL_FLOW_UNIT_MAP = {
    0: "mL",
    1: "L",
    2: "m^3"
}

GATE_CONTROL_MAP = {
    0: "閥門全關",
    1: "閥門控制",
    2: "閥門全開"
}

KEY_LOCK_MAP = {
    0: "無鎖定",
    1: "特定按鍵鎖定",
    2: "全部按鍵鎖定"
}

FLOW_CONTROL_SETTING_MAP = {
    0: "透過設定SP0~7",
    1: "模擬設定",
    2: "直接調整流量值"
}

SIMULATION_FLOW_MAP = {
    0: "0~5V(PV輸出)",
    1: "1~5V(PV輸出)",
    3: "4~20mA(PV輸出)",
    5: "1~5V(SP輸出)",
    7: "4~20mA(SP輸出)"
}

FLOW_LIMIT_MAP = {
    0: "無效",
    1: "僅上限",
    2: "僅下限",
    3: "上下限皆成立"
}

GATE_ERROR_FIX_MAP = {
    1: "無變化",
    2: "強制全關",
    3: "強制全開"
}

FLOW_INITIAL_TEMP_MAP = {
    0: 20,
    1: 0,
    2: 25,
    3: 35
}

DEVICE_INSTALL_DIR_MAP = {
    0: "水平",
    1: "垂直向上",
    2: "垂直向下"
}

FLOW_INPUT_LIMIT_MAP = {
    0: "無效",
    1: "僅上限",
    2: "僅下限",
    3: "上下限皆有"
}

FLOW_SENSOR_TYPE_MAP = {
    0: "快速",
    1: "標準",
    2: "穩定優先",
    3: "自訂PID"
}

KEY_DIRECTION_MAP = {
    0: "LED: 左 KEY: 右",
    1: "LED: 下 KEY: 上",
    2: "LED: 上 KEY: 下",
    3: "LED: 右 KEY: 左"
}

class AzbilMFCService:
    def __init__(self):
        self.device: Optional[AzbilMFC] = None

    async def connect(self, port: str, baudrate: int, device_id: int) -> Tuple[Dict[str, Any], int]:
        self.device = AzbilMFC(port, baudrate, device_id)
        result = await self.device.connect()
        return result

    async def disconnect(self) -> Tuple[Dict[str, Any], int]:
        if self.device:
            result = await self.device.disconnect()
            return result
        return {"status": "failure", "message": "Azbil MFC中斷連線失敗"}, 400
      
    async def get_status(self) -> Tuple[Dict[str, Any], int]:
        if not self.device or not self.device.is_connected():
            return {"status": "failure", "message": "設備未連接"}, 400
        result = await self.device.get_status()
        # 處理回傳值
        if result["status"] == "success":
            data = result["data"]
            data["GAS_TYPE"] = GAS_TYPE_MAP.get(data["GAS_TYPE"], "- -")
            data["FLOW_UNIT"] = FLOW_UNIT_MAP.get(data["FLOW_UNIT"], "- -")
            data["TOTAL_FLOW_UNIT"] = TOTAL_FLOW_UNIT_MAP.get(data["TOTAL_FLOW_UNIT"], "- -")
            data["GATE_CONTROL"] = GATE_CONTROL_MAP.get(data["GATE_CONTROL"], "- -")
            data["KEY_LOCK"] = KEY_LOCK_MAP.get(data["KEY_LOCK"], "- -")
            data["FLOW_CONTROL_SETTING"] = FLOW_CONTROL_SETTING_MAP.get(data["FLOW_CONTROL_SETTING"], "- -")
            data["SIMULATION_FLOW"] = SIMULATION_FLOW_MAP.get(data["SIMULATION_FLOW"], "- -")
            data["FLOW_LIMIT"] = FLOW_LIMIT_MAP.get(data["FLOW_LIMIT"], "- -")
            data["GATE_ERROR_FIX"] = GATE_ERROR_FIX_MAP.get(data["GATE_ERROR_FIX"], "- -")
            data["FLOW_INITIAL_TEMP"] = FLOW_INITIAL_TEMP_MAP.get(data["FLOW_INITIAL_TEMP"], "- -")
            data["DEVICE_INSTALL_DIR"] = DEVICE_INSTALL_DIR_MAP.get(data["DEVICE_INSTALL_DIR"], "- -")
            data["FLOW_INPUT_LIMIT"] = FLOW_INPUT_LIMIT_MAP.get(data["FLOW_INPUT_LIMIT"], "- -")
            data["FLOW_SENSOR_TYPE"] = FLOW_SENSOR_TYPE_MAP.get(data["FLOW_SENSOR_TYPE"], "- -")
            data["KEY_DIRECTION"] = KEY_DIRECTION_MAP.get(data["KEY_DIRECTION"], "- -")
            result["data"] = data
        return result["data"], 200 if result["status"] == "success" else 400

    async def set_flow(self, flow_rate: int) -> Tuple[Dict[str, Any], int]:
        if not self.device or not self.device.is_connected():
            return {"status": "failure", "message": "設備未連接"}, 400
        result = await self.device.set_flow_rate(flow_rate)
        return result, 200 if result["status"] == "success" else 400