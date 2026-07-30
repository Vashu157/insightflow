import os
import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Any

from app.domains.shared.database import get_db
from app.domains.reports.schemas import (
    ChartConfig, DashboardSummary, TableRequest, TableResponse, 
    ChartResponse, BusinessReportResponse
)
from app.domains.reports.interfaces import IReportService
from app.domains.reports.dependencies import get_report_service
from app.domains.shared.dependencies import get_storage_service

router = APIRouter()

# Analytics routes
@router.get("/sessions/{session_id}/dashboard", response_model=DashboardSummary)
def get_dashboard_summary(
    session_id: str, 
    db: Session = Depends(get_db),
    report_service: IReportService = Depends(get_report_service)
):
    """Get the overall dashboard metadata summary."""
    return report_service.get_dashboard_summary(db, session_id)

@router.get("/sessions/{session_id}/charts", response_model=List[ChartConfig])
def get_saved_charts(
    session_id: str,
    report_service: IReportService = Depends(get_report_service)
):
    """Retrieve saved chart layout and configuration for a session."""
    return report_service.get_charts(session_id)

@router.get("/sessions/{session_id}/recommendations", response_model=List[ChartConfig])
def get_chart_recommendations(
    session_id: str,
    db: Session = Depends(get_db),
    report_service: IReportService = Depends(get_report_service)
):
    """Get AI-suggested chart configurations based on dataset schema."""
    return report_service.get_visualization_recommendations(db, session_id)

@router.post("/sessions/{session_id}/charts/save")
def save_charts(
    session_id: str, 
    charts: List[ChartConfig],
    report_service: IReportService = Depends(get_report_service)
):
    """Save the chart layout and configurations."""
    report_service.save_charts(session_id, charts)
    return {"status": "success"}

@router.post("/sessions/{session_id}/chart", response_model=ChartResponse)
def process_chart(
    session_id: str, 
    config: ChartConfig, 
    db: Session = Depends(get_db),
    report_service: IReportService = Depends(get_report_service)
):
    """Generate processed data for a specific chart configuration."""
    data = report_service.process_chart(db, session_id, config)
    return ChartResponse(config=config, data=data)

@router.post("/sessions/{session_id}/table", response_model=TableResponse)
def get_table_data(
    session_id: str, 
    request: TableRequest, 
    db: Session = Depends(get_db),
    report_service: IReportService = Depends(get_report_service)
):
    """Get paginated, filtered, and sorted table data."""
    return report_service.get_table_data(
        db=db, 
        session_id=session_id, 
        limit=request.limit, 
        offset=request.offset, 
        filters=request.filters or [],
        sort_column=request.sort_column,
        sort_desc=request.sort_desc
    )

# Insights routes
@router.get("/sessions/{session_id}/insights", response_model=BusinessReportResponse)
def get_insights(
    session_id: str,
    db: Session = Depends(get_db),
    storage = Depends(get_storage_service)
):
    """Retrieve the generated AI Business Analyst report from cache."""
    cache_path = storage.get_cache_path(session_id, "insights_report.json")
    if not os.path.exists(cache_path):
        raise HTTPException(status_code=404, detail="AI Insights not generated yet or generation failed.")
    try:
        with open(cache_path, "r") as f:
            data = json.load(f)
            return BusinessReportResponse(
                session_id=session_id,
                report=data["report"],
                generated_at=data["generated_at"],
                is_cached=True
            )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load AI Insights: {e}")

from fastapi.responses import StreamingResponse
from app.domains.reports.exports import ExportService

@router.get("/sessions/{session_id}/export/excel")
def export_excel(
    session_id: str,
    db: Session = Depends(get_db),
    report_service: IReportService = Depends(get_report_service),
    storage = Depends(get_storage_service)
):
    df = report_service._load_dataframe(db, session_id)
    profile = {}
    report = {}
    
    try:
        with open(storage.get_cache_path(session_id, "profile.json"), "r") as f:
            profile = json.load(f)
        with open(storage.get_cache_path(session_id, "insights_report.json"), "r") as f:
            report = json.load(f).get("report", {})
    except: pass
    
    output = ExportService.generate_excel_package(df, report, profile)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f"attachment; filename=insightflow_report_{session_id}.xlsx"}
    )

@router.get("/sessions/{session_id}/export/pdf")
def export_pdf(
    session_id: str,
    db: Session = Depends(get_db),
    report_service: IReportService = Depends(get_report_service),
    storage = Depends(get_storage_service)
):
    df = report_service._load_dataframe(db, session_id)
    profile = {}
    report = {}
    
    output = ExportService.generate_pdf_package(df, report, profile)
    return StreamingResponse(
        output,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=insightflow_report_{session_id}.pdf"}
    )
