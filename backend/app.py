from flask import Flask, jsonify, send_file, request # type: ignore
from flask_cors import CORS # type: ignore
from txt_to_transmittance_data import txt_to_transmittance
from transmittance_to_figure import plot_data, plot_data_filter
from routes.alicat_routes import alicat_bp
import pandas as pd
import matplotlib.pyplot as plt
import io
import os

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}})

# 設置 JSON 編碼，確保中文正常顯示
app.json.ensure_ascii = False

app.register_blueprint(alicat_bp)

# 會從前端接收一個物件，裡面包含initial_file_path、group_number、file_number、max_spectrum和min_spectrum
# 這個物件會被傳遞給txt_to_transmittance函數
# 這裡面會是一個object，包含檔案名稱和平均值，要回傳給前端
# 這逼會接收前端的資料，並且將資料傳遞給txt_to_transmittance函數
@app.route('/api/transmittanceData', methods=['POST'])
def get_transmittance():
    data = request.get_json()
    file_path = data['filePath']
    group_number = data['groupNumber']
    file_number = data['fileNumber']
    max_spectrum = data['maxSpectrum']
    min_spectrum = data['minSpectrum']
    averages_list = txt_to_transmittance(file_path, group_number, file_number, max_spectrum, min_spectrum)
    return jsonify(averages_list)

# API 路由，接收前端發送的數據，並繪製圖表
@app.route('/api/transmittancePlot', methods=['POST'])
def plot():
    data = request.get_json()
    
    # 前端傳遞過來的檔案數據和其他參數
    file_data = data.get('fileData', [])  # 檔案數據陣列
    selected_files = data.get('selectedFiles', [])  # 要比對的檔案名稱列表
    x_label = data.get('xLabel', 'File Name')  # X 軸標籤
    y_label = data.get('yLabel', 'Transmittance %')  # Y 軸標籤
    
    print('old selected_files:', selected_files)
    
    # 如果 selected_files 為空，則默認使用所有檔案
    if not selected_files:
        selected_files = [file['fileName'] for file in file_data]
    
    print(f'selected_files: {selected_files}')

    # 繪製圖表
    img = plot_data(file_data, selected_files, x_label, y_label)
    
    # 返回圖片
    return send_file(img, mimetype='image/png')

@app.route('/api/transmittancePlotFilter', methods=['POST'])
def plot_filter():
    # data, plot_flag
    data = request.get_json()
    file_data = data.get('fileData', [])
    plot_flag = data.get('plotFlag', [])
    
    img = plot_data_filter(file_data, plot_flag)
    
    return send_file(img, mimetype='image/png')

if __name__ == '__main__':
    app.run(debug=True, port=5000)

# 啟動方式: source venv/Scripts/activate -> python backend/app.py