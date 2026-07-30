from app.domains.ai.interfaces import IAIService
from app.domains.ai.service import AIServiceImpl
from app.domains.shared.dependencies import get_storage_service

_ai_service = AIServiceImpl(storage=get_storage_service())

def get_ai_service() -> IAIService:
    return _ai_service
