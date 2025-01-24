import React from 'react';
import { getApi } from '../../utils/getApi';
import { Table } from "flowbite-react";

const useHooks = () => {
  const [recipes, setRecipes] = React.useState([{}]);

  const getRecipesDataApi = async () => {
    const response = await getApi('/recipe_api/get_recipes', 'GET');

    if (response?.status === 'success') {
      
      if (response?.data?.length > 0) {
        console.log("data", response.data);

        console.log("response", response);
        setRecipes(response.data.data);
      } else {
        setRecipes({});
      }
    }
  };

  React.useEffect(() => {
    getRecipesDataApi();
  }, []);

  return {
    recipes
  };
};



const RecipePage = () => {
  const { recipes } = useHooks();

  return (
    <div className="min-h-allView p-4 bg-gray-200">
      <div className="min-h-allView p-4 bg-gray-200 grid grid-cols-12 gap-4">
        {/* 參數設定區塊 */}
        <div className="bg-white p-4 rounded shadow mb-4 col-span-12 lg:col-span-3">
          <h3 className="font-bold mb-4">參數設定</h3>
          <div className="space-y-4">
          <div className='grid gap-4 grid-cols-12'>
            <div className="flex items-center gap-2 col-span-6 lg:col-span-12">
              <span className="w-24">參數名稱:</span>
              <input type="number" className="border rounded p-2 flex-1 w-24" />
            </div>
            <div className="flex items-center gap-2 col-span-6 lg:col-span-12">
              <span className="w-24">主氣流量:</span>
              <input type="number" className="border rounded p-2 flex-1 w-24" />
              <span className="w-12">SLM</span>
            </div>
            <div className="flex items-center gap-2 col-span-6 lg:col-span-12">
              <span className="w-24">主氣</span>
              <input type="number" className="border rounded p-2 flex-1 w-24" />
              <span className="w-12">SLM</span>
            </div>
            <div className="flex items-center gap-2 col-span-6 lg:col-span-12">
              <span className="w-24">載氣流量:</span>
              <input type="number" className="border rounded p-2 flex-1 w-24" />
              <span className="w-12">SLM</span>
            </div>
            <div className="flex items-center gap-2 col-span-6 lg:col-span-12">
              <span className="w-24">雷射功率:</span>
              <input type="number" className="border rounded p-2 flex-1 w-24" />
              <span className="w-12">%</span>
            </div>
            <div className="flex items-center gap-2 col-span-6 lg:col-span-12">
              <span className="w-24">溫度設定:</span>
              <input type="number" className="border rounded p-2 flex-1 w-24" />
              <span className="w-12">°C</span>
            </div>
            <div className="flex items-center gap-2 col-span-6 lg:col-span-12">
              <span className="w-24">電壓:</span>
              <input type="number" className="border rounded p-2 flex-1 w-24" />
              <span className="w-12">V</span>
            </div>
          </div>
          <div className="flex justify-center">
            <button className="bg-blue-500 text-white font-bold py-2 px-4 rounded">新增參數</button>
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
                <Table.Row className="bg-white dark:border-gray-700 dark:bg-gray-800">
                  <Table.Cell className="whitespace-nowrap font-medium text-gray-900 dark:text-white">20250124測試</Table.Cell>
                  <Table.Cell>24</Table.Cell>
                  <Table.Cell>N2</Table.Cell>
                  <Table.Cell>0.2</Table.Cell>
                  <Table.Cell>mix_01</Table.Cell>
                  <Table.Cell>8</Table.Cell>
                  <Table.Cell>80</Table.Cell>
                  <Table.Cell>270</Table.Cell>
                  <Table.Cell>2025.01.25</Table.Cell>
                  <Table.Cell>尚祐</Table.Cell>
                </Table.Row>
              </Table.Body>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RecipePage;