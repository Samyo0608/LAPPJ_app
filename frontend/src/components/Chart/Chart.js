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

const LineChartComponent = () => {
  // Initialize chart data and labels
  const [chartData, setChartData] = useState({
    labels: [], // Time labels
    datasets: [
      {
        label: 'Main Gas Flow', // Chart title
        data: [], // Data points
        borderColor: 'rgba(75, 192, 192, 1)', // Line color
        backgroundColor: 'rgba(75, 192, 192, 0.2)', // Fill color
        tension: 0.3, // Smoothness
        yAxisID: 'y', // Left Y-axis
      },
      {
        label: 'Carrier Gas Flow', // Chart title
        data: [], // Data points
        borderColor: 'rgb(192, 108, 75)', // Line color
        backgroundColor: 'rgba(192, 79, 75, 0.2)', // Fill color
        tension: 0.3, // Smoothness
        yAxisID: 'y', // Left Y-axis
      },
      {
        label: 'Voltage', // Chart title
        data: [], // Data points
        borderColor: 'rgb(93, 75, 192)', // Line color
        backgroundColor: 'rgba(2, 6, 231, 0.2)', // Fill color
        tension: 0.3, // Smoothness
        yAxisID: 'y1', // Right Y-axis
      },
    ],
  });

  // Chart options
  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom',
      },
      title: {
        display: true,
        text: '流量及電壓即時監測',
      },
    },
    scales: {
      x: {
        title: {
          display: true,
          text: 'Time (s)', // X-axis label
        },
      },
      y: {
        type: 'linear',
        position: 'left',
        title: {
          display: true,
          text: 'Flow Rate (sccm)', // Left Y-axis label
        },
        ticks: {
          stepSize: 10, // Interval for ticks
          max: 50, // Max value
          min: 0, // Min value
        },
      },
      y1: {
        type: 'linear',
        position: 'right',
        title: {
          display: true,
          text: 'Voltage (V)', // Right Y-axis label
        },
        ticks: {
          stepSize: 50, // Interval for ticks
          max: 300, // Max value
          min: 0, // Min value
        },
        grid: {
          drawOnChartArea: false, // Disable gridlines for right Y-axis
        },
      },
    },
  };

  useEffect(() => {
    const interval = setInterval(() => {
      // Get current time as HH:mm:ss
      const currentTime = new Date().toLocaleTimeString();

      // Generate random value for data
      const randomValue = Math.floor(Math.random() * 100) + 1;
      const randomValue2 = Math.floor(Math.random() * 100) + 1;
      const randomValue3 = Math.floor(Math.random() * 300) + 3;

      // Update chart data and labels
      setChartData((prevData) => {
        const updatedLabels = [...prevData.labels, currentTime];
        const updatedData = [
          ...prevData.datasets[0].data,
          randomValue,
        ];
        const updatedData2 = [
          ...prevData.datasets[1].data,
          randomValue2,
        ];
        const updatedData3 = [
          ...prevData.datasets[2].data,
          randomValue3,
        ];

        // Limit the number of labels and data points (e.g., max 10 points)
        if (updatedLabels.length > 10) {
          updatedLabels.shift(); // Remove the oldest label
          updatedData.shift(); // Remove the oldest data point
          updatedData2.shift(); // Remove the oldest data point
          updatedData3.shift(); // Remove the oldest data point
        }

        return {
          labels: updatedLabels,
          datasets: [
            {
              ...prevData.datasets[0],
              data: updatedData,
            },
            {
              ...prevData.datasets[1],
              data: updatedData2,
            },
            {
              ...prevData.datasets[2],
              data: updatedData3,
            },
          ],
        };
      });
    }, 3000); // Update every second

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  return (
    <div className="w-full min-h-40vh">
      <Line data={chartData} options={options} />
    </div>
  );
};

export default LineChartComponent;
