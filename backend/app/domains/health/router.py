from fastapi import APIRouter, Response, status
from sqlalchemy.sql import text
from datetime import datetime
from app.domains.shared.database import SessionLocal
from app.core.config import settings
from app.core.circuit_breaker import gemini_circuit_breaker

health_router = APIRouter()

@health_router.get("/live")
def liveness():
    return {
        "status": "live",
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }

@health_router.get("/ready")
def readiness(response: Response):
    checks = {
        "database": "unknown",
        "kafka_bootstrap": settings.KAFKA_BOOTSTRAP_SERVERS,
        "gemini_api_configured": bool(settings.GEMINI_API_KEY),
        "circuit_breaker_state": gemini_circuit_breaker.state,
    }
    
    is_ready = True

    # 1. Database Check
    db = SessionLocal()
    try:
        db.execute(text("SELECT 1"))
        checks["database"] = "healthy"
    except Exception as e:
        checks["database"] = f"unhealthy: {e}"
        is_ready = False
    finally:
        db.close()

    # 2. Gemini Circuit Breaker Check
    if gemini_circuit_breaker.state == gemini_circuit_breaker.STATE_OPEN:
        checks["gemini_status"] = "degraded (Circuit Breaker OPEN)"

    if not is_ready:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return {
            "status": "unhealthy",
            "checks": checks,
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }

    return {
        "status": "ready",
        "checks": checks,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }
