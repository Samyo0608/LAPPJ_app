import React, { useState } from 'react';
import LineChartComponent from '../Chart/Chart';

const useHooks = () => {
  const [laserPWM, setLaserPWM] = useState(0);
  const [temperature, setTemperature] = useState(35);

  const ButtonComponent = ({ label, otherCss }) => (
    <button className={`${otherCss} bg-gray-100 text-sm p-1 border rounded`}>
      {label}
    </button>
  );

  return {
    laserPWM,
    setLaserPWM,
    temperature,
    setTemperature,
    ButtonComponent
  };
};

const ControllerPage = () => {
  const { laserPWM, setLaserPWM, temperature, setTemperature, ButtonComponent } = useHooks();

  return (
    <div className="min-h-allView p-4 bg-gray-200">
      {/* Header Section */}
      <div className="grid grid-cols-4 gap-4 p-2 bg-white shadow mb-4 rounded">
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-500 rounded-full"></span>
          <span className="text-sm">Mass Flow Controller - Main Gas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-500 rounded-full"></span>
          <span className="text-sm">Mass Flow Controller - Carrier Gas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-500 rounded-full"></span>
          <span className="text-sm">Laser</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-500 rounded-full"></span>
          <span className="text-sm">Plasma</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-500 rounded-full"></span>
          <span className="text-sm">Heater</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-500 rounded-full"></span>
          <span className="text-sm">Ultrasonic</span>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-3 gap-4">
        {/* Left Column - MPC */}
        <div className="bg-white p-4 rounded shadow">
          <div className="space-y-4">
          <h3 className="font-bold mb-2">流量控制</h3>
            <div>
              <div className="mb-2">
                <span className="text-sm">主氣流量 (Main Gas Flow)</span>
                <input
                  type="text"
                  value="實際數值"
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50 mt-2"
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm">流量設定 (Main Gas Setting)</span>
                <input
                  type="number"
                  value="0"
                  className="min-w-24 p-1 border rounded"
                  readOnly
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm">目前氣體種類 (Gas Type)</span>
                <input
                  type="text"
                  value="N2"
                  readOnly
                  className="min-w-24 p-1 border rounded bg-gray-50"
                />
              </div>
            </div>
            <div>
              <div className="mb-2">
                <span className="text-sm">載氣流量 (Carrier Gas Flow)</span>
                <input
                  type="text"
                  value="實際數值"
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50 mt-2"
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm">流量設定 (Carrier Gas Setting)</span>
                <input
                  type="number"
                  value="0"
                  readOnly
                  className="min-w-24 p-1 border rounded"
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm">目前氣體種類 (Gas Type)</span>
                <input
                  type="text"
                  value="Ar"
                  readOnly
                  className="min-w-24 p-1 border rounded bg-gray-50"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Laser + Ultrasonic & Robot */}
        <div className="bg-white p-4 rounded shadow">
          <div className="space-y-4">
            {/* Laser Control */}
            <div className="border p-4 border-orange-300 rounded shadow">
              <h3 className="font-bold mb-2">雷射 (Laser)</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm whitespace-nowrap">Laser Power(%)</span>
                <input
                  type="number"
                  value={laserPWM}
                  onChange={(e) => setLaserPWM(e.target.value)}
                  placeholder="0"
                  className="w-20 p-1 border rounded"
                />
              </div>
              <span className="mb-2">詳細數值</span>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  value={laserPWM}
                  onChange={(e) => setLaserPWM(e.target.value)}
                  placeholder="0"
                  className="w-full p-1 border rounded"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ButtonComponent label="ON" />
                <ButtonComponent label="OFF" />
              </div>
            </div>
            <div className="border p-4 border-red-300 rounded shadow">
                <h3 className="font-bold mb-2">超音波震盪器 (Ultrasonic)</h3>
                <div className="flex items-center gap-2 mb-2">
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <ButtonComponent label="ON" />
                  <ButtonComponent label="OFF" />
                </div>
              </div>
          </div>
        </div>

        {/* Right Column - Heater & Plasma */}
        <div className="bg-white p-4 rounded shadow">
          <div className="space-y-4">
            {/* DI Section */}
            <div className="border p-4 border-blue-300 rounded shadow">
              <h3 className="font-bold mb-2">溫度控制器 (Heater)</h3>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm">Setting Value</span>
                  <input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="w-20 p-1 border rounded"
                  />
                  <span className="text-sm">°C</span>
                </div>
                <input
                  type="text"
                  value="實際數值"
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50"
                />
                <ButtonComponent label="Setting" otherCss={"w-full"}/>
              </div>
            </div>

            {/* Plasma Section */}
            <div className="border p-4 border-green-300 rounded shadow">
              <h3 className="font-bold mb-2">Plasma</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  'DO ON', 'DO OFF',
                  'FAN ON', 'FAN OFF',
                  'RY2 ON', 'RY2 OFF',
                  'RY3 ON', 'RY3 OFF'
                ].map((label) => (
                  <ButtonComponent key={label} label={label} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 這邊為下一層的內容 */}
      <div className="grid grid-cols-3 gap-4 mt-4">
        <div className="col-span-2 bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-bold mb-2">流量 / 電壓監測 (Air Flow / Voltage monitor)</h3>
          <LineChartComponent />
        </div>
        {/* Recipe 調整 */}
        <div className="bg-blue-200 p-4 rounded shadow">
          <div className="space-y-4">
              <div className="space-y-3 flex flex-col justify-between items-center gap-2">
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold mb-2 text-red-400">參數選擇 (Recipe Setting)</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-sm">Recipe: </span>
                    <select className="w-full p-1 border rounded">
                      <option>Recipe 1</option>
                      <option>Recipe 2</option>
                      <option>Recipe 3</option>
                    </select>
                  </div>
                  <div className='flex justify-between items-center gap-2'>
                    <span>主氣:</span>
                    <input
                      type="text"
                      value="100"
                      readOnly
                      className="min-min-w-24 p-1 border rounded bg-gray-50"
                    />
                    <span className='w-8'>
                      SLM
                    </span>
                  </div>
                  <div className='flex justify-between items-center gap-2'>
                    <span>載氣:</span>
                    <input
                      type="text"
                      value="100"
                      readOnly
                      className="min-w-24 p-1 border rounded bg-gray-50"
                    />
                    <span className='w-8'>
                      SCCM
                    </span>
                  </div>
                  <div className='flex justify-between items-center gap-2'>
                    <span>雷射:</span>
                    <input
                      type="text"
                      value="100"
                      readOnly
                      className="min-w-24 p-1 border rounded bg-gray-50"
                    />
                    <span className='w-8'>
                      %
                    </span>
                  </div>
                  <div className='flex justify-between items-center gap-2'>
                    <span>溫度:</span>
                    <input
                      type="text"
                      value="80"
                      readOnly
                      className="min-w-24 p-1 border rounded bg-gray-50"
                    />
                    <span className='w-8'>
                      °C
                    </span>
                  </div>
                  <div className='flex justify-between items-center gap-2'>
                    <span>電壓:</span>
                    <input
                      type="text"
                      value="270"
                      readOnly
                      className="min-w-24 p-1 border rounded bg-gray-50"
                    />
                    <span className='w-8'>
                      V
                    </span>
                  </div>
                  <div className='flex justify-between items-center gap-2'>
                    <span>震盪:</span>
                    <input
                      type="text"
                      value="ON"
                      readOnly
                      className="min-w-24 p-1 border rounded bg-gray-50"
                    />
                    <span className='w-8' />
                  </div>
                </div>
                <ButtonComponent label="套用 (Setting)" otherCss={"max-w-96"} />
              </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControllerPage;