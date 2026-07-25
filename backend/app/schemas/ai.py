from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
from datetime import datetime

class AIQueryRequest(BaseModel):
    question: str

class ChatMessage(BaseModel):
    id: str
    role: str  # "user" or "ai"
    content: str
    timestamp: datetime
    
    # Only populated if role == "ai"
    sql_query: Optional[str] = None
    execution_time_ms: Optional[float] = None
    row_count: Optional[int] = None
    results: Optional[Dict[str, Any]] = None # Contains 'columns' and 'data'

class AIQueryResponse(BaseModel):
    message: ChatMessage
