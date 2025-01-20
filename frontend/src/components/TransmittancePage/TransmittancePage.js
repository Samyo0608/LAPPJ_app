import React, {useState} from 'react';
import { getApi, getPlotApi } from '../../utils/getApi';
import { TableSkeleton } from '../Skeleton/Skeleton';

const useHooks = () => {
  const [transmittanceDetail, setTransmittanceDetail] = useState([]);
  const [transmittanceData, setTransmittanceData] = useState({
    filePath: '',
    groupNumber: 1,
    fileNumber: 1,
    maxSpectrum: 800,
    minSpectrum: 400,
  });
  const [fileSelect, setFileSelect] = useState('group');
  const [loading, setLoading] = useState(false);
  const [filterLoading, setFilterLoading] = useState(false);
  const [plotData, setPlotData] = useState('');
  const [filterData, setFilterData] = useState([]);
  const [filterPlotData, setFilterPlotData] = useState('');
  const [selectedFiles, setSelectedFiles] = useState('group');
  // 定義傳回至後端的資料，用來取得特定的圖表
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
  const [customizedFiles, setCustomizedFiles] = useState([{
    file: '',
    value: '',
    key: 0
  }]);

  // 從api取得指定的穿透度以及電阻值圖片
  const getFilterPlot = async (datas, flagPlots) => {
    const reqData = {
      fileData: datas,
      plotFlag: flagPlots
    };
    setFilterLoading(true);
    const response = await getPlotApi('/transmittancePlotFilter', 'POST', reqData);
    if (response.status === 'success') {
      const imageObjectURL = URL.createObjectURL(response.data);
      setFilterPlotData(imageObjectURL);
    } else {
      console.error(response.status);
    }

    setFilterLoading(false);
  };

  // 從api取得穿透度圖片blob
  const getTransmittancePlot = async (detail, xLabel, yLabel, selectedFiles) => {
    const data = {
      fileData: detail,
      xLabel,
      yLabel,
      selectedFiles
    };
    const response = await getPlotApi('/transmittancePlot', 'POST', data);
    if (response.status === 'success') {
      const imageObjectURL = URL.createObjectURL(response.data);
      setPlotData(imageObjectURL);
    } else {
      console.error(response.status);
    }

    setLoading(false);
  };

  // 從api取得穿透度平均值
  const getTransmittanceDetail = async () => {
    setLoading(true);
    const response = await getApi('/transmittanceData', 'POST', transmittanceData);
    if (response.status === 'success') {
      setTransmittanceDetail(response.data);
      if (response.data.length > 0) {
        await getTransmittancePlot(response.data);
      }
    } else {
      console.error(response.status);
    }

    setLoading(false);
  };

  // 點集送出按鈕，取得指定的穿透度以及電阻值圖片
  const handleFilterClick = async (datas, flagPlots) => {
    console.log("datas", datas);
    console.log("flagPlots", flagPlots);
    // 只要有一個值是空的，就不會送出
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


  // Checkbox 是否需要右邊Y軸
  const handleYLabelCheckbox = (e) => {
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

  // 自訂xLabel、yLabel、單位、選擇檔案
  const handlePlotFlag = (flag, list, value) => {
    // 先確定是哪一個flag，再判斷是哪一個list(value、unit)
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

  // 加號按鈕，增加自訂檔案，key從0開始，每次加一
  const handleAddCustomizedFiles = () => {
    const newCustomizedFiles = [...customizedFiles];
    newCustomizedFiles.push({
      file: '',
      value: '',
      key: newCustomizedFiles.length
    });
    setCustomizedFiles(newCustomizedFiles);
  };

  // 選擇檔案類型(特定選取那邊的select)
  const handleSelectedFilesType = (e) => {
    setSelectedFiles(e.target.value);
  };

  // 選擇編號形式
  const handleFileSelect = (e) => {
    setFileSelect(e.target.value);
  };

  // 按下計算數值(X-X)
  const handleMultiFileCount = (e) => {
    if (Object.values(transmittanceData).every(value => value !== '')) {
      getTransmittanceDetail();
    } else {
      console.error('Please fill in all the data');
    }
  };

  // 指定資料夾
  const handleSelectFolder = async () => {
    if (window.electron) {
      const folderPath = await window.electron.selectFolder();
      if (folderPath) {
        setTransmittanceData({
          ...transmittanceData,
          filePath: folderPath
        })
      }
    } else {
      setTransmittanceData({
        ...transmittanceData,
        filePath: '尚未指定資料夾'
      });
      console.error('Electron API not available');
    }
  };


  // Input輸入紀錄
  const onInputBlur = (flag, value) => {
    setTransmittanceData({
      ...transmittanceData,
      [flag]: value === '' ? 0 : parseInt(value)
    });
  };

  // 電阻值輸入紀錄
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

  // 分類當按下分組按鈕的時候，將資料分組
  // 資料來源為transmittanceDetail
  // 假設我選擇group, 並輸入1，就會將transmittanceDetail中的groupNumber為1的資料取出
  // 假設我選擇number, 並輸入1，就會將transmittanceDetail中的fileName為1的資料取出
  // 假設我選擇customize, 會有好幾格, 每格輸入一個檔案名稱, 最後儲存會是一個陣列, 這個陣列中的每個元素都是一個檔案名稱, 會將transmittanceDetail中的fileName為這個陣列中的檔案名稱的資料取出
  const handleGroupFile = (data) => {
    let filterData = [];
    if (selectedFiles === 'group') {
      // 轉成數字
      // 過濾出符合的資料，檔案名稱為1-1, 1-2, ...，我要取出plotFlag中的value的group的值，這個值要和1-1, 1-2, ...的1相等
      filterData = data.filter((item) => item.fileName.split('-')[0] === plotFlag.find(item => item.flag === 'selectedFiles').value.group);
      console.log("filterData", filterData);
    } else if (selectedFiles === 'number') {
      filterData = data.filter((item) => item.fileName.split('-')[1] === plotFlag.find(item => item.flag === 'selectedFiles').value.number);
      console.log("filterData", filterData);
    } else {
      filterData = data.filter((item) => customizedFiles.map((item) => item.value).includes(item.fileName));
    }
    setFilterData(filterData);
  };

  // Input 一般共用模組
  const InputComponent = ({otherCss, value, flag}) => (
    <input
      className={`mt-2 rounded-lg font-semibold font-mono px-4 py-1 ${otherCss}`}
      type='number'
      step='1'
      defaultValue={value}
      onBlur={(e) => onInputBlur(flag, e.target.value)}
      min='1'
      max='1200'
      placeholder='輸入數值'
    />
  );

  // 單純排列號碼
  const SingleFileNumberComponent = () => (
    <div
      className='bg-gray-200 p-5 rounded-lg mb-5 flex flex-col items-center'
    >
      <p
        className='font-bold'
      >
        輸入起始排列號碼:
      </p>
      <InputComponent
        otherCss='w-full'
        value={transmittanceData.fileNumber}
        flag='fileNumber'
      />
      <p
        className='font-bold mt-5'
      >
        輸入求得平均之波長範圍:
      </p>
      <div
        className='flex align-center justify-center'
      >
        <p
          className='font-bold mt-3 mr-2'
        >
          最小值:
        </p>
        <InputComponent
          value={transmittanceData.minSpectrum}
          flag='minSpectrum'
        />
        <p
          className='font-bold mt-3 ml-2'
        >
          nm
        </p>
      </div>
      <div
        className='flex align-center justify-center'
      >
        <p
          className='font-bold mt-3 mr-2'
        >
          最大值:
        </p>
        <InputComponent
          value={transmittanceData.maxSpectrum}
          flag='maxSpectrum'
        />
        <p
          className='font-bold mt-3 ml-2'
        >
          nm
        </p>
      </div>
      <button
        className='bg-gradient-to-bl from-blue-300 to-blue-100 hover:bg-blue-700 font-bold py-2 px-4 rounded mt-5 text-black'
      >
        計算數值
      </button>
    </div>
  );

  // 組號與排列號碼
  const GroupAndFileNumberComponent = () => (
    <div
      className='bg-purple-200 p-5 rounded-lg mb-5 flex flex-col items-center'
    >
      <p
        className='font-bold'
      >
        輸入起始組號:
      </p>
      <InputComponent
        otherCss='w-full'
        value={transmittanceData.groupNumber}
        flag='groupNumber'
      />
      <p
        className='font-bold mt-5'
      >
        輸入起始排列號碼:
      </p>
      <InputComponent
        otherCss='w-full'
        value={transmittanceData.fileNumber}
        flag='fileNumber'
      />
      <p
        className='font-bold mt-5'
      >
        輸入求得平均之波長範圍:
      </p>
      <div
        className='flex align-center justify-center'
      >
        <p
          className='font-bold mt-3 mr-2'
        >
          最小值:
        </p>
        <InputComponent
          value={transmittanceData.minSpectrum}
          flag='minSpectrum'
        />
        <p
          className='font-bold mt-3 ml-2'
        >
          nm
        </p>
      </div>
      <div
        className='flex align-center justify-center'
      >
        <p
          className='font-bold mt-3 mr-2'
        >
          最大值:
        </p>
        <InputComponent
          value={transmittanceData.maxSpectrum}
          flag='maxSpectrum'
        />
        <p
          className='font-bold mt-3 ml-2'
        >
          nm
        </p>
      </div>
      <button
        className='bg-gradient-to-bl from-blue-300 to-blue-100 hover:from-blue-600 font-bold py-2 px-4 rounded mt-5 text-black'
        onClick={handleMultiFileCount}
      >
        計算數值
      </button>
    </div>
  );

  const TableComponent = ({ data }) => (
    <>
      <p className='font-bold'>
        平均穿透度表格
      </p>
      <div className="relative overflow-x-auto shadow-md sm:rounded-lg mb-5 mt-2">
          <table className="w-full text-sm text-left rtl:text-right text-black-500">
              <thead className="text-xs text-gray-700 bg-green-300 text-center">
                  <tr>
                      <th scope="col" className="px-6 py-3 w-full">
                          No.
                      </th>
                      <th scope="col" className="px-6 py-3">
                          穿透度 (%)
                      </th>
                      <th>
                          電阻值 (kΩ)
                      </th>
                  </tr>
              </thead>
              <tbody>
                  {data ? data.map((item) => (
                      <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600" key={item.fileName}>
                          <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                              {item.fileName}
                          </th>
                          <td className="px-6 py-4">
                              {item.averageTransmittance}
                          </td>
                          <td>
                              <input
                                type='number'
                                step='0.001'
                                className='border-2 border-gray-200 rounded-lg px-4 py-1 mx-2'
                                placeholder='輸入電阻值'
                                min='0'
                                defaultValue={item.resistance || 0}
                                onBlur={(e) => onResistanceInputBlur(item.fileName, e.target.value)}
                              />
                          </td>
                      </tr>
                  )) : (
                      <tr>
                          <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                              No File
                          </th>
                          <td className="px-6 py-4">
                              No data
                          </td>
                          <td>
                              No data
                          </td>
                      </tr>
                  )}
              </tbody>
          </table>
      </div>
      {plotData && <img src={plotData} alt='transmittance plot' className='w-1/2' />}
    </>
  );

  const SelectedFilesTypeComponent = ({ flag }) => {
    const onInputBlur = (value) => {
      const newPlotFlag = plotFlag.map((item) => {
        if (item.flag === 'selectedFiles') {
          return {
            ...item,
            value: {
              ...item.value,
              [flag]: value
            }
          };
        }
        return item
      });
      setPlotFlag(newPlotFlag);
    };

    const onCustomizedInputBlur = (value, key) => {
      const newCustomizedFiles = customizedFiles.map((item, index) => {
        if (key === index) {
          return {
            ...item,
            value
          };
        }
        return item;
      });
      setCustomizedFiles(newCustomizedFiles);
    };

    return selectedFiles === 'customize' ? (
      <div>
        <p
          className='font-bold mt-2'
        >
          自行輸入，請輸入No. (EX: 1-1,2-4,3-2)
        </p>
        <div
          className='flex items-center mt-2'
        >
          <div
            className='flex flex-col items-center'
          >
            {
              customizedFiles.map((item, index) => (
                <input
                  key={index}
                  type='text'
                  className='border-2 border-gray-200 rounded-lg px-4 py-1 mt-1'
                  placeholder='輸入檔案名稱'
                  defaultValue={item.value}
                  onBlur={(e) => onCustomizedInputBlur(e.target.value, item.key)}
                />
              ))
            }
          </div>
          <button
            className='bg-green-400 hover:bg-green-500 text-white font-bold py-2 px-4 rounded ml-2 w-10 h-10'
            onClick={handleAddCustomizedFiles}
          >
            <img src='./plus-solid.svg' alt='add'/>
          </button>
        </div>
      </div>
    ) : (
      <div>
        <p
          className='font-bold mt-2'
        >
          {
            selectedFiles === 'group' ? '組別篩選' : '樣本號碼篩選'
          }
        </p>
        <div
          className='flex items-center mt-2'
        >
          <input
            type='text'
            className='border-2 border-gray-200 rounded-lg px-4 py-1'
            placeholder={`${selectedFiles === 'group' ? '組別' : '樣本號碼'}，EX: 1,2,3`}
            defaultValue={plotFlag.find(item => item.flag === 'selectedFiles').value[flag]}
            onBlur={(e) => onInputBlur(e.target.value)}
          />
          <p
            className='font-bold ml-2'
          >
            組
          </p>
        </div>
      </div>
    );
  };

  return {
    plotFlag,
    transmittanceDetail,
    transmittanceData,
    fileSelect,
    loading,
    selectedFiles,
    filterPlotData,
    filterLoading,
    filterData,
    handleGroupFile,
    handleFilterClick,
    handlePlotFlag,
    handleYLabelCheckbox,
    handleSelectedFilesType,
    handleFileSelect,
    handleSelectFolder,
    SingleFileNumberComponent,
    GroupAndFileNumberComponent,
    TableComponent,
    SelectedFilesTypeComponent
  };
};


const TransmittancePage = () => {
  const {
    plotFlag, transmittanceDetail, transmittanceData, fileSelect, loading, selectedFiles, filterPlotData, filterLoading, filterData,
    handleSelectedFilesType, SelectedFilesTypeComponent, handleYLabelCheckbox, handlePlotFlag, handleFilterClick, handleGroupFile,
    handleFileSelect, handleSelectFolder, SingleFileNumberComponent, GroupAndFileNumberComponent, TableComponent
  } = useHooks();
  
  return (
    <>
      <h1
        className='text-2xl font-bold text-center mt-10'
      >
        穿透度量測與相關圖形繪製
      </h1>
      <div
        className='flex flex-col items-center mt-10'
      >
        <div
          className='flex flex-col items-center ml-10 mr-10'
        >
          <button
            className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
            onClick={handleSelectFolder}
          >
            選擇資料夾
          </button>
          <p
            className='mt-5 font-bold'
          >
            已選擇資料夾:
          </p>
          <p
            className='mt-5 bg-blue-100 p-5 rounded-lg min-w-96 text-center text-blue-600 font-semibold'
          >
            {transmittanceData.filePath}
          </p>
        </div>
        <div
          // space-between
          className='flex flex-row mt-10 ml-10 mr-10 justify-between'
        >
          {/* 用table或是排列形式，出現如下的樣子
            輸入起始組號: 1
            輸入起始排列號碼: 1
            輸入求得平均之波長範圍: 最小值: 400, 最大值: 800
           */}
          <div
            className='flex flex-col'
          >
            <div
              className='flex flex-col mb-5 bg-blue-200 p-5 rounded-lg'
            >
              <p
                className='font-bold'
              >
                選擇編號形式
              </p>
              <select
                className='mt-2 rounded-lg font-semibold font-mono px-4 py-1'
                value={fileSelect}
                onChange={handleFileSelect}
              >
                <option value="group">X-X (組號-排列號碼)</option>
                <option value="onlyFileNumber">單純排列號碼</option>
              </select>
            </div>
            {fileSelect === 'onlyFileNumber' && <SingleFileNumberComponent />}
            {fileSelect === 'group' && <GroupAndFileNumberComponent />}
          </div>
        </div>
        {loading ? <TableSkeleton /> : (transmittanceDetail?.length > 0 && <TableComponent data={transmittanceDetail} />)}
      </div>
      {
        transmittanceDetail?.length > 0 && (
          <div
            className='flex flex-col items-center mt-10'
          >
            <h1
              className='text-2xl font-bold text-center mt-10 mb-5'
            >
              特定數據繪製
            </h1>
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg mb-5 mt-2">
              <table className="w-full text-sm text-left rtl:text-right text-black-500">
                <thead className="text-gray-700 bg-green-300 text-center">
                    <tr
                      className='font-bold'
                    >
                        <th scope="col" className="px-6 py-3">
                            參數項目
                        </th>
                        <th>
                            數值輸入
                        </th>
                    </tr>
                </thead>
                <tbody>
                  {plotFlag.map((item) => {
                    if (item.flag === 'selectedFiles') {
                      return (
                        <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-center" key={item.flag}>
                          <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                              選擇檔案
                          </th>
                          <td className="px-6 py-4">
                              <select
                                className='border-2 border-gray-200 rounded-lg px-4 py-1 w-full'
                                value={selectedFiles}
                                onChange={handleSelectedFilesType}
                              >
                                <option value='group'>以組別</option>
                                <option value='number'>以樣本號碼</option>
                                <option value='customize'>自訂</option>
                              </select>
                              <SelectedFilesTypeComponent flag={selectedFiles} />
                              <button
                                className='bg-gradient-to-bl from-blue-300 to-blue-100 hover:from-blue-600 font-bold py-2 px-4 rounded mt-2 text-black'
                                onClick={() => handleGroupFile(transmittanceDetail)}
                              >
                                篩選
                              </button>
                          </td>
                        </tr>
                      )
                    }

                    return (
                      <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 text-center" key={item.flag}>
                          <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                              {item.flag}
                          </th>
                          <td className="px-6 py-4 flex flex-col">
                              <input
                                type='text'
                                className='border-2 border-gray-200 rounded-lg px-4 py-1'
                                placeholder={`輸入${item.value}`}
                                defaultValue={item.value}
                                disabled={item.flag === 'yLabel2' && !item.isViewed}
                                onBlur={(e) => handlePlotFlag(item.flag, 'value', e.target.value)}
                              />
                              <div
                                className='flex items-center mt-2 justify-center'
                              >
                                <p
                                  className='pr-2'
                                >
                                  單位
                                </p>
                                <input
                                  type='text'
                                  className='border-2 border-gray-200 rounded-lg px-4 py-1'
                                  placeholder='輸入單位'
                                  defaultValue={item.unit || ''}
                                  disabled={item.flag === 'yLabel2' && !item.isViewed}
                                  onBlur={(e) => handlePlotFlag(item.flag, 'unit', e.target.value)}
                                />
                              </div>
                              {
                                item.flag === 'yLabel2' && (
                                  <div
                                    className='flex items-center mt-2 select-none'
                                  >
                                    <label>
                                      <input
                                        type='checkbox'
                                        className='ml-2 mr-2'
                                        defaultChecked={item.isViewed}
                                        onClick={handleYLabelCheckbox}
                                      />
                                      是否需要右邊Y軸
                                    </label>
                                  </div>
                                )
                              }
                          </td>
                      </tr>
                    )}
                  )}
                </tbody>
              </table>
            </div>
            <button
              className='bg-gradient-to-bl from-blue-300 to-blue-100 hover:from-blue-600 font-bold py-2 px-4 rounded mt-2 text-black mb-5'
              onClick={() => handleFilterClick(filterData, plotFlag)}
            >
              資料送出
            </button>
            {(!filterLoading && filterPlotData) && <img src={filterPlotData} alt='filter plot' className='w-1/2' />}
          </div>
        )
      }
    </>
  )
};

export default TransmittancePage;