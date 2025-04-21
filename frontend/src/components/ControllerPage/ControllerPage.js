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
import { useAzbilContext } from "../../Contexts/AzbilContext";
import { usePowerSupplyContext } from "../../Contexts/PowerSupplyContext";
import azbil_code_detail from "./azbil_code_detail.json"
import AutoConnectModal from "../AutoConnectModal/AutoConnectModal";

// Button Component
const ButtonComponent = ({ label, otherCss, onClick, isDisabled, loading = false, isOpen, gradientMonochrome }) => (
  <Button
    className={`${otherCss} text-sm border rounded max-w-72`}
    gradientMonochrome={isOpen ? "purple" : gradientMonochrome}
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
  const { isMainGasOpenState, setMainGasDetailState, mainGasDetailState } = useAzbilContext();
  const { isPowerSupplyOpenState } = usePowerSupplyContext();
  // const { isPowerSupplyOpenState, setPowerSupplyDetailState, powerSupplyDetailState } = usePowerSupplyContext();
  // 主氣資料
  const [mainGasDetail, setMainGasDetail] = useState({});
  const [mainGasFlowSetting, setMainGasFlowSetting] = useState('');
  const [onMainGasLoading, setOnMainGasLoading] = useState(false);
  // 載氣資料
  const [carrierGasDetail, setCarrierGasDetail] = useState({});
  const [carrierGasFlowSetting, setCarrierGasFlowSetting] = useState(0);
  const [onCarrierGasLoading, setOnCarrierGasLoading] = useState(false);
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
  // 霧化器
  const [onUltrasonicLoading, setOnUltrasonicLoading] = useState(false);
  // 脈衝電源供應器
  const [onPowerSupplyLoading, setOnPowerSupplyLoading] = useState(false);
  const [powerSupplyDetail, setPowerSupplyDetail] = useState({});
  const [powerSupplyVoltage, setPowerSupplyVoltage] = useState(0);
  const [isDC1Boost, setIsDC1Boost] = useState(false);
  const [isPowerOpen, setIsPowerOpen] = useState(false);
  const [powerSupplyDeviceStatus, setPowerSupplyDeviceStatus] = useState("");
  // 其他
  const [alertDetail, setAlertDetail] = React.useState({});
  const [onAutoStartLoading, setOnAutoStartLoading] = React.useState(false);

  // 主氣流量監測資料
  const [mainGasFlowData, setMainGasFlowData] = useState({
    history: [],
    labels: [],
  });

  // 主氣累積流量監測資料
  const [mainGasAccumulatedFlowData, setMainGasAccumulatedFlowData] = useState({
    history: [],
    labels: [],
  });

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

  // 取得主氣資料 API
  const getMainGasDataApi = React.useCallback(async () => {
    try {
      const response = await getApi("/azbil_api/get_main_status", "GET");
      if (response?.data?.status === "success") {
        // 比較response.data.data與azbil_code_detail的value，並轉換成azbil_code_detail內的value
        const newMainGasDetail = response.data.data;
        // 對PV_FLOW和SETTING_SP_FLOW進行小數點處理以及單位轉換
        let newSettingSp = (Number(newMainGasDetail.SETTING_SP_FLOW) * 0.1).toFixed(Number(newMainGasDetail.FLOW_DECIMAL));
        let newPvFlow = Number(newMainGasDetail.PV_FLOW) * 0.1;

        switch (Number(newMainGasDetail.FLOW_UNIT)) {
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
        let newTotalFlow = (Number(newMainGasDetail.TOTAL_FLOW * 0.1 ).toFixed(newMainGasDetail.TOTAL_FLOW_DECIMAL));
        switch (Number(newMainGasDetail.TOTAL_FLOW_UNIT)) {
          case 0:
            newTotalFlow = newTotalFlow * 1000;
            break;
          case 2:
            newTotalFlow = newTotalFlow / 1000;
            break;
          default:
            break;
        }

        const flowUnit = azbil_code_detail.FLOW_UNIT_MAP[newMainGasDetail.FLOW_UNIT];
        const totalFlowUnit = azbil_code_detail.TOTAL_FLOW_UNIT_MAP[newMainGasDetail.TOTAL_FLOW_UNIT];
        newMainGasDetail.FLOW_UNIT = flowUnit;
        newMainGasDetail.TOTAL_FLOW_UNIT = totalFlowUnit;
        newMainGasDetail.SETTING_SP_FLOW = newSettingSp;
        newMainGasDetail.PV_FLOW = newPvFlow;
        newMainGasDetail.TOTAL_FLOW = newTotalFlow;

        setMainGasDetail(newMainGasDetail);
        setMainGasDetailState({
          ...mainGasDetailState,
          ...response.data.data,
        });
      } else {
        console.error(response?.data?.status);
      }
    } catch (error) {
      console.error(error);
    }
  }
  , [setMainGasDetailState, mainGasDetailState]);

  // 修改主氣流量 API
  const setMainGasFlowApi = async (data) => {
    setOnMainGasLoading(true);

    try {
      // 修改回傳的值
      // 規則和取得主氣資料一樣
      let newSettingSp = mainGasFlowSetting || data;

      switch (mainGasDetailState.FLOW_UNIT) {
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
      setOnMainGasLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({
          ...prev,
          show: false,
        }));
      }, 2000);
    }
  };

  // 開啟主氣閥門 api
  const setMainGasOpenApi = async () => {
    setOnMainGasLoading(true);
    try {
      const response = await getApi("/azbil_api/flow_turn_on", "POST");

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
      setOnMainGasLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 2000);
    }
  };

  // 關閉主氣閥門 api
  const setMainGasCloseApi = async () => {
    setOnMainGasLoading(true);
    try {
      const response = await getApi("/azbil_api/flow_turn_off", "POST");

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
      setOnMainGasLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 2000);
    }
  }

  // 全開主氣閥門 api
  const setMainGasFullOpenApi = async () => {
    setOnMainGasLoading(true);
    try {
      const response = await getApi("/azbil_api/flow_turn_full", "POST");

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
      setOnMainGasLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 2000);
    }
  }

  // 重製主氣累積流量 api
  const resetMainGasTotalFlowApi = async () => {
    setOnMainGasLoading(true);
    try {
      const response = await getApi("/azbil_api/restart_accumlated_flow", "POST");

      if (response?.data?.status === "success") {
        await getMainGasDataApi();
        setAlertDetail({
          show: true,
          message: response.data.message,
          type: "success",
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
      setOnMainGasLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 2000);
    }
  };

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
      setOnCarrierGasLoading(true);
      let response = {};

      if (Number(data) >= 0) {
        response = await getApi("/alicat_api/set_flow_rate", "POST", {
          flow_rate: Number(data),
        });
      } else {
        response = await getApi("/alicat_api/set_flow_rate", "POST", {
          flow_rate: carrierGasFlowSetting,
        });
      }
  
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
      setOnCarrierGasLoading(false);
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
        setAlertDetail({
          show: true,
          message: '載氣氣體修改成功',
          type: 'success'
        });
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
  const setHeaterTemperatureApi = async (data) => {
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
      let response = {};
      if (Number(data) > 0) {
        response = await getApi("/heater/update", "POST", {
          SV: Number(heaterDetailState?.decimal_point) === 1 ? Number(data*10) : Number(data),
        });
      } else {
        response = await getApi("/heater/update", "POST", {
          SV: Number(heaterDetailState?.decimal_point) === 1 ? Number(temperature*10) : Number(temperature),
        });
      }

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
      setOnUltrasonicLoading(true);
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
      setOnUltrasonicLoading(false);
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

  // 調整脈衝電源供應器電壓
  const setPowerSupplyVoltageApi = async (data) => {
    try {
      setOnPowerSupplyLoading(true);
      const response = await getApi("/power_supply/write_voltage", "POST", {
        voltage: data,
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
      setOnPowerSupplyLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({
          ...prev,
          show: false,
        }));
      }, 2000);
    }
  };

  // 脈衝電源供應器DC1升壓
  const setPowerSupplyDC1BoostApi = async () => {
    try {
      setOnPowerSupplyLoading(true);
      const response = await getApi("/power_supply/dc1_turn_on", "POST");

      if (response?.data?.status === "success") {
        setAlertDetail({
          show: true,
          message: response.data.message,
          type: "success",
        });
        setIsDC1Boost(true);
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
      setOnPowerSupplyLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({
          ...prev,
          show: false,
        }));
      }, 2000);
    }
  };

  // 脈衝電源供應器DC1降壓
  const setPowerSupplyDC1BuckApi = async () => {
    try {
      setOnPowerSupplyLoading(true);
      const response = await getApi("/power_supply/dc1_turn_off", "POST");

      if (response?.data?.status === "success") {
        setAlertDetail({
          show: true,
          message: response.data.message,
          type: "success",
        });
        setIsDC1Boost(false);
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
      setOnPowerSupplyLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({
          ...prev,
          show: false,
        }));
      }, 2000);
    }
  };

  // 脈衝電源供應器Power On
  const setPowerSupplyPowerOnApi = async () => {
    try {
      setOnPowerSupplyLoading(true);
      const response = await getApi("/power_supply/power_on", "POST");
      
      if (response?.data?.status === "success") {
        setAlertDetail({
          show: true,
          message: response.data.message,
          type: "success",
        });
        setIsPowerOpen(true);
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
      setOnPowerSupplyLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({
          ...prev,
          show: false,
        }));
      }, 2000);
    }
  };

  // 脈衝電源供應器Power Off
  const setPowerSupplyPowerOffApi = async () => {
    try {
      setOnPowerSupplyLoading(true);
      const response = await getApi("/power_supply/power_off", "POST");
      
      if (response?.data?.status === "success") {
        setAlertDetail({
          show: true,
          message: response.data.message,
          type: "success",
        });
        setIsPowerOpen(false);
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
      setOnPowerSupplyLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({
          ...prev,
          show: false,
        }));
      }, 2000);
    }
  }; 

  // 清除脈衝電源供應器Error code
  const clearPowerSupplyErrorCodeApi = async () => {
    try {
      setOnPowerSupplyLoading(true);
      await getApi("/power_supply/set_clear_error", "POST");
    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: "發生錯誤，請稍後再試",
        type: "failure",
      });
    } finally {
      setOnPowerSupplyLoading(false);
      getPowerSupplyStatusApi();
    }
  };

  // 脈衝電源控制器狀態
  const getPowerSupplyStatusApi = async() => {
    try {
      setOnPowerSupplyLoading(true);
      const response = await getApi("/power_supply/status", "GET");

      if (response?.data?.status === "success") {
        setPowerSupplyDetail(response.data.data);
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
      setOnPowerSupplyLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({
          ...prev,
          show: false,
        }));
      }, 2000);
    }
  }; 

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

  // 主氣流量設定的Change事件
  const onMainGasFlowSettingChange = (e) => {
    setMainGasFlowSetting(e.target.value);
  };

  // 主氣流量設定的Click事件
  const onMainGasFlowSettingClick = () => {
    setMainGasFlowApi();
  }

  // 脈衝電源供應器電壓設定的Click事件
  const onPowerSupplyVoltageClick = () => {
    let voltage = Number(powerSupplyVoltage);
    try {
      if (voltage < 0) {
        setAlertDetail({
          show: true,
          message: "電壓不可小於0",
          type: "failure",
        });
        return;
      }
      if (voltage > 1000) {
        setAlertDetail({
          show: true,
          message: "電壓不可大於1000",
          type: "failure",
        });
        return;
      }
      if (voltage % 1 !== 0) {
        setAlertDetail({
          show: true,
          message: "電壓只能輸入整數",
          type: "failure",
        });
        return;
      }
      setPowerSupplyVoltageApi(powerSupplyVoltage);
    } catch {
      setAlertDetail({
        show: true,
        message: "電壓輸入錯誤",
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

  // 主氣閥門(控制、全開、關閉)的Click事件
  const onMainGasClick = async (type) => {
    switch (type) {
      case "open":
        await setMainGasOpenApi();
        break;
      case "close":
        await setMainGasCloseApi();
        break;
      case "fullOpen":
        await setMainGasFullOpenApi();
        break;
      default:
        break;
    }
    await getMainGasDataApi();
  }

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

    // 主氣更改
    if (isMainGasOpenState) {
      setMainGasFlowSetting(recipeSelectedDetail.main_gas_flow);
      await setMainGasFlowApi(recipeSelectedDetail.main_gas_flow);
    }

    if (isPowerSupplyOpenState) {
      if (isDC1Boost || isPowerOpen) return;
      setPowerSupplyVoltage(recipeSelectedDetail.power_supply_voltage);
      await setPowerSupplyVoltageApi(recipeSelectedDetail.power_supply_voltage);
    }

    setAlertDetail({
      show: true,
      message: "套用成功，若無開啟的裝置則不會套用，脈衝電源供應器若處於升壓或開啟狀態則不會套用",
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
      if (isMainGasOpenState) {
        await setMainGasOpenApi();
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
      if (isHeaterOpenState) {
        await setHeaterTemperatureApi(25);
      }
      if (isMainGasOpenState) {
        await setMainGasCloseApi();
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

  // dc1_boost 更新
  React.useEffect(() => {
    if (powerSupplyDetail) {
      if (powerSupplyDetail?.error) {
        setPowerSupplyDeviceStatus("Error");
        return;
      }
      if (powerSupplyDetail?.ready) {
        setPowerSupplyDeviceStatus("Ready");
        return;
      }
      setPowerSupplyDeviceStatus("Unknown Status");
    }
    if (powerSupplyDetail?.dc1_on) {
      setIsDC1Boost(powerSupplyDetail?.dc1_on);
    }
  }, [powerSupplyDetail]);

  // 主氣流量監測，每3秒更新一次
  React.useEffect(() => {
    if (isMainGasOpenState) {

      const intervalId = setInterval(() => {
        getMainGasDataApi();
      }, 3000);

      return () => {
        clearInterval(intervalId);
      };
    }
  }, [isMainGasOpenState, getMainGasDataApi]);

  // 主氣當有新的資料時，加入最新值與當前時間
  React.useEffect(() => {
    if (mainGasDetail) {
      const currentTime = new Date().toLocaleTimeString("en-GB");
      setMainGasFlowData((prev) => {
        const newHistory = [
          ...prev.history,
          Number(mainGasDetail?.PV_FLOW || 0),
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
      setMainGasAccumulatedFlowData((prev) => {
        const newHistory = [
          ...prev.history,
          Number(mainGasDetail?.TOTAL_FLOW || 0),
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
  }, [mainGasDetail]);

  // 載氣流量監測，每3秒更新一次
  React.useEffect(() => {
    let intervalId;

    if (isCarrierGasOpenState) {
      intervalId = setInterval(() => {
        getCarrierGasDataApi();
      }, 3000);
    }

    // 清理函數
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
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
    let intervalId;

    if (isCo2LaserOpenState) {
      intervalId = setInterval(() => {
        getCo2LaserDataApi();
      }, 3000);
    }

    // 清理函數
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isCo2LaserOpenState, getCo2LaserDataApi]);

  // Heater監測，每3秒更新一次
  React.useEffect(() => {
    let intervalId;

    if (isHeaterOpenState) {
      intervalId = setInterval(() => {
        getHeaterDataApi();
      }
      , 3000);
    }

    // 清理函數
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
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

  // 進入畫面時，先第一次取得所有資料
  React.useEffect(() => {
    if (isMainGasOpenState) {
      getMainGasDataApi();
    }
    if (isCarrierGasOpenState) {
      getCarrierGasDataApi();
    }
    if (isCo2LaserOpenState) {
      getCo2LaserDataApi();
    }
    if (isHeaterOpenState) {
      getHeaterDataApi();
    }
    if (isPowerSupplyOpenState) {
      getPowerSupplyStatusApi();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMainGasOpenState, isCarrierGasOpenState, isCo2LaserOpenState, isHeaterOpenState, isPowerSupplyOpenState]);

  React.useEffect(() => {
    if (sessionStorage.getItem("firstEnterPage") === "true") return;
    if (isCarrierGasOpenState || isMainGasOpenState || isCo2LaserOpenState || isHeaterOpenState || isUltrasonicOpenState) {
      sessionStorage.setItem("firstEnterPage", false);
    } else{
      sessionStorage.setItem("firstEnterPage", true);
    }
  }, [isCarrierGasOpenState, isMainGasOpenState, isCo2LaserOpenState, isHeaterOpenState, isUltrasonicOpenState]);

  return {
    isMainGasOpenState,
    mainGasDetail,
    mainGasFlowData,
    mainGasAccumulatedFlowData,
    mainGasFlowSetting,
    onMainGasLoading,
    isCarrierGasOpenState,
    carrierGasDetail,
    carrierGasFlowData,
    carrierGasPressureData,
    carrierGasTemperatureData,
    carrierGasFlowSetting,
    onCarrierGasLoading,
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
    onUltrasonicLoading,
    isUltrasonicOpenState,
    ultrasonicOpenFlag,
    powerSupplyVoltage,
    isPowerSupplyOpenState,
    onPowerSupplyLoading,
    powerSupplyDetail,
    powerSupplyDeviceStatus,
    isDC1Boost,
    isPowerOpen,
    alertDetail,
    onAutoStartLoading,
    onMainGasClick,
    onMainGasFlowSettingChange,
    onMainGasFlowSettingClick,
    resetMainGasTotalFlowApi,
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
    setPowerSupplyVoltage,
    onPowerSupplyVoltageClick,
    clearPowerSupplyErrorCodeApi,
    setPowerSupplyDC1BoostApi,
    setPowerSupplyDC1BuckApi,
    setPowerSupplyPowerOnApi,
    setPowerSupplyPowerOffApi,
    onAutoStartClick,
    onAllCloseClick,
  };
};

const ControllerPage = () => {
  const {
    isMainGasOpenState, mainGasDetail, mainGasFlowData, mainGasAccumulatedFlowData, mainGasFlowSetting, onMainGasLoading,
    isCarrierGasOpenState, carrierGasDetail, carrierGasFlowData, carrierGasFlowSetting, carrierGasPressureData, carrierGasTemperatureData, onCarrierGasLoading,
    recipeDetail, recipeSelected, recipeSelectedDetail, isCo2LaserOpenState, co2LaserDetail, onLaserOpenLoading, co2LaserPWMData, laserPWM,
    alertDetail, temperature, heaterDetail, onHeaterSettingLoading, heaterTemperatureData, isHeaterOpenState, onUltrasonicLoading, isUltrasonicOpenState, ultrasonicOpenFlag,
    onAutoStartLoading, powerSupplyVoltage, isPowerSupplyOpenState, onPowerSupplyLoading, isDC1Boost, isPowerOpen, powerSupplyDetail, powerSupplyDeviceStatus,
    onMainGasClick, onMainGasFlowSettingChange, onMainGasFlowSettingClick, resetMainGasTotalFlowApi, onCarrierFlowSettingChange, onCarrierFlowSettingClick,
    onRecipeSelect, onRecipeApplyClick, setPowerSupplyDC1BoostApi, setPowerSupplyDC1BuckApi, setPowerSupplyPowerOnApi, setPowerSupplyPowerOffApi,
    setCo2LaserOpenState, setCo2LaserPowerApi, setLaserPWM, onPowerSupplyVoltageClick, setPowerSupplyVoltage, clearPowerSupplyErrorCodeApi,
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
          <span
            className={`${
              isMainGasOpenState ? "bg-green-500" : "bg-red-500"
            } w-4 h-4 bg-green-500 rounded-full min-w-4`}
          />
          <span className="text-sm">Main Gas</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`${
              isCarrierGasOpenState ? "bg-green-500" : "bg-red-500"
            } w-4 h-4 bg-green-500 rounded-full min-w-4`}
          />
          <span className="text-sm">Carrier Gas</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`${
              isCo2LaserOpenState ? "bg-green-500" : "bg-red-500"
            } w-4 h-4 bg-green-500 rounded-full min-w-4`}
          />
          <span className="text-sm">CO2 Laser</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`${
              isPowerSupplyOpenState ? "bg-green-500" : "bg-red-500"
            } w-4 h-4 bg-green-500 rounded-full min-w-4`}
          />
          <span className="text-sm">Power supply</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`${
              isHeaterOpenState ? "bg-green-500" : "bg-red-500"
            } w-4 h-4 bg-green-500 rounded-full min-w-4`}
          />
          <span className="text-sm">Heater</span>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`${
              isUltrasonicOpenState ? "bg-green-500" : "bg-red-500"
            } w-4 h-4 bg-green-500 rounded-full min-w-4`}
          />
          <span className="text-sm">Ultrasonic</span>
        </div>
      </div>
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-4 md:grid-cols-2 gap-4">
        {/* Left Column - MPC */}
        <div className="bg-white p-4 rounded shadow">
          <div className="space-y-4">
            <div className="border p-4 border-green-300 rounded shadow flex items-center justify-center flex-col">
              <h3 className="font-bold">主氣流量</h3>
              <h3 className="font-bold mb-2">(Main Gas Flow)</h3>
              <div className="mb-2 flex items-center gap-2 flex-wrap">
                <div className="flex justify-center items-center gap-2 flex-wrap">
                  <span className="text-sm w-40">
                    即時主氣流量 (PV)
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      value={Number(mainGasDetail?.PV_FLOW || 0).toFixed(Number(mainGasDetail?.FLOW_DECIMAL))}
                      readOnly
                      className="p-1 border rounded bg-gray-50 w-32"
                    />
                    <span className="text-md w-4">{mainGasDetail?.FLOW_UNIT || "slm"}</span>
                  </div>
                </div>
              </div>
              <div className="mb-2 flex justify-center items-center gap-2 flex-wrap">
                <span className="text-sm w-40">即時流量設定 (SV)</span>
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    step="0.001"
                    value={mainGasFlowSetting}
                    readOnly={!isMainGasOpenState}
                    className={`${
                      !isMainGasOpenState && "bg-gray-50"
                    } p-1 border rounded w-32`}
                    onChange={onMainGasFlowSettingChange}
                    placeholder="請輸入流量(0.000)"
                  />
                  <span className="text-md w-4">{mainGasDetail?.FLOW_UNIT || "slm"}</span>
                </div>
              </div>
              <div className="mb-2 flex justify-center items-center flex-wrap gap-2 mt-2">
                <ButtonComponent
                  label="流量設定"
                  onClick={onMainGasFlowSettingClick}
                  isDisabled={!isMainGasOpenState}
                  loading={onMainGasLoading}
                  gradientMonochrome="lime"
                />
                <div
                  className="flex justify-center items-center gap-2 flex-wrap"
                >
                  <ButtonComponent
                    label="閥門控制"
                    onClick={() => onMainGasClick("open")}
                    isDisabled={!isMainGasOpenState || mainGasDetail?.GATE_CONTROL === 1}
                    loading={onMainGasLoading}
                    isOpen={mainGasDetail?.GATE_CONTROL === 1}
                    gradientMonochrome="teal"
                  />
                  <ButtonComponent
                    label="閥門全開"
                    onClick={() => onMainGasClick("fullOpen")}
                    isDisabled={!isMainGasOpenState || mainGasDetail?.GATE_CONTROL === 2}
                    loading={onMainGasLoading}
                    isOpen={mainGasDetail?.GATE_CONTROL === 2}
                    gradientMonochrome="teal"
                  />
                  <ButtonComponent
                    label="閥門關閉"
                    onClick={() => onMainGasClick("close")}
                    isDisabled={!isMainGasOpenState || mainGasDetail?.GATE_CONTROL === 0}
                    loading={onMainGasLoading}
                    isOpen={mainGasDetail?.GATE_CONTROL === 0}
                    gradientMonochrome="teal"
                  />
                </div>
              </div>
              <div className="mb-2 flex justify-center items-center gap-2 flex-wrap mt-2">
                <span className="text-sm w-40">目前流量設定值 (僅顯示)</span>
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    value={mainGasDetail.SETTING_SP_FLOW  || 0}
                    readOnly
                    className="p-1 border rounded bg-gray-50 w-32"
                  />
                  <span className="text-md w-4">{mainGasDetail?.FLOW_UNIT || "slm"}</span>
                </div>
              </div>
              <div className="mb-2 flex justify-center items-center gap-2 flex-wrap">
                <span className="text-sm w-40">累計流量</span>
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    value={mainGasDetail?.TOTAL_FLOW || 0}
                    readOnly
                    className="p-1 border rounded bg-gray-50 w-32"
                  />
                  <span className="text-md w-4">{mainGasDetail?.TOTAL_FLOW_UNIT || "L"}</span>
                </div>
              </div>
              <ButtonComponent
                label="累計流量重製"
                onClick={resetMainGasTotalFlowApi}
                isDisabled={!isMainGasOpenState}
                loading={onMainGasLoading}
                gradientMonochrome="teal"
              />
            </div>
            {/* 載氣流量設定 */}
            <div className="border p-4 border-blue-300 rounded shadow flex items-center justify-center flex-col">
              <h3 className="font-bold">載氣流量</h3>
              <h3 className="font-bold mb-2">(Carrier Gas Flow)</h3>
              <div className="mb-2 flex justify-center items-center gap-2 flex-wrap">
                <span className="text-sm w-40">氣體種類</span>
                <div className="flex justify-between items-center gap-2">
                  <input
                    type="text"
                    value={carrierGasDetail?.gas || "- -"}
                    readOnly
                    className="p-1 border rounded bg-gray-50 w-32"
                  />
                  <span className="text-md w-4"/>
                </div>
              </div>
              <div className="mb-2 flex justify-center items-center gap-2 flex-wrap mt-2">
                <span className="text-sm w-40">MFC溫度</span>
                <div className="flex justify-between items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    value={Number(carrierGasDetail?.temperature || 0).toFixed(2)}
                    step="0.01"
                    readOnly
                    className="p-1 border rounded bg-gray-50 w-32"
                  />
                  <span className="text-md w-4">°C</span>
                </div>
              </div>
              <div className="mb-2 flex justify-center items-center gap-2 flex-wrap">
                  <span className="text-sm w-40">即時載氣流量 (SV)</span>
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      value={Number(carrierGasDetail?.mass_flow || 0).toFixed(3)}
                      step="0.001"
                      readOnly
                      className="p-1 border rounded bg-gray-50 w-32"
                    />
                    <span className="text-md w-4">slm</span>
                  </div>
              </div>
              <div className="mb-2 flex justify-center items-center gap-2 flex-wrap">
                  <span className="text-sm w-40">即時流量設定 (SV)</span>
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      step="0.001"
                      value={Number(carrierGasFlowSetting)}
                      readOnly={!isCarrierGasOpenState}
                      className={`${
                        !isCarrierGasOpenState && "bg-gray-50"
                      } p-1 border rounded w-32`}
                      onChange={onCarrierFlowSettingChange}
                    />
                    <span className="text-md w-4">slm</span>
                  </div>
              </div>
              <ButtonComponent
                label="流量設定"
                onClick={onCarrierFlowSettingClick}
                isDisabled={!isCarrierGasOpenState}
                gradientMonochrome="lime"
                loading={onCarrierGasLoading}
              />
              <div className="mb-2 flex justify-center items-center gap-2 flex-wrap mt-2">
                  <span className="text-sm w-40">目前流量設定值 (僅顯示)</span>
                  <div className="flex justify-between items-center gap-2 flex-wrap">
                    <input
                      type="number"
                      value={carrierGasDetail?.setpoint || 0}
                      readOnly
                      className="p-1 border rounded bg-gray-50 w-32"
                    />
                    <span className="text-md w-4">slm</span>
                  </div>
              </div>
            </div>
          </div>
          <div className="border p-4 border-purple-300 rounded shadow mt-4 flex items-center justify-center flex-col">
            <h3 className="font-bold">溫度控制器</h3>
            <h3 className="font-bold mb-2">(Heater)</h3>
            <div className="flex items-center gap-2 flex-wrap justify-center mb-2">
              <span className="text-sm w-40">溫度設定</span>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="number"
                  value={temperature}
                  onChange={(e) => setTemperature(e.target.value)}
                  className="p-1 border rounded w-32"
                  placeholder="請輸入溫度(0.0)"
                />
                <span className="text-sm w-4">°C</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center mb-2">
              <span className="text-sm w-40">目前設定溫度 (僅顯示)</span>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="number"
                  value={Number(heaterDetail?.decimal_point) === 1 ? Number(heaterDetail?.SV*0.1 || 0).toFixed(1) : Number(heaterDetail?.SV || 0).toFixed(1)}
                  readOnly
                  className="p-1 border rounded bg-gray-50 w-32"
                />
                <span className="text-sm w-4">°C</span>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-center mb-2">
              <span className="text-sm w-40">實際溫度</span>
              <div className="flex items-center gap-2 flex-wrap">
                <input
                  type="number"
                  value={Number(heaterDetail?.PV || 0).toFixed(1)}
                  readOnly
                  className="p-1 border rounded bg-gray-50 w-32"
                />
                <span className="text-sm w-4">°C</span>
              </div>
            </div>
            <ButtonComponent
              label="溫度設定"
              otherCss={"bg-green-500"}
              onClick={setHeaterTemperatureApi}
              loading={onHeaterSettingLoading}
              isDisabled={!isHeaterOpenState}
              gradientMonochrome="lime"
              />
          </div>
        </div>

        {/* Middle Column - Laser + Ultrasonic & Robot */}
        <div className="bg-white p-4 rounded shadow">
          <div className="space-y-4">
            {/* Laser Control */}
            <div className="border p-4 border-orange-300 rounded shadow flex items-center justify-center flex-col">
              <h3 className="font-bold">CO2 雷射</h3>
              <h3 className="font-bold mb-2">(CO2 Laser)</h3>
              <div className="flex justify-center items-center gap-2 flex-wrap mb-2">
                <span className="text-sm w-40">PWM 設定</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    value={laserPWM}
                    onChange={(e) => setLaserPWM(e.target.value)}
                    placeholder="請輸入百分比(0.5為單位)"
                    className="p-1 border rounded w-32"
                    disabled={!isCo2LaserOpenState}
                  />
                  <span className="text-sm w-4">%</span>
                </div>
              </div>
              <ButtonComponent
                label="PWM設定"
                onClick={setCo2LaserPowerApi}
                isDisabled={!isCo2LaserOpenState}
                loading={onLaserOpenLoading}
                gradientMonochrome="lime"
              />
              <div className="flex justify-center items-center gap-2 flex-wrap mt-2">
                <span className="text-sm w-40">目前PWM (僅顯示)</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    step={0.1}
                    value={co2LaserDetail?.pwm_percentage || 0}
                    onChange={(e) => setLaserPWM(Number(e.target.value))}
                    placeholder="0"
                    className="p-1 border rounded bg-gray-50 w-32"
                    readOnly
                  />
                  <span className="text-sm w-4">%</span>
                </div>
              </div>
              <div className="flex justify-center items-center gap-2 mt-2">
                <ButtonComponent
                  label="ON"
                  isDisabled={!isCo2LaserOpenState || co2LaserDetail?.laser_on}
                  onClick={() => setCo2LaserOpenState(true)}
                  loading={onLaserOpenLoading}
                  isOpen={co2LaserDetail?.laser_on}
                  gradientMonochrome="teal"
                />
                <ButtonComponent
                  label="OFF" 
                  isDisabled={!isCo2LaserOpenState || !co2LaserDetail?.laser_on}
                  onClick={() => setCo2LaserOpenState(false)}
                  loading={onLaserOpenLoading}
                  gradientMonochrome="teal"
                />
              </div>
            </div>
            <div className="border p-4 border-red-300 rounded shadow flex items-center justify-center flex-col">
              <h3 className="font-bold">超音波震盪器</h3>
              <h3 className="font-bold mb-2">(Ultrasonic)</h3>
              <p className="flex items-center gap-2 mb-2 text-sm">
                目前震盪器狀態: <span className='font-bold text-purple-500'>{ultrasonicOpenFlag ? "開啟" : "關閉"}</span>
              </p>
              <div className="flex justify-center items-center gap-2 mt-2">
                <ButtonComponent
                  label="ON"
                  onClick={setUltrasonicOpen}
                  isOpen={ultrasonicOpenFlag}
                  isDisabled={!isUltrasonicOpenState || ultrasonicOpenFlag}
                  loading={onUltrasonicLoading}
                  gradientMonochrome="teal"
                />
                <ButtonComponent
                  label="OFF"
                  onClick={setUltrasonicClose}
                  isDisabled={!isUltrasonicOpenState || !ultrasonicOpenFlag}
                  loading={onUltrasonicLoading}
                  gradientMonochrome="teal"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4 mt-4 mb-4">
            {/* Power supply Section */}
            <div className="border p-4 border-green-300 rounded shadow flex items-center justify-center flex-col">
              <h3 className="font-bold mb-2">脈衝電源控制器</h3>
              <h3 className="font-bold mb-2">(Power supply)</h3>
              {/* <h3 className="font-bold mb-2 text-red-500">無即時監控，且有時顯示會異常</h3>
              <h3 className="font-bold mb-2 text-red-500">開啟功能可正常使用</h3> */}
              <ButtonComponent
                label="清除錯誤"
                otherCss="bg-green-500 mt-2"
                gradientMonochrome="failure"
                onClick={clearPowerSupplyErrorCodeApi}
                loading={onPowerSupplyLoading}
                isDisabled={!isPowerSupplyOpenState}
              />
              <div className="flex justify-center items-center gap-2 flex-wrap mt-2">
                <span className="text-sm w-40">目前設備狀態</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="text"
                    className={`p-1 border rounded bg-gray-50 w-32 font-bold ${powerSupplyDeviceStatus === "Error" ? "text-red-500" : "text-black"}`}
                    readOnly
                    placeholder="Device status"
                    value={powerSupplyDeviceStatus}
                  />
                  <span className="text-sm w-4" />
                </div>
              </div>
              <div className="flex justify-center items-center gap-2 flex-wrap mt-2">
                <span className="text-sm w-40">目前脈衝電壓值 (PV)</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    placeholder="0"
                    className="p-1 border rounded bg-gray-50 w-32"
                    readOnly
                    value={powerSupplyDetail.voltage || 0}
                  />
                  <span className="text-sm w-4">V</span>
                </div>
              </div>
              <div className="flex justify-center items-center gap-2 flex-wrap mt-2">
                <span className="text-sm w-40">設定脈衝電壓值 (SV)</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    className="p-1 border rounded w-32"
                    value={powerSupplyVoltage}
                    onChange={(e) => setPowerSupplyVoltage(e.target.value)}
                    placeholder="請輸入整數"
                    disabled={!isPowerSupplyOpenState}
                  />
                  <span className="text-sm w-4">V</span>
                </div>
              </div>
              <ButtonComponent
                label="電壓設定"
                otherCss="bg-green-500 mt-2"
                gradientMonochrome="teal"
                onClick={onPowerSupplyVoltageClick}
                isDisabled={!isPowerSupplyOpenState}
                loading={onPowerSupplyLoading}
              />
              <div className="flex justify-center items-center gap-2 mt-2 flex-wrap">
                <ButtonComponent
                  label="DC1 升壓"
                  gradientMonochrome="teal"
                  onClick={setPowerSupplyDC1BoostApi}
                  // isDisabled={!isPowerSupplyOpenState || isDC1Boost || isPowerOpen}
                  isDisabled={!isPowerSupplyOpenState}
                  loading={onPowerSupplyLoading}
                  isOpen={isDC1Boost}
                />
                <ButtonComponent
                  label="DC1 降壓"
                  gradientMonochrome="teal"
                  onClick={setPowerSupplyDC1BuckApi}
                  // isDisabled={!isPowerSupplyOpenState || !isDC1Boost || isPowerOpen}
                  isDisabled={!isPowerSupplyOpenState}
                  loading={onPowerSupplyLoading}
                  isOpen={!isDC1Boost}
                />
                <div
                  className="flex justify-center items-center gap-2 flex-wrap"
                >
                  <ButtonComponent
                    label="Power開啟"
                    gradientMonochrome="pink"
                    onClick={setPowerSupplyPowerOnApi}
                    isDisabled={!isPowerSupplyOpenState}
                    loading={onPowerSupplyLoading}
                    isOpen={isPowerOpen}
                  />
                  <ButtonComponent
                    label="Power關閉"
                    gradientMonochrome="pink"
                    onClick={setPowerSupplyPowerOffApi}
                    isDisabled={!isPowerSupplyOpenState}
                    loading={onPowerSupplyLoading}
                    isOpen={!isPowerOpen}
                  />
                </div>
              </div>
            </div>
          </div>
          <div className="space-y-4">
            {/* Robot Control */}
            <div className="border p-4 border-red-300 rounded shadow flex items-center justify-center flex-col">
              <h3 className="font-bold">機械手臂控制</h3>
              <h3 className="font-bold mb-2">(Robot control)</h3>
              <p className="flex items-center gap-2 mb-2 text-sm">
                目前機械手臂狀態: <span className='font-bold text-purple-500'>{ultrasonicOpenFlag ? "運作中" : "關閉"}</span>
              </p>
              <div className="flex justify-center items-center gap-2 mt-2">
                <ButtonComponent
                  label="開啟"
                  onClick={setUltrasonicOpen}
                  isOpen={ultrasonicOpenFlag}
                  isDisabled={!isUltrasonicOpenState || ultrasonicOpenFlag}
                  loading={onUltrasonicLoading}
                  gradientMonochrome="teal"
                />
                <ButtonComponent
                  label="關閉"
                  onClick={setUltrasonicClose}
                  isDisabled={!isUltrasonicOpenState || !ultrasonicOpenFlag}
                  loading={onUltrasonicLoading}
                  gradientMonochrome="teal"
                />
              </div>
              <p className="flex items-center gap-2 mb-2 text-sm mt-4">
                目前速度百分比: <span className='font-bold text-purple-500'> - - %</span>
              </p>
              <div className="flex justify-center items-center gap-2 flex-wrap mt-2">
                <span className="text-sm w-40">目前實際速度 (mm/s)</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    placeholder="0"
                    className="p-1 border rounded bg-gray-50 w-32"
                    readOnly
                  />
                  <span className="text-sm w-4">mm/s</span>
                </div>
              </div>
              <div className="flex justify-center items-center gap-2 flex-wrap mt-2">
                <span className="text-sm w-40">速度百分比調整 (%)</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    className="p-1 border rounded w-32"
                    placeholder="請輸入整數"
                  />
                  <span className="text-sm w-4">%</span>
                </div>
              </div>
              <ButtonComponent
                label="速度設定"
                otherCss="bg-green-500 mt-2"
                gradientMonochrome="teal"
              />
            </div>
          </div>
        </div>

        {/* Right Column*/}
        <div className="bg-white p-4 rounded shadow bg-red-200">
          <h2 className="font-bold text-blue-800 text-center text-lg">
            UV laser & SC-300 Controller 預定
          </h2>
          <div className="space-y-4">
            {/* UV laser Control */}
            <div className="border p-4 border-red-500 rounded shadow flex items-center justify-center flex-col">
              <h3 className="font-bold">UV laser</h3>
              <div className="flex justify-center items-center gap-2 mt-2">
                <ButtonComponent
                  label="開啟"
                  onClick={setUltrasonicOpen}
                  isOpen={ultrasonicOpenFlag}
                  isDisabled={!isUltrasonicOpenState || ultrasonicOpenFlag}
                  loading={onUltrasonicLoading}
                  gradientMonochrome="teal"
                />
                <ButtonComponent
                  label="關閉"
                  onClick={setUltrasonicClose}
                  isDisabled={!isUltrasonicOpenState || !ultrasonicOpenFlag}
                  loading={onUltrasonicLoading}
                  gradientMonochrome="teal"
                />
              </div>
              <div className="flex justify-center items-center gap-2 flex-wrap mt-2">
                <span className="text-sm w-40">Power factor</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    placeholder="0"
                    className="p-1 border rounded w-32"
                  />
                  <span className="text-sm w-4" />
                </div>
              </div>
              <ButtonComponent
                label="Power factor設定"
                otherCss="bg-green-500 mt-2"
                gradientMonochrome="teal"
              />
              <div className="flex justify-center items-center gap-2 flex-wrap mt-2">
                <span className="text-sm w-40">電流 (A)</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    className="p-1 border rounded w-32"
                    placeholder="請輸入整數"
                  />
                  <span className="text-sm w-4">A</span>
                </div>
              </div>
              <ButtonComponent
                label="電流設定"
                otherCss="bg-green-500 mt-2"
                gradientMonochrome="teal"
              />
            </div>
            {/* SC-300 Control */}
            <div className="border p-4 border-blue-500 rounded shadow flex items-center justify-center flex-col">
              <h3 className="font-bold">Z軸控制器</h3>
              <h3 className="font-bold">(SC-300)</h3>
              <div className="flex justify-center items-center gap-2 flex-wrap mt-2">
                <span className="text-sm w-40">目前位移量</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    placeholder="0"
                    className="p-1 border rounded bg-gray-50 w-32"
                    readOnly
                  />
                  <span className="text-sm w-4" />
                </div>
              </div>
              <div className="flex justify-center items-center gap-2 flex-wrap mt-2">
                <span className="text-sm w-40">位移量設定</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <input
                    type="number"
                    className="p-1 border rounded w-32"
                    placeholder="請輸入整數"
                  />
                  <span className="text-sm w-4" />
                </div>
              </div>
              <ButtonComponent
                label="位移量設定"
                otherCss="bg-green-500 mt-2"
                gradientMonochrome="teal"
              />
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
                  label="套用"
                  otherCss="w-full max-w-md"
                  onClick={onRecipeApplyClick}
                  isDisabled={!isCarrierGasOpenState && !isMainGasOpenState && !isCo2LaserOpenState && !isHeaterOpenState && !isUltrasonicOpenState}
                  gradientMonochrome="teal"
                />
              </div>
            </div>
          </div>
          {/* 自動啟動按鈕 */}
          <div className="flex flex-col justify-center mt-4 items-center">
            <h3 className="font-bold mb-2 text-blue-800 text-center text-lg">
              一鍵啟動
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
              isDisabled={!isCarrierGasOpenState && !isMainGasOpenState && !isCo2LaserOpenState && !isHeaterOpenState && !isUltrasonicOpenState}
              loading={onAutoStartLoading}
              gradientMonochrome="teal"
            />
          </div>
          {/* 一鍵全部關閉 */}
          <div className="flex flex-col justify-center mt-4 items-center">
            <h3 className="font-bold mb-2 text-blue-800 text-center text-lg">
              一鍵關閉
            </h3>
            <h5
              className="text-sm text-center text-gray-500 mb-2"
            >
              按下按鈕後，將會目前有連線的裝置全部關閉(不是中斷連線)，包含霧化器，加熱器溫度設定為25度
            </h5>
            <ButtonComponent
              onClick={onAllCloseClick}
              label="全部關閉 (All Close)"
              otherCss="w-full max-w-md"
              isDisabled={!isCarrierGasOpenState && !isMainGasOpenState && !isCo2LaserOpenState && !isHeaterOpenState && !isUltrasonicOpenState}
              loading={onAutoStartLoading}
              gradientMonochrome="teal"
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
              title="主氣流量監測"
              dataHistory={mainGasFlowData.history}
              timeLabels={mainGasFlowData.labels}
              label="Main Gas flow"
              yAxisLabel={`Flow Rate (${mainGasDetail?.FLOW_UNIT || "slm"})`}
              yAxisMax={50}
              yAxisMin={0}
              yAxisStep={1}
              lineColor="rgb(192, 108, 75)"
              backgroundColor="rgba(192, 79, 75, 0.2)"
            />
            <LineChartComponent
              title="主氣累積流量監測"
              dataHistory={mainGasAccumulatedFlowData.history}
              timeLabels={mainGasAccumulatedFlowData.labels}
              label="Main Gas Accumulated flow"
              yAxisLabel={`Flow Rate (${mainGasDetail?.TOTAL_FLOW_UNIT || "L"})`}
              yAxisMax={5}
              yAxisMin={0}
              yAxisStep={0.4}
              lineColor="rgb(238, 186, 166)"
              backgroundColor="rgba(114, 86, 85, 0.2)"
            />
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
      {
        sessionStorage.getItem("firstEnterPage") === "false" && (
          <AutoConnectModal
            isCarrierGasConnected={isCarrierGasOpenState}
            isMainGasConnected={isMainGasOpenState}
            isCo2LaserConnected={isCo2LaserOpenState}
            isHeaterConnected={isHeaterOpenState}
            isUltrasonicConnected={isUltrasonicOpenState}
            isPowerSupplyConnected={isPowerSupplyOpenState}
            isOpen={isCarrierGasOpenState || isMainGasOpenState || isCo2LaserOpenState || isHeaterOpenState || isUltrasonicOpenState}
          />
        )
      }
    </div>
  );
};

export default ControllerPage;
