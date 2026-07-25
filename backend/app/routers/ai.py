from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List

from app.database.database import get_db
from app.schemas.ai import AIQueryRequest, AIQueryResponse, ChatMessage
from app.ai.chat_service import ChatService

router = APIRouter()

@router.get("/sessions/{session_id}/ai/history", response_model=List[ChatMessage])
def get_chat_history(session_id: str):
    """Retrieve chat history for the session."""
    return ChatService.get_history(session_id)

@router.post("/sessions/{session_id}/ai/query", response_model=AIQueryResponse)
def query_ai_assistant(session_id: str, request: AIQueryRequest, db: Session = Depends(get_db)):
    """Process a natural language question and return AI results."""
    ai_message = ChatService.process_query(db, session_id, request.question)
    return AIQueryResponse(message=ai_message)
