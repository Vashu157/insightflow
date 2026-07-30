from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from typing import Any

from app.domains.shared.database import get_db
from app.domains.export.schemas import SQLExportRequest
from app.domains.export.interfaces import IExportService
from app.domains.export.dependencies import get_export_service

router = APIRouter()

@router.get("/sessions/{session_id}/export/data")
def export_dataset(
    session_id: str,
    format: str = Query("csv", description="Format: 'csv' or 'excel'"),
    db: Session = Depends(get_db),
    export_service: IExportService = Depends(get_export_service)
):
    """Export the raw dataset as CSV or Excel."""
    return export_service.export_dataset(db, session_id, format)

@router.post("/sessions/{session_id}/export/query")
def export_sql_query(
    session_id: str,
    request: SQLExportRequest,
    db: Session = Depends(get_db),
    export_service: IExportService = Depends(get_export_service)
):
    """Execute a SQL query against the dataset and export the results."""
    return export_service.export_sql_query(db, session_id, request)

@router.get("/sessions/{session_id}/export/report")
def export_analyst_report(
    session_id: str,
    export_service: IExportService = Depends(get_export_service)
):
    """Export the AI Business Analyst report as JSON."""
    return export_service.export_analyst_report(session_id)
