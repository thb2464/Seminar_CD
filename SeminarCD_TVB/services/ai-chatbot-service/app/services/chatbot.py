from typing import Protocol

from app.models.chat import ChatHistoryItem, ChatReply, SupportedLanguage


class ChatbotService(Protocol):
    async def chat(
        self,
        message: str,
        language: SupportedLanguage,
        history: list[ChatHistoryItem],
    ) -> ChatReply: ...


_FRIENDLY_FALLBACK: dict[SupportedLanguage, str] = {
    "vi": "Xin lỗi, dịch vụ chatbot đang được khởi tạo. Vui lòng thử lại sau.",
    "en": "Sorry, the chatbot service is still initialising. Please try again shortly.",
    "zh": "抱歉，聊天机器人服务正在初始化。请稍后再试。",
}


class StubChatbotService:
    """Placeholder until F1.4 wires Gemini + ChromaDB.

    Returns a polite language-aware fallback so the controller is testable
    independently of network calls.
    """

    async def chat(
        self,
        message: str,
        language: SupportedLanguage,
        history: list[ChatHistoryItem],
    ) -> ChatReply:
        _ = (message, history)
        return ChatReply(reply=_FRIENDLY_FALLBACK[language], sources=[])
