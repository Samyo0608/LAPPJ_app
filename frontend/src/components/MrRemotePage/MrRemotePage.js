import React, { useState, useEffect } from "react";
import { Button } from "flowbite-react";
import AlertComponent from "../ComponentTools/Alert";
import { getApi } from "../../utils/getApi";
import { useUltrasonicContext } from "../../Contexts/UltrasonicContext";
import { useSocket } from "../../Contexts/SocketioContext";
import azbil_code_detail from "../ControllerPage/azbil_code_detail.json"

const ButtonComponent = ({ label, otherCss, onClick, isDisabled, loading = false, isOpen, gradientMonochrome }) => (
  <Button
    className={`${otherCss} text-sm border rounded max-w-72`}
    gradientMonochrome={isOpen ? "purple" : gradientMonochrome}
    size="sm"
    onClick={onClick}
    disabled={isDisabled || loading}
  >
    {loading ? <div className="h-5 w-5 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" /> : label}
  </Button>
);

// Status Indicator Component
const StatusIndicator = ({ isConnected, label }) => (
  <div className="flex items-center gap-2">
    <span
      className={`${
        isConnected ? "bg-green-500" : "bg-red-500"
      } w-4 h-4 rounded-full min-w-4`}
    />
    <span className="text-sm">{label}</span>
  </div>
);

// Parameter Display Component
const ParameterDisplay = ({ label, value, unit, readOnly = true, onChange, className = "" }) => (
  <div className="flex justify-center items-center gap-2 flex-wrap mb-2">
    <span className="text-sm w-40">{label}</span>
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        onChange={onChange}
        readOnly={readOnly}
        className={`p-1 border rounded ${readOnly ? "bg-gray-50" : ""} w-32 ${className}`}
      />
      <span className="text-sm w-10">{unit}</span>
    </div>
  </div>
);

// Prediction Card Component
const PredictionCard = ({ title, value, recommendations }) => (
  <div className="border p-4 rounded shadow bg-blue-50 flex flex-col">
    <h3 className="font-bold text-center mb-2">{title}</h3>
    <div className="flex items-center justify-center mb-4">
      <span className="text-2xl font-bold text-blue-700">{value}</span>
    </div>
    <h4 className="font-semibold mb-2">建議參數設定：</h4>
    <div className="space-y-2">
      {recommendations.map((rec, index) => (
        <div key={index} className="flex justify-between">
          <span>{rec.name}:</span>
          <span className="font-medium">{rec.value} {rec.unit}</span>
        </div>
      ))}
    </div>
  </div>
);

