from abc import ABC, abstractmethod
from typing import Any, Callable, Optional
from sqlalchemy.orm import Session
from app.domains.profiling.schemas import DatasetProfile, ColumnDetails

class IProfilingService(ABC):
    @abstractmethod
    def generate_profile(self, db: Session, session_id: str, progress_callback: Optional[Callable[[int], None]] = None) -> DatasetProfile:
        pass
        
    @abstractmethod
    def get_column_profile(self, db: Session, session_id: str, column_name: str) -> ColumnDetails:
        pass
