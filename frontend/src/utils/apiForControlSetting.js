import { getApi } from "./getApi";

// 主氣連線
export  const connectMainGasApi = async (data) => {
  try {
    const response = await getApi('/azbil_api/connect', 'POST', data, localStorage.getItem('token'));

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: '主氣連線成功',
      };
    }
  } catch (error) {
    console.error('主氣連線錯誤:', error);

    return {
      status: 'failure',
      message: '主氣連線錯誤',
    };
  }
};

// 載氣連線
export  const connectCarrierGasApi = async (data) => {
  try {
    const response = await getApi('/alicat_api/connect', 'POST', data, localStorage.getItem('token'));

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: '載氣連線成功',
      };
    }
  } catch (error) {
    console.error('載氣連線錯誤:', error);

    return {
      status: 'failure',
      message: '載氣連線錯誤',
    };
  }
};

// CO2雷射連線
export const connectCo2LaserApi = async (data) => {
  try {
    const response = await getApi('/uc2000/connect', 'POST', data, localStorage.getItem('token'));

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: 'CO2雷射連線成功',
      };
    }
  } catch (error) {
    console.error('CO2雷射連線錯誤:', error);

    return {
      status: 'failure',
      message: 'CO2雷射連線錯誤',
    };
  }
};

// 加熱器連線
export const connectHeaterApi = async (data) => {
  try {
    const response = await getApi('/heater/connect', 'POST', data, localStorage.getItem('token'));

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: '加熱器連線成功',
      };
    }
  } catch (error) {
    console.error('加熱器連線錯誤:', error);

    return {
      status: 'failure',
      message: '加熱器連線錯誤',
    };
  }
};

// 震盪器連線
export const connectUltrasonicApi = async (data) => {
  try {
    const response = await getApi('/ultrasonic/connect', 'POST', data, localStorage.getItem('token'));

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: '震盪器連線成功',
      };
    }
  } catch (error) {
    console.error('震盪器連線錯誤:', error);

    return {
      status: 'failure',
      message: '震盪器連線錯誤',
    };
  }
};

// 電源供應器連線
export const connectPowerSupplyApi = async (data) => {
  try {
    const response = await getApi('/power_supply/connect', 'POST', data, localStorage.getItem('token'));

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: '電源供應器連線成功',
      };
    }
  } catch (error) {
    console.error('電源供應器連線錯誤:', error);

    return {
      status: 'failure',
      message: '電源供應器連線錯誤',
    };
  }
};

// 主氣調整
export const setMainGasApi = async (data, mainGasDetailState) => {
  try {
    let newSettingSp = data;

    switch (mainGasDetailState.FLOW_UNIT) {
      case "mL/min":
        newSettingSp = Number(data) / 100;
        break;
      case "L/min":
        newSettingSp = Number(data) * 10;
        break;
      case "m^3/h":
        newSettingSp = Number(data) / 0.06 * 10;
        break;
      default:
        newSettingSp = Number(data);
        break;
    }

    const response = await getApi('/azbil_api/set_flow', 'POST', {
      flow: newSettingSp,
    }, localStorage.getItem('token'));

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: '主氣調整成功',
      };
    }
  } catch (error) {
    console.error('主氣調整錯誤:', error);

    return {
      status: 'failure',
      message: '主氣調整錯誤',
    };
  }
};

// 主氣開啟/控制/關閉
export const setMainGasOnOffApi = async (mode) => {
  try {
    let response = {};
    switch (mode) {
      case 'control':
        response = await getApi('/azbil_api/flow_turn_on', 'POST', null, localStorage.getItem('token'));
        break;
      case 'full':
        response = await getApi('/azbil_api/flow_turn_full', 'POST', null, localStorage.getItem('token'));
        break;
      default:
        response = await getApi('/azbil_api/flow_turn_off', 'POST', null, localStorage.getItem('token'));
        break;
    }

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: '主氣調整成功',
      };
    }
  } catch (error) {
    console.error('主氣調整錯誤:', error);

    return {
      status: 'failure',
      message: '主氣調整錯誤',
    };
  }
};

// 載氣調整
export const setCarrierGasApi = async (data) => {
  try {
    const response = await getApi('/alicat_api/set_flow_rate', 'POST', {
      flow_rate: Number(data),
    }, localStorage.getItem('token'));

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: '載氣調整成功',
      };
    }
  } catch (error) {
    console.error('載氣調整錯誤:', error);

    return {
      status: 'failure',
      message: '載氣調整錯誤',
    };
  }
};

