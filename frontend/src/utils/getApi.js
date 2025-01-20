import axios from "axios";

const initialAddress = 'http://localhost:5000/api';

// 這邊是用來處理API的地方
export const getApi = async (url, method, data) => {
  try {
    const response = await axios({
      method: method,
      url: initialAddress + url,
      data: data,
      headers: {
        'Content-Type': 'application/json'
      }
    });
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

export const getPlotApi = async (url, method, data) => {
  try {
    const response = await axios({
      method: method,
      url: initialAddress + url,
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