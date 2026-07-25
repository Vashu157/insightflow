from fastapi import APIRouter, Depends
from typing import Dict, Any

from app.schemas.insights import BusinessReportResponse
from app.ai.business_analyst import BusinessAnalyst

router = APIRouter()

@router.get("/sessions/{session_id}/insights", response_model=BusinessReportResponse)
def get_insights(session_id: str):
    """Retrieve or generate the proactive AI Business Analyst report."""
    data = BusinessAnalyst.generate_report(session_id, force_refresh=False)
    return BusinessReportResponse(
        session_id=session_id,
        report=data["report"],
        generated_at=data["generated_at"],
        is_cached=data["is_cached"]
    )

@router.post("/sessions/{session_id}/insights/refresh", response_model=BusinessReportResponse)
def refresh_insights(session_id: str):
    """Force regenerate the AI Business Analyst report."""
    data = BusinessAnalyst.generate_report(session_id, force_refresh=True)
    return BusinessReportResponse(
        session_id=session_id,
        report=data["report"],
        generated_at=data["generated_at"],
        is_cached=data["is_cached"]
    )

@router.get("/sessions/{session_id}/summary")
def get_executive_summary(session_id: str) -> Dict[str, Any]:
    """Retrieve only the executive summary from the report."""
    data = BusinessAnalyst.generate_report(session_id, force_refresh=False)
    return data["report"]["executive_summary"]
