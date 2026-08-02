import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

@pytest.fixture(scope="module")
def auth_headers():
    import time
    email = f"test_{int(time.time())}@example.com"
    # Register a test user
    client.post("/api/auth/register", json={
        "email": email,
        "password": "password123"
    })
    
    # Login to get token
    res = client.post("/api/auth/login", json={
        "email": email,
        "password": "password123"
    })
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
    token = res.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"

def test_seed_and_dashboard(auth_headers):
    # Seed data
    seed_res = client.post("/api/seed", headers=auth_headers)
    assert seed_res.status_code == 201

    # Check dashboard metrics
    dash_res = client.get("/api/dashboard", headers=auth_headers)
    assert dash_res.status_code == 200
    metrics = dash_res.json()
    assert metrics["total_meetings"] >= 3
    assert metrics["total_action_items"] > 0

def test_create_meeting_endpoint(auth_headers):
    payload = {
        "title": "API Test Sync",
        "date": "2026-08-02",
        "participants": "Tester 1, Tester 2",
        "transcript": "Action item: Tester 1 will verify endpoint by tomorrow. Priority: High."
    }
    res = client.post("/api/meetings", json=payload, headers=auth_headers)
    assert res.status_code == 201
    data = res.json()
    assert data["title"] == "API Test Sync"
    assert len(data["action_items"]) > 0

def test_action_item_inline_update(auth_headers):
    # List action items
    items_res = client.get("/api/action-items", headers=auth_headers)
    assert items_res.status_code == 200
    items = items_res.json()
    assert len(items) > 0
    
    first_id = items[0]["id"]
    update_res = client.patch(f"/api/action-items/{first_id}", json={"status": "Completed"}, headers=auth_headers)
    assert update_res.status_code == 200
    assert update_res.json()["status"] == "Completed"
