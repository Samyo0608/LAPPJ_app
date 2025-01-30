import React from 'react';
import { getApi } from '../../utils/getApi';
import { Table } from "flowbite-react";
import AlertComponent from '../ComponentTools/Alert';
import { useAuthContext } from '../../Contexts/AuthContext';

// common input component
const AddRecipeInput = ({ type, name, value, onChange }) => (
  <input
    type={type}
    className="border rounded p-2 flex-1 w-24"
    name={name}
    value={value}
    onChange={onChange}
  />
);

// common error message component
const ErrorMessage = ({ flag, message }) => {
  if (flag?.length <= 0) return null;
  return <p className="text-sm text-red-500 text-bold col-span-12 lg:col-span-12">{message}</p>;
};

const useHooks = () => {
  const { authDetail, isAuth } = useAuthContext();
  const [alertDetail, setAlertDetail] = React.useState({
    show: false,
    message: "",
    type: "success"
  });
  const [recipes, setRecipes] = React.useState([{}]);
  const [newRecipe, setNewRecipe] = React.useState({
    parameter_name: "",
    main_gas_flow: 0,
    main_gas: "N2",
    carrier_gas_flow: 0,
    carrier_gas: "Ar",
    laser_power: 0,
    temperature: 0,
    voltage: 0,
    created_by: authDetail.username || "- -"
  });
  const [inputErrorMessages, setInputErrorMessages] = React.useState({
    parameter_name: "",
    main_gas_flow: "",
    main_gas: "",
    carrier_gas_flow: "",
    carrier_gas: "",
    laser_power: "",
    temperature: "",
    voltage: ""
  });

  // 取得 Recipe 資料 API
  const getRecipesDataApi = async () => {
    const response = await getApi('/recipe_api/get_recipes', 'GET');

    if (response?.status === 'success') {
      
      if (response?.data?.data?.length > 0) {
        setRecipes(response.data.data);
      } else {
        setRecipes({});
      }
    }
  };

  // 新增new recipe資料的 API
  const addNewRecipeApi = async () => {
    const response = await getApi('/recipe_api/add_recipe', 'POST', newRecipe);

    if (response?.status === 'success') {
      getRecipesDataApi();

      setAlertDetail({
        show: true,
        message: "Recipe新增成功",
        type: "success"
      });

      setTimeout(() => {
        setAlertDetail({ show: false });
      }, 3000);

    } else {
      setAlertDetail({
        show: true,
        message: "Recipe新增失敗",
        type: "failure"
      });

      setTimeout(() => {
        setAlertDetail({ show: false });
      }, 3000);
    }
  };

  // 新增 new recipe 資料的onchange事件
  const handleNewRecipeChange = (e) => {
    setNewRecipe({
      ...newRecipe,
      [e.target.name]: e.target.value
    });
  };

  // 新增 new recipe 資料的onClick事件
  const handleAddNewRecipe = async () => {
    const errorMessages = {
      parameter_name: "",
      main_gas_flow: "",
      main_gas: "",
      carrier_gas_flow: "",
      carrier_gas: "",
      laser_power: "",
      temperature: "",
      voltage: ""
    };

    if (!isAuth) {
      setAlertDetail({
        show: true,
        message: "請先登入",
        type: "failure"
      });

      setTimeout(() => {
        setAlertDetail({ show: false });
      }, 3000);

      return;
    }

    if (!newRecipe.parameter_name) {
      errorMessages.parameter_name = "參數名稱為必填欄位";
    }

    if (!newRecipe.main_gas) {
      errorMessages.main_gas = "主氣為必填欄位";
    }

    if (!newRecipe.carrier_gas) {
      errorMessages.carrier_gas = "載氣為必填欄位";
    }

    // 如果輸入的主氣轉換成數字後不為數字，則顯示錯誤訊息
    if (isNaN(newRecipe.main_gas_flow)) {
      errorMessages.main_gas_flow = "主氣流量需為數字";
    }

    if (Number(newRecipe.main_gas_flow) < 0) {
      errorMessages.main_gas_flow = "主氣流量需大於或等於0";
    }

    // 如果輸入的載氣轉換成數字後不為數字，則顯示錯誤訊息
    if (isNaN(newRecipe.carrier_gas_flow)) {
      errorMessages.carrier_gas_flow = "載氣流量需為數字";
    }

    if (Number(newRecipe.carrier_gas_flow) < 0) {
      errorMessages.carrier_gas_flow = "載氣流量需大於0";
    }

    // 載氣流量為大於範圍為0.01以上，小數點不得輸入超過2位
    if (newRecipe.carrier_gas_flow.toString().split(".")[1]?.length > 2) {
      errorMessages.carrier_gas_flow = "載氣流量小數點不得超過2位";
    }

    // 如果輸入的雷射功率轉換成數字後不為數字，則顯示錯誤訊息
    if (isNaN(newRecipe.laser_power)) {
      errorMessages.laser_power = "雷射功率需為數字";
    }

    // 如果雷射功率範圍不為0~90，且不是0.5的倍數，則顯示錯誤訊息
    if (Number(newRecipe.laser_power) < 0 || Number(newRecipe.laser_power) > 90) {
      errorMessages.laser_power = "雷射功率需介於0~90之間";
    }

    if (Number(newRecipe.laser_power) % 0.5 !== 0) {
      errorMessages.laser_power = "雷射功率需為0.5的倍數";
    }

    if (isNaN(newRecipe.temperature)) {
      errorMessages.temperature = "溫度需為數字";
    }

    if (Number(newRecipe.temperature) < 0) {
      errorMessages.temperature = "溫度需大於0";
    }

    if (Number(newRecipe.temperature) >100) {
      errorMessages.temperature = "溫度需小於100";
    }

    if (isNaN(newRecipe.voltage)) {
      errorMessages.voltage = "電壓需為數字";
    }

    if (Number(newRecipe.voltage) < 0) {
      errorMessages.voltage = "電壓需大於0";
    }

    if (Number(newRecipe.voltage) > 1000) {
      errorMessages.voltage = "電壓需小於1000";
    }

    if (
      errorMessages.parameter_name ||
      errorMessages.main_gas_flow ||
      errorMessages.main_gas ||
      errorMessages.carrier_gas_flow ||
      errorMessages.carrier_gas ||
      errorMessages.laser_power ||
      errorMessages.temperature ||
      errorMessages.voltage
    ) {
      setInputErrorMessages(errorMessages);
      return;
    }

    setInputErrorMessages(errorMessages);

    addNewRecipeApi();

  };

  // 關閉 Alert 的 onClick 事件
  const onAlertClose = () => {
    setAlertDetail({
      show: false,
      message: "",
      type: "success"
    });
  };

  React.useEffect(() => {
    getRecipesDataApi();
  }, []);

  return {
    alertDetail,
    recipes,
    newRecipe,
    inputErrorMessages,
    handleNewRecipeChange,
    handleAddNewRecipe,
    onAlertClose
  };
};

