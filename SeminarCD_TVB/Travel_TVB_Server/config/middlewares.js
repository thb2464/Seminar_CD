module.exports = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  {
    name: 'strapi::cors',
    config: {
      origin: ['http://srv1488417.hstgr.cloud:23841', 'http://localhost:23841', 'http://localhost:5173'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      headers: ['Content-Type', 'Authorization', 'Origin', 'Accept'],
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
  // Sprint 2 (F2.5): /api/auth/* and /api/users/* now live on the Identity
  // Service. Anything still hitting the monolith for those paths gets 410.
  'global::block-legacy-auth',
  // Sprint 3 (F3.8): /api/tours/* and /api/tour-categories/* now live on the
  // Catalog Service.
  'global::block-legacy-catalog',
];
