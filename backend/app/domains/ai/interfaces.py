from abc import ABC, abstractmethod
from typing import List
from sqlalchemy.orm import Session
from app.domains.ai.schemas import ChatMessage

class IAIService(ABC):
    @abstractmethod
    def get_history(self, session_id: str) -> List[ChatMessage]:
        pass
        
    @abstractmethod
    def process_query(self, db: Session, session_id: str, question: str) -> ChatMessage:
        pass
