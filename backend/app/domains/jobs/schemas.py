from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class JobStatusResponse(BaseModel):
    job_id: str
    session_id: str
    job_type: str
    status: str
    progress: int
    created_at: datetime
    updated_at: datetime
    error_message: Optional[str] = None

class JobCreateResponse(BaseModel):
    job_id: str
    status: str
