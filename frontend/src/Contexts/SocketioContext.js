// src/contexts/SocketContext.js
import React, { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';

// 創建 Context
const SocketContext = createContext(null);

// Context Provider 組件
export const SocketProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([]);
  const [lastMessage, setLastMessage] = useState(null);
  const url = process.env.REACT_APP_PUBLIC_URL || 'http://localhost:5555';
  
  console.log("REACT_APP_PUBLIC_URL", process.env.REACT_APP_PUBLIC_URL);

  // 初始化 Socket 連接q
  useEffect(() => {
    // 建立 Socket 實例
    const socketInstance = io(url, {
      transports: ['websocket'],
      autoConnect: true
    });

    
    // 設置連接事件處理程序
    socketInstance.on('connect', () => {
      console.log('Socket.IO 已連接！');
      setIsConnected(true);
    });
    
    socketInstance.on('disconnect', () => {
      console.log('Socket.IO 已斷開連接！');
      setIsConnected(false);
    });
    
    // 處理接收到的訊息
    // 這裡以 'api_response' 為例，您可以添加更多不同類型的事件
    socketInstance.on('api_response', (data) => {
      console.log('收到 API 回應:', data);
      setLastMessage(data);
      setMessages(prev => [...prev, { type: 'api_response', data, timestamp: new Date() }]);
    });
    
    socketInstance.on('api_error', (data) => {
      console.log('收到 API 錯誤:', data);
      setLastMessage(data);
      setMessages(prev => [...prev, { type: 'api_error', data, timestamp: new Date() }]);
    });
    
    socketInstance.on('device_status_update', (data) => {
      console.log('收到設備狀態更新:', data);
      setLastMessage(data);
      setMessages(prev => [...prev, { type: 'device_status', data, timestamp: new Date() }]);
    });
    
    // 保存 Socket 實例
    setSocket(socketInstance);
    
    // 清理函數
    return () => {
      socketInstance.disconnect();
    };
  }, []);
  
  // 提供給 Context 的值
  const contextValue = {
    socket,
    isConnected,
    messages,
    lastMessage,
    // 添加發送訊息的方法
    sendMessage: (eventName, data) => {
      if (socket && socket.connected) {
        socket.emit(eventName, data);
        return true;
      }
      return false;
    },
    // 清除訊息歷史
    clearMessages: () => setMessages([])
  };
  
  return (
    <SocketContext.Provider value={contextValue}>
      {children}
    </SocketContext.Provider>
  );
};

// 自定義 Hook 來使用 Context
export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket 必須在 SocketProvider 內使用');
  }
  return context;
};