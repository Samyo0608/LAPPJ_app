import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
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
  
  // 更新消息的回調函數 - 使用 useCallback 避免重新創建
  const updateMessages = useCallback((data) => {
    setLastMessage(data);
    setMessages(prevMessages => {
      // 檢查是否已有相同設備類型的消息
      const existingIndex = prevMessages.findIndex(msg => 
        msg.type === 'device_status' && msg.data.device_type === data.device_type
      );
      
      if (existingIndex >= 0) {
        // 如果已存在，創建新數組並更新該消息
        const newMessages = [...prevMessages];
        newMessages[existingIndex] = {
          type: 'device_status',
          data,
          timestamp: new Date()
        };
        return newMessages;
      } else {
        // 如果不存在，添加新消息
        return [...prevMessages, {
          type: 'device_status',
          data,
          timestamp: new Date()
        }];
      }
    });
  }, []);
  
  // 初始化 Socket 連接 - 移除 messages 依賴
  useEffect(() => {
    console.log('初始化 Socket.IO 連接到', url);
    
    // 建立 Socket 實例
    const socketInstance = io(url, {
      transports: ['websocket', 'polling'], // 添加 polling 作為備選
      autoConnect: true,
      reconnection: true
    });
    
    // 設置連接事件處理程序
    socketInstance.on('connect', () => {
      console.log('Socket.IO 已連接！', socketInstance.id);
      setIsConnected(true);
    });
    
    socketInstance.on('disconnect', () => {
      console.log('Socket.IO 已斷開連接！');
      setIsConnected(false);
    });
    
    socketInstance.on('connect_error', (error) => {
      console.error('Socket.IO 連接錯誤:', error);
    });
    
    // 監聽設備狀態更新
    socketInstance.on('device_status_update', (data) => {
      console.log('收到設備狀態更新:', data);
      updateMessages(data);
    });
    
    // 保存 Socket 實例
    setSocket(socketInstance);
    
    // 清理函數
    return () => {
      console.log('清理 Socket.IO 連接');
      socketInstance.disconnect();
    };
  }, [url, updateMessages]); // 移除 messages 依賴
  
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