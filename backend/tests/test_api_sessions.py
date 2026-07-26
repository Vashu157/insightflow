import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_read_main():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"status": "running", "service": "InsightFlow API"}

def test_session_endpoints():
    # Create Session using multipart file upload
    file_content = b"col1,col2\n1,2\n3,4"
    files = {"file": ("test.csv", file_content, "text/csv")}
    response = client.post("/sessions/upload", files=files)
    
    assert response.status_code == 200
    data = response.json()
    assert "id" in data
    
    session_id = data["id"]
    
    # Get Session
    response = client.get(f"/sessions/{session_id}")
    assert response.status_code == 200
    assert response.json()["original_filename"] == "test.csv"
    
    # Delete Session
    response = client.delete(f"/sessions/{session_id}")
    assert response.status_code == 200
    
    # Verify Deletion
    response = client.get(f"/sessions/{session_id}")
    assert response.status_code == 404
