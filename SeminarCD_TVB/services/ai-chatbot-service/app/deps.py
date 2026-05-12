from functools import lru_cache

from app.config import get_settings
from app.middleware.rate_limit import InMemoryRateLimiter
from app.services.chatbot import ChatbotService, StubChatbotService


@lru_cache(maxsize=1)
def get_rate_limiter() -> InMemoryRateLimiter:
    settings = get_settings()
    return InMemoryRateLimiter(
        max_requests=settings.rate_limit_max_requests,
        window_seconds=settings.rate_limit_window_seconds,
    )


@lru_cache(maxsize=1)
def get_chatbot_service() -> ChatbotService:
    return StubChatbotService()
