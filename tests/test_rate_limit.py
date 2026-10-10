import pytest
from fastapi.testclient import TestClient
from fastapi import FastAPI, HTTPException

from app.core.config import settings
from app.core.middleware.rate_limit import SimpleRateLimiter

app = FastAPI()
app.add_middleware(SimpleRateLimiter, settings=settings)

@app.get("/test")
async def test_endpoint():
    return {"ok": True}

client = TestClient(app)

def test_rate_limit_exceeded():
    # Simulate many rapid calls to exceed limit (default 60/min). We'll set a low limit for test.
    settings.ENABLE_RATE_LIMITING = True
    settings.RATE_LIMIT_API_PER_MINUTE = 2
    # First two calls should succeed
    resp1 = client.get("/test")
    assert resp1.status_code == 200
    resp2 = client.get("/test")
    assert resp2.status_code == 200
    # Third call should be rate limited
    resp3 = client.get("/test")
    assert resp3.status_code == 429
    assert resp3.json()["detail"] == "Rate limit exceeded"
