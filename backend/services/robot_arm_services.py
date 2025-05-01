from pymodbus.client import ModbusTcpClient
from models.robot_arm_model import RobotArmModel

class RobotArmService:
    def __init__(self):
        self.model = RobotArmModel()
        self.client = None
    
    def connect(self, ip_address, port=502, slave_id=5):
        """連接到機械手臂的 PLC"""
        try:
            self.client = ModbusTcpClient(ip_address, port=port)
            connection = self.client.connect()
            
            if connection:
                self.model.is_connected = True
                self.model.ip_address = ip_address
                self.model.port = port
                self.model.slave_id = slave_id
                
                # 連接成功後，讀取當前設定值
                self._read_current_settings()
                
                operation_details = f"成功連接到 {ip_address}:{port}, Slave ID: {slave_id}"
                self.model.add_operation_record("連接", operation_details, True)
                return True, "連接成功"
            else:
                operation_details = f"無法連接到 {ip_address}:{port}"
                self.model.add_operation_record("連接", operation_details, False)
                return False, "連接失敗"
                
        except Exception as e:
            operation_details = f"連接錯誤: {str(e)}"
            self.model.add_operation_record("連接", operation_details, False)
            return False, f"連接錯誤: {str(e)}"
    
    def disconnect(self):
        """中斷連接"""
        if self.client and self.model.is_connected:
            try:
                self.client.close()
                self.model.is_connected = False
                
                operation_details = f"成功從 {self.model.ip_address}:{self.model.port} 中斷連接"
                self.model.add_operation_record("斷線", operation_details, True)
                return True, "中斷連接成功"
            except Exception as e:
                operation_details = f"中斷連接錯誤: {str(e)}"
                self.model.add_operation_record("斷線", operation_details, False)
                return False, f"中斷連接錯誤: {str(e)}"
        else:
            return False, "尚未連接"
    
    def set_adjustment_rate(self, enabled, value=None):
        """設定調整倍率"""
        if not self._check_connection():
            return False, "未連接到設備"
        
        try:
            # 先將啟用狀態設為 1
            enable_result = self.client.write_register(
                address=self.model.MODBUS_ADDRESSES["adjustment_rate_enabled"],
                value=1,
                slave=self.model.slave_id
            )
            
            enable_success = not enable_result.isError()
            if not enable_success:
                operation_details = "啟用調整倍率失敗"
                self.model.add_operation_record("設定調整倍率", operation_details, False)
                return False, "啟用調整倍率失敗"
            
            # 設定調整倍率值
            value_success = True
            if value is not None:
                value_result = self.client.write_register(
                    address=self.model.MODBUS_ADDRESSES["adjustment_rate_value"],
                    value=int(value),
                    slave=self.model.slave_id
                )
                value_success = not value_result.isError()
            
            # 更新模型中的狀態
            if value_success:
                self.model.adjustment_rate_enabled = enabled
                if value is not None:
                    self.model.adjustment_rate_value = int(value)
                
                operation_details = f"調整倍率 {'啟用' if enabled else '禁用'}"
                if value is not None:
                    operation_details += f", 倍率值: {value}"
                
                self.model.add_operation_record("設定調整倍率", operation_details, True)
                
                # 無論成功與否，最後都將啟用狀態設為 0
                self.client.write_register(
                    address=self.model.MODBUS_ADDRESSES["adjustment_rate_enabled"],
                    value=0,
                    slave=self.model.slave_id
                )
                
                return True, "設定調整倍率成功"
            else:
                operation_details = "設定調整倍率值失敗"
                self.model.add_operation_record("設定調整倍率", operation_details, False)
                
                # 設定失敗也要將啟用狀態設為 0
                self.client.write_register(
                    address=self.model.MODBUS_ADDRESSES["adjustment_rate_enabled"],
                    value=0,
                    slave=self.model.slave_id
                )
                
                return False, "設定調整倍率值失敗"
                
        except Exception as e:
            operation_details = f"設定調整倍率錯誤: {str(e)}"
            self.model.add_operation_record("設定調整倍率", operation_details, False)
            
            # 發生例外時也要嘗試將啟用狀態設為 0
            try:
                self.client.write_register(
                    address=self.model.MODBUS_ADDRESSES["adjustment_rate_enabled"],
                    value=0,
                    slave=self.model.slave_id
                )
            except:
                pass  # 忽略在例外處理中可能發生的錯誤
                
            return False, f"設定調整倍率錯誤: {str(e)}"
    
    def set_height_adjustment(self, enabled, offset_value=None):
        """設定調整間距高度"""
        if not self._check_connection():
            return False, "未連接到設備"
        
        try:
            # 設定啟用/禁用狀態
            result1 = self.client.write_register(
                address=self.model.MODBUS_ADDRESSES["height_adjustment_enabled"],
                value=1 if enabled else 0,
                slave=self.model.slave_id
            )
            
            success1 = not result1.isError()
            
            # 如果有指定值且啟用，則設定位移數
            success2 = True
            if enabled and offset_value is not None:
                result2 = self.client.write_register(
                    address=self.model.MODBUS_ADDRESSES["height_offset_value"],
                    value=int(offset_value),
                    slave=self.model.slave_id
                )
                success2 = not result2.isError()
            
            if success1 and success2:
                self.model.height_adjustment_enabled = enabled
                if enabled and offset_value is not None:
                    self.model.height_offset_value = int(offset_value)
                    # 實際應用中可能需要延遲後讀取實際偏移值
                    # self._read_actual_offset_value()
                
                operation_details = f"調整間距高度 {'啟用' if enabled else '禁用'}"
                if enabled and offset_value is not None:
                    operation_details += f", 位移值: {offset_value}"
                
                self.model.add_operation_record("設定調整間距高度", operation_details, True)
                return True, "設定調整間距高度成功"
            else:
                operation_details = f"設定調整間距高度失敗"
                self.model.add_operation_record("設定調整間距高度", operation_details, False)
                return False, "設定調整間距高度失敗"
                
        except Exception as e:
            operation_details = f"設定調整間距高度錯誤: {str(e)}"
            self.model.add_operation_record("設定調整間距高度", operation_details, False)
            return False, f"設定調整間距高度錯誤: {str(e)}"
    
    def set_count_adjustment(self, enabled, count_value=None):
        """設定調整次數"""
        if not self._check_connection():
            return False, "未連接到設備"
        
        try:
            # 設定啟用/禁用狀態
            result1 = self.client.write_register(
                address=self.model.MODBUS_ADDRESSES["count_adjustment_enabled"],
                value=1 if enabled else 0,
                slave=self.model.slave_id
            )
            
            success1 = not result1.isError()
            
            # 如果有指定值且啟用，則設定次數值
            success2 = True
            if enabled and count_value is not None:
                result2 = self.client.write_register(
                    address=self.model.MODBUS_ADDRESSES["count_adjustment_value"],
                    value=int(count_value),
                    slave=self.model.slave_id
                )
                success2 = not result2.isError()
            
            if success1 and success2:
                self.model.count_adjustment_enabled = enabled
                if enabled and count_value is not None:
                    self.model.count_adjustment_value = int(count_value)
                    # 實際應用中可能需要延遲後讀取實際次數值
                    # self._read_actual_count_value()
                
                operation_details = f"調整次數 {'啟用' if enabled else '禁用'}"
                if enabled and count_value is not None:
                    operation_details += f", 次數值: {count_value}"
                
                self.model.add_operation_record("設定調整次數", operation_details, True)
                return True, "設定調整次數成功"
            else:
                operation_details = f"設定調整次數失敗"
                self.model.add_operation_record("設定調整次數", operation_details, False)
                return False, "設定調整次數失敗"
                
        except Exception as e:
            operation_details = f"設定調整次數錯誤: {str(e)}"
            self.model.add_operation_record("設定調整次數", operation_details, False)
            return False, f"設定調整次數錯誤: {str(e)}"
    
    def read_status(self):
        """讀取當前機械手臂的狀態"""
        if not self._check_connection():
            return False, "未連接到設備", None
        
        try:
            self._read_current_settings()

            return True, "讀取狀態成功", self.model.to_dict()
        except Exception as e:
            operation_details = f"讀取狀態錯誤: {str(e)}"
            self.model.add_operation_record("讀取狀態", operation_details, False)
            return False, f"讀取狀態錯誤: {str(e)}", None
    
    def _check_connection(self):
        """檢查連接狀態"""
        return self.client is not None and self.model.is_connected
    
    def _read_current_settings(self):
        """讀取當前所有設定值"""
        if not self._check_connection():
            return False
        
        try:
            # 批量讀取，可優化性能
            response = self.client.read_holding_registers(
                address=0x9C40,  # 起始地址
                count=20,        # 讀取數量
                slave=self.model.slave_id
            )
            
            if not response.isError():
                registers = response.registers
                
                # 解析讀取的數據
                self.model.adjustment_rate_enabled = bool(registers[3])  # 0x9C43 - R20001
                self.model.adjustment_rate_value = registers[5]          # 0x9C45 - R20002
                self.model.actual_offset_value = registers[7]            # 0x9C47 - R20003
                self.model.height_adjustment_enabled = bool(registers[9]) # 0x9C49 - R20004
                self.model.height_offset_value = registers[11]           # 0x9C4B - R20005
                self.model.actual_count_value = registers[15]            # 0x9C4F - R20007
                self.model.count_adjustment_enabled = bool(registers[17]) # 0x9C51 - R20008
                self.model.count_adjustment_value = registers[19]        # 0x9C53 - R20009
                
                operation_details = "讀取當前設定成功"
                self.model.add_operation_record("讀取設定", operation_details, True)
                return True
            else:
                operation_details = "讀取當前設定失敗"
                self.model.add_operation_record("讀取設定", operation_details, False)
                return False
        except Exception as e:
            operation_details = f"讀取當前設定錯誤: {str(e)}"
            self.model.add_operation_record("讀取設定", operation_details, False)
            return False
    
    def _read_actual_offset_value(self):
        """讀取實際偏移值"""
        if not self._check_connection():
            return False
        
        try:
            response = self.client.read_holding_registers(
                address=self.model.MODBUS_ADDRESSES["actual_offset_value"],
                count=1,
                slave=self.model.slave_id
            )
            
            if not response.isError():
                self.model.actual_offset_value = response.registers[0]
                return True
            return False
        except:
            return False
    
    def _read_actual_count_value(self):
        """讀取實際次數值"""
        if not self._check_connection():
            return False
        
        try:
            response = self.client.read_holding_registers(
                address=self.model.MODBUS_ADDRESSES["actual_count_value"],
                count=1,
                slave=self.model.slave_id
            )
            
            if not response.isError():
                self.model.actual_count_value = response.registers[0]
                return True
            return False
        except:
            return False
          
    def reset_robot_signal(self):
        """歸零機械手臂啟動信號"""
        if not self._check_connection():
            return False, "未連接到設備"
        
        try:
            # 將啟動信號重置為 0
            result = self.client.write_register(
                address=self.model.MODBUS_ADDRESSES["robot_start"],
                value=0,
                slave=self.model.slave_id
            )
            
            success = not result.isError()
            
            if success:
                self.model.is_robot_started = False
                
                operation_details = "機械手臂啟動信號歸零"
                self.model.add_operation_record("重置啟動信號", operation_details, True)
                return True, "機械手臂啟動信號歸零成功"
            else:
                operation_details = "機械手臂啟動信號歸零失敗"
                self.model.add_operation_record("重置啟動信號", operation_details, False)
                return False, "機械手臂啟動信號歸零失敗"
                
        except Exception as e:
            operation_details = f"重置啟動信號錯誤: {str(e)}"
            self.model.add_operation_record("重置啟動信號", operation_details, False)
            RobotArmService.connect(self, "192.168.0.5")
            return True, f"重置啟動信號錯誤: {str(e)}, 已重新連線"
        
    def start_robot(self, start=True):
        """啟動或停止機械手臂
        
        Args:
            start (bool): True 啟動機械手臂, False 停止機械手臂
            
        Returns:
            tuple: (success, message)
        """
        if not self._check_connection():
            return False, "未連接到設備"
        
        try:
            # 設定啟動/停止狀態
            result = self.client.write_register(
                address=self.model.MODBUS_ADDRESSES["robot_start"],
                value=1 if start else 0,
                slave=self.model.slave_id
            )
            
            success = not result.isError()
            
            if success:
                self.model.is_robot_started = start
                
                operation_details = f"機械手臂 {'啟動' if start else '停止'}"
                self.model.add_operation_record("控制機械手臂", operation_details, True)
                return True, f"機械手臂{'啟動' if start else '停止'}成功"
            else:
                operation_details = f"機械手臂 {'啟動' if start else '停止'} 失敗"
                self.model.add_operation_record("控制機械手臂", operation_details, False)
                return False, f"機械手臂{'啟動' if start else '停止'}失敗"
                
        except Exception as e:
            operation_details = f"控制機械手臂錯誤: {str(e)}"
            self.model.add_operation_record("控制機械手臂", operation_details, False)
            RobotArmService.connect(self, "192.168.0.5")
            return True, f"控制機械手臂錯誤: {str(e)}, 已重新連線"