from __future__ import annotations

import json
from collections.abc import Awaitable, Callable, Mapping, Sequence
from dataclasses import dataclass
from typing import Any

HeaderValue = str | Sequence[str] | None
Headers = Mapping[str, HeaderValue]

Receive = Callable[[], Awaitable[dict[str, Any]]]
Send = Callable[[dict[str, Any]], Awaitable[None]]
AsgiApp = Callable[[dict[str, Any], Receive, Send], Awaitable[None]]


@dataclass(frozen=True)
class GatewayIdentity:
    user_id: str
    role: str
    trace_id: str


class GatewayIdentityError(ValueError):
    def __init__(self, message: str, status_code: int = 401) -> None:
        super().__init__(message)
        self.status_code = status_code


def _read_header(headers: Headers, header_name: str) -> str | None:
    expected = header_name.lower()

    for key, value in headers.items():
        if key.lower() != expected:
            continue

        if isinstance(value, str):
            stripped = value.strip()
            return stripped or None

        if value:
            first = str(value[0]).strip()
            return first or None

    return None


def require_gateway_identity(headers: Headers) -> GatewayIdentity:
    user_id = _read_header(headers, "x-user-id")
    role = _read_header(headers, "x-user-role")
    trace_id = _read_header(headers, "x-trace-id")

    if user_id is None:
        raise GatewayIdentityError("Missing X-User-Id header.")

    if role is None:
        raise GatewayIdentityError("Missing X-User-Role header.")

    if trace_id is None:
        raise GatewayIdentityError("Missing X-Trace-Id header.")

    return GatewayIdentity(user_id=user_id, role=role, trace_id=trace_id)


def _asgi_headers(scope: Mapping[str, Any]) -> dict[str, str]:
    raw_headers = scope.get("headers", [])
    headers: dict[str, str] = {}

    for key, value in raw_headers:
        headers[key.decode("latin-1")] = value.decode("latin-1")

    return headers


class GatewayIdentityMiddleware:
    def __init__(self, app: AsgiApp) -> None:
        self.app = app

    async def __call__(self, scope: dict[str, Any], receive: Receive, send: Send) -> None:
        if scope.get("type") != "http":
            await self.app(scope, receive, send)
            return

        try:
            scope["travel_tvb.identity"] = require_gateway_identity(_asgi_headers(scope))
        except GatewayIdentityError as error:
            body = json.dumps({"error": {"status": error.status_code, "message": str(error)}}).encode()
            await send(
                {
                    "type": "http.response.start",
                    "status": error.status_code,
                    "headers": [(b"content-type", b"application/json")],
                }
            )
            await send({"type": "http.response.body", "body": body})
            return

        await self.app(scope, receive, send)
