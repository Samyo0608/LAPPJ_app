import React from 'react'
import { ToggleSwitch } from "flowbite-react";
import AlertComponent from '../ComponentTools/Alert';
import CommonLoading from '../Loading/CommonLoading';
import { getApi } from '../../utils/getApi';
import { parseGasMixture } from '../../utils/mixGasUtil';
import { useAlicatContext } from '../../Contexts/AlicatContext';
import { useCo2LaserContext } from '../../Contexts/Co2LaserContext';
import { useHeaterContext } from '../../Contexts/HeaterContext';
import { useAzbilContext } from '../../Contexts/AzbilContext';

// 主氣參數轉換
const mainGasParams = {
  gasType: 'GAS_TYPE',
  flowDecimal: 'FLOW_DECIMAL',
  totalFlowDecimal: 'TOTAL_FLOW_DECIMAL',
  flowUnit: 'FLOW_UNIT',
  totalFlowUnit: 'TOTAL_FLOW_UNIT',
  gateControl: 'GATE_CONTROL',
  spNoSetting: 'SP_NO_SETTING',
  sp0Setting: 'SP_0_SETTING',
  sp1Setting: 'SP_1_SETTING',
  sp2Setting: 'SP_2_SETTING',
  sp3Setting: 'SP_3_SETTING',
  sp4Setting: 'SP_4_SETTING',
  sp5Setting: 'SP_5_SETTING',
  sp6Setting: 'SP_6_SETTING',
  sp7Setting: 'SP_7_SETTING',
  settingSpFlow: 'SETTING_SP_FLOW',
  pvFlow: 'PV_FLOW',
  flowRate: 'FLOW_RATE',
  keyLock: 'KEY_LOCK',
  flowControlSetting: 'FLOW_CONTROL_SETTING',
  simulationFlow: 'SIMULATION_FLOW',
  flowLimit: 'FLOW_LIMIT',
  gateErrorFix: 'GATE_ERROR_FIX',
  flowInitialTemp: 'FLOW_INITIAL_TEMP',
  deviceIdSetting: 'DEVICE_ID_SETTING',
  deviceInstallDir: 'DEVICE_INSTALL_DIR',
  flowInputLimit: 'FLOW_INPUT_LIMIT',
  flowSensorType: 'FLOW_SENSOR_TYPE',
  keyDirection: 'KEY_DIRECTION'
};

// 將 SingleConnectComponent 改為獨立的函數組件
const SingleConnectComponent = React.memo(({ company, deviceId, onClick, onConnectPortChange, onConnectAddressChange, devicesData }) => {
  // 使用 local state 管理輸入值
  const [localPort, setLocalPort] = React.useState('');
  const [localAddress, setLocalAddress] = React.useState('');

  const handlePortChange = (e) => {
    setLocalPort(e.target.value);
  };

  const handleAddressChange = (e) => {
    setLocalAddress(e.target.value);
  };

  const handlePortBlur = (deviceId, value) => {
    if (devicesData[deviceId]?.connected) return;
    onConnectPortChange(deviceId, value);
  };

  const handleAddressBlur = (deviceId, value) => {
    if (devicesData[deviceId]?.connected) return;
    onConnectAddressChange(deviceId, value);
  };

  return (
    <div className='border rounded-md p-2 border-green-300 mb-2 flex flex-col justify-between min-h-72'>
      <div>
        <h3 className="font-semibold mb-3">廠牌: {company}</h3>
        <div>
          <label className="block font-medium">Port</label>
          <input
            type="text"
            className={`${devicesData[deviceId]?.connected ? 'bg-gray-200' : 'bg-white'} w-full border rounded-md p-2`}
            placeholder="輸入Port名稱, ex: COM7"
            value={localPort || devicesData[deviceId]?.port}
            onChange={handlePortChange}
            readOnly={devicesData[deviceId]?.connected}
            onBlur={() => handlePortBlur(deviceId, localPort)}
          />
        </div>
        {
          (deviceId !== 'co2Laser') && (
            <>
              <label className="block font-medium">Address</label>
              <input
                type="text"
                className={`${devicesData[deviceId]?.connected ? 'bg-gray-200' : 'bg-white'} w-full border rounded-md p-2`}
                placeholder="輸入Address, ex: A"
                value={localAddress || devicesData[deviceId]?.address}
                onChange={handleAddressChange}
                readOnly={devicesData[deviceId]?.connected}
                onBlur={() => handleAddressBlur(deviceId, localAddress)}
              />
            </>
          )
        }
      </div>
      <div className='flex justify-center items-center mb-2'>       
        <button
          className={`${devicesData[deviceId]?.connected ? 'bg-green-600 hover:bg-green-300 text-white' : 'bg-gray-600 hover:bg-gray-300 text-white'} py-2 px-4 rounded-md mt-2 w-48`}
          disabled={devicesData[deviceId]?.loading}
          onClick={() => onClick(deviceId)}
        >
          {devicesData[deviceId]?.loading ? (
            <CommonLoading />
          ) : (
            devicesData[deviceId]?.connected ? '取消連線 (Disconnect)' : '連線 (Connect)'
          )}
        </button>
      </div>
    </div>
  );
});

