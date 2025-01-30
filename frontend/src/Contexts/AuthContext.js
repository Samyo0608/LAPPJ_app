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
  const [authDetail, setAuthDetail] = useState(() => {
    const storedAuthDetail = localStorage.getItem("authDetail");
    return storedAuthDetail ? JSON.parse(storedAuthDetail) : {
      email: "",
      username: "",
      id: "",
      photo_path: "",
      token: ""
    };
  });

  // 監聽 localStorage 變更，確保 `authDetail` 更新
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedAuthDetail = localStorage.getItem("authDetail");
      if (updatedAuthDetail) {
        setAuthDetail(JSON.parse(updatedAuthDetail));
      }
    };

    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (localStorageAuth) {
      setIsAuth(localStorageAuth === "true");
    } else {
      setIsAuth(false);
    }
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