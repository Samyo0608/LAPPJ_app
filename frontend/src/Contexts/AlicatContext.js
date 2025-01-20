import { createContext, useContext, useState, useEffect } from "react";

const AlicatContext = createContext();

export const useAlicatContext = () => {
  return useContext(AlicatContext);
};

export const AlicatProvider = ({ children }) => {
  const mfcData = localStorage.getItem("carrierGasDetail");
  const isOpen = localStorage.getItem("alicatMfcOpen");
  const [isAlicatMfcModalOpen, setIsAlicatMfcModalOpen] = useState(false);
  const [carrierGasDetail, setCarrierGasDetail] = useState(
    mfcData ? JSON.parse(mfcData) : []
  );

  const [alicatMfcOpen, setAlicatMfcOpen] = useState(
    isOpen ? JSON.parse(isOpen) : false
  );
};


export default AlicatContext;