const useHooks = () => {
  const { isCarrierGasOpenState, setIsCarrierOpenState, setCarrierGasPortandAddressState, carrierGasPortandAddressState, carrierGasTypeState, setCarrierGasTypeState } = useAlicatContext();
  const { setCo2LaserDetailState, isCo2LaserOpenState, setIsCo2LaserOpenState, co2LaserPortState, setCo2LaserPortState } = useCo2LaserContext();
  const { isHeaterOpenState, setIsHeaterOpenState, setHeaterPortAndAddressState, heaterPortAndAddressState, heaterDetailState, setHeaterDetailState } = useHeaterContext();
  const { mainGasDetailState, setMainGasDetailState, isMainGasOpenState, setIsMainGasOpenState, mainGasPortAndAddressState, setMainGasPortAndAddressState } = useAzbilContext();
  // 單獨連線的項目整合
  const deviceList = [{
    title: '主氣流量控制器 - Main Gas',
    company: 'Azbil - F4Q0050B6SN1000D0',
    deviceId: 'mainGas',
    port: '',
    address: ''
  }, {
    title: '載氣流量控制器 - Carrier Gas',
    company: 'Alicat - MC Series',
    deviceId: 'carrierGas',
    port: '',
    address: ''
  } ,{
    title: '雷射控制器 - CO2 Laser',
    company: 'SYNRAD - UC2000',
    deviceId: 'co2Laser',
    port: '',
    address: ''
  }, {
    title: '加熱控制器 - Heater',
    company: '陽明電機 - NT-48-V-SSR',
    deviceId: 'heater',
    port: '',
    address: ''
  }];
  const [devices, setDevices] = React.useState(() => {
    // 初始化設備狀態
    return deviceList.reduce((acc, device) => {
      return {
        ...acc,
        [device.deviceId]: {
          port: '',
          address: '',
          connected: false,
          loading: false
        }
      };
    }, {});
  });

  // 主氣流量控制器相關
  const [mainGasSelectOrChangeList, setMainGasSelectOrChangeList] = React.useState({
    gasType: 0,
    flowDecimal: 0,
    totalFlowDecimal: 0,
    flowUnit: 0,
    totalFlowUnit: 0,
    gateControl: 0,
    spNoSetting: 0,
    sp0Setting: '',
    sp1Setting: '',
    sp2Setting: '',
    sp3Setting: '',
    sp4Setting: '',
    sp5Setting: '',
    sp6Setting: '',
    sp7Setting: '',
    settingSpFlow: 0.000,
    pvFlow: 0.000,
    flowRate: 0.000,
    keyLock: 0,
    flowControlSetting: 0,
    simulationFlow: 0,
    flowLimit: 0,
    gateErrorFix: 0,
    flowInitialTemp: 0,
    deviceIdSetting: 0,
    deviceInstallDir: 0,
    flowInputLimit: 0,
    flowSensorType: 0,
    keyDirection: 0
  });
  const [isMainGasLoading, setIsMainGasLoading] = React.useState(false);
  // 載氣設定相關
  const [carrierGasDetail, setCarrierGasDetail] = React.useState({});
  const [carrierGasTypeList, setCarrierGasTypeList] = React.useState(isCarrierGasOpenState && carrierGasTypeState?.length > 0 ? carrierGasTypeState : []);
  const [carrierGasTypeListLoading, setCarrierGasTypeListLoading] = React.useState(false);
  const [carrierGasTypeSetting, setCarrierGasTypeSetting] = React.useState("");
  const [carrierGasMixGas, setCarrierGasMixGas] = React.useState("");
  const [carrierGasCreateMixGas, setCarrierGasCreateMixGas] = React.useState({
    number: 0,
    name: "",
    gases: ""
  });
  // CO2雷射設定相關
  const [co2LaserDetail, setCo2LaserDetail] = React.useState({});
  const [co2SelectOrChangeList, setCo2SelectOrChangeList] = React.useState({
    mode: "remote",
    pwmFreq: 0,
    maxPwm: false,
    laserOnPowerUp: false,
    gatePullUp: false
  });
  const [isCo2LaserLoading, setIsCo2LaserLoading] = React.useState(false);
  // Heater設定相關
  const [heaterDetail, setHeaterDetail] = React.useState({});
  const [heaterInputList, setHeaterInputList] = React.useState({
    SV2: 0,
    SLH: 0,
    rAP: 0,
    Gain: 0.0,
    P: 0,
    I: 0,
    D: 0,
    M: 0,
    decimal_point: 0
  });
  const [isHeaterLoading, setIsHeaterLoading] = React.useState(false);
  
  // Alert相關
  const [alertDetail, setAlertDetail] = React.useState({});

  // -----------------------------main gas api function--------------------------------
  // 取得主氣流量控制器數據
  const getMainGasDataApi = React.useCallback(async () => {
    try {
      setIsMainGasLoading(true);
      const response = await getApi('/azbil_api/get_status', 'GET');

      if (response?.data?.status === 'success') {
        setMainGasDetailState(response.data.data);
  
        // 轉換key值，將response.data的key值轉換成mainGasParams的key值
        const processMainGasData = (apiData) => {
          if (!apiData) return {};
          
          return Object.entries(apiData).reduce((acc, [key, value]) => {
            return {
              ...acc,
              [Object.keys(mainGasParams).find(param => mainGasParams[param] === key)]: value
            };
          }, {});
        };
        
        setMainGasSelectOrChangeList(processMainGasData(response.data.data));
        
      } else {
        setIsMainGasOpenState(false);
        console.error(response?.data?.status);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsMainGasLoading(false);
    }
  }, [setIsMainGasOpenState, setMainGasDetailState]);

  // 主氣連線api
  const connectMainGasApi = async (data, deviceId) => {
    try {
      setDevices(prev => ({
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          loading: true
        }
      }));

      const response = await getApi('/azbil_api/connect', 'POST', data, localStorage.getItem('token'));

      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: response?.data?.message || '主氣連線成功',
          type: 'success'
        });
        setDevices(prev => ({
          ...prev,
          [deviceId]: {
            ...prev[deviceId],
            connected: true,
            loading: false
          }
        }));
        setIsMainGasOpenState(true);

        setDevices(prev => ({
          ...prev,
          mainGas: {
            ...prev.mainGas,
            port: data.port,
            address: data.address
          }
        }));

        setMainGasPortAndAddressState({
          port: data.port,
          address: data.address
        });
      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: response?.data?.message || '連線失敗',
          type: 'failure'
        });
      }
    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: '連線過程發生錯誤',
        type: 'failure'
      });
    } finally {
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  // 主氣取消連線api
  const disconnectMainGasApi = async (data, deviceId) => {
    try {
      setDevices(prev => ({
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          loading: true
        }
      }));
  
      const response = await getApi('/azbil_api/disconnect', 'POST', data, localStorage.getItem('token'));
  
      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: '主氣流量計已取消連線',
          type: 'success'
        });
        
        setDevices(prev => ({
          ...prev,
          [deviceId]: {
            ...prev[deviceId],
            connected: false,
            loading: false
          }
        }));
        
        setIsMainGasOpenState(false);

        setMainGasPortAndAddressState({
          port: devices[deviceId].port,
          address: devices[deviceId].address
        });
      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: '主氣流量計取消連線失敗',
          type: 'failure'
        });
        
        setDevices(prev => ({
          ...prev,
          [deviceId]: {
            ...prev[deviceId],
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error(error);
      setDevices(prev => ({
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          loading: false
        }
      }));
  
      setAlertDetail({
        show: true,
        message: '取消連線過程發生錯誤',
        type: 'failure'
      });
  
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  // 修改主氣流量控制器設定api
  const setMainGasSettingApi = async (data) => {
    try {
      setIsMainGasLoading(true);
      setDevices(prev => ({
        ...prev,
        mainGas: {
          ...prev.mainGas,
          loading: true
        }
      }));

      const filterData = {};

      Object.entries(data).forEach(([key, value]) => {
          const mappedKey = mainGasParams[key]; // 轉換為 mainGasDetailState 的鍵
          const oldValue = mainGasDetailState[mappedKey];
      
          // 確保 oldValue 不為 undefined，並進行數字比較
          if (oldValue !== undefined && Number(oldValue) !== Number(value)) {
              filterData[mappedKey] = Number(value);
          }
      });

      const response = await getApi('/azbil_api/update', 'POST', filterData);

      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: '主氣流量控制器設定成功',
          type: 'success'
        });

        await getMainGasDataApi();

      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: '主氣流量控制器設定失敗',
          type: 'failure'
        });
      }
    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: '設定過程發生錯誤',
        type: 'failure'
      });
    } finally {
      setDevices(prev => ({
        ...prev,
        mainGas: {
          ...prev.mainGas,
          loading: false
        }
      }));
  
      setIsMainGasLoading(false);

      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  // -----------------------------carrier gas api function--------------------------------
  // 取得載氣資料，使用 useCallback 避免無限迴圈
  const getCarrierGasDataApi = React.useCallback(async () => {
    const response = await getApi('/alicat_api/status', 'GET');
    if (response?.data?.status === 'success') {
      setCarrierGasDetail(response.data.data);
    } else {
      setIsCarrierOpenState(false);
      console.error(response?.data?.status);
    }
  }, [setIsCarrierOpenState]);

  // 取得所有載氣氣體種類
  const getCarrierGasAllGasTypeApi = async () => {
    setCarrierGasTypeListLoading(true);
    try {
      const response = await getApi('/alicat_api/gases', 'GET');
  
      const processGasesData = (apiData) => {
        if (!apiData?.data) return [];
        
        const { custom_mixtures, standard_gases } = apiData.data;
        
        // 處理自定義混合氣體
        const customGasOptions = Object.entries(custom_mixtures).map(([number, info]) => ({
          label: `${number}_${info.name}`,
          value: number
        }));
        
        // 處理標準氣體
        const standardGasOptions = standard_gases.map(gas => ({
          label: gas,
          value: gas
        }));
        
        // 合併兩個數組
        return [...standardGasOptions, ...customGasOptions];
      };
  
      if (response?.data?.status === 'success') {
        const gasList = processGasesData(response.data);
        setCarrierGasTypeList(gasList);
        setCarrierGasTypeListLoading(false);
        setCarrierGasTypeState(gasList);
        const firstMixGas = gasList.map(gas => gas.label.split('_') > 1)[0];
        setCarrierGasMixGas(firstMixGas);
  
        setAlertDetail({
          show: true,
          message: '取得資料成功',
          type: 'success'
        });
      } else {
        console.error(response?.data?.status);

        setAlertDetail({
          show: true,
          message: '取得資料失敗，請勿連續點擊、同時使用其他功能、或是尚未連結MFC。',
          type: 'failure'
        });
      }
    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: '取得資料失敗，請勿連續點擊、同時使用其他功能、或是尚未連結MFC。',
        type: 'failure'
      });
  
    } finally {
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 2000);

      setCarrierGasTypeListLoading(false);
    }
  };

  // 修改載氣氣體種類api
  const setCarrierGasGasTypeApi = async (data) => {
    setCarrierGasTypeListLoading(true);
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
      setCarrierGasTypeListLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 2000);
    }
  };

  // 新增載氣混合氣體api
  const addCarrierGasGasTypeApi = async () => {
    setCarrierGasTypeListLoading(true);
    try {
      const gasData = {
        mix_no: carrierGasCreateMixGas?.number,
        name: carrierGasCreateMixGas?.name,
        gases: parseGasMixture(carrierGasCreateMixGas?.gases)
      };
      const response = await getApi('/alicat_api/create_mix', 'POST', gasData);

      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: '載氣氣體新增成功',
          type: 'success'
        });

        // 成功後重新取得所有氣體種類
        getCarrierGasAllGasTypeApi();
      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: '載氣氣體新增失敗',
          type: 'failure'
        });
      }
    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: '新增過程發生錯誤',
        type: 'failure'
      });
    } finally {
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 2000);

      setCarrierGasTypeListLoading(false);
    }
  };

  // 刪除載氣混合氣體api
  const deleteCarrierGasGasTypeApi = async (number) => {
    setCarrierGasTypeListLoading(true);
    try {
      const response = await getApi('/alicat_api/delete_mix', 'POST', {
        mix_no: number
      });

      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: '載氣氣體刪除成功',
          type: 'success'
        });
        // 成功後重新取得所有氣體種類
        getCarrierGasAllGasTypeApi();
      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: '載氣氣體刪除失敗',
          type: 'failure'
        });
      }
    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: '刪除過程發生錯誤',
        type: 'failure'
      });
    } finally {
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 2000);
      setCarrierGasTypeListLoading(false);
    }
  };

  // 載氣設備連線api
  const connectCarrierGasApi = async (data, deviceId) => {
    try {
      setDevices(prev => ({
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          loading: true
        }
      }));
  
      const response = await getApi('/alicat_api/connect', 'POST', data, localStorage.getItem('token'));
  
      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: response?.data?.message || '載氣連線成功',
          type: 'success'
        });
        
        setDevices(prev => ({
          ...prev,
          [deviceId]: {
            ...prev[deviceId],
            connected: true,
            loading: false
          }
        }));

        if (deviceId === 'carrierGas') {
          setIsCarrierOpenState(true);
  
          setDevices(prev => ({
            ...prev,
            carrierGas: {
              ...prev.carrierGas,
              port: data.port,
              address: data.address
            }
          }));

          setCarrierGasPortandAddressState({
            port: data.port,
            address: data.address
          });
        }
      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: response?.data?.message || '連線失敗',
          type: 'failure'
        });
        
        setDevices(prev => ({
          ...prev,
          [deviceId]: {
            ...prev[deviceId],
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error(error);
      setDevices(prev => ({
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          loading: false
        }
      }));
  
      setAlertDetail({
        show: true,
        message: '連線過程發生錯誤',
        type: 'failure'
      });
  
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 3000);
    }
  };
  
  // 載氣設備取消連線api
  const disconnectCarrierGasApi = async (data, deviceId) => {
    try {
      setDevices(prev => ({
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          loading: true
        }
      }));
  
      const response = await getApi('/alicat_api/disconnect', 'POST', data, localStorage.getItem('token'));
  
      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: '載氣設備已取消連線',
          type: 'success'
        });
        
        setDevices(prev => ({
          ...prev,
          [deviceId]: {
            ...prev[deviceId],
            connected: false,
            loading: false
          }
        }));
        
        if (deviceId === 'carrierGas') {
          setIsCarrierOpenState(false);
  
          setCarrierGasPortandAddressState({
            port: devices[deviceId].port,
            address: devices[deviceId].address
          });
        }

      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: '取消連線失敗',
          type: 'failure'
        });
        
        setDevices(prev => ({
          ...prev,
          [deviceId]: {
            ...prev[deviceId],
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error(error);
      setDevices(prev => ({
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          loading: false
        }
      }));
  
      setAlertDetail({
        show: true,
        message: '取消連線過程發生錯誤',
        type: 'failure'
      });
  
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 3000);
    }
  };
  // -----------------------------------carrier gas api function------------------------------------

  // -------------------------co2 co2Laser api function-----------------------------
  // 取得CO2雷射設備資料
  const getCo2LaserDataApi = React.useCallback(async () => {
    const response = await getApi('/uc2000/status', 'GET');
    if (response?.data?.status === 'success') {
      setCo2LaserDetail(response.data.data);
      localStorage.setItem('co2LaserDetailState', JSON.stringify(response.data.data));
      setCo2LaserDetailState(response.data.data);
    } else {
      setIsCo2LaserOpenState(false);
      console.error(response?.data?.status);

      setCo2LaserDetailState({
        "gate_pull_up": false,
        "lase_on_powerup": false,
        "laser_on": false,
        "max_pwm_95": false,
        "mode": 0,
        "mode_name": "",
        "power_percentage": 0,
        "pwm_freq": 0,
        "pwm_percentage": 0,
        "remote_control": false,
        "version": 0
      });

      setAlertDetail({
        show: true,
        message: '取得Co2雷射資料失敗',
        type: 'failure'
    });

      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 3000);
    }
  }, [setIsCo2LaserOpenState, setCo2LaserDetailState]);

  // 連線CO2雷射設備api
  const connectCo2LaserApi = async (data) => {
    try {
      setDevices(prev => ({
        ...prev,
        co2Laser: {
          ...prev.co2Laser,
          loading: true
        }
      }));
      const response = await getApi('/uc2000/connect', 'POST', data, localStorage.getItem('token'));

      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: response.data.message || 'CO2雷射控制器連線成功',
          type: 'success'
        });

        setDevices(prev => ({
          ...prev,
          co2Laser: {
            ...prev.co2Laser,
            connected: true,
            loading: false
          }
        }));

        setIsCo2LaserOpenState(true);
      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: response?.data?.message || 'CO2雷射控制器連線失敗',
          type: 'failure'
        });

        setDevices(prev => ({
          ...prev,
          co2Laser: {
            ...prev.co2Laser,
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error(error);
      setDevices(prev => ({
        ...prev,
        co2Laser: {
          ...prev.co2Laser,
          loading: false
        }
      }));

      setAlertDetail({
        show: true,
        message: '連線過程發生錯誤',
        type: 'failure'
      });

    } finally {
      setCo2LaserPortState({
        port: data.port
      });

      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  // disconnect co2 co2Laser
  const disconnectCo2LaserApi = async (data) => {
    try {
      setDevices(prev => ({
        ...prev,
        co2Laser: {
          ...prev.co2Laser,
          loading: true
        }
      }));

      const response = await getApi('/uc2000/disconnect', 'POST', data, localStorage.getItem('token'));

      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: 'CO2雷射控制器已取消連線',
          type: 'success'
        });

        setDevices(prev => ({
          ...prev,
          co2Laser: {
            ...prev.co2Laser,
            connected: false,
            loading: false
          }
        }));

        setIsCo2LaserOpenState(false);
      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: '取消連線失敗',
          type: 'failure'
        });

        setDevices(prev => ({
          ...prev,
          co2Laser: {
            ...prev.co2Laser,
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error(error);
      setDevices(prev => ({
        ...prev,
        co2Laser: {
          ...prev.co2Laser,
          loading: false
        }
      }));

      setAlertDetail({
        show: true,
        message: 'CO2雷射控制器取消連線過程發生錯誤',
        type: 'failure'
      });
    } finally {
      setTimeout(() => {
        setAlertDetail({ show: false });
      }, 3000);
    }
  };

  // co2Laser setting (update) api
  const onCo2LaserSettingClick = async () => {
    if (!isCo2LaserOpenState) {
      setAlertDetail({
        show: true,
        message: '請先連接CO2雷射控制器',
        type: 'failure'
      });
      return;
    }
  
    setIsCo2LaserLoading(true);
    try {
      // 準備所有設定
      const settings = {
        mode: co2SelectOrChangeList.mode,
        pwm_freq: co2SelectOrChangeList.pwmFreq,
        max_pwm_95: co2SelectOrChangeList.maxPwm,
        lase_on_powerup: co2SelectOrChangeList.laserOnPowerUp,
        gate_pull_up: co2SelectOrChangeList.gatePullUp
      };
  
      // 調用新的 API
      const response = await getApi('/uc2000/update_settings', 'POST', settings);
  
      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: '設定更新成功',
          type: 'success'
        });
        
        // 更新狀態
        const statusResponse = await getApi('/uc2000/status', 'GET');
        if (statusResponse?.data?.status === 'success') {
          setCo2LaserDetail(statusResponse.data.data);
          setCo2LaserDetailState(statusResponse.data.data);
        }
      } else {
        console.error(response?.data?.status);

        setAlertDetail({
          show: true,
          message: response?.data?.message || '設定更新失敗',
          type: 'failure'
        });
      }
    } catch (error) {
      console.error('設定更新失敗:', error);
      setAlertDetail({
        show: true,
        message: error.message || '設定更新失敗',
        type: 'failure'
      });
    } finally {
      setIsCo2LaserLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 3000);
    }
  };
  // -------------------------co2 co2Laser api function-----------------------------

  // ----------------------------heater api function----------------------------
  // 取得Heater設備資料
  const getHeaterDataApi = React.useCallback(async () => {
    const response = await getApi('/heater/status', 'GET');
    if (response?.data?.status === 'success') {
      setHeaterDetail(response.data.data);
      localStorage.setItem('heaterDetailState', JSON.stringify(response.data.data));
      setHeaterDetailState(response.data.data);
    } else {
      setIsHeaterOpenState(false);
      setHeaterDetailState({
        "SV2": 0,
        "SLH": 0,
        "rAP": 0,
        "Gain": 0.0,
        "P": 0,
        "I": 0,
        "D": 0,
        "M": 0
      });
      console.error(response?.data?.status);

      setAlertDetail({
        show: true,
        message: '取得Heater資料失敗',
        type: 'failure'
      });

      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 3000);
    }

  }, [setIsHeaterOpenState, setHeaterDetailState]);

  // 連線Heater設備api
  const connectHeaterApi = async (data) => {
    try {
      setDevices(prev => ({
        ...prev,
        heater: {
          ...prev.heater,
          loading: true
        }
      }));

      const response = await getApi('/heater/connect', 'POST', data, localStorage.getItem('token'));

      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: response.data.message || 'Heater連線成功',
          type: 'success'
        });

        setDevices(prev => ({
          ...prev,
          heater: {
            ...prev.heater,
            connected: true,
            loading: false
          }
        }));

        setIsHeaterOpenState(true);
      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: response?.data?.message || 'Heater連線失敗',
          type: 'failure'
        });

        setDevices(prev => ({
          ...prev,
          heater: {
            ...prev.heater,
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error(error);
      setDevices(prev => ({
        ...prev,
        heater: {
          ...prev.heater,
          loading: false
        }
      }));

      setAlertDetail({
        show: true,
        message: '連線過程發生錯誤',
        type: 'failure'
      });
    } finally {
      setHeaterPortAndAddressState({
        port: data.port,
        address: data.address
      });

      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  // 斷開Heater設備連線api
  const disconnectHeaterApi = async (data) => {
    try {
      setDevices(prev => ({
        ...prev,
        heater: {
          ...prev.heater,
          loading: true
        }
      }));

      const response = await getApi('/heater/disconnect', 'POST', data, localStorage.getItem('token'));

      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: 'Heater已取消連線',
          type: 'success'
        });

        setDevices(prev => ({
          ...prev,
          heater: {
            ...prev.heater,
            connected: false,
            loading: false
          }
        }));

        setIsHeaterOpenState(false);
      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: '取消連線失敗',
          type: 'failure'
        });

        setDevices(prev => ({
          ...prev,
          heater: {
            ...prev.heater,
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error(error);
      setDevices(prev => ({
        ...prev,
        heater: {
          ...prev.heater,
          loading: false
        }
      }));

      setAlertDetail({
        show: true,
        message: '取消連線過程發生錯誤',
        type: 'failure'
      });

    } finally {
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  // Heater設定(update)api
  const onHeaterSettingClick = async () => {
    if (!isHeaterOpenState) {
      setAlertDetail({
        show: true,
        message: '請先連接Heater控制器',
        type: 'failure'
      });
      return;
    }

    setIsHeaterLoading(true);

    try {
      const setSvValue = () => {
        if ((Number(heaterDetailState?.decimal_point) === 1 && Number(heaterInputList?.decimal_point) === 0)) {
          return Number(heaterDetail?.SV*0.1);
        } else if (Number(heaterDetailState?.decimal_point) === 0 && Number(heaterInputList?.decimal_point) === 1) {
          return Number(heaterDetail?.SV*10);
        }  else {
          return  Number(heaterDetail?.SV);
        }
      };

      const response = await getApi('/heater/update', 'POST', {
        ...heaterInputList,
        SV: setSvValue()
      });

      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: 'Heater設定更新成功',
          type: 'success'
        });

        // 更新狀態
        const statusResponse = await getApi('/heater/status', 'GET');
        if (statusResponse?.data?.status === 'success') {
          setHeaterDetail(statusResponse.data.data);
          setHeaterDetailState(statusResponse.data.data);
        }
      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: response?.data?.message || 'Heater設定更新失敗',
          type: 'failure'
        });
      }
    } catch (error) {
      console.error('Heater設定更新失敗:', error);
      setAlertDetail({
        show: true,
        message: error.message || 'Heater設定更新失敗',
        type: 'failure'
      });
    } finally {
      setIsHeaterLoading(false);
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 3000);
    }
  };

  // ----------------單獨連線的function (onChange, onClick)---------------------------------
  const onConnectPortChange = (deviceId, value) => {
    const newDevices = { ...devices };
    newDevices[deviceId] = {
      ...newDevices[deviceId],
      port: value
    };
    setDevices(newDevices);
  };

  const onConnectAddressChange = (deviceId, value) => {
    const newDevices = { ...devices };
    newDevices[deviceId] = {
      ...newDevices[deviceId],
      address: value
    };
    setDevices(newDevices);
  };

  const onConnectClick = async (deviceId) => {
    if (devices[deviceId]?.loading) return;
    
    if (devices[deviceId]?.connected) {
      switch (deviceId) {
        case 'mainGas':
          await disconnectMainGasApi(devices[deviceId], deviceId);
          break;
        case 'carrierGas':
          await disconnectCarrierGasApi(devices[deviceId], deviceId);
          break;
        case 'co2Laser':
          await disconnectCo2LaserApi(devices[deviceId]);
          break;
        case 'heater':
          await disconnectHeaterApi(devices[deviceId]);
          break;
        default:
          break;
      };
      return;
    };

    if (!devices[deviceId]) {
      setAlertDetail({
        show: true,
        message: '請輸入Port及Address',
        type: 'failure'
      });

      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 3000);
      return;
    }

    const data = {
      port: devices[deviceId].port,
      address: devices[deviceId].address
    };

    switch (deviceId) {
      case 'co2Laser':
        if (!data.port) {
          setAlertDetail({
            show: true,
            message: 'Port尚未輸入',
            type: 'failure'
          });
  
          setTimeout(() => {
            setAlertDetail((prev) => ({ ...prev, show: false }));
          }, 3000);
          return;
        }
        break;
      default:
        if (!data.port || !data.address) {
          setAlertDetail({
            show: true,
            message: 'Port或Address尚未輸入',
            type: 'failure'
          });
    
          setTimeout(() => {
            setAlertDetail((prev) => ({ ...prev, show: false }));
          }, 3000);
          return;
        }
        break;
    }

    switch (deviceId) {
      case 'mainGas':
        await connectMainGasApi(data, deviceId);
        break;
      case 'carrierGas':
        await connectCarrierGasApi(data, deviceId);
        break;
      case 'co2Laser':
        await connectCo2LaserApi(data);
        break;
      case 'heater':
        await connectHeaterApi(data);
        break;
      default:
        break;
    }
  };

  // 關閉Alert
  const onAlertClose = () => {
    setAlertDetail((prev) => ({ ...prev, show: false }));
  };
  // -----------------------------------------------------------------------

  // ----------------------------載氣設定的function----------------------------
  // 取得載氣氣體種類的Click事件
  const onGetCarrierGasTypeClick = () => {
    if (carrierGasTypeListLoading) return;
    if (carrierGasTypeList?.length > 0) {
      // 如果有資料，就換成修改模式
      setCarrierGasGasTypeApi(carrierGasTypeSetting);
    } else {
      getCarrierGasAllGasTypeApi();
    }
  };

  // 按下修改氣體種類的Click事件
  const onSetCarrierGasGasTypeClick = (data) => {
    setCarrierGasTypeSetting(data);
  };

  // 選擇混合氣體的Click事件
  const onCarrierGasMixGasClick = (data) => {
      setCarrierGasMixGas(data);
    };

  // 刪除載氣混合氣體的Click事件
  const onDeleteCarrierGasGasTypeClick = (number) => {
    deleteCarrierGasGasTypeApi(number);
  };

  // 新增載氣混合氣體的input change事件
  const onCarrierGasCreateMixGasChange = (value, flag) => {
    setCarrierGasCreateMixGas(prev => ({
      ...prev,
      [flag]: value
    }));
  };

  // 新增載氣混合氣體的Click事件
  const onCarrierGasCreateMixGasClick = () => {
    addCarrierGasGasTypeApi();
  };

  // 修改主氣input/select的t事件
  const onMainGasChangeClick = (value, flag) => {
    setMainGasSelectOrChangeList(prev => ({
      ...prev,
      [flag]: value
    }));
  };

  // 主氣設定的Click事件
  const onMainGasSettingClick = async (data) => {
    await setMainGasSettingApi(data);
  };

  // 從 localStorage 取得主氣是否開啟，如果開啟則取得主氣資料
  React.useEffect(() => {
    if (isMainGasOpenState) {
      setDevices(prev => ({
        ...prev,
        mainGas: {
          ...prev.mainGas,
          connected: true
        }
      }));
  
      getMainGasDataApi();
  
    } else {
      setDevices(prev => ({
        ...prev,
        mainGas: {
          ...prev.mainGas,
          connected: false
        }
      }));
    }
  }, [isMainGasOpenState, getMainGasDataApi]);

  // 從 localStorage 取得主氣的Port及Address
  React.useEffect(() => {
    if (mainGasPortAndAddressState?.port && mainGasPortAndAddressState?.address) {
      setDevices(prev => ({
        ...prev,
        mainGas: {
          ...prev.mainGas,
          port: mainGasPortAndAddressState.port,
          address: mainGasPortAndAddressState.address
        }
      }));
    }
  }, [mainGasPortAndAddressState]);

  // 從 localStorage 取得載氣是否開啟，如果開啟則取得載氣資料
  React.useEffect(() => {
    if (isCarrierGasOpenState) {
      setDevices(prev => ({
        ...prev,
        carrierGas: {
          ...prev.carrierGas,
          connected: true
        }
      }));
  
      getCarrierGasDataApi();
  
    } else {
      setDevices(prev => ({
        ...prev,
        carrierGas: {
          ...prev.carrierGas,
          connected: false
        }
      }));
    }
  }, [isCarrierGasOpenState, getCarrierGasDataApi]);

  // 更新onchange carrierGas select or change
  React.useEffect(() => {
    if (carrierGasDetail) {
      setCarrierGasCreateMixGas({
        number: carrierGasDetail.mix_no || 0,
        name: carrierGasDetail.name || '',
        gases: carrierGasDetail.gases || []
      });
    }
  }, [carrierGasDetail]);

  // 從 localStorage 取得載氣的Port及Address
  React.useEffect(() => {
    if (carrierGasPortandAddressState?.port && carrierGasPortandAddressState?.address) {
      setDevices(prev => ({
        ...prev,
        carrierGas: {
          ...prev.carrierGas,
          port: carrierGasPortandAddressState.port,
          address: carrierGasPortandAddressState.address
        }
      }));
    }
  }, [carrierGasPortandAddressState]);

  // ----------------------------載氣設定的function----------------------------
  
  // ---------------------------------co2 co2Laser function---------------------------------
  // onchange co2 co2Laser select or change
  const onChangeCo2SelectOrChange = (value, flag) => {
    setCo2SelectOrChangeList(prev => ({
      ...prev,
      [flag]: value
    }));
  };

  // 更新onchange co2 co2Laser select or change
  React.useEffect(() => {
    if (co2LaserDetail) {
      setCo2SelectOrChangeList({
        mode: "remote",
        pwmFreq: co2LaserDetail.pwm_freq || 0,
        maxPwm: co2LaserDetail.max_pwm_95 || false,
        laserOnPowerUp: co2LaserDetail.lase_on_powerup || false,
        gatePullUp: co2LaserDetail.gate_pull_up || false
      });
    }
  }, [co2LaserDetail]);
  
  // 從 localStorage 取得co2的port
  React.useEffect(() => {
    if (co2LaserPortState?.port) {
      setDevices(prev => ({
        ...prev,
        co2Laser: {
          ...prev.co2Laser,
          port: co2LaserPortState.port
        }
      }));
    }

    if (isCo2LaserOpenState) {
      setDevices(prev => ({
        ...prev,
        co2Laser: {
          ...prev.co2Laser,
          connected: true
        }
      }));

      getCo2LaserDataApi();
    } else {
      setDevices(prev => ({
        ...prev,
        co2Laser: {
          ...prev.co2Laser,
          connected: false
        }
      }));
    }
  }, [co2LaserPortState, isCo2LaserOpenState, getCo2LaserDataApi]);
  // ---------------------------------co2 co2Laser function---------------------------------

  // ---------------------------------heater function---------------------------------
  // onChange heater input
  const onHeaterInputChange = (value, flag) => {
    if (flag === 'M' || flag === 'decimal_point') {
      setHeaterInputList(prev => ({
        ...prev,
        [flag]: value ? 0 : 1
      }));
      return;
    }

    setHeaterInputList(prev => ({
      ...prev,
      [flag]: value
    }));
  };

  // 更新heater input
  React.useEffect(() => {
    if (heaterDetailState) {
      setHeaterInputList({
        SV2: heaterDetailState.SV2 || 0,
        SLH: heaterDetailState.SLH || 0,
        rAP: heaterDetailState.rAP || 0,
        Gain: heaterDetailState.Gain || 0.0,
        P: heaterDetailState.P || 0,
        I: heaterDetailState.I || 0,
        D: heaterDetailState.D || 0,
        M: heaterDetailState.M || 0,
        decimal_point: heaterDetailState.decimal_point || 0
      });
    }
  }, [heaterDetailState]);

  // 從 localStorage 取得heater是否開啟，如果開啟則取得heater資料
  React.useEffect(() => {
    if (isHeaterOpenState) {
      setDevices(prev => ({
        ...prev,
        heater: {
          ...prev.heater,
          connected: true
        }
      }));
  
      getHeaterDataApi();
  
    } else {
      setDevices(prev => ({
        ...prev,
        heater: {
          ...prev.heater,
          connected: false
        }
      }));
    }
  }, [isHeaterOpenState, getHeaterDataApi]);

  // 從 localStorage 取得heater的Port及Address
  React.useEffect(() => {
    if (heaterPortAndAddressState?.port && heaterPortAndAddressState?.address) {
      setDevices(prev => ({
        ...prev,
        heater: {
          ...prev.heater,
          port: heaterPortAndAddressState.port,
          address: heaterPortAndAddressState.address
        }
      }));
    }
  }, [heaterPortAndAddressState]);

  // ---------------------------------heater function---------------------------------

  return {
    devices,
    alertDetail,
    deviceList,
    isMainGasOpenState,
    mainGasSelectOrChangeList,
    isMainGasLoading,
    carrierGasDetail,
    carrierGasTypeListLoading,
    carrierGasTypeList,
    carrierGasCreateMixGas,
    carrierGasTypeSetting,
    carrierGasMixGas,
    isCarrierGasOpenState,
    co2SelectOrChangeList,
    co2LaserDetail,
    isCo2LaserOpenState,
    isCo2LaserLoading,
    heaterDetail,
    isHeaterOpenState,
    isHeaterLoading,
    heaterInputList,
    onAlertClose,
    onConnectPortChange,
    onConnectAddressChange,
    onConnectClick,
    onGetCarrierGasTypeClick,
    onSetCarrierGasGasTypeClick,
    onCarrierGasMixGasClick,
    onCarrierGasCreateMixGasChange,
    onCarrierGasCreateMixGasClick,
    onDeleteCarrierGasGasTypeClick,
    onChangeCo2SelectOrChange,
    onCo2LaserSettingClick,
    onHeaterSettingClick,
    onHeaterInputChange,
    onMainGasChangeClick,
    onMainGasSettingClick
  };
};

