import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.database.database import SessionLocal
from app.models.session import Session as SessionModel
from app.storage.local import LocalStorageService

logger = logging.getLogger(__name__)
storage = LocalStorageService(base_path="uploads")

async def cleanup_expired_sessions():
    """Background task that runs periodically to remove expired sessions."""
    logger.info("Starting background cleanup service for expired sessions...")
    while True:
        try:
            db: Session = SessionLocal()
            now = datetime.utcnow()
            
            # Find all expired sessions
            expired_sessions = db.query(SessionModel).filter(SessionModel.expires_at <= now).all()
            
            for session in expired_sessions:
                logger.info(f"Cleaning up expired session {session.id}")
                
                # Delete files
                storage.delete(str(session.id))
                
                # Delete from DB
                db.delete(session)
            
            if expired_sessions:
                db.commit()
                
            db.close()
        except Exception as e:
            logger.error(f"Error in cleanup service: {e}")
            
        # Sleep for 5 minutes before checking again
        await asyncio.sleep(300)
