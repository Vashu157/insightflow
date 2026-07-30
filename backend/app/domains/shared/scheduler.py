import asyncio
from datetime import datetime
from sqlalchemy.orm import Session
from croniter import croniter

from app.domains.shared.database import SessionLocal
from app.domains.shared.models import ScheduledRefresh, Session as SessionModel
from app.domains.shared.logging import logger

class SchedulerService:
    def __init__(self):
        self.is_running = False

    async def start(self):
        self.is_running = True
        logger.info("Starting background refresh scheduler")
        while self.is_running:
            try:
                self._check_and_run_refreshes()
            except Exception as e:
                logger.error(f"Error in scheduler loop: {e}", exc_info=True)
            
            await asyncio.sleep(60) # check every minute

    def stop(self):
        self.is_running = False
        logger.info("Stopping background refresh scheduler")

    def _check_and_run_refreshes(self):
        db: Session = SessionLocal()
        try:
            now = datetime.utcnow()
            due_refreshes = db.query(ScheduledRefresh).filter(
                ScheduledRefresh.is_active == True,
                (ScheduledRefresh.next_run_at <= now) | (ScheduledRefresh.next_run_at == None)
            ).all()

            for refresh in due_refreshes:
                logger.info(f"Triggering scheduled refresh for session {refresh.session_id}")
                try:
                    self._execute_refresh(db, refresh)
                    
                    # Update next run time
                    cron = croniter(refresh.cron_expression, now)
                    refresh.last_run_at = now
                    refresh.next_run_at = cron.get_next(datetime)
                    db.commit()
                except Exception as e:
                    logger.error(f"Failed to execute refresh {refresh.id}: {e}")
                    db.rollback()

        finally:
            db.close()

    def _execute_refresh(self, db: Session, refresh: ScheduledRefresh):
        # In a real enterprise system, this would:
        # 1. Fetch data from refresh.source_uri (e.g. S3, DB connection)
        # 2. Call DatasetVersionService to create a new DatasetVersion
        # 3. Fire Kafka event for profiling and insight generation
        # 4. Notify users
        logger.info(f"Mock executing data pull from {refresh.source_uri} for {refresh.session_id}")
        # Note: Implementation logic would go here.

scheduler_service = SchedulerService()