const MfcLaserSetting = () => {
  const {
    devices, alertDetail, deviceList, isMainGasOpenState, mainGasSelectOrChangeList, isMainGasLoading,
    carrierGasDetail, carrierGasTypeListLoading, carrierGasTypeList, carrierGasCreateMixGas, isCarrierGasOpenState,
    carrierGasTypeSetting, carrierGasMixGas, co2SelectOrChangeList, co2LaserDetail, isCo2LaserOpenState, isCo2LaserLoading,
    heaterDetail, isHeaterOpenState, isHeaterLoading, heaterInputList,
    onAlertClose, onConnectPortChange, onConnectAddressChange, onConnectClick, onGetCarrierGasTypeClick, onSetCarrierGasGasTypeClick,
    onCarrierGasMixGasClick, onCarrierGasCreateMixGasChange, onCarrierGasCreateMixGasClick, onDeleteCarrierGasGasTypeClick, onChangeCo2SelectOrChange,
    onCo2LaserSettingClick, onHeaterInputChange, onHeaterSettingClick, onMainGasChangeClick, onMainGasSettingClick
  } = useHooks();

  return (
    <div className="min-h-allView p-4 bg-gray-200">
      <AlertComponent
        show={alertDetail.show}
        message={alertDetail.message}
        onClose={onAlertClose}
        type={alertDetail.type}
      />
      <h1 className="text-2xl font-bold text-center mb-5">MFC及雷射細部控制介面</h1>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {
          deviceList.map((device) => {
            const CommonComponent = () => (
              <div key={device.deviceId} className="bg-white shadow-md rounded-lg p-4">
                <h2 className="text-lg font-semibold mb-1">One Device Connect:</h2>
                <h2 className="text-lg font-semibold mb-3 text-blue-500">{device.title}</h2>
                <SingleConnectComponent
                  company={device.company}
                  deviceId={device.deviceId}
                  onClick={onConnectClick}
                  onConnectPortChange={onConnectPortChange}
                  onConnectAddressChange={onConnectAddressChange}
                  devicesData={devices}
              />
              </div>
            );

            switch (device.deviceId) {
              case 'carrierGas':
                return (
                  <div
                    key={device.deviceId}
                    className="bg-white shadow-md rounded-lg p-4 flex flex-col justify-between"
                  >
                    <div className="bg-white shadow-md rounded-lg p-4 mb-2">
                      <h2 className="text-lg font-semibold mb-3">載氣流量控制 (Carrier gas Flow Control - Alicat)</h2>
                      <div className="space-y-4">
                        <div>
                          <div>
                            <label className="block font-medium mb-2">目前壓力 (Pressure)</label>
                            <input
                              type="number"
                              className="w-full border rounded-md p-2 bg-gray-50 mb-2"
                              placeholder="目前壓力數值"
                              value={Number(carrierGasDetail?.pressure || 0).toFixed(2)}
                              readOnly
                            />
                          </div>
                        </div>
                        <div className='border rounded-md p-2 border-blue-300'>
                          <label className="block font-medium mb-2">建立混合氣體種類 (Create mix gas)</label>
                          <div className='flex justify-between items-center mb-2'>
                            <span className='w-48'>設定編號</span>
                            <input
                              type="number"
                              min={236}
                              max={256}
                              className="w-full border rounded-md p-2"
                              placeholder="從236開始，請避免重複使用編號"
                              onChange={(e) => onCarrierGasCreateMixGasChange(Number(e.target.value), 'number')}
                              value={carrierGasCreateMixGas?.number}
                            />
                          </div><div className='flex justify-between items-center mb-2'>
                            <span className='w-48'>設定名稱</span>
                            <input
                              type="text"
                              className="w-full border rounded-md p-2"
                              placeholder="英文數字，6個字母內"
                              onChange={(e) => onCarrierGasCreateMixGasChange(e.target.value, 'name')}
                              value={carrierGasCreateMixGas?.name || ""}
                            />
                          </div>
                          <div className='flex justify-between items-center mb-2'>
                            <span className='w-48'>設定參數</span>
                            <input
                              type="text"
                              className="w-full border rounded-md p-2"
                              placeholder="總和為100, 請輸入ex: N2: 50, H2: 30, Ar: 20"
                              onChange={(e) => onCarrierGasCreateMixGasChange(e.target.value, 'gases')}
                              value={carrierGasCreateMixGas?.gases || ""}
                            />
                          </div>
                          <div className='flex justify-center items-center mb-2'>              
                            <button
                              className="w-72 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300 disabled:bg-gray-400"
                              onClick={onCarrierGasCreateMixGasClick}
                              disabled={carrierGasTypeListLoading || !isCarrierGasOpenState}
                            >
                              {
                                carrierGasTypeListLoading ? (
                                  <CommonLoading />
                                ) : (
                                  '新增混合氣體 (Create mix gas)'
                                )
                              }
                            </button>
                          </div>
                        </div>
                        <div className='border rounded-md p-2 border-red-300'>
                          <label className="block font-medium mb-2">混合氣體類型 (Mix Gas Type)</label>
                          <div>
                            {/* 混和氣體select */}
                            <select
                              className="w-full border rounded-md p-2"
                              onChange={(e) => onCarrierGasMixGasClick(Number(e.target.value))}
                              value={carrierGasMixGas}
                            >
                              {carrierGasTypeList?.length > 0 ? (
                                carrierGasTypeList.map(option => {
                                  const labelSplit = option.label.split('_');

                                  if (labelSplit.length > 1) {
                                    return (
                                      <option
                                        key={option.value}
                                        value={option.value}
                                      >
                                        {option.label}
                                      </option>
                                    );
                                  }
                                  return null;
                                })) : (
                                  <option value="">No data</option>
                                )
                              }
                            </select>
                          </div>
                          <div className='flex justify-center items-center mb-2 mt-2'>
                            <button
                              className="w-72 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300 disabled:bg-gray-400"
                              onClick={() => onDeleteCarrierGasGasTypeClick(carrierGasMixGas)}
                              disabled={carrierGasTypeListLoading || !isCarrierGasOpenState}
                            >
                              {
                                carrierGasTypeListLoading ? (
                                  <CommonLoading />
                                ) : (
                                  '刪除混合氣體 (Delete mix gas)'
                                )
                              }
                            </button>
                          </div>
                          <p
                            className="text-sm text-red-500"
                          >
                            如果沒有選項，請先按下方的取得氣體種類(Get Gas type)，再選擇混合氣體
                          </p>
                        </div>
                        <div className='border rounded-md p-2 border-blue-300'>
                          <label className="block font-medium mb-2">全部氣體類型 (Gas Type)</label>
                          <select
                            className="w-full border rounded-md p-2 mb-2"
                            onChange={(e) => onSetCarrierGasGasTypeClick(e.target.value)}
                            value={carrierGasTypeSetting} 
                          >
                            {carrierGasTypeList?.length > 0 ? (
                              carrierGasTypeList.map(option => (
                                <option
                                  key={option.value}
                                  value={option?.label?.split("_")?.length > 0 ? option?.label?.split("_")[1] : option.value}
                                >
                                  {option.label}
                                </option>
                              ))) : (
                                <option value="">No data</option>
                              )
                            }
                          </select>
                          <div className='flex justify-center items-center mb-2'>
                            <button
                              className="w-72 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300 disabled:bg-gray-400"
                              onClick={onGetCarrierGasTypeClick}
                              disabled={carrierGasTypeListLoading || !isCarrierGasOpenState}
                            >
                              {
                                carrierGasTypeListLoading ? (
                                  <CommonLoading />
                                ) : (
                                  carrierGasTypeList?.length > 0 ? '氣體調整 (Gas Setting)' : '取得氣體種類 (Get gas type)'
                                )
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    <CommonComponent />
                  </div>
                );
              case 'co2Laser':
                return (
                    <div
                      key={device.deviceId}
                      className="bg-white shadow-md rounded-lg p-4 flex flex-col justify-between"
                    >
                      <div className="bg-white shadow-md rounded-lg p-4 flex flex-col justify-between mb-2">
                        <div>
                          <h2 className="text-lg font-semibold mb-3">雷射控制 (Laser Control)</h2>
                          <div className="space-y-4">
                            <div>
                              <label className="block font-medium font-semibold text-red-400">控制模式 - 目前不給調整 (調整有崩潰風險)</label>
                              <select
                                className="w-full border rounded-md p-2 bg-gray-50"
                                value="remote"
                                readOnly
                              >
                                {
                                  !isCo2LaserOpenState && (
                                    <option value="">None</option>
                                  )
                                }
                                <option value="manual">Manual</option>
                                <option value="anc">ANC (Analog Current)</option>
                                <option value="anv">ANV (Analog Voltage)</option>
                                <option value="manual_closed">Manual Closed (Can not Remote)</option>
                                <option value="anv_closed">ANV Closed</option>
                                <option value="remote">Remote</option>
                              </select>
                            </div>
                            <div>
                              <label className="block font-medium">頻率 PWM (kHz)</label>
                              <select
                                className="w-full border rounded-md p-2"
                                onChange={(e) => onChangeCo2SelectOrChange(Number(e.target.value), 'pwmFreq')}
                                value={co2SelectOrChangeList?.pwmFreq}
                              >
                                {
                                  !isCo2LaserOpenState && (
                                    <option value={0}>None</option>
                                  )
                                }
                                <option value={5}>5</option>
                                <option value={10}>10</option>
                                <option value={20}>20</option>
                              </select>
                            </div>
                            <div>
                              <label className="block font-medium">控制器版本</label>
                              <input
                                type="text"
                                className="w-full border rounded-md p-2 bg-gray-50"
                                placeholder="控制器版本"
                                readOnly
                                value={co2LaserDetail?.version || 0}
                              />
                            </div>
                            <div
                              className="grid grid-cols-2 gap-4 mt-2 md:grid-cols-1"
                            >
                              <ToggleSwitch
                                className='mr-2'
                                label="PWM最高百分比限制 (開啟: 95% / 關閉: 99%)"
                                onChange={(e) => onChangeCo2SelectOrChange(e, 'maxPwm')}
                                checked={co2SelectOrChangeList?.maxPwm}
                              />
                              <ToggleSwitch
                                className='mr-2'
                                label="開啟時自動開啟雷射"
                                onChange={(e) => onChangeCo2SelectOrChange(e, 'laserOnPowerUp')}
                                checked={co2SelectOrChangeList?.laserOnPowerUp}
                              />
                              <ToggleSwitch
                                label="電位開啟(Gate Pull up)"
                                onChange={(e) => onChangeCo2SelectOrChange(e, 'gatePullUp')}
                                checked={co2SelectOrChangeList?.gatePullUp}
                              />
                            </div>
                          </div>
                        </div>
                        <div className='flex justify-center items-center mb-2 mt-2'>
                          <button 
                            className="w-72 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300 disabled:bg-gray-400"
                            onClick={onCo2LaserSettingClick}
                            disabled={isCo2LaserLoading || !isCo2LaserOpenState}
                          >
                            {isCo2LaserLoading ? (
                              <CommonLoading />
                            ) : (
                              '設定 (Setting)'
                            )}
                          </button>
                        </div>
                      </div>
                      <CommonComponent />
                    </div>
                  );
                case 'mainGas':
                  return (
                    <div
                      key={device.deviceId}
                      className="shadow-md rounded-lg p-4 flex flex-col justify-between bg-white md:col-span-2"
                    >
                      <div className="shadow-md rounded-lg p-4 mb-2">
                        <h2 className="text-lg font-semibold mb-3">主氣流量控制 (Main gas Flow Control - Azbil)</h2>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                          <div>
                            <div>
                              <label className="block font-medium mb-2">氣體類型</label>
                              <select
                                className="w-full border rounded-md p-2 mb-2 disabled:bg-gray-200"
                                onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'gasType')}
                                value={mainGasSelectOrChangeList?.gasType}
                                disabled={!isMainGasOpenState || isMainGasLoading}
                              >
                                <option value={1}>Air/N2</option>
                                <option value={2}>O2</option>
                                <option value={3}>Ar</option>
                                <option value={4}>CO2</option>
                                <option value={6}>丙烷100%</option>
                                <option value={7}>甲烷100%</option>
                                <option value={8}>丁烷100%</option>
                                <option value={11}>城市煤氣13A</option>
                              </select>
                            </div>
                            <div>
                              <label className="block font-medium mb-2">流量控制模式</label>
                              <select
                                className="w-full border rounded-md p-2 mb-2 disabled:bg-gray-200"
                                onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'flowControlSetting')}
                                value={mainGasSelectOrChangeList?.flowControlSetting || 0}
                                disabled={!isMainGasOpenState || isMainGasLoading}
                              >
                                <option value={0}>透過設定SP0~7</option>
                                <option value={1}>模擬設定</option>
                                <option value={2}>直接調整流量值</option>
                              </select>
                              {
                                mainGasSelectOrChangeList?.flowControlSetting === 0 && (
                                  <div>
                                    <label className="block font-medium mb-2">SP No 設定值</label>
                                    <select
                                      className="w-full border rounded-md p-2 mb-2 disabled:bg-gray-200"
                                      onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'spNoSetting')}
                                      value={mainGasSelectOrChangeList?.spNoSetting || 0}
                                      disabled={!isMainGasOpenState || isMainGasLoading}
                                    >
                                      <option value={0}>SP 0</option>
                                      <option value={1}>SP 1</option>
                                      <option value={2}>SP 2</option>
                                      <option value={3}>SP 3</option>
                                      <option value={4}>SP 4</option>
                                      <option value={5}>SP 5</option>
                                      <option value={6}>SP 6</option>
                                      <option value={7}>SP 7</option>
                                    </select>
                                    <label className="block font-medium mb-2">SP{mainGasSelectOrChangeList?.spNoSetting || 0} 設定值</label>
                                    <input
                                      type="number"
                                      className="w-full border rounded-md p-2 mb-2 disabled:bg-gray-200"
                                      onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'sp' + mainGasSelectOrChangeList?.spNoSetting + 'Setting')}
                                      value={mainGasSelectOrChangeList["sp" + mainGasSelectOrChangeList?.spNoSetting + "Setting"] || ''}
                                      disabled={!isMainGasOpenState || isMainGasLoading}
                                    />
                                  </div>
                                )
                              }
                              {
                                mainGasSelectOrChangeList?.flowControlSetting === 2 && (
                                  <div>
                                    <label className="block font-medium mb-2">目前流量設定值 (SV)</label>
                                    <input
                                      type="number"
                                      className="w-full border rounded-md p-2 bg-gray-50 mb-2"
                                      value={mainGasSelectOrChangeList?.settingSpFlow || 0.000}
                                      readOnly
                                    />
                                    <label className="block font-medium mb-2">目前流量值 (PV)</label>
                                    <input
                                      type="number"
                                      className="w-full border rounded-md p-2 bg-gray-50 mb-2"
                                      value={mainGasSelectOrChangeList?.pvFlow || 0}
                                      readOnly
                                    />
                                  </div>
                                )
                              }
                              <div>
                                <label className="block font-medium mb-2">流量單位</label>
                                <select
                                  className="w-full border rounded-md p-2 mb-2 disabled:bg-gray-200"
                                  onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'flowUnit')}
                                  value={mainGasSelectOrChangeList?.flowUnit || 0}
                                  disabled={!isMainGasOpenState || isMainGasLoading}
                                >
                                  <option value={0}>mL/min</option>
                                  <option value={1}>L/min</option>
                                  <option value={2}>m^3/h</option>
                                </select>
                                <label className="block font-medium mb-2">流量小數點</label>
                                <select
                                  className="w-full border rounded-md p-2 mb-2 disabled:bg-gray-200"
                                  onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'flowDecimal')}
                                  value={mainGasSelectOrChangeList?.flowDecimal || 0}
                                  disabled={!isMainGasOpenState || isMainGasLoading}
                                >
                                  <option value={0}>0</option>
                                  <option value={1}>1</option>
                                  <option value={2}>2</option>
                                  <option value={3}>3</option>
                                </select>
                              </div>
                              <div>
                                <label className="block font-medium mb-2">累計流量單位</label>
                                <select
                                  className="w-full border rounded-md p-2 mb-2 disabled:bg-gray-200"
                                  onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'totalFlowUnit')}
                                  value={mainGasSelectOrChangeList?.totalFlowUnit || 0}
                                  disabled={!isMainGasOpenState || isMainGasLoading}
                                >
                                  <option value={0}>mL</option>
                                  <option value={1}>L</option>
                                  <option value={2}>m^3</option>
                                </select>
                                <label className="block font-medium mb-2">累計流量小數點</label>
                                <select
                                  className="w-full border rounded-md p-2 disabled:bg-gray-200"
                                  onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'totalFlowDecimal')}
                                  value={mainGasSelectOrChangeList?.totalFlowDecimal || 0}
                                  disabled={!isMainGasOpenState || isMainGasLoading}
                                >
                                  <option value={0}>0</option>
                                  <option value={1}>1</option>
                                  <option value={2}>2</option>
                                  <option value={3}>3</option>
                                </select>
                              </div>
                            </div>
                          </div>
                          <div>
                            <div>
                              <label className="block font-medium mb-2">鍵盤鎖定 (Key Lock)</label>
                              <select
                                className="w-full border rounded-md p-2 mb-2 disabled:bg-gray-200"
                                onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'keyLock')}
                                value={mainGasSelectOrChangeList?.keyLock || 0}
                                disabled={!isMainGasOpenState || isMainGasLoading}
                              >
                                <option value={0}>無鎖定</option>
                                <option value={1}>特定按鍵鎖定</option>
                                <option value={2}>全部按鍵鎖定</option>
                              </select>
                              <label className="block font-medium mb-2">設備安裝方向 (Device Install Direction)</label>
                              <select
                                className="w-full border rounded-md p-2 mb-2 disabled:bg-gray-200"
                                onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'deviceInstallDir')}
                                value={mainGasSelectOrChangeList?.deviceInstallDir || 0}
                                disabled={!isMainGasOpenState || isMainGasLoading}
                              >
                                <option value={0}>水平</option>
                                <option value={1}>垂直向上</option>
                                <option value={2}>垂直向下</option>
                              </select>
                              <label className="block font-medium mb-2">按鍵方向 (Key Direction)</label>
                              <select
                                className="w-full border rounded-md p-2 mb-2 disabled:bg-gray-200"
                                onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'keyDirection')}
                                value={mainGasSelectOrChangeList?.keyDirection || 0}
                                disabled={!isMainGasOpenState || isMainGasLoading}
                              >
                                <option value={0}>LED: 左 KEY: 右</option>
                                <option value={1}>LED: 下 KEY: 上</option>
                                <option value={2}>LED: 上 KEY: 下</option>
                                <option value={3}>LED: 右 KEY: 左</option>
                              </select>
                            </div>
                            <div>
                              <label className="block font-medium mb-2">流量顯示上限設定 (Flow Limit)</label>
                              <select
                                className="w-full border rounded-md p-2 mb-2 disabled:bg-gray-200"
                                onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'flowLimit')}
                                value={mainGasSelectOrChangeList?.flowLimit || 0}
                                disabled={!isMainGasOpenState || isMainGasLoading}
                              >
                                <option value={0}>無效</option>
                                <option value={1}>僅上限</option>
                                <option value={2}>僅下限</option>
                                <option value={3}>上下限皆成立</option>
                              </select>
                              <label className="block font-medium mb-2">閘閥異常時動作 (Gate Error Fix)</label>
                              <select
                                className="w-full border rounded-md p-2 mb-2 disabled:bg-gray-200"
                                onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'gateErrorFix')}
                                value={mainGasSelectOrChangeList?.gateErrorFix || 0}
                                disabled={!isMainGasOpenState || isMainGasLoading}
                              >
                                <option value={1}>無變化</option>
                                <option value={2}>強制全關</option>
                                <option value={3}>強制全開</option>
                              </select>
                              <label className="block font-medium mb-2">流量初始溫度設定 (Flow Initial Temp)</label>
                              <select
                                className="w-full border rounded-md p-2 mb-2 disabled:bg-gray-200"
                                onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'flowInitialTemp')}
                                value={mainGasSelectOrChangeList?.flowInitialTemp || 0}
                                disabled={!isMainGasOpenState || isMainGasLoading}
                              >
                                <option value={0}>20</option>
                                <option value={1}>0</option>
                                <option value={2}>25</option>
                                <option value={3}>35</option>
                              </select>
                              <label className="block font-medium mb-2">流量輸入上限設定 (Flow Input Limit)</label>
                              <select
                                className="w-full border rounded-md p-2 mb-2 disabled:bg-gray-200"
                                onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'flowInputLimit')}
                                value={mainGasSelectOrChangeList?.flowInputLimit || 0}
                                disabled={!isMainGasOpenState || isMainGasLoading}
                              >
                                <option value={0}>無效</option>
                                <option value={1}>僅上限</option>
                                <option value={2}>僅下限</option>
                                <option value={3}>上下限皆有</option>
                              </select>
                              <label className="block font-medium mb-2">流量感測器類型設定 (Flow Sensor Type)</label>
                              <select
                                className="w-full border rounded-md p-2 mb-2 disabled:bg-gray-200"
                                onChange={(e) => onMainGasChangeClick(Number(e.target.value), 'flowSensorType')}
                                value={mainGasSelectOrChangeList?.flowSensorType || 0}
                                disabled={!isMainGasOpenState || isMainGasLoading}
                              >
                                <option value={0}>快速</option>
                                <option value={1}>標準</option>
                                <option value={2}>穩定優先</option>
                                <option value={3}>自訂PID</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <div className='flex justify-center items-center mb-2 mt-2'>
                          <button 
                            className="w-72 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300 disabled:bg-gray-400"
                            onClick={() => onMainGasSettingClick(mainGasSelectOrChangeList)}
                            disabled={isMainGasLoading || !isMainGasOpenState}
                          >
                            {isMainGasLoading ? (
                              <CommonLoading />
                            ) : (
                              '設定 (Setting)'
                            )}
                        </button>
                        </div>
                      </div>
                      <CommonComponent />
                    </div>
                  );
              case 'heater':
                return (
                  <div
                    key={device.deviceId}
                    className="bg-white shadow-md rounded-lg p-4 flex flex-col justify-between"
                  >
                    <div className="bg-white shadow-md rounded-lg p-4 flex flex-col justify-between mb-2">
                      <div>
                        <h2 className="text-lg font-semibold mb-3">加熱控制器 (Heater)</h2>
                        <div className="space-y-4">
                          <div>
                            <label className="block font-medium mb-2">目前控制器溫度 (Temperature)</label>
                            <input
                              type="number"
                              className="w-full border rounded-md p-2 bg-gray-50"
                              placeholder="目前溫度數值"
                              value={Number(heaterDetail?.PV || 0).toFixed(1)}
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block font-medium mb-2">目前控制器設定溫度 (Set Temperature)</label>
                            <input
                              type="number"
                              className="w-full border rounded-md p-2 bg-gray-50"
                              placeholder="目前設定溫度數值"
                              value={Number(heaterDetail?.decimal_point) === 1 ? Number(heaterDetail?.SV*0.1 || 0).toFixed(1) : Number(heaterDetail?.SV || 0).toFixed(1)}
                              readOnly
                            />
                          </div>
                          <div>
                            <label className="block font-medium mb-2">緩啟動設定值 (SV 2)</label>
                            <p
                              className='text-sm text-red-500 mb-2'
                            >
                              緩啟動設定: 在達到此溫度以前，溫度會快速上升，超過此溫度後會緩慢上升。
                            </p>
                            <input
                              type="number"
                              className="w-full border rounded-md p-2"
                              placeholder="範圍 -9999~9999"
                              value={heaterInputList?.SV2}
                              onChange={(e) => onHeaterInputChange(Number(e.target.value), 'SV2')}
                            />
                          </div>
                          <div>
                            <label className="block font-medium mb-2">最高溫度上限 (Set Limit High)</label>
                            <input
                              type="number"
                              className="w-full border rounded-md p-2"
                              placeholder="範圍 -9999~9999"
                              value={heaterInputList?.SLH}
                              onChange={(e) => onHeaterInputChange(Number(e.target.value), 'SLH')}
                            />
                          </div>
                          <div>
                            <label className="block font-medium mb-2">升溫速率控制 (°C/min) (Ramp Control)</label>
                            <input
                              type="number"
                              className="w-full border rounded-md p-2"
                              placeholder="範圍 0~9999"
                              value={heaterInputList?.rAP}
                              onChange={(e) => onHeaterInputChange(Number(e.target.value), 'rAP')}
                            />
                          </div>
                          <div>
                            <h3
                              className="text-lg font-semibold mb-3"
                            >
                              PID控制相關
                            </h3>
                            <label className="block font-medium mb-2">增益值 (Gain)</label>
                            <input
                              type="number"
                              className="w-full border rounded-md p-2 mb-2"
                              placeholder="範圍 0.0~9.9"
                              value={heaterInputList?.Gain}
                              step={0.1}
                              onChange={(e) => onHeaterInputChange(Number(e.target.value), 'Gain')}
                            />
                            <label className="block font-medium mb-2">比例參數 (Proportional Band)</label>
                            <input
                              type="number"
                              className="w-full border rounded-md p-2 mb-2"
                              placeholder="範圍 0~3999"
                              value={heaterInputList?.P}
                              onChange={(e) => onHeaterInputChange(Number(e.target.value), 'P')}
                            />
                            <label className="block font-medium mb-2">積分值 (Integral)</label>
                            <input
                              type="number"
                              className="w-full border rounded-md p-2 mb-2"
                              placeholder="範圍 0~3999"
                              value={heaterInputList?.I}
                              onChange={(e) => onHeaterInputChange(Number(e.target.value), 'I')}
                            />
                            <label className="block font-medium mb-2">微分值 (Derivative)</label>
                            <input
                              type="number"
                              className="w-full border rounded-md p-2 mb-2"
                              placeholder="範圍 0~3999"
                              value={heaterInputList?.D}
                              onChange={(e) => onHeaterInputChange(Number(e.target.value), 'D')}
                            />
                            <ToggleSwitch
                              className='mr-2 mb-2'
                              label="SV小數點設定 (開: 整數, 關: 小數點後一位)"
                              onChange={(e) => onHeaterInputChange(e, 'decimal_point')}
                              checked={Number(heaterInputList?.decimal_point) === 0}
                            />
                            <ToggleSwitch
                              className='mr-2'
                              label="PID控制開關 (Auto/Manual)"
                              onChange={(e) => onHeaterInputChange(e, 'M')}
                              checked={Number(heaterInputList?.M) === 0}
                            />
                          </div>
                        </div>
                      </div>
                      <div className='flex justify-center items-center mb-2 mt-2'>
                        <button 
                          className="w-72 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300 disabled:bg-gray-400"
                          onClick={onHeaterSettingClick}
                          disabled={isHeaterLoading || !isHeaterOpenState}
                        >
                          {isHeaterLoading ? (
                            <CommonLoading />
                          ) : (
                            '設定 (Setting)'
                          )}
                        </button>
                      </div>
                    </div>
                    <CommonComponent />
                  </div>
                );
              default:
                return null;
            }
          }
        )}
      </div>
    </div>
  );
};

export default MfcLaserSetting;