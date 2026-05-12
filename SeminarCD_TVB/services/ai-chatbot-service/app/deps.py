import logging
from functools import lru_cache

from app.config import Settings, get_settings
from app.middleware.rate_limit import InMemoryRateLimiter
from app.services.chatbot import ChatbotService, RealChatbotService, StubChatbotService
from app.services.event_consumer import CatalogEventConsumer
from app.services.gemini import GoogleGeminiClient
from app.services.tour_indexer import HttpxCatalogClient, TourIndexer
from app.services.vector_store import VectorStore, build_chroma_client

logger = logging.getLogger(__name__)


@lru_cache(maxsize=1)
def get_rate_limiter() -> InMemoryRateLimiter:
    settings = get_settings()
    return InMemoryRateLimiter(
        max_requests=settings.rate_limit_max_requests,
        window_seconds=settings.rate_limit_window_seconds,
    )


@lru_cache(maxsize=1)
def get_chatbot_service() -> ChatbotService:
    settings = get_settings()
    if not settings.google_ai_api_key:
        logger.warning("GOOGLE_AI_API_KEY missing — using stub chatbot")
        return StubChatbotService()
    try:
        return _build_real_service(settings)
    except Exception:
        logger.exception("failed to wire RealChatbotService — falling back to stub")
        return StubChatbotService()


def _build_real_service(settings: Settings) -> ChatbotService:
    gemini = GoogleGeminiClient(
        api_key=settings.google_ai_api_key,
        llm_model=settings.gemini_llm_model,
        embedding_model=settings.gemini_embedding_model,
    )
    chroma_client = build_chroma_client(
        host=settings.chromadb_host,
        port=settings.chromadb_port,
        ssl=settings.chromadb_ssl,
    )
    vector_store = VectorStore(chroma_client, gemini, settings.chroma_collection)
    return RealChatbotService(gemini, vector_store)


def build_catalog_event_consumer(settings: Settings) -> CatalogEventConsumer | None:
    if not settings.rabbitmq_url:
        return None
    if not settings.google_ai_api_key:
        return None
    gemini = GoogleGeminiClient(
        api_key=settings.google_ai_api_key,
        llm_model=settings.gemini_llm_model,
        embedding_model=settings.gemini_embedding_model,
    )
    chroma_client = build_chroma_client(
        host=settings.chromadb_host,
        port=settings.chromadb_port,
        ssl=settings.chromadb_ssl,
    )
    vector_store = VectorStore(chroma_client, gemini, settings.chroma_collection)
    catalog_client = HttpxCatalogClient(settings.catalog_base_url, settings.catalog_api_token)
    indexer = TourIndexer(catalog_client, vector_store)
    return CatalogEventConsumer(
        rabbitmq_url=settings.rabbitmq_url,
        exchange_name=settings.catalog_events_exchange,
        reindexer=indexer,
    )
