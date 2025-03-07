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
            return True
        except Exception as e:
            print("Power supply連線錯誤:", e)
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

    def _spik_writing(self, data):
        if self.client is None or not self.client.is_open:
            print("spik_writing: 串口未開啟")
            return -99
        try:
            self.client.reset_input_buffer()
            self.client.write(bytes([2]))  # 送出 STX (0x02)
        except Exception as ex:
            print("寫入初始命令錯誤:", ex)
            return -11

        in_bytes = bytearray()
        k = 0
        while True:
            k += 1
            if k > 20:
                return -1
            start_t = time.time()
            while self.client.in_waiting == 0 and (time.time()-start_t) < 0.02:
                time.sleep(0.001)
            if self.client.in_waiting > 0:
                in_bytes.extend(self.client.read(self.client.in_waiting))
            if len(in_bytes) > 0 and in_bytes[0] == 21:
                return -2
            if 16 in in_bytes:
                break

        # 以一次寫一筆資料為例 (data[0] == 3)，寫入寄存器數值
        if data[0] == 3:
            outbyte2 = bytearray(15)
            outbyte2[5] = data[1] & 0xFF  # 寄存器位址
            outbyte2[7] = 1
            outbyte2[10] = (data[2] >> 8) & 0xFF
            outbyte2[11] = data[2] & 0xFF
        else:
            print("目前僅支援 data[0] == 3 的寫入")
            return -99

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
            print("送出封包失敗:", ex)
            return -22

        in_bytes = bytearray()
        k = 0
        while True:
            k += 1
            if k > 150:
                print("B04, 脈衝機讀取錯誤")
                return -3
            start_t = time.time()
            while self.client.in_waiting <= 2 and (time.time()-start_t) < 0.02:
                time.sleep(0.001)
            if self.client.in_waiting > 2:
                in_bytes.extend(self.client.read(self.client.in_waiting))
                if len(in_bytes) > 0 and in_bytes[0] == 21:
                    print("B03, 脈衝機讀取錯誤")
                    return -2
                if (16 in in_bytes) and (2 in in_bytes):
                    idx16 = in_bytes.index(16)
                    idx02 = in_bytes.index(2)
                    if (idx02 - idx16) == 1:
                        break
        try:
            self.client.write(bytes([16]))
        except Exception as ex:
            print("傳送 DLE 例外:", ex)
            return -44

        return 1

    def spik_read(self, spik_address, valid_range=(0,4000)):
        """重試最多 5 次讀取"""
        for _ in range(5):
            with self.lock:
                result, err = self._spik_reading(spik_address)
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