// 載氣關閉
export const setCarrierGasOffApi = async () => {
  try {
    const response = await getApi('/alicat_api/set_flow_rate', 'POST', {
      flow_rate: 0,
    }, localStorage.getItem('token'));

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: '載氣調整成功',
      };
    }
  } catch (error) {
    console.error('載氣調整錯誤:', error);

    return {
      status: 'failure',
      message: '載氣調整錯誤',
    };
  }
};

// CO2雷射調整，表格填寫的時候要檢查，這邊不檢查
export const setCo2LaserApi = async (percentage) => {
  try {
    const response = await getApi('/uc2000/set_pwm', 'POST', {
      percentage: Number(percentage),
    }, localStorage.getItem('token'));

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: 'CO2雷射調整成功',
      };
    }
  } catch (error) {
    console.error('CO2雷射調整錯誤:', error);

    return {
      status: 'failure',
      message: 'CO2雷射調整錯誤',
    };
  }
};

// CO2雷射開啟/關閉
export const setCo2LaserOnOffApi = async (isTurnOn) => {
  try {
    const response = await getApi("/uc2000/set_laser", "POST", {
      enable: isTurnOn,
    }, localStorage.getItem('token'));

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: 'CO2雷射調整成功',
      };
    }
  } catch (error) {
    console.error('CO2雷射調整錯誤:', error);

    return {
      status: 'failure',
      message: 'CO2雷射調整錯誤',
    };
  }
};

// 加熱器調整，要檢查小數點位數
// 最大值這邊不檢查，表格填寫的時候要檢查
export const setHeaterApi = async (temperature, decimal_point) => {
  try {
    const response = await getApi('/heater/update', 'POST', {
      SV: Number(decimal_point) === 1 ? Number(temperature*10) : Number(temperature),
    }, localStorage.getItem('token'));

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: '加熱器調整成功',
      };
    }
  } catch (error) {
    console.error('加熱器調整錯誤:', error);

    return {
      status: 'failure',
      message: '加熱器調整錯誤',
    };
  }
};

// 震盪器開啟/關閉
export const setUltrasonicApi = async (isTurnOn) => {
  try {
    let response = {};
    if (isTurnOn) {
      response = await getApi('/ultrasonic/turn_on', 'POST', null, localStorage.getItem('token'));

    } else {
      response = await getApi('/ultrasonic/turn_off', 'POST', null, localStorage.getItem('token'));
    }

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: '震盪器調整成功',
      };
    }
  } catch (error) {
    console.error('震盪器調整錯誤:', error);

    return {
      status: 'failure',
      message: '震盪器調整錯誤',
    };
  }
};

// 電源供應器電壓調整
export const setPowerSupplyApi = async (voltage) => {
  try {
    const response = await getApi('/power_supply/write_voltage', 'POST', {
      voltage: Number(voltage),
    }, localStorage.getItem('token'));

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: '電源供應器調整成功',
      };
    }
  } catch (error) {
    console.error('電源供應器調整錯誤:', error);

    return {
      status: 'failure',
      message: '電源供應器調整錯誤',
    };
  }
};

// 電源供應器DC1升壓/降壓
export const setPowerSupplyDc1Api = async (isBoost) => {
  try {
    let response = {};
    if (isBoost) {
      response = await getApi('/power_supply/dc1_turn_on', 'POST', null, localStorage.getItem('token'));
    } else {
      response = await getApi('/power_supply/dc1_turn_off', 'POST', null, localStorage.getItem('token'));
    }

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: '電源供應器DC1調整成功',
      };
    }
  } catch (error) {
    console.error('電源供應器DC1調整錯誤:', error);

    return {
      status: 'failure',
      message: '電源供應器DC1調整錯誤',
    };
  }
};

// 電源供應器Power On/Off
export const setPowerSupplyPowerApi = async (isPowerOn) => {
  try {
    let response = {};
    if (isPowerOn) {
      response = await getApi('/power_supply/power_on', 'POST', null, localStorage.getItem('token'));
    } else {
      response = await getApi('/power_supply/power_off', 'POST', null, localStorage.getItem('token'));
    }

    if (response?.data?.status === 'success') {
      return {
        status: 'success',
        message: '電源供應器Power調整成功',
      };
    }
  } catch (error) {
    console.error('電源供應器Power調整錯誤:', error);

    return {
      status: 'failure',
      message: '電源供應器Power調整錯誤',
    };
  }
};