import React, { useState } from 'react';
import { getApi } from '../../utils/getApi';
import AlertComponent from '../ComponentTools/Alert';
import LineChartComponent from '../Chart/Chart';
import { useAlicatContext } from '../../Contexts/AlicatContext';
import { Button } from 'flowbite-react';

const useHooks = () => {
  const { isCarrierGasOpenState } = useAlicatContext();
  const [carrierGasDetail, setCarrierGasDetail] = useState({});
  const [recipeDetail, setRecipeDetail] = useState([]);
  const [recipeSelected, setRecipeSelected] = useState('');
  const [recipeSelectedDetail, setRecipeSelectedDetail] = useState({});
  const [alertDetail, setAlertDetail] = React.useState({});
  const [laserPWM, setLaserPWM] = useState(0);
  const [temperature, setTemperature] = useState(35);

  // 取得載氣資料 API
  const getCarrierGasDataApi = async () => {
    const response = await getApi('/alicat_api/status', 'GET');
    console.log(response);
    if (response?.data?.status === 'success') {
      setCarrierGasDetail(response.data.data);
    } else {
      console.error(response?.data?.status);
    }
  };

  // 取得Recipe資料 API
  const getRecipeDataApi = async () => {
    const response = await getApi('/recipe_api/get_recipes', 'GET');
    console.log(response);
    if (response?.data?.status === 'success') {
      setRecipeDetail(response.data.data);
      setRecipeSelectedDetail(response.data.data[0] || {});
    } else {
      console.error(response?.data?.status);
    }
  };

  // 關閉Alert
  const onAlertClose = () => {
    setAlertDetail({
      show: false
    });
  };

  // 選擇recipe的Select option
  const onRecipeSelect = (key) => {
    setRecipeSelected(key);
    const selectedRecipe = recipeDetail.find((recipe) => recipe.id === key);
    setRecipeSelectedDetail(selectedRecipe);
  };
  
  // Button Component
  const ButtonComponent = ({ label, otherCss }) => (
    <Button
      className={`${otherCss} text-sm border rounded`}
      color="blue"
      size="sm"
    >
      {label}
    </Button>
  );

  React.useEffect(() => {
    let intervalId;
  
    if (isCarrierGasOpenState) {
      intervalId = setInterval(() => {
        getCarrierGasDataApi();
      }, 2000);
      console.log("Starting interval");
    }
  
    // 清理函數
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log("Clearing interval");
      }
    };
  }, [isCarrierGasOpenState]);

  React.useEffect(() => {
    getRecipeDataApi();
  }, []);

  return {
    isCarrierGasOpenState,
    carrierGasDetail,
    recipeDetail,
    recipeSelected,
    recipeSelectedDetail,
    alertDetail,
    onAlertClose,
    laserPWM,
    setLaserPWM,
    temperature,
    setTemperature,
    ButtonComponent,
    onRecipeSelect
  };
};

