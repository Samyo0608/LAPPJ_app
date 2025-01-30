import asyncio
from alicat import FlowController
import serial
from serial.serialutil import SerialException

class FlowControllerModel:
    def __init__(self, port, address):
        self.port = port
        self.address = address
        self.flow_controller = None
        self.timeout = 0.2
        self.custom_mixtures = {}
        self.mix_compositions = {}

    def check_device_connection(self) -> bool:
        """檢查設備連接狀態的防呆函式"""
        try:
            print(f"正在嘗試連接 {self.port}...")
            with serial.Serial(
                self.port, 
                baudrate=19200, 
                timeout=self.timeout, 
                write_timeout=self.timeout
            ) as ser:
                ser.reset_input_buffer()
                ser.reset_output_buffer()
                
                command = f"{self.address}\r".encode("ascii")
                ser.write(command)
                
                response = ser.read(1)
                if not response:
                    print(f"{self.port} 沒有回應")
                    return False
                    
                full_response = response + ser.read(99)
                print(f"收到回應: {full_response}")
                return True
                    
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

    async def connect(self):
        """建立與流量控制器的連線"""
        if not self.check_device_connection():
            raise Exception(f"無法連接到設備 {self.port}")
            
        try:
            self.flow_controller = FlowController(self.port)
            await self.flow_controller.__aenter__()
            initial_status = await self.flow_controller.get()
            return initial_status  # 返回初始狀態
        except Exception as e:
            raise Exception(f"連接設備時發生錯誤: {e}")

    async def disconnect(self):
        """關閉與流量控制器的連線"""
        try:
            if self.flow_controller:
                await self.flow_controller.__aexit__(None, None, None)
                self.flow_controller = None
                print(f"已斷開與 {self.port} 的連接")
        except Exception as e:
            print(f"斷開連接時發生錯誤: {e}")
            raise Exception(f"斷開連接時發生錯誤: {e}")

    async def read_status(self):
        """讀取設備狀態"""
        try:
            if not self.flow_controller:
                raise Exception("設備未連接")
            data = await self.flow_controller.get()
            return self.format_status_data(data)
        except Exception as e:
            print(f"讀取狀態錯誤: {e}")
            raise

    def format_status_data(self, data: dict) -> dict:
        """格式化狀態數據"""
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

    async def set_flow_rate(self, flow_rate):
        """設定流量"""
        if not self.flow_controller:
            raise Exception("Device not connected")
        
        try:
            flow_rate = float(flow_rate)  # ✅ 確保 flow_rate 是浮點數
            await self.flow_controller.set_flow_rate(flow_rate)
        except ValueError:
            raise Exception("Invalid flow rate: must be a number")

    async def set_pressure(self, pressure):
        """設定壓力"""
        if not self.flow_controller:
            raise Exception("Device not connected")
        await self.flow_controller.set_pressure(pressure)

    async def set_gas(self, gas):
        """設定氣體"""
        if not self.flow_controller:
            raise Exception("Device not connected")
        await self.flow_controller.set_gas(gas)

    async def create_mix(self, mix_no, name, gases):
        """建立混合氣"""
        if not self.flow_controller:
            raise Exception("Device not connected")
        await self.flow_controller.create_mix(mix_no, name, gases)

    async def delete_mix(self, mix_no):
        """刪除混合氣"""
        if not self.flow_controller:
            raise Exception("Device not connected")
        await self.flow_controller.delete_mix(mix_no)
    
    async def get_available_gas_mixes(self):
        """獲取所有已設定的混合氣體"""
        try:
            if not self.flow_controller:
                raise Exception("設備未連接")

            mixes = {}
            # 檢查 236-255 範圍內的混合氣體
            for mix_no in range(236, 256):
                try:
                    # 嘗試選擇該混合氣體
                    await self.flow_controller.set_gas(mix_no)
                    # 如果成功設置，則獲取當前狀態
                    state = await self.flow_controller.get()
                    if state and 'gas' in state:
                        mixes[mix_no] = {
                            'name': state['gas']
                        }
                except Exception:
                    continue

            return mixes

        except Exception as e:
            print(f"獲取混合氣體列表錯誤: {e}")
            return {}

    async def get_all_gases(self, search_term: str = None):
        """獲取所有氣體資訊，包括標準氣體和混合氣體"""
        try:
            if not self.flow_controller:
                raise Exception("設備未連接")

            # 獲取當前狀態
            current_state = await self.flow_controller.get()
            current_gas = current_state.get('gas', 'Unknown')

            # 獲取標準氣體列表
            standard_gases = {gas: gas for gas in self.flow_controller.gases}

            # 獲取混合氣體列表
            custom_mixtures = await self.get_available_gas_mixes()

            # 如果有搜尋條件
            if search_term:
                search_term = search_term.lower()
                # 過濾標準氣體
                filtered_standard = {
                    code: name for code, name in standard_gases.items()
                    if search_term in code.lower() or search_term in name.lower()
                }

                # 過濾混合氣體
                filtered_mixtures = {
                    mix_no: mix_info for mix_no, mix_info in custom_mixtures.items()
                    if search_term in str(mix_no) or search_term in mix_info['name'].lower()
                }

                result = {
                    "current_gas": current_gas,
                    "standard_gases": filtered_standard,
                    "custom_mixtures": filtered_mixtures
                }
            else:
                result = {
                    "current_gas": current_gas,
                    "standard_gases": self.flow_controller.gases,
                    "custom_mixtures": custom_mixtures
                }

            # 結束後設定成Argon
            await self.flow_controller.set_gas('Ar')
            return result

        except Exception as e:
            print(f"獲取氣體列表錯誤: {e}")
            raise