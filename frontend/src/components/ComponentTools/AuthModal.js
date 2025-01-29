import React, { useState } from 'react';
import { getApi } from '../../utils/getApi';
import AlertComponent from '../ComponentTools/Alert';
import { useAuthContext } from '../../Contexts/AuthContext';

const useHooks = ({ onClose }) => {
  const { setIsAuth, setAuthDetail } = useAuthContext();
  const [alertDetail, setAlertDetail] = React.useState({});
  const [activeTab, setActiveTab] = useState('login');
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  // 註冊api
  const registerApi = async (data) => {
    const response = await getApi('/auth/register', 'POST', data);
    console.log(response);
    if (response?.status === 'success') {
      setAlertDetail({
        type: 'success',
        message: '註冊成功',
        show: true
      });
      setActiveTab('login');

      setTimeout(() => {
        setAlertDetail({
          ...alertDetail,
          show: false
        });
      }, 3000);
    } else {
      setAlertDetail({
        type: 'failture',
        message: response?.message,
        show: true
      });

      setTimeout(() => {
        setAlertDetail({
          ...alertDetail,
          show: false
        });
      }, 3000);
    }
  };

  // 登入api  
  const loginApi = async (data) => {
    const response = await getApi('/auth/login', 'POST', data);
    console.log(response);
    if (response?.status === 'success') {
      setAlertDetail({
        type: 'success',
        message: '登入成功',
        show: true
      });

      localStorage.setItem('isAuth', true);
      const data = response?.data;
      setAuthDetail(data);
      localStorage.setItem('authDetail', JSON.stringify(data));
      setIsAuth(true);

      setTimeout(() => {
        onClose();
      }, 500);

      setTimeout(() => {
        setAlertDetail({
          ...alertDetail,
          show: false
        });
      }, 3000);
      
    } else {
      setAlertDetail({
        type: 'failture',
        message: response?.data?.message,
        show: true
      });

      setTimeout(() => {
        setAlertDetail({
          ...alertDetail,
          show: false
        });
      }, 3000);
    }
  };

  // 關閉Alert
  const onAlertClose = () => {
    setAlertDetail({
      show: false
    });
  };

  // 表格資料變更
  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  // 登入按鈕
  const handleLogin = async (e) => {
    e.preventDefault();
    console.log('Login:', formData);
    await loginApi(formData);
  };

  // 註冊按鈕
  const handleRegister = async (e) => {
    e.preventDefault();
    console.log('Register:', formData);
    await registerApi(formData);
  };

  return {
    alertDetail,
    setAlertDetail,
    activeTab,
    setActiveTab,
    formData,
    setFormData,
    registerApi,
    loginApi,
    onAlertClose,
    handleChange,
    handleLogin,
    handleRegister
  };
};

const AuthModal = ({ isOpen, onClose }) => {
  const {
    alertDetail, activeTab, setActiveTab, formData,
    onAlertClose, handleChange, handleLogin, handleRegister
  } = useHooks({
    onClose
  });

  return (
      <div className="fixed top-5 right-5 z-[60]">
        <AlertComponent
          show={alertDetail.show}
          message={alertDetail.message}
          onClose={onAlertClose}
          type={alertDetail.type}
        />
      {
        isOpen && (
          <div className="fixed top-0 left-0 right-0 z-50 w-full p-4 overflow-x-hidden overflow-y-auto md:inset-0 h-screen max-h-full bg-gray-900 bg-opacity-50 flex items-center justify-center">
            <div className="relative w-full max-w-md max-h-full">
              <div className="relative bg-white rounded-lg shadow">
                {/* Modal header */}
                <div className="flex items-center justify-between p-4 border-b rounded-t">
                  <div className="flex">
                    <button
                      className={`px-4 py-2 text-sm font-medium ${
                        activeTab === 'login'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-600'
                      }`}
                      onClick={() => setActiveTab('login')}
                    >
                      登入
                    </button>
                    <button
                      className={`px-4 py-2 text-sm font-medium ${
                        activeTab === 'register'
                          ? 'text-blue-600 border-b-2 border-blue-600'
                          : 'text-gray-500 hover:text-gray-600'
                      }`}
                      onClick={() => setActiveTab('register')}
                    >
                      註冊
                    </button>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm p-1.5 ml-auto inline-flex items-center"
                    onClick={onClose}
                  >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                      <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path>
                    </svg>
                  </button>
                </div>
                
                {/* Modal body */}
                <div className="p-6 space-y-6">
                  {activeTab === 'login' ? (
                    <form onSubmit={handleLogin} className="space-y-6">
                      <div>
                        <label htmlFor="username" className="block mb-2 text-sm font-medium text-gray-900">
                          姓名/暱稱
                        </label>
                        <input
                          type="text"
                          name="username"
                          id="username"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                          placeholder="Kevin"
                          required
                          value={formData.username}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="password" className="block mb-2 text-sm font-medium text-gray-900">
                          密碼
                        </label>
                        <input
                          type="password"
                          name="password"
                          id="password"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                          required
                          value={formData.password}
                          onChange={handleChange}
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                      >
                        登入
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleRegister} className="space-y-6">
                      <div>
                        <label htmlFor="register-email" className="block mb-2 text-sm font-medium text-gray-900">
                          電子郵件
                        </label>
                        <input
                          type="email"
                          name="email"
                          id="register-email"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                          placeholder="name@company.com"
                          required
                          value={formData.email}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="register-username" className="block mb-2 text-sm font-medium text-gray-900">
                          姓名/暱稱
                        </label>
                        <input
                          type="text"
                          name="username"
                          id="register-username"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                          required
                          value={formData.username}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="register-password" className="block mb-2 text-sm font-medium text-gray-900">
                          密碼
                        </label>
                        <input
                          type="password"
                          name="password"
                          id="register-password"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                          required
                          value={formData.password}
                          onChange={handleChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="confirm-password" className="block mb-2 text-sm font-medium text-gray-900">
                          確認密碼
                        </label>
                        <input
                          type="password"
                          name="confirmPassword"
                          id="confirm-password"
                          className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                          required
                          value={formData.confirmPassword}
                          onChange={handleChange}
                        />
                      </div>
                      <button
                        type="submit"
                        className="w-full text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
                      >
                        註冊
                      </button>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        )
      }
    </div>
  );
};

export default AuthModal;