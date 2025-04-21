# API routes 文件

## 1. Alicat流量控制器 (Alicat Flow Controller)
**文件路徑:** `backend/routes/alicat_routes.py`

| 端點 | 方法 | 描述 | 請求 Payload | 回應 Payload (成功) |
|------|-----|------|--------------|-------------------|
| `/api/alicat_api/connect` | POST | 連接 Alicat 流量控制器 | `{"port": "COM1(參考)", "address": "A(參考)"}` | `{"message": "Alicat 載氣MFC連接成功，端口: COM1", "port": "COM1", "address": "A", "status": "success"}` |
| `/api/alicat_api/disconnect` | POST | 斷開 Alicat 流量控制器連接 | 不需要參數 | `{"status": "success", "message": "Disconnected"}` |
| `/api/alicat_api/status` | GET | 獲取設備狀態 | 不需要參數 | `{"status": "success", "data": {"pressure": 14.7, "temperature": 24.5, "volumetric_flow": 0.5, "mass_flow": 0.5, "setpoint": 1.0, "gas": "N2"}}` |
| `/api/alicat_api/set_flow_rate` | POST | 設定流量 | `{"flow_rate": 1.5}` | `{"status": "success", "message": "Flow rate set to 1.500 slm"}` |
| `/api/alicat_api/gases` | GET | 獲取所有氣體信息 | 可選參數 `?search=氮氣` | `{"status": "success", "data": {"current_gas": "N2", "standard_gases": ["Air", "Ar", "CH4", ...], "custom_mixtures": {"236": {"name": "mix_01"}, "237": {"name": "mix_02"}}}}` |
| `/api/alicat_api/set_gas` | POST | 設定氣體 | `{"gas": "N2"}` | `{"status": "success", "message": "Gas set to N2"}` |
| `/api/alicat_api/create_mix` | POST | 建立混合氣體 | `{"mix_no": 240, "name": "custom_mix", "gases": {"N2": 80.0, "O2": 20.0}}` | `{"status": "success", "message": "成功創建混合氣體 custom_mix (編號 240)"}` |
| `/api/alicat_api/delete_mix` | POST | 刪除混合氣體 | `{"mix_no": 240}` | `{"status": "success", "message": "Mix 240 deleted"}` |

## 2. 登入帳號
**文件路徑:** `backend/routes/auth_routes.py`

| 端點 | 方法 | 描述 | 請求 Payload | 回應 Payload (成功) |
|------|-----|------|--------------|-------------------|
| `/api/auth/register` | POST | 用戶註冊 | `{"username": "test_user", "password": "password123", "confirmPassword": "password123", "email": "test@example.com"}` | `{"message": "註冊成功"}` |
| `/api/auth/login` | POST | 用戶登入 | `{"username": "test_user", "password": "password123"}` | `{"token": "jwt_token_here", "user_id": 1, "username": "test_user", "email": "test@example.com", "photo_path": "/path/to/photo", "photo_base64": "base64_string", "save_path": "/path/to/save", "refresh_token": "refresh_token_here"}` |
| `/api/auth/refresh` | POST | 刷新 JWT 令牌 | 需要 Refresh Token 在 Authorization 標頭 | `{"access_token": "new_jwt_token_here"}` |
| `/api/auth/photo` | POST | 上傳用戶照片 | `{"photo_base64": "base64_encoded_photo_string", "file_name": "profile.jpg"}` | `{"status": "success", "message": "圖片上傳成功", "photo_path": "/path/to/photo"}` |
| `/api/auth/setting` | PUT | 更新用戶資料 | `{"newPassword": "new_password", "confirmPassword": "new_password", "username": "new_username", "savePath": "/new/save/path"}` | `{"status": "success", "message": "更新成功"}` |

## 3. Azbil MFC (Mass Flow Controller)
**文件路徑:** `backend/routes/azbil_MFC_routes.py`

