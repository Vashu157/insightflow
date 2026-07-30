from app.domains.session.interfaces import ISessionService
from app.domains.session.service import SessionServiceImpl
from app.domains.shared.dependencies import get_storage_service

_session_service = SessionServiceImpl(storage=get_storage_service())

def get_session_service() -> ISessionService:
    return _session_service
