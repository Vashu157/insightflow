from abc import ABC, abstractmethod
from typing import Any
from fastapi.responses import StreamingResponse, FileResponse
from sqlalchemy.orm import Session
from app.domains.export.schemas import SQLExportRequest

class IExportService(ABC):
    @abstractmethod
    def export_dataset(self, db: Session, session_id: str, format: str) -> Any:
        pass
        
    @abstractmethod
    def export_sql_query(self, db: Session, session_id: str, request: SQLExportRequest) -> Any:
        pass
        
    @abstractmethod
    def export_analyst_report(self, session_id: str) -> Any:
        pass
