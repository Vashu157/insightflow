from abc import ABC, abstractmethod
from typing import List, Dict, Any, Callable, Optional
from sqlalchemy.orm import Session
from app.domains.reports.schemas import (
    ChartConfig, DashboardSummary, FilterRule, 
    BusinessReportResponse, BusinessReport
)

class IReportService(ABC):
    @abstractmethod
    def get_dashboard_summary(self, db: Session, session_id: str) -> DashboardSummary:
        pass
        
    @abstractmethod
    def get_charts(self, session_id: str) -> List[ChartConfig]:
        pass
        
    @abstractmethod
    def save_charts(self, session_id: str, charts: List[ChartConfig]):
        pass
        
    @abstractmethod
    def process_chart(self, db: Session, session_id: str, config: ChartConfig) -> List[Dict[str, Any]]:
        pass
        
    @abstractmethod
    def get_table_data(self, db: Session, session_id: str, limit: int, offset: int, filters: List[FilterRule], sort_column: str = None, sort_desc: bool = False) -> Dict[str, Any]:
        pass
        
    @abstractmethod
    def generate_report(self, db: Session, session_id: str, force_refresh: bool = False) -> Dict[str, Any]:
        pass
