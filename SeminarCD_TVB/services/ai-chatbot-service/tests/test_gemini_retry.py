from typing import Any

import pytest

from app.services.gemini import GoogleGeminiClient, _is_rate_limited


class FakeError(Exception):
    def __init__(self, message: str, status: int | None = None) -> None:
        super().__init__(message)
        self.status = status


def test_is_rate_limited_recognises_status_429() -> None:
    assert _is_rate_limited(FakeError("oops", status=429))


def test_is_rate_limited_recognises_message_substring() -> None:
    assert _is_rate_limited(Exception("HTTP 429 Too Many Requests"))


def test_is_rate_limited_recognises_rate_limit_keyword() -> None:
    assert _is_rate_limited(Exception("RATE_LIMIT_EXCEEDED"))


def test_is_rate_limited_false_for_other_errors() -> None:
    assert not _is_rate_limited(Exception("Internal server error"))


async def test_embed_retries_then_succeeds(monkeypatch: pytest.MonkeyPatch) -> None:
    # Bypass `__init__` (which imports google.generativeai) — we just want to test the retry loop.
    client = object.__new__(GoogleGeminiClient)
    client._embedding_model = "embed-1"  # type: ignore[attr-defined]
    client._llm_model = "llm-1"  # type: ignore[attr-defined]
    client._max_retries = 3  # type: ignore[attr-defined]
    client._retry_base = 0  # zero seconds so the test is instant  # type: ignore[attr-defined]

    calls: list[str] = []

    def fake_embed_content(*, model: str, content: str) -> dict[str, list[float]]:
        calls.append(content)
        if len(calls) < 3:
            raise FakeError("429 Too Many Requests", status=429)
        return {"embedding": [0.1, 0.2]}

    fake_genai = type("G", (), {"embed_content": staticmethod(fake_embed_content)})()
    client._genai = fake_genai  # type: ignore[attr-defined]

    result = await client.embed("hello")
    assert result == [0.1, 0.2]
    assert len(calls) == 3


async def test_embed_raises_after_max_retries() -> None:
    client = object.__new__(GoogleGeminiClient)
    client._embedding_model = "embed-1"  # type: ignore[attr-defined]
    client._llm_model = "llm-1"  # type: ignore[attr-defined]
    client._max_retries = 2  # type: ignore[attr-defined]
    client._retry_base = 0  # type: ignore[attr-defined]

    def always_429(*, model: str, content: str) -> Any:
        raise FakeError("429", status=429)

    fake_genai = type("G", (), {"embed_content": staticmethod(always_429)})()
    client._genai = fake_genai  # type: ignore[attr-defined]

    with pytest.raises(FakeError):
        await client.embed("hello")


async def test_embed_does_not_retry_on_non_429() -> None:
    client = object.__new__(GoogleGeminiClient)
    client._embedding_model = "embed-1"  # type: ignore[attr-defined]
    client._llm_model = "llm-1"  # type: ignore[attr-defined]
    client._max_retries = 5  # type: ignore[attr-defined]
    client._retry_base = 0  # type: ignore[attr-defined]

    calls: list[str] = []

    def always_500(*, model: str, content: str) -> Any:
        calls.append(content)
        raise FakeError("500 Internal", status=500)

    fake_genai = type("G", (), {"embed_content": staticmethod(always_500)})()
    client._genai = fake_genai  # type: ignore[attr-defined]

    with pytest.raises(FakeError):
        await client.embed("hello")
    assert len(calls) == 1
