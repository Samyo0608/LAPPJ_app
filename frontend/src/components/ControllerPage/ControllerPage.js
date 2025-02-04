import React, { useState } from "react";
import { getApi } from "../../utils/getApi";
import AlertComponent from "../ComponentTools/Alert";
import LineChartComponent from "../Chart/Chart";
import { useAlicatContext } from "../../Contexts/AlicatContext";
import { useCo2LaserContext } from "../../Contexts/Co2LaserContext";
import { Button } from "flowbite-react";

// Button Component
const ButtonComponent = ({ label, otherCss, onClick, isDisabled }) => (
  <Button
    className={`${otherCss} text-sm border rounded`}
    color="blue"
    size="sm"
    onClick={onClick}
    disabled={isDisabled}
  >
    {label}
  </Button>
);

const useHooks = () => {
  const { isCarrierGasOpenState } = useAlicatContext();
  const { isCo2LaserOpenState } = useCo2LaserContext();
  const [carrierGasDetail, setCarrierGasDetail] = useState({});
  const [recipeDetail, setRecipeDetail] = useState([]);
  const [recipeSelected, setRecipeSelected] = useState("");
  const [recipeSelectedDetail, setRecipeSelectedDetail] = useState({});
  const [alertDetail, setAlertDetail] = React.useState({});
  const [co2LaserDetail, setCo2LaserDetail] = useState({});
  const [laserPWM, setLaserPWM] = useState(0);
  const [temperature, setTemperature] = useState(35);
  // 載氣流量監測資料
  const [carrierGasFlowData, setCarrierGasFlowData] = useState({
    history: [],
    labels: [],
  });
  // 載氣溫度監測資料
  const [carrierGasTemperatureData, setCarrierGasTemperatureData] = useState({
    history: [],
    labels: [],
  });
  // 載氣壓力監測資料
  const [carrierGasPressureData, setCarrierGasPressureData] = useState({
    history: [],
    labels: [],
  });
  // 載器流量設定
  const [carrierGasFlowSetting, setCarrierGasFlowSetting] = useState("");
  // 載氣loading，用於API載入時的loading效果，或是預防在status讀取的時候修改資料，造成資料錯誤
  const [isCarrierGasApiLoading, setIsCarrierGasApiLoading] = useState(false);

  // 取得載氣資料 API
  const getCarrierGasDataApi = async () => {
    setIsCarrierGasApiLoading(true);
    const response = await getApi("/alicat_api/status", "GET");
    console.log(response);
    if (response?.data?.status === "success") {
      setCarrierGasDetail(response.data.data);
      setIsCarrierGasApiLoading(false);
    } else {
      console.error(response?.data?.status);
      setIsCarrierGasApiLoading(false);
    }
  };

  // 修改載氣流量
  const setCarrierGasFlowApi = async () => {
    // 如果isCarrierGasApiLoading為true，則不執行後續，然後等待isCarrierGasApiLoading為false時，再執行後續
    if (isCarrierGasApiLoading) {
      setAlertDetail({
        show: true,
        message: "載氣資料讀取中，請稍後再試",
        type: "warning",
      });

      setTimeout(() => {
        setAlertDetail({
          type: "warning",
          message: "載氣資料讀取中，請稍後再試",
          show: false,
        });
      }, 1000);
    }

    const response = await getApi("/alicat_api/set_flow_rate", "POST", {
      flow_rate: carrierGasFlowSetting,
    });

    if (response?.data?.status === "success") {
      setAlertDetail({
        show: true,
        message: response.data.message,
        type: "success",
      });

      setTimeout(() => {
        setAlertDetail({
          type: "success",
          message: response.data.message,
          show: false,
        });
      }, 3000);
    } else {
      setAlertDetail({
        show: true,
        message: response.data.message,
        type: "failure",
      });

      setTimeout(() => {
        setAlertDetail({
          type: "failure",
          message: response.data.message,
          show: false,
        });
      }, 3000);
    }
  };

  // 取得CO2雷射資料 api
  const getCo2LaserDataApi = async () => {
    const response = await getApi("/uc2000/status", "GET");
    console.log(response);
    if (response?.data?.status === "success") {
      setCo2LaserDetail(response.data.data);
    } else {
      console.error(response?.data?.status);
    }
  };

  // 修改CO2雷射功率 api
  const setCo2LaserPowerApi = async () => {
    const response = await getApi("/uc2000/set_pwm", "POST", {
      percentage: laserPWM,
    });

    if (response?.data?.status === "success") {
      setAlertDetail({
        show: true,
        message: response.data.message,
        type: "success",
      });

      getCo2LaserDataApi();

      setTimeout(() => {
        setAlertDetail({
          type: "success",
          message: response.data.message,
          show: false,
        });
      }, 3000);

    } else {
      setAlertDetail({
        show: true,
        message: response.data.message,
        type: "failure",
      });

      setTimeout(() => {
        setAlertDetail({
          type: "failure",
          message: response.data.message,
          show: false,
        });
      }, 3000);
    }
  }

  // 更改CO2雷射開關狀態
  const setCo2LaserOpenState = async (openState) => {
    const response = await getApi("/uc2000/set_laser", "POST", {
      enable: openState,
    });

    if (response?.data?.status === "success") {
      setAlertDetail({
        show: true,
        message: response.data.message,
        type: "success",
      });

      setTimeout(() => {
        setAlertDetail({
          type: "success",
          message: response.data.message,
          show: false,
        });
      }, 3000);
    } else {
      setAlertDetail({
        show: true,
        message: response.data.message,
        type: "failure",
      });

      setTimeout(() => {
        setAlertDetail({
          type: "failure",
          message: response.data.message,
          show: false,
        });
      }, 3000);
    }
  };

  // 取得Recipe資料 API
  const getRecipeDataApi = async () => {
    const response = await getApi("/recipe_api/get_recipes", "GET");
    console.log(response);
    if (response?.data?.status === "success") {
      setRecipeDetail(response.data.data);
      setRecipeSelectedDetail(response.data.data[0] || {});
    } else {
      console.error(response?.data?.status);
    }
  };

  // 載氣流量設定的Change事件
  const onCarrierFlowSettingChange = (e) => {
    setCarrierGasFlowSetting(e.target.value);
  };

  // 載氣流量設定的Click事件
  const onCarrierFlowSettingClick = () => {
    setCarrierGasFlowApi();
  };

  // 關閉Alert
  const onAlertClose = () => {
    setAlertDetail({
      show: false,
    });
  };

  // 選擇recipe的Select option
  const onRecipeSelect = (key) => {
    setRecipeSelected(key);
    const selectedRecipe = recipeDetail.find((recipe) => recipe.id === key);
    setRecipeSelectedDetail(selectedRecipe);
  };

  React.useEffect(() => {
    let intervalId;

    if (isCarrierGasOpenState) {
      intervalId = setInterval(() => {
        getCarrierGasDataApi();
      }, 3000);
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
    // 當有新的資料時，加入最新值與當前時間
    if (carrierGasDetail) {
      const currentTime = new Date().toLocaleTimeString("en-GB");
      setCarrierGasFlowData((prev) => {
        const newHistory = [
          ...prev.history,
          Number(carrierGasDetail?.mass_flow || 0),
        ];
        const newLabels = [...prev.labels, currentTime];
        // 限制只保留 10 筆資料
        if (newHistory.length > 10) newHistory.shift();
        if (newLabels.length > 10) newLabels.shift();
        return {
          history: newHistory,
          labels: newLabels,
        };
      });
      setCarrierGasTemperatureData((prev) => {
        const newHistory = [
          ...prev.history,
          Number(carrierGasDetail?.temperature || 0),
        ];
        const newLabels = [...prev.labels, currentTime];
        // 限制只保留 10 筆資料
        if (newHistory.length > 10) newHistory.shift();
        if (newLabels.length > 10) newLabels.shift();
        return {
          history: newHistory,
          labels: newLabels,
        };
      });
      setCarrierGasPressureData((prev) => {
        const newHistory = [
          ...prev.history,
          Number(carrierGasDetail?.pressure || 0),
        ];
        const newLabels = [...prev.labels, currentTime];
        // 限制只保留 10 筆資料
        if (newHistory.length > 10) newHistory.shift();
        if (newLabels.length > 10) newLabels.shift();
        return {
          history: newHistory,
          labels: newLabels,
        };
      });
    }
  }, [carrierGasDetail]);

  React.useEffect(() => {
    getRecipeDataApi();
  }, []);

  React.useEffect(() => {
    if (isCo2LaserOpenState) {
      getCo2LaserDataApi();
    }
  }, [isCo2LaserOpenState]);

  return {
    isCarrierGasOpenState,
    carrierGasDetail,
    recipeDetail,
    recipeSelected,
    recipeSelectedDetail,
    alertDetail,
    carrierGasFlowData,
    carrierGasPressureData,
    carrierGasTemperatureData,
    carrierGasFlowSetting,
    isCo2LaserOpenState,
    co2LaserDetail,
    onAlertClose,
    laserPWM,
    setLaserPWM,
    temperature,
    setTemperature,
    onRecipeSelect,
    onCarrierFlowSettingChange,
    onCarrierFlowSettingClick,
    setCo2LaserPowerApi,
    setCo2LaserOpenState,
  };
};

const ControllerPage = () => {
  const {
    isCarrierGasOpenState,
    carrierGasDetail,
    alertDetail,
    recipeDetail,
    recipeSelected,
    recipeSelectedDetail,
    carrierGasFlowData,
    carrierGasFlowSetting,
    carrierGasPressureData,
    carrierGasTemperatureData,
    isCo2LaserOpenState,
    co2LaserDetail,
    onAlertClose,
    onRecipeSelect,
    laserPWM,
    setLaserPWM,
    temperature,
    setTemperature,
    onCarrierFlowSettingChange,
    onCarrierFlowSettingClick,
    setCo2LaserPowerApi,
    setCo2LaserOpenState,
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
          <span
            className={`${
              isCarrierGasOpenState ? "bg-green-500" : "bg-red-500"
            } w-4 h-4 bg-green-500 rounded-full`}
          />
          <span className="text-sm">Mass Flow Controller - Main Gas</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 bg-green-500 rounded-full"></span>
          <span className="text-sm">Mass Flow Controller - Carrier Gas</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`${
              isCo2LaserOpenState ? "bg-green-500" : "bg-red-500"
            } w-4 h-4 bg-green-500 rounded-full`}
          />
          <span className="text-sm">Co2 Laser</span>
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
            <div className="border p-4 border-green-300 rounded shadow">
              <div className="mb-2">
                <h3 className="font-bold mb-2">主氣流量 (Main Gas Flow)</h3>
                <input
                  type="text"
                  value="實際數值"
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50 mt-2"
                />
              </div>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm w-48">
                  流量設定 (Main Gas Setting)
                </span>
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
              <h3 className="font-bold mb-2">載氣流量 (Carrier Gas Flow)</h3>
              <div className="flex justify-between items-center gap-2">
                <span className="text-sm w-72">目前氣體種類 (Gas Type)</span>
                <input
                  type="text"
                  value={carrierGasDetail?.gas || "None"}
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50"
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
              <div className="mb-2">
                <span className="text-sm">
                  即時載氣流量 (Dynamic Carrier Gas Flow)
                </span>
                <input
                  type="number"
                  value={Number(carrierGasDetail?.mass_flow || 0).toFixed(2)}
                  step="0.01"
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50 mt-2"
                />
              </div>
              <div className="mb-2 flex items-center gap-2 flex-wrap justify-between">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <span className="text-sm w-72">流量設定 (Flow Setting)</span>
                  <input
                    type="number"
                    step="0.001"
                    value={carrierGasFlowSetting}
                    readOnly={!isCarrierGasOpenState}
                    className={`${
                      !isCarrierGasOpenState && "bg-gray-50"
                    } p-1 border rounded`}
                    onChange={onCarrierFlowSettingChange}
                  />
                </div>
                <ButtonComponent
                  label="流量設定"
                  onClick={onCarrierFlowSettingClick}
                />
              </div>
              <div className="mb-2 flex items-center gap-2 flex-wrap justify-between">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <span className="text-sm w-72">目前流量設定值</span>
                  <input
                    type="number"
                    value={carrierGasDetail?.setpoint || 0}
                    readOnly
                    className="p-1 border rounded bg-gray-50 mb-2"
                  />
                </div>
                <span className="text-md">sccm</span>
              </div>
            </div>
          </div>
        </div>

        {/* Middle Column - Laser + Ultrasonic & Robot */}
        <div className="bg-white p-4 rounded shadow">
          <div className="space-y-4">
            {/* Laser Control */}
            <div className="border p-4 border-orange-300 rounded shadow">
              <h3 className="font-bold mb-2">Co2 雷射 (Co2 Laser)</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm whitespace-nowrap">
                  PWM percentage (%)
                </span>
                <input
                  type="number"
                  value={laserPWM}
                  onChange={(e) => setLaserPWM(e.target.value)}
                  placeholder="0"
                  className="w-full p-1 border rounded"
                />
                <ButtonComponent
                  otherCss="w-72"
                  label="設定"
                  onClick={setCo2LaserPowerApi}
                />
              </div>
              <span className="text-sm mb-2">目前PWM percentage (%)</span>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  step={0.1}
                  value={co2LaserDetail?.pwm_percentage || 0}
                  onChange={(e) => setLaserPWM(Number(e.target.value))}
                  placeholder="0"
                  className="w-full p-1 border rounded bg-gray-50"
                  readOnly
                />
              </div>
              <span className="mb-2">Power percentage (%)</span>
              <div className="flex items-center gap-2 mb-2">
                <input
                  type="number"
                  value={co2LaserDetail?.power_percentage || 0}
                  onChange={(e) => setLaserPWM(e.target.value)}
                  placeholder="0"
                  className="w-full p-1 border rounded bg-gray-50"
                  readOnly
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <ButtonComponent
                  label="ON"
                  isDisabled={!isCo2LaserOpenState}
                  onClick={() => setCo2LaserOpenState(true)}
                />
                <ButtonComponent
                  label="OFF" 
                  isDisabled={!isCo2LaserOpenState}
                  onClick={() => setCo2LaserOpenState(false)}
                />
              </div>
            </div>
            <div className="border p-4 border-red-300 rounded shadow">
              <h3 className="font-bold mb-2">超音波震盪器 (Ultrasonic)</h3>
              <div className="flex items-center gap-2 mb-2"></div>
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
                <ButtonComponent label="Setting" otherCss={"w-full"} />
              </div>
            </div>

            {/* Plasma Section */}
            <div className="border p-4 border-green-300 rounded shadow">
              <h3 className="font-bold mb-2">Power supply</h3>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm w-24">Voltage</span>
                <input
                  type="number"
                  value="0"
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50"
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm w-24">詳細數值</span>
                <input
                  type="number"
                  value="0"
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50"
                />
              </div>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm w-24">電流 (Current)</span>
                <input
                  type="number"
                  value="0"
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
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
          <h3 className="font-bold mb-2">
            流量 / 電壓監測 (Flow / Voltage / Pressure monitor)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-2 gap-4">
            <LineChartComponent
              title="載氣流量監測"
              data={carrierGasDetail?.mass_flow || 0}
              dataHistory={carrierGasFlowData.history}
              timeLabels={carrierGasFlowData.labels}
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
              dataHistory={carrierGasTemperatureData.history}
              timeLabels={carrierGasTemperatureData.labels}
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
              dataHistory={carrierGasPressureData.history}
              timeLabels={carrierGasPressureData.labels}
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
                <h3 className="font-bold mb-2 text-red-400 text-center">
                  參數選擇 (Recipe Setting)
                </h3>

                {/* Recipe 選擇 */}
                <div className="flex items-center gap-2 w-full">
                  <span className="text-sm whitespace-nowrap w-16 font-bold">
                    Recipe:{" "}
                  </span>
                  <select
                    className="flex-1 p-1 border rounded min-w-0"
                    value={recipeSelected}
                    onChange={(e) => onRecipeSelect(e.target.value)}
                  >
                    {recipeDetail?.length > 0 ? (
                      recipeDetail.map((recipe) => (
                        <option key={recipe.id} value={recipe.id}>
                          {recipe.parameter_name}
                        </option>
                      ))
                    ) : (
                      <option>None Recipe</option>
                    )}
                  </select>
                  <span className="w-12" />
                </div>

                {/* 參數輸入區 */}
                <div className="w-full space-y-2">
                  {[
                    {
                      label: "主氣",
                      value: recipeSelectedDetail.main_gas_flow || 0,
                      unit: "SLM",
                    },
                    {
                      label: "主氣氣體",
                      value: recipeSelectedDetail.main_gas || "None",
                      unit: "",
                    },
                    {
                      label: "載氣",
                      value: recipeSelectedDetail.carrier_gas_flow || 0,
                      unit: "SCCM",
                    },
                    {
                      label: "載氣氣體",
                      value: recipeSelectedDetail.carrier_gas || "None",
                      unit: "",
                    },
                    {
                      label: "雷射功率",
                      value: recipeSelectedDetail.laser_power || 0,
                      unit: "%",
                    },
                    {
                      label: "溫度",
                      value: recipeSelectedDetail.temperature || 0,
                      unit: "°C",
                    },
                    {
                      label: "電壓",
                      value: recipeSelectedDetail.voltage || 0,
                      unit: "V",
                    },
                    {
                      label: "建立時間",
                      value: recipeSelectedDetail.created_time || "- -",
                      unit: "",
                    },
                    {
                      label: "建立者",
                      value: recipeSelectedDetail.created_by || "- -",
                      unit: "",
                    },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-2 w-full">
                      <span className="w-16 whitespace-nowrap font-bold">
                        {item.label}:
                      </span>
                      <input
                        type="text"
                        value={item.value}
                        readOnly
                        className="flex-1 p-1 border rounded bg-gray-50 min-w-0"
                      />
                      <span className="w-12 text-right">{item.unit}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 套用按鈕 */}
              <div className="w-full flex justify-center">
                <ButtonComponent
                  label="套用 (Setting)"
                  otherCss="w-full max-w-md"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControllerPage;
