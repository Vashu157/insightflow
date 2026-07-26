import secrets
import json
import os
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session as DBSession

from app.database.database import get_db
from app.models.session import Session
from app.storage.s3_storage import S3StorageService

router = APIRouter()
storage = S3StorageService()

@router.post("/sessions/{session_id}/share")
def generate_share_link(session_id: str, db: DBSession = Depends(get_db)):
    """Generate a unique token to publicly share the session insights (read-only)."""
    db_session = db.query(Session).filter(Session.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")
        
    if db_session.is_shared and db_session.share_token:
        return {"share_token": db_session.share_token}
        
    # Generate a random 32-character token
    token = secrets.token_urlsafe(32)
    db_session.is_shared = 1
    db_session.share_token = token
    db.commit()
    
    return {"share_token": token}

@router.get("/share/{token}")
def get_shared_report(token: str, db: DBSession = Depends(get_db)):
    """Retrieve the read-only shared report data for a given token."""
    db_session = db.query(Session).filter(Session.share_token == token).first()
    if not db_session or not db_session.is_shared:
        raise HTTPException(status_code=404, detail="Shared report not found or expired")
        
    session_id = str(db_session.id)
    
    # Load profile summary
    profile_data = {}
    profile_path = storage.read(session_id, "profile.json")
    if os.path.exists(profile_path):
        try:
            with open(profile_path, "r") as f:
                profile_data = json.load(f)
        except: pass
        
    # Load AI insights
    insights_data = {}
    insights_path = storage.read(session_id, "insights_report.json")
    if os.path.exists(insights_path):
        try:
            with open(insights_path, "r") as f:
                insights_data = json.load(f)
        except: pass
        
    # Load Charts
    charts_data = []
    charts_path = storage.read(session_id, "charts.json")
    if os.path.exists(charts_path):
        try:
            with open(charts_path, "r") as f:
                charts_data = json.load(f)
        except: pass

    return {
        "session": {
            "name": db_session.session_name,
            "filename": db_session.original_filename,
            "upload_time": db_session.upload_time,
            "expires_at": db_session.expires_at,
            "rows": db_session.row_count,
            "columns": db_session.column_count
        },
        "profile": profile_data.get("summary", {}),
        "insights": insights_data.get("report", {}),
        "charts": charts_data
    }
