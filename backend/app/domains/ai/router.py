from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.domains.shared.database import get_db
from app.domains.ai.schemas import AIQueryRequest, AIQueryResponse, ChatMessage
from app.domains.ai.interfaces import IAIService
from app.domains.ai.dependencies import get_ai_service

router = APIRouter()

@router.get("/sessions/{session_id}/ai/history", response_model=List[ChatMessage])
def get_chat_history(
    session_id: str,
    ai_service: IAIService = Depends(get_ai_service)
):
    """Retrieve chat history for the session."""
    return ai_service.get_history(session_id)

@router.post("/sessions/{session_id}/ai/query", response_model=AIQueryResponse)
def query_ai_assistant(
    session_id: str, 
    request: AIQueryRequest, 
    db: Session = Depends(get_db),
    ai_service: IAIService = Depends(get_ai_service)
):
    """Process a natural language question and return AI results."""
    ai_message = ai_service.process_query(db, session_id, request.question)
    return AIQueryResponse(message=ai_message)
