from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List, Dict, Any

from app.database.database import get_db
from app.schemas.analytics import ChartConfig, ChartResponse, DashboardSummary, FilterRequest, TableRequest, TableResponse
from app.services.analytics_service import AnalyticsService

router = APIRouter()

@router.get("/sessions/{session_id}/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(session_id: str, db: Session = Depends(get_db)):
    """Get the overall dashboard metadata summary."""
    return AnalyticsService.get_dashboard_summary(db, session_id)

@router.get("/sessions/{session_id}/charts", response_model=List[ChartConfig])
def get_saved_charts(session_id: str):
    """Retrieve saved chart layout and configuration for a session."""
    return AnalyticsService.get_charts(session_id)

@router.post("/sessions/{session_id}/charts/save")
def save_charts(session_id: str, charts: List[ChartConfig]):
    """Save the chart layout and configurations."""
    AnalyticsService.save_charts(session_id, charts)
    return {"status": "success"}

@router.post("/sessions/{session_id}/chart", response_model=ChartResponse)
def process_chart(session_id: str, config: ChartConfig, db: Session = Depends(get_db)):
    """Generate processed data for a specific chart configuration."""
    data = AnalyticsService.process_chart(db, session_id, config)
    return ChartResponse(config=config, data=data)

@router.post("/sessions/{session_id}/table", response_model=TableResponse)
def get_table_data(session_id: str, request: TableRequest, db: Session = Depends(get_db)):
    """Get paginated, filtered, and sorted table data."""
    return AnalyticsService.get_table_data(
        db=db, 
        session_id=session_id, 
        limit=request.limit, 
        offset=request.offset, 
        filters=request.filters or [],
        sort_column=request.sort_column,
        sort_desc=request.sort_desc
    )
