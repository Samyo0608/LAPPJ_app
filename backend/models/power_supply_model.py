from dataclasses import dataclass
from typing import Optional
import serial

@dataclass
class SpikDevice:
    port: str = "COM12"
    baudrate: int = 19200
    timeout: float = 1.5  # 秒
    client: Optional[serial.Serial] = None
