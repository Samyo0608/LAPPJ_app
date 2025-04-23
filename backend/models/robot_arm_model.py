from datetime import datetime

class RobotArmModel:
    def __init__(self):
        # 連接狀態
        self.is_connected = False
        self.ip_address = ""
        self.port = 502
        self.slave_id = 5
        
        # 機械手臂啟動狀態
        self.is_robot_started = False    # R20000: 啟動機械手臂
        
        # 調整倍率相關
        self.adjustment_rate_enabled = False  # R20001: 1 調整倍率/ 0 關閉調整倍率串口
        self.adjustment_rate_value = 0       # R20002: 0~100 調整倍率數字
        
        # 調整間距高度相關
        self.height_adjustment_enabled = False  # R20004: 調整間距高度 1/開 0/關
        self.height_offset_value = 0          # R20005: 位移數(實際調整這個)
        self.actual_offset_value = 0          # R20003: 實際偏移的數字大小(儲存位)
        
        # 調整次數相關
        self.count_adjustment_enabled = False  # R20008: 次數調整 1/開 0/關
        self.count_adjustment_value = 0       # R20009: 次數調整數字(實際調整這個)
        self.actual_count_value = 0           # R20007: 次數調整數字(機器讀取這個)
        
        # 記錄操作歷史
        self.operation_history = []
        
    def add_operation_record(self, operation_type, details, success=True):
        """記錄操作歷史"""
        record = {
            "time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "operation": operation_type,
            "details": details,
            "status": "成功" if success else "失敗"
        }
        self.operation_history.append(record)
        return record
    
    def to_dict(self):
        """將模型轉換為字典格式"""
        return {
            "is_connected": self.is_connected,
            "connection_info": {
                "ip_address": self.ip_address,
                "port": self.port,
                "slave_id": self.slave_id
            },
            "robot_status": {
                "is_started": self.is_robot_started
            },
            "adjustment_rate": {
                "enabled": self.adjustment_rate_enabled,
                "value": self.adjustment_rate_value
            },
            "height_adjustment": {
                "enabled": self.height_adjustment_enabled,
                "offset_value": self.height_offset_value,
                "actual_offset": self.actual_offset_value
            },
            "count_adjustment": {
                "enabled": self.count_adjustment_enabled,
                "count_value": self.count_adjustment_value,
                "actual_count": self.actual_count_value
            }
        }
    
    # Modbus 地址對應
    MODBUS_ADDRESSES = {
        "robot_start": 0x9C41,               # R20000: 啟動機械手臂 (1/啟動)
        "adjustment_rate_enabled": 0x9C43,   # R20001: 調整倍率開關 (1/開 0/關)
        "adjustment_rate_value": 0x9C45,     # R20002: 調整倍率數字
        "actual_offset_value": 0x9C47,       # R20003: 實際偏移的數字大小(機器讀取用)
        "height_adjustment_enabled": 0x9C49,  # R20004: 調整間距高度開關 (1/開 0/關)
        "height_offset_value": 0x9C4B,       # R20005: 位移數(實際調整用)
        "actual_count_value": 0x9C4F,        # R20007: 次數調整數字(機器讀取用)
        "count_adjustment_enabled": 0x9C51,   # R20008: 次數調整開關 (1/開 0/關)
        "count_adjustment_value": 0x9C53,    # R20009: 次數調整數字(實際調整用)
    }