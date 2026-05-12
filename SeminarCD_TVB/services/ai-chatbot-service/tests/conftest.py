import os

import pytest
from fastapi.testclient import TestClient

os.environ.setdefault("GOOGLE_AI_API_KEY", "test-key")


@pytest.fixture
def client() -> TestClient:
    from app.main import app

    return TestClient(app)
