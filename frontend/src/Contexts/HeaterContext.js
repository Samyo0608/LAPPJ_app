import { createContext, useContext, useState, useEffect } from "react";

const HeaterContext = createContext();

export const useHeaterContext = () => {
  return useContext(HeaterContext);
};

export const HeaterProvider = ({ children }) => {
  // 從 localStorage 讀取數據時需要解析 JSON
  const [heaterDetailState, setHeaterDetailState] = useState(() => {
    const savedDetail = localStorage.getItem("heaterDetailState");
    return savedDetail ? JSON.parse(savedDetail) : {};
  });

  const [isHeaterOpenState, setIsHeaterOpenState] = useState(() => {
    const savedState = localStorage.getItem("isHeaterOpenState");
    return savedState === "true";
  });

  const [heaterPortAndAddressState, setHeaterPortAndAddressState] = useState(() => {
    const savedPort = localStorage.getItem("heaterPortAndAddressState");
    return savedPort ? JSON.parse(savedPort) : {
      port: "",
    };
  });

  // 存儲到 localStorage 時需要轉換為 JSON 字符串
  useEffect(() => {
    localStorage.setItem("heaterDetailState", 
      JSON.stringify(heaterDetailState)
    );
  }, [heaterDetailState]);

  useEffect(() => {
    localStorage.setItem("isHeaterOpenState", 
        isHeaterOpenState.toString()
    );
  }, [isHeaterOpenState]);

  useEffect(() => {
    localStorage.setItem("heaterPortAndAddressState", 
      JSON.stringify(heaterPortAndAddressState)
    );
  }, [heaterPortAndAddressState]);

  return (
    <HeaterContext.Provider
      value={{
        heaterDetailState,
        setHeaterDetailState,
        isHeaterOpenState,
        setIsHeaterOpenState,
        heaterPortAndAddressState,
        setHeaterPortAndAddressState
      }}
    >
      {children}
    </HeaterContext.Provider>
  );
};


export default HeaterProvider;