'use strict';

/**
 * Block legacy /api/tours and /api/tour-categories endpoints after Sprint 3
 * cut-over.
 *
 * Sister to `block-legacy-auth.js` (F2.5). The Catalog Service
 * (`services/catalog-service`) is the sole owner of these routes from F3.7
 * onwards; the API gateway routes them at port 3001. This middleware short-
 * circuits any direct hit on the monolith with HTTP 410 Gone so a stale
 * `VITE_STRAPI_URL` fails loudly rather than silently serving stale data.
 *
 * Paths covered:
 *   ANY /api/tours
 *   ANY /api/tours/:anything
 *   ANY /api/tour-categories
 *   ANY /api/tour-categories/:anything
 *
 * Strapi's admin panel (`/admin/...`) is untouched.
 */

const BLOCKED_PATTERNS = [/^\/api\/tours(\/|$)/, /^\/api\/tour-categories(\/|$)/];

const RESPONSE_BODY = {
  error: {
    status: 410,
    name: 'GoneError',
    message:
      'This endpoint has moved. Tours and tour categories are served by the Catalog Service via the API gateway.',
  },
};

module.exports = (_config, { strapi }) => {
  return async (ctx, next) => {
    const path = ctx.request.path || '';
    if (BLOCKED_PATTERNS.some((re) => re.test(path))) {
      strapi.log.warn(
        `[block-legacy-catalog] rejected ${ctx.method} ${path} — use the Catalog Service`
      );
      ctx.status = 410;
      ctx.body = RESPONSE_BODY;
      return;
    }
    await next();
  };
};
