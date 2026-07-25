from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
from app.ai.report_models import BusinessReport

class BusinessReportResponse(BaseModel):
    session_id: str
    report: BusinessReport
    generated_at: datetime
    is_cached: bool
