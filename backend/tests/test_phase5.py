import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.circuit_breaker import CircuitBreaker, CircuitBreakerOpenException
from app.core.security import validate_upload_file
from fastapi import HTTPException, UploadFile
from io import BytesIO

client = TestClient(app)

def test_liveness_health():
    response = client.get("/health/live")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "live"
    assert "timestamp" in data

def test_readiness_health():
    response = client.get("/health/ready")
    assert response.status_code in (200, 503)
    data = response.json()
    assert "checks" in data
    assert "database" in data["checks"]

def test_prometheus_metrics():
    response = client.get("/metrics")
    assert response.status_code == 200
    assert "http_requests_total" in response.text
    assert "http_latency_seconds" in response.text

def test_admin_status():
    response = client.get("/api/v1/admin/status")
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "running_jobs" in data
    assert "recent_failures" in data

def test_circuit_breaker_tripping():
    cb = CircuitBreaker("test_service", failure_threshold=2, recovery_timeout=1.0)
    
    def failing_func():
        raise ValueError("API Error")

    with pytest.raises(ValueError):
        cb.call(failing_func)
    
    assert cb.state == CircuitBreaker.STATE_CLOSED
    assert cb.failure_count == 1

    with pytest.raises(ValueError):
        cb.call(failing_func)
        
    assert cb.state == CircuitBreaker.STATE_OPEN

    with pytest.raises(CircuitBreakerOpenException):
        cb.call(failing_func)

def test_security_file_validation_invalid_ext():
    file_obj = UploadFile(filename="malicious.exe", file=BytesIO(b"binary data"))
    with pytest.raises(HTTPException) as exc:
        validate_upload_file(file_obj)
    assert exc.value.status_code == 400
    assert "Unsupported file format" in exc.value.detail
