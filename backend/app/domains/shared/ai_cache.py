import hashlib
import json
from datetime import datetime, timedelta
from typing import Any, Dict, Optional
from sqlalchemy.orm import Session
from app.domains.shared.models import AICache, DatasetVersion

class AICacheManager:
    @staticmethod
    def _generate_cache_key(session_id: str, prompt: str, dataset_version: int) -> str:
        key_content = f"{session_id}:{prompt}:{dataset_version}"
        return hashlib.sha256(key_content.encode("utf-8")).hexdigest()

    @staticmethod
    def get_cached_response(db: Session, session_id: str, prompt: str) -> Optional[Dict[str, Any]]:
        # Get latest dataset version
        latest_version = db.query(DatasetVersion).filter(
            DatasetVersion.session_id == session_id
        ).order_by(DatasetVersion.version_number.desc()).first()
        
        version_num = latest_version.version_number if latest_version else 1
        
        cache_key = AICacheManager._generate_cache_key(session_id, prompt, version_num)
        
        cache_entry = db.query(AICache).filter(
            AICache.cache_key == cache_key,
            AICache.session_id == session_id
        ).first()
        
        if cache_entry:
            if cache_entry.expires_at and cache_entry.expires_at < datetime.utcnow():
                db.delete(cache_entry)
                db.commit()
                return None
            return cache_entry.response_payload
            
        return None

    @staticmethod
    def set_cached_response(db: Session, session_id: str, prompt: str, payload: Dict[str, Any], ttl_minutes: int = 60) -> None:
        latest_version = db.query(DatasetVersion).filter(
            DatasetVersion.session_id == session_id
        ).order_by(DatasetVersion.version_number.desc()).first()
        
        version_num = latest_version.version_number if latest_version else 1
        
        cache_key = AICacheManager._generate_cache_key(session_id, prompt, version_num)
        
        expires_at = datetime.utcnow() + timedelta(minutes=ttl_minutes)
        
        existing = db.query(AICache).filter(AICache.cache_key == cache_key).first()
        if existing:
            existing.response_payload = payload
            existing.expires_at = expires_at
        else:
            new_cache = AICache(
                session_id=session_id,
                cache_key=cache_key,
                response_payload=payload,
                expires_at=expires_at
            )
            db.add(new_cache)
            
        db.commit()
