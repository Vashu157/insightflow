"""
In-process job execution fallback.

On free-tier deployments (single web service + free Aiven Kafka), the Kafka
round-trip (producer -> broker -> consumer) is unreliable: the producer swallows
publish errors and idle Aiven connections get reset. That leaves jobs stuck in
QUEUED forever.

This module guarantees a job still runs by executing it directly inside the web
process. It atomically claims the job (UPDATE ... WHERE status='QUEUED') so it is
safe to run alongside a real Kafka worker or a separate worker service: whoever
claims first wins, the other no-ops.
"""
import asyncio
from typing import Set

from sqlalchemy import update

from app.domains.shared.database import SessionLocal
from app.domains.shared.models import Job
from app.domains.jobs.executor import JobExecutor
from app.domains.jobs.events import EventSchema
from app.domains.jobs.producer import producer_client
from app.domains.profiling.dependencies import get_profiling_service
from app.domains.reports.dependencies import get_report_service
from app.domains.shared.logging import logger

# Keep strong references so fire-and-forget tasks are not garbage collected.
_background_tasks: Set[asyncio.Task] = set()


async def _publish_update(job_id: str, session_id: str, **payload) -> None:
    """Best-effort live update over Kafka -> WebSocket. Frontend polling is the
    source of truth for status, so failures here are non-fatal."""
    try:
        event = EventSchema(
            job_id=job_id,
            session_id=session_id,
            event_type="job.updates",
            payload=payload,
        )
        await producer_client.publish("job.updates", event)
    except Exception:
        pass


async def run_job_in_process(job_id: str, session_id: str, job_type: str) -> None:
    """Atomically claim a QUEUED job and run it in-process. No-op if already claimed."""
    loop = asyncio.get_running_loop()
    db = SessionLocal()
    try:
        result = db.execute(
            update(Job).where(Job.id == job_id, Job.status == "QUEUED").values(status="RUNNING")
        )
        db.commit()
        if result.rowcount == 0:
            # Another worker (Kafka consumer / separate worker service) already took it.
            return

        logger.info(f"[in-process] Executing {job_type} job {job_id}")
        await _publish_update(job_id, session_id, status="RUNNING", current_stage="Started", progress=0)

        def update_progress(pct: int, current_stage: str = "Processing") -> None:
            db_progress = SessionLocal()
            try:
                db_progress.execute(update(Job).where(Job.id == job_id).values(progress=pct))
                db_progress.commit()
            finally:
                db_progress.close()
            asyncio.run_coroutine_threadsafe(
                _publish_update(job_id, session_id, status="RUNNING", current_stage=current_stage, progress=pct),
                loop,
            )

        if job_type == "PROFILING":
            service = get_profiling_service()
            await JobExecutor.execute(
                service.generate_profile, db, session_id, progress_callback=update_progress
            )
        else:
            service = get_report_service()
            await JobExecutor.execute(
                service.generate_report, db, session_id, force_refresh=True, progress_callback=update_progress
            )

        db.execute(update(Job).where(Job.id == job_id).values(status="COMPLETED", progress=100))
        db.commit()
        await _publish_update(job_id, session_id, status="COMPLETED", current_stage="Completed", progress=100)
        logger.info(f"[in-process] Job {job_id} completed")

    except Exception as e:
        logger.error(f"[in-process] Job {job_id} failed: {e}", exc_info=True)
        try:
            db.rollback()
            db.execute(update(Job).where(Job.id == job_id).values(status="FAILED", error_message=str(e)))
            db.commit()
        except Exception as inner:
            logger.error(f"[in-process] Failed to persist FAILED state for {job_id}: {inner}")
        await _publish_update(
            job_id, session_id, status="FAILED", current_stage="Failed", progress=0, error_message=str(e)
        )
    finally:
        db.close()


async def _delayed_fallback(job_id: str, session_id: str, job_type: str, delay: float) -> None:
    try:
        await asyncio.sleep(delay)
        await run_job_in_process(job_id, session_id, job_type)
    except asyncio.CancelledError:
        pass
    except Exception as e:
        logger.error(f"[in-process] Fallback for job {job_id} errored: {e}", exc_info=True)


def schedule_fallback(job_id: str, session_id: str, job_type: str, delay: float = 5.0) -> None:
    """Schedule an in-process run of the job after `delay` seconds.

    If a Kafka worker claims the job first, the fallback no-ops. If Kafka is down
    or no worker is running, this ensures the job still completes.
    """
    task = asyncio.create_task(_delayed_fallback(job_id, session_id, job_type, delay))
    _background_tasks.add(task)
    task.add_done_callback(_background_tasks.discard)
