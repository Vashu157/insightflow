import uuid
from typing import Callable
from sqlalchemy.orm import Session
from app.domains.shared.database import SessionLocal
from app.domains.shared.models import Job, Session as SessionModel
from app.domains.shared.logging import logger, current_job_id, current_session_id
from app.domains.profiling.dependencies import get_profiling_service
from app.domains.reports.dependencies import get_report_service

def _run_job_execution(job_id: str, session_id: str, execution_logic: Callable[[Session, str, Callable[[int], None]], None]):
    """Generic wrapper for background job execution to handle state and DB sessions."""
    current_job_id.set(job_id)
    current_session_id.set(session_id)
    logger.info(f"Background worker picked up job {job_id}")

    db: Session = SessionLocal()
    try:
        job = db.query(Job).filter(Job.id == job_id).first()
        if not job:
            logger.error(f"Job {job_id} not found in DB")
            return

        job.status = "RUNNING"
        db.commit()

        def update_progress(pct: int):
            job.progress = pct
            db.commit()
            logger.info(f"Job {job_id} progress updated to {pct}%")

        # Execute the pure business logic decoupled from Job tracking
        execution_logic(db, session_id, update_progress)

        job.status = "COMPLETED"
        job.progress = 100
        db.commit()
        logger.info(f"Job {job_id} finished successfully")

    except Exception as e:
        logger.error(f"Job {job_id} failed: {e}", exc_info=True)
        # Attempt to mark the job as FAILED
        try:
            db.rollback()
            job = db.query(Job).filter(Job.id == job_id).first()
            if job:
                job.status = "FAILED"
                job.error_message = str(e)
                db.commit()
        except Exception as rollback_e:
            logger.error(f"Failed to update job status on error: {rollback_e}")
    finally:
        db.close()
        current_job_id.set("")
        current_session_id.set("")


def run_profiling_job(job_id: str, session_id: str):
    """Background task specifically for profiling."""
    profiling_service = get_profiling_service()
    
    def logic(db: Session, sid: str, update_progress: Callable[[int], None]):
        profiling_service.generate_profile(db, sid, update_progress)
        
    _run_job_execution(job_id, session_id, logic)


def run_report_job(job_id: str, session_id: str):
    """Background task specifically for AI report generation."""
    report_service = get_report_service()
    
    def logic(db: Session, sid: str, update_progress: Callable[[int], None]):
        report_service.generate_report(db, sid, force_refresh=True, progress_callback=update_progress)
        
    _run_job_execution(job_id, session_id, logic)
