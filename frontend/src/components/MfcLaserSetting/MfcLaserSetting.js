import React from 'react'
import AlertComponent from '../ComponentTools/Alert';
import CommonLoading from '../Loading/CommonLoading';
import { getApi } from '../../utils/getApi';
import { useAlicatContext } from '../../Contexts/AlicatContext';

// 將 SingleConnectComponent 改為獨立的函數組件
const SingleConnectComponent = React.memo(({ title, company, deviceId, onClick, onConnectPortChange, onConnectAddressChange, devicesData }) => {
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
    onConnectPortChange(deviceId, value);
  };

  const handleAddressBlur = (deviceId, value) => {
    onConnectAddressChange(deviceId, value);
  };

  return (
    <div className='border rounded-md p-2 border-green-300 mb-2'>
      <h3 className="font-semibold mb-3">{title}</h3>
      <h3 className="font-semibold mb-3">廠牌: {company}</h3>
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
  const { isCarrierGasOpenState, setIsCarrierOpenState, setCarrierGasPortandAddressState, carrierGasPortandAddressState } = useAlicatContext();
  // 單獨連線的項目整合
  const deviceList = [{
    title: '載氣流量控制器 - Carrier Gas',
    company: 'Alicat',
    deviceId: 'carrierGas',
    port: '',
    address: ''
  }, {
    title: '主氣流量控制器 - Main Gas',
    company: 'Azbil',
    deviceId: 'mainGas',
    port: '',
    address: ''
  }, {
    title: '雷射控制器 - Laser',
    company: 'CO2 Laser',
    deviceId: 'laser',
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
  const [carrierGasDetail, setCarrierGasDetail] = React.useState({});
  const [carrierGasTypeList, setCarrierGasTypeList] = React.useState({});
  const [carrierGasTypeListLoading, setCarrierGasTypeListLoading] = React.useState(false);
  const [carrierGasTypeSetting, setCarrierGasTypeSetting] = React.useState({});
  const [alertDetail, setAlertDetail] = React.useState({});

  // -----------------------------api function--------------------------------
  // 取得載氣資料
  const getCarrierGasDataApi = async () => {
    const response = await getApi('/alicat_api/status', 'GET');
    if (response?.data?.status === 'success') {
      setCarrierGasDetail(response.data.data);
    } else {
      // 如果isCarrierGasOpenState為true，但是取得資料失敗，則強制將isCarrierGasOpenState設為false
      setIsCarrierOpenState(false);
      console.error(response?.data?.status);
    }
  };

  // 取得所有氣體種類
  const getCarrierGasAllGasTypeApi = async () => {
    setCarrierGasTypeListLoading(true);
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

      setAlertDetail({
        show: true,
        message: '取得資料成功',
        type: 'success'
      });

      setTimeout(() => {
        setAlertDetail({ show: false });
      }, 3000);
    } else {
      console.error(response?.data?.status);
      setCarrierGasTypeListLoading(false);

      setAlertDetail({
        show: true,
        message: '取得資料失敗，請勿連續點擊、同時使用其他功能、或是尚未連結MFC。',
        type: 'failure'
      });

      setTimeout(() => {
        setAlertDetail({ show: false });
      }, 3000);
    }
  };

  // 修改載氣氣體種類api
  const setCarrierGasGasTypeApi = async (data) => {
    try {
      const gasData = {
        gas: data
      };
      setCarrierGasTypeListLoading(true);
      const response = await getApi('/alicat_api/set_gas', 'POST', gasData);

      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: '載氣氣體修改成功',
          type: 'success'
        });
        setCarrierGasTypeListLoading(false);
      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: '載氣氣體修改失敗',
          type: 'failure'
        });

        setCarrierGasTypeListLoading(false);
      }

      setTimeout(() => {
        setAlertDetail({ show: false });
      }, 3000);

    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: '修改過程發生錯誤',
        type: 'failure'
      });

      setCarrierGasTypeListLoading(false);

      setTimeout(() => {
        setAlertDetail({ show: false });
      }, 3000);
    }
  };

  // 載氣設備連線api
  const connectDeviceApi = async (data, deviceId) => {
    try {
      setDevices(prev => ({
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          loading: true
        }
      }));
  
      const response = await getApi('/alicat_api/connect', 'POST', data);
  
      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: '連線成功',
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
          message: '連線失敗',
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
  
      setTimeout(() => {
        setAlertDetail({ show: false });
      }, 3000);
  
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
        setAlertDetail({ show: false });
      }, 3000);
    }
  };
  
  // 載氣設備取消連線api
  const disconnectDeviceApi = async (data, deviceId) => {
    try {
      setDevices(prev => ({
        ...prev,
        [deviceId]: {
          ...prev[deviceId],
          loading: true
        }
      }));
  
      const response = await getApi('/alicat_api/disconnect', 'POST', data);
  
      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: '已取消連線',
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
  
      setTimeout(() => {
        setAlertDetail({ show: false });
      }, 3000);
  
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
        setAlertDetail({ show: false });
      }, 3000);
    }
  };
  // -----------------------------------------------------------------------

  // 關閉Alert
  const onAlertClose = () => {
    setAlertDetail({
      show: false
    });
  };

  // 單獨連線的function (onChange, onClick)---------------------------------
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
      await disconnectDeviceApi(devices[deviceId], deviceId);

      return;
    };

    if (!devices[deviceId]) {
      setAlertDetail({
        show: true,
        message: '請輸入Port及Address',
        type: 'failure'
      });

      setTimeout(() => {
        setAlertDetail({
          show: false
        });
      }, 3000);
      return;
    }

    const data = {
      port: devices[deviceId].port,
      address: devices[deviceId].address
    };

    if (!data.port || !data.address) {
      setAlertDetail({
        show: true,
        message: 'Port或Address尚未輸入',
        type: 'failure'
      });

      setTimeout(() => {
        setAlertDetail({
          show: false
        });
      }, 3000);
      return;
    }

    await connectDeviceApi(data, deviceId);
  };
  // -----------------------------------------------------------------------

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
    console.log(data);
  };

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
    }
  }, [isCarrierGasOpenState]);

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

  return {
    devices,
    carrierGasDetail,
    alertDetail,
    deviceList,
    carrierGasTypeListLoading,
    carrierGasTypeList,
    onAlertClose,
    onConnectPortChange,
    onConnectAddressChange,
    onConnectClick,
    onGetCarrierGasTypeClick,
    onSetCarrierGasGasTypeClick
  };
};

