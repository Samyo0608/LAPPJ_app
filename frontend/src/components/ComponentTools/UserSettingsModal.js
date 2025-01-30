import React, { useState } from 'react';
import { Modal, Label, TextInput, FileInput, Button } from 'flowbite-react';
import { getApi, photoApi } from '../../utils/getApi';
import AlertComponent from '../ComponentTools/Alert';
import { useAuthContext } from '../../Contexts/AuthContext';

const UserSettingsModal = ({ isOpen, onClose, user }) => {
  const { authDetail, setAuthDetail } = useAuthContext();
  const [formData, setFormData] = useState({
    email: user?.email?.length > 0 ? user.email : '',
    username: user?.username?.length > 0 ? user.username : '',
    newPassword: '',
    confirmPassword: '',
    savePath: user?.save_path?.length > 0 ? user.save_path : ''
  });
  const [alertDetail, setAlertDetail] = useState({
    show: false,
    message: '',
    type: ''
  });
  const [avatarPreview, setAvatarPreview] = useState(() => {
    if (user?.photo_path?.length > 0) {
      try {
        const path = user.photo_path.replace(/\\/g, "/");  // 轉換 Windows `\` 為 `/`
        const finalPath = path.startsWith("../frontend/public/")
          ? path.replace("../frontend/public/", "/")  // 讓 React 可以讀取
          : path;
        return finalPath;
      } catch (error) {
        console.error("圖片路徑處理錯誤:", error);
        return "";  // 讓 React 不當機
      }
    }
    return "";
  });  

  // 處理表單變更
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 轉換檔案為 base64 的輔助函數
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
      reader.readAsDataURL(file);
    });
  };
  
  // 處理頭像上傳
  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      try {
        // 轉換檔案為 Base64
        const base64String = await convertToBase64(file);
        const uniqueFileName = `${Date.now()}_${file.name}`; // 確保檔名唯一
  
        // 上傳到後端
        const response = await photoApi('/auth/photo', 'POST', {
          photo_base64: base64String,
          file_name: uniqueFileName // **改為唯一檔名**
        }, user.token);
  
        if (response.status === 'success') {
          setAvatarPreview(base64String);
  
          // **更新 authDetail**
          const updatedAuthDetail = {
            ...authDetail,
            photo_path: `${response.data.photo_path}?t=${Date.now()}` // **確保 React 偵測變更**
          };
  
          localStorage.setItem('authDetail', JSON.stringify(updatedAuthDetail));
          setAuthDetail(updatedAuthDetail);
  
          setAlertDetail({
            show: true,
            message: '頭像上傳成功',
            type: 'success'
          });
  
          setTimeout(() => {
            setAlertDetail({ show: false });
          }, 3000);
        } else {
          setAlertDetail({
            show: true,
            message: response.message || '頭像上傳失敗',
            type: 'error'
          });
        }
      } catch (error) {
        console.error('上傳錯誤:', error);
        setAlertDetail({
          show: true,
          message: '頭像上傳失敗',
          type: 'error'
        });
      }
    }
  };
  

  // 選擇資料儲存路徑
  const handleSelectFolder = async () => {
    try {
      const path = await window.electron.selectFolder();
      if (path) {
        setFormData({
          ...formData,
          savePath: path
        });
      }
    } catch (error) {
      console.error('選擇資料夾失敗:', error);
    }
  };

  // 提交表單
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setAlertDetail({
        show: true,
        message: '新密碼與確認密碼不一致',
        type: 'error'
      });

      setTimeout(() => {
        setAlertDetail({
          show: false,
          message: '',
          type: ''
        });
      }, 3000);
    }
  
    // 移除不需要的欄位
    const updateData = {
      username: formData.username,
      newPassword: formData.newPassword,
      savePath: formData.savePath,
      confirmPassword: formData.confirmPassword
    };
  
    try {
      const response = await getApi('/auth/setting', 'PUT', updateData, user.token);
      if (response?.status === 'success') {
        setAlertDetail({
          show: true,
          message: '資料更新成功',
          type: 'success'
        });

        // 更新 localStorage
        const updatedAuthDetail = {
          ...authDetail,
          username: formData.username,
          save_path: formData.savePath
        };

        localStorage.setItem('authDetail', JSON.stringify(updatedAuthDetail));
        setAuthDetail(updatedAuthDetail);

        setTimeout(() => {
          setAlertDetail({
            show: false,
            message: '',
            type: ''
          });
        }, 3000);
      } else {
        setAlertDetail({
          show: true,
          message: '資料更新失敗',
          type: 'failure'
        });
        
        setTimeout(() => {
          setAlertDetail({
            show: false,
            message: '',
            type: ''
          });
        }, 3000);
      }
    } catch (error) {
      setAlertDetail({
        show: true,
        message: '更新失敗(API)',
        type: 'failure'
      });

      setTimeout(() => {
        setAlertDetail({
          show: false,
          message: '',
          type: ''
        });
      }, 3000);
    }
  };

React.useEffect(() => {
  if (user) {
    setFormData({
      email: user?.email || "",
      username: user?.username || "",
      savePath: user?.save_path || ""
    });
    if (user?.photo_path?.length > 0) {
      // 處理頭像路徑 - photo_path: "../frontend\\public\\userPhotos\\user_1_螢幕擷取畫面 2023-03-19 135910.png"
      const path = user.photo_path.split('\\\\').join('/');
      const pathArray = path.split('\\');
      const finalPath = pathArray.slice(2).join('/');
      setAvatarPreview(finalPath || "");
    }
  }
}, [user]);

  return (
    <Modal show={isOpen} onClose={onClose} size="md">
      <AlertComponent
        show={alertDetail.show}
        message={alertDetail.message}
        onClose={() => setAlertDetail({ ...alertDetail, show: false })}
        type={alertDetail.type}
      />
      <Modal.Header>使用者資料設定</Modal.Header>
      <Modal.Body>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 頭像上傳 */}
          <div className="flex flex-col items-center space-y-4">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gray-100">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <FileInput
              accept="image/*"
              onChange={handleAvatarChange}
              helperText="點擊更換頭像"
            />
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="email" value="email" />
            </div>
            <TextInput
              id="email"
              type="email"
              name="email"
              value={formData.email || ""}
              readOnly
              disabled
            />
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="username" value="使用者名稱" />
            </div>
            <TextInput
              id="username"
              type="text"
              name="username"
              value={formData.username || ""}
              onChange={handleChange}
            />
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="newPassword" value="新密碼" />
            </div>
            <TextInput
              id="newPassword"
              type="password"
              name="newPassword"
              value={formData.newPassword || ""}
              onChange={handleChange}
            />
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="confirmPassword" value="確認新密碼" />
            </div>
            <TextInput
              id="confirmPassword"
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword || ""}
              onChange={handleChange}
            />
          </div>

          <div>
            <div className="mb-2 block">
              <Label htmlFor="savePath" value="資料儲存路徑" />
            </div>
            <div className="flex gap-2">
              <TextInput
                id="savePath"
                type="text"
                value={formData.savePath || ""}
                readOnly
                className="flex-1"
              />
              <Button onClick={handleSelectFolder} color="gray">
                選擇
              </Button>
            </div>
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer>
        <div className="w-full flex justify-end gap-2">
          <Button color="gray" onClick={onClose}>
            取消
          </Button>
          <Button color="blue" onClick={handleSubmit}>
            儲存
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default UserSettingsModal;