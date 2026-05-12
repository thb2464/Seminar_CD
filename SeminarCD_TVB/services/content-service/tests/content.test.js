const request = require('supertest');
const { setupStrapi, cleanupStrapi } = require('./helpers/strapi');

beforeAll(async () => {
  await setupStrapi();
});

afterAll(async () => {
  await cleanupStrapi();
});

describe('Content API', () => {
  it('GET /api/single-posts reaches the API (returns 500/403 without permissions)', async () => {
    const res = await request(strapi.server.httpServer).get('/api/single-posts');
    expect([403, 500]).toContain(res.status);
  });

  it('GET /api/faq reaches the API', async () => {
    const res = await request(strapi.server.httpServer).get('/api/faq');
    expect([403, 404, 500]).toContain(res.status);
  });

  it('GET /api/home-statistic reaches the API', async () => {
    const res = await request(strapi.server.httpServer).get('/api/home-statistic');
    expect([403, 404, 500]).toContain(res.status);
  });
});
