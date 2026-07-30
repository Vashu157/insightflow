from typing import List, Optional
from sqlalchemy.orm import Session
from app.domains.shared.models import Notification
from app.domains.shared.websocket import manager
import asyncio

class NotificationService:
    @staticmethod
    def send_notification(
        db: Session, 
        session_id: str, 
        type: str, 
        title: str, 
        message: str
    ) -> Notification:
        notif = Notification(
            session_id=session_id,
            type=type,
            title=title,
            message=message,
            is_read=False
        )
        db.add(notif)
        db.commit()
        db.refresh(notif)
        
        # Broadcast via WebSocket
        payload = {
            "event": "NOTIFICATION",
            "data": {
                "id": str(notif.id),
                "type": notif.type,
                "title": notif.title,
                "message": notif.message,
                "created_at": notif.created_at.isoformat()
            }
        }
        
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(manager.broadcast_to_session(session_id, payload))
        except RuntimeError:
            pass # No running loop (e.g. during sync tests)
            
        return notif

    @staticmethod
    def get_notifications(db: Session, session_id: str) -> List[Notification]:
        return db.query(Notification).filter(
            Notification.session_id == session_id
        ).order_by(Notification.created_at.desc()).all()

    @staticmethod
    def mark_as_read(db: Session, notification_id: str) -> bool:
        notif = db.query(Notification).filter(Notification.id == notification_id).first()
        if notif:
            notif.is_read = True
            db.commit()
            return True
        return False