| 端點 | 方法 | 描述 | 請求 Payload | 回應 Payload (成功) |
|------|-----|------|--------------|-------------------|
| `/api/azbil_api/connect` | POST | 連接 Azbil MFC 設備 | `{"port": "COM2(參考)", "address": 1(參考)}` | `{"status": "success", "message": "已成功連接 Azbil MFC (Port: COM2)", "value": 0}` |
| `/api/azbil_api/disconnect` | POST | 斷開 Azbil MFC 設備連接 | `{"port": "COM2(參考)", "address": 1(參考)}` | `{"status": "success", "message": "設備已斷開連線"}` |
| `/api/azbil_api/set_flow` | POST | 設定流量 | `{"flow": 50}` | `{"status": "success", "message": "成功設定流量"}` |
| `/api/azbil_api/get_status` | GET | 獲取設備狀態 | 不需要參數 | `{"status": "success", "data": {"GAS_TYPE": 1, "FLOW_DECIMAL": 2, "TOTAL_FLOW_DECIMAL": 1, "FLOW_UNIT": 0, "TOTAL_FLOW_UNIT": 1, "GATE_CONTROL": 1, "PV_FLOW": 500, "FLOW_RATE": 500}}` |
| `/api/azbil_api/get_main_status` | GET | 獲取設備主狀態 | 不需要參數 | `{"status": "success", "data": {"FLOW_DECIMAL": 2, "TOTAL_FLOW_DECIMAL": 1, "FLOW_UNIT": 0, "TOTAL_FLOW_UNIT": 1, "GATE_CONTROL": 1, "PV_FLOW": 500, "TOTAL_FLOW": 10500.5}}` |
| `/api/azbil_api/flow_turn_on` | POST | 開啟流量 | 不需要參數 | `{"status": "success", "message": "閥門已設為控制模式"}` |
| `/api/azbil_api/flow_turn_off` | POST | 關閉流量 | 不需要參數 | `{"status": "success", "message": "閥門已全關"}` |
| `/api/azbil_api/flow_turn_full` | POST | 流量最大化 | 不需要參數 | `{"status": "success", "message": "閥門已全開"}` |
| `/api/azbil_api/update` | POST | 更新設備設定 | `{"GAS_TYPE": 1, "FLOW_DECIMAL": 2, "FLOW_UNIT": 0}` | `{"status": "success", "message": "設定更新完成", "data": {"GAS_TYPE": 1, "FLOW_DECIMAL": 2, "FLOW_UNIT": 0}}` |
| `/api/azbil_api/restart_accumlated_flow` | POST | 重置累積流量 | 不需要參數 | `{"status": "success", "message": "成功將累積流量清零"}` |

## 4. CO2 雷射控制器
**文件路徑:** `backend/routes/co2_laser_routes.py`

| 端點 | 方法 | 描述 | 請求 Payload | 回應 Payload (成功) |
|------|-----|------|--------------|-------------------|
| `/api/uc2000/connect` | POST | 連接 UC-2000 雷射控制器 | `{"port": "COM3(參考)"}` | `{"status": "success", "message": "成功連接到雷射控制器 COM3", "data": {"mode": 5, "mode_name": "remote", "remote_control": true, "laser_on": false, "gate_pull_up": false, "pwm_freq": 20, "lase_on_powerup": false, "max_pwm_95": true, "version": 1, "pwm_percentage": 0, "power_percentage": 0}}` |
| `/api/uc2000/disconnect` | POST | 斷開 UC-2000 雷射控制器連接 | `{"port": "COM3(參考)"}` | `{"status": "success", "message": "斷開連接成功"}` |
| `/api/uc2000/status` | GET | 獲取 UC-2000 狀態 | 不需要參數 | `{"status": "success", "data": {"mode": 5, "mode_name": "remote", "remote_control": true, "laser_on": false, "gate_pull_up": false, "pwm_freq": 20, "lase_on_powerup": false, "max_pwm_95": true, "version": 1, "pwm_percentage": 0, "power_percentage": 0}}` |
| `/api/uc2000/set_pwm_freq` | POST | 設定 PWM 頻率 | `{"freq": 20}` | `{"status": "success", "message": "PWM 設置為 20 kHz", "data": {"pwm_freq": 20}}` |
| `/api/uc2000/set_laser` | POST | 啟動/關閉雷射 | `{"enable": true}` | `{"status": "success", "message": "雷射 開啟"}` |
| `/api/uc2000/set_pwm` | POST | 設置 PWM 佔空比 | `{"percentage": 50}` | `{"status": "success", "message": "PWM 設置為 50%"}` |
| `/api/uc2000/set_mode` | POST | 設定 UC-2000 模式 | `{"mode": "remote"}` | `{"status": "success", "message": "已進入遠端控制模式", "data": {"mode": 5, "mode_name": "remote", "remote_control": true}}` |
| `/api/uc2000/set_lase_on_powerup` | POST | 設定雷射開機時是否自動開啟 | `{"enable": false}` | `{"status": "success", "message": "開機時雷射 關閉"}` |
| `/api/uc2000/set_max_pwm_95` | POST | 設定最大 PWM 限制 | `{"enable": true}` | `{"status": "success", "message": "最大 PWM 限制設置為 95%"}` |
| `/api/uc2000/set_gate_pull_up` | POST | 設定 Gate Pull Up 狀態 | `{"enable": true}` | `{"status": "success", "message": "Gate 高電位"}` |
| `/api/uc2000/update_settings` | POST | 更新所有設定 | `{"pwm_freq": 20, "max_pwm_95": true, "gate_pull_up": false, "lase_on_powerup": false, "mode": "remote"}` | `{"status": "success", "message": "所有設定已更新並保存", "data": {...}}` |

