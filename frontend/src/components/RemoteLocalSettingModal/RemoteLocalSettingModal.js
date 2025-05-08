import React, { useState, useEffect } from 'react';
import { Modal, Button, TextInput, Spinner, Alert } from 'flowbite-react';
import { HiInformationCircle, HiCheck, HiTrash, HiGlobeAlt, HiHome, HiPlus } from 'react-icons/hi';
import { getApi } from "../../utils/getApi";

const RemoteLocalSettingModal = ({ show, onClose }) => {
  const [isRemoteMode, setIsRemoteMode] = useState(false);
  const [newIp, setNewIp] = useState('');
  const [isValidIp, setIsValidIp] = useState(true);
  const [allowedIps, setAllowedIps] = useState([]);
  const [allowedPrefixes, setAllowedPrefixes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showRestartAlert, setShowRestartAlert] = useState(false);
  const [prefixMode, setPrefixMode] = useState(false);

  // 載入當前主機設定
  useEffect(() => {
    if (show) {
      fetchHostStatus();
    }
  }, [show]);

  const fetchHostStatus = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getApi('/host/status', 'GET');
      
      if (response.data.status === 'success') {
        const { allow_remote, allowed_ips, allowed_prefixes } = response.data.data;
        setIsRemoteMode(allow_remote);
        setAllowedIps(allowed_ips || []);
        setAllowedPrefixes(allowed_prefixes || []);
      } else {
        setError('取得主機設定失敗');
      }
    } catch (err) {
      setError('連線主機控制 API 時發生錯誤');
      console.error('獲取主機設定出錯:', err);
    } finally {
      setLoading(false);
    }
  };

  // 切換遠端/本地模式
  const handleToggleMode = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const response = await getApi('/host/switch', 'POST', {
        allow_remote: !isRemoteMode,
        auto_restart: true
      });
      
      if (response.data.status === 'success') {
        setIsRemoteMode(!isRemoteMode);
        setSuccess(`已切換到${!isRemoteMode ? '遠端' : '本地'}模式`);
        setShowRestartAlert(true);
        
        // 重新載入設定
        fetchHostStatus();
      } else {
        setError(response.data.message || '切換模式失敗');
      }
    } catch (err) {
      setError('更改主機設定時發生錯誤');
      console.error('切換模式出錯:', err);
    } finally {
      setLoading(false);
    }
  };

  // 驗證 IP 格式
  const validateIp = (ip) => {
    if (prefixMode) {
      // 只需驗證是否為有效的 IP 前綴
      return /^(\d{1,3}\.){0,3}\d{1,3}$/.test(ip);
    } else {
      // 完整 IP 地址驗證
      const ipRegex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
      if (!ipRegex.test(ip)) return false;
      
      const parts = ip.split('.').map(part => parseInt(part, 10));
      return parts.every(part => part >= 0 && part <= 255);
    }
  };

  // 處理 IP 輸入變化
  const handleIpChange = (e) => {
    const value = e.target.value;
    setNewIp(value);
    setIsValidIp(value === '' || validateIp(value));
  };

  // 新增 IP 到白名單
  const handleAddIp = async () => {
    if (!newIp || !isValidIp) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let response;
      
      if (prefixMode) {
        response = await getApi('/prefix/add', 'POST', {
          prefix: newIp,
          auto_restart: true
        });
      } else {
        response = await getApi('/ip/add', 'POST', {
          ip: newIp,
          auto_restart: true
        });
      }
      
      if (response.data.status === 'success') {
        setSuccess(`${prefixMode ? 'IP 前綴' : 'IP 地址'} ${newIp} 已添加到白名單`);
        setNewIp('');
        setShowRestartAlert(true);
        
        // 重新載入設定
        fetchHostStatus();
      } else {
        setError(response.data.message || '新增 IP 失敗');
      }
    } catch (err) {
      setError('新增 IP 時發生錯誤');
      console.error('新增 IP 出錯:', err);
    } finally {
      setLoading(false);
    }
  };

  // 從白名單移除 IP
  const handleRemoveIp = async (ip, isPrefix) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      let response;
      
      if (isPrefix) {
        response = await getApi('/prefix/remove', 'POST', {
          prefix: ip,
          auto_restart: true
        });
      } else {
        response = await getApi('/ip/remove', 'POST', {
          ip: ip,
          auto_restart: true
        });
      }
      
      if (response.data.status === 'success') {
        setSuccess(`${isPrefix ? 'IP 前綴' : 'IP 地址'} ${ip} 已從白名單移除`);
        setShowRestartAlert(true);
        
        // 重新載入設定
        fetchHostStatus();
      } else {
        setError(response.data.message || '移除 IP 失敗');
      }
    } catch (err) {
      setError('移除 IP 時發生錯誤');
      console.error('移除 IP 出錯:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} size="xl">
      <Modal.Header>主機連線設定</Modal.Header>
      <Modal.Body>
        <div className="space-y-6">
          {/* 錯誤和成功提示 */}
          {error && (
            <Alert color="failure" icon={HiInformationCircle}>
              <span className="font-medium">錯誤!</span> {error}
            </Alert>
          )}
          {success && (
            <Alert color="success" icon={HiCheck}>
              <span className="font-medium">成功!</span> {success}
            </Alert>
          )}
          {showRestartAlert && (
            <Alert color="warning" icon={HiInformationCircle}>
              <div className="flex flex-col gap-2">
                <span className="font-medium">注意!</span> 設定已更改。
                <span className="font-medium">請重新啟動應用程式，更改後的模式才會生效。</span>
              </div>
            </Alert>
          )}

          {/* 模式切換區域 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">連線模式</h3>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isRemoteMode ? (
                  <HiGlobeAlt className="text-xl text-blue-500" />
                ) : (
                  <HiHome className="text-xl text-green-500" />
                )}
                <span>
                  目前模式: <strong>{isRemoteMode ? '遠端模式 (0.0.0.0)' : '本地模式 (127.0.0.1)'}</strong>
                </span>
              </div>
              <Button 
                color={isRemoteMode ? "gray" : "blue"} 
                onClick={handleToggleMode}
                disabled={loading}
              >
                {loading ? (
                  <Spinner size="sm" className="mr-2" />
                ) : (
                  <span>
                    切換到{isRemoteMode ? '本地' : '遠端'}模式
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* IP 白名單設定區域 */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="text-lg font-medium mb-4">IP 白名單設定</h3>
            
            {/* IP 輸入區域 */}
            <div className="mb-4">
              <div className="flex mb-2">
                <Button
                  size="sm" 
                  color={prefixMode ? "gray" : "blue"}
                  onClick={() => setPrefixMode(false)}
                  className='mr-2'
                >
                  IP 地址
                </Button>
                <Button 
                  size="sm" 
                  color={prefixMode ? "blue" : "gray"}
                  onClick={() => setPrefixMode(true)}
                >
                  IP 前綴
                </Button>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex-1">
                  <TextInput
                    type="text"
                    value={newIp}
                    onChange={handleIpChange}
                    placeholder={prefixMode ? "輸入 IP 前綴 (例如: 140.114)" : "輸入 IP 地址 (例如: 192.168.1.100)"}
                    color={isValidIp ? "gray" : "failure"}
                    helperText={!isValidIp && "請輸入有效的 IP 格式"}
                  />
                </div>
                <Button
                  onClick={handleAddIp}
                  disabled={!newIp || !isValidIp || loading}
                >
                  <HiPlus className="mr-2" />
                  新增
                </Button>
              </div>
            </div>
            
            {/* IP 列表區域 */}
            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">允許的 IP 地址</h4>
                {allowedIps.length === 0 ? (
                  <p className="text-gray-500 italic">尚未新增任何 IP 地址</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded">
                    {allowedIps.map((ip) => (
                      <div key={ip} className="flex justify-between items-center p-2 bg-white rounded shadow-sm">
                        <span>{ip}</span>
                        <Button
                          size="xs"
                          color="gray"
                          onClick={() => handleRemoveIp(ip, false)}
                          disabled={loading}
                        >
                          <HiTrash className="text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <h4 className="font-medium mb-2">允許的 IP 前綴</h4>
                {allowedPrefixes.length === 0 ? (
                  <p className="text-gray-500 italic">尚未新增任何 IP 前綴</p>
                ) : (
                  <div className="space-y-2 max-h-40 overflow-y-auto p-2 border rounded">
                    {allowedPrefixes.map((prefix) => (
                      <div key={prefix} className="flex justify-between items-center p-2 bg-white rounded shadow-sm">
                        <span>{prefix}.*</span>
                        <Button
                          size="xs"
                          color="gray"
                          onClick={() => handleRemoveIp(prefix, true)}
                          disabled={loading}
                        >
                          <HiTrash className="text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button color="gray" onClick={onClose}>
          關閉
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default RemoteLocalSettingModal;