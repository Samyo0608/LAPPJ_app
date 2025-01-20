import React from 'react'
import AlertComponent from '../ComponentTools/Alert';
import { getApi } from '../../utils/getApi';

// 將 SingleConnectComponent 改為獨立的函數組件
const SingleConnectComponent = React.memo(({ title, company, deviceId, onClick, onConnectPortChange, onConnectAddressChange }) => {
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
        className="w-full border rounded-md p-2"
        placeholder="輸入Port名稱, ex: COM7"
        value={localPort}
        onChange={handlePortChange}
        onBlur={() => handlePortBlur(deviceId, localPort)}
      />
      <label className="block font-medium">Address</label>
      <input
        type="text"
        className="w-full border rounded-md p-2"
        placeholder="輸入Address, ex: A"
        value={localAddress}
        onChange={handleAddressChange}
        onBlur={() => handleAddressBlur(deviceId, localAddress)}
      />
      <div className='flex justify-center items-center mb-2'>       
        <button
          className="w-48 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300 mt-2"
          onClick={() => onClick(deviceId)}
        >
          連線 (Connect)
        </button>
      </div>
    </div>
  );
});

const useHooks = () => {
  const [devices, setDevices] = React.useState({});
  const [mfcDetail, setMfcDetail] = React.useState([]);
  const [carrierGasDetail, setCarrierGasDetail] = React.useState([]);
  const [carrierGasTypeList, setCarrierGasTypeList] = React.useState([]);
  const [alertDetail, setAlertDetail] = React.useState({});
  // const [deviceConnection, setDeviceConnection] = React.useState(false);

  // 單獨連線的項目整合
  const deviceList = [{
    title: '主氣流量控制器 - Main Gas',
    company: 'Alicat',
    deviceId: 'mainGas',
    port: '',
    address: ''
  }, {
    title: '載氣流量控制器 - Carrier Gas',
    company: 'Azbil',
    deviceId: 'carrierGas',
    port: '',
    address: ''
  }, {
    title: '雷射控制器 - Laser',
    company: 'CO2 Laser',
    deviceId: 'laser',
    port: '',
    address: ''
  }];
  
  const getCarrierGasDataApi = async () => {
    const response = await getApi('/status', 'GET');
    console.log(response);
    if (response?.data?.status === 'success') {
      setMfcDetail(response.data.message);
      setCarrierGasDetail(response.data.data);

      localStorage.setItem('carrierGasDetail', JSON.stringify(response.data.data));
    } else {
      console.error(response?.data?.status);
    }
  };

  const getCarrierGasAllGasTypeApi = async () => {
    const response = await getApi('/gases', 'GET');
    console.log(response);
    if (response?.data?.status === 'success') {
      setCarrierGasTypeList(response.data.data);
    } else {
      console.error(response?.data?.status);
    }
  };

  // 單獨連線api
  const connectDeviceApi = async (data) => {
    const response = await getApi('/connect', 'POST', data);
    console.log(response);
    if (response?.data?.status === 'success') {
      setMfcDetail(response.data.message);
      setAlertDetail({
        show: true,
        message: '連線成功',
        type: 'success'
      });
      await getCarrierGasDataApi();
      await getCarrierGasAllGasTypeApi();
      console.log("getCarrierGasDataApi", carrierGasDetail);
      console.log("getCarrierGasAllGasTypeApi", carrierGasTypeList);
    } else {
      console.error(response?.data?.status);
      setAlertDetail({
        show: true,
        message: '連線失敗',
        type: 'failure'
      });
    }

    setTimeout(() => {
      setAlertDetail({
        show: false
      });
    }, 3000);
  };

  // // Alicat 連線
  // const handleConnectAlicat = async () => {
  //   const data = {
  //     port: "COM7",
  //     address: "A",
  //   };
  //   await connectDeviceApi(data);
  // };

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

    await connectDeviceApi(data);
  };
  // -----------------------------------------------------------------------

  console.log("devices", devices);

  console.log("localstorage", localStorage.getItem('carrierGasDetail'));

  return {
    mfcDetail,
    alertDetail,
    deviceList,
    onAlertClose,
    onConnectPortChange,
    onConnectAddressChange,
    onConnectClick
  };
};

const MfcLaserSetting = () => {
  const { mfcDetail, alertDetail, deviceList,
    onAlertClose, onConnectPortChange, onConnectAddressChange, onConnectClick,
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
        <div className="bg-white shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">主氣流量控制 (Main gas Flow Control - Alicat)</h2>
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
                新增混和氣 (Create mix gas)
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

        {/* 載氣 (Carrier Gas) (Azbil) */}
        <div className="bg-red-200 shadow-md rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">載氣流量控制 (Carrier gas Flow Control - Azbil)</h2>
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
              <button className="w-72 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-300">
                新增混和氣 (Create mix gas)
              </button>
            </div>
            <div>
              <label className="block font-medium">氣體類型 (Gas Type)</label>
              <select
                className="w-full border rounded-md p-2"
              >
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
                修改 (Setting)
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
              onConnectPortChange={onConnectPortChange}
              onConnectAddressChange={onConnectAddressChange}
              onClick={onConnectClick}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default MfcLaserSetting;