const RecipePage = () => {
  const {
    alertDetail, recipes, newRecipe, inputErrorMessages,
    handleNewRecipeChange, handleAddNewRecipe, onAlertClose
  } = useHooks();

  return (
    <div className="min-h-allView p-4 bg-gray-200">
      <AlertComponent
        show={alertDetail.show}
        message={alertDetail.message}
        onClose={onAlertClose}
        type={alertDetail.type}
      />
      <div className="min-h-allView p-4 bg-gray-200 grid grid-cols-12 gap-4">
        {/* 參數設定區塊 */}
        <div className="bg-white p-4 rounded shadow mb-4 col-span-12 lg:col-span-3">
          <h3 className="font-bold mb-4">參數設定</h3>
          <div className="space-y-4">
          <div className='grid gap-4 grid-cols-12'>
            <div className="flex items-center gap-2 col-span-6 lg:col-span-12">
              <span className="w-24">參數名稱:</span>
              <AddRecipeInput
                type="text"
                name="parameter_name"
                value={newRecipe.parameter_name}
                onChange={handleNewRecipeChange}
              />
            </div>
            <ErrorMessage
              flag={inputErrorMessages?.parameter_name}
              message={inputErrorMessages?.parameter_name}
            />
            <div className="flex items-center gap-2 col-span-6 lg:col-span-12">
              <span className="w-24">主氣流量:</span>
              <AddRecipeInput
                type="number"
                name="main_gas_flow"
                value={newRecipe.main_gas_flow}
                onChange={handleNewRecipeChange}
              />
              <span className="w-12">SLM</span>
            </div>
            <ErrorMessage
              flag={inputErrorMessages?.main_gas_flow}
              message={inputErrorMessages?.main_gas_flow}
            />
            <div className="flex items-center gap-2 col-span-6 lg:col-span-12">
              <span className="w-24">主氣:</span>
              <AddRecipeInput
                type="text"
                name="main_gas"
                value={newRecipe.main_gas}
                onChange={handleNewRecipeChange}
              />
            </div>
            <ErrorMessage
              flag={inputErrorMessages?.main_gas}
              message={inputErrorMessages?.main_gas}
            />
            <p className="text-sm text-blue-500 text-bold col-span-12 lg:col-span-12">* 設定前請先確認該流量計是否有支援，未設定將預設為N2</p>
            <div className="flex items-center gap-2 col-span-6 lg:col-span-12">
              <span className="w-24">載氣流量:</span>
              <AddRecipeInput
                type="number"
                name="carrier_gas_flow"
                value={newRecipe.carrier_gas_flow}
                onChange={handleNewRecipeChange}
              />
              <span className="w-12">SLM</span>
            </div>
            <ErrorMessage
              flag={inputErrorMessages?.carrier_gas_flow}
              message={inputErrorMessages?.carrier_gas_flow}
            />
            <div className="flex items-center gap-2 col-span-6 lg:col-span-12">
              <span className="w-24">載氣:</span>
              <AddRecipeInput
                type="text"
                name="carrier_gas"
                value={newRecipe.carrier_gas}
                onChange={handleNewRecipeChange}
              />
            </div>
            <p className="text-sm text-blue-500 text-bold col-span-12 lg:col-span-12">* 設定前請先確認該流量計是否有支援，未設定將預設為Ar</p>
            <div className="flex items-center gap-2 col-span-6 lg:col-span-12">
              <span className="w-24">雷射功率:</span>
              <AddRecipeInput
                type="number"
                name="laser_power"
                value={newRecipe.laser_power}
                onChange={handleNewRecipeChange}
              />
              <span className="w-12">%</span>
            </div>
            <ErrorMessage
              flag={inputErrorMessages?.laser_power}
              message={inputErrorMessages?.laser_power}
            />
            <div className="flex items-center gap-2 col-span-6 lg:col-span-12">
              <span className="w-24">溫度設定:</span>
              <AddRecipeInput
                type="number"
                name="temperature"
                value={newRecipe.temperature}
                onChange={handleNewRecipeChange}
              />
              <span className="w-12">°C</span>
            </div>
            <ErrorMessage
              flag={inputErrorMessages?.temperature}
              message={inputErrorMessages?.temperature}
            />
            <div className="flex items-center gap-2 col-span-6 lg:col-span-12">
              <span className="w-24">電壓:</span>
              <AddRecipeInput
                type="number"
                name="voltage"
                value={newRecipe.voltage}
                onChange={handleNewRecipeChange}
              />
              <span className="w-12">V</span>
            </div>
            <ErrorMessage
              flag={inputErrorMessages?.voltage}
              message={inputErrorMessages?.voltage}
            />
          </div>
          <div className="flex justify-center">
            <button
              className="bg-blue-500 text-white font-bold py-2 px-4 rounded"
              onClick={handleAddNewRecipe}
            >
              新增參數
            </button>
          </div>
        </div>
      </div>

        {/* Recipe 列表區塊 */}
        <div className="bg-white p-4 rounded shadow mb-4 col-span-12 lg:col-span-9">
          <h3 className="font-bold mb-4">Recipe 列表</h3>
          <div className="overflow-auto">
            <Table hoverable>
              <Table.Head>
                <Table.HeadCell className="min-w-[100px]">參數名稱</Table.HeadCell>
                <Table.HeadCell className="min-w-[100px]">主氣 (slm)</Table.HeadCell>
                <Table.HeadCell className="min-w-[100px]">主氣氣體</Table.HeadCell>
                <Table.HeadCell className="min-w-[100px]">載氣 (slm)</Table.HeadCell>
                <Table.HeadCell className="min-w-[100px]">載氣氣體</Table.HeadCell>
                <Table.HeadCell className="min-w-[100px]">雷射功率 (%)</Table.HeadCell>
                <Table.HeadCell className="min-w-[100px]">溫度 (°C)</Table.HeadCell>
                <Table.HeadCell className="min-w-[100px]">電壓 (V)</Table.HeadCell>
                <Table.HeadCell className="min-w-[100px]">建立時間</Table.HeadCell>
                <Table.HeadCell className="min-w-[100px]">建立者</Table.HeadCell>
              </Table.Head>
              <Table.Body className="divide-y">
                {recipes?.length > 0 ? recipes?.map((recipe, index) => (
                  <Table.Row key={index} className="bg-white dark:border-gray-700 dark:bg-gray-800">
                    <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">{recipe?.parameter_name || "- -"}</Table.Cell>
                    <Table.Cell>{recipe?.main_gas_flow || 0}</Table.Cell>
                    <Table.Cell>{recipe?.main_gas || "- -"}</Table.Cell>
                    <Table.Cell>{recipe?.carrier_gas_flow || 0}</Table.Cell>
                    <Table.Cell>{recipe?.carrier_gas || "- -"}</Table.Cell>
                    <Table.Cell>{recipe?.laser_power || 0}</Table.Cell>
                    <Table.Cell>{recipe?.temperature || 0}</Table.Cell>
                    <Table.Cell>{recipe?.voltage || 0}</Table.Cell>
                    <Table.Cell>{recipe?.created_time || "- -"}</Table.Cell>
                    <Table.Cell>{recipe?.created_by || "- -"}</Table.Cell>
                  </Table.Row>
                )) : (
                  <Table.Row>
                    <Table.Cell colSpan={10} className="text-center text-gray-500 dark:text-white bg-gray-600">無資料</Table.Cell>
                  </Table.Row>
                )}
              </Table.Body>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipePage;