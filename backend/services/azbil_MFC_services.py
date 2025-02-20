from models.azbil_MFC_model import AzbilMFC
from typing import Optional, Dict, Any, Tuple
import asyncio

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
        self.loop = asyncio.get_event_loop()

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
        return result["data"], 200 if result["status"] == "success" else 400

    async def get_main_status(self) -> Tuple[Dict[str, Any], int]:
        """獲取設備主要狀態"""
        if not self.device or not self.device.is_connected():
            return {
                "status": "failure",
                "message": "設備未連接",
                "data": {}
            }, 400
        
        try:
            result = await self.device.get_main_status()
            if result["status"] == "success":
                return {
                    "status": "success",
                    "data": result["data"]
                }, 200
            else:
                return {
                    "status": "failure",
                    "message": result["message"],
                    "data": {}
                }, 400
        except Exception as e:
            return {
                "status": "failure",
                "message": f"讀取設備狀態時發生錯誤: {str(e)}",
                "data": {}
            }, 400

    async def set_flow(self, flow_rate: int) -> Tuple[Dict[str, Any], int]:
        if not self.device or not self.device.is_connected():
            return {"status": "failure", "message": "設備未連接"}, 400
        flow_rate = int(flow_rate)
        result = await self.device.set_flow(flow_rate)
        return result, 200 if result["status"] == "success" else 400
      
    async def set_flow_turn_on(self) -> Tuple[Dict[str, Any], int]:
        if not self.device or not self.device.is_connected():
            return {"status": "failure", "message": "設備未連接"}, 400
        
        result = await self.device.update_settings({"GATE_CONTROL": 1})
        
        return result, 200 if result["status"] == "success" else 400
      
    async def set_flow_turn_off(self) -> Tuple[Dict[str, Any], int]:
        if not self.device or not self.device.is_connected():
            return {"status": "failure", "message": "設備未連接"}, 400
        
        result = await self.device.update_settings({"GATE_CONTROL": 0})
        
        return result, 200 if result["status"] == "success" else 400
      
    async def set_flow_turn_full(self) -> Tuple[Dict[str, Any], int]:
        if not self.device or not self.device.is_connected():
            return {"status": "failure", "message": "設備未連接"}, 400
        
        result = await self.device.update_settings({"GATE_CONTROL": 2})
        
        return result, 200 if result["status"] == "success" else 400
      
    async def set_setting_update(self, data: Dict[str, Any]) -> Tuple[Dict[str, Any], int]:
        if not self.device or not self.device.is_connected():
            return {"status": "failure", "message": "設備未連接"}, 400
        
        result = await self.device.update_settings(data)
        
        return result, 200 if result["status"] == "success" else 400
        
    async def restart_accumlated_flow(self) -> Tuple[Dict[str, Any], int]:
        if not self.device or not self.device.is_connected():
            return {"status": "failure", "message": "設備未連接"}, 400
        
        result = await self.device.reset_accumulated_flow()
        
        return result, 200 if result["status"] == "success" else 400