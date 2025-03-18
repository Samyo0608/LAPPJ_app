import React, { useState, useRef } from 'react';
import { Modal, Button, Label, Select, TextInput, Progress, Timeline, Spinner } from 'flowbite-react';
import { HiCheck, HiTrash, HiOutlineArrowNarrowUp } from 'react-icons/hi';
import {
  setMainGasApi,
  setMainGasOnOffApi,
  setCarrierGasApi,
  setCarrierGasOffApi,
  setCo2LaserApi,
  setCo2LaserOnOffApi,
  setHeaterApi,
  setUltrasonicApi,
  setPowerSupplyApi,
  setPowerSupplyDc1Api,
  setPowerSupplyPowerApi
} from '../../utils/apiForControlSetting';
import { useAlicatContext } from '../../Contexts/AlicatContext';
import { useCo2LaserContext } from '../../Contexts/Co2LaserContext';
import { useHeaterContext } from '../../Contexts/HeaterContext';
import { useUltrasonicContext } from '../../Contexts/UltrasonicContext';
import { usePowerSupplyContext } from '../../Contexts/PowerSupplyContext';
import { useAzbilContext } from '../../Contexts/AzbilContext';

const ControllerSettingModal = ({ show, onClose }) => {
  const { isCarrierGasOpenState } = useAlicatContext();
  const { isCo2LaserOpenState, co2LaserDetailState } = useCo2LaserContext();
  const { isHeaterOpenState, heaterDetailState } = useHeaterContext();
  const { isUltrasonicOpenState, setUltrasonicOpenFlag } = useUltrasonicContext();
  const { isPowerSupplyOpenState } = usePowerSupplyContext();
  const { isMainGasOpenState, mainGasDetailState } = useAzbilContext();
  const [isEmptyStepOrValue, setIsEmptyStepOrValue] = useState(false);
  const [currentStep, setCurrentStep] = useState('settings'); // 'settings' or 'progress'
  const [selectedSteps, setSelectedSteps] = useState([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [executedSteps, setExecutedSteps] = useState([]);
  const [errorHandling, setErrorHandling] = useState('continue'); // 'continue' or 'break'
  const [isStopRequested, setIsStopRequested] = useState(false);
  const [waitingTime, setWaitingTime] = useState(null); // 新增等待時間狀態
  const [progressErrorMessage, setProgressErrorMessage] = useState("");
  const abortControllerRef = useRef(null);
  const animationFrameRef = useRef(null);

  const availableSteps = [
    { id: 'laserOn', name: '開啟雷射', value: 'laserOn', item: 'Co2laser', isVisiable: isCo2LaserOpenState },
    { id: 'laserOff', name: '關閉雷射', value: 'laserOff', item: 'Co2laser', isVisiable: isCo2LaserOpenState },
    { id: 'laserPower', name: '設定功率(%)', value: 'laserPower', needsValue: true, item: 'Co2laser', isVisiable: isCo2LaserOpenState },
    { id: 'carrierGasOff', name: '關閉載氣', value: 'carrierGasOff', item: 'carrierGas', isVisiable: isCarrierGasOpenState },
    { id: 'carrierGasValue', name: '調整載氣流量(slm)', value: 'carrierGasValue', needsValue: true, item: 'carrierGas', isVisiable: isCarrierGasOpenState },
    { id: 'mainGasOn', name: '開啟主氣', value: 'mainGasOn', item: 'mainGas', isVisiable: isMainGasOpenState },
    { id: 'mainGasOff', name: '關閉主氣', value: 'mainGasOff', item: 'mainGas', isVisiable: isMainGasOpenState },
    { id: 'mainGasFullOpen', name: '主氣全開', value: 'mainGasFullOpen', item: 'mainGas', isVisiable: isMainGasOpenState },
    { id: 'mainGasValue', name: '調整主氣流量(注意單位)', value: 'mainGasValue', needsValue: true, item: 'mainGas', isVisiable: isMainGasOpenState },
    {id: 'heaterTemp', name: '加熱器溫度調整', value: 'heaterTemp', needsValue: true, item: 'heater', isVisiable: isHeaterOpenState },
    {id: 'heaterOff', name: '關閉加熱器', value: 'heaterOff', item: 'heater', isVisiable: isHeaterOpenState },
    { id: 'powerSupplyOn', name: '開啟脈衝電源控制器', value: 'powerSupplyOn', item: 'powerSupply', isVisiable: isPowerSupplyOpenState },
    { id: 'powerSupplyOff', name: '關閉脈衝電源控制器', value: 'powerSupplyOff', item: 'powerSupply', isVisiable: isPowerSupplyOpenState },
    { id: 'powerSupplyDc1Value', name: '調整脈衝-DC1電壓(V)', value: 'powerSupplyDc1Value', needsValue: true, item: 'powerSupply', isVisiable: isPowerSupplyOpenState },
    { id: 'dc1On', name: 'DC1升壓', value: 'dc1On', item: 'powerSupply', isVisiable: isPowerSupplyOpenState },
    { id: 'dc1Off', name: 'DC1降壓', value: 'dc1Off', item: 'powerSupply', isVisiable: isPowerSupplyOpenState },
    { id: 'ultrasonicOn', name: '開啟霧化器', value: 'ultrasonicOn', item: 'ultrasonic', isVisiable: isUltrasonicOpenState },
    { id: 'ultrasonicOff', name: '關閉霧化器', value: 'ultrasonicOff', item: 'ultrasonic', isVisiable: isUltrasonicOpenState },
    { id: 'wait', name: '等待時間(sec)', value: 'wait', needsValue: true, item: 'wait', isVisiable: true },
    {id: 'end', name: '完成', value: 'end', item: 'end' },
  ];

  const animateProgress = (start, end, callback) => {
    const duration = 1000;
    const startTime = performance.now();

    const animate = (currentTime) => {
      if (isStopRequested) {
        cancelAnimationFrame(animationFrameRef.current);
        return;
      }

      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const currentProgress = start + (end - start) * easeProgress;
      
      setCurrentProgress(currentProgress);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        callback?.();
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);
  };

  const handleAddStep = () => {
    setSelectedSteps([...selectedSteps, { type: '', value: '' }]);
  };

  const handleStepChange = (index, type, value = '') => {
    if (isEmptyStepOrValue) {
      setIsEmptyStepOrValue(false);
    }

    // 驗證輸入值
    if (type === 'laserPower') {
      const maxPwm = co2LaserDetailState.max_pwm_95 ? 95 : 99;
      const power = Number(value);
      if (power > maxPwm) {
        setProgressErrorMessage(`雷射功率不能超過 ${maxPwm}%`);
        return;
      }
      if (value && power % 0.5 !== 0) {
        setProgressErrorMessage('雷射功率必須是 0.5 的倍數');
        return;
      }
    }

    if (type === 'powerSupplyDc1Value' && value) {
      if (!Number.isInteger(Number(value))) {
        setProgressErrorMessage('電壓值必須是整數');
        return;
      }
    }

    const newSteps = [...selectedSteps];
    newSteps[index] = { type, value };
    setSelectedSteps(newSteps);
  };

  const checkStepRules = (steps) => {
    // 檢查 Power 相關規則
    const powerOnIndex = steps.findIndex(step => step.type === 'powerSupplyOn');
    const mainGasFullOpenIndex = steps.findIndex(step => step.type === 'mainGasFullOpen');
  
    if (powerOnIndex !== -1) {
      // 規則 1 & 2: Power 開啟前必須要有全開主氣
      if (mainGasFullOpenIndex === -1 || mainGasFullOpenIndex > powerOnIndex) {
        return '開啟電壓 Power 前必須先全開主氣';
      }
    }
  
    // 規則 5: Power on 時不能使用 dc1On/dc1Off
    let isPowerOn = false;
    for (let i = 0; i < steps.length; i++) {
      if (steps[i].type === 'powerSupplyOn') {
        isPowerOn = true;
      } else if (steps[i].type === 'powerSupplyOff') {
        isPowerOn = false;
      } else if (isPowerOn && (steps[i].type === 'dc1On' || steps[i].type === 'dc1Off')) {
        return 'Power 開啟時不能使用 DC1 升/降壓功能';
      }
    }
  
    // 規則 3 & 4: 檢查雷射功率
    const maxPwm = co2LaserDetailState.max_pwm_95 ? 95 : 99;
    for (const step of steps) {
      if (step.type === 'laserPower') {
        const power = Number(step.value);
        if (power > maxPwm) {
          return `雷射功率不能超過 ${maxPwm}%`;
        }
        if (power % 0.5 !== 0) {
          return '雷射功率必須是 0.5 的倍數';
        }
      }
    }
  
    // 規則 6: 檢查電壓值是否為整數
    for (const step of steps) {
      if (step.type === 'powerSupplyDc1Value') {
        if (!Number.isInteger(Number(step.value))) {
          return '電壓值必須是整數';
        }
      }
    }
  
    return null;
  };
  
  const handleStartExecution = () => {
    setIsEmptyStepOrValue(false);
  
    // 檢查是否有未選擇的步驟以及未輸入數值
    if (selectedSteps.some(step => !step.type || (availableSteps.find(s => s.value === step.type)?.needsValue && !step.value))) {
      setIsEmptyStepOrValue(true);
      return;
    }
  
    // 檢查規則
    const errorMessage = checkStepRules(selectedSteps);
    if (errorMessage) {
      setProgressErrorMessage(errorMessage);
      return;
    }
  
    setCurrentStep('progress');
    setCurrentProgress(0);
    setExecutedSteps([]);
    setIsStopRequested(false);
    simulateExecution();
  };
  

  const hnandleReturnSettingPage = () => {
    setCurrentStep('settings');
    setCurrentProgress(0);
    setIsStopRequested(false);
    setExecutedSteps([]);
  };

  const handleRestartExecution = () => {
    const resetStates = new Promise(resolve => {
      setIsStopRequested(false);
      setCurrentProgress(0);
      setExecutedSteps([]);
      
      // 清理控制器
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
        abortControllerRef.current = null;
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
  
      // 使用 requestAnimationFrame 確保狀態更新
      requestAnimationFrame(() => {
        resolve();
      });
    });
  
    // 等待狀態重置後執行
    resetStates.then(() => {
      simulateExecution();
    });
  };

  const handleStopExecution = () => {
    setIsStopRequested(true);
    setWaitingTime(null);  // 清理等待時間
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    
    // 更新進度和執行步驟
    animateProgress(currentProgress, 100, () => {
      setExecutedSteps(prev => [
        ...prev,
        { type: 'end', name: '中斷流程', value: '流程已中斷', error: true }
      ]);
      abortControllerRef.current = null;
    });
  };

  const simulateExecution = async () => {
    const totalSteps = selectedSteps.length;
    abortControllerRef.current = new AbortController();


    const executeStep = async (index) => {
      if (isStopRequested || abortControllerRef.current.signal.aborted) {
        return;
      }

      if (index >= totalSteps) {
        animateProgress(currentProgress, 100);
        return;
      }

      const step = selectedSteps[index];
      
      try {
        let response;
        
        // 使用 AbortController 來控制 API 呼叫
        const timeoutId = setTimeout(() => {
          if (!isStopRequested) {
            abortControllerRef.current.abort();
          }
        }, 30000); // 30 秒逾時

        switch (step.type) {
          case 'laserOn':
            response = await setCo2LaserOnOffApi(true);
            break;
          case 'laserOff':
            response = await setCo2LaserOnOffApi(false);
            break;
          case 'laserPower':
            response = await setCo2LaserApi(Number(step.value));
            break;
          case 'carrierGasOff':
            response = await setCarrierGasOffApi();
            break;
          case 'carrierGasValue':
            response = await setCarrierGasApi(Number(step.value));
            break;
          case 'mainGasOn':
            response = await setMainGasOnOffApi('control');
            break;
          case 'mainGasOff':
            response = await setMainGasOnOffApi('off');
            break;
          case 'mainGasFullOpen':
            response = await setMainGasOnOffApi('full');
            break;
          case 'mainGasValue':
            response = await setMainGasApi(Number(step.value), mainGasDetailState);
            break;
          case 'heaterTemp':
            response = await setHeaterApi(Number(step.value), heaterDetailState.decimal_point);
            break;
          case 'heaterOff':
            response = await setHeaterApi(25, heaterDetailState.decimal_point);
            break;
          case 'powerSupplyOn':
            response = await setPowerSupplyPowerApi(true);
            break;
          case 'powerSupplyOff':
            response = await setPowerSupplyPowerApi(false);
            break;
          case 'powerSupplyDc1Value':
            response = await setPowerSupplyApi(Number(step.value));
            break;
          case 'dc1On':
            response = await setPowerSupplyDc1Api(true);
            break;
          case 'dc1Off':
            response = await setPowerSupplyDc1Api(false);
            break;
          case 'ultrasonicOn':
            response = await setUltrasonicApi(true);
            if (response?.data?.status === "success") {
              setUltrasonicOpenFlag(false);
            } else {
              setUltrasonicOpenFlag(true);
            }
            break;
          case 'ultrasonicOff':
            response = await setUltrasonicApi(false);
            if (response?.data?.status === "success") {
              setUltrasonicOpenFlag(false);
            }
            break;
          case 'wait':
            console.log('等待時間:', step.value);
            const waitSeconds = Number(step.value);
            let timeoutId;
            
            try {
              await new Promise((resolve, reject) => {
                setWaitingTime(waitSeconds);
                const startTime = Date.now();
                
                const updateCountdown = () => {
                  if (isStopRequested) {
                    clearTimeout(timeoutId);
                    setWaitingTime(null);
                    reject(new Error('使用者中斷執行'));
                    return;
                  }
          
                  const elapsedTime = Math.floor((Date.now() - startTime) / 1000);
                  const remainingTime = waitSeconds - elapsedTime;
                  
                  if (remainingTime <= 0) {
                    setWaitingTime(null);
                    resolve();
                  } else {
                    setWaitingTime(remainingTime);
                    timeoutId = setTimeout(updateCountdown, 1000);
                  }
                };
                
                updateCountdown();
              });
              
              response = { status: 'success' };
            } catch (error) {
              if (error.message === '使用者中斷執行') {
                throw error;
              }
            } finally {
              clearTimeout(timeoutId);
              setWaitingTime(null);
            }
            break;
          default:
        }

        clearTimeout(timeoutId);

        if (response?.status === 'success') {
          setExecutedSteps(prev => [...prev, step]);
          
          const currentPercent = (index / totalSteps) * 100;
          const targetPercent = ((index + 1) / totalSteps) * 100;
          
          animateProgress(currentPercent, targetPercent, () => {
            if (!isStopRequested) {
              setTimeout(() => executeStep(index + 1), 0);
            }
          });
        } else {
          throw new Error(`步驟 ${availableSteps.find(s => s.value === step.type)?.name} 執行失敗`);
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          console.log('執行被中斷');
          return;
        }

        console.error(`執行步驟 ${step.type} 時發生錯誤:`, error);
        setExecutedSteps(prev => [...prev, { ...step, error: true }]);

        if (errorHandling === 'break') {
          animateProgress(currentProgress, 100, () => {
            setExecutedSteps(prev => [
              ...prev,
              { type: 'end', name: '完成', value: '遇到錯誤已停止', error: true }
            ]);
          });
          return;
        }

        const currentPercent = (index / totalSteps) * 100;
        const targetPercent = ((index + 1) / totalSteps) * 100;
        
        animateProgress(currentPercent, targetPercent, () => {
          if (!isStopRequested) {
            setTimeout(() => executeStep(index + 1), 0);
          }
        });
      }
    };

    await executeStep(0);
  };

  React.useEffect(() => {
    if (currentProgress === 100 && executedSteps.length === selectedSteps.length) {
      setExecutedSteps((prev) => [
        ...prev,
        {type: 'end', name: '完成', value: '流程結束'},
      ]);
    }
  }, [currentProgress, executedSteps, selectedSteps]);

  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  return (
    <Modal show={show} onClose={onClose} size="4xl">
      <Modal.Header>控制設定</Modal.Header>
      <Modal.Body>
        {currentStep === 'settings' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Label htmlFor="errorHandling" className="w-32">
                錯誤處理方式：
              </Label>
              <Select 
                id="errorHandling"
                value={errorHandling}
                onChange={(e) => setErrorHandling(e.target.value)}
                className="flex-1"
              >
                <option value="continue">繼續執行下一步驟</option>
                <option value="break">中斷執行</option>
              </Select>
            </div>
            {selectedSteps.map((step, index) => (
              <div key={index} className="flex gap-4 items-center">
                <Label
                  className='w-12'
                >
                  步驟 {index + 1}
                </Label>
                <Button
                  color="none"
                  onClick={() => setSelectedSteps(selectedSteps.filter((_, i) => i !== index))}
                  className='w-12'
                >
                  <HiTrash
                    className="text-xl text-red-500 cursor-pointer"
                    style={{ verticalAlign: 'middle' }}
                  />
                </Button>
                <Select
                  className={`flex-1 ${
                    (!step.type && isEmptyStepOrValue) ? 'border-red-500' : ''
                  }`}
                  value={step.type}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                >
                  <option value="">選擇動作</option>
                  {availableSteps.filter((option) => option.isVisiable).map((option) => (
                    <option 
                      key={option.id} 
                      value={option.value}
                      className={
                        option.value === 'powerSupplyOn' && 
                        !selectedSteps.some(s => s.type === 'mainGasFullOpen' && 
                        selectedSteps.indexOf(s) < index) ? 
                        'text-red-500' : ''
                      }
                    >
                      {option.name}
                    </option>
                  ))}
                </Select>
                {availableSteps.find(s => s.value === step.type)?.needsValue && (
                  <div className="relative w-32">
                    <TextInput
                      type="number"
                      placeholder="數值"
                      value={step.value}
                      onChange={(e) => handleStepChange(index, step.type, e.target.value)}
                    />
                  </div>
                )}
              </div>
            ))}
            <Button onClick={handleAddStep}>新增步驟</Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="sticky top-0 bg-white z-10 pb-4">
              <Progress 
                progress={currentProgress} 
                className="transition-all duration-500 ease-in-out" 
                size="lg"
              />
              <div className="mt-2">
                <Label>
                  目前執行：{availableSteps.find(s => s.value === selectedSteps[executedSteps.length]?.type)?.name || '完成'}
                </Label>
              </div>
            </div>
            <div className="max-h-[300px] overflow-y-auto relative">
              <Timeline
                theme={{
                  root: {
                    direction: {
                      horizontal: "flex flex-col md:flex-row",
                      vertical: "flex flex-col"
                    }
                  },
                  item: {
                    content: {
                      base: "mt-2 md:mt-0"
                    },
                    point: {
                      marker: {
                        base: {
                          horizontal: "h-6 w-6 rounded-full outline-4 outline-white dark:outline-gray-900",
                          vertical: "h-6 w-6 rounded-full outline-4 outline-white dark:outline-gray-900"
                        },
                        icon: {
                          base: "h-4 w-4",
                          wrapper: "absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-transparent text-cyan-500"
                        }
                      }
                    }
                  }
                }}
              >
                {/* 顯示正在執行的步驟 */}
                {executedSteps.length < selectedSteps.length && currentProgress !== 100 && (
                  <Timeline.Item className="px-4 py-2 my-0">
                    <Timeline.Point icon={Spinner} className="absolute"/>
                    <Timeline.Content className="ml-6">
                      <Timeline.Title>
                        {availableSteps.find(s => s.value === selectedSteps[executedSteps.length]?.type)?.name}
                        {selectedSteps[executedSteps.length]?.type === 'wait' && waitingTime !== null && (
                          <span className="ml-2 text-blue-500">
                            (剩餘 {waitingTime} 秒)
                          </span>
                        )}
                      </Timeline.Title>
                      {selectedSteps[executedSteps.length]?.value && (
                        <Timeline.Body>
                          數值：{selectedSteps[executedSteps.length].value}
                        </Timeline.Body>
                      )}
                    </Timeline.Content>
                  </Timeline.Item>
                )}
              </Timeline>
              <Timeline
                theme={{
                  root: {
                    direction: {
                      horizontal: "flex flex-col md:flex-row",
                      vertical: "flex flex-col"
                    }
                  },
                  item: {
                    content: {
                      base: "mt-2 md:mt-0"
                    },
                    point: {
                      marker: {
                        base: {
                          horizontal: "h-6 w-6 rounded-full outline-4 outline-white dark:outline-gray-900",
                          vertical: "h-6 w-6 rounded-full outline-4 outline-white dark:outline-gray-900"
                        },
                        icon: {
                          base: "h-4 w-4",
                          wrapper: "absolute -left-3 flex h-6 w-6 items-center justify-center rounded-full bg-cyan-500 text-white"
                        }
                      }
                    }
                  }
                }}
              >
                {[...executedSteps].reverse().map((step, index) => (
                  <>                    
                    {
                      index !== 0 && (
                        <HiOutlineArrowNarrowUp
                          className="text-cyan-500 flex w-[80px]"
                        />
                      )
                    }
                    <Timeline.Item key={index} className="px-4 py-2 my-0">
                      <Timeline.Point 
                        icon={HiCheck} 
                        className={`absolute ${
                          step.error ? 'bg-red-500' : 'bg-green-500'
                        } text-white`}
                      />
                      <Timeline.Content className="ml-6">
                        <Timeline.Title className={step.error ? 'text-red-500' : ''}>
                          {availableSteps.find(s => s.value === step.type)?.name}
                          {step.error && ' (執行失敗)'}
                        </Timeline.Title>
                        {step.value && (
                          <Timeline.Body>
                            數值：{step.value}
                          </Timeline.Body>
                        )}
                      </Timeline.Content>
                    </Timeline.Item>
                  </>
                ))}
              </Timeline>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {currentStep === 'settings' ? (
          <div className="flex gap-2 items-center">
            <Button color="gray" onClick={onClose}>
              取消
            </Button>
            <Button color="blue" onClick={handleStartExecution}>
              開始執行
            </Button>
            <span className="text-red-500 text-bold">
              {isEmptyStepOrValue ? '請選擇步驟並輸入數值' : null}
            </span>
            {progressErrorMessage && <span className='ml-2 text-purple-500'>{progressErrorMessage}</span>}
          </div>
        ) : (
          <div
            className="flex gap-2 justify-between w-full"
          >
            <div
              style={{ visibility: currentProgress === 100 ? 'visible' : 'hidden' }}
              className='flex gap-2'
            >
              <Button
                color="gray"
                onClick={() => hnandleReturnSettingPage()}
              >
                返回設定
              </Button>
              {
                !isStopRequested && (
                  <Button
                    color="blue"
                    onClick={handleRestartExecution}
                  >
                    重新執行
                  </Button>
                )
              }
            </div>
            <div
              className='flex gap-2'
            >
              {
                currentProgress < 100 && (
                  <Button color="red" onClick={handleStopExecution}>
                    中斷執行
                  </Button>
                )
              }
              <Button color="gray" onClick={onClose}>
                關閉
              </Button>
            </div>
          </div>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ControllerSettingModal;
