from fastapi import APIRouter, Depends, UploadFile, File
from sqlalchemy.orm import Session
from typing import Any

from app.domains.shared.database import get_db
from app.domains.session.schemas import SessionResponse, DatasetPreviewResponse
from app.domains.session.interfaces import ISessionService
from app.domains.session.dependencies import get_session_service

from app.core.security import validate_upload_file

session_router = APIRouter()
share_router = APIRouter()

@session_router.post("/upload", response_model=SessionResponse)
def upload_dataset(
    file: UploadFile = File(...), 
    db: Session = Depends(get_db),
    session_service: ISessionService = Depends(get_session_service)
) -> Any:
    validate_upload_file(file)
    return session_service.process_upload(db, file)

@session_router.get("/{session_id}", response_model=SessionResponse)
def get_session(
    session_id: str, 
    db: Session = Depends(get_db),
    session_service: ISessionService = Depends(get_session_service)
) -> Any:
    return session_service.get_session(db, session_id)

@session_router.get("/{session_id}/preview", response_model=DatasetPreviewResponse)
def preview_dataset(
    session_id: str, 
    limit: int = 20, 
    offset: int = 0, 
    db: Session = Depends(get_db),
    session_service: ISessionService = Depends(get_session_service)
) -> Any:
    return session_service.get_preview(db, session_id, limit, offset)

@session_router.delete("/{session_id}")
def delete_session(
    session_id: str, 
    db: Session = Depends(get_db),
    session_service: ISessionService = Depends(get_session_service)
) -> Any:
    return session_service.delete_session(db, session_id)

@session_router.post("/{session_id}/share")
def generate_share_link(
    session_id: str, 
    db: Session = Depends(get_db),
    session_service: ISessionService = Depends(get_session_service)
):
    """Generate a unique token to publicly share the session insights (read-only)."""
    return session_service.generate_share_link(db, session_id)


@share_router.get("/{token}")
def get_shared_report(
    token: str, 
    db: Session = Depends(get_db),
    session_service: ISessionService = Depends(get_session_service)
):
    """Retrieve the read-only shared report data for a given token."""
    return session_service.get_shared_report(db, token)
