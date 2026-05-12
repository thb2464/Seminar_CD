'use strict';

/**
 * Block legacy users-permissions endpoints after Sprint 2 cut-over.
 *
 * The Identity Service (`services/identity-service`) is the sole owner of
 * `/api/auth/local`, `/api/auth/local/register`, and `/api/users/me` from F2.4
 * onwards. This middleware short-circuits any request that arrives at the
 * monolith for those paths with HTTP 410 Gone so:
 *   - misconfigured clients that still point at port 1337 fail loudly
 *   - the Strapi admin panel keeps working (it talks to /admin, not /api/auth)
 *
 * Paths covered:
 *   POST /api/auth/local
 *   POST /api/auth/local/register
 *   POST /api/auth/forgot-password
 *   POST /api/auth/reset-password
 *   POST /api/auth/email-confirmation
 *   POST /api/auth/send-email-confirmation
 *   ANY  /api/users/me
 *   ANY  /api/users/:id
 *   GET  /api/users
 *
 * Once Sprint 4 (Content Service) ships and the monolith is split, this
 * middleware can be deleted along with the rest of the now-content-only
 * Strapi container.
 */

const BLOCKED_PATTERNS = [
  /^\/api\/auth(\/|$)/,
  /^\/api\/users(\/|$)/,
];

const RESPONSE_BODY = {
  error: {
    status: 410,
    name: 'GoneError',
    message:
      'This endpoint has moved. Authenticate against the Identity Service via the API gateway: /api/auth/local',
  },
};

module.exports = (_config, { strapi }) => {
  return async (ctx, next) => {
    const path = ctx.request.path || '';
    if (BLOCKED_PATTERNS.some((re) => re.test(path))) {
      strapi.log.warn(
        `[block-legacy-auth] rejected ${ctx.method} ${path} — use the Identity Service`
      );
      ctx.status = 410;
      ctx.body = RESPONSE_BODY;
      return;
    }
    await next();
  };
};
