import asyncio
import serial
from serial.serialutil import SerialException
from typing import Optional, Dict, Any
from alicat import FlowController

class AsyncReentrantLock:
    """可重入的異步鎖"""
    def __init__(self):
        self._lock = asyncio.Lock()
        self._owner = None
        self._count = 0

    async def acquire(self):
        current = asyncio.current_task()
        if self._owner == current:
            self._count += 1
            return True
        await self._lock.acquire()
        self._owner = current
        self._count = 1
        return True

    def release(self):
        current = asyncio.current_task()
        if self._owner != current:
            raise RuntimeError("鎖不是由當前 task 持有，無法釋放")
        self._count -= 1
        if self._count == 0:
            self._owner = None
            self._lock.release()

    async def __aenter__(self):
        await self.acquire()
        return self

    async def __aexit__(self, exc_type, exc, tb):
        self.release()

class FlowControllerModel:
    def __init__(self, port: str, address: str):
        self.port = port
        self.address = address
        self.ser: Optional[serial.Serial] = None
        self.timeout = 1
        self.lock = AsyncReentrantLock()

    def check_device_connection(self) -> bool:
        """檢查設備連接狀態"""
        try:
            print(f"正在嘗試連接 {self.port}...")
            with serial.Serial(
                self.port, 
                baudrate=19200,
                timeout=self.timeout
            ) as ser:
                ser.reset_input_buffer()
                ser.reset_output_buffer()
                
                command = f"{self.address}\r".encode("ascii")
                ser.write(command)
                
                response = ser.read_until(b'\r')
                if response:
                    print(f"收到回應: {response}")
                    return True
                print("未收到回應")
                return False
                    
        except SerialException as e:
            if "PermissionError" in str(e):
                print(f"{self.port} 無法訪問，可能被其他程式使用中")
            elif "FileNotFoundError" in str(e):
                print(f"找不到 {self.port}")
            else:
                print(f"串口錯誤: {e}")
            return False
        except Exception as e:
            print(f"未預期的錯誤: {e}")
            return False

    def _parse_response(self, response: bytes) -> Dict[str, Any]:
        """解析設備回應"""
        try:
            parts = response.decode('ascii').strip().split()
            if len(parts) >= 6:
                return {
                    "pressure": float(parts[1]),
                    "temperature": float(parts[2]),
                    "volumetric_flow": float(parts[3]),
                    "mass_flow": float(parts[4]),
                    "setpoint": float(parts[5]),
                    "gas": parts[-1] if len(parts) > 6 else "Unknown"
                }
            return {}
        except Exception as e:
            print(f"解析回應失敗: {e}")
            return {}

    def _send_command(self, command: str) -> Optional[bytes]:
        """發送命令到設備並讀取回應"""
        if not self.ser:
            return None
            
        try:
            self.ser.reset_input_buffer()
            self.ser.reset_output_buffer()
            
            # 添加結束符
            if not command.endswith('\r'):
                command = f"{command}\r"
            
            # 輸出偵錯資訊
            print(f"發送命令: {command.encode('ascii')}")
            
            self.ser.write(command.encode('ascii'))
            response = self.ser.read_until(b'\r')
            
            # 輸出偵錯資訊
            print(f"收到回應: {response}")
            
            return response
        except Exception as e:
            print(f"發送命令失敗: {e}")
            return None

    async def connect(self) -> Dict[str, Any]:
        """建立與流量控制器的連線"""          
        async with self.lock:
            try:
                self.ser = serial.Serial(
                    self.port,
                    baudrate=19200,
                    timeout=self.timeout
                )
                
                await asyncio.sleep(1)
                
                response = self._send_command(self.address)
                
                if not response:
                    print("⚠️ 第一次喚醒失敗，重試...")
                    await asyncio.sleep(1)  # **等待 1 秒**
                    response = self._send_command(self.address)
                if response:
                    status = self._parse_response(response)
                    if status:
                        return status
                        
                raise Exception("無法獲取設備狀態")
                
            except Exception as e:
                if self.ser:
                    self.ser.close()
                    self.ser = None
                raise Exception(f"連接設備時發生錯誤: {e}")

    async def disconnect(self):
        """關閉與流量控制器的連線"""
        async with self.lock:
            if self.ser:
                try:
                    self.ser.close()
                finally:
                    self.ser = None

    async def read_status(self) -> Dict[str, Any]:
        """讀取設備狀態"""
        async with self.lock:
            if not self.ser:
                raise Exception("設備未連接")
                
            response = self._send_command(self.address)
            if response:
                status = self._parse_response(response)
                if status:
                    return status
                    
            raise Exception("無法讀取設備狀態")

    async def set_gas(self, gas: str):
        async with self.lock:
            try:
                print(f"🔄 嘗試切換氣體至: {gas}")

                # **1. 取得氣體列表 (已掃描過的氣體)**
                all_standard_gases = {
                    0: {'name': 'Air'}, 1: {'name': 'Ar'}, 2: {'name': 'CH4'}, 3: {'name': 'CO'},
                    4: {'name': 'CO2'}, 5: {'name': 'C2H6'}, 6: {'name': 'H2'}, 7: {'name': 'He'},
                    8: {'name': 'N2'}, 9: {'name': 'N2O'}, 10: {'name': 'Ne'}, 11: {'name': 'O2'},
                    12: {'name': 'C3H8'}, 13: {'name': 'nC4H10'}, 14: {'name': 'C2H2'}, 
                    15: {'name': 'C2H4'}, 16: {'name': 'iC4H10'}, 17: {'name': 'Kr'}, 
                    18: {'name': 'Xe'}, 19: {'name': 'SF6'}, 20: {'name': 'C-25'}, 21: {'name': 'C-10'}, 
                    22: {'name': 'C-8'}, 23: {'name': 'C-2'}, 24: {'name': 'C-75'}, 25: {'name': 'He-25'}, 
                    26: {'name': 'He-75'}, 27: {'name': 'A1025'}, 28: {'name': 'Star29'}, 29: {'name': 'P-5'}
                }

                custom_mixtures = {}
                for mix_no in range(236, 256):
                    try:
                        # 嘗試切換到每個可能的混合氣體編號
                        response = self._send_command(f"{self.address}G{mix_no}")
                        if response:
                            # 再次讀取狀態來獲取氣體名稱
                            status_response = self._send_command(self.address)
                            if status_response:
                                status = self._parse_response(status_response)
                                if status and 'gas' in status:
                                    custom_mixtures[mix_no] = {
                                        'name': status['gas']
                                    }
                    except Exception as e:
                        print(f"檢查混合氣體 {mix_no} 時發生錯誤: {e}")

                all_standard_gases.update(custom_mixtures)

                print('mix', custom_mixtures)
                print('all_standard_gases', all_standard_gases)

                # **2. 確保 `gas` 存在於 `custom_mixtures`**
                gas_number = next((k for k, v in all_standard_gases.items() if v["name"] == gas), None)
                if gas_number is None:
                    raise ValueError(f"不支援的氣體類型: {gas}")

                print(f"氣體 {gas} 的對應編號為: {gas_number}")

                # **3. 發送氣體切換命令**
                gas_command = f"{self.address}G{gas_number}"
                print(f"發送氣體切換命令: {gas_command}")
                response = self._send_command(gas_command)
                await asyncio.sleep(1)

                # **4. 儲存變更**
                print("🔄 嘗試儲存氣體設定...")
                self._send_command(f"{self.address}S")
                await asyncio.sleep(1)

                # **5. 確認設備是否正確切換**
                for _ in range(3):
                    verify_status = self._parse_response(self._send_command(self.address))
                    print(f"確認變更後的狀態: {verify_status}")

                    if verify_status.get('gas') == gas:
                        return {"message": f"成功切換至 {gas}", "status": "success"}

                    await asyncio.sleep(1)  # **等待設備應用變更**

                raise Exception(f"切換氣體失敗，當前氣體仍為 {verify_status.get('gas', '未知')}")

            except Exception as e:
                print(f"錯誤: {e}")
                return {"message": str(e), "status": "error"}

    async def set_flow_rate(self, flow_rate: float):
        """設定流量"""
        async with self.lock:
            if not self.ser:
                raise Exception("設備未連接")
                
            response = self._send_command(f"{self.address}S{flow_rate:.3f}")
            if not response:
                raise Exception("設定流量失敗")

    async def create_mix(self, mix_no: int, name: str, gases: Dict[str, float]):
        async with self.lock:
            try:
                print(f"🛠️ 嘗試建立混合氣體: {name}, 編號: {mix_no}, 成分: {gases}")

                # **1. 手動定義標準氣體與對應編號**
                standard_gases = {
                    "Air": 0, "Ar": 1, "CH4": 2, "CO": 3, "CO2": 4, "C2H6": 5, "H2": 6, "He": 7,
                    "N2": 8, "N2O": 9, "Ne": 10, "O2": 11, "C3H8": 12, "nC4H10": 13, "C2H2": 14,
                    "C2H4": 15, "iC4H10": 16, "Kr": 17, "Xe": 18, "SF6": 19, "C-25": 20, "C-10": 21,
                    "C-8": 22, "C-2": 23, "C-75": 24, "He-25": 25, "He-75": 26, "A1025": 27,
                    "Star29": 28, "P-5": 29
                }

                # **2. 檢查輸入的氣體是否存在**
                gas_parts = []
                for gas, percentage in gases.items():
                    if gas not in standard_gases:
                        raise ValueError(f"❌ 不支援的氣體: {gas}")

                    gas_number = standard_gases[gas]  # 取得氣體對應的編號
                    gas_parts.append(f"{percentage:.1f} {gas_number}")

                gas_str = " ".join(gas_parts)

                # **3. 正確的 `AGM` 格式**
                mix_command = f"AGM {name} {mix_no} {gas_str}"
                print(f"📡 發送混合氣體創建命令: {mix_command}")
                response = self._send_command(mix_command)
                await asyncio.sleep(2)

                # **4. 儲存變更**
                print("💾 儲存混合氣體...")
                self._send_command(f"{self.address}S")
                await asyncio.sleep(1)

                # **5. 驗證是否成功**
                for _ in range(3):
                    self._send_command(f"{self.address}G{mix_no}")  # 嘗試切換到新混合氣
                    await asyncio.sleep(2)

                    verify_status = self._parse_response(self._send_command(self.address))
                    print(f"✅ 驗證混合氣體狀態: {verify_status}")

                    if verify_status.get("gas") == name:
                        return {"message": f"✅ 成功創建混合氣 {name}", "status": "success"}

                raise Exception("❌ 無法確認混合氣體是否成功創建")

            except Exception as e:
                print(f"❌ 錯誤: {e}")
                return {"message": str(e), "status": "error"}

    async def delete_mix(self, mix_no: int):
        async with self.lock:
            try:
                if not self.ser:
                    raise Exception("設備未連接")

                command = f"{self.address}GD {mix_no}"
                response = self._send_command(command)
                await asyncio.sleep(1)

                # **驗證是否成功刪除**
                verify_status = self._send_command(f"{self.address}G{mix_no}")
                if "Unknown" in verify_status:
                    return {"message": f"成功刪除混合氣體 {mix_no}", "status": "success"}

                raise Exception(f"刪除混合氣體失敗，當前仍存在: {verify_status}")

            except Exception as e:
                print(f"錯誤: {e}")
                return {"message": str(e), "status": "error"}
            
    def format_status_data(self, data: dict) -> dict:
        """格式化狀態數據 (保持向後兼容)"""
        try:
            return {
                "pressure": data.get("pressure", "N/A"),
                "temperature": data.get("temperature", "N/A"),
                "mass_flow": data.get("mass_flow", "N/A"),
                "volumetric_flow": data.get("volumetric_flow", "N/A"),
                "setpoint": data.get("setpoint", "N/A"),
                "gas": data.get("gas", "N/A"),
                "raw_data": data  # 保留原始數據以供參考
            }
        except Exception as e:
            print(f"格式化數據錯誤: {e}")
            return {"error": str(e)}

    async def get_all_gases(self, search_term: str = None) -> Dict[str, Any]:
        """獲取所有氣體資訊（標準氣體和混合氣體）"""
        async with self.lock:
            if not self.ser:
                raise Exception("設備未連接")
                
            try:
                # 首先獲取當前氣體
                current_response = self._send_command(self.address)
                current_gas = self._parse_response(current_response).get('gas', 'Unknown') if current_response else 'Unknown'

                # 標準氣體列表
                standard_gases = [
                    'Air', 'Ar', 'CH4', 'CO', 'CO2', 'C2H6', 'H2', 'He',
                    'N2', 'N2O', 'Ne', 'O2', 'C3H8', 'nC4H10', 'C2H2',
                    'C2H4', 'iC4H10', 'Kr', 'Xe', 'SF6', 'C-25', 'C-10',
                    'C-8', 'C-2', 'C-75', 'He-25', 'He-75', 'A1025',
                    'Star29', 'P-5'
                ]

                # 獲取混合氣體
                custom_mixtures = {}
                for mix_no in range(236, 256):
                    try:
                        # 嘗試切換到每個可能的混合氣體編號
                        response = self._send_command(f"{self.address}G{mix_no}")
                        if response:
                            # 再次讀取狀態來獲取氣體名稱
                            status_response = self._send_command(self.address)
                            if status_response:
                                status = self._parse_response(status_response)
                                if status and 'gas' in status:
                                    custom_mixtures[mix_no] = {
                                        'name': status['gas']
                                    }
                    except Exception as e:
                        print(f"檢查混合氣體 {mix_no} 時發生錯誤: {e}")

                # 切換回原始氣體（建議使用 'N2' 或 'Ar'）
                self._send_command(f"{self.address}GAr")

                # 如果有搜尋條件，過濾結果
                if search_term:
                    search_term = search_term.lower()
                    filtered_standard = [
                        gas for gas in standard_gases
                        if search_term in gas.lower()
                    ]
                    filtered_mixtures = {
                        mix_no: info for mix_no, info in custom_mixtures.items()
                        if search_term in str(mix_no) or search_term in info['name'].lower()
                    }
                    result = {
                        "current_gas": current_gas,
                        "standard_gases": filtered_standard,
                        "custom_mixtures": filtered_mixtures
                    }
                else:
                    result = {
                        "current_gas": current_gas,
                        "standard_gases": standard_gases,
                        "custom_mixtures": custom_mixtures
                    }

                return result

            except Exception as e:
                print(f"獲取氣體列表錯誤: {e}")
                raise Exception(f"獲取氣體列表失敗: {str(e)}")