import React from 'react';
import { Alert } from "flowbite-react";
import { TiTick } from "react-icons/ti";
import { HiInformationCircle } from "react-icons/hi";

const AlertComponent = ({ show, message, onClose, type }) => {
  return (
    <div
      className={`
        fixed top-10 left-1/2 z-50 transform -translate-x-1/2
        transition-all duration-500 ease-in-out
        ${show 
          ? 'opacity-100 translate-y-0 pointer-events-auto ease-out' 
          : 'opacity-0 -translate-y-5 pointer-events-none ease-in'}
      `}
    >
      <Alert
        color={type}
        onDismiss={onClose} // 提供關閉功能
        className="rounded-lg shadow-md"
      >
        <div className="flex items-center">
          {type === "success" ? <TiTick className="text-green-500" /> : <HiInformationCircle className="text-blue-500" />}
          <span className="font-medium">{message}</span>
        </div>
      </Alert>
    </div>
  );
};

export default AlertComponent;