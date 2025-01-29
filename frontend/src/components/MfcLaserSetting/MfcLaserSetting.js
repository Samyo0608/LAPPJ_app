import React from 'react'
import AlertComponent from '../ComponentTools/Alert';
import CommonLoading from '../Loading/CommonLoading';
import { getApi } from '../../utils/getApi';
import { parseGasMixture } from '../../utils/mixGasUtil';
import { useAlicatContext } from '../../Contexts/AlicatContext';

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
    <div className='border rounded-md p-2 border-green-300 mb-2'>
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
  const { isCarrierGasOpenState, setIsCarrierOpenState, setCarrierGasPortandAddressState, carrierGasPortandAddressState, carrierGasTypeState, setCarrierGasTypeState } = useAlicatContext();
  // 單獨連線的項目整合
  const deviceList = [{
    title: '主氣流量控制器 - Main Gas',
    company: 'Azbil',
    deviceId: 'mainGas',
    port: '',
    address: ''
  }, {
    title: '載氣流量控制器 - Carrier Gas',
    company: 'Alicat',
    deviceId: 'carrierGas',
    port: '',
    address: ''
  } ,{
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
  const [carrierGasTypeList, setCarrierGasTypeList] = React.useState(isCarrierGasOpenState && carrierGasTypeState?.length > 0 ? carrierGasTypeState : []);
  const [carrierGasTypeListLoading, setCarrierGasTypeListLoading] = React.useState(false);
  const [carrierGasTypeSetting, setCarrierGasTypeSetting] = React.useState("");
  const [carrierGasMixGas, setCarrierGasMixGas] = React.useState("");
  const [carrierGasCreateMixGas, setCarrierGasCreateMixGas] = React.useState({
    number: 0,
    name: "",
    gases: ""
  });
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
      setCarrierGasTypeState(gasList);

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

  // 新增載氣混合氣體api
  const addCarrierGasGasTypeApi = async () => {
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

      setTimeout(() => {
        setAlertDetail({ show: false });
      }, 3000);

    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: '新增過程發生錯誤',
        type: 'failure'
      });

      setTimeout(() => {
        setAlertDetail({ show: false });
      }, 3000);
    }
  };

  // 刪除載氣混合氣體api
  const deleteCarrierGasGasTypeApi = async (number) => {
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

      setTimeout(() => {
        setAlertDetail({ show: false });
      }, 3000);

    } catch (error) {
      console.error(error);
      setAlertDetail({
        show: true,
        message: '刪除過程發生錯誤',
        type: 'failure'
      });

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

  // ----------------------------載氣設定的function----------------------------

  return {
    devices,
    carrierGasDetail,
    alertDetail,
    deviceList,
    carrierGasTypeListLoading,
    carrierGasTypeList,
    carrierGasCreateMixGas,
    carrierGasTypeSetting,
    carrierGasMixGas,
    onAlertClose,
    onConnectPortChange,
    onConnectAddressChange,
    onConnectClick,
    onGetCarrierGasTypeClick,
    onSetCarrierGasGasTypeClick,
    onCarrierGasMixGasClick,
    onCarrierGasCreateMixGasChange,
    onCarrierGasCreateMixGasClick,
    onDeleteCarrierGasGasTypeClick
  };
};

const MfcLaserSetting = () => {
  const { devices, carrierGasDetail, alertDetail, deviceList, carrierGasTypeListLoading, carrierGasTypeList, carrierGasCreateMixGas,
    carrierGasTypeSetting, carrierGasMixGas,
    onAlertClose, onConnectPortChange, onConnectAddressChange, onConnectClick, onGetCarrierGasTypeClick, onSetCarrierGasGasTypeClick,
    onCarrierGasMixGasClick, onCarrierGasCreateMixGasChange, onCarrierGasCreateMixGasClick, onDeleteCarrierGasGasTypeClick
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
      {/* 主氣 (Alicat) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-red-200 shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">主氣流量控制 (Main gas Flow Control - Azbil)</h2>
          <h2 className="text-lg font-semibold mb-3">(尚未有設備)</h2>
          <div className="space-y-4">
            <div>
              <label className="block font-medium mb-2">壓力 (Pressure)</label>
              <input
                type="number"
                className="w-full border rounded-md p-2"
                placeholder="輸入設定壓力"
              />
            </div>
            <div>
              <label className="block font-medium mb-2">建立混合氣體種類 (Create mix gas)</label>
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
              <label className="block font-medium mb-2">氣體類型 (Gas Type)</label>
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
                  value={carrierGasCreateMixGas?.number || 0}
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
                  className="w-72 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300"
                  onClick={onCarrierGasCreateMixGasClick}
                >
                  新增混合氣體 (Create mix gas)
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
                  className="w-72 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300"
                  onClick={() => onDeleteCarrierGasGasTypeClick(carrierGasMixGas)}
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
                      value={option.value}
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
                  className="w-72 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300"
                  onClick={onGetCarrierGasTypeClick}
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
        {deviceList.map((device) => (
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
        ))}
      </div>
    </div>
  );
};

export default MfcLaserSetting;