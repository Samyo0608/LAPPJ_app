import axios from "axios";

const backendPort = "http://localhost:5555/api";

// **刷新 Token**
export const refreshToken = async () => {
  try {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) return null;

    const response = await axios.post(`${backendPort}/auth/refresh`, {}, {
      headers: { 'Authorization': `Bearer ${refreshToken}` }
    });

    const newAccessToken = response.data.access_token;
    // 更新localStorage中的authDetail
    const authDetail = JSON.parse(localStorage.getItem("authDetail"));
    authDetail.token = newAccessToken;
    localStorage.setItem("authDetail", JSON.stringify(authDetail));
    return newAccessToken;
  } catch (error) {
    console.error("刷新 Token 失敗:", error);
    return null;
  }
};

// 這邊是用來處理API的地方
export const getApi = async (url, method, data, token) => {
  try {
    const response = await axios({
      method: method,
      url: backendPort + url,
      data: data,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error(error);

    if (error.response.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        return getApi(url, method, data, newToken); // **使用新 Token 重新請求**
      }
    }

    return {
      data: error.response.data,
      status: 'error',
      message: 'api接收錯誤'
    }
  }
};

export const getPlotApi = async (url, method, data) => {
  try {
    const response = await axios({
      method: method,
      url: backendPort + url,
      data: data,
      responseType: 'blob'
      }
    );
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error(error);
    return {
      status: 'error',
      message: 'api接收錯誤'
    }
  }
};

export const photoApi = async (url, method, formData, token) => {
  try {
    const response = await axios({
      method: method,
      url: backendPort + url,
      data: formData,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    return {
      status: 'success',
      data: response.data
    };
  } catch (error) {
    console.error('Upload Error:', error.response || error);

    if (error.response.status === 401) {
      const newToken = await refreshToken();
      if (newToken) {
        return photoApi(url, method, formData, newToken); // **使用新 Token 重新請求**
      }
    }

    return {
      status: 'error',
      message: error.response?.data?.message || '圖片上傳失敗'
    }
  }
};