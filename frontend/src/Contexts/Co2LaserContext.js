import { createContext, useContext, useState, useEffect } from "react";

const Co2LaserContext = createContext();

export const useCo2LaserContext = () => {
  return useContext(Co2LaserContext);
};

export const Co2LaserProvider = ({ children }) => {
  // 從 localStorage 讀取數據時需要解析 JSON
  const [co2LaserDetailState, setCo2LaserDetailState] = useState(() => {
    const savedDetail = localStorage.getItem("co2LaserDetailState");
    return savedDetail ? JSON.parse(savedDetail) : {};
  });

  const [isCo2LaserOpenState, setIsCo2LaserOpenState] = useState(() => {
    const savedState = localStorage.getItem("isCo2LaserOpenState");
    return savedState === "true";
  });

  const [co2LaserPortState, setCo2LaserPortState] = useState(() => {
    const savedPort = localStorage.getItem("co2LaserPortState");
    return savedPort ? JSON.parse(savedPort) : {
      port: "",
    };
  });

  // 存儲到 localStorage 時需要轉換為 JSON 字符串
  useEffect(() => {
    localStorage.setItem("co2LaserDetailState", 
      JSON.stringify(co2LaserDetailState)
    );
  }, [co2LaserDetailState]);

  useEffect(() => {
    localStorage.setItem("isCo2LaserOpenState", 
      isCo2LaserOpenState.toString()
    );
  }, [isCo2LaserOpenState]);

  useEffect(() => {
    localStorage.setItem("co2LaserPortState", 
      JSON.stringify(co2LaserPortState)
    );
  }, [co2LaserPortState]);

  return (
    <Co2LaserContext.Provider
      value={{
        co2LaserDetailState,
        setCo2LaserDetailState,
        isCo2LaserOpenState,
        setIsCo2LaserOpenState,
        co2LaserPortState,
        setCo2LaserPortState
      }}
    >
      {children}
    </Co2LaserContext.Provider>
  );
};


export default Co2LaserProvider;