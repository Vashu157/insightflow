from sqlalchemy.orm import Session
from app.domains.shared.models import UsageMetric
from app.domains.shared.logging import logger

class UsageMetricsService:
    @staticmethod
    def record_metric(db: Session, session_id: str, action: str, duration_ms: int = None, user_agent: str = None) -> UsageMetric:
        try:
            metric = UsageMetric(
                session_id=session_id,
                action=action,
                duration_ms=duration_ms,
                user_agent=user_agent
            )
            db.add(metric)
            db.commit()
            db.refresh(metric)
            
            # In a full Kafka setup, we would also produce to a usage_metrics topic here:
            # producer.send("usage_metrics", metric.model_dump())
            
            return metric
        except Exception as e:
            logger.error(f"Failed to record usage metric {action}: {e}")
            db.rollback()
            return None
