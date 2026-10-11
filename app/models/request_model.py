from pydantic import BaseModel, SecretStr
from typing import Optional, List, Dict, Any

class QueryRequest(BaseModel):
    host: str
    port: int
    user: str
    password: SecretStr
    database: str
    question: str
    conversation_history: Optional[List[Dict[str, Any]]] = None
    mask_pii: Optional[bool] = True

class ERDRequest(BaseModel):
    host: str
    port: int
    user: str
    password: SecretStr
    database: str

class TableListRequest(BaseModel):
    host: str
    port: int
    user: str
    password: SecretStr
    database: str

class TableDataRequest(BaseModel):
    host: str
    port: int
    user: str
    password: SecretStr
    database: str
    table_name: str
    page: Optional[int] = 1
    page_size: Optional[int] = 25
    search: Optional[str] = None

class TableInsertRequest(BaseModel):
    host: str
    port: int
    user: str
    password: SecretStr
    database: str
    table_name: str
    data: Dict[str, Any]

class TableUpdateRequest(BaseModel):
    host: str
    port: int
    user: str
    password: SecretStr
    database: str
    table_name: str
    primary_key: str
    primary_value: Any
    data: Dict[str, Any]

class TableDeleteRequest(BaseModel):
    host: str
    port: int
    user: str
    password: SecretStr
    database: str
    table_name: str
    primary_key: str
    primary_value: Any