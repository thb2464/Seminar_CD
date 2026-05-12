from typing import Any

import pytest

from app.models.chat import ChatHistoryItem
from app.services.chatbot import (
    RealChatbotService,
    _build_system_prompt,
    _extract_sources,
    _to_gemini_history,
)
from app.services.vector_store import VectorSearchHit


class FakeGemini:
    def __init__(
        self,
        embedding: list[float] | None = None,
        reply: str = "",
        raises: Exception | None = None,
    ) -> None:
        self.embedding = embedding or [0.0]
        self.reply = reply
        self.raises = raises
        self.generate_calls: list[tuple[str, list[dict[str, object]], str]] = []

    async def embed(self, text: str) -> list[float]:
        if self.raises:
            raise self.raises
        return list(self.embedding)

    async def generate(
        self,
        system_prompt: str,
        history: list[dict[str, object]],
        message: str,
    ) -> str:
        if self.raises:
            raise self.raises
        self.generate_calls.append((system_prompt, list(history), message))
        return self.reply


class FakeVectorStore:
    def __init__(self, hits: list[VectorSearchHit] | None = None, raises: Exception | None = None) -> None:
        self.hits = hits or []
        self.raises = raises
        self.search_calls: list[tuple[str, int, str]] = []

    async def search(self, query: str, n_results: int = 5, language: str = "vi") -> list[VectorSearchHit]:
        if self.raises:
            raise self.raises
        self.search_calls.append((query, n_results, language))
        return self.hits


def _hit(slug: str, name: str, content: str = "snippet", price: str | None = None, location: str | None = None) -> VectorSearchHit:
    metadata: dict[str, Any] = {"tourSlug": slug, "tourName": name}
    if price is not None:
        metadata["price"] = price
    if location is not None:
        metadata["location"] = location
    return VectorSearchHit(content=content, metadata=metadata, distance=0.1)


def test_build_system_prompt_lists_hits_in_language() -> None:
    hits = [
        _hit("hue-tour", "Hue Imperial City", content="Explore Hue's citadel."),
        _hit("hoi-an", "Hoi An Lanterns", content="Walk the old town."),
    ]
    prompt = _build_system_prompt("en", hits)

    assert "Hue Imperial City" in prompt
    assert "slug: hue-tour" in prompt
    assert "Hoi An Lanterns" in prompt
    assert "Always respond in English" in prompt


def test_build_system_prompt_falls_back_when_no_hits() -> None:
    prompt = _build_system_prompt("vi", [])
    assert "No relevant tour data found." in prompt
    assert "Vietnamese" in prompt


def test_to_gemini_history_maps_bot_to_model() -> None:
    history = [
        ChatHistoryItem(role="user", content="hi"),
        ChatHistoryItem(role="bot", content="hello"),
        ChatHistoryItem(role="user", content="tours?"),
    ]
    converted = _to_gemini_history(history)
    assert [item["role"] for item in converted] == ["user", "model", "user"]
    assert converted[0]["parts"] == [{"text": "hi"}]


def test_to_gemini_history_drops_leading_model() -> None:
    history = [
        ChatHistoryItem(role="bot", content="should be dropped"),
        ChatHistoryItem(role="bot", content="also dropped"),
        ChatHistoryItem(role="user", content="real start"),
    ]
    converted = _to_gemini_history(history)
    assert [item["role"] for item in converted] == ["user"]
    assert converted[0]["parts"] == [{"text": "real start"}]


def test_to_gemini_history_keeps_only_last_10() -> None:
    history = [ChatHistoryItem(role="user", content=str(i)) for i in range(15)]
    converted = _to_gemini_history(history)
    assert len(converted) == 10
    assert converted[0]["parts"] == [{"text": "5"}]


def test_extract_sources_recognises_slug_in_reply() -> None:
    hits = [_hit("hue-tour", "Hue Imperial City"), _hit("hoi-an", "Hoi An Lanterns")]
    reply = "Try [hue-tour] for citadels."
    sources = _extract_sources(hits, reply)
    assert [s.tourSlug for s in sources] == ["hue-tour"]


def test_extract_sources_recognises_name_word_in_reply() -> None:
    hits = [_hit("hue-tour", "Hue Imperial City"), _hit("hoi-an", "Hoi An Lanterns")]
    reply = "The Imperial city of Hue is wonderful in spring."
    sources = _extract_sources(hits, reply)
    assert [s.tourSlug for s in sources] == ["hue-tour"]


def test_extract_sources_deduplicates_by_slug() -> None:
    hits = [_hit("hue", "Hue Imperial"), _hit("hue", "Hue Imperial")]
    reply = "[hue]"
    sources = _extract_sources(hits, reply)
    assert len(sources) == 1


def test_extract_sources_ignores_unreferenced_hits() -> None:
    hits = [_hit("hue", "Hue"), _hit("hoi-an", "Hoi An")]
    reply = "Tell me about Da Nang please."
    sources = _extract_sources(hits, reply)
    assert sources == []


@pytest.mark.asyncio
async def test_chat_happy_path_returns_reply_and_sources() -> None:
    hits = [_hit("hue-tour", "Hue Imperial City", price="2,000,000 VND", location="Hue")]
    vector_store = FakeVectorStore(hits)
    gemini = FakeGemini(reply="Visit [hue-tour] for the Imperial City.")
    service = RealChatbotService(gemini, vector_store)  # type: ignore[arg-type]

    result = await service.chat("imperial cities?", "en", [])

    assert result.reply == "Visit [hue-tour] for the Imperial City."
    assert len(result.sources) == 1
    assert result.sources[0].tourSlug == "hue-tour"
    assert result.sources[0].price == "2,000,000 VND"
    assert vector_store.search_calls == [("imperial cities?", 5, "en")]


@pytest.mark.asyncio
async def test_chat_returns_fallback_on_vector_error() -> None:
    vector_store = FakeVectorStore(raises=RuntimeError("chroma down"))
    gemini = FakeGemini(reply="should not be called")
    service = RealChatbotService(gemini, vector_store)  # type: ignore[arg-type]

    result = await service.chat("hi", "vi", [])
    assert "kỹ thuật" in result.reply
    assert result.sources == []


@pytest.mark.asyncio
async def test_chat_returns_fallback_on_gemini_error() -> None:
    vector_store = FakeVectorStore([_hit("x", "X")])
    gemini = FakeGemini(raises=RuntimeError("rate limit"))
    service = RealChatbotService(gemini, vector_store)  # type: ignore[arg-type]

    result = await service.chat("hi", "zh", [])
    assert result.reply.startswith("抱歉")
    assert result.sources == []


@pytest.mark.asyncio
async def test_chat_passes_converted_history_to_gemini() -> None:
    gemini = FakeGemini(reply="ok")
    vstore = FakeVectorStore([])
    service = RealChatbotService(gemini, vstore)  # type: ignore[arg-type]

    history = [
        ChatHistoryItem(role="bot", content="dropped"),
        ChatHistoryItem(role="user", content="hi"),
        ChatHistoryItem(role="bot", content="hello"),
    ]
    await service.chat("tours?", "en", history)
    _, sent_history, sent_message = gemini.generate_calls[0]
    assert [h["role"] for h in sent_history] == ["user", "model"]
    assert sent_message == "tours?"
