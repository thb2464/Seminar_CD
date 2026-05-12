import logging
from typing import Annotated

from fastapi import APIRouter, Depends, Request, status
from fastapi.responses import JSONResponse
from pydantic import ValidationError

from app.deps import get_chatbot_service, get_rate_limiter
from app.middleware.rate_limit import InMemoryRateLimiter
from app.models.chat import ChatRequest, ChatResponse, ErrorBody, ErrorResponse
from app.services.chatbot import ChatbotService

router = APIRouter(prefix="/api/chat", tags=["chat"])
logger = logging.getLogger(__name__)


def _client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    if request.client and request.client.host:
        return request.client.host
    return "unknown"


def _error(http_status: int, message: str) -> JSONResponse:
    return JSONResponse(
        status_code=http_status,
        content=ErrorResponse(error=ErrorBody(status=http_status, message=message)).model_dump(),
    )


@router.post(
    "/query",
    response_model=ChatResponse,
    responses={
        400: {"model": ErrorResponse},
        429: {"model": ErrorResponse},
        500: {"model": ErrorResponse},
    },
)
async def query(
    request: Request,
    limiter: Annotated[InMemoryRateLimiter, Depends(get_rate_limiter)],
    service: Annotated[ChatbotService, Depends(get_chatbot_service)],
) -> JSONResponse:
    ip = _client_ip(request)

    if limiter.is_rate_limited(ip):
        return _error(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "Too many requests. Please wait a moment before trying again.",
        )

    try:
        raw = await request.json()
    except ValueError:
        return _error(status.HTTP_400_BAD_REQUEST, "Request body must be valid JSON.")

    try:
        payload = ChatRequest.model_validate(raw)
    except ValidationError as exc:
        message = exc.errors()[0].get("msg", "Invalid request payload.")
        return _error(status.HTTP_400_BAD_REQUEST, message)

    logger.info(
        "chatbot query received",
        extra={
            "client_ip": ip,
            "language": payload.language,
            "message_preview": payload.message[:50],
            "history_len": len(payload.history),
            "session_id": payload.session_id,
        },
    )

    try:
        reply = await service.chat(payload.message, payload.language, payload.history)
    except Exception:
        logger.exception("chatbot query failed")
        return _error(
            status.HTTP_500_INTERNAL_SERVER_ERROR,
            "An unexpected error occurred. Please try again later.",
        )

    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content=ChatResponse(data=reply).model_dump(),
    )
