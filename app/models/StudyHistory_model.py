from pydantic import BaseModel

class StudyHistory(BaseModel):
    question: str
    sql_query: str
    explanation: str