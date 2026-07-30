import uuid
from datetime import datetime
from sqlalchemy import Column, String, Integer, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID

from app.domains.shared.database import Base

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
    
    is_shared = Column(Integer, default=0)
    share_token = Column(String, unique=True, index=True, nullable=True)


class Job(Base):
    __tablename__ = "jobs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4, index=True)
    session_id = Column(UUID(as_uuid=True), ForeignKey("sessions.id", ondelete="CASCADE"), index=True)
    job_type = Column(String, index=True) # "PROFILING", "REPORT_GENERATION", etc.
    status = Column(String, default="QUEUED", index=True) # QUEUED, RUNNING, COMPLETED, FAILED
    progress = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    error_message = Column(String, nullable=True)

class ProcessedEvent(Base):
    __tablename__ = "processed_events"
    
    event_id = Column(String, primary_key=True, index=True)
    processed_at = Column(DateTime, default=datetime.utcnow)
