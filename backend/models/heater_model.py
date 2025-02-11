from dataclasses import dataclass
from typing import Optional

@dataclass
class ModbusData:
    SV: Optional[int] = None     # 設定溫度 (Set Value)
    PV: Optional[int] = None     # 目前溫度 (Process Value)
    SV2: Optional[int] = None    # 緩啟動 (Soft Start)
    Gain: Optional[float] = None  # 增益 (Gain)
    P: Optional[int] = None      # 比例 (PID)
    I: Optional[int] = None      # 積分 (PID)
    D: Optional[int] = None      # 微分 (PID)
    M: Optional[int] = None      # 模式切換 (0 = 自動, 1 = 手動)
    rAP: Optional[int] = None    # Ramp 控制
    SLH: Optional[int] = None    # 設定最大溫度上限