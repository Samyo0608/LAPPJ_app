from dataclasses import dataclass

@dataclass
class ModbusData:
    SV: int  # 設定溫度 (Set Value)
    PV: int  # 目前溫度 (Process Value)
    SV2: int  # 緩啟動 (Soft Start)
    Gain: float  # 增益 (Gain)
    P: int  # 比例 (PID)
    I: int  # 積分 (PID)
    D: int  # 微分 (PID)
    M: int  # 模式切換 (0 = 自動, 1 = 手動)
    rAP: int  # Ramp 控制
    SLH: int  # 設定最大溫度上限
