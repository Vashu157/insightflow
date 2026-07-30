from abc import ABC, abstractmethod
from typing import Any, Dict
from fastapi import UploadFile
from sqlalchemy.orm import Session
from app.domains.session.schemas import SessionResponse, DatasetPreviewResponse

class ISessionService(ABC):
    @abstractmethod
    def process_upload(self, db: Session, file: UploadFile) -> SessionResponse:
        pass
        
    @abstractmethod
    def get_session(self, db: Session, session_id: str) -> SessionResponse:
        pass
        
    @abstractmethod
    def get_preview(self, db: Session, session_id: str, limit: int = 20, offset: int = 0) -> DatasetPreviewResponse:
        pass
        
    @abstractmethod
    def delete_session(self, db: Session, session_id: str) -> dict:
        pass
        
    @abstractmethod
    def generate_share_link(self, db: Session, session_id: str) -> Dict[str, str]:
        pass
        
    @abstractmethod
    def get_shared_report(self, db: Session, token: str) -> Dict[str, Any]:
        pass
