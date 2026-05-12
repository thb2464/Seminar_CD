from typing import Literal

from pydantic import BaseModel, Field, field_validator

SupportedLanguage = Literal["vi", "en", "zh"]
MessageRole = Literal["user", "bot"]


class ChatHistoryItem(BaseModel):
    role: MessageRole
    content: str = Field(min_length=1, max_length=500)


class ChatRequest(BaseModel):
    message: str = Field(min_length=1, max_length=500)
    language: SupportedLanguage = "vi"
    history: list[ChatHistoryItem] = Field(default_factory=list, max_length=10)
    session_id: str | None = Field(default=None, alias="sessionId", max_length=128)

    model_config = {"populate_by_name": True}

    @field_validator("message")
    @classmethod
    def _strip_message(cls, value: str) -> str:
        stripped = value.strip()
        if not stripped:
            raise ValueError("Message is required and must be a non-empty string.")
        return stripped


class ChatSource(BaseModel):
    tourName: str | None = None
    tourSlug: str
    price: str | None = None
    location: str | None = None


class ChatReply(BaseModel):
    reply: str
    sources: list[ChatSource] = Field(default_factory=list)


class ChatResponse(BaseModel):
    data: ChatReply


class ErrorBody(BaseModel):
    status: int
    message: str


class ErrorResponse(BaseModel):
    error: ErrorBody
