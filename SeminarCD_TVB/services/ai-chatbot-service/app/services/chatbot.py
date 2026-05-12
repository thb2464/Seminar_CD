import logging
from typing import Protocol

from app.models.chat import ChatHistoryItem, ChatReply, ChatSource, SupportedLanguage
from app.services.gemini import GeminiClient
from app.services.vector_store import VectorSearchHit, VectorStore

logger = logging.getLogger(__name__)


class ChatbotService(Protocol):
    async def chat(
        self,
        message: str,
        language: SupportedLanguage,
        history: list[ChatHistoryItem],
    ) -> ChatReply: ...


_FRIENDLY_FALLBACK: dict[SupportedLanguage, str] = {
    "vi": "Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc truy cập trang /tours để xem các tour.",
    "en": "Sorry, I'm experiencing a technical issue. Please try again later or visit /tours to browse tours.",
    "zh": "抱歉，我遇到了技术问题。请稍后再试或访问 /tours 浏览旅游线路。",
}

_LANGUAGE_NAMES: dict[SupportedLanguage, str] = {
    "vi": "Vietnamese (Tiếng Việt)",
    "en": "English",
    "zh": "Chinese (中文)",
}


class StubChatbotService:
    """Polite fallback used when GOOGLE_AI_API_KEY is unset (e.g. local dev without secrets)."""

    async def chat(
        self,
        message: str,
        language: SupportedLanguage,
        history: list[ChatHistoryItem],
    ) -> ChatReply:
        _ = (message, history)
        return ChatReply(
            reply=(
                "Xin lỗi, dịch vụ chatbot đang được khởi tạo. Vui lòng thử lại sau."
                if language == "vi"
                else _FRIENDLY_FALLBACK[language]
            ),
            sources=[],
        )


class RealChatbotService:
    """Retrieval-augmented chatbot — mirrors the monolith's `chatbot.js` pipeline.

    1. Embed the user's message and search the vector store for relevant chunks.
    2. Build a system prompt grounded in those chunks.
    3. Replay the conversation history (converted to Gemini's `user` / `model` roles).
    4. Send the message and return the reply + the subset of chunks that were referenced.
    On any failure we fall back to a polite language-aware message — never a 500
    from this layer (the controller wraps unexpected exceptions separately).
    """

    def __init__(self, gemini: GeminiClient, vector_store: VectorStore, *, top_k: int = 5) -> None:
        self._gemini = gemini
        self._vector_store = vector_store
        self._top_k = top_k

    async def chat(
        self,
        message: str,
        language: SupportedLanguage,
        history: list[ChatHistoryItem],
    ) -> ChatReply:
        try:
            hits = await self._vector_store.search(message, n_results=self._top_k, language=language)
            system_prompt = _build_system_prompt(language, hits)
            gemini_history = _to_gemini_history(history)
            reply_text = await self._gemini.generate(system_prompt, gemini_history, message)
            sources = _extract_sources(hits, reply_text)
            return ChatReply(reply=reply_text, sources=sources)
        except Exception:
            logger.exception("chatbot RAG pipeline failed")
            return ChatReply(reply=_FRIENDLY_FALLBACK[language], sources=[])


def _build_system_prompt(language: SupportedLanguage, hits: list[VectorSearchHit]) -> str:
    if hits:
        rendered = "\n\n".join(
            f"--- Tour {i + 1}: {hit.metadata.get('tourName', 'Unknown')} "
            f"(slug: {hit.metadata.get('tourSlug', 'N/A')}) ---\n{hit.content}"
            for i, hit in enumerate(hits)
        )
    else:
        rendered = "No relevant tour data found."

    language_name = _LANGUAGE_NAMES[language]
    return (
        "You are a friendly and helpful tour guide assistant for \"Travel TVB\", "
        "a Vietnamese travel agency website.\n\n"
        "STRICT RULES:\n"
        "1. Answer ONLY based on the TOUR DATA CONTEXT provided below. Do NOT make up or hallucinate any information.\n"
        "2. If the user asks about something NOT covered in the context, politely say you don't have that specific information and suggest they browse the full tour catalog at /tours.\n"
        f"3. Always respond in {language_name}.\n"
        "4. When recommending tours, mention: tour name, price, duration (days/nights), location, and rating when available.\n"
        "5. Format prices in Vietnamese dong (₫) with thousand separators.\n"
        "6. Keep responses concise but informative (2-4 paragraphs max).\n"
        "7. Be warm, enthusiastic, and use a conversational tone appropriate for a travel assistant.\n"
        "8. If a user greets you, respond warmly and ask how you can help them find a tour.\n"
        "9. When mentioning a tour, always include its slug in this format: [tour-slug] so the frontend can create links.\n\n"
        f"TOUR DATA CONTEXT:\n{rendered}"
    )


def _to_gemini_history(history: list[ChatHistoryItem]) -> list[dict[str, object]]:
    """Convert internal `bot` role to Gemini's `model` role, drop leading model turns."""
    converted: list[dict[str, object]] = [
        {
            "role": "user" if item.role == "user" else "model",
            "parts": [{"text": item.content}],
        }
        for item in history[-10:]
    ]
    while converted and converted[0]["role"] == "model":
        converted.pop(0)
    return converted


def _extract_sources(hits: list[VectorSearchHit], reply: str) -> list[ChatSource]:
    seen: set[str] = set()
    sources: list[ChatSource] = []
    reply_lower = reply.lower()

    for hit in hits:
        slug = hit.metadata.get("tourSlug")
        if not slug or slug in seen:
            continue
        name = hit.metadata.get("tourName") or ""
        name_words = [word for word in name.split() if len(word) > 2]
        referenced = (
            slug in reply
            or f"[{slug}]" in reply
            or any(word.lower() in reply_lower for word in name_words)
        )
        if not referenced:
            continue
        seen.add(slug)
        sources.append(
            ChatSource(
                tourName=name or None,
                tourSlug=slug,
                price=hit.metadata.get("price"),
                location=hit.metadata.get("location"),
            )
        )
    return sources