## 5. 加熱控制器
**文件路徑:** `backend/routes/heater_routes.py`

| 端點 | 方法 | 描述 | 請求 Payload | 回應 Payload (成功) |
|------|-----|------|--------------|-------------------|
| `/api/heater/connect` | POST | 連接到 Modbus 設備 | `{"port": "COM4(參考)", "address": 1(參考)}` | `{"status": "success", "message": "Heater 連接成功，地址: 1，端口: COM4", "data": {"SV": 150, "PV": 145, "SV2": 10, "Gain": 0.5, "P": 30, "I": 120, "D": 30, "M": 0, "rAP": 0.5, "SLH": 200, "decimal_point": 0}}` |
| `/api/heater/disconnect` | POST | 斷開 Modbus 連接 | `{"port": "COM4(參考)", "address": 1(參考)}` | `{"status": "success"}` |
| `/api/heater/status` | GET | 讀取所有 Modbus 數據 | 不需要參數 | `{"status": "success", "data": {"SV": 150, "PV": 145, "SV2": 10, "Gain": 0.5, "P": 30, "I": 120, "D": 30, "M": 0, "rAP": 0.5, "SLH": 200, "decimal_point": 0}}` |
| `/api/heater/update` | POST | 更新 Modbus 設備參數 | `{"SV": 160, "P": 35, "I": 130, "D": 35}` | `{"status": "success", "message": "溫度參數更新成功"}` |

## 6. Serial port
**文件路徑:** `backend/routes/port_connect_routes.py`

| 端點 | 方法 | 描述 | 請求 Payload | 回應 Payload (成功) |
|------|-----|------|--------------|-------------------|
| `/api/port_scanner/ports` | GET | 獲取所有可用的串口 | 不需要參數 | `{"status": "success", "data": {"ports": [{"port": "COM1", "name": "COM1", "description": "USB Serial Port (COM1)", "hwid": "USB VID:PID=0403:6001 SER=A10KL9MA", "manufacturer": "FTDI"}, ...], "count": 2}}` |
| `/api/port_scanner/ports/<port_name>` | GET | 檢查特定串口的狀態 | 不需要參數 | `{"status": "success", "data": {"port": "COM1", "available": true}}` |

## 7. 脈衝電源供應器
**文件路徑:** `backend/routes/power_supply_routes.py`

| 端點 | 方法 | 描述 | 請求 Payload | 回應 Payload (成功) |
|------|-----|------|--------------|-------------------|
| `/api/power_supply/connect` | POST | 連接電源設備 | `{"port": "COM12(參考)", "baudrate": 19200}` | `{"status": "success", "message": "已連線至 COM12"}` |
| `/api/power_supply/disconnect` | POST | 斷開電源設備連接 | 不需要參數 | `{"status": "success", "message": "已斷線"}` |
| `/api/power_supply/write_voltage` | POST | 寫入電壓值 | `{"voltage": 240.0}` | `{"status": "success", "message": "寫入成功", "value": 1200}` |
| `/api/power_supply/write_current` | POST | 寫入電流值 | `{"current": 0.5}` | `{"status": "success", "message": "寫入成功", "value": 500}` |
| `/api/power_supply/read_mode` | GET | 讀取模式 | 不需要參數 | `{"status": "success", "mode": 2}` |
| `/api/power_supply/read_voltage` | GET | 讀取電壓值 | 不需要參數 | `{"status": "success", "voltage": 240.0}` |
| `/api/power_supply/read_current` | GET | 讀取電流值 | 不需要參數 | `{"status": "success", "current": 0.5}` |
| `/api/power_supply/dc1_turn_on` | POST | 開啟 DC1 | 不需要參數 | `{"status": "success", "message": "DC1 已開啟"}` |
| `/api/power_supply/dc1_turn_off` | POST | 關閉 DC1 | 不需要參數 | `{"status": "success", "message": "DC1 已關閉"}` |
| `/api/power_supply/set_clear_error` | POST | 清除錯誤 | 不需要參數 | `{"status": "success", "message": "error cleared"}` |
| `/api/power_supply/power_on` | POST | 開啟電源 | 不需要參數 | `{"status": "success", "message": "電源已開啟"}` |
| `/api/power_supply/power_off` | POST | 關閉電源 | 不需要參數 | `{"status": "success", "message": "電源已關閉"}` |
| `/api/power_supply/status` | GET | 讀取電源狀態 | 不需要參數 | `{"status": "success", "data": {"voltage": 240.0, "dc1_on": true, "power_on": true, "error": false, "ready": true}}` |

