from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import Any

from app.database.database import get_db
from app.schemas.session import SessionResponse, DatasetPreviewResponse
from app.services.session_service import SessionService

router = APIRouter()

@router.post("/upload", response_model=SessionResponse)
def upload_dataset(file: UploadFile = File(...), db: Session = Depends(get_db)) -> Any:
    """Upload a CSV or Excel dataset to create a new session."""
    return SessionService.process_upload(db, file)

@router.get("/{session_id}", response_model=SessionResponse)
def get_session(session_id: str, db: Session = Depends(get_db)) -> Any:
    """Get metadata for a specific session."""
    return SessionService.get_session(db, session_id)

@router.get("/{session_id}/preview", response_model=DatasetPreviewResponse)
def preview_dataset(session_id: str, limit: int = 20, offset: int = 0, db: Session = Depends(get_db)) -> Any:
    """Preview the first N rows of the dataset."""
    return SessionService.get_preview(db, session_id, limit, offset)

@router.delete("/{session_id}")
def delete_session(session_id: str, db: Session = Depends(get_db)) -> Any:
    """Delete a session and its associated files."""
    return SessionService.delete_session(db, session_id)
