from pydantic import BaseModel, UUID4
from typing import List, Dict, Any, Optional
from datetime import datetime

class SessionBase(BaseModel):
    session_name: str
    original_filename: str
    file_type: str
    file_size: int
    row_count: int
    column_count: int
    status: str

class SessionCreate(SessionBase):
    stored_filename: str
    expires_at: datetime

class SessionResponse(SessionBase):
    id: UUID4
    upload_time: datetime
    last_accessed: datetime
    expires_at: datetime

    class Config:
        from_attributes = True

class DatasetPreviewResponse(BaseModel):
    total_rows: int
    total_columns: int
    columns: List[str]
    data_types: Dict[str, str]
    data: List[Dict[str, Any]]

class DatasetVersionResponse(BaseModel):
    id: UUID4
    session_id: UUID4
    version_number: int
    created_at: datetime
    created_by: str
    change_summary: str
    row_count: int
    
    class Config:
        from_attributes = True
