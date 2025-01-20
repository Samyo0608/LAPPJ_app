import pandas as pd
import os

# 調整成callback function，變數為initial_file_path、group_number、file_number、指定範圍的最大值和最小值
# 輸出成陣列，裡面是object，包含檔案名稱和平均值，要回傳給前端
# 這個callback function要在app.py裡面被呼叫
def txt_to_transmittance(initial_file_path, group_number, file_number, max_spectrum, min_spectrum):
    # 用來儲存每個檔案的平均值和檔案名稱
    averages_list = []

    # 迴圈遍歷所有的檔案
    while True:
        # 組合當前的檔案名稱
        file_path = f'{initial_file_path}/{group_number}-{file_number}.txt'
        
        # 檢查檔案是否存在
        if os.path.isfile(file_path):
            try:
                # 讀取檔案，跳過第一行
                df = pd.read_csv(file_path, skiprows=1)
                
                # 設定列的標題
                df.columns = ["Wavelength nm.", "T%"]
                
                # 將 Wavelength 和 T% 轉換為浮點數
                df["Wavelength nm."] = df["Wavelength nm."].astype(float)
                df["T%"] = df["T%"].astype(float)
                
                # 篩選指定範圍的數據
                filtered_df = df[(df["Wavelength nm."] > min_spectrum) & (df["Wavelength nm."] < max_spectrum)]
                
                # 計算 T% 的平均值
                total = filtered_df["T%"].sum()
                average = total / len(filtered_df)  # 計算範圍內的平均值
                
                # 將結果加入列表中
                averages_list.append({
                    "fileName": f"{group_number}-{file_number}",
                    "averageTransmittance": average
                })
                
                # 顯示讀取和計算成功的訊息
                print(f"成功處理: {file_path}，平均值: {average}")
                
                # 讀取下一個檔案編號
                file_number += 1

            except Exception as e:
                print(f"處理檔案時發生錯誤: {file_path}，錯誤訊息: {str(e)}")
                break
        else:
            # 如果檔案不存在，嘗試下一組 (group_number + 1)
            if file_number == 1:
                # 如果 file_number 為 1 且檔案仍不存在，則終止迴圈
                print("所有檔案處理完成。")
                break
            else:
                # 檔案不存在，切換到下一組
                group_number += 1
                file_number = 1  # 重置 file_number 為 1
    
    # 返回處理結果
    return averages_list
