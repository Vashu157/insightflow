import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime
from sqlalchemy.dialects.postgresql import UUID

from app.models.base import Base

class Session(Base):
    __tablename__ = "sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    session_name = Column(String, index=True)
    original_filename = Column(String)
    stored_filename = Column(String)
    file_type = Column(String)
    file_size = Column(Integer)
    row_count = Column(Integer)
    column_count = Column(Integer)
    status = Column(String, default="active")
    upload_time = Column(DateTime, default=datetime.utcnow)
    last_accessed = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime)
    
    # Sharing functionality
    is_shared = Column(Integer, default=0) # using Integer as boolean for cross-db compatibility
    share_token = Column(String, unique=True, index=True, nullable=True)
