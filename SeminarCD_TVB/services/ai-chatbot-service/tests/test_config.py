import importlib
import os

import pytest


@pytest.fixture(autouse=True)
def _isolate_settings_cache() -> None:
    """Clear `get_settings` LRU between tests so env overrides take effect."""
    from app import config as config_module

    config_module.get_settings.cache_clear()
    yield
    config_module.get_settings.cache_clear()


def test_defaults_load_without_env(monkeypatch: pytest.MonkeyPatch) -> None:
    for key in ("GOOGLE_AI_API_KEY", "RATE_LIMIT_MAX_REQUESTS", "RATE_LIMIT_WINDOW_SECONDS"):
        monkeypatch.delenv(key, raising=False)
    monkeypatch.setattr(os, "environ", {**os.environ, "GOOGLE_AI_API_KEY": ""})

    from app.config import get_settings

    settings = get_settings()
    assert settings.app_port == 8080
    assert settings.gemini_llm_model == "gemini-2.5-flash"
    assert settings.gemini_embedding_model == "gemini-embedding-001"
    assert settings.chroma_collection == "tour_embeddings"
    assert settings.rate_limit_max_requests == 15
    assert settings.rate_limit_window_seconds == 60


def test_env_overrides_apply(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("RATE_LIMIT_MAX_REQUESTS", "5")
    monkeypatch.setenv("RATE_LIMIT_WINDOW_SECONDS", "120")
    monkeypatch.setenv("CHROMA_COLLECTION", "custom_collection")

    from app import config as config_module

    importlib.reload(config_module)
    settings = config_module.get_settings()
    assert settings.rate_limit_max_requests == 5
    assert settings.rate_limit_window_seconds == 120
    assert settings.chroma_collection == "custom_collection"


def test_rate_limit_constraints_enforced(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("RATE_LIMIT_MAX_REQUESTS", "0")
    from app import config as config_module

    importlib.reload(config_module)
    with pytest.raises(Exception):  # pydantic validation error
        config_module.get_settings()
