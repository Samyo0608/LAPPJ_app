import { createContext, useContext, useState, useEffect } from "react";

const PowerSupplyContext = createContext();

export const usePowerSupplyContext = () => {
  return useContext(PowerSupplyContext);
};

export const PowerSupplyProvider = ({ children }) => {
  // 從 localStorage 讀取數據時需要解析 JSON
  const [powerSupplyDetailState, setPowersupplyDetailState] = useState(() => {
    const savedDetail = localStorage.getItem("powerSupplyDetailState");
    return savedDetail ? JSON.parse(savedDetail) : {};
  });

  const [isPowerSupplyOpenState, setIsPowerSupplyOpenState] = useState(() => {
    const savedState = localStorage.getItem("isPowerSupplyOpenState");
    return savedState === "true";
  });

  const [powerSupplyPortState, setPowerSupplyPortState] = useState(() => {
    const savedPort = localStorage.getItem("powerSupplyPortState");
    return savedPort ? JSON.parse(savedPort) : {
      port: "",
    };
  });

  // 存儲到 localStorage 時需要轉換為 JSON 字符串
  useEffect(() => {
    localStorage.setItem("powerSupplyDetailState", 
      JSON.stringify(powerSupplyDetailState)
    );
  }, [powerSupplyDetailState]);

  useEffect(() => {
    localStorage.setItem("isPowerSupplyOpenState", 
      isPowerSupplyOpenState.toString()
    );
  }, [isPowerSupplyOpenState]);

  useEffect(() => {
    localStorage.setItem("powerSupplyPortState", 
      JSON.stringify(powerSupplyPortState)
    );
  }, [powerSupplyPortState]);

  return (
    <PowerSupplyContext.Provider
      value={{
        powerSupplyDetailState,
        setPowersupplyDetailState,
        isPowerSupplyOpenState,
        setIsPowerSupplyOpenState,
        powerSupplyPortState,
        setPowerSupplyPortState
      }}
    >
      {children}
    </PowerSupplyContext.Provider>
  );
};


export default PowerSupplyProvider;