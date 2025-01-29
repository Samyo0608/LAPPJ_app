import React, { useState } from 'react';
import { getApi } from '../../utils/getApi';

const UserSettingsModal = ({ isOpen, onClose, user }) => {
  const [formData, setFormData] = useState({
    email: user?.email || '',
    username: user?.username || '',
    newPassword: '',
    confirmPassword: '',
    avatarPath: user?.avatarPath || '',
    dataPath: user?.dataPath || ''
  });

  const [avatarPreview, setAvatarPreview] = useState(user?.avatarPath || '');

  // 處理表單變更
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 處理頭像上傳
  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result);
        setFormData({
          ...formData,
          avatarPath: file
        });
      };
      reader.readAsDataURL(file);
    }
  };

  // 選擇資料儲存路徑
  const handleSelectFolder = async () => {
    try {
      const path = await window.electron.selectFolder();
      if (path) {
        setFormData({
          ...formData,
          dataPath: path
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
      alert('新密碼與確認密碼不符');
      return;
    }

    try {
      const response = await getApi('/user/settings', 'PUT', formData);
      if (response?.status === 'success') {
        alert('設定已更新');
        onClose();
      } else {
        alert(response?.message || '更新失敗');
      }
    } catch (error) {
      console.error('更新設定失敗:', error);
      alert('更新設定失敗');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">用戶設定</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 頭像上傳 */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-200 mb-2">
              {avatarPreview ? (
                <img
                  src={avatarPreview}
                  alt="Avatar preview"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <input
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
              id="avatar-upload"
            />
            <label
              htmlFor="avatar-upload"
              className="bg-blue-500 text-white px-4 py-2 rounded-md cursor-pointer hover:bg-blue-600"
            >
              更換頭像
            </label>
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              電子郵件
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              readOnly
              className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm text-gray-700"
            />
          </div>

          {/* 用戶名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              用戶名稱
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 新密碼 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              新密碼
            </label>
            <input
              type="password"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 確認新密碼 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              確認新密碼
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 資料儲存路徑 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              資料儲存路徑
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.dataPath}
                readOnly
                className="mt-1 block w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-md shadow-sm"
              />
              <button
                type="button"
                onClick={handleSelectFolder}
                className="mt-1 bg-gray-500 text-white px-4 py-2 rounded-md hover:bg-gray-600"
              >
                選擇
              </button>
            </div>
          </div>

          {/* 提交按鈕 */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserSettingsModal;