import { createContext, useContext, useState, useEffect } from "react";

const AlicatContext = createContext();

export const useAlicatContext = () => {
  return useContext(AlicatContext);
};

// 這邊要存取的是 Alicat MFC 的資料
// 包含連線狀態
// 氣體種類的資料
// MFC的數據 (每秒更新)
export const AlicatProvider = ({ children }) => {
  // 從 localStorage 讀取數據時需要解析 JSON
  const [carrierGasDetailState, setCarrierGasDetailState] = useState(() => {
    if (localStorage.getItem("carrierGasDetailState") === undefined) {
      return {};
    }
    const savedDetail = localStorage.getItem("carrierGasDetailState");
    return savedDetail ? JSON.parse(savedDetail) : {};
  });

  const [isCarrierGasOpenState, setIsCarrierOpenState] = useState(() => {
    const savedState = localStorage.getItem("isCarrierGasOpenState");
    return savedState === "true";
  });

  const [carrierGasTypeState, setCarrierGasTypeState] = useState(() => {
    const savedType = localStorage.getItem("carrierGasTypeState");
    return savedType ? JSON.parse(savedType) : [];
  });

  const [carrierGasPortandAddressState, setCarrierGasPortandAddressState] = useState(() => {
    const savedPortAddress = localStorage.getItem("carrierGasPortandAddressState");
    return savedPortAddress ? JSON.parse(savedPortAddress) : {
      port: "",
      address: ""
    };
  });

  // 存儲到 localStorage 時需要轉換為 JSON 字符串
  useEffect(() => {
    localStorage.setItem("carrierGasDetailState", 
      JSON.stringify(carrierGasDetailState)
    );
  }, [carrierGasDetailState]);

  useEffect(() => {
    localStorage.setItem("isCarrierGasOpenState", 
      isCarrierGasOpenState.toString()
    );
  }, [isCarrierGasOpenState]);

  useEffect(() => {
    localStorage.setItem("carrierGasTypeState", 
      JSON.stringify(carrierGasTypeState)
    );
  }, [carrierGasTypeState]);

  useEffect(() => {
    localStorage.setItem("carrierGasPortandAddressState", 
      JSON.stringify(carrierGasPortandAddressState)
    );
  }, [carrierGasPortandAddressState]);

  return (
    <AlicatContext.Provider
      value={{
        carrierGasDetailState,
        setCarrierGasDetailState,
        isCarrierGasOpenState,
        setIsCarrierOpenState,
        carrierGasTypeState,
        setCarrierGasTypeState,
        carrierGasPortandAddressState,
        setCarrierGasPortandAddressState
      }}
    >
      {children}
    </AlicatContext.Provider>
  );
};


export default AlicatContext;