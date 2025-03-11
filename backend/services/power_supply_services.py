import time
import asyncio
import serial
from typing import Optional
import threading
from models.power_supply_model import SpikDevice

MAX_RETRIES = 10

def time_delay(ms):
    time.sleep(ms/1000.0)

class SpikService:
    def __init__(self, port: str = "COM12", baudrate: int = 19200, timeout: float = 1.5):
        self.device = SpikDevice(port=port, baudrate=baudrate, timeout=timeout)
        self.client = None
        # 建立一個 Lock，保證同一時間只有一個操作進行
        self.lock = threading.Lock()

    def connect(self) -> bool:
        try:
            self.client = serial.Serial(
                port=self.device.port,
                baudrate=self.device.baudrate,
                parity=serial.PARITY_NONE,
                stopbits=serial.STOPBITS_ONE,
                bytesize=serial.EIGHTBITS,
                timeout=self.device.timeout
            )
            self.device.client = self.client

            # 🔹 使用 asyncio.run() 來執行異步讀取電壓
            voltage_data = asyncio.run(self.read_voltage())  
            voltage, err = voltage_data  # 解包返回的 (voltage, err) 
            current_data = asyncio.run(self.read_current())
            current, err2 = current_data

            if err == 1:  # 讀取成功
                print(f"已連接 {self.device.port}，確認電壓: {voltage:.2f}V")
                return True
            elif err2 == 1:
                print(f"已連接 {self.device.port}，確認電壓: {current:.2f}A")
                return True
            else:  # 讀取失敗
                print(f"連接 {self.device.port} 但讀取失敗，錯誤碼: {err, err2}")
                self.client.close()  # 關閉錯誤的 Port
                return False

        except Exception as e:
            print("Power supply 連線錯誤:", e)
            return False

    def disconnect(self) -> bool:
        if self.client and self.client.is_open:
            self.client.close()
            return True
        return False

    #--------------------------------------------------
    # 低層讀寫函式，所有操作都加上 Lock 保護
    #--------------------------------------------------
    def spik_write(self, data):
        """寫入命令，重試5次"""
        for _ in range(5):
            with self.lock:
                err = self._spik_writing(data)
            if err == 1:
                return 1
            time_delay(50)
        return err

    def _spik_writing(self, data) -> int:
        """
        低層寫入函式，執行 SPIK 寫入流程。
        支援:
        - data[0] == 1 → 設定模式 + ON/OFF
        - data[0] == 2 → 設定時脈
        - data[0] == 3 → 單一寄存器寫入
        """
        if self.client is None or not self.client.is_open:
            print("❌ 串口未開啟，無法寫入")
            return -99

        try:
            self.client.reset_input_buffer()
            self.client.write(bytes([2]))  # 發送 STX (0x02)
        except Exception as ex:
            print("❌ 發送 STX 錯誤:", ex)
            return -11

        # 等待回應，直到找到 0x16(DLE=22) 或 0x15(NAK=21)
        in_bytes = bytearray()
        for _ in range(20):
            time.sleep(0.02)  # 20ms 間隔
            if self.client.in_waiting > 0:
                in_bytes.extend(self.client.read(self.client.in_waiting))
            if len(in_bytes) > 0 and in_bytes[0] == 21:
                return -2  # ❌ 收到 NAK
            if 16 in in_bytes:
                break

        # 組合 outbyte2 (不同模式)
        if data[0] == 1:
            outbyte2 = bytearray(17)  # 設定模式 + ON/OFF
            outbyte2[5] = 0
            outbyte2[7] = 2
            outbyte2[10] = 0
            outbyte2[11] = data[1] & 0xFF  # 模式
            outbyte2[12] = 0
            outbyte2[13] = data[2] & 0xFF  # ON/OFF
        elif data[0] == 2:
            outbyte2 = bytearray(21)  # 設定時脈
            outbyte2[5] = 4
            outbyte2[7] = 4
            outbyte2[10] = (data[1] >> 8) & 0xFF
            outbyte2[11] = data[1] & 0xFF
            outbyte2[12] = (data[2] >> 8) & 0xFF
            outbyte2[13] = data[2] & 0xFF
            outbyte2[14] = (data[3] >> 8) & 0xFF
            outbyte2[15] = data[3] & 0xFF
            outbyte2[16] = (data[4] >> 8) & 0xFF
            outbyte2[17] = data[4] & 0xFF
        elif data[0] == 3:
            outbyte2 = bytearray(15)  # 設定單一寄存器
            outbyte2[5] = data[1] & 0xFF  # 寄存器地址
            outbyte2[7] = 1
            outbyte2[10] = (data[2] >> 8) & 0xFF
            outbyte2[11] = data[2] & 0xFF
        else:
            print("❌ 不支援的寫入類型:", data[0])
            return -99

        # 設定固定欄位
        outbyte2[0:5] = bytes([0, 0, 65, 68, 0])
        outbyte2[6] = 0
        outbyte2[8:10] = bytes([0xFF, 0xFF])
        outbyte2[-3] = 16  # DLE
        outbyte2[-2] = 3   # ETX
        bcc = 0
        for b in outbyte2[:-1]:
            bcc ^= b
        outbyte2[-1] = bcc

        try:
            self.client.write(outbyte2)
        except Exception as ex:
            print("❌ 送出封包失敗:", ex)
            return -22

        return 1  # 寫入成功

    def spik_read(self, spik_address, valid_range=(0,4000)):
        for _ in range(12):
            with self.lock:
                result, err = self._spik_reading(spik_address)
                print(result)
            if err == 1 and valid_range[0] <= result <= valid_range[1]:
                return result, 1
            time_delay(500)
        return None, -99

    def _spik_reading(self, spik_address):
        if self.client is None or not self.client.is_open:
            print("spik_reading: 串口未開啟")
            return 0, -11
        try:
            self.client.reset_input_buffer()
            self.client.write(bytes([2]))
        except Exception as ex:
            print("送出 STX 錯誤:", ex)
            return 0, -11

        in_bytes = bytearray()
        retry = 0
        while True:
            retry += 1
            if retry > 5:
                return 0, -1
            start_time = time.time()
            while self.client.in_waiting == 0 and (time.time()-start_time) < 0.15:
                time.sleep(0.001)
            if self.client.in_waiting > 0:
                in_bytes.extend(self.client.read(self.client.in_waiting))
            if len(in_bytes) > 0 and in_bytes[0] == 21:
                return 0, -2
            if 16 in in_bytes:
                break

        outbyte2 = bytearray(13)
        outbyte2[0:6] = bytes([0, 0, 0x45, 0x44, 0, spik_address & 0xFF])
        outbyte2[6:10] = bytes([0, 1, 0xFF, 0xFF])
        outbyte2[10:12] = bytes([16, 3])
        bcc = 0
        for i in range(12):
            bcc ^= outbyte2[i]
        outbyte2[12] = bcc

        try:
            self.client.reset_input_buffer()
            self.client.write(outbyte2)
            time_delay(80)
            in_bytes = bytearray()
            retry = 0
            while True:
                retry += 1
                if retry > 5:
                    return 0, -3
                start_time = time.time()
                while self.client.in_waiting == 0 and (time.time()-start_time) < 0.15:
                    time.sleep(0.001)
                if self.client.in_waiting > 0:
                    in_bytes.extend(self.client.read(self.client.in_waiting))
                if len(in_bytes) > 0 and (16 in in_bytes or in_bytes[0] == 21):
                    break
            if in_bytes[0] == 21:
                return 0, -4
        except Exception as ex:
            print("讀取封包錯誤:", ex)
            return 0, -22

        try:
            self.client.write(bytes([16]))
        except Exception as ex:
            print("送出 DLE 錯誤:", ex)
            return 0, -33

        in_bytes2 = bytearray()
        retry = 0
        while True:
            retry += 1
            if retry > 5:
                return 0, -5
            start_time = time.time()
            while self.client.in_waiting <= 6 and (time.time()-start_time) < 0.15:
                time.sleep(0.001)
            if self.client.in_waiting > 6:
                in_bytes2.extend(self.client.read(self.client.in_waiting))
                break
        in_bytes.extend(in_bytes2)
        total_count = len(in_bytes)
        if total_count < 9:
            return 0, -5
        try:
            result = in_bytes[total_count - 3] + (in_bytes[total_count - 4] << 8)
        except Exception as ex:
            print("解析回應錯誤:", ex)
            return 0, -5

        try:
            self.client.write(bytes([16]))
        except Exception as ex:
            print("最後送出 DLE 錯誤:", ex)
            return result, -44

        return result, 1

    async def set_clock(self, clock1: int, clock2: int, clock3: int, clock4: int) -> dict:
        """
        設定時脈
        """
        err = await asyncio.to_thread(self.spik_write, [2, clock1, clock2, clock3, clock4])
        if err == 1:
            return {"status": "success", "message": "時脈設定成功"}
        return {"status": "failure", "message": f"設定時脈失敗，錯誤碼: {err}"}

    async def write_register(self, register: int, value: int) -> dict:
        """
        設定單一寄存器
        """
        err = await asyncio.to_thread(self.spik_write, [3, register, value])
        if err == 1:
            return {"status": "success", "message": f"寄存器 {register} 設定為 {value}"}
        return {"status": "failure", "message": f"設定寄存器失敗，錯誤碼: {err}"}

    #--------------------------------------------------
    # 應用層函式：讀取 Mode、Voltage、Current
    #--------------------------------------------------
    async def read_mode(self) -> tuple[Optional[int], int]:
        # Mode 寄存器在地址 0，正常讀取應大於 32768（帶0x8000偏移）
        for attempt in range(MAX_RETRIES):
            await asyncio.sleep(0.2)
            raw, err = await asyncio.to_thread(self.spik_read, 0, (30000,60000))
            if err != 1:
                print("讀取 Mode 失敗，錯誤碼:", err)
                continue
            if raw < 32768:
                print("讀取到不完整的 Mode 值:", raw, "重試中... (", attempt+1, "/", MAX_RETRIES,")")
                continue
            adjusted = raw - 32768
            mode_code = adjusted & 0x0F
            if mode_code == 0:
                mode_code = 1
            return mode_code, 1
        return None, -100

    async def read_voltage(self) -> tuple[Optional[float], int]:
        # DC1_V_SET 寄存器地址 13；正確範圍 0-4000；換算：實際電壓 = 內部值 × 0.2
        internal, err = await asyncio.to_thread(self.spik_read, 13, (0,4000))
        if err == 1:
            return internal * 0.2, 1
        return None, err

    async def write_voltage(self, voltage: float) -> tuple[Optional[dict], int]:
        # 寫入電壓：實際電壓 * 5 = 內部數值
        internal_value = int(voltage * 5)
        err = await asyncio.to_thread(self.spik_write, [3, 13, internal_value])
        if err == 1:
            return {"status": "success", "message": "寫入成功", "value": internal_value}, 200
        return {"status": "failure", "message": f"寫入失敗，錯誤碼: {err}"}, 400

    async def read_current(self) -> tuple[Optional[float], int]:
        # DC1_I_SET 寄存器地址 14；換算：實際電流 = 內部值 × 0.001
        internal, err = await asyncio.to_thread(self.spik_read, 14, (0,4000))
        if err == 1:
            return internal * 0.001, 1
        return None, err

    async def write_current(self, current: float) -> tuple[Optional[dict], int]:
        # 寫入電流：實際電流 * 1000 = 內部數值
        internal_value = int(current * 1000)
        err = await asyncio.to_thread(self.spik_write, [3, 14, internal_value])
        if err == 1:
            return {"status": "success", "message": "寫入成功", "value": internal_value}, 200
        return {"status": "failure", "message": f"寫入失敗，錯誤碼: {err}"}, 400

    async def set_dc1_on(self) -> int:
        """
        這裡假設使用 data[0]=1 表示「設電源模式+ON/OFF」，
        data[1] 表示模式（例如：1 表示 Bipolar），
        data[2] 表示 ON/OFF 狀態
        """
        # 此處假設使用 data = [1, 1, 1] 來表示「DC1 ON」
        return self.spik_write([3, 1, 33])

    async def set_dc1_off(self) -> int:
        """
        這裡假設使用 data[0]=1 表示「設電源模式+ON/OFF」，
        data[1] 表示模式（例如：1 表示 Bipolar），
        data[2] 表示 ON/OFF 狀態
        """
        return self.spik_write([3, 1, 32])

    async def set_running_on(self, mode: int=2) -> int:
        """
        設定運行狀態為 ON，並指定模式
        mode: 運行模式，例如 0x01 (Bipolar), 0x02 (Unipolar neg), 0x03 (Unipolar pos)
        """
        return self.spik_write([1, mode, 2])

    async def set_running_off(self, mode: int=2) -> int:
        """
        設定運行狀態為 OFF，並指定模式
        """
        return self.spik_write([1, mode, 1])

    async def clear_error(self) -> dict:
        """
        清除錯誤狀態 (Clear Error)
        根據手冊，需寫入 0x03
        """
        err = await asyncio.to_thread(self.spik_write, [3, 1, 3])
        if err == 1:
            return {"status": "success", "message": "錯誤已清除"}
        return {"status": "failure", "message": f"清除錯誤失敗，錯誤碼: {err}"}

    async def read_status(self) -> dict:
        """
        讀取狀態，電壓、電流、錯誤訊息、DC1、Power狀態
        Returns:
            dict: 包含以下資訊：
                - voltage: 設定電壓值
                - current: 設定電流值
                - actual_voltage: 實際輸出電壓
                - actual_current: 實際輸出電流
                - mode: 運行模式 (1: Bipolar, 2: Unipolar neg, 3: Unipolar pos)
                - dc1_on: DC1是否開啟
                - power_on: Power是否開啟
                - error: 是否有錯誤
                - ready: 是否就緒
        """
        # 讀取設定值
        voltage, voltage_status = await self.read_voltage()
        current, current_status = await self.read_current()
        
        # 讀取實際輸出值
        actual_voltage, actual_v_status = await asyncio.to_thread(self.spik_read, 20, (0,4000))
        actual_current, actual_i_status = await asyncio.to_thread(self.spik_read, 21, (0,4000))
        
        # 讀取模式和狀態
        mode_raw, mode_status = await self.read_mode()
        status_raw, status_code = await asyncio.to_thread(self.spik_read, 0, (0,65535))
        
        # 讀取錯誤資訊
        error_code, error_code_status = await asyncio.to_thread(self.spik_read, 2, (0,65535))
        
        # 解析狀態位元
        if status_code == 1:
            dc1_on = bool(status_raw & 0x0001)  # bit 0
            power_on = bool(status_raw & 0x0002)  # bit 1
            error = bool(status_raw & 0x0004)  # bit 2
            ready = bool(status_raw & 0x0008)  # bit 3
        else:
            dc1_on = power_on = error = ready = None

        status = {
            "voltage": voltage * 0.2 if voltage_status == 1 else None,
            "current": current * 0.001 if current_status == 1 else None,
            "actual_voltage": actual_voltage * 0.2 if actual_v_status == 1 else None,
            "actual_current": actual_current * 0.001 if actual_i_status == 1 else None,
            "mode": mode_raw if mode_status == 1 else None,
            "dc1_on": dc1_on,
            "power_on": power_on,
            "error": error,
            "error_code": error_code if error_code_status == 1 else None,
            "ready": ready
        }
        
        return status