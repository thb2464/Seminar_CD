import logging
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI

from app.config import get_settings
from app.controllers.chat import router as chat_router
from app.controllers.health import router as health_router
from app.deps import build_catalog_event_consumer
from app.logging import configure_logging
from app.metrics import configure_metrics
from app.tracing import configure_tracing

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    settings = get_settings()
    configure_logging(settings.log_level)
    consumer = build_catalog_event_consumer(settings)
    if consumer is not None:
        try:
            await consumer.start()
        except Exception:
            logger.exception("catalog event consumer failed to start")
    try:
        yield
    finally:
        if consumer is not None:
            await consumer.stop()


app = FastAPI(
    title="Travel TVB — AI Chatbot Service",
    version="0.1.0",
    lifespan=lifespan,
)

app.include_router(health_router)
app.include_router(chat_router)
configure_metrics(app)
configure_tracing(app)