## 8. Recipe
**文件路徑:** `backend/routes/recipe_routes.py`

| 端點 | 方法 | 描述 | 請求 Payload | 回應 Payload (成功) |
|------|-----|------|--------------|-------------------|
| `/api/recipe_api/get_recipes` | GET | 獲取所有配方 | 不需要參數 | `{"status": "success", "data": [{"id": "f47ac10b-58cc-4372-a567-0e02b2c3d479", "parameter_name": "20250124測試", "main_gas_flow": 24.0, "main_gas": "N2", "carrier_gas_flow": 0.2, "carrier_gas": "mix_01", "laser_power": 8.0, "temperature": 80.0, "voltage": 270.0, "created_time": "2025-01-24 15:30:45", "created_by": "尚祐", "last_modified": null, "modified_by": null, "is_active": true, "description": null, "notes": null, "version": 1}]}` |
| `/api/recipe_api/add_recipe` | POST | 添加新配方 | `{"parameter_name": "20250125新測試", "main_gas_flow": 25.0, "main_gas": "N2", "carrier_gas_flow": 0.3, "carrier_gas": "mix_02", "laser_power": 9.0, "temperature": 85.0, "voltage": 280.0, "created_by": "尚祐"}` | `{"status": "success", "data": {"id": "d47ac11b-58cc-4372-a567-0e02b2c3d480", "parameter_name": "20250125新測試", ...}}` |
| `/api/recipe_api/<parameter_name>` | PUT | 更新指定配方 | `{"main_gas_flow": 26.0, "laser_power": 10.0, "temperature": 90.0, "modified_by": "尚祐"}` | `{"status": "success", "data": {"id": "d47ac11b-58cc-4372-a567-0e02b2c3d480", "parameter_name": "20250125新測試", ...}}` |

## 9. 穿透度
**文件路徑:** `backend/routes/transmittance_routes.py`

| 端點 | 方法 | 描述 | 請求 Payload | 回應 Payload (成功) |
|------|-----|------|--------------|-------------------|
| `/api/transmittance_api/transmittanceData` | POST | 獲取透射率數據 | `{"filePath": "/data/transmittance", "groupNumber": 1, "fileNumber": 1, "maxSpectrum": 800, "minSpectrum": 400}` | `[{"fileName": "1-1", "averageTransmittance": 85.4}, {"fileName": "1-2", "averageTransmittance": 86.7}, ...]` |
| `/api/transmittance_api/transmittancePlot` | POST | 繪製透射率圖 | `{"fileData": [{...}, {...}], "selectedFiles": ["1-1", "1-2"], "xLabel": "File Name", "yLabel": "Transmittance %"}` | 返回圖像文件 (image/png) |
| `/api/transmittance_api/transmittancePlotFilter` | POST | 繪製過濾後的透射率圖 | `{"fileData": [{...}, {...}], "plotFlag": [{...}, {...}]}` | 返回圖像文件 (image/png) |

## 10. 超音波霧化器
**文件路徑:** `backend/routes/ultrasonic_routes.py`

| 端點 | 方法 | 描述 | 請求 Payload | 回應 Payload (成功) |
|------|-----|------|--------------|-------------------|
| `/api/ultrasonic/connect` | POST | 連接霧化器 | `{"port": "COM5(參考)", "baudrate": 38400, "address": 1}` | `{"status": "success", "message": "已成功連接霧化器 (Port: COM5)"}` |
| `/api/ultrasonic/disconnect` | POST | 斷開霧化器連接 | `{"port": "COM5(參考)", "address": 1}` | `{"status": "success", "message": "設備已斷開連線"}` |
| `/api/ultrasonic/turn_on` | POST | 開啟霧化器 | 不需要參數 | `{"status": "success", "message": "霧化器已開啟"}` |
| `/api/ultrasonic/turn_off` | POST | 關閉霧化器 | 不需要參數 | `{"status": "success", "message": "霧化器已關閉"}` |
| `/api/ultrasonic/status` | GET | 讀取霧化器狀態 | 不需要參數 | `{"status": "success", "data": {"raw_status": {"status_register": 1, "di_register": 0}, "is_running": true}}` |

## 測試及最外層
**文件路徑:** `backend/app.py`

| 端點 | 方法 | 描述 | 請求 Payload | 回應 Payload (成功) |
|------|-----|------|--------------|-------------------|
| `/shutdown` | POST | 關閉 Flask 伺服器 | 不需要參數 | `{"message": "伺服器正在關閉..."}` |
| `/` | GET | 主頁 | 不需要參數 | `"Flask Server Running"` |
| `/health` | GET | 健康檢查 | 不需要參數 | `{"status": "ok"}` |
