import React, { useState, useEffect } from 'react';
import { TextInput, Button, Card, Checkbox, Table, Label, List } from 'flowbite-react';
import { getApi } from '../../utils/getApi';
import AlertComponent from '../ComponentTools/Alert';
import { HiCheck, HiX } from 'react-icons/hi';
import { useAlicatContext } from '../../Contexts/AlicatContext';
import { useCo2LaserContext } from '../../Contexts/Co2LaserContext';
import { useHeaterContext } from '../../Contexts/HeaterContext';
import { useUltrasonicContext } from '../../Contexts/UltrasonicContext';

const useHooks = () => {
  const deviceConnectedRef = React.useRef({});
  const {
    isCarrierGasOpenState, setIsCarrierOpenState, carrierGasPortandAddressState, setCarrierGasPortandAddressState
  } = useAlicatContext();
  const {
    setCo2LaserDetailState, isCo2LaserOpenState, setIsCo2LaserOpenState, co2LaserPortState, setCo2LaserPortState
  } = useCo2LaserContext();
  const {
    setHeaterDetailState, isHeaterOpenState, setIsHeaterOpenState, heaterPortAndAddressState, setHeaterPortAndAddressState
  } = useHeaterContext();
  const {
    isUltraSonicOpenState, setIsUltraSonicOpenState, ultraSonicPortAndAddressState, setUltraSonicPortAndAddressState
  } = useUltrasonicContext();

  // 設備列表
  const deviceList = React.useMemo(() => [
    {
      id: 'mainGas',
      name: '主氣質量流量控制器 - Main Gas',
      requiresAddress: true,
    },
    {
      id: 'carrierGas',
      name: '載氣質量流量控制器 - Carrier Gas',
      requiresAddress: true,
    },
    {
      id: 'co2Laser',
      name: 'CO2 雷射控制器',
      requiresAddress: false,
    },
    {
      id: 'powerSupply',
      name: '電漿電源供應器',
      requiresAddress: true,
    },
    {
      id: 'heater',
      name: '加熱器',
      requiresAddress: true,
    },
    {
      id: 'ultrasonic',
      name: '超音波震盪器',
      requiresAddress: true,
    }
  ], []);

  // 定義每個設備可能會用到的address
  const deviceAddress = {
    mainGas: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    carrierGas: ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'],
    co2Laser: [],
    powerSupply: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    heater: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'],
    ultrasonic: ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10']
  }

  // 設備狀態
  const [devices, setDevices] = useState(() => {
    const initialDevices = {};
    deviceList.forEach(device => {
      initialDevices[device.id] = {
        port: '',
        address: '',
        connected: false,
        loading: false,
        selected: false
      };
    });
    return initialDevices;
  });

  const [ipAddress, setIpAddress] = useState('');
  const [isAutoConnecting, setIsAutoConnecting] = useState(false);
  const [connectionResults, setConnectionResults] = useState([]);
  const [usefulPorts, setUsefulPorts] = useState([]);
  const [alertDetail, setAlertDetail] = useState({
    show: false,
    message: '',
    type: ''
  });

  // -------------------api function-------------------
  // 取得電腦上已使用的 Port 列表
  const getPortsListApi = async () => {
    try {
      const response = await getApi('/port_scanner/ports', "GET", null, localStorage.getItem('token'));
      if (response?.status === "success") {
        setUsefulPorts(response.data.data.ports);
      } else {
        console.error(response.message);
      }
    } catch (error) {
      console.error(error);
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
          // 立即更新 ref
          deviceConnectedRef.current = {
            ...deviceConnectedRef.current,
            [deviceId]: true
          };
    
          setAlertDetail({
            show: true,
            message: response.data.message || '載氣連線成功',
            type: 'success'
          });
    
          setDevices(prev => ({
            ...prev,
            [deviceId]: {
              ...prev[deviceId],
              connected: true,
              loading: false,
              port: data.port,
              address: data.address,
              selected: true
            }
          }));
          setIsCarrierOpenState(true);
          setCarrierGasPortandAddressState({
            port: data.port,
            address: data.address
          });
          return response;
        } else {
          setAlertDetail({
            show: true,
            message: '載氣連線失敗',
            type: 'failure'
          });
          deviceConnectedRef.current[deviceId] = false;
        }
      } catch (error) {
        console.error('連線錯誤:', error);
        setAlertDetail({
          show: true,
          message: '載氣連線失敗',
          type: 'failure'
        });
        deviceConnectedRef.current[deviceId] = false;
      } finally {
        setTimeout(() => {
          setAlertDetail(prev => ({ ...prev, show: false }));
        }, 1000);
      }
    };

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
        deviceConnectedRef.current = {
          ...deviceConnectedRef.current,
          co2Laser: true
        };
  
        setAlertDetail({
          show: true,
          message: response.data.message || 'CO2 Laser 連線成功',
          type: 'success'
        });
  
        setDevices(prev => ({
          ...prev,
          co2Laser: {
            ...prev.co2Laser,
            connected: true,
            loading: false,
            port: data.port,
            selected: true
          }
        }));
  
        setCo2LaserPortState({
          port: data.port
        });
        setCo2LaserDetailState(response.data.data);
        setIsCo2LaserOpenState(true);
        return response;
      } else {
        deviceConnectedRef.current.co2Laser = false;
      }
    } catch (error) {
      console.error('CO2 Laser 連線錯誤:', error);
      deviceConnectedRef.current.co2Laser = false;
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
      setTimeout(() => {
        setAlertDetail(prev => ({ ...prev, show: false }));
      }, 1000);
    }
  };

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
        deviceConnectedRef.current = {
          ...deviceConnectedRef.current,
          heater: true
        };

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
            loading: false,
            port: data.port,
            address: data.address,
            selected: true
          }
        }));

        setHeaterPortAndAddressState({
          port: data.port,
          address: data.address
        });

        setIsHeaterOpenState(true);
        setHeaterDetailState(response.data.data);

        return response;
      } else {
        deviceConnectedRef.current.heater = false;
      }
    } catch (error) {
      console.error('Heater 連線錯誤:', error);
      deviceConnectedRef.current.heater = false;
      setDevices(prev => ({
        ...prev,
        heater: {
          ...prev.heater,
          loading: false
        }
      }));

      setAlertDetail({
        show: true,
        message: 'Heater連線過程發生錯誤',
        type: 'failure'
      });

    } finally {
      setTimeout(() => {
        setAlertDetail(prev => ({ ...prev, show: false }));
      }, 1000);
    }
  };

  // 連線UltraSonic api
  const connectUltraSonicApi = async (data) => {
    try {
      setDevices(prev => ({
        ...prev,
        ultrasonic: {
          ...prev.ultrasonic,
          loading: true
        }
      }));

      const response = await getApi('/ultrasonic/connect', 'POST', data, localStorage.getItem('token'));

      if (response?.data?.status === 'success') {
        deviceConnectedRef.current = {
          ...deviceConnectedRef.current,
          ultrasonic: true
        };

        setAlertDetail({
          show: true,
          message: response.data.message || 'UltraSonic連線成功',
          type: 'success'
        });

        setDevices(prev => ({
          ...prev,
          ultrasonic: {
            ...prev.ultrasonic,
            connected: true,
            loading: false,
            port: data.port,
            address: data.address,
            selected: true
          }
        }));

        setUltraSonicPortAndAddressState({
          port: data.port,
          address: data.address
        });

        setIsUltraSonicOpenState(true);
        return response;
      } else {
        deviceConnectedRef.current.ultrasonic = false;
      }
    } catch (error) {
      console.error('UltraSonic 連線錯誤:', error);
      deviceConnectedRef.current.ultrasonic = false;
      setDevices(prev => ({
        ...prev,
        ultrasonic: {
          ...prev.ultrasonic,
          loading: false
        }
      }));
      setAlertDetail({
        show: true,
        message: 'UltraSonic連線過程發生錯誤',
        type: 'failure'
      });
    } finally {
      setTimeout(() => {
        setAlertDetail(prev => ({ ...prev, show: false }));
      }, 1000);
    }
  };

  // 自動連線 functrion
  const autoConnectApi = async () => {
    setIsAutoConnecting(true);
    try {
      // 過濾掉包含藍牙的 port
      const availablePorts = usefulPorts.filter(port => !port.description.includes('藍牙'));
      const selectedDevicesList = deviceList.filter(device => devices[device.id]?.selected);
      const usedPorts = new Set();
  
      for (const device of selectedDevicesList) {
        let deviceConnected = false;
  
        if (device.requiresAddress) {
          // 先遍歷 address
          for (const address of deviceAddress[device.id]) {
            if (deviceConnected) break;
  
            // 再遍歷 ports
            for (const portInfo of availablePorts) {
              if (usedPorts.has(portInfo.port)) {
                console.log(`Port ${portInfo.port} 已被使用，跳過`);
                continue;
              }
  
              try {
                setConnectionResults(prev => [{
                  deviceId: device.id,
                  deviceName: device.name,
                  message: `嘗試 Address: ${address}, Port: ${portInfo.port}`,
                  timestamp: new Date().toLocaleTimeString(),
                  success: null
                }, ...prev]);
  
                setDevices(prev => ({
                  ...prev,
                  [device.id]: {
                    ...prev[device.id],
                    port: portInfo.port,
                    address,
                    loading: true,
                    connected: false
                  }
                }));
  
                await new Promise(resolve => setTimeout(resolve, 500));
  
                switch (device.id) {
                  case 'carrierGas':
                    try {
                      await connectCarrierGasApi({
                        port: portInfo.port,
                        address
                      }, device.id);

                      if (deviceConnectedRef.current['carrierGas']) {
                        deviceConnected = true;
                        usedPorts.add(portInfo.port);
                        setConnectionResults(prev => [{
                          deviceId: device.id,
                          deviceName: device.name,
                          message: `連接成功: Address: ${address}, Port: ${portInfo.port}`,
                          timestamp: new Date().toLocaleTimeString(),
                          success: true
                        }, ...prev]);
                        break;
                      }
                    } catch (error) {
                      setConnectionResults(prev => [{
                        deviceId: device.id,
                        deviceName: device.name,
                        message: `連接錯誤 Address: ${address}, Port: ${portInfo.port} - ${error.message}`,
                        timestamp: new Date().toLocaleTimeString(),
                        success: false
                      }, ...prev]);
                    }
                    break;
                  case 'heater':
                    try {
                      await connectHeaterApi({
                        port: portInfo.port,
                        address
                      });

                      if (deviceConnectedRef.current['heater']) {
                        deviceConnected = true;
                        usedPorts.add(portInfo.port);
                        setConnectionResults(prev => [{
                          deviceId: device.id,
                          deviceName: device.name,
                          message: `連接成功: Address: ${address}, Port: ${portInfo.port}`,
                          timestamp: new Date().toLocaleTimeString(),
                          success: true
                        }, ...prev]);
                        break;
                      }
                    } catch (error) {
                      setConnectionResults(prev => [{
                        deviceId: device.id,
                        deviceName: device.name,
                        message: `連接錯誤 Address: ${address}, Port: ${portInfo.port} - ${error.message}`,
                        timestamp: new Date().toLocaleTimeString(),
                        success: false
                      }, ...prev]);
                    }
                    break;
                  case 'ultrasonic':
                    try {
                      await connectUltraSonicApi({
                        port: portInfo.port,
                        address
                      });

                      if (deviceConnectedRef.current['ultrasonic']) {
                        deviceConnected = true;
                        usedPorts.add(portInfo.port);
                        setConnectionResults(prev => [{
                          deviceId: device.id,
                          deviceName: device.name,
                          message: `連接成功: Address: ${address}, Port: ${portInfo.port}`,
                          timestamp: new Date().toLocaleTimeString(),
                          success: true
                        }, ...prev]);
                        break;
                      }
                    } catch (error) {
                      setConnectionResults(prev => [{
                        deviceId: device.id,
                        deviceName: device.name,
                        message: `連接錯誤 Address: ${address}, Port: ${portInfo.port} - ${error.message}`,
                        timestamp: new Date().toLocaleTimeString(),
                        success: false
                      }, ...prev]);
                    }
                    break;
                  default:
                    break;
                }
  
                if (deviceConnected) break;
  
              } catch (error) {
                console.error(`連接失敗:`, error);
                setConnectionResults(prev => [{
                  deviceId: device.id,
                  deviceName: device.name,
                  message: `連接失敗 Address: ${address}, Port: ${portInfo.port} - ${error.message}`,
                  timestamp: new Date().toLocaleTimeString(),
                  success: false
                }, ...prev]);
              }
  
              setDevices(prev => ({
                ...prev,
                [device.id]: {
                  ...prev[device.id],
                  loading: false
                }
              }));
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          }
        } else {
          // 不需要 address 的設備
          for (const portInfo of availablePorts) {
            if (usedPorts.has(portInfo.port)) {
              console.log(`Port ${portInfo.port} 已被使用，跳過`);
              continue;
            }
  
            try {
              setConnectionResults(prev => [{
                deviceId: device.id,
                deviceName: device.name,
                message: `嘗試 Port: ${portInfo.port}`,
                timestamp: new Date().toLocaleTimeString(),
                success: null
              }, ...prev]);
  
              setDevices(prev => ({
                ...prev,
                [device.id]: {
                  ...prev[device.id],
                  port: portInfo.port,
                  loading: true,
                  connected: false
                }
              }));

              if (device.id === 'co2Laser') {
                await connectCo2LaserApi({
                  port: portInfo.port
                });
                
                if (deviceConnectedRef.current['co2Laser']) {
                  deviceConnected = true;
                  usedPorts.add(portInfo.port);
                  
                  setConnectionResults(prev => [{
                    deviceId: device.id,
                    deviceName: device.name,
                    message: `連接成功 Port: ${portInfo.port}`,
                    timestamp: new Date().toLocaleTimeString(),
                    success: true
                  }, ...prev]);
                  break;
                }
              }
            } catch (error) {
              console.error(`連接失敗:`, error);
              setConnectionResults(prev => [{
                deviceId: device.id,
                deviceName: device.name,
                message: `連接失敗 Port: ${portInfo.port} - ${error.message}`,
                timestamp: new Date().toLocaleTimeString(),
                success: false
              }, ...prev]);
            }
  
            setDevices(prev => ({
              ...prev,
              [device.id]: {
                ...prev[device.id],
                loading: false
              }
            }));
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
  
        if (!deviceConnected) {
          setConnectionResults(prev => [{
            deviceId: device.id,
            deviceName: device.name,
            message: '所有可能的組合都已嘗試但未成功連接',
            timestamp: new Date().toLocaleTimeString(),
            success: false
          }, ...prev]);
        }
      }
  
      setAlertDetail({
        show: true,
        message: '自動連線程序完成',
        type: 'success'
      });
  
    } catch (error) {
      console.error('自動連線過程發生錯誤:', error);
      setAlertDetail({
        show: true,
        message: `自動連線過程發生錯誤: ${error.message}`,
        type: 'failure'
      });
    } finally {
      setIsAutoConnecting(false);
      setTimeout(() => {
        setAlertDetail(prev => ({ ...prev, show: false }));
      }, 2000);
    }
  };

  // disconnect carrier gas device
  const disconnectCarrierGasApi = async (data, deviceId) => {
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
        
        setIsCarrierOpenState(false);
      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: '載氣設備取消連線失敗',
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
        message: '載氣設備取消連線過程發生錯誤',
        type: 'failure'
      });
    } finally {
      setTimeout(() => {
        setAlertDetail((prev) => ({ ...prev, show: false }));
      }, 1000);
    };
  };

  // disconnect co2 laser
  const disconnectCo2LaserApi = async () => {
    try {
      setDevices(prev => ({
        ...prev,
        co2Laser: {
          ...prev.co2Laser,
          loading: true
        }
      }));

      const response = await getApi('/uc2000/disconnect', 'POST');

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
          message: 'CO2雷射控制器取消連線失敗',
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
        setAlertDetail(prev => ({ ...prev, show: false }));
      }, 1000);
    }
  };

  // disconnect heater device
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
          message: 'Heater取消連線失敗',
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
        message: 'Heater取消連線過程發生錯誤',
        type: 'failure'
      });

    } finally {
      setTimeout(() => {
        setAlertDetail(prev => ({ ...prev, show: false }));
      }, 1000);
    }
  };

  // disconnect ultrasonic device
  const disconnectUltraSonicApi = async (data) => {
    try {
      setDevices(prev => ({
        ...prev,
        ultrasonic: {
          ...prev.ultrasonic,
          loading: true
        }
      }));

      const response = await getApi('/ultrasonic/disconnect', 'POST', data, localStorage.getItem('token'));

      if (response?.data?.status === 'success') {
        setAlertDetail({
          show: true,
          message: 'UltraSonic已取消連線',
          type: 'success'
        });

        setDevices(prev => ({
          ...prev,
          ultrasonic: {
            ...prev.ultrasonic,
            connected: false,
            loading: false
          }
        }));

        setIsUltraSonicOpenState(false);
      } else {
        console.error(response?.data?.status);
        setAlertDetail({
          show: true,
          message: 'UltraSonic取消連線失敗',
          type: 'failure'
        });

        setDevices(prev => ({
          ...prev,
          ultrasonic: {
            ...prev.ultrasonic,
            loading: false
          }
        }));
      }
    } catch (error) {
      console.error(error);
      setDevices(prev => ({
        ...prev,
        ultrasonic: {
          ...prev.ultrasonic,
          loading: false
        }
      }));
      setAlertDetail({
        show: true,
        message: 'UltraSonic取消連線過程發生錯誤',
        type: 'failure'
      });
    } finally {
      setTimeout(() => {
        setAlertDetail(prev => ({ ...prev, show: false }));
      }, 1000);
    }
  };

  // 斷開所有設備連接
  const disconnectAllDevicesApi = async () => {
    try {
      for (const device of deviceList) {
        switch (device.id) {
          case 'carrierGas':
            await disconnectCarrierGasApi({
              port: devices[device.id].port,
              address: devices[device.id].address
            }, device.id);
            break;
          case 'heater':
            await disconnectHeaterApi({
              port: devices[device.id].port,
              address: devices[device.id].address
            });
            break;
          case 'co2Laser':
            await disconnectCo2LaserApi();
            break;
          case 'ultrasonic':
            await disconnectUltraSonicApi({
              port: devices[device.id].port,
              address: devices[device.id].address
            });
            break;
          default:
            break;
        }
      }
      setAlertDetail({
        show: true,
        message: '已斷開所有連線',
        type: 'success'
      });

    } catch (error) {
      console.error('斷開連線過程發生錯誤:', error);
      setAlertDetail({
        show: true,
        message: '斷開連線過程發生錯誤',
        type: 'failure'
      });

    } finally {
      setTimeout(() => {
        setAlertDetail(prev => ({ ...prev, show: false }));
      }, 2000);
    }
  };
  
  // -------------------api function-------------------

  // --------------------event handler--------------------
  // 修改連接處理函數，單獨連線每個設備
  const handleConnect = async (deviceId) => {
    switch (deviceId) {
      case 'carrierGas':
        if (devices[deviceId].connected) {
          await disconnectCarrierGasApi({
            port: devices[deviceId].port,
            address: devices[deviceId].address
          }, deviceId);
        } else {
          await connectCarrierGasApi({
            port: devices[deviceId].port,
            address: devices[deviceId].address
          }, deviceId);
        }
        break;
      case 'heater':
        if (devices[deviceId].connected) {
          await disconnectHeaterApi({
            port: devices[deviceId].port,
            address: devices[deviceId].address
          });
        } else {
          await connectHeaterApi({
            port: devices[deviceId].port,
            address: devices[deviceId].address
          });
        }
        break;
      case 'co2Laser':
        if (devices[deviceId].connected) {
          await disconnectCo2LaserApi();
        } else {
          await connectCo2LaserApi({
            port: devices[deviceId].port
          });
        }
        break;
      case 'ultrasonic':
        if (devices[deviceId].connected) {
          await disconnectUltraSonicApi({
            port: devices[deviceId].port,
            address: devices[deviceId].address
          });
        } else {
          await connectUltraSonicApi({
            port: devices[deviceId].port,
            address: devices[deviceId].address
          });
        }
        break;
      default:
        break;
    }
  };

  // 修改自動連接函數
  const handleAutoConnect = async () => {
    if (isAutoConnecting) return;

    if (isCarrierGasOpenState || isCo2LaserOpenState || isHeaterOpenState) {
      const result = window.confirm('已有設備連接，是否要斷開現有連接再進行自動連接？');
      if (!result) return;
      await disconnectAllDevicesApi();
      return;
    } else {
      await autoConnectApi();
    }
  };

  // 新增：切換設備選擇
  const toggleDeviceSelection = (deviceId) => {
    setDevices(prev => ({
      ...prev,
      [deviceId]: {
        ...prev[deviceId],
        selected: !prev[deviceId].selected
      }
    }));
  };

  // port, address input的onChange事件
  const onPortOrAddressChange = (e, device, item) => {
    setDevices(prev => ({
        ...prev,
        [device.id]: {
          ...prev[device.id],
          [item]: e.target.value
        }
      })
    );
  };

  // --------------------event handler--------------------

  // -------------------useEffect-------------------
  // 初始化設備狀態
  useEffect(() => {
    const initialSelected = {};
    deviceList.forEach(device => {
      initialSelected[device.id] = false;
    });
    deviceConnectedRef.current = initialSelected;
  }, [deviceList]);

  // 如果有carrierGasPortandAddressState、co2LaserPortState和heaterPortAndAddressSAtate，則將其設定到devices
  useEffect(() => {
    if (isCarrierGasOpenState || carrierGasPortandAddressState?.port || carrierGasPortandAddressState?.address) {
      setDevices(prev => ({
        ...prev,
        carrierGas: {
          ...prev.carrierGas,
          port: carrierGasPortandAddressState.port,
          address: carrierGasPortandAddressState.address,
          connected: isCarrierGasOpenState,
          selected: isCarrierGasOpenState
        }
      }));
    }

    if (isCo2LaserOpenState || co2LaserPortState?.port) {
      setDevices(prev => ({
        ...prev,
        co2Laser: {
          ...prev.co2Laser,
          port: co2LaserPortState.port,
          connected: isCo2LaserOpenState,
          selected: isCo2LaserOpenState
        }
      }));
    }

    if (isHeaterOpenState || heaterPortAndAddressState?.port || heaterPortAndAddressState?.address) {
      setDevices(prev => ({
        ...prev,
        heater: {
          ...prev.heater,
          port: heaterPortAndAddressState.port,
          address: heaterPortAndAddressState.address,
          connected: isHeaterOpenState,
          selected: isHeaterOpenState
        }
      }));
    }

    if (isUltraSonicOpenState || ultraSonicPortAndAddressState?.port || ultraSonicPortAndAddressState?.address) {
      setDevices(prev => ({
        ...prev,
        ultrasonic: {
          ...prev.ultrasonic,
          port: ultraSonicPortAndAddressState.port,
          address: ultraSonicPortAndAddressState.address,
          connected: isUltraSonicOpenState,
          selected: isUltraSonicOpenState
        }
      }));
    }
  }, [carrierGasPortandAddressState, co2LaserPortState, isCarrierGasOpenState, isCo2LaserOpenState, heaterPortAndAddressState, isHeaterOpenState, ultraSonicPortAndAddressState, isUltraSonicOpenState]);

  useEffect(() => {
    getPortsListApi();
  }, []);

  // -------------------useEffect-------------------

  return {
    deviceList,
    devices,
    ipAddress,
    isAutoConnecting,
    connectionResults,
    usefulPorts,
    alertDetail,
    isCarrierGasOpenState,
    isCo2LaserOpenState,
    isHeaterOpenState,
    isUltraSonicOpenState,
    setIpAddress,
    handleConnect,
    handleAutoConnect,
    toggleDeviceSelection,
    setAlertDetail,
    onPortOrAddressChange
  };
};


