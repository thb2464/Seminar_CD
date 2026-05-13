import unittest

from travel_tvb_shared.auth import (
    GatewayIdentityError,
    GatewayIdentityMiddleware,
    require_gateway_identity,
)


class AuthTests(unittest.IsolatedAsyncioTestCase):
    def test_require_gateway_identity_reads_case_insensitive_headers(self) -> None:
        identity = require_gateway_identity(
            {
                "X-User-Id": " 42 ",
                "x-user-role": " admin ",
                "X-Trace-Id": " trace-1 ",
            }
        )

        self.assertEqual(identity.user_id, "42")
        self.assertEqual(identity.role, "admin")
        self.assertEqual(identity.trace_id, "trace-1")

    def test_require_gateway_identity_rejects_missing_user_id(self) -> None:
        with self.assertRaises(GatewayIdentityError):
            require_gateway_identity({"x-user-role": "user", "x-trace-id": "trace-1"})

    async def test_middleware_attaches_identity(self) -> None:
        seen_scope = {}

        async def app(scope, _receive, _send):
            seen_scope.update(scope)

        middleware = GatewayIdentityMiddleware(app)
        scope = {
            "type": "http",
            "headers": [
                (b"x-user-id", b"7"),
                (b"x-user-role", b"user"),
                (b"x-trace-id", b"trace-2"),
            ],
        }

        await middleware(scope, _receive, _send)

        self.assertEqual(seen_scope["travel_tvb.identity"].user_id, "7")

    async def test_middleware_returns_401_on_missing_identity(self) -> None:
        sent = []

        async def app(_scope, _receive, _send):
            raise AssertionError("app should not be called")

        async def send(message):
            sent.append(message)

        middleware = GatewayIdentityMiddleware(app)
        await middleware({"type": "http", "headers": []}, _receive, send)

        self.assertEqual(sent[0]["status"], 401)


async def _receive():
    return {"type": "http.request"}


async def _send(_message):
    return None
