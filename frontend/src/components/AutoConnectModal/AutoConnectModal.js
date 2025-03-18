import React, { useState } from 'react';
import { Button, Modal } from "flowbite-react";
import CommonLoading from '../Loading/CommonLoading';
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { getApi } from "../../utils/getApi";
import { useAlicatContext } from '../../Contexts/AlicatContext';
import { useCo2LaserContext } from '../../Contexts/Co2LaserContext';
import { useHeaterContext } from '../../Contexts/HeaterContext';
import { useUltrasonicContext } from '../../Contexts/UltrasonicContext';
import { useAzbilContext } from '../../Contexts/AzbilContext';

const AutoConnectModal = ({
  isMainGasConnected = false,
  isCarrierGasConnected = false,
  isHeaterConnected = false,
  isCo2LaserConnected = false,
  isUltrasonicConnected = false,
  isPowerSupplyConnected = false,
  isOpen = false,
}) => {
  const [openModal, setOpenModal] = useState(isOpen);
  const [isLoading, setIsLoading] = useState(false);
  const { setIsCarrierOpenState, carrierGasPortandAddressState } = useAlicatContext();
  const { setIsCo2LaserOpenState, co2LaserPortState } = useCo2LaserContext();
  const { setIsHeaterOpenState, heaterPortAndAddressState } = useHeaterContext();
  const { setIsUltrasonicOpenState, ultrasonicPortAndAddressState } = useUltrasonicContext();
  const { setIsMainGasOpenState, mainGasPortAndAddressState } = useAzbilContext();

  const onModalClick = async () => {
    try {
      setIsLoading(true);
      if (isCarrierGasConnected) {
        const data = {
          port: carrierGasPortandAddressState.port,
          address: carrierGasPortandAddressState.address,
        };
        const response = await getApi('/alicat_api/connect', 'POST', data, localStorage.getItem('token'));
        if (response.status === 200) {
          setIsCarrierOpenState(true);
        }
      }
      if (isHeaterConnected) {
        const data = {
          port: heaterPortAndAddressState.port,
          address: heaterPortAndAddressState.address,
        };
        const response = await getApi('/heater/connect', 'POST', data, localStorage.getItem('token'));
        if (response.status === 200) {
          setIsHeaterOpenState(true);
        }
      }
      if (isCo2LaserConnected) {
        const data = {
          port: co2LaserPortState.port,
        };
        const response = await getApi('/uc2000/connect', 'POST', data, localStorage.getItem('token'));
        if (response.status === 200) {
          setIsCo2LaserOpenState(true);
        }
      }
      if (isUltrasonicConnected) {
        const data = {
          port: ultrasonicPortAndAddressState.port,
          address: ultrasonicPortAndAddressState.address,
        };
        const response = await getApi('/ultrasonic/connect', 'POST', data, localStorage.getItem('token'));
        if (response.status === 200) {
          setIsUltrasonicOpenState(true);
        }
      }
      if (isMainGasConnected) {
        const data = {
          port: mainGasPortAndAddressState.port,
          address: mainGasPortAndAddressState.address,
        };
        const response = await getApi('/azbil_api/connect', 'POST', data, localStorage.getItem('token'));
        console.log(response)
        if (response.status === 200) {
          setIsMainGasOpenState(true);
        }
      }
      if (isPowerSupplyConnected) {
        const response = await getApi('/power_supply/connect', 'POST', null, localStorage.getItem('token'));
        if (response.status === 200) {
          setIsMainGasOpenState(true);
        }
      }
    } catch {
      console.log("something connect failed.")
    } finally {
      setIsLoading(false);
      setOpenModal(false);
      sessionStorage.setItem("firstEnterPage", true);
    }
  };

  const onModalCancel = async () => {
    setIsCarrierOpenState(false);
    setIsCo2LaserOpenState(false);
    setIsHeaterOpenState(false);
    setIsUltrasonicOpenState(false);
    setIsMainGasOpenState(false);
    setOpenModal(false);
  };

  return (
    <>
    <Modal show={openModal} size="xl" onClose={() => onModalCancel()} popup>
      <Modal.Header />
      <Modal.Body>
        <div className="text-center">
          <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
          <h3 className="mb-5 text-lg font-normal text-gray-500 dark:text-gray-400">
            偵測到前次關閉時的未關閉設備，是否重新連線？
          </h3>
          <div className="flex flex-col gap-2 mb-10">
            {isMainGasConnected && <span className="text-sm text-gray-500 dark:text-gray-400">主氣</span>}
            {isCarrierGasConnected && <span className="text-sm text-gray-500 dark:text-gray-400">載氣</span>}
            {isHeaterConnected && <span className="text-sm text-gray-500 dark:text-gray-400">加熱器</span>}
            {isCo2LaserConnected && <span className="text-sm text-gray-500 dark:text-gray-400">CO2雷射</span>}
            {isUltrasonicConnected && <span className="text-sm text-gray-500 dark:text-gray-400">霧化器</span>}
            {isPowerSupplyConnected && <span className="text-sm text-gray-500 dark:text-gray-400">脈衝電源供應器</span>}
            {isLoading && <span className="text-md text-red-500 font-bold dark:text-red-400">連線等待中，請勿執行任何動作!</span>}
          </div>
          <div className="flex justify-center gap-4">
            <Button color="failure" onClick={() => onModalClick()}>
              {isLoading ? <CommonLoading /> : "全部重新連線"}
            </Button>
            <Button color="gray" onClick={() => onModalCancel()}>
              清除連線狀態
            </Button>
          </div>
        </div>
      </Modal.Body>
    </Modal>
  </>
  );
};

export default AutoConnectModal;