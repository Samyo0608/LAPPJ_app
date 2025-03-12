import React, { useState } from 'react';
import { Modal, Button, Label, Select, TextInput, Progress, Timeline } from 'flowbite-react';
import { HiCheck } from 'react-icons/hi';

const ControllerSettingModal = ({ show, onClose }) => {
  const [currentStep, setCurrentStep] = useState('settings'); // 'settings' or 'progress'
  const [selectedSteps, setSelectedSteps] = useState([]);
  const [currentProgress, setCurrentProgress] = useState(0);
  const [executedSteps, setExecutedSteps] = useState([]);

  const availableSteps = [
    { id: 'laser', name: '開啟雷射', value: 'laser' },
    { id: 'power', name: '設定功率', value: 'power', needsValue: true },
    { id: 'carrier', name: '開啟 Carrier gas', value: 'carrier' },
    { id: 'main', name: '開啟 Main gas', value: 'main' },
    { id: 'powerSupply', name: '開啟 Power supply', value: 'powerSupply' },
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
              <div key={index} className="flex gap-4">
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
            
            <div className="h-[300px] overflow-y-auto x-auto">
              <Timeline>
                {executedSteps.map((step, index) => (
                  <Timeline.Item key={index} className="pb-4">
                    <Timeline.Point icon={HiCheck} />
                    <Timeline.Content>
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
            className="flex gap-2"
            style={{ visibility: currentProgress === 100 ? 'visible' : 'hidden' }}
          >
            <Button color="gray" onClick={() => setCurrentStep("settings")}>
              返回設定
            </Button>
            <Button color="gray" onClick={onClose}>
              重新執行
            </Button>
            <Button color="gray" onClick={onClose}>
              關閉
            </Button>
          </div>
        )}
      </Modal.Footer>
    </Modal>
  );
};

export default ControllerSettingModal;