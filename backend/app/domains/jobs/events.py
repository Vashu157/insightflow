from pydantic import BaseModel, Field
from typing import Dict, Any, Optional
from datetime import datetime
import uuid

class EventSchema(BaseModel):
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    job_id: str
    session_id: str
    event_type: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    payload: Dict[str, Any] = Field(default_factory=dict)
