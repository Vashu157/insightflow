from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.domains.shared.database import get_db
from app.domains.shared.models import Job, ProcessedEvent
from app.core.circuit_breaker import gemini_circuit_breaker

admin_router = APIRouter()

@admin_router.get("/status")
def get_admin_status(db: Session = Depends(get_db)):
    running_jobs = db.query(Job).filter(Job.status == "RUNNING").all()
    queued_jobs_count = db.query(Job).filter(Job.status == "QUEUED").count()
    failed_jobs = db.query(Job).filter(Job.status == "FAILED").order_by(Job.updated_at.desc()).limit(10).all()
    recent_events_count = db.query(ProcessedEvent).count()

    return {
        "summary": {
            "queued_jobs": queued_jobs_count,
            "running_jobs_count": len(running_jobs),
            "total_processed_events": recent_events_count,
            "gemini_circuit_breaker": gemini_circuit_breaker.state,
        },
        "running_jobs": [
            {
                "job_id": j.id,
                "session_id": j.session_id,
                "job_type": j.job_type,
                "progress": j.progress,
                "created_at": j.created_at.isoformat() if j.created_at else None
            }
            for j in running_jobs
        ],
        "recent_failures": [
            {
                "job_id": j.id,
                "session_id": j.session_id,
                "job_type": j.job_type,
                "error_message": j.error_message,
                "failed_at": j.updated_at.isoformat() if j.updated_at else None
            }
            for j in failed_jobs
        ]
    }
