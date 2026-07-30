import uuid
from fastapi import APIRouter, Depends, BackgroundTasks, HTTPException
from sqlalchemy.orm import Session
from app.domains.shared.database import get_db
from app.domains.shared.models import Job, Session as SessionModel
from app.domains.jobs.schemas import JobStatusResponse, JobCreateResponse
from app.domains.jobs.worker import run_profiling_job, run_report_job

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

@router.post("/profile/{session_id}", response_model=JobCreateResponse)
def start_profiling_job(session_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Triggers an asynchronous profiling job."""
    db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    job_id_str = str(uuid.uuid4())
    job = Job(id=job_id_str, session_id=session_id, job_type="PROFILING", status="QUEUED")
    db.add(job)
    db.commit()

    background_tasks.add_task(run_profiling_job, job_id=job_id_str, session_id=session_id)
    return JobCreateResponse(job_id=job_id_str, status="QUEUED")

@router.post("/report/{session_id}", response_model=JobCreateResponse)
def start_report_job(session_id: str, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Triggers an asynchronous AI Business Report generation job."""
    db_session = db.query(SessionModel).filter(SessionModel.id == session_id).first()
    if not db_session:
        raise HTTPException(status_code=404, detail="Session not found")

    job_id_str = str(uuid.uuid4())
    job = Job(id=job_id_str, session_id=session_id, job_type="REPORT_GENERATION", status="QUEUED")
    db.add(job)
    db.commit()

    background_tasks.add_task(run_report_job, job_id=job_id_str, session_id=session_id)
    return JobCreateResponse(job_id=job_id_str, status="QUEUED")
