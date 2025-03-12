import React, { useState } from 'react';
import { Modal, Button, Label, Select, TextInput, Progress, Timeline } from 'flowbite-react';
import { HiCheck, HiTrash  } from 'react-icons/hi';

const ControllerSettingModal = ({ show, onClose }) => {
  const [currentStep, setCurrentStep] = useState('settings'); // 'settings' or 'progress'
  const [selectedSteps, setSelectedSteps] = useState([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [executedSteps, setExecutedSteps] = useState([]);

  const availableSteps = [
    { id: 'laserOn', name: '開啟雷射', value: 'laserOn' },
    { id: 'laserOff', name: '關閉雷射', value: 'laserOff' },
    { id: 'laserPower', name: '設定功率', value: 'laserPower', needsValue: true },
    { id: 'carrierGasOn', name: '開啟載氣', value: 'carrierGasOn' },
    { id: 'carrierGasOff', name: '關閉載氣', value: 'carrierGasOff' },
    { id: 'carrierGasValue', name: '調整載氣流量', value: 'carrierGasValue', needsValue: true },
    { id: 'mainGasOn', name: '開啟主氣', value: 'mainGasOn' },
    { id: 'mainGasOff', name: '關閉主氣', value: 'mainGasOff' },
    { id: 'mainGasValue', name: '調整主氣流量', value: 'mainGasValue', needsValue: true },
    { id: 'powerSupplyOn', name: '開啟脈衝電源控制器', value: 'powerSupplyOn' },
    { id: 'powerSupplyOff', name: '關閉脈衝電源控制器', value: 'powerSupplyOff' },
    { id: 'powerSupplyDc1Value', name: '調整脈衝-DC1電壓', value: 'powerSupplyDc1Value', needsValue: true },
    { id: 'dc1On', name: 'DC1升壓', value: 'dc1On' },
    { id: 'dc1Off', name: 'DC1降壓', value: 'dc1Off' },
    { id: 'ultrasonicOn', name: '開啟霧化器', value: 'ultrasonicOn' },
    { id: 'ultrasonicOff', name: '關閉霧化器', value: 'ultrasonicOff' },
    { id: 'wait', name: '等待時間', value: 'wait', needsValue: true },
  ];

  const handleAddStep = () => {
    setSelectedSteps([...selectedSteps, { type: '', value: '' }]);
  };

  const handleStepChange = (index, type, value = '') => {
    const newSteps = [...selectedSteps];
    newSteps[index] = { type, value };
    setSelectedSteps(newSteps);
  };

  const handleStartExecution = () => {
    setCurrentStep('progress');
    setCurrentProgress(0);
    setExecutedSteps([]);
    // 這裡可以開始執行實際的控制流程
    simulateExecution();
  };

  const simulateExecution = () => {
    let progress = 0;
    const totalSteps = selectedSteps.length;
  
    const executeStep = (index) => {
      if (index >= totalSteps) {
        setCurrentProgress(100);
        return;
      }
  
      const step = selectedSteps[index];
      setExecutedSteps(prev => [...prev, step]);
      
      // 使用 requestAnimationFrame 讓進度更新更平滑
      const updateProgress = () => {
        progress += 1;
        const targetProgress = ((index + 1) / totalSteps) * 100;
        
        setCurrentProgress(progress);
        
        if (progress < targetProgress) {
          requestAnimationFrame(updateProgress);
        } else {
          setTimeout(() => executeStep(index + 1), 1000);
        }
      };
  
      requestAnimationFrame(updateProgress);
    };
  
    executeStep(0);
  };

  return (
    <Modal show={show} onClose={onClose} size="4xl">
      <Modal.Header>控制設定</Modal.Header>
      <Modal.Body>
        {currentStep === 'settings' ? (
          <div className="space-y-4">
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
                  className="flex-1"
                  value={step.type}
                  onChange={(e) => handleStepChange(index, e.target.value)}
                >
                  <option value="">選擇動作</option>
                  {availableSteps.map((option) => (
                    <option key={option.id} value={option.value}>
                      {option.name}
                    </option>
                  ))}
                </Select>
                {availableSteps.find(s => s.value === step.type)?.needsValue && (
                  <TextInput
                    type="number"
                    placeholder="數值"
                    value={step.value}
                    onChange={(e) => handleStepChange(index, step.type, e.target.value)}
                    className="w-32"
                  />
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
              <Timeline className='px-2'>
                {executedSteps.map((step, index) => (
                  <Timeline.Item key={index} className="pb-4">
                    <Timeline.Point icon={HiCheck} className='absolute' />
                    <Timeline.Content className="ml-6">
                      <Timeline.Title>
                        {availableSteps.find(s => s.value === step.type)?.name}
                      </Timeline.Title>
                      {step.value && (
                        <Timeline.Body>
                          數值：{step.value}
                        </Timeline.Body>
                      )}
                    </Timeline.Content>
                  </Timeline.Item>
                ))}
              </Timeline>
            </div>
          </div>
        )}
      </Modal.Body>
      <Modal.Footer>
        {currentStep === 'settings' ? (
          <div className="flex gap-2">
            <Button color="gray" onClick={onClose}>
              取消
            </Button>
            <Button color="blue" onClick={handleStartExecution}>
              開始執行
            </Button>
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
                onClick={() => setCurrentStep("settings")}
              >
                返回設定
              </Button>
              <Button
                color="blue"
                onClick={handleStartExecution}
              >
                重新執行
              </Button>
            </div>
            <div
              className='flex gap-2'
            >
              <Button color="red" onClick={onClose}>
                中斷執行
              </Button>
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