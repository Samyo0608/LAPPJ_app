import os
import pandas as pd
from datetime import datetime

from models.recipe_model import Recipe

class RecipeService:
    def __init__(self, excel_path='recipes.xlsx'):
        self.excel_path = excel_path
        # 如果檔案不存在，建立一個新的
        if not os.path.exists(self.excel_path):
            self._create_empty_excel()

    def _create_empty_excel(self):
        # """若無檔案則初始化一個空的 DataFrame，並寫入指定的欄位。"""
        columns = [
            "parameter_name", "main_gas_flow", "main_gas", 
            "carrier_gas_flow", "carrier_gas", "laser_power", 
            "temperature", "voltage", "created_time", "created_by",
            "last_modified", "modified_by", "is_active", 
            "description", "notes", "version", "id"
        ]
        df = pd.DataFrame(columns=columns)
        df.to_excel(self.excel_path, index=False)

    def get_all_recipes(self):
        df = pd.read_excel(self.excel_path, dtype=str)   # 全部先讀字串
        raw_records = df.to_dict("records")
        
        converted_records = []
        for row in raw_records:
            # 用 Recipe Model 驗證並轉型（若有欄位不合，會在這裡報錯）
            recipe_obj = Recipe(**row)
            converted_records.append(recipe_obj.dict())
            # 將 created_time 轉成 YYYY-MM-DD HH:mm:ss 格式
            converted_records[-1]["created_time"] = recipe_obj.created_time.strftime("%Y-%m-%d %H:%M:%S")
        
        return converted_records

    def add_recipe(self, recipe_data):
        # """
        # 新增一筆配方。
        # recipe_data 通常直接是 JSON (dict)，可考慮在此利用 Recipe 驗證/轉換。
        # """
        # 先做資料驗證
        recipe = Recipe(**recipe_data)
        row_dict = recipe.to_dict()

        # 讀取 excel，再 append
        df = pd.read_excel(self.excel_path)
        # append 在新版 pandas 已較不建議，可用 concat
        df = pd.concat([df, pd.DataFrame([row_dict])], ignore_index=True)
        #　create_time 為當下時間
        df.to_excel(self.excel_path, index=False)

        return row_dict

    def update_recipe(self, parameter_name, recipe_data):
        # """
        # 依照 parameter_name 更新一筆資料。 
        # 如果找不到，就視需求看要拋錯或是直接回傳 None 表示沒更新到。
        # """
        df = pd.read_excel(self.excel_path)
        # 找出目標列
        mask = df['parameter_name'] == parameter_name
        if not mask.any():
            raise ValueError(f"Recipe with parameter_name={parameter_name} not found.")

        # 先將舊資料讀出，做合併
        old_data = df[mask].to_dict('records')[0]
        # 合併欄位，更新時間
        old_recipe = Recipe(**old_data)
        old_recipe.update(recipe_data)    # 這會更新 last_modified
        # 假如要更新 modified_by，可在外面傳入
        # old_recipe.modified_by = recipe_data.get('modified_by', 'system')

        # 將新的資料寫回 dataframe
        updated_row = old_recipe.to_dict()
        for col, val in updated_row.items():
            df.loc[mask, col] = val

        df.to_excel(self.excel_path, index=False)
        return updated_row
