from pydantic import BaseModel

class SQLExportRequest(BaseModel):
    sql_query: str
    format: str = "csv"