const MfcLaserSetting = () => {
  const { devices, carrierGasDetail, alertDetail, deviceList, carrierGasTypeListLoading, carrierGasTypeList,
    onAlertClose, onConnectPortChange, onConnectAddressChange, onConnectClick, onGetCarrierGasTypeClick, onSetCarrierGasGasTypeClick
  } = useHooks();

  return (
    <div className="min-h-allView p-4 bg-gray-200">
      <AlertComponent
        show={alertDetail.show}
        message={alertDetail.message}
        onClose={onAlertClose}
        type={alertDetail.type}
      />
      {/* {alertDetail?.show && (
      )} */}
      <h1 className="text-2xl font-bold text-center mb-5">MFC及雷射細部控制介面</h1>
      {/* 主氣 (Alicat) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-200 shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">主氣流量控制 (Main gas Flow Control - Azbil)</h2>
          <h2 className="text-lg font-semibold mb-3">(尚未有設備)</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-medium">壓力 (Pressure)</label>
              <input
                type="number"
                className="w-full border rounded-md p-2"
                placeholder="輸入設定壓力"
              />
            </div>
            <div>
              <label className="block font-medium">建立混合氣體種類 (Create mix gas)</label>
              <div className='flex justify-between items-center mb-2'>
                <span className='w-48'>設定編號</span>
                <input
                  type="number"
                  className="w-full border rounded-md p-2"
                  placeholder="從236開始，請避免重複使用編號"
                />
              </div><div className='flex justify-between items-center mb-2'>
                <span className='w-48'>設定名稱</span>
                <input
                  type="text"
                  className="w-full border rounded-md p-2"
                  placeholder="英文，8個字母內"
                />
              </div>
              <div className='flex justify-between items-center mb-2'>
                <span className='w-48'>設定參數</span>
                <input
                  type="text"
                  className="w-full border rounded-md p-2"
                  placeholder="總和為100, 請輸入ex: N2: 50, H2: 30, Ar: 20"
                />
              </div>
            </div>
            <div className='flex justify-center items-center mb-2'>              
              <button
                className="w-72 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300"
              >
                新增混合氣體 (Create mix gas)
              </button>
            </div>
            <div>
              <label className="block font-medium">氣體類型 (Gas Type)</label>
              <select className="w-full border rounded-md p-2">
                <option value="N2">N2</option>
                <option value="O2">O2</option>
                <option value="Ar">Ar</option>
                <option value="">Others</option>
              </select>
            </div>
            <input
              type="number"
              className="w-full border rounded-md p-2"
              placeholder="輸入其餘氣體種類，ex: 236, or Carrier (編號/名稱擇一)"
            />
            <div className='flex justify-center items-center mb-2'>
              <button className="w-72 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300">
                修改 (Setting)
              </button>
            </div>
          </div>
        </div>

        {/* 載氣 (Carrier Gas) (Alicat) */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">載氣流量控制 (Carrier gas Flow Control - Alicat)</h2>
          <div className="space-y-4">
            <div>
              <div>
                <label className="block font-medium">目前壓力 (Pressure)</label>
                <input
                  type="number"
                  className="w-full border rounded-md p-2 bg-gray-50"
                  placeholder="目前壓力數值"
                  value={Number(carrierGasDetail?.pressure || 0).toFixed(2)}
                  readOnly
                />
              </div>
              <div>
                <label className="block font-medium">壓力設定 (Pressure Setting)</label>
                <input
                  type="number"
                  className="w-full border rounded-md p-2"
                  placeholder="輸入設定壓力，非必要不要調整"
                />
              </div>
            </div>
            <div>
              <label className="block font-medium">建立混合氣體種類 (Create mix gas)</label>
              <div className='flex justify-between items-center mb-2'>
                <span className='w-48'>設定編號</span>
                <input
                  type="number"
                  className="w-full border rounded-md p-2"
                  placeholder="從236開始，請避免重複使用編號"
                />
              </div><div className='flex justify-between items-center mb-2'>
                <span className='w-48'>設定名稱</span>
                <input
                  type="text"
                  className="w-full border rounded-md p-2"
                  placeholder="英文，8個字母內"
                />
              </div>
              <div className='flex justify-between items-center mb-2'>
                <span className='w-48'>設定參數</span>
                <input
                  type="text"
                  className="w-full border rounded-md p-2"
                  placeholder="總和為100, 請輸入ex: N2: 50, H2: 30, Ar: 20"
                />
              </div>
            </div>
            <div className='flex justify-center items-center mb-2'>              
              <button className="w-72 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300">
                新增混合氣 (Create mix gas)
              </button>
            </div>
            <div>
              <label className="block font-medium">氣體類型 (Gas Type)</label>
              <select
                className="w-full border rounded-md p-2"
                onChange={(e) => onSetCarrierGasGasTypeClick(e.target.value)}
              >
                {carrierGasTypeList?.length > 0 ? (
                  carrierGasTypeList.map(option => (
                    <option
                      key={option.value}
                      value={option.value}
                    >
                      {option.label}
                    </option>
                  ))) : (
                    <option value="">No data</option>
                  )
                }
              </select>
            </div>
            <div className='flex justify-center items-center mb-2'>
              <button
                className="w-72 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300"
                onClick={onGetCarrierGasTypeClick}
              >
                {
                  carrierGasTypeListLoading ? (
                    <CommonLoading />
                  ) : (
                    carrierGasTypeList?.length > 0 ? '氣體調整 (Gas Setting)' : '取得所有氣體種類 (Get all gas type)'
                  )
                }
              </button>
            </div>
          </div>
        </div>
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">雷射控制 (Laser Control)</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-medium">脈寬調變 PWM (kHz)</label>
              <select className="w-full border rounded-md p-2">
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="20">20</option>
              </select>
            </div>
            <div className='flex justify-center items-center mb-2'>
              <button className="w-72 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300">
                設定 (Setting)
              </button>
            </div>
          </div>
        </div>
        {/* 單獨連線 */}
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">單獨連線 (Connect Port - One device)</h2>
          {deviceList.map((device) => (
            <SingleConnectComponent
              key={device.deviceId}
              title={device.title}
              company={device.company}
              deviceId={device.deviceId}
              onClick={onConnectClick}
              onConnectPortChange={onConnectPortChange}
              onConnectAddressChange={onConnectAddressChange}
              devicesData={devices}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MfcLaserSetting;