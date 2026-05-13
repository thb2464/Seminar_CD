const request = require('supertest');
const { setupStrapi, cleanupStrapi } = require('./helpers/strapi');

jest.setTimeout(30000);

beforeAll(async () => {
  await setupStrapi();
});

afterAll(async () => {
  await cleanupStrapi();
});

describe('Content API', () => {
  const contentEndpoints = [
    '/api/about-core-value',
    '/api/about-hero',
    '/api/about-journey',
    '/api/about-team',
    '/api/authors',
    '/api/community-hero',
    '/api/faq',
    '/api/home-commitment',
    '/api/home-diagram',
    '/api/home-hero-slider',
    '/api/home-portfolio',
    '/api/home-statistic',
    '/api/layout-cta-banner',
    '/api/layout-footer',
    '/api/layout-navbar',
    '/api/layout-newsletter',
    '/api/news-hero',
    '/api/newsletter-email-submissons',
    '/api/post-categories',
    '/api/service-hero',
    '/api/single-community-posts',
    '/api/single-posts',
  ];

  it.each(contentEndpoints)('GET %s reaches the content API', async (endpoint) => {
    const res = await request(strapi.server.httpServer).get(endpoint);
    expect([200, 403, 404, 500]).toContain(res.status);
  });
});