const ControllerPage = () => {
  const { isCarrierGasOpenState, carrierGasDetail, alertDetail, recipeDetail, recipeSelected, recipeSelectedDetail,
    onAlertClose, onRecipeSelect,
    laserPWM, setLaserPWM, temperature, setTemperature, ButtonComponent
  } = useHooks();

  return (
    <div className="min-h-allView p-4 bg-gray-200">
      <AlertComponent
        show={alertDetail.show}
        message={alertDetail.message}
        onClose={onAlertClose}
        type={alertDetail.type}
      />
      {/* Header Section */}
      <div className="grid grid-cols-3 gap-4 p-2 bg-white shadow mb-4 rounded">
        <div className="flex items-center gap-2">
          <span className={`${isCarrierGasOpenState ? 'bg-green-500' : 'bg-red-500'} w-4 h-4 bg-green-500 rounded-full`} />
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
      <div className="grid grid-cols-1 lg:grid-cols-3 md:grid-cols-3 gap-4">
        {/* Left Column - MPC */}
        <div className="bg-white p-4 rounded shadow">
          <div className="space-y-4">
          <h3 className="font-bold mb-2">流量控制</h3>
            <div className="border p-4 border-green-300 rounded shadow">
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
                <span className="text-sm w-48">流量設定 (Main Gas Setting)</span>
                <input
                  type="number"
                  value="0"
                  className="w-full p-1 border rounded"
                  readOnly
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm w-48">目前氣體種類 (Gas Type)</span>
                <input
                  type="text"
                  value="N2"
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50"
                />
              </div>
            </div>
            <div className="border p-4 border-blue-300 rounded shadow">
              <div className="mb-2">
                <span className="text-sm">載氣流量 (Carrier Gas Flow)</span>
                <input
                  type="number"
                  value={Number(carrierGasDetail?.mass_flow || 0).toFixed(2)}
                  step="0.01"
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50 mt-2"
                />
              </div>
              <div className="mb-2">
                <span className="text-sm">MFC溫度 (Carrier Gas Temp.)</span>
                <input
                  type="number"
                  value={Number(carrierGasDetail?.temperature || 0).toFixed(2)}
                  step="0.01"
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50 mt-2"
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm w-48">流量設定 (Carrier Gas Setting)</span>
                <input
                  type="number"
                  value="0"
                  readOnly={!isCarrierGasOpenState}
                  className={`${!isCarrierGasOpenState && "bg-gray-50"} w-full p-1 border rounded`}
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm w-48">目前氣體種類 (Gas Type)</span>
                <input
                  type="text"
                  value={carrierGasDetail?.gas || 'None'}
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50"
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
                  className="w-full p-1 border rounded"
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
              <h3 className="font-bold mb-2">Power supply</h3>
              <div
                className="flex items-center gap-2 mb-2"
              >
                <span className="text-sm w-24">Voltage</span>
                <input
                  type="number"
                  value="0"
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50"
                />
              </div>
              <div
                className="flex items-center gap-2 mb-2"
              >
                <span className="text-sm w-24">詳細數值</span>
                <input
                  type="number"
                  value="0"
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50"
                />
              </div>
              <div
                className="flex items-center gap-2 mb-2"
              >
                <span className="text-sm w-24">電流 (Current)</span>
                <input
                  type="number"
                  value="0"
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50"
                />
              </div>
              <div
                className="grid grid-cols-2 gap-2"
              >
                <ButtonComponent label="ON" />
                <ButtonComponent label="OFF" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* 這邊為下一層的內容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-4">
        <div className="col-span-1 lg:col-span-2 md:col-span-2 bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-bold mb-2">流量 / 電壓監測 (Flow / Voltage / Pressure monitor)</h3>
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
            <LineChartComponent 
              title="載氣流量監測"
              data={carrierGasDetail?.mass_flow || 0}
              label="Carrier Gas flow"
              yAxisLabel="Flow Rate (sccm)"
              yAxisMax={300}
              yAxisMin={0}
              yAxisStep={10}
              lineColor="rgb(192, 108, 75)"
              backgroundColor="rgba(192, 79, 75, 0.2)"
            />
            <LineChartComponent 
              title="載氣溫度監測"
              data={carrierGasDetail?.temperature || 0}
              label="Carrier Gas Temperature"
              yAxisLabel="Temperature (°C)"
              yAxisMax={50}
              yAxisMin={0}
              yAxisStep={5}
              lineColor="rgb(75, 192, 75)"
              backgroundColor="rgba(75, 192, 75, 0.2)"
            />
            <LineChartComponent 
              title="載氣壓力監測"
              data={carrierGasDetail?.pressure || 0}
              label="Carrier Gas Pressure"
              yAxisLabel="Pressure (PSI)"
              yAxisMax={20}
              yAxisMin={0}
              yAxisStep={2}
              lineColor="rgb(75, 75, 192)"
              backgroundColor="rgba(75, 75, 192, 0.2)"
            />
          </div>
        </div>
        {/* Recipe 調整 */}
        <div className="col-span-1 bg-gray-300 p-4 rounded shadow w-full">
          <div className="space-y-4">
            <div className="space-y-3 flex flex-col justify-between items-stretch gap-2 w-full">
              <div className="flex flex-col gap-2 w-full">
                <h3 className="font-bold mb-2 text-red-400 text-center">參數選擇 (Recipe Setting)</h3>
                
                {/* Recipe 選擇 */}
                <div className="flex items-center gap-2 w-full">
                  <span className="text-sm whitespace-nowrap w-16 font-bold">Recipe: </span>
                  <select
                    className="flex-1 p-1 border rounded min-w-0"
                    value={recipeSelected}
                    onChange={(e) => onRecipeSelect(e.target.value)}
                  >
                    {recipeDetail?.length > 0 ? recipeDetail.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>{recipe.parameter_name}</option>
                    )) : (
                      <option>None Recipe</option>
                    )}
                  </select>
                  <span className='w-12' />
                </div>

                {/* 參數輸入區 */}
                <div className="w-full space-y-2">
                  {[
                    { label: '主氣', value: recipeSelectedDetail.main_gas_flow || 0, unit: 'SLM' },
                    {label: '主氣氣體', value: recipeSelectedDetail.main_gas || 'None', unit: ''},
                    { label: '載氣', value: recipeSelectedDetail.carrier_gas_flow || 0, unit: 'SCCM' },
                    { label: '載氣氣體', value: recipeSelectedDetail.carrier_gas || 'None', unit: '' },
                    { label: '雷射功率', value: recipeSelectedDetail.laser_power || 0, unit: '%' },
                    { label: '溫度', value: recipeSelectedDetail.temperature || 0, unit: '°C' },
                    { label: '電壓', value: recipeSelectedDetail.voltage || 0, unit: 'V' },
                    { label: '建立時間', value: recipeSelectedDetail.created_time || '- -', unit: '' },
                    { label: '建立者', value: recipeSelectedDetail.created_by || '- -', unit: '' }
                  ].map((item, index) => (
                    <div key={index} className='flex items-center gap-2 w-full'>
                      <span className="w-16 whitespace-nowrap font-bold">{item.label}:</span>
                      <input
                        type="text"
                        value={item.value}
                        readOnly
                        className="flex-1 p-1 border rounded bg-gray-50 min-w-0"
                      />
                      <span className='w-12 text-right'>
                        {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 套用按鈕 */}
              <div className="w-full flex justify-center">
                <ButtonComponent label="套用 (Setting)" otherCss="w-full max-w-md" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControllerPage;