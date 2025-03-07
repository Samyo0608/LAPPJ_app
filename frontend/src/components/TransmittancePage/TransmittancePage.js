import React, { useState } from 'react';
import { getApi, getPlotApi } from '../../utils/getApi';
import { 
  Card, 
  Button, 
  Label, 
  TextInput, 
  Select, 
  Table, 
  Checkbox, 
  Badge, 
  Modal,
  Spinner,
  Tabs
} from 'flowbite-react';
import { 
  HiFolder, 
  HiCalculator, 
  HiOutlineRefresh, 
  HiFilter, 
  HiPlus, 
  HiOutlineZoomIn 
} from 'react-icons/hi';

/**
 * 穿透度量測頁面的自定義邏輯與狀態管理
 */
const useHooks = () => {
  // === 狀態管理 ===
  // 基本數據狀態
  const [transmittanceDetail, setTransmittanceDetail] = useState([]);
  const [transmittanceData, setTransmittanceData] = useState({
    filePath: '',
    groupNumber: 1,
    fileNumber: 1,
    maxSpectrum: 800,
    minSpectrum: 400,
  });
  
  // UI控制狀態
  const [fileSelect, setFileSelect] = useState('group');
  const [selectedFiles, setSelectedFiles] = useState('group');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalImage, setModalImage] = useState('');
  
  // 數據加載狀態
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  
  // 圖表數據
  const [plotData, setPlotData] = useState('');
  const [filterData, setFilterData] = useState([]);
  const [filterPlotData, setFilterPlotData] = useState('');
  
  // 圖表設置
  const [plotFlag, setPlotFlag] = useState([
    {
      flag: 'xLabel',
      value: 'Sample number',
      unit: ''
    },
    {
      flag: 'yLabel',
      value: 'Transmittance',
      unit: '%'
    },
    {
      flag: 'yLabel2',
      value: 'Resistance',
      unit: 'kΩ',
      isViewed: true
    },
    {
      flag: 'selectedFiles',
      value: {
        group: '',
        number: '',
        customize: ''
      }
    }
  ]);
  
  // 自定義文件
  const [customizedFiles, setCustomizedFiles] = useState([{
    file: '',
    value: '',
    key: 0
  }]);

  // === API 調用 ===
  /**
   * 從API獲取穿透度平均值
   */
  const getTransmittanceDetail = async () => {
    setLoading(true);
    try {
      const response = await getApi('/transmittance_api/transmittanceData', 'POST', transmittanceData);
      if (response.status === 'success') {
        setTransmittanceDetail(response.data);
        if (response.data.length > 0) {
          await getTransmittancePlot(response.data);
        }
      } else {
        console.error(response.status);
      }
    } catch (error) {
      console.error("獲取穿透度數據錯誤:", error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * 從API獲取穿透度圖片
   */
  const getTransmittancePlot = async (detail) => {
    // 保持與原始函數相同的參數結構
    const data = {
      fileData: detail
    };
    
    try {
      const response = await getPlotApi('/transmittance_api/transmittancePlot', 'POST', data);
      if (response.status === 'success') {
        const imageObjectURL = URL.createObjectURL(response.data);
        setPlotData(imageObjectURL);
      } else {
        console.error(response.status);
      }
    } catch (error) {
      console.error("獲取穿透度圖片錯誤:", error);
    }
  };

  /**
   * 從API獲取篩選後的圖表
   */
  const getFilterPlot = async (datas, flagPlots) => {
    const reqData = {
      fileData: datas,
      plotFlag: flagPlots
    };
    
    setFilterLoading(true);
    try {
      const response = await getPlotApi('/transmittance_api/transmittancePlotFilter', 'POST', reqData);
      if (response.status === 'success') {
        const imageObjectURL = URL.createObjectURL(response.data);
        setFilterPlotData(imageObjectURL);
      } else {
        console.error(response.status);
      }
    } catch (error) {
      console.error("獲取篩選圖表錯誤:", error);
    } finally {
      setFilterLoading(false);
    }
  };

  // === 事件處理函數 ===
  /**
   * 顯示圖片模態框
   */
  const openImageModal = (imageSrc) => {
    setModalImage(imageSrc);
    setIsModalOpen(true);
  };

  /**
   * 選擇資料夾
   */
  const handleSelectFolder = async () => {
    if (window.electron) {
      try {
        const folderPath = await window.electron.selectFolder();
        if (folderPath) {
          setTransmittanceData({
            ...transmittanceData,
            filePath: folderPath
          });
        }
      } catch (error) {
        console.error("選擇資料夾錯誤:", error);
      }
    } else {
      setTransmittanceData({
        ...transmittanceData,
        filePath: '尚未指定資料夾'
      });
      console.error('Electron API not available');
    }
  };
  
  /**
   * 選擇編號形式
   */
  const handleFileSelect = (e) => {
    setFileSelect(e.target.value);
  };
  
  /**
   * 處理輸入值變更
   */
  const onInputBlur = (flag, value) => {
    setTransmittanceData({
      ...transmittanceData,
      [flag]: value === '' ? 0 : parseInt(value)
    });
  };
  
  /**
   * 計算穿透度數值
   */
  const handleMultiFileCount = () => {
    if (Object.values(transmittanceData).every(value => value !== '')) {
      getTransmittanceDetail();
    } else {
      console.error('Please fill in all the data');
    }
  };
  
  /**
   * 電阻值輸入變更
   */
  const onResistanceInputBlur = (fileName, value) => {
    if (transmittanceDetail.length > 0) {
      const newTransmittanceDetail = transmittanceDetail.map((item) => {
        if (item.fileName === fileName) {
          return {
            ...item,
            resistance: value
          };
        }
        return item;
      });
      setTransmittanceDetail(newTransmittanceDetail);
    }
  };
  
  /**
   * Y軸2顯示狀態變更
   */
  const handleYLabelCheckbox = () => {
    const newPlotFlag = plotFlag.map((item) => {
      if (item.flag === 'yLabel2') {
        return {
          ...item,
          isViewed: !item.isViewed
        };
      }
      return item;
    });
    setPlotFlag(newPlotFlag);
  };
  
  /**
   * 圖表參數變更
   */
  const handlePlotFlag = (flag, list, value) => {
    const newPlotFlag = plotFlag.map((item) => {
      if (item.flag === flag) {
        return {
          ...item,
          [list]: value
        };
      }
      return item;
    });
    setPlotFlag(newPlotFlag);
  };
  
  /**
   * 選擇篩選檔案類型
   */
  const handleSelectedFilesType = (e) => {
    setSelectedFiles(e.target.value);
  };
  
  /**
   * 添加自定義檔案
   */
  const handleAddCustomizedFiles = () => {
    const newCustomizedFiles = [...customizedFiles];
    newCustomizedFiles.push({
      file: '',
      value: '',
      key: newCustomizedFiles.length
    });
    setCustomizedFiles(newCustomizedFiles);
  };
  
  /**
   * 處理自定義檔案輸入
   */
  const handleCustomizedInputChange = (value, index) => {
    const newCustomizedFiles = [...customizedFiles];
    newCustomizedFiles[index].value = value;
    setCustomizedFiles(newCustomizedFiles);
  };
  
  /**
   * 篩選資料
   */
  const handleGroupFile = (data) => {
    let filteredData = [];
    if (selectedFiles === 'group') {
      filteredData = data.filter((item) => 
        item.fileName.split('-')[0] === plotFlag.find(item => item.flag === 'selectedFiles').value.group
      );
    } else if (selectedFiles === 'number') {
      filteredData = data.filter((item) => 
        item.fileName.split('-')[1] === plotFlag.find(item => item.flag === 'selectedFiles').value.number
      );
    } else {
      filteredData = data.filter((item) => 
        customizedFiles.map((file) => file.value).includes(item.fileName)
      );
    }
    setFilterData(filteredData);
  };
  
  /**
   * 送出篩選資料生成圖表
   */
  const handleFilterClick = (datas, flagPlots) => {
    if (datas.length === 0) {
      console.error('No data to filter');
      return;
    }
    
    if (flagPlots.find((item) => item.flag === 'yLabel2')?.isViewed === false) {
      if (datas.every((item) => item.resistance !== '')) {
        getFilterPlot(datas, flagPlots);
      } else {
        console.error('Please fill in all the resistance data');
      }
    } else {
      getFilterPlot(datas, flagPlots);
    }
  };

  return {
    // 狀態
    transmittanceDetail,
    transmittanceData,
    fileSelect,
    selectedFiles,
    loading,
    filterLoading,
    plotData,
    filterData,
    filterPlotData,
    plotFlag,
    customizedFiles,
    isModalOpen,
    modalImage,
    setPlotFlag,
    setIsModalOpen,
    openImageModal,
    handleSelectFolder,
    handleFileSelect,
    onInputBlur,
    handleMultiFileCount,
    onResistanceInputBlur,
    handleYLabelCheckbox,
    handlePlotFlag,
    handleSelectedFilesType,
    handleAddCustomizedFiles,
    handleCustomizedInputChange,
    handleGroupFile,
    handleFilterClick
  };
};

/**
 * 穿透度量測頁面組件
 */
const TransmittancePage = () => {
  const {
    transmittanceDetail,
    transmittanceData,
    fileSelect,
    selectedFiles,
    loading,
    filterLoading,
    plotData,
    filterData,
    filterPlotData,
    plotFlag,
    customizedFiles,
    isModalOpen,
    modalImage,
    setPlotFlag,
    setIsModalOpen,
    openImageModal,
    handleSelectFolder,
    handleFileSelect,
    onInputBlur,
    handleMultiFileCount,
    onResistanceInputBlur,
    handleYLabelCheckbox,
    handlePlotFlag,
    handleSelectedFilesType,
    handleAddCustomizedFiles,
    handleCustomizedInputChange,
    handleGroupFile,
    handleFilterClick
  } = useHooks();
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-center mb-8">
        穿透度量測與相關圖形繪製
      </h1>
      
      {/* 資料夾選擇區塊 */}
      <Card className="mb-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div>
            <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
              資料來源設定
            </h5>
            <p className="font-normal text-gray-700 dark:text-gray-400 mb-4">
              選擇包含測量數據的資料夾
            </p>
          </div>
          <Button color="blue" onClick={handleSelectFolder}>
            <HiFolder className="mr-2 h-5 w-5" />
            選擇資料夾
          </Button>
        </div>
        
        <div className="mt-4">
          <Label value="已選擇資料夾:" />
          <div className="mt-2 bg-blue-50 border border-blue-200 text-blue-800 p-3 rounded-lg break-all">
            {transmittanceData.filePath || '尚未選擇資料夾'}
          </div>
        </div>
      </Card>
      
      {/* 參數設定區域 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* 編號方式選擇 */}
        <Card>
          <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            數據檔案設定
          </h5>
          
          <div className="mb-4">
            <Label htmlFor="fileSelectType" value="選擇編號形式" />
            <Select
              id="fileSelectType"
              className="mt-2"
              value={fileSelect}
              onChange={handleFileSelect}
            >
              <option value="group">X-X (組號-排列號碼)</option>
              <option value="onlyFileNumber">單純排列號碼</option>
            </Select>
          </div>
          
          {fileSelect === 'group' && (
            <>
              <div className="mb-4">
                <Label htmlFor="groupNumber" value="輸入起始組號" />
                <TextInput
                  id="groupNumber"
                  type="number"
                  min={1}
                  className="mt-2"
                  defaultValue={transmittanceData.groupNumber}
                  onBlur={(e) => onInputBlur('groupNumber', e.target.value)}
                />
              </div>
              
              <div className="mb-4">
                <Label htmlFor="fileNumber" value="輸入起始排列號碼" />
                <TextInput
                  id="fileNumber"
                  type="number"
                  min={1}
                  className="mt-2"
                  defaultValue={transmittanceData.fileNumber}
                  onBlur={(e) => onInputBlur('fileNumber', e.target.value)}
                />
              </div>
            </>
          )}
          
          {fileSelect === 'onlyFileNumber' && (
            <div className="mb-4">
              <Label htmlFor="fileNumber" value="輸入起始排列號碼" />
              <TextInput
                id="fileNumber"
                type="number"
                min={1}
                className="mt-2"
                defaultValue={transmittanceData.fileNumber}
                onBlur={(e) => onInputBlur('fileNumber', e.target.value)}
              />
            </div>
          )}
        </Card>
        
        {/* 波長範圍設定 */}
        <Card>
          <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            光譜分析設定
          </h5>
          
          <div className="mb-4">
            <Label value="求得平均之波長範圍 (nm)" />
            
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div>
                <Label htmlFor="minSpectrum" value="最小值" />
                <TextInput
                  id="minSpectrum"
                  type="number"
                  min={200}
                  max={1200}
                  defaultValue={transmittanceData.minSpectrum}
                  onBlur={(e) => onInputBlur('minSpectrum', e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="maxSpectrum" value="最大值" />
                <TextInput
                  id="maxSpectrum"
                  type="number"
                  min={200}
                  max={1200}
                  defaultValue={transmittanceData.maxSpectrum}
                  onBlur={(e) => onInputBlur('maxSpectrum', e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <Button 
            gradientDuoTone="cyanToBlue" 
            onClick={handleMultiFileCount}
          >
            <HiCalculator className="mr-2 h-5 w-5" />
            計算數值
          </Button>
        </Card>
      </div>
      
      {/* 數據結果區塊 */}
      {loading ? (
        <Card className="mb-6">
          <div className="flex justify-center items-center p-8">
            <Spinner size="xl" />
            <span className="ml-2">數據加載中...</span>
          </div>
        </Card>
      ) : transmittanceDetail?.length > 0 && (
        <Card className="mb-6">
          <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            平均穿透度表格
          </h5>
          
          <div className="overflow-x-auto">
            <Table striped hoverable>
              <Table.Head>
                <Table.HeadCell className="text-center">No.</Table.HeadCell>
                <Table.HeadCell className="text-center">穿透度 (%)</Table.HeadCell>
                <Table.HeadCell className="text-center">電阻值 (kΩ)</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {transmittanceDetail.map((item) => (
                  <Table.Row key={item.fileName} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="font-medium text-gray-900 dark:text-white">
                      {item.fileName}
                    </Table.Cell>
                    <Table.Cell className="text-center">
                      {item.averageTransmittance}
                    </Table.Cell>
                    <Table.Cell>
                      <TextInput
                        type="number"
                        step="0.001"
                        min="0"
                        placeholder="輸入電阻值"
                        defaultValue={item.resistance || 0}
                        onBlur={(e) => onResistanceInputBlur(item.fileName, e.target.value)}
                      />
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table>
          </div>
          
          {/* 穿透度圖表展示 */}
          {plotData && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-lg font-bold">穿透度視覺化</h5>
                <Button 
                  size="sm" 
                  color="light" 
                  onClick={() => openImageModal(plotData)}
                >
                  <HiOutlineZoomIn className="mr-2 h-4 w-4" />
                  放大圖片
                </Button>
              </div>
              <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                <img 
                  src={plotData}
                  alt="穿透度圖" 
                  className="max-w-full h-auto mx-auto" 
                />
              </div>
            </div>
          )}
        </Card>
      )}
      
      {/* 特定數據繪製區塊 */}
      {transmittanceDetail?.length > 0 && (
        <Card>
          <h5 className="text-xl font-bold tracking-tight text-gray-900 dark:text-white mb-4">
            特定數據繪製
          </h5>
          
          <Tabs aria-label="數據繪製選項">
            <Tabs.Item title="圖表參數" icon={HiCalculator}>
              <div className="space-y-4">
                {plotFlag.map((item) => {
                  if (item.flag === 'selectedFiles') return null;
                  
                  return (
                    <div key={item.flag} className="p-4 border border-gray-200 rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <Label htmlFor={`${item.flag}-value`} value={
                          item.flag === 'xLabel' ? 'X軸標籤' :
                          item.flag === 'yLabel' ? 'Y軸標籤' :
                          'Y2軸標籤'
                        } />
                        
                        {item.flag === 'yLabel2' && (
                          <div className="flex items-center">
                            <Checkbox
                              id={`${item.flag}-checkbox`}
                              defaultChecked={item.isViewed}
                              onChange={handleYLabelCheckbox}
                            />
                            <Label htmlFor={`${item.flag}-checkbox`} className="ml-2">
                              顯示第二Y軸
                            </Label>
                          </div>
                        )}
                      </div>
                      
                      <TextInput
                        id={`${item.flag}-value`}
                        placeholder={`輸入${item.value}`}
                        defaultValue={item.value}
                        disabled={item.flag === 'yLabel2' && !item.isViewed}
                        onBlur={(e) => handlePlotFlag(item.flag, 'value', e.target.value)}
                        className="mb-2"
                      />
                      
                      <div className="flex items-center mt-2">
                        <Label htmlFor={`${item.flag}-unit`} value="單位" className="mr-2" />
                        <TextInput
                          id={`${item.flag}-unit`}
                          placeholder="輸入單位"
                          defaultValue={item.unit || ''}
                          disabled={item.flag === 'yLabel2' && !item.isViewed}
                          onBlur={(e) => handlePlotFlag(item.flag, 'unit', e.target.value)}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </Tabs.Item>
            
            <Tabs.Item title="檔案選擇" icon={HiFolder}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="selectedFilesType" value="選擇方式" />
                  <Select
                    id="selectedFilesType"
                    className="mt-2"
                    value={selectedFiles}
                    onChange={handleSelectedFilesType}
                  >
                    <option value="group">以組別</option>
                    <option value="number">以樣本號碼</option>
                    <option value="customize">自訂</option>
                  </Select>
                </div>
                
                {selectedFiles === 'customize' ? (
                  <div>
                    <Label value="自行輸入，請輸入No. (EX: 1-1,2-4,3-2)" />
                    <div className="space-y-2 mt-2">
                      {customizedFiles.map((item, index) => (
                        <div key={index} className="flex items-center">
                          <TextInput
                            className="flex-1"
                            placeholder="輸入檔案名稱"
                            defaultValue={item.value}
                            onBlur={(e) => handleCustomizedInputChange(e.target.value, index)}
                          />
                          {index === customizedFiles.length - 1 && (
                            <Button 
                              color="success" 
                              size="sm" 
                              className="ml-2"
                              onClick={handleAddCustomizedFiles}
                            >
                              <HiPlus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label 
                      htmlFor="groupFilter" 
                      value={selectedFiles === 'group' ? '組別篩選' : '樣本號碼篩選'} 
                    />
                    <div className="flex items-center mt-2">
                      <TextInput
                        id="groupFilter"
                        className="flex-1"
                        placeholder={`${selectedFiles === 'group' ? '組別' : '樣本號碼'}，EX: 1,2,3`}
                        defaultValue={plotFlag.find(item => item.flag === 'selectedFiles')?.value[selectedFiles]}
                        onBlur={(e) => {
                          const newPlotFlag = plotFlag.map((item) => {
                            if (item.flag === 'selectedFiles') {
                              return {
                                ...item,
                                value: {
                                  ...item.value,
                                  [selectedFiles]: e.target.value
                                }
                              };
                            }
                            return item;
                          });
                          setPlotFlag(newPlotFlag);
                        }}
                      />
                      <Badge color="info" className="ml-2">
                        {selectedFiles === 'group' ? '組' : '號'}
                      </Badge>
                    </div>
                  </div>
                )}
                
                <Button 
                  gradientDuoTone="purpleToBlue"
                  onClick={() => handleGroupFile(transmittanceDetail)}
                >
                  <HiFilter className="mr-2 h-5 w-5" />
                  篩選
                </Button>
              </div>
            </Tabs.Item>
          </Tabs>
          
          <div className="mt-6">
            <Button 
              gradientDuoTone="greenToBlue"
              className="w-full"
              onClick={() => handleFilterClick(filterData, plotFlag)}
              disabled={filterLoading || filterData.length === 0}
            >
              {filterLoading ? (
                <>
                  <Spinner size="sm" className="mr-3" />
                  處理中...
                </>
              ) : (
                <>
                  <HiOutlineRefresh className="mr-2 h-5 w-5" />
                  資料送出
                </>
              )}
            </Button>
          </div>
          
          {filterPlotData && !filterLoading && (
            <div className="mt-6">
              <div className="flex justify-between items-center mb-4">
                <h5 className="text-lg font-bold">篩選後的數據視覺化</h5>
                <Button 
                  size="sm" 
                  color="light" 
                  onClick={() => openImageModal(filterPlotData)}
                >
                  <HiOutlineZoomIn className="mr-2 h-4 w-4" />
                  放大圖片
                </Button>
              </div>
              <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                <img 
                  src={filterPlotData} 
                  alt="篩選穿透度圖" 
                  className="max-w-full h-auto mx-auto" 
                />
              </div>
            </div>
          )}
        </Card>
      )}
      
      {/* 圖片放大模態框 */}
      <Modal
        show={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        size="7xl"
      >
        <Modal.Header>
          穿透度視覺化圖表
        </Modal.Header>
        <Modal.Body>
          <div className="relative bg-gray-50 p-2 rounded-lg">
            <img 
              src={modalImage} 
              alt="放大的圖表" 
              className="max-w-full w-full" 
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button color="gray" onClick={() => setIsModalOpen(false)}>
            關閉
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default TransmittancePage;