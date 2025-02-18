import { createContext, useContext, useState, useEffect } from "react";

const AzbilContext = createContext();

export const useAzbilContext = () => {
  return useContext(AzbilContext);
};

// 這邊要存取的是 Azbil MFC 的資料
// 包含連線狀態
// 氣體種類的資料
// MFC的數據 (每秒更新)
export const AzbilProvider = ({ children }) => {
  // 從 localStorage 讀取數據時需要解析 JSON
  const [mainGasDetailState, setMainGasDetailState] = useState(() => {
    if (localStorage.getItem("mainGasDetailState") === undefined) {
      return {};
    }
    const savedDetail = localStorage.getItem("mainGasDetailState");
    return savedDetail ? JSON.parse(savedDetail) : {};
  });

  const [isMainGasOpenState, setIsMainGasOpenState] = useState(() => {
    const savedState = localStorage.getItem("isMainGasOpenState");
    return savedState === "true";
  });

  const [mainGasPortAndAddressState, setMainGasPortAndAddressState] = useState(() => {
    const savedPortAddress = localStorage.getItem("mainGasPortAndAddressState");
    return savedPortAddress ? JSON.parse(savedPortAddress) : {
      port: "",
      address: ""
    };
  });

  // 存儲到 localStorage 時需要轉換為 JSON 字符串
  useEffect(() => {
    localStorage.setItem("mainGasDetailState", 
      JSON.stringify(mainGasDetailState)
    );
  }, [mainGasDetailState]);

  useEffect(() => {
    localStorage.setItem("isMainGasOpenState", 
      isMainGasOpenState.toString()
    );
  }, [isMainGasOpenState]);

  useEffect(() => {
    localStorage.setItem("mainGasPortAndAddressState", 
      JSON.stringify(mainGasPortAndAddressState)
    );
  }, [mainGasPortAndAddressState]);

  return (
    <AzbilContext.Provider
      value={{
        mainGasDetailState,
        setMainGasDetailState,
        isMainGasOpenState,
        setIsMainGasOpenState,
        mainGasPortAndAddressState,
        setMainGasPortAndAddressState
      }}
    >
      {children}
    </AzbilContext.Provider>
  );
};


export default AzbilContext;