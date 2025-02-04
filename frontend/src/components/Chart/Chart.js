import React, { useState, useEffect } from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

// Register Chart.js modules
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

const LineChartComponent = ({ 
  title,             // 圖表標題
  dataHistory,       // 要顯示的數據
  timeLabels,        // 時間標籤
  label,             // 數據的標籤名稱
  yAxisLabel,        // Y軸標籤
  yAxisMax,          // Y軸最大值
  yAxisMin,          // Y軸最小值
  yAxisStep,         // Y軸刻度間隔
  lineColor = 'rgba(75, 192, 192, 1)',  // 線條顏色
  backgroundColor = 'rgba(75, 192, 192, 0.2)'  // 背景顏色
}) => {
  const [chartData, setChartData] = useState({
    labels: timeLabels,
    datasets: [
      {
        label: label,
        data: dataHistory,
        borderColor: lineColor,
        backgroundColor: backgroundColor,
        tension: 0.3,
        yAxisID: 'y',
      }
    ],
  });

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          // 調整圖例文字大小
          font: {
            size: 12  // 圖例字體大小
          },
          padding: 10  // 圖例間距
        }
      },
      title: {
        display: true,
        text: title,
        font: {
          size: 16,  // 標題字體大小
          weight: 'bold'  // 標題字體粗細
        },
        padding: 10  // 標題間距
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time (s)',
          font: {
            size: 14  // X 軸標題字體大小
          }
        },
        ticks: {
          font: {
            size: 12  // X 軸刻度字體大小
          }
        }
      },
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: yAxisLabel,
          font: {
            size: 14
          }
        },
        ticks: {
          stepSize: yAxisStep,
          max: yAxisMax,
          min: yAxisMin,
        },
        // 添加這些設置來固定 Y 軸範圍
        grace: '0%',  // 不允許數據超出範圍
        beginAtZero: true,  // 從 0 開始
        suggestedMax: yAxisMax,  // 建議最大值
        suggestedMin: yAxisMin,  // 建議最小值
        bounds: 'ticks',  // 確保刻度在範圍內
        // 禁用自動縮放
        min: yAxisMin,
        max: yAxisMax,
        grid: {
          drawBorder: true,
          color: '#E2E8F0'
        }
      },
    },
    // 可選：調整整體佈局
    layout: {
      padding: {
        top: 10,
        right: 15,
        bottom: 10,
        left: 15
      }
    }
  };

  useEffect(() => {
    setChartData({
      labels: timeLabels,
      datasets: [
        {
          label: label,
          data: dataHistory,
          borderColor: lineColor,
          backgroundColor: backgroundColor,
          tension: 0.3,
          yAxisID: 'y',
        }
      ],
    });
  }, [timeLabels, dataHistory, label, lineColor, backgroundColor]);

  return (
    <div className="w-full min-h-40vh h-[300px]">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default LineChartComponent;