const PortAutoConnectPage = () => {
  const {
    deviceList, devices, ipAddress, isAutoConnecting, connectionResults, usefulPorts, alertDetail, isCarrierGasOpenState, isCo2LaserOpenState,
    isHeaterOpenState, isUltraSonicOpenState,
    setIpAddress, handleConnect, handleAutoConnect, toggleDeviceSelection, setAlertDetail,
    onPortOrAddressChange
  } = useHooks();

  return (
    <div className="p-4 space-y-4 bg-gray-100 min-h-allView">
      <AlertComponent {...alertDetail} onClose={() => setAlertDetail(prev => ({ ...prev, show: false }))} />
      {/* IP 位址輸入 */}
      <div
        className='grid grid-cols-1 md:grid-cols-2 gap-4'
      >
        <Card className="bg-white">
          <h5 className="text-xl font-bold tracking-tight text-gray-900">
            Port Connection (IP Address)
          </h5>
          <div>
            <TextInput
              placeholder="Enter IP Address"
              value={ipAddress || ""}
              onChange={(e) => setIpAddress(e.target.value)}
              className="max-w-xs"
            />
          </div>
          <Button
            className='max-w-48'
          >
            IP Connect
          </Button>
        </Card>
        <Card>
          <h5 className="text-xl font-bold tracking-tight text-gray-900">
            目前電腦上已使用的 Port
          </h5>
          <List>
            {
              usefulPorts?.length > 0 ? usefulPorts.map((list) => (
                <List.Item key={list.port}>{list.port || "- -"} [{list.description || "- -"}]</List.Item>
              )) : <List.Item>無資料</List.Item>
            }
          </List>
        </Card>
      </div>

      {/* 自動連線控制面板 */}
      <Card className="bg-white">
        <h5 className="text-xl font-bold tracking-tight text-gray-900 mb-4">
          自動連線 (需要等待一段時間)
        </h5>
        <div className="space-y-4">
          {/* 將設備分成兩行顯示 */}
          <div className="grid grid-cols-2 gap-x-8 gap-y-2">
            {
              deviceList.map((device) => (
                <div
                  key={device.id}
                  className="flex items-center cursor-pointer"
                >
                  <Checkbox
                    id={device.id}
                    className="mr-2"
                    checked={devices[device.id]?.selected}
                    onChange={() => toggleDeviceSelection(device.id)}
                    label={device.name}
                    disabled={isCarrierGasOpenState || isCo2LaserOpenState || isHeaterOpenState || isUltraSonicOpenState}
                  />
                  <Label
                    htmlFor={device.id}
                    className="block text-sm font-medium text-gray-700 cursor-pointer"
                  >
                    {device.name}
                  </Label>
                </div>
              ))
            }
          </div>
          {
            isCarrierGasOpenState || isCo2LaserOpenState || isHeaterOpenState || isUltraSonicOpenState ? (
            <Button
              onClick={handleAutoConnect}
              disabled={isAutoConnecting}
              className="max-w-48"
            >
              {isAutoConnecting ? 'Connecting...' : '中斷所有連線'}
            </Button>
            ) : (
              <Button
                onClick={handleAutoConnect}
                disabled={isAutoConnecting}
                className="max-w-48"
              >
                {isAutoConnecting ? 'Connecting...' : '自動連線已選設備'}
              </Button>
            )
          }
        </div>
      </Card>

      {/* 設備連接面板 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {deviceList.map((device) => (
          <div
            className="bg-white p-4 border rounded-lg shadow-lg flex flex-col justify-between"
            key={device.id}
          >
            <div>
              <h5 className="text-lg font-bold tracking-tight text-gray-900 mb-4">
                {device.name}
              </h5>
              <div>
                <label className="block text-sm font-medium mb-1">Port</label>
                <TextInput
                  placeholder="Enter port (e.g. COM1)"
                  value={devices[device.id]?.port || ''}
                  onChange={(e) => onPortOrAddressChange(e, device, 'port')}
                  disabled={devices[device.id]?.connected}
                />
              </div>
              {device.requiresAddress && (
                <div>
                  <label className="block text-sm font-medium mb-1">Address</label>
                  <TextInput
                    placeholder="Enter address"
                    value={devices[device.id]?.address || ''}
                    onChange={(e) => onPortOrAddressChange(e, device, 'address')}
                    disabled={devices[device.id]?.connected}
                  />
                </div>
              )}
            </div>
            <Button 
              onClick={() => handleConnect(device.id)}
              disabled={devices[device.id]?.loading}
              style={{ backgroundColor: devices[device.id]?.connected ? '#dc3545' : '#66a8d8' }}
              className="w-full mt-12"
            >
              {devices[device.id]?.loading ? 'Connecting...' : 
              devices[device.id]?.connected ? 'Disconnect' : 'Connect'}
            </Button>
          </div>
        ))}
      </div>

      {/* 連接結果表格 */}
      <Card className="bg-white">
        <h5 className="text-xl font-bold tracking-tight text-gray-900 mb-4">
          連線資料 Log
        </h5>
        <div className="overflow-x-auto">
          <Table striped>
            <Table.Head>
              <Table.HeadCell>Time</Table.HeadCell>
              <Table.HeadCell>Device</Table.HeadCell>
              <Table.HeadCell>Message</Table.HeadCell>
              <Table.HeadCell>Status</Table.HeadCell>
            </Table.Head>
            <Table.Body>
              {connectionResults.map((result, index) => (
                <Table.Row key={index}>
                  <Table.Cell>{result.timestamp}</Table.Cell>
                  <Table.Cell>{result.deviceName}</Table.Cell>
                  <Table.Cell>{result.message}</Table.Cell>
                  <Table.Cell>
                    {result.success ? (
                      <div className="flex items-center text-green-500">
                        <HiCheck className="mr-1" /> Success
                      </div>
                    ) : (
                      <div className="flex items-center text-red-500">
                        <HiX className="mr-1" /> Failed
                      </div>
                    )}
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default PortAutoConnectPage;