const MrRemotePage = () => {
  // Context hooks
  const { ultrasonicOpenFlag } = useUltrasonicContext();
  const { messages } = useSocket();
  const isMainGasOpenState = messages.filter(socket => socket.data.device_type === "azbil")[0]?.data?.status === "connected";
  const isCarrierGasOpenState = messages.filter(socket => socket.data.device_type === "alicat")[0]?.data?.status === "connected";
  const isHeaterOpenState = messages.filter(socket => socket.data.device_type === "heater")[0]?.data?.status === "connected";
  const isCo2LaserOpenState = messages.filter(socket => socket.data.device_type === "co2laser")[0]?.data?.status === "connected";
  const isUltrasonicOpenState = messages.filter(socket => socket.data.device_type === "ultrasonic")[0]?.data?.status === "connected";
  const isPowerSupplyOpenState = messages.filter(socket => socket.data.device_type === "powersuppply")[0]?.data?.status === "connected";
  const isRobotArmOpenState = messages.filter(socket => socket.data.device_type === "robotarm")[0]?.data?.status === "connected";

  const apiCalledRef = React.useRef({
    azbil: false,
    alicat: false,
    co2laser: false,
    heater: false
  });

  // Main Gas States
  const [mainGasDetail, setMainGasDetail] = useState({
    PV_FLOW: 0,
    SETTING_SP_FLOW: 0,
    TOTAL_FLOW: 0,
    FLOW_UNIT: "slm",
    TOTAL_FLOW_UNIT: "L",
    GATE_CONTROL: 0
  });
  const [mainGasFlowSetting, setMainGasFlowSetting] = useState('');

  // Carrier Gas States
  const [carrierGasDetail, setCarrierGasDetail] = useState({
    gas: "Ar+H2",
    temperature: 0,
    mass_flow: 0,
    setpoint: 0,
    pressure: 0
  });
  const [carrierGasFlowSetting, setCarrierGasFlowSetting] = useState(0);
  // CO2 Laser States
  const [co2LaserDetail, setCo2LaserDetail] = useState({
    pwm_percentage: 0,
    laser_on: false
  });
  const [laserPWM, setLaserPWM] = useState(0);

  // Heater States
  const [heaterDetail, setHeaterDetail] = useState({
    PV: 0,
    SV: 0,
    decimal_point: 1
  });
  const [temperature, setTemperature] = useState(0);

  // Power Supply States
  const [powerSupplyDetail, setPowerSupplyDetail] = useState({
    voltage: 0,
    error: null,
    ready: true,
    dc1_on: false
  });
  const [powerSupplyVoltage, setPowerSupplyVoltage] = useState(0);

  // Prediction States
  const predictedResistance = "8.5 kΩ";

  const recommendations = [
    { name: "主氣流量", value: "15.2", unit: "slm" },
    { name: "載氣流量", value: "0.25", unit: "slm" },
    { name: "CO2雷射功率", value: "32", unit: "%" },
    { name: "電壓", value: "500", unit: "V" }
  ];

  // Alert State
  const [alertDetail, setAlertDetail] = useState({
    show: false,
    message: "",
    type: "success"
  });

  // 將main gas flow的對應轉換方式獨立出來
  const convertMainGasFlow = React.useCallback((value) => {
    // 對PV_FLOW和SETTING_SP_FLOW進行小數點處理以及單位轉換
    let newSettingSp = (Number(value.SETTING_SP_FLOW) * 0.1).toFixed(Number(value.FLOW_DECIMAL));
    let newPvFlow = Number(value.PV_FLOW) * 0.1;

    switch (Number(value.FLOW_UNIT)) {
      case 0:
        newSettingSp = newSettingSp * 1000;
        newPvFlow = newPvFlow * 1000;
        break;
      case 2:
        newSettingSp = newSettingSp * 0.06;
        newPvFlow = newPvFlow * 0.06;
        break;
      default:
        break;
    }

    // 對TOTAL_FLOW進行小數點處理以及單位轉換 0: mL, 1: L, 2: m^3
    let newTotalFlow = (Number(value.TOTAL_FLOW * 0.1 ).toFixed(value.TOTAL_FLOW_DECIMAL));
    switch (Number(value.TOTAL_FLOW_UNIT)) {
      case 0:
        newTotalFlow = newTotalFlow * 1000;
        break;
      case 2:
        newTotalFlow = newTotalFlow / 1000;
        break;
      default:
        break;
    }

    const flowUnit = azbil_code_detail.FLOW_UNIT_MAP[value.FLOW_UNIT];
    const totalFlowUnit = azbil_code_detail.TOTAL_FLOW_UNIT_MAP[value.TOTAL_FLOW_UNIT];
    value.FLOW_UNIT = flowUnit;
    value.TOTAL_FLOW_UNIT = totalFlowUnit;
    value.SETTING_SP_FLOW = newSettingSp;
    value.PV_FLOW = newPvFlow;
    value.TOTAL_FLOW = newTotalFlow;

    return value;
  }, []);

  // Get Main Gas Data API
  const getMainGasDataApi = React.useCallback(async () => {
    try {
      const response = await getApi("/azbil_api/get_main_status", "GET");
      if (response?.data?.status === "success") {
        // 比較response.data.data與azbil_code_detail的value，並轉換成azbil_code_detail內的value
        const newMainGasDetail = response.data.data;
        const newMainGasDetailConverted = convertMainGasFlow(newMainGasDetail);

        setMainGasDetail(newMainGasDetailConverted);
      } else {
        console.error(response?.data?.status);
      }
    } catch (error) {
      console.error(error);
    }
  }, [convertMainGasFlow]);

  // Get Carrier Gas Data API
  const getCarrierGasDataApi = React.useCallback(async () => {
    try {
      const response = await getApi("/alicat_api/status", "GET");
      if (response?.data?.status === "success") {
        setCarrierGasDetail(response.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  // Get CO2 Laser Data API
  const getCo2LaserDataApi = React.useCallback(async () => {
    try {
      const response = await getApi("/uc2000/status", "GET");
      if (response?.data?.status === "success") {
        setCo2LaserDetail(response.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  // Get Heater Data API
  const getHeaterDataApi = React.useCallback(async () => {
    try {
      const response = await getApi("/heater/status", "GET");
      if (response?.data?.status === "success") {
        setHeaterDetail(response.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  // Get Power Supply Status API
  const getPowerSupplyStatusApi = React.useCallback(async () => {
    try {
      const response = await getApi("/power_supply/status", "GET");
      if (response?.data?.status === "success") {
        setPowerSupplyDetail(response.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  }, []);

  const setMainGasFlowApi = async (data) => {
    try {
      // 修改回傳的值
      // 規則和取得主氣資料一樣
      let newSettingSp = mainGasFlowSetting || data;

      switch (mainGasDetail.FLOW_UNIT) {
        case "mL/min":
          newSettingSp = Number(mainGasFlowSetting || data) / 100;
          break;
        case "L/min":
          newSettingSp = Number(mainGasFlowSetting || data) * 10;
          break;
        case "m^3/h":
          newSettingSp = Number(mainGasFlowSetting || data) / 0.06 * 10;
          break;
        default:
          newSettingSp = Number(mainGasFlowSetting || data);
          break;
      }

      const response = await getApi("/azbil_api/set_flow", "POST", {
        flow: newSettingSp,
      });
  
      if (response?.data?.status === "success") {
        getMainGasDataApi();
        setAlertDetail({
          show: true,
          message: response.data.message,
          type: "success",
        });
      } else {
        setAlertDetail({
          show: true,
          message: response.data.message,
          type: "failure",
        });
      }
    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: "發生錯誤，請稍後再試",
        type: "failure",
      });
    } finally {
      setTimeout(() => {
        setAlertDetail((prev) => ({
          ...prev,
          show: false,
        }));
      }, 2000);
    }
  };

  // Set Carrier Gas Flow API
  const setCarrierGasFlowApi = async () => {
    try {
      const response = await getApi("/alicat_api/set_flow_rate", "POST", {
        flow_rate: Number(carrierGasFlowSetting),
      });
      
      if (response?.data?.status === "success") {
        setAlertDetail({
          show: true,
          message: "載氣流量設定成功",
          type: "success"
        });
        getCarrierGasDataApi();
      } else {
        setAlertDetail({
          show: true,
          message: "載氣流量設定失敗",
          type: "failure"
        });
      }
    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: "設定過程發生錯誤",
        type: "failure"
      });
    } finally {
      setTimeout(() => {
        setAlertDetail(prev => ({ ...prev, show: false }));
      }, 2000);
    }
  };

  // Set CO2 Laser Power API
  const setCo2LaserPowerApi = async () => {
    try {
      const response = await getApi("/uc2000/set_pwm", "POST", {
        percentage: Number(laserPWM),
      });
      
      if (response?.data?.status === "success") {
        setAlertDetail({
          show: true,
          message: "雷射功率設定成功",
          type: "success"
        });
        getCo2LaserDataApi();
      } else {
        setAlertDetail({
          show: true,
          message: "雷射功率設定失敗",
          type: "failure"
        });
      }
    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: "設定過程發生錯誤",
        type: "failure"
      });
    } finally {
      setTimeout(() => {
        setAlertDetail(prev => ({ ...prev, show: false }));
      }, 2000);
    }
  };

  // Set Heater Temperature API
  const setHeaterTemperatureApi = async () => {
    try {
      const response = await getApi("/heater/update", "POST", {
        SV: Number(heaterDetail?.decimal_point) === 1 ? Number(temperature * 10) : Number(temperature),
      });
      
      if (response?.data?.status === "success") {
        setAlertDetail({
          show: true,
          message: "溫度設定成功",
          type: "success"
        });
        getHeaterDataApi();
      } else {
        setAlertDetail({
          show: true,
          message: "溫度設定失敗",
          type: "failure"
        });
      }
    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: "設定過程發生錯誤",
        type: "failure"
      });
    } finally {
      setTimeout(() => {
        setAlertDetail(prev => ({ ...prev, show: false }));
      }, 2000);
    }
  };

  // Set Power Supply Voltage API
  const setPowerSupplyVoltageApi = async () => {
    try {
      const response = await getApi("/power_supply/write_voltage", "POST", {
        voltage: Number(powerSupplyVoltage),
      });
      
      if (response?.data?.status === "success") {
        setAlertDetail({
          show: true,
          message: "電壓設定成功",
          type: "success"
        });
        getPowerSupplyStatusApi();
      } else {
        setAlertDetail({
          show: true,
          message: "電壓設定失敗",
          type: "failure"
        });
      }
    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: "設定過程發生錯誤",
        type: "failure"
      });
    } finally {
      setTimeout(() => {
        setAlertDetail(prev => ({ ...prev, show: false }));
      }, 2000);
    }
  };

  // Apply Recommended Settings
  const applyRecommendedSettings = async () => {
    // Extract values from recommendations
    const recommendedSettings = recommendations.reduce((acc, rec) => {
      acc[rec.name] = rec.value;
      return acc;
    }, {});
    
    try {
      setAlertDetail({
        show: true,
        message: "正在應用建議參數...",
        type: "info"
      });
      
      // Apply settings in sequence
      if (isMainGasOpenState) {
        setMainGasFlowSetting(recommendedSettings["主氣流量"]);
        await setMainGasFlowApi();
      }
      
      if (isCarrierGasOpenState) {
        setCarrierGasFlowSetting(recommendedSettings["載氣流量"]);
        await setCarrierGasFlowApi();
      }
      
      if (isCo2LaserOpenState) {
        setLaserPWM(recommendedSettings["CO2雷射功率"]);
        await setCo2LaserPowerApi();
      }
      
      if (isHeaterOpenState) {
        setTemperature(recommendedSettings["溫度"]);
        await setHeaterTemperatureApi();
      }
      
      if (isPowerSupplyOpenState) {
        setPowerSupplyVoltage(recommendedSettings["電壓"]);
        await setPowerSupplyVoltageApi();
      }
      
      setAlertDetail({
        show: true,
        message: "已成功應用所有建議參數",
        type: "success"
      });
    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: "應用建議參數時發生錯誤",
        type: "failure"
      });
    } finally {
      setTimeout(() => {
        setAlertDetail(prev => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  // Close Alert
  const onAlertClose = () => {
    setAlertDetail(prev => ({ ...prev, show: false }));
  };

  useEffect(() => {
    // 遍歷訊息並檢查設備狀態變化
    messages.forEach(socketData => {
      const deviceType = socketData?.data?.device_type;
      const status = socketData?.data?.status;
      
      if (status === "connected") {
        switch (deviceType) {
          case "azbil":
            // 只有在第一次連接時調用 API
            if (!apiCalledRef.current.azbil) {
              getMainGasDataApi();
              apiCalledRef.current.azbil = true;
            }
            break;
          case "alicat":
            if (!apiCalledRef.current.alicat) {
              getCarrierGasDataApi();
              apiCalledRef.current.alicat = true;
            }
            break;
          case "co2laser":
            if (!apiCalledRef.current.co2laser) {
              getCo2LaserDataApi();
              apiCalledRef.current.co2laser = true;
            }
            break;
          case "heater":
            if (!apiCalledRef.current.heater) {
              getHeaterDataApi();
              apiCalledRef.current.heater = true;
            }
            break;
          case "ultrasonic":
            if (!apiCalledRef.current.ultrasonic) {
              apiCalledRef.current.ultrasonic = true;
            }
            break;
          default:
            break;
        }
      } else if (status === "disconnected" || status === "connect_failed") {
        switch (deviceType) {
          case "azbil":
            apiCalledRef.current.azbil = false;
            break;
          case "alicat":
            apiCalledRef.current.alicat = false;
            break;
          case "co2laser":
            apiCalledRef.current.co2laser = false;
            break;
          case "heater":
            apiCalledRef.current.heater = false;
            break;
          case "ultrasonic":
            apiCalledRef.current.ultrasonic = false;
            break;
          default:
            break;
        }
      }
    });
    
  }, [messages, apiCalledRef, 
    getMainGasDataApi, getCarrierGasDataApi, getCo2LaserDataApi, getHeaterDataApi, getPowerSupplyStatusApi]);

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <AlertComponent
        show={alertDetail.show}
        message={alertDetail.message}
        onClose={onAlertClose}
        type={alertDetail.type}
      />
      
      <div className="container mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-center">MR遠端監控系統</h1>
        
        {/* Connection Status Panel */}
        <div className="bg-white p-4 rounded-lg shadow-md mb-6">
          <h2 className="text-lg font-semibold mb-3">連線狀態</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatusIndicator isConnected={isMainGasOpenState} label="主氣流量" />
            <StatusIndicator isConnected={isCarrierGasOpenState} label="載氣流量" />
            <StatusIndicator isConnected={isCo2LaserOpenState} label="CO2 雷射" />
            <StatusIndicator isConnected={isHeaterOpenState} label="溫度控制器" />
            <StatusIndicator isConnected={isUltrasonicOpenState} label="超音波震盪器" />
            <StatusIndicator isConnected={isPowerSupplyOpenState} label="脈衝電源控制器" />
            <StatusIndicator isConnected={isRobotArmOpenState} label="機械手臂" />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Main Gas Section */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-center">主氣流量</h2>
            <div className="space-y-2">
              <ParameterDisplay 
                label="即時主氣流量 (PV)" 
                value={Number(mainGasDetail?.PV_FLOW || 0).toFixed(1)}
                unit={mainGasDetail?.FLOW_UNIT || "slm"}
              />
              <ParameterDisplay 
                label="即時流量設定 (SV)" 
                value={mainGasFlowSetting}
                unit={mainGasDetail?.FLOW_UNIT || "slm"}
                readOnly={!isMainGasOpenState}
                onChange={(e) => setMainGasFlowSetting(e.target.value)}
                className={!isMainGasOpenState ? "bg-gray-50" : ""}
              />
              <ParameterDisplay 
                label="目前流量設定值" 
                value={mainGasDetail?.SETTING_SP_FLOW || 0}
                unit={mainGasDetail?.FLOW_UNIT || "slm"}
              />
            </div>
          </div>
          
          {/* Carrier Gas Section */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-center">載氣流量</h2>
            <div className="space-y-2">
              <ParameterDisplay 
                label="即時載氣流量 (SV)" 
                value={Number(carrierGasDetail?.mass_flow || 0).toFixed(3)}
                unit="slm"
              />
              <ParameterDisplay 
                label="即時流量設定 (SV)" 
                value={carrierGasFlowSetting}
                unit="slm"
                readOnly={!isCarrierGasOpenState}
                onChange={(e) => setCarrierGasFlowSetting(e.target.value)}
                className={!isCarrierGasOpenState ? "bg-gray-50" : ""}
              />
              <ParameterDisplay 
                label="目前流量設定值" 
                value={carrierGasDetail?.setpoint || 0}
                unit="slm"
              />
            </div>
          </div>
          
          {/* CO2 Laser Section */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-center">CO2 雷射</h2>
            <div className="space-y-2">
              <ParameterDisplay 
                label="PWM 設定" 
                value={laserPWM}
                unit="%"
                readOnly={!isCo2LaserOpenState}
                onChange={(e) => setLaserPWM(e.target.value)}
                className={!isCo2LaserOpenState ? "bg-gray-50" : ""}
              />
              <ParameterDisplay 
                label="目前PWM" 
                value={co2LaserDetail?.pwm_percentage || 0}
                unit="%"
              />
            </div>
          </div>
          
          {/* Heater Section */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-center">溫度控制器</h2>
            <div className="space-y-2">
              <ParameterDisplay 
                label="溫度設定" 
                value={temperature}
                unit="°C"
                readOnly={!isHeaterOpenState}
                onChange={(e) => setTemperature(e.target.value)}
                className={!isHeaterOpenState ? "bg-gray-50" : ""}
              />
              <ParameterDisplay 
                label="目前設定溫度" 
                value={Number(heaterDetail?.decimal_point) === 1 ? 
                  Number(heaterDetail?.SV * 0.1 || 0).toFixed(1) : 
                  Number(heaterDetail?.SV || 0).toFixed(1)}
                unit="°C"
              />
              <ParameterDisplay 
                label="實際溫度" 
                value={Number(heaterDetail?.PV || 0).toFixed(1)}
                unit="°C"
              />
            </div>
          </div>
          
          {/* Ultrasonic Section */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-center">超音波震盪器</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-center mb-4">
                <span className="text-sm mr-4">震盪器狀態:</span>
                <span className={`font-bold ${ultrasonicOpenFlag ? "text-green-600" : "text-red-600"}`}>
                  {ultrasonicOpenFlag ? "開啟" : "關閉"}
                </span>
              </div>
            </div>
          </div>
          
          {/* Power Supply Section */}
          <div className="bg-white p-4 rounded-lg shadow-md">
            <h2 className="text-lg font-semibold mb-3 text-center">脈衝電源控制器</h2>
            <div className="space-y-2">
              <ParameterDisplay 
                label="目前脈衝電壓值 (PV)" 
                value={powerSupplyDetail?.voltage || 0}
                unit="V"
              />
              <ParameterDisplay 
                label="設定脈衝電壓值 (SV)" 
                value={powerSupplyVoltage}
                unit="V"
                readOnly={!isPowerSupplyOpenState}
                onChange={(e) => setPowerSupplyVoltage(e.target.value)}
                className={!isPowerSupplyOpenState ? "bg-gray-50" : ""}
              />
            </div>
          </div>
          
          {/* Prediction Section */}
          <div className="bg-white p-4 rounded-lg shadow-md md:col-span-3 lg:col-span-3">
            <h2 className="text-lg font-semibold mb-3 text-center">模型預測</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-4">
                <PredictionCard 
                  title="預測電阻值"
                  value={predictedResistance}
                  recommendations={recommendations}
                />
                <div className="flex flex-col gap-2 items-center">
                  <ButtonComponent
                    label="進行預測"
                    gradientMonochrome="blue"
                    otherCss="w-full"
                  />
                  <ButtonComponent
                    label="應用建議參數"
                    onClick={applyRecommendedSettings}
                    gradientMonochrome="purple"
                    otherCss="w-full"
                  />
                </div>
              </div>
              <div className="bg-gray-50 p-3 rounded-lg">
                <h3 className="font-semibold mb-2 text-center">預測訊息</h3>
                <div className="h-60 overflow-y-auto text-sm">
                  <div className="space-y-2">
                    <div className="border-b pb-1">
                      <p className="text-gray-600">2025-04-16 14:32:15</p>
                      <p>預測電阻值: 8.5 kΩ, 建議調整主氣流量至 15.2 slm</p>
                    </div>
                    <div className="border-b pb-1">
                      <p className="text-gray-600">2025-04-16 14:18:45</p>
                      <p>預測電阻值: 7.8 kΩ, 建議調整雷射功率至 28%</p>
                    </div>
                    <div className="border-b pb-1">
                      <p className="text-gray-600">2025-04-16 14:05:21</p>
                      <p>預測電阻值: 10.3 kΩ, 建議調整載氣流量至 0.22 slm</p>
                    </div>
                    <div className="border-b pb-1">
                      <p className="text-gray-600">2025-04-16 13:58:36</p>
                      <p>預測電阻值: 8.9 kΩ, 建議調整電壓至 480 V</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MrRemotePage;