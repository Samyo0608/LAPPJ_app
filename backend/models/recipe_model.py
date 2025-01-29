import math
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field, field_validator, ConfigDict
from uuid import UUID, uuid4

class Recipe(BaseModel):
    """
    Pydantic 2.x 版的 Recipe Model
    """

    id: Optional[UUID] = Field(default_factory=uuid4)
    parameter_name: str = Field(..., min_length=1, max_length=50)
    main_gas_flow: float = Field(..., ge=0)
    main_gas: str = Field(..., min_length=1)
    carrier_gas_flow: float = Field(..., ge=0)
    carrier_gas: str = Field(..., min_length=1)
    laser_power: float = Field(..., ge=0, le=100)
    temperature: float = Field(..., ge=0, le=100)
    voltage: float = Field(..., ge=0, le=1000)
    created_time: datetime = Field(default_factory=datetime.now)
    created_by: str = Field(..., min_length=1)
    last_modified: Optional[datetime] = None
    modified_by: Optional[str] = None
    is_active: bool = True
    description: Optional[str] = None
    notes: Optional[str] = None
    version: int = Field(default=1, ge=1)

    # 用於 Pydantic 2.x（取代舊版 schema_extra）
    model_config = ConfigDict(
        json_schema_extra={
            "example": {
                "parameter_name": "20250124測試",
                "main_gas_flow": 24.0,
                "main_gas": "N2",
                "carrier_gas_flow": 0.2,
                "carrier_gas": "mix_01",
                "laser_power": 8.0,
                "temperature": 80.0,
                "voltage": 270.0,
                "created_by": "尚祐"
            }
        }
    )

    # 改用 mode='before' 而非 pre=True
    @field_validator(
        "id", 
        "last_modified", 
        "modified_by", 
        "description", 
        "notes", 
        mode="before"
    )
    def handle_nan_values(cls, v):
        """如果讀到 float('nan') 或字串 'nan'，自動轉為 None"""
        if v is None:
            return None
        if isinstance(v, float) and math.isnan(v):
            return None
        if isinstance(v, str) and v.strip().lower() == "nan":
            return None
        return v

    def update(self, data: dict):
        for key, value in data.items():
            if hasattr(self, key):
                setattr(self, key, value)
        self.last_modified = datetime.now()

    def to_dict(self):
        """把物件轉成 dict，若欄位是 datetime 就轉成字串表示"""
        return {
            k: (str(v) if isinstance(v, datetime) else v)
            for k, v in self.dict().items()
        }
