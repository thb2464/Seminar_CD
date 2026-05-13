export type HeaderValue = string | string[] | undefined;

export interface GatewayHeaders {
  [headerName: string]: HeaderValue;
}

export interface RequestIdentity {
  userId: string;
  role: string;
  traceId: string;
}

export interface IdentityMiddlewareRequest {
  headers: GatewayHeaders;
  identity?: RequestIdentity;
}

export interface IdentityMiddlewareResponse {
  statusCode?: number;
  setHeader?: (name: string, value: string) => void;
  end: (body?: string) => void;
}

export type IdentityMiddlewareNext = (error?: unknown) => void;

export class GatewayIdentityError extends Error {
  readonly statusCode: number;

  constructor(message: string, statusCode = 401) {
    super(message);
    this.name = "GatewayIdentityError";
    this.statusCode = statusCode;
  }
}

export function readHeader(headers: GatewayHeaders, headerName: string): string | undefined {
  const expected = headerName.toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() !== expected) {
      continue;
    }

    if (Array.isArray(value)) {
      return value[0]?.trim();
    }

    return value?.trim();
  }

  return undefined;
}

export function requireGatewayIdentity(headers: GatewayHeaders): RequestIdentity {
  const userId = readHeader(headers, "x-user-id");
  const role = readHeader(headers, "x-user-role");
  const traceId = readHeader(headers, "x-trace-id");

  if (!userId) {
    throw new GatewayIdentityError("Missing X-User-Id header.");
  }

  if (!role) {
    throw new GatewayIdentityError("Missing X-User-Role header.");
  }

  if (!traceId) {
    throw new GatewayIdentityError("Missing X-Trace-Id header.");
  }

  return { userId, role, traceId };
}

export function createGatewayIdentityMiddleware() {
  return (
    request: IdentityMiddlewareRequest,
    response: IdentityMiddlewareResponse,
    next: IdentityMiddlewareNext,
  ): void => {
    try {
      request.identity = requireGatewayIdentity(request.headers);
      next();
    } catch (error) {
      if (error instanceof GatewayIdentityError) {
        response.statusCode = error.statusCode;
        response.setHeader?.("content-type", "application/json");
        response.end(JSON.stringify({ error: { status: error.statusCode, message: error.message } }));
        return;
      }

      next(error);
    }
  };
}
