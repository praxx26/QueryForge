from pydantic import BaseModel

class ExecuteHistory(BaseModel):
    database: str
    question: str
    sql_query: str
    results: list