import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.domains.shared.database import get_db
from app.domains.shared.models import Job, Session as SessionModel
from app.domains.jobs.schemas import JobStatusResponse, JobCreateResponse
from app.domains.jobs.events import EventSchema
from app.domains.jobs.producer import producer_client
from app.domains.jobs.inprocess import schedule_fallback

router = APIRouter()

@router.get("/{job_id}", response_model=JobStatusResponse)
def get_job_status(job_id: str, db: Session = Depends(get_db)):
    """Retrieve the status and progress of a background job."""
    job = db.query(Job).filter(Job.id == job_id).first()
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return JobStatusResponse(
        job_id=str(job.id),
        session_id=str(job.session_id),
        job_type=job.job_type,
        status=job.status,
        progress=job.progress,
        created_at=job.created_at,
        updated_at=job.updated_at,
        error_message=job.error_message
    )

@router.get("/session/{session_id}/active", response_model=JobStatusResponse)
def get_active_job_for_session(session_id: str, db: Session = Depends(get_db)):
    """Retrieve the currently active (QUEUED or RUNNING) job for a session."""
    job = db.query(Job).filter(
        Job.session_id == session_id,
        Job.status.in_(["QUEUED", "RUNNING"])
    ).order_by(Job.created_at.desc()).first()
    
    if not job:
        raise HTTPException(status_code=404, detail="No active jobs found for this session")
    
    return JobStatusResponse(
        job_id=str(job.id),
        session_id=str(job.session_id),
        job_type=job.job_type,
        status=job.status,
        progress=job.progress,
        created_at=job.created_at,
        updated_at=job.updated_at,
        error_message=job.error_message
    )

@router.post("/profile/{session_id}", response_model=JobCreateResponse)
async def start_profiling_job(session_id: str, db: Session = Depends(get_db)):
    """Triggers an asynchronous profiling job via Kafka."""
    db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    job_id_str = str(uuid.uuid4())
    job = Job(id=job_id_str, session_id=session_id, job_type="PROFILING", status="QUEUED")
    db.add(job)
    db.commit()

    event = EventSchema(
        job_id=job_id_str,
        session_id=session_id,
        event_type="dataset.uploaded"
    )
    await producer_client.publish("dataset.uploaded", event)

    # Guarantee execution even if Kafka publish/round-trip fails on free tier.
    # No-ops if a Kafka worker claims the job first.
    schedule_fallback(job_id_str, session_id, "PROFILING")

    return JobCreateResponse(job_id=job_id_str, status="QUEUED")

@router.post("/report/{session_id}", response_model=JobCreateResponse)
async def start_report_job(session_id: str, db: Session = Depends(get_db)):
    """Triggers an asynchronous AI Business Report generation job via Kafka."""
    db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    job_id_str = str(uuid.uuid4())
    job = Job(id=job_id_str, session_id=session_id, job_type="REPORT_GENERATION", status="QUEUED")
    db.add(job)
    db.commit()

    event = EventSchema(
        job_id=job_id_str,
        session_id=session_id,
        event_type="report.requested"
    )
    await producer_client.publish("report.requested", event)

    # Guarantee execution even if Kafka publish/round-trip fails on free tier.
    # No-ops if a Kafka worker claims the job first.
    schedule_fallback(job_id_str, session_id, "REPORT_GENERATION")

    return JobCreateResponse(job_id=job_id_str, status="QUEUED")
