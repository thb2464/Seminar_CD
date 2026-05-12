from typing import Any

import pytest
from fastapi.testclient import TestClient

from app.deps import get_chatbot_service, get_rate_limiter
from app.main import app
from app.middleware.rate_limit import InMemoryRateLimiter
from app.models.chat import ChatHistoryItem, ChatReply, ChatSource, SupportedLanguage


class _RecordingChatbot:
    def __init__(self, reply: ChatReply | Exception) -> None:
        self._reply = reply
        self.calls: list[tuple[str, SupportedLanguage, list[ChatHistoryItem]]] = []

    async def chat(
        self,
        message: str,
        language: SupportedLanguage,
        history: list[ChatHistoryItem],
    ) -> ChatReply:
        self.calls.append((message, language, list(history)))
        if isinstance(self._reply, Exception):
            raise self._reply
        return self._reply


@pytest.fixture
def overrides() -> Any:
    """Yield a helper that overrides the chatbot and rate-limiter dependencies."""

    def _apply(
        chatbot: _RecordingChatbot,
        limiter: InMemoryRateLimiter | None = None,
    ) -> None:
        app.dependency_overrides[get_chatbot_service] = lambda: chatbot
        if limiter is not None:
            app.dependency_overrides[get_rate_limiter] = lambda: limiter

    yield _apply
    app.dependency_overrides.clear()


def test_returns_200_with_data_envelope(overrides: Any) -> None:
    chatbot = _RecordingChatbot(
        ChatReply(reply="Hi", sources=[ChatSource(tourName="X", tourSlug="x")])
    )
    overrides(chatbot)

    client = TestClient(app)
    response = client.post(
        "/api/chat/query",
        json={"message": "hello", "language": "en"},
    )
    assert response.status_code == 200
    body = response.json()
    assert body["data"]["reply"] == "Hi"
    assert body["data"]["sources"][0]["tourSlug"] == "x"
    assert chatbot.calls == [("hello", "en", [])]


def test_strips_message_and_defaults_language(overrides: Any) -> None:
    chatbot = _RecordingChatbot(ChatReply(reply="ok"))
    overrides(chatbot)

    client = TestClient(app)
    response = client.post("/api/chat/query", json={"message": "  spaced  "})
    assert response.status_code == 200
    assert chatbot.calls[0][0] == "spaced"
    assert chatbot.calls[0][1] == "vi"


def test_400_on_empty_message(overrides: Any) -> None:
    overrides(_RecordingChatbot(ChatReply(reply="never")))
    client = TestClient(app)

    response = client.post("/api/chat/query", json={"message": "   "})
    assert response.status_code == 400
    assert response.json()["error"]["status"] == 400


def test_400_on_unsupported_language(overrides: Any) -> None:
    overrides(_RecordingChatbot(ChatReply(reply="never")))
    client = TestClient(app)

    response = client.post(
        "/api/chat/query",
        json={"message": "hi", "language": "fr"},
    )
    assert response.status_code == 400


def test_400_on_invalid_history_role(overrides: Any) -> None:
    overrides(_RecordingChatbot(ChatReply(reply="never")))
    client = TestClient(app)

    response = client.post(
        "/api/chat/query",
        json={
            "message": "hi",
            "history": [{"role": "system", "content": "no"}],
        },
    )
    assert response.status_code == 400


def test_429_when_rate_limited(overrides: Any) -> None:
    limiter = InMemoryRateLimiter(max_requests=1, window_seconds=60)
    chatbot = _RecordingChatbot(ChatReply(reply="ok"))
    overrides(chatbot, limiter=limiter)

    client = TestClient(app)
    first = client.post("/api/chat/query", json={"message": "hello"})
    second = client.post("/api/chat/query", json={"message": "hello"})

    assert first.status_code == 200
    assert second.status_code == 429
    assert second.json()["error"]["status"] == 429


def test_500_on_service_exception(overrides: Any) -> None:
    overrides(_RecordingChatbot(RuntimeError("boom")))
    client = TestClient(app)

    response = client.post("/api/chat/query", json={"message": "hi"})
    assert response.status_code == 500
    assert response.json()["error"]["status"] == 500


def test_accepts_camelcase_session_id(overrides: Any) -> None:
    overrides(_RecordingChatbot(ChatReply(reply="ok")))
    client = TestClient(app)
    response = client.post(
        "/api/chat/query",
        json={"message": "hi", "sessionId": "abc-123"},
    )
    assert response.status_code == 200


def test_400_on_malformed_json(overrides: Any) -> None:
    overrides(_RecordingChatbot(ChatReply(reply="never")))
    client = TestClient(app)
    response = client.post(
        "/api/chat/query",
        content="not json",
        headers={"content-type": "application/json"},
    )
    assert response.status_code == 400
