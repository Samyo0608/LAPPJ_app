import { createContext, useContext, useState, useEffect } from "react";

const AuthContext = createContext();

export const useAuthContext = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const localStorageAuth = localStorage.getItem("isAuth");
  const [isAuth, setIsAuth] = useState();
  const [authData, setAuthData] = useState({
    email: "",
    username: "",
    id: ""
  });
  const [authDetail, setAuthDetail] = useState({
    email: "",
    username: "",
    id: "",
    photo: "",
    token: ""
  });

  useEffect(() => {
    // 將localstorage的authDetail轉成物件，並存入state，若無則為空物件
    const localAuthDetail = localStorage.getItem("authDetail");
    if (localAuthDetail) {
      setAuthDetail(JSON.parse(localAuthDetail));
    } else {
      setAuthDetail({});
    }
  }, []);

  useEffect(() => {
    // 從 localStorage 讀取數據時需要解析 JSON，轉成布林值
    setIsAuth(localStorageAuth === "true");
  }, [localStorageAuth]);

  return (
    <AuthContext.Provider
      value={{
        isAuth,
        setIsAuth,
        authData,
        setAuthData,
        authDetail,
        setAuthDetail
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


export default AuthContext;