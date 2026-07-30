import asyncio
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from app.domains.shared.database import SessionLocal
from app.domains.shared.models import Session as SessionModel
from app.domains.shared.s3_storage import S3StorageService
from app.domains.shared.logging import logger

storage = S3StorageService()

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
