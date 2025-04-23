import { createContext, useContext, useState, useEffect } from "react";

const RobotArmContext = createContext();

export const useRobotArmContext = () => {
  return useContext(RobotArmContext);
};

export const RobotArmProvider = ({ children }) => {
  // 從 localStorage 讀取數據時需要解析 JSON
  const [robotArmDetailState, setRobotArmDetailState] = useState(() => {
    const savedDetail = localStorage.getItem("robotArmDetailState");
    return savedDetail ? JSON.parse(savedDetail) : {};
  });

  const [isRobotArmOpenState, setIsRobotArmOpenState] = useState(() => {
    const savedState = localStorage.getItem("isRobotArmOpenState");
    return savedState === "true";
  });

  const [robotArmIpState, setRobotArmIpState] = useState(() => {
    const savedPort = localStorage.getItem("robotArmIpState");
    return savedPort ? JSON.parse(savedPort) : "";
  });

  // 存儲到 localStorage 時需要轉換為 JSON 字符串
  useEffect(() => {
    localStorage.setItem("robotArmDetailState", 
      JSON.stringify(robotArmDetailState)
    );
  }, [robotArmDetailState]);

  useEffect(() => {
    localStorage.setItem("isRobotArmOpenState", 
      isRobotArmOpenState.toString()
    );
  }, [isRobotArmOpenState]);

  useEffect(() => {
    localStorage.setItem("robotArmIpState", 
      JSON.stringify(robotArmIpState)
    );
  }, [robotArmIpState]);

  return (
    <RobotArmContext.Provider
      value={{
        robotArmDetailState,
        setRobotArmDetailState,
        isRobotArmOpenState,
        setIsRobotArmOpenState,
        robotArmIpState,
        setRobotArmIpState
      }}
    >
      {children}
    </RobotArmContext.Provider>
  );
};


export default RobotArmProvider;