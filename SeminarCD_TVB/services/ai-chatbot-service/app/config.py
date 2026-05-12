from functools import lru_cache

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    app_host: str = "0.0.0.0"
    app_port: int = 8080
    log_level: str = "INFO"
    environment: str = "development"

    google_ai_api_key: str = ""
    gemini_llm_model: str = "gemini-2.5-flash"
    gemini_embedding_model: str = "gemini-embedding-001"

    chromadb_host: str = "localhost"
    chromadb_port: int = 8000
    chromadb_ssl: bool = False
    chroma_collection: str = "tour_embeddings"

    catalog_base_url: str = "http://localhost:3001"
    catalog_api_token: str = ""

    rabbitmq_url: str = "amqp://guest:guest@localhost:5672/"
    catalog_events_exchange: str = "catalog.events"

    rate_limit_window_seconds: int = Field(default=60, ge=1)
    rate_limit_max_requests: int = Field(default=15, ge=1)


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    return Settings()
