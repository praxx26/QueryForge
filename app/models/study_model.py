from pydantic import BaseModel, SecretStr
from typing import Optional, List, Dict, Any

class StudyQueryRequest(BaseModel):
    question: str
    study_type: Optional[str] = "table" # "table" | "concept"
    conversation_history: Optional[List[Dict[str, Any]]] = None
    host: Optional[str] = None
    port: Optional[int] = None
    user: Optional[str] = None
    password: Optional[SecretStr] = None
    database: Optional[str] = None