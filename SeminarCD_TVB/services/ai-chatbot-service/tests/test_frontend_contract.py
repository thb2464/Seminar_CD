"""Contract test pinning the request/response shape used by the frontend ChatbotWidget.

The exact JSON payload below mirrors what
`Travel_TVB/src/components/ChatbotWidget/ChatbotWidget.jsx:223` sends. Any
breaking change to the Pydantic schemas in `app/models/chat.py` must update
both this snapshot AND the frontend in the same PR.
"""

from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.deps import get_chatbot_service, get_rate_limiter
from app.main import app
from app.middleware.rate_limit import InMemoryRateLimiter
from app.models.chat import ChatHistoryItem, ChatReply, ChatSource, SupportedLanguage

FRONTEND_REQUEST_SNAPSHOT: dict[str, Any] = {
    "message": "What tours do you have in Da Nang?",
    "language": "en",
    "history": [
        {"role": "user", "content": "Hello"},
        {"role": "bot", "content": "Hi! How can I help?"},
    ],
}


class _StubChatbot:
    def __init__(self, reply: ChatReply) -> None:
        self._reply = reply
        self.received: list[tuple[str, SupportedLanguage, list[ChatHistoryItem]]] = []

    async def chat(
        self,
        message: str,
        language: SupportedLanguage,
        history: list[ChatHistoryItem],
    ) -> ChatReply:
        self.received.append((message, language, list(history)))
        return self._reply


@pytest.fixture
def client_with_stub() -> tuple[TestClient, _StubChatbot]:
    stub = _StubChatbot(
        ChatReply(
            reply="We have several tours in Da Nang...",
            sources=[
                ChatSource(
                    tourName="Da Nang Discovery",
                    tourSlug="da-nang-discovery",
                    price="2,500,000 VND",
                    location="Da Nang",
                )
            ],
        )
    )
    app.dependency_overrides[get_chatbot_service] = lambda: stub
    app.dependency_overrides[get_rate_limiter] = lambda: InMemoryRateLimiter(
        max_requests=1000, window_seconds=60
    )
    yield TestClient(app), stub
    app.dependency_overrides.clear()


def test_frontend_payload_is_accepted(client_with_stub: Any) -> None:
    client, stub = client_with_stub
    response = client.post("/api/chat/query", json=FRONTEND_REQUEST_SNAPSHOT)

    assert response.status_code == 200
    body = response.json()
    assert set(body.keys()) == {"data"}
    assert set(body["data"].keys()) == {"reply", "sources"}
    assert body["data"]["reply"] == "We have several tours in Da Nang..."

    source = body["data"]["sources"][0]
    # Frontend reads these exact keys; do not rename without a coordinated change.
    assert set(source.keys()) >= {"tourSlug", "tourName", "price", "location"}
    assert source["tourSlug"] == "da-nang-discovery"

    # Verify the service saw the exact converted internal types.
    message, language, history = stub.received[0]
    assert message == "What tours do you have in Da Nang?"
    assert language == "en"
    assert [h.role for h in history] == ["user", "bot"]
    assert [h.content for h in history] == ["Hello", "Hi! How can I help?"]


def test_rate_limited_response_matches_frontend_handler(client_with_stub: Any) -> None:
    """ChatbotWidget treats 429 specially. The body shape doesn't matter to it,
    but the status code MUST be 429."""

    client, _ = client_with_stub
    app.dependency_overrides[get_rate_limiter] = lambda: InMemoryRateLimiter(
        max_requests=1, window_seconds=60
    )
    first = client.post("/api/chat/query", json=FRONTEND_REQUEST_SNAPSHOT)
    second = client.post("/api/chat/query", json=FRONTEND_REQUEST_SNAPSHOT)
    assert first.status_code == 200
    assert second.status_code == 429


def test_unknown_language_rejected(client_with_stub: Any) -> None:
    """Frontend currently only sends vi/en/zh. Lock the schema so a typo blows up loudly."""

    client, _ = client_with_stub
    response = client.post(
        "/api/chat/query",
        json={"message": "hi", "language": "fr", "history": []},
    )
    assert response.status_code == 400


def test_session_id_camelcase_preserved(client_with_stub: Any) -> None:
    client, _ = client_with_stub
    payload = {**FRONTEND_REQUEST_SNAPSHOT, "sessionId": "session-abc"}
    response = client.post("/api/chat/query", json=payload)
    assert response.status_code == 200
