import asyncio
import logging
from typing import Protocol

logger = logging.getLogger(__name__)


class GeminiClient(Protocol):
    async def embed(self, text: str) -> list[float]: ...

    async def generate(
        self,
        system_prompt: str,
        history: list[dict[str, object]],
        message: str,
    ) -> str: ...


class GoogleGeminiClient:
    """Async wrapper around `google.generativeai` for embeddings and chat.

    The SDK calls are synchronous, so we offload them to a thread.
    Embedding calls retry on HTTP 429 with the same back-off the monolith
    used: 5s, 10s, 15s, 20s, 25s.
    """

    def __init__(
        self,
        api_key: str,
        llm_model: str,
        embedding_model: str,
        max_retries: int = 5,
        retry_base_seconds: int = 5,
    ) -> None:
        if not api_key:
            raise ValueError("GOOGLE_AI_API_KEY is required for GoogleGeminiClient")

        import google.generativeai as genai

        genai.configure(api_key=api_key)
        self._genai = genai
        self._llm_model = llm_model
        self._embedding_model = embedding_model
        self._max_retries = max_retries
        self._retry_base = retry_base_seconds

    async def embed(self, text: str) -> list[float]:
        for attempt in range(1, self._max_retries + 1):
            try:
                result = await asyncio.to_thread(
                    self._genai.embed_content,
                    model=self._embedding_model,
                    content=text,
                )
                embedding = result["embedding"] if isinstance(result, dict) else result.embedding
                return list(embedding)
            except Exception as exc:
                if not _is_rate_limited(exc) or attempt == self._max_retries:
                    raise
                wait = self._retry_base * attempt
                logger.warning(
                    "gemini embedding rate-limited, retrying",
                    extra={"attempt": attempt, "wait_seconds": wait},
                )
                await asyncio.sleep(wait)
        raise RuntimeError("unreachable: retry loop exited without returning")

    async def generate(
        self,
        system_prompt: str,
        history: list[dict[str, object]],
        message: str,
    ) -> str:
        def _call() -> str:
            model = self._genai.GenerativeModel(
                model_name=self._llm_model,
                system_instruction=system_prompt,
            )
            chat = model.start_chat(history=history)
            response = chat.send_message(message)
            return str(response.text)

        return await asyncio.to_thread(_call)


def _is_rate_limited(exc: Exception) -> bool:
    status = getattr(exc, "status", None) or getattr(exc, "code", None)
    if status == 429:
        return True
    message = str(exc)
    return "429" in message or "RATE_LIMIT" in message.upper()
