import matplotlib
matplotlib.use('Agg')  # 設置後端為 'Agg'，避免啟動 GUI
import matplotlib.pyplot as plt
import io
import pandas as pd

plt.rcParams.update({
    'font.size': 16,          # 整體字體大小
    'axes.titlesize': 16,     # 標題字體大小
    'axes.labelsize': 16,     # 軸標籤字體大小
    'xtick.labelsize': 16,    # x軸刻度字體大小
    'ytick.labelsize': 16,    # y軸刻度字體大小
    'legend.fontsize': 14     # 圖例字體大小
})
# plt.style.use(['science', 'ieee'])

# 繪圖函數
def plot_data(data, selected_files, x_label, y_label):
    df = pd.DataFrame(data)
    # 過濾數據
    filtered_df = df[df['fileName'].isin(selected_files)]
    
    # 開始繪圖
    fig, ax = plt.subplots(figsize=(10, 6))
    
    # 繪製數據
    ax.plot(filtered_df['fileName'], filtered_df['averageTransmittance'], marker='o', linestyle='-', color='b')
    
    # 設置標籤
    ax.set_xlabel('Number of Files')
    ax.set_ylabel(f'{y_label} (%)')
    ax.set_title(f'{y_label}')
    
    # 保存圖片到內存中
    img = io.BytesIO()
    plt.savefig(img, format='png')
    img.seek(0)
    plt.close()
    
    return img
  
def plot_data_filter(data, plot_flag):
  df = pd.DataFrame(data)
  # data有3個key, averageTransmittance, fileName和resisitance
  # plot_flag是一個array, 裡面有3~4個object,每個object會有3個key, flag(xLabel, yLabel1, yLabel2), unit(單位), value(個軸的標題), fla='yLabel2'有多一個key, 是isDisabled, true的話就不要考慮這個軸, false的話就要考慮這個軸
  # 開始繪圖
  fig, ax = plt.subplots(figsize=(10, 6))
  # 設置標籤
  # X軸為要在plot_flag的陣列內尋找flag為xLabel的value
  # Y軸為要在plot_flag的陣列內尋找flag為yLabel1的value
  # Y軸2為要在plot_flag的陣列內尋找flag為yLabel2的value
  # isDisabled為要在plot_flag的陣列內尋找flag為yLabel2的isDisabled
  x_label = ''
  y_label = ''
  y_label2 = ''
  isViewed = False
  x_unit = ''
  y_unit = ''
  y2_unit = ''
  
  # 如果單位是歐姆，則寫成($\Omega$)
  # 如果單位是百分比，則寫成($\%$)
  # label寫法為f'{y_label} ($\Omega$)'或f'{y_label} ($\%$)'
  
  for i in range(len(plot_flag)):
    if plot_flag[i]['flag'] == 'xLabel':
      x_label = plot_flag[i]['value']
      x_unit = plot_flag[i]['unit']
    elif plot_flag[i]['flag'] == 'yLabel':
      y_label = plot_flag[i]['value']
      y_unit = plot_flag[i]['unit']
    elif plot_flag[i]['flag'] == 'yLabel2':
      y_label2 = plot_flag[i]['value']
      isViewed = plot_flag[i]['isViewed']
      y2_unit = plot_flag[i]['unit']
  
  # 繪製數據
  ax.plot(df['fileName'], df['averageTransmittance'], marker='o', linestyle='-', color='b', label=y_label)
  
  ax.set_xlabel(f'{x_label} ({x_unit})')
  ax.set_ylabel(f'{y_label} ({y_unit})')
  ax.set_title(f'{x_label} and {y_label}')

  # 如果y_label2不是空的話，就要繪製第二個y軸
  if y_label2 != '' and isViewed:
    ax2 = ax.twinx()
    ax2.plot(df['fileName'], df['resistance'], marker='o', linestyle='-', color='r', label=y_label2)
    ax2.set_ylabel(f'{y_label2} ({y2_unit})')
    
  # 合併兩個圖例
  lines_1, labels_1 = ax.get_legend_handles_labels()
  lines_2, labels_2 = ax2.get_legend_handles_labels()
  ax.legend(lines_1 + lines_2, labels_1 + labels_2, loc='best', frameon=True, facecolor='white', edgecolor='black')
    
  # 保存圖片到內存中
  img = io.BytesIO()
  plt.savefig(img, format='png')
  img.seek(0)
  plt.close()
  
  return img
