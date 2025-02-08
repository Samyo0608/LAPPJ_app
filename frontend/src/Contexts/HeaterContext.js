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

  const [heaterPortState, setHeaterPortState] = useState(() => {
    const savedPort = localStorage.getItem("heaterPortState");
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
    localStorage.setItem("heaterPortState", 
      JSON.stringify(heaterPortState)
    );
  }, [heaterPortState]);

  return (
    <HeaterContext.Provider
      value={{
        heaterDetailState,
        setHeaterDetailState,
        isHeaterOpenState,
        setIsHeaterOpenState,
        heaterPortState,
        setHeaterPortState
      }}
    >
      {children}
    </HeaterContext.Provider>
  );
};


export default HeaterProvider;