import React, { useState } from "react";
import { Button } from "flowbite-react";
import CommonLoading from '../Loading/CommonLoading';
import { getApi } from "../../utils/getApi";
import AlertComponent from "../ComponentTools/Alert";
import LineChartComponent from "../Chart/Chart";
import { useAlicatContext } from "../../Contexts/AlicatContext";
import { useCo2LaserContext } from "../../Contexts/Co2LaserContext";
import { useHeaterContext } from "../../Contexts/HeaterContext";
import { useUltrasonicContext } from "../../Contexts/UltrasonicContext";

// Button Component
const ButtonComponent = ({ label, otherCss, onClick, isDisabled, loading = false, isOpen }) => (
  <Button
    className={`${otherCss} text-sm border rounded`}
    color={isOpen ? "purple" : "blue"}
    size="sm"
    onClick={onClick}
    disabled={isDisabled || loading}
  >
    {loading ? <CommonLoading /> : label}
  </Button>
);

const useHooks = () => {
  const { isCarrierGasOpenState, setCarrierGasDetailState } = useAlicatContext();
  const { isCo2LaserOpenState, co2LaserDetailState, setCo2LaserDetailState } = useCo2LaserContext();
  const { isHeaterOpenState, heaterDetailState, setHeaterDetailState } = useHeaterContext();
  const { isUltrasonicOpenState, ultrasonicOpenFlag, setUltrasonicOpenFlag } = useUltrasonicContext();
  // 載氣資料
  const [carrierGasDetail, setCarrierGasDetail] = useState({});
  // 載器流量設定
  const [carrierGasFlowSetting, setCarrierGasFlowSetting] = useState(0);
  // Recipe資料
  const [recipeDetail, setRecipeDetail] = useState([]);
  const [recipeSelected, setRecipeSelected] = useState("");
  const [recipeSelectedDetail, setRecipeSelectedDetail] = useState({});
  // CO2雷射資料
  const [co2LaserDetail, setCo2LaserDetail] = useState({});
  const [laserPWM, setLaserPWM] = useState(0);
  const [onLaserOpenLoading, setOnLaserOpenLoading] = useState(false);
  // Heater
  const [heaterDetail, setHeaterDetail] = useState({});
  const [temperature, setTemperature] = useState(0);
  const [onHeaterSettingLoading, setOnHeaterSettingLoading] = useState(false);
  // 其他
  const [alertDetail, setAlertDetail] = React.useState({});
  const [onAutoStartLoading, setOnAutoStartLoading] = React.useState(false);

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
  // CO2雷射PWM功率監測資料
  const [co2LaserPWMData, setCo2LaserPWMData] = useState({
    history: [],
    labels: [],
  });
  // Heater溫度監測資料
  const [heaterTemperatureData, setHeaterTemperatureData] = useState({ 
    history: [],
    labels: [],
  });

  // 取得載氣資料 API
  const getCarrierGasDataApi = React.useCallback(async () => {
    try {
      const response = await getApi("/alicat_api/status", "GET");
      if (response?.data?.status === "success") {
        setCarrierGasDetail(response.data.data);
        setCarrierGasDetailState(response.data.data);
      } else {
        console.error(response?.data?.status);
      }
    } catch (error) {
      console.error(error);
    }
  }, [setCarrierGasDetailState]);

  // 修改載氣流量 API
  const setCarrierGasFlowApi = async (data) => {
    try {
      const response = await getApi("/alicat_api/set_flow_rate", "POST", {
        flow_rate: data || carrierGasFlowSetting,
      });
  
      if (response?.data?.status === "success") {
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

  // 修改載氣氣體種類 API
  const setCarrierGasGasTypeApi = async (data) => {
    try {
      const gasData = {
        gas: data
      };
      const response = await getApi('/alicat_api/set_gas', 'POST', gasData);

      if (response?.data?.status === 'success') {
        console.log(response.data.message);
      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: '載氣氣體修改失敗',
          type: 'failure'
        });
      }
    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: '修改過程發生錯誤',
        type: 'failure'
      });
    } finally {
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 2000);
    }
  };

  // 取得CO2雷射資料 api
  const getCo2LaserDataApi = React.useCallback(async () => {
    try {
      const response = await getApi("/uc2000/status", "GET");
      if (response?.data?.status === "success") {
        setCo2LaserDetail(response.data.data);
        setCo2LaserDetailState(response.data.data);
      } else {
        console.error(response?.data?.status);
      }
    } catch (error) {
      console.error(error);
    }
  }, [setCo2LaserDetailState]);

  // 修改CO2雷射功率 api
  const setCo2LaserPowerApi = async (percentage) => {
    if (!isCo2LaserOpenState) {
      setAlertDetail({
        show: true,
        message: "CO2雷尚未連線",
        type: "failure",
      });

      setTimeout(() => {
        setAlertDetail({
          show: false,
          message: "CO2雷尚未連線",
          type: "failure",
        });
      }, 2000);

      return;
    }

    if (co2LaserDetailState?.max_pwm_95) {
      if (Number(laserPWM) > 95 || Number(percentage) > 95) {
        setAlertDetail({
          show: true,
          message: "超過最大PWM值 - 目前設定最大值: 95%",
          type: "failure",
        });

        setTimeout(() => {
          setAlertDetail({
            type: "failure",
            message: "超過最大PWM值 - 目前設定最大值: 95%",
            show: false,
          });
        }, 3000);

        return;
      }
    } else {
      if (Number(laserPWM) > 99 || Number(percentage) > 99) {
        setAlertDetail({
          show: true,
          message: "超過最大PWM值 - 目前設定最大值: 99%",
          type: "failure",
        });

        setTimeout(() => {
          setAlertDetail((prev) => ({
            ...prev,
            show: false,
          }));
        }, 3000);

        return;
      }
    }

    try {
      setOnLaserOpenLoading(true);

      const response = await getApi("/uc2000/set_pwm", "POST", {
        percentage: Number(percentage) || laserPWM,
      });

      if (response?.data?.status === "success") {
        setAlertDetail({
          show: true,
          message: response.data.message,
          type: "success",
        });
  
        getCo2LaserDataApi();
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
      setOnLaserOpenLoading(false);
      
      setTimeout(() => {
        setAlertDetail((prev) => ({
          ...prev,
          show: false,
        }));
      }, 2000);
    }
  }

  // 更改CO2雷射開關狀態
  const setCo2LaserOpenState = async (openState) => {
    setOnLaserOpenLoading(true);

    try {
      const response = await getApi("/uc2000/set_laser", "POST", {
        enable: openState,
      });
      
      if (response?.data?.status === "success") {
        setAlertDetail({
          show: true,
          message: response.data.message,
          type: "success",
        });

        getCo2LaserDataApi();
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
      setOnLaserOpenLoading(false);

      setTimeout(() => {
        setAlertDetail((prev) => ({
          ...prev,
          show: false,
          }));
      }, 2000);
    }
  };

  // 取得Heater資料 API
  const getHeaterDataApi = React.useCallback(async () => {
    try {
      const response = await getApi("/heater/status", "GET");
      if (response?.data?.status === "success") {
        setHeaterDetailState(response.data.data);
        setHeaterDetail(response.data.data);
      } else {
        console.error(response?.data?.status);
      }
    } catch (error) {
      console.error(error);
    }
  }, [setHeaterDetailState]);

  // 修改Heater溫度 API
  const setHeaterTemperatureApi = async () => {
    if (Number(temperature) > Number(heaterDetailState?.SLM)) {
      setAlertDetail({
        show: true,
        message: `超過最大溫度 - 目前設定最大值: ${heaterDetailState?.rAP}°C`,
        type: "failure",
      });

      setTimeout(() => {
        setAlertDetail({
          show: false,
          message: `超過最大溫度 - 目前設定最大值: ${heaterDetailState?.rAP}°C`,
          type: "failure",
        });
      }, 3000);

      return;
    }

    try {
      setOnHeaterSettingLoading(true);
      const response = await getApi("/heater/update", "POST", {
        SV: Number(heaterDetailState?.decimal_point) === 1 ? Number(temperature*10) : Number(temperature),
      });

      if (response?.data?.status === "success") {
        setAlertDetail({
          show: true,
          message: response.data.message || "溫度設定成功",
          type: "success",
        });
      } else {
        setAlertDetail({
          show: true,
          message: response.data.message || "溫度設定失敗",
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
      setOnHeaterSettingLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({
          ...prev,
          show: false,
        }));
      }, 2000);
    }
  }

  // 開啟霧化器
  const setUltrasonicOpen = async () => {
    try {
      const response = await getApi("/ultrasonic/turn_on", "POST");

      if (response?.data?.status === "success") {
        setUltrasonicOpenFlag(true);
        setAlertDetail({
          show: true,
          message: response.data.message || "霧化器開啟成功",
          type: "success",
        });
      } else {
        setAlertDetail({
          show: true,
          message: response.data.message || "霧化器開啟失敗",
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
  }

  // 關閉霧化器
  const setUltrasonicClose = async () => {
    try {
      const response = await getApi("/ultrasonic/turn_off", "POST");

      if (response?.data?.status === "success") {
        setUltrasonicOpenFlag(false);
        setAlertDetail({
          show: true,
          message: response.data.message || "霧化器關閉成功",
          type: "success",
        });
      } else {
        setAlertDetail({
          show: true,
          message: response.data.message || "霧化器關閉失敗",
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
  }

  // 取得Recipe資料 API
  const getRecipeDataApi = async () => {
    const response = await getApi("/recipe_api/get_recipes", "GET");
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

  // 選擇recipe的Select option
  const onRecipeSelect = (key) => {
    setRecipeSelected(key);
    const selectedRecipe = recipeDetail.find((recipe) => recipe.id === key);
    setRecipeSelectedDetail(selectedRecipe);
  };

  // 按下Recipe 套用的click事件
  const onRecipeApplyClick = async () => {
    // 載氣更改
    if (isCarrierGasOpenState) {
      setCarrierGasFlowSetting(recipeSelectedDetail.carrier_gas_flow);
      await setCarrierGasGasTypeApi(recipeSelectedDetail.carrier_gas);
    }
    // CO2雷射更改
    if (isCo2LaserOpenState) {
      setLaserPWM(recipeSelectedDetail.laser_power);
      await setCo2LaserPowerApi(recipeSelectedDetail.laser_power);
    }
    // Heater更改
    if (isHeaterOpenState) {
      setTemperature(recipeSelectedDetail.temperature);
    }

    setAlertDetail({
      show: true,
      message: "套用成功，若無開啟的裝置則不會套用",
      type: "success",
    });

    setTimeout(() => {
      setAlertDetail((prev) => ({ ...prev, show: false }));
    }, 2000);
  };

  // 關閉Alert
  const onAlertClose = () => {
    setAlertDetail((prev) => ({
      ...prev,
      show: false,
    }));
  };

  // 按下自動啟動的click事件
  const onAutoStartClick = async () => {
    try {
      setOnAutoStartLoading(true);
      if (isCarrierGasOpenState) {
        await setCarrierGasFlowApi();
      }
      if (isCo2LaserOpenState) {
        await setCo2LaserOpenState(true);
      }
      if (isHeaterOpenState) {
        await setHeaterTemperatureApi();
      }
      if (isUltrasonicOpenState && !ultrasonicOpenFlag) {
        await setUltrasonicOpen();
      }

      setAlertDetail({
        show: true,
        message: "自動啟動成功",
        type: "success",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setOnAutoStartLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({
          ...prev,
          show: false,
        }));
      }, 2000);
    }
  };

  // 按下全部關閉的click事件
  const onAllCloseClick = async () => {
    try {
      setOnAutoStartLoading(true);
      if (isCarrierGasOpenState) {
        await setCarrierGasFlowApi(0);
      }
      if (isCo2LaserOpenState) {
        await setCo2LaserOpenState(false);
      }
      if (isUltrasonicOpenState && ultrasonicOpenFlag) {
        await setUltrasonicClose();
      }
      setAlertDetail({
        show: true,
        message: "全部關閉成功",
        type: "success",
      });
    } catch (error) {
      console.error(error);
    } finally {
      setOnAutoStartLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 2000);
    }
  };

  // 載氣流量監測，每3秒更新一次
  React.useEffect(() => {
    // 先call一次
    if (isCarrierGasOpenState) {
      getCarrierGasDataApi();
    }
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
  }, [isCarrierGasOpenState, getCarrierGasDataApi]);

  // 載氣當有新的資料時，加入最新值與當前時間
  React.useEffect(() => {
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

  // CO2雷射當有新的資料時，加入最新值與當前時間
  React.useEffect(() => {
    if (co2LaserDetail) {
      const currentTime = new Date().toLocaleTimeString("en-GB");
      setCo2LaserPWMData((prev) => {
        const newHistory = [
          ...prev.history,
          Number(co2LaserDetail?.laser_on ? co2LaserDetail?.pwm_percentage : 0),
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
  }, [co2LaserDetail]);

  // CO2雷射監測，每3秒更新一次
  React.useEffect(() => {
    // 先call一次
    if (isCo2LaserOpenState) {
      getCo2LaserDataApi();
    }
    let intervalId;

    if (isCo2LaserOpenState) {
      intervalId = setInterval(() => {
        getCo2LaserDataApi();
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
  }, [isCo2LaserOpenState, getCo2LaserDataApi]);

  // Heater監測，每3秒更新一次
  React.useEffect(() => {
    // 先call一次
    if (isHeaterOpenState) {
      getHeaterDataApi();
    }
    let intervalId;

    if (isHeaterOpenState) {
      intervalId = setInterval(() => {
        getHeaterDataApi();
      }
      , 3000);
      console.log("Starting interval");
    }

    // 清理函數
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
        console.log("Clearing interval");
      }
    }
  }, [isHeaterOpenState, getHeaterDataApi]);

  // Heater當有新的資料時，加入最新值與當前時間
  React.useEffect(() => {
    if (heaterDetail) {
      const currentTime = new Date().toLocaleTimeString("en-GB");
      setHeaterTemperatureData((prev) => {
        const newHistory = [
          ...prev.history,
          Number(heaterDetail?.PV || 0),
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
  }, [heaterDetail]);

  // 取得Recipe資料
  React.useEffect(() => {
    getRecipeDataApi();
  }, []);


  return {
    isCarrierGasOpenState,
    carrierGasDetail,
    carrierGasFlowData,
    carrierGasPressureData,
    carrierGasTemperatureData,
    carrierGasFlowSetting,
    recipeDetail,
    recipeSelected,
    recipeSelectedDetail,
    isCo2LaserOpenState,
    co2LaserDetail,
    co2LaserPWMData,
    onLaserOpenLoading,
    laserPWM,
    temperature,
    heaterDetail,
    onHeaterSettingLoading,
    heaterTemperatureData,
    isHeaterOpenState,
    isUltrasonicOpenState,
    ultrasonicOpenFlag,
    alertDetail,
    onAutoStartLoading,
    onCarrierFlowSettingChange,
    onCarrierFlowSettingClick,
    onRecipeSelect,
    onRecipeApplyClick,
    setCo2LaserPowerApi,
    setCo2LaserOpenState,
    setLaserPWM,
    onAlertClose,
    setTemperature,
    setHeaterTemperatureApi,
    setUltrasonicOpen,
    setUltrasonicClose,
    onAutoStartClick,
    onAllCloseClick,
  };
};

const ControllerPage = () => {
  const {
    isCarrierGasOpenState, carrierGasDetail, carrierGasFlowData, carrierGasFlowSetting, carrierGasPressureData, carrierGasTemperatureData,
    recipeDetail, recipeSelected, recipeSelectedDetail, isCo2LaserOpenState, co2LaserDetail, onLaserOpenLoading, co2LaserPWMData, laserPWM,
    alertDetail,  temperature, heaterDetail, onHeaterSettingLoading, heaterTemperatureData, isHeaterOpenState, isUltrasonicOpenState, ultrasonicOpenFlag,
    onAutoStartLoading,
    onCarrierFlowSettingChange, onCarrierFlowSettingClick, onRecipeSelect, onRecipeApplyClick,
    setCo2LaserOpenState, setCo2LaserPowerApi, setLaserPWM,
    onAlertClose, setTemperature, setHeaterTemperatureApi, setUltrasonicOpen, setUltrasonicClose,
    onAutoStartClick, onAllCloseClick,
  } = useHooks();

  return (
    <div className="min-h-allView p-4 bg-gray-200">
      <AlertComponent
        show={alertDetail.show}
        message={alertDetail.message}
        onClose={onAlertClose}
        type={alertDetail.type}
      />
      <div className="grid grid-cols-3 gap-4 p-2 bg-white shadow mb-4 rounded">
        <div className="flex items-center gap-2">
        <span className="w-4 h-4 bg-red-500 rounded-full"></span>
          <span className="text-sm">Mass Flow Controller - Main Gas</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`${
              isCarrierGasOpenState ? "bg-green-500" : "bg-red-500"
            } w-4 h-4 bg-green-500 rounded-full`}
          />
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
          <span className="w-4 h-4 bg-red-500 rounded-full"></span>
          <span className="text-sm">Power supply</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`${
              isHeaterOpenState ? "bg-green-500" : "bg-red-500"
            } w-4 h-4 bg-green-500 rounded-full`}
          />
          <span className="text-sm">Heater</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`${
              isUltrasonicOpenState ? "bg-green-500" : "bg-red-500"
            } w-4 h-4 bg-green-500 rounded-full`}
          />
          <span className="text-sm">Ultrasonic</span>
        </div>
      </div>
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-4">
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
                  value={Number(carrierGasDetail?.mass_flow || 0).toFixed(3)}
                  step="0.01"
                  readOnly
                  className="w-full p-1 border rounded bg-gray-50 mt-2"
                />
              </div>
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <span className="text-sm w-32">流量設定 (Flow Setting)</span>
                  <input
                    type="number"
                    step="0.001"
                    value={Number(carrierGasFlowSetting).toFixed(3)}
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
                  isDisabled={!isCarrierGasOpenState}
                />
              </div>
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <span className="text-sm w-32">目前流量設定值</span>
                  <input
                    type="number"
                    value={carrierGasDetail?.setpoint || 0}
                    readOnly
                    className="p-1 border rounded bg-gray-50"
                  />
                </div>
                <span className="text-md">slm</span>
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
              <div className="flex items-center gap-2 mb-2 flex-wrap justify-between">
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
                  isDisabled={!isCo2LaserOpenState}
                  loading={onLaserOpenLoading}
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
                  isDisabled={!isCo2LaserOpenState || co2LaserDetail?.laser_on}
                  onClick={() => setCo2LaserOpenState(true)}
                  loading={onLaserOpenLoading}
                  isOpen={co2LaserDetail?.laser_on}
                />
                <ButtonComponent
                  label="OFF" 
                  isDisabled={!isCo2LaserOpenState || !co2LaserDetail?.laser_on}
                  onClick={() => setCo2LaserOpenState(false)}
                  loading={onLaserOpenLoading}
                />
              </div>
            </div>
            <div className="border p-4 border-red-300 rounded shadow">
              <h3 className="font-bold mb-2">超音波震盪器 (Ultrasonic)</h3>
              <p className="flex items-center gap-2 mb-2 text-sm">
                目前震盪器狀態: <span className='font-bold text-purple-500'>{ultrasonicOpenFlag ? "開啟" : "關閉"}</span>
              </p>
              <div className="grid grid-cols-2 gap-2">
                <ButtonComponent
                  label="ON"
                  onClick={setUltrasonicOpen}
                  isOpen={ultrasonicOpenFlag}
                  isDisabled={!isUltrasonicOpenState || ultrasonicOpenFlag}
                />
                <ButtonComponent
                  label="OFF"
                  onClick={setUltrasonicClose}
                  isDisabled={!isUltrasonicOpenState || !ultrasonicOpenFlag}
                />
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
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm min-w-28">設定溫度</span>
                  <input
                    type="number"
                    value={temperature}
                    onChange={(e) => setTemperature(e.target.value)}
                    className="p-1 border rounded"
                  />
                  <span className="text-sm">°C</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm min-w-28">目前設定溫度</span>
                  <input
                    type="number"
                    value={Number(heaterDetail?.decimal_point) === 1 ? Number(heaterDetail?.SV*0.1 || 0).toFixed(1) : Number(heaterDetail?.SV || 0).toFixed(1)}
                    readOnly
                    className="p-1 border rounded bg-gray-50"
                  />
                  <span className="text-sm">°C</span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm min-w-28">實際溫度</span>
                  <input
                    type="number"
                    value={Number(heaterDetail?.PV || 0).toFixed(1)}
                    readOnly
                    className="p-1 border rounded bg-gray-50"
                  />
                  <span className="text-sm">°C</span>
                </div>
                <ButtonComponent
                  label="Setting"
                  otherCss={"w-full"}
                  onClick={setHeaterTemperatureApi}
                  loading={onHeaterSettingLoading}
                  isDisabled={!isHeaterOpenState}
                  />
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
        {/* Recipe 調整 */}
        <div className="col-span-1 bg-gray-300 p-4 rounded shadow w-full">
          <div className="space-y-4">
            <div className="space-y-3 flex flex-col justify-between items-stretch gap-2 w-full">
              <div className="flex flex-col gap-2 w-full">
                <h3 className="font-bold mb-2 text-blue-800 text-center text-lg">
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
                  onClick={onRecipeApplyClick}
                />
              </div>
            </div>
          </div>
          {/* 自動啟動按鈕 */}
          <div className="flex flex-col justify-center mt-4 items-center">
            <h3 className="font-bold mb-2 text-blue-800 text-center text-lg">
              一鍵自動啟動
            </h3>
            <h5
              className="text-sm text-center text-gray-500 mb-2"
            >
              按下按鈕後，將會目前有連線的裝置全部自動啟用，若無連線則不會啟用
            </h5>
            <ButtonComponent
              onClick={onAutoStartClick}
              label="自動啟動 (Auto Start)"
              otherCss="w-full max-w-md"
              isDisabled={!isHeaterOpenState || !isCo2LaserOpenState || !isCarrierGasOpenState}
              loading={onAutoStartLoading}
            />
          </div>
          {/* 一鍵全部關閉 */}
          <div className="flex flex-col justify-center mt-4 items-center">
            <h3 className="font-bold mb-2 text-blue-800 text-center text-lg">
              一鍵自動關閉
            </h3>
            <h5
              className="text-sm text-center text-gray-500 mb-2"
            >
              按下按鈕後，將會目前有連線的裝置全部關閉，包含霧化器(這個不是中斷連線，只是關閉開關，不含加熱器)
            </h5>
            <ButtonComponent
              onClick={onAllCloseClick}
              label="全部關閉 (All Close)"
              otherCss="w-full max-w-md"
              isDisabled={!isHeaterOpenState || !isCo2LaserOpenState || !isCarrierGasOpenState}
              loading={onAutoStartLoading}
            />
          </div>
        </div>
      </div>
      {/* 這邊為下一層的內容 */}
      <div className="grid grid-cols-4 lg:grid-cols-4 gap-4 mt-4">
        <div className="col-span-4 lg:col-span-4 md:col-span-4 bg-white p-4 rounded-lg shadow-md">
          <h3 className="font-bold mb-2">
            流量 / 電壓監測 (Flow / Voltage / Pressure monitor)
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <LineChartComponent
              title="載氣流量監測"
              data={carrierGasDetail?.mass_flow || 0}
              dataHistory={carrierGasFlowData.history}
              timeLabels={carrierGasFlowData.labels}
              label="Carrier Gas flow"
              yAxisLabel="Flow Rate (slm)"
              yAxisMax={1}
              yAxisMin={0}
              yAxisStep={0.1}
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
            <LineChartComponent
              title="CO2雷射PWM功率監測"
              dataHistory={co2LaserPWMData.history}
              timeLabels={co2LaserPWMData.labels}
              label="CO2 Laser PWM Power (%)"
              yAxisLabel="Percentage (%)"
              yAxisMax={100}
              yAxisMin={0}
              yAxisStep={5}
              lineColor="rgb(15, 16, 15)"
              backgroundColor="rgba(75, 75, 192, 0.2)"
            />
            <LineChartComponent
              title="Heater溫度監測"
              dataHistory={heaterTemperatureData.history}
              timeLabels={heaterTemperatureData.labels}
              label="Heater Temperrature"
              yAxisLabel="Temprature (°C)"
              yAxisMax={150}
              yAxisMin={0}
              yAxisStep={10}
              lineColor="rgb(230, 46, 178)"
              backgroundColor="rgba(75, 75, 192, 0.2)"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ControllerPage;
