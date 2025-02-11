import { createContext, useContext, useState, useEffect } from "react";

const UltrasonicContext = createContext();

export const useUltrasonicContext = () => {
  return useContext(UltrasonicContext);
};

export const UltrasonicProvider = ({ children }) => {
  // 從 localStorage 讀取數據時需要解析 JSON
  const [ultrasonicOpenFlag, setUltrasonicOpenFlag] = useState(() => {
    const savedDetail = localStorage.getItem("ultrasonicOpenFlag");
    return savedDetail ? JSON.parse(savedDetail) : {};
  });
  
  const [isUltrasonicOpenState, setIsUltrasonicOpenState] = useState(() => {
    const savedState = localStorage.getItem("isUltrasonicOpenState");
    return savedState === "true";
  });

  const [ultrasonicPortAndAddressState, setUltrasonicPortAndAddressState] = useState(() => {
    const savedPort = localStorage.getItem("ultrasonicPortAndAddressState");
    return savedPort ? JSON.parse(savedPort) : {
      port: "",
      address: ""
    };
  });

  // 存儲到 localStorage 時需要轉換為 JSON 字符串
  useEffect(() => {
    localStorage.setItem("ultrasonicOpenFlag", 
      JSON.stringify(ultrasonicOpenFlag)
    );
  }, [ultrasonicOpenFlag]);

  useEffect(() => {
    localStorage.setItem("isUltrasonicOpenState", 
        isUltrasonicOpenState.toString()
    );
  }, [isUltrasonicOpenState]);

  useEffect(() => {
    localStorage.setItem("ultrasonicPortAndAddressState", 
      JSON.stringify(ultrasonicPortAndAddressState)
    );
  }, [ultrasonicPortAndAddressState]);

  return (
    <UltrasonicContext.Provider
      value={{
        ultrasonicOpenFlag,
        setUltrasonicOpenFlag,
        isUltrasonicOpenState,
        setIsUltrasonicOpenState,
        ultrasonicPortAndAddressState,
        setUltrasonicPortAndAddressState
      }}
    >
      {children}
    </UltrasonicContext.Provider>
  );
};


export default UltrasonicProvider;