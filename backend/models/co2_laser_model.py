import serial
import time

MODE_MAPPING = {
    0: "manual",
    1: "anc",
    2: "anv",
    3: "manual closed",
    4: "anv closed",
    5: "remote"
}

PWM_FREQ_MAPPING = {
  0: 5,
  1: 10,
  2: 20
}

class UC2000:
    """
    SYNRAD UC-2000 雷射控制器 via RS-232
    """

    def __init__(self):
        """初始化，port 尚未設定"""
        self.ser = None
        self.port = None

    def connect(self, port, baudrate=9600):
        """嘗試連接到指定的 COM Port"""
        try:
            print(f"Attempting to connect to {port}")
            self.ser = serial.Serial(
                port=port,
                baudrate=baudrate,
                bytesize=serial.EIGHTBITS,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                timeout=1
            )
            self.port = port
            
            if self.ser.is_open:
                print(f"Successfully opened {port}")
                print(f"Port settings: {self.ser.get_settings()}")
                
                # 等待設備初始化
                time.sleep(2)
                
                # 獲取初始狀態
                initial_status = self.get_status()
                if initial_status:
                    print(f"Initial status: {initial_status}")
                    
                    if initial_status.get('remote_control'):
                        print("Device already in remote control mode")
                        return True, "連接成功"
                    
                    # 嘗試設置 remote 模式
                    print("Attempting to set remote mode...")
                    if self._send_command(0x75):  # Remote mode command
                        time.sleep(2)  # 給設備更多時間進行切換
                        return True, "連接成功"
                
                return False, "無法設置CO2 LASER REMOTE 模式，可能是PORT錯誤"
                
        except serial.SerialException as e:
            print(f"Serial Exception: {str(e)}")
            return False, str(e)
        except Exception as e:
            print(f"Unexpected error: {str(e)}")
            return False, str(e)

    def disconnect(self):
        """關閉序列連接"""
        try:
            if self.ser and self.ser.is_open:
                # 返回到本地模式（假設 0x7F 是切換到本地模式的命令）
                self._send_command(0x7F)  # 請根據實際命令碼調整
                time.sleep(1)  # 等待切換完成
                
                self.ser.close()
                self.ser = None
                self.port = None
                return True, "斷開連接成功"
            return False, "設備未連接"
        except Exception as e:
            return False, str(e)

    def _send_command(self, command_byte, data_byte=None):
        """發送指令"""
        if not self.ser or not self.ser.is_open:
            print("Serial port not ready")
            return False

        try:
            print(f"Sending command: {hex(command_byte)}")
            if data_byte is not None:
                print(f"With data byte: {hex(data_byte)}")

            # 清空緩衝區
            self.ser.reset_input_buffer()
            self.ser.reset_output_buffer()

            # 發送命令
            self.ser.write(bytes([0x5B]))  # STX = 5Bh
            self.ser.write(bytes([command_byte]))

            if data_byte is not None:
                self.ser.write(bytes([data_byte]))
                checksum = (~(command_byte + data_byte)) & 0xFF
            else:
                checksum = (~command_byte) & 0xFF

            self.ser.write(bytes([checksum]))

            # 等待回應
            print("Waiting for response...")
            response = self.ser.read()
            
            if not response:
                print("No response received")
                return False

            response_hex = response.hex()
            print(f"Response received: {response_hex}")

            # 只要收到任何回應就視為成功
            return True

        except Exception as e:
            print(f"Error in _send_command: {str(e)}")
            return False

    # 解析回應數據
    def parse_status(response):        
        """解析 UC-2000 狀態數據"""
        mode_value = response[1] & 0x07  # 取得模式數值 (3-bit)
        mode_name = MODE_MAPPING.get(mode_value, "UNKNOWN")  # 對照模式名稱
        
        return {
            "mode_value": mode_value,
            "mode_name": mode_name
        }

    def get_status(self):
        """獲取控制器狀態"""
        if not self.ser or not self.ser.is_open:
            print("Serial port not open")
            return None

        # 重試機制
        for attempt in range(3):
            try:
                print(f"Attempt {attempt + 1} to get status")
                # 清空緩衝區
                self.ser.reset_input_buffer()
                self.ser.reset_output_buffer()

                self.ser.write(bytes([0x7E]))  # 發送狀態請求命令
                response = self.ser.read(5)

                if len(response) != 5:
                    print(f"Invalid status response length: {len(response)}")
                    # 如果收到的回應不完整，等待一下再重試
                    if attempt < 2:
                        time.sleep(0.5)
                        continue
                    return None
                
                mode_value = response[1] & 0x07
                mode_name = MODE_MAPPING.get(mode_value, "UNKNOWN")
                
                status = {
                    'mode': mode_value,
                    'mode_name': mode_name,
                    'remote_control': bool(response[1] & 0x08),
                    'laser_on': bool(response[1] & 0x10),
                    'gate_pull_up': bool(response[1] & 0x20),
                    'pwm_freq': PWM_FREQ_MAPPING.get((response[1] & 0xC0) >> 6, 0),
                    'lase_on_powerup': bool(response[2] & 0x01),
                    'max_pwm_95': bool(response[2] & 0x02),
                    'version': (response[2] & 0xF0) >> 4,
                    'pwm_percentage': response[3] / 2,
                    'power_percentage': response[4] / 2
                }

                print(response.hex())
                print(f"Status: {status}")
                return status

            except Exception as e:
                print(f"Error getting status on attempt {attempt + 1}: {str(e)}")
                if attempt < 2:
                    time.sleep(0.5)
                    continue
        
        return None
        
    def ensure_laser_state(self, desired_state):
        """確保雷射處於指定狀態"""
        status = self.get_status()
        if status and status.get('laser_on') != desired_state:
            command = 0x75 if desired_state else 0x76
            return self._send_command(command)
        return True
        
    def set_pwm_frequency(self, frequency):
        """設定 PWM 頻率 (5kHz, 10kHz, 20kHz)"""
        print(f"Setting PWM frequency to {frequency}")
        
        if not self.ser or not self.ser.is_open:
            print("Serial port not open")
            return False

        status = self.get_status()
        if not status or not status.get('remote_control'):
            print("Device not in remote control mode")
            return False

        # 記錄原始的雷射狀態
        original_laser_state = status.get('laser_on', False)
        print(f"Original laser state: {original_laser_state}")

        # 如果雷射是開啟的，先關閉它
        if original_laser_state:
            print("Turning off laser before frequency change")
            if not self.ensure_laser_state(False):
                print("Failed to turn off laser")
                return False
            time.sleep(1)

        freq_commands = {
            5: 0x77,   # 5 kHz
            10: 0x78,  # 10 kHz
            20: 0x79   # 20 kHz
        }

        if frequency not in freq_commands:
            print(f"Invalid frequency value: {frequency}")
            return False

        command = freq_commands[frequency]
        print(f"Using command {hex(command)} for {frequency} kHz")
        
        try:
            # 發送命令
            for attempt in range(3):  # 最多嘗試3次
                print(f"Attempt {attempt + 1} to set frequency")
                result = self._send_command(command)
                if result:
                    time.sleep(1)  # 等待設定生效
                    # 驗證設定
                    new_status = self.get_status()
                    if new_status and new_status.get('pwm_freq') == frequency:
                        print(f"Successfully set frequency to {frequency} kHz")
                        # 嘗試恢復原始雷射狀態
                        if original_laser_state:
                            print("Restoring original laser state")
                            if not self.ensure_laser_state(True):
                                print("Warning: Failed to restore laser state")
                        return True
                time.sleep(1)  # 在重試之前等待
            
            print("Failed to verify frequency setting after all attempts")
            return False
            
        except Exception as e:
            print(f"Error during frequency setting: {str(e)}")
            return False
            
        finally:
            # 確保雷射回到原始狀態
            if original_laser_state != self.get_status().get('laser_on', False):
                print("Ensuring laser returns to original state")
                self.ensure_laser_state(original_laser_state)
      
    def set_laser_enabled(self, enable):
        """開啟或關閉雷射"""
        if not self.ser or not self.ser.is_open:
            return False

        command = 0x75 if enable else 0x76  # 75h = Lase ON, 76h = Lase OFF
        return self._send_command(command)
      
    def set_pwm_percentage(self, percentage):
      """設定 PWM 佔空比(Duty cycle) (0-99%)"""
      if not self.ser or not self.ser.is_open:
          return False

      try:
          percentage = float(percentage)
      except (ValueError, TypeError):
          print(f"Invalid percentage type: {type(percentage)}")
          return False

      if not 0 <= percentage <= 99:
          return False

      data_byte = int(percentage * 2)  # 轉換為 UC-2000 格式
      return self._send_command(0x7F, data_byte)

    def set_mode(self, mode):
        if not self.ser or not self.ser.is_open:
            return False

        mode_commands = {
            "manual": 0x70,
            "anc": 0x71,
            "anv": 0x72,
            "manual_closed": 0x73,
            "anv_closed": 0x74,
            "remote": 0x75  # 遠端控制命令
        }

        if mode not in mode_commands:
            print(f"Invalid mode: {mode}")
            return False

        try:
            # 對於遠端模式，只需確保 remote_control 為 True
            if mode == 'remote':
                status = self.get_status()
                if status and status.get('remote_control'):
                    return True
            
            # 發送命令
            result = self._send_command(mode_commands[mode])
            if not result:
                return False

            time.sleep(1)  # 等待模式切換

            # 驗證是否符合預期
            final_status = self.get_status()
            if final_status:
                if mode == 'remote':
                    return final_status.get('remote_control')
                else:
                    return final_status.get('mode_name') == mode

            return False

        except Exception as e:
            print(f"Error in set_mode: {str(e)}")
            return False
      
    def set_lase_on_powerup(self, enable):
        """設定雷射開機時是否自動開啟"""
        if not self.ser or not self.ser.is_open:
            return False

        command = 0x30 if enable else 0x31  # 30h = 開機自動開雷射, 31h = 開機不開雷射
        return self._send_command(command)

    def set_max_pwm_95(self, enable):
        """設定最大 PWM 限制 (95% 或 99%)"""
        if not self.ser or not self.ser.is_open:
            print("Serial port not open")
            return False

        status = self.get_status()
        if not status or not status.get('remote_control'):
            print("Device not in remote control mode")
            return False

        command = 0x7C if enable else 0x7D
        print(f"Setting max PWM 95 with command: {hex(command)}")
        
        # 嘗試多次發送命令
        for attempt in range(3):
            print(f"Attempt {attempt + 1} to set max PWM")
            result = self._send_command(command)
            if result:
                time.sleep(1)  # 等待設定生效
                # 驗證設定
                new_status = self.get_status()
                if new_status and new_status.get('max_pwm_95') == enable:
                    print(f"Successfully set max PWM 95 to {enable}")
                    return True
                print(f"Failed to verify max PWM setting on attempt {attempt + 1}")
            time.sleep(1)  # 在重試之間等待
        
        print("Failed to set max PWM after all attempts")
        return False

    def set_gate_pull_up(self, enable):
        """設定 Gate 是否為高電位"""
        if not self.ser or not self.ser.is_open:
            print("Serial port not open")
            return False

        status = self.get_status()
        if not status or not status.get('remote_control'):
            print("Device not in remote control mode")
            return False

        command = 0x7A if enable else 0x7B
        print(f"Setting gate pull up with command: {hex(command)}")
        
        # 嘗試多次發送命令
        for attempt in range(3):
            print(f"Attempt {attempt + 1} to set gate pull up")
            if self._send_command(command):
                time.sleep(1)  # 等待設定生效
                
                # 多次嘗試驗證設定
                for verify_attempt in range(3):
                    new_status = self.get_status()
                    if new_status and new_status.get('gate_pull_up') == enable:
                        print(f"Successfully set gate pull up to {enable}")
                        return True
                    print(f"Verify attempt {verify_attempt + 1} failed, retrying...")
                    time.sleep(1)
                
            print(f"Failed attempt {attempt + 1}, retrying...")
            time.sleep(1)
        
        print("Failed to set gate pull up after all attempts")
        return False

