import pytest


@pytest.fixture(autouse=True)
def _clear_caches() -> None:
    from app.config import get_settings
    from app.deps import get_chatbot_service, get_rate_limiter

    get_settings.cache_clear()
    get_rate_limiter.cache_clear()
    get_chatbot_service.cache_clear()
    yield
    get_settings.cache_clear()
    get_rate_limiter.cache_clear()
    get_chatbot_service.cache_clear()


def test_rate_limiter_picks_up_settings(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("RATE_LIMIT_MAX_REQUESTS", "7")
    monkeypatch.setenv("RATE_LIMIT_WINDOW_SECONDS", "30")

    from app.deps import get_rate_limiter

    limiter = get_rate_limiter()
    assert limiter._max == 7
    assert limiter._window == 30


def test_chatbot_service_falls_back_to_stub_without_api_key(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GOOGLE_AI_API_KEY", "")

    from app.deps import get_chatbot_service
    from app.services.chatbot import StubChatbotService

    service = get_chatbot_service()
    assert isinstance(service, StubChatbotService)


def test_chatbot_service_falls_back_to_stub_when_real_wiring_fails(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("GOOGLE_AI_API_KEY", "any")

    from app import deps

    def boom(_settings: object) -> object:
        raise RuntimeError("genai SDK not installed")

    monkeypatch.setattr(deps, "_build_real_service", boom)

    from app.services.chatbot import StubChatbotService

    assert isinstance(deps.get_chatbot_service(), StubChatbotService)


async def test_stub_chatbot_returns_language_specific_fallback() -> None:
    from app.models.chat import ChatHistoryItem
    from app.services.chatbot import StubChatbotService

    stub = StubChatbotService()
    en = await stub.chat("hi", "en", [])
    zh = await stub.chat("hi", "zh", [])
    vi = await stub.chat("hi", "vi", [])

    assert "initialising" in en.reply
    assert zh.reply.startswith("抱歉")
    assert "khởi tạo" in vi.reply
    assert en.sources == [] == zh.sources == vi.sources
