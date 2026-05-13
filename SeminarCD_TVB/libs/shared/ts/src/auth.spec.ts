import {
  GatewayIdentityError,
  createGatewayIdentityMiddleware,
  requireGatewayIdentity,
  type IdentityMiddlewareRequest,
} from "./auth.js";

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) {
    throw new Error(message);
  }
}

const identity = requireGatewayIdentity({
  "x-user-id": " 42 ",
  "X-User-Role": " admin ",
  "x-trace-id": " trace-1 ",
});

assert(identity.userId === "42", "user id should be trimmed");
assert(identity.role === "admin", "role should be trimmed");
assert(identity.traceId === "trace-1", "trace id should be trimmed");

try {
  requireGatewayIdentity({ "x-user-role": "user", "x-trace-id": "trace-1" });
  throw new Error("missing user id should fail");
} catch (error) {
  assert(error instanceof GatewayIdentityError, "missing user id should throw GatewayIdentityError");
}

let nextCalled = false;
const request: IdentityMiddlewareRequest = {
  headers: { "x-user-id": "7", "x-user-role": "user", "x-trace-id": "trace-2" },
};

createGatewayIdentityMiddleware()(request, { end: () => undefined }, () => {
  nextCalled = true;
});

assert(nextCalled, "middleware should call next on success");
assert(request.identity?.userId === "7", "middleware should attach identity");

let statusCode = 0;
let body = "";
createGatewayIdentityMiddleware()(
  { headers: { "x-user-role": "user", "x-trace-id": "trace-2" } },
  {
    set statusCode(value: number) {
      statusCode = value;
    },
    end: (payload?: string) => {
      body = payload ?? "";
    },
  },
  () => {
    throw new Error("next should not be called on identity failure");
  },
);

assert(statusCode === 401, "middleware should return 401 on identity failure");
assert(body.includes("Missing X-User-Id"), "middleware should return an error body");
