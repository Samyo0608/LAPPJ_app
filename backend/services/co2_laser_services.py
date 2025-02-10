import asyncio
from models.co2_laser_model import UC2000

class UC2000Service:
    """管理 UC2000 設備"""
    
    def __init__(self):
        self.controller = UC2000()
        self.lock = asyncio.Lock()

    async def connect(self, port):
        """連接 UC-2000"""
        async with self.lock:
            try:
                # 先嘗試連接
                result = self.controller.connect(port)
                if isinstance(result, tuple):
                    success, message = result
                else:
                    success, message = result, "連接成功"

                if not success:
                    print(f"Connection failed: {message}")
                    return {"status": "failure", "message": f"連線失敗: {message}"}, 500
                
                # 連接成功後稍等一下
                await asyncio.sleep(1)
                
                # 檢查設備狀態
                status = self.controller.get_status()
                if status is None:
                    print("Failed to get status")
                    # 不要斷開連接，讓後續操作還能嘗試
                    return {
                        "status": "success",
                        "message": f"CO2 雷射控制器 {port} 連接成功，但無法獲取狀態",
                        "data": {
                            "mode": 0,
                            "mode_name": "unknown",
                            "remote_control": False,
                            "laser_on": False,
                            "gate_pull_up": False,
                            "pwm_freq": 0,
                            "lase_on_powerup": False,
                            "max_pwm_95": False,
                            "version": 0,
                            "pwm_percentage": 0,
                            "power_percentage": 0
                        }
                    }, 200

                print(f"Got status: {status}")
                return {
                    "status": "success", 
                    "message": f"成功連接到雷射控制器 {port}",
                    "data": status
                }, 200

            except Exception as e:
                try:
                    self.controller.disconnect()
                except:
                    pass
                return {"status": "failure", "message": f"連線錯誤: {str(e)}"}, 500

    async def disconnect(self):
        """斷開 UC-2000 連線"""
        async with self.lock:
            success, message = self.controller.disconnect()
            if success:
                return {"status": "success", "message": message}, 200
            return {"status": "failure", "message": message}, 400

    async def get_status(self):
        """獲取 UC-2000 狀態 (確保不與寫入衝突)"""
        async with self.lock:
            status = self.controller.get_status()
            if status:
                print(f"狀態: {status}")
                return {"status": "success", "data": status}, 200
            return {"status": "failure", "message": "無法獲取設備狀態"}, 500

    async def set_pwm_frequency(self, freq):
        """設定 PWM 頻率"""
        async with self.lock:
            try:
                print(f"Service: Setting PWM frequency to {freq}")
                if self.controller.set_pwm_frequency(freq):
                    # 再次檢查狀態以確認設定
                    await asyncio.sleep(1)
                    status = self.controller.get_status()
                    if status and status.get('pwm_freq') == freq:
                        return {
                            "status": "success",
                            "message": f"PWM 設置為 {freq} kHz",
                            "data": status
                        }, 200
                    return {
                        "status": "failure",
                        "message": "PWM 頻率設定失敗，無法驗證新設定"
                    }, 400
                return {"status": "failure", "message": "PWM 頻率設定失敗"}, 400
            except Exception as e:
                return {"status": "failure", "message": f"設定失敗: {str(e)}"}, 500

    async def set_laser_enabled(self, enable):
        """啟用或關閉雷射"""
        async with self.lock:
            if self.controller.set_laser_enabled(enable):
                return {"status": "success", "message": f"雷射 {'開啟' if enable else '關閉'}"}, 200
            return {"status": "failure", "message": "設定失敗"}, 400

    async def set_pwm_percentage(self, percentage):
        """設置 PWM 佔空比"""
        async with self.lock:
            if self.controller.set_pwm_percentage(percentage):
                return {"status": "success", "message": f"PWM 設置為 {percentage}%"}, 200
            return {"status": "failure", "message": "設定失敗"}, 400

    async def set_mode(self, mode):
        async with self.lock:
            valid_modes = {
                "manual", "anc", "anv", 
                "manual_closed", "manual closed",
                "anv_closed", "anv closed",
                "remote"
            }
            
            normalized_mode = mode.lower().strip()
            
            if normalized_mode not in valid_modes and normalized_mode.replace("_", " ") not in valid_modes:
                return {
                    "status": "failure", 
                    "message": f"無效的模式: {mode}. 有效的模式為: manual, anc, anv, manual_closed, anv_closed, remote"
                }, 400

            if self.controller.set_mode(mode):
                # 對於 remote 模式，直接返回當前狀態
                if mode.lower().strip() == 'remote':
                    status = self.controller.get_status()
                    return {
                        "status": "success", 
                        "message": "已進入遠端控制模式",
                        "data": status
                    }, 200
                
                return {
                    "status": "success", 
                    "message": f"模式設置為 {mode}"
                }, 200
            
            return {
                "status": "failure", 
                "message": "設定失敗"
            }, 400

    async def set_lase_on_powerup(self, enable):
        """設定雷射開機時是否自動開啟"""
        async with self.lock:
            if self.controller.set_lase_on_powerup(enable):
                return {"status": "success", "message": f"開機時雷射 {'開啟' if enable else '關閉'}"}, 200
            return {"status": "failure", "message": "設定失敗"}, 400

    async def set_max_pwm_95(self, enable):
        """設定最大 PWM 限制"""
        async with self.lock:
            if self.controller.set_max_pwm_95(enable):
                return {"status": "success", "message": f"最大 PWM 限制設置為 {'95%' if enable else '99%'}"}, 200
            return {"status": "failure", "message": "設定失敗"}, 400

    async def set_gate_pull_up(self, enable):
        """設定 Gate Pull Up 狀態"""
        async with self.lock:
            if self.controller.set_gate_pull_up(enable):
                return {"status": "success", "message": f"Gate {'高電位' if enable else '低電位'}"}, 200
            return {"status": "failure", "message": "設定失敗"}, 400

    async def verify_status(self, retries=5, delay=2.0):
        """增加重試次數和間隔，確保設備有足夠時間更新狀態"""
        for i in range(retries):
            status = self.controller.get_status()
            if status:
                return status
            print(f"Failed to get status, attempt {i + 1} of {retries}")
            await asyncio.sleep(delay)  # **每次重試等待更長時間**
        return None

    async def update_all_settings(self, settings):
        """一次性更新所有設定"""
        async with self.lock:
            try:
                # 獲取初始狀態
                initial_status = self.controller.get_status()
                if not initial_status:
                    return {"status": "failure", "message": "無法獲取設備狀態"}, 400

                print(f"Initial status: {initial_status}")
                original_laser_state = initial_status.get('laser_on', False)
                print(f"Initial laser state: {original_laser_state}")

                # 確保雷射是關閉的
                if original_laser_state:
                    print("Turning off laser before settings update")
                    if not self.controller.set_laser_enabled(False):
                        return {"status": "failure", "message": "無法關閉雷射"}, 400
                    await asyncio.sleep(1)

                # 嘗試切換到 remote 模式
                print("Attempting to enter remote mode")
                if not self.controller.set_mode('remote'):
                    return {"status": "failure", "message": "無法進入遠端控制模式"}, 400
                
                await asyncio.sleep(1)

                # 確認是否成功進入 remote 模式
                status = self.controller.get_status()
                if not status or not status.get('remote_control'):
                    return {"status": "failure", "message": "無法確認遠端控制模式"}, 400

                # 開始更新設定
                print("Starting settings update")

                # 更新 PWM 頻率
                if 'pwm_freq' in settings:
                    print(f"Setting PWM frequency to: {settings['pwm_freq']}")
                    if not self.controller.set_pwm_frequency(settings['pwm_freq']):
                        return {"status": "failure", "message": "PWM 頻率設定失敗"}, 400
                    await asyncio.sleep(1)

                # 更新 PWM 限制
                if 'max_pwm_95' in settings:
                    print(f"Setting max PWM 95 to: {settings['max_pwm_95']}")
                    if not self.controller.set_max_pwm_95(settings['max_pwm_95']):
                        return {"status": "failure", "message": "最大 PWM 限制設定失敗"}, 400
                    await asyncio.sleep(1)

                # 更新 Gate Pull Up
                if 'gate_pull_up' in settings:
                    print(f"Setting gate pull up to: {settings['gate_pull_up']}")
                    if not self.controller.set_gate_pull_up(settings['gate_pull_up']):
                        return {"status": "failure", "message": "Gate Pull Up 設定失敗"}, 400
                    await asyncio.sleep(1)

                # 更新開機自動開啟設定
                if 'lase_on_powerup' in settings:
                    print(f"Setting lase on powerup to: {settings['lase_on_powerup']}")
                    if not self.controller.set_lase_on_powerup(settings['lase_on_powerup']):
                        return {"status": "failure", "message": "開機設定失敗"}, 400
                    await asyncio.sleep(1)

                # 更新操作模式（如果需要且不是 remote）
                if 'mode' in settings and settings['mode'] != 'remote':
                    print(f"Setting mode to: {settings['mode']}")
                    if not self.controller.set_mode(settings['mode']):
                        return {"status": "failure", "message": "模式設定失敗"}, 400
                    await asyncio.sleep(1)

                # 等待設定保存
                print("Waiting for settings to save...")
                await asyncio.sleep(6)

                # 恢復原始雷射狀態
                print(f"Restoring laser state to: {original_laser_state}")
                if not self.controller.set_laser_enabled(original_laser_state):
                    return {"status": "failure", "message": "無法恢復雷射狀態"}, 400
                await asyncio.sleep(1)

                # 獲取最終狀態進行驗證
                final_status = self.controller.get_status()
                if not final_status:
                    return {"status": "failure", "message": "無法獲取最終狀態"}, 400

                print(f"Final status: {final_status}")

                # 驗證設定
                settings_verified = True
                if 'pwm_freq' in settings and final_status.get('pwm_freq') != settings['pwm_freq']:
                    settings_verified = False
                if 'max_pwm_95' in settings and final_status.get('max_pwm_95') != settings['max_pwm_95']:
                    settings_verified = False
                if 'gate_pull_up' in settings and final_status.get('gate_pull_up') != settings['gate_pull_up']:
                    settings_verified = False
                if 'lase_on_powerup' in settings and final_status.get('lase_on_powerup') != settings['lase_on_powerup']:
                    settings_verified = False

                if not settings_verified:
                    return {"status": "failure", "message": "無法驗證所有設定都已正確更新"}, 400

                return {
                    "status": "success", 
                    "message": "所有設定已更新並保存",
                    "data": final_status
                }, 200

            except Exception as e:
                print(f"Error in update_all_settings: {str(e)}")
                # 嘗試恢復雷射狀態
                try:
                    self.controller.set_laser_enabled(original_laser_state)
                except:
                    pass
                return {"status": "failure", "message": f"設定失敗: {str(e)}"}, 500

