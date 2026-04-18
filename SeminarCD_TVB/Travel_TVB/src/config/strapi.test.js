import config from './strapi';

describe('strapi config', () => {
  it('should export STRAPI_URL', () => {
    expect(config.STRAPI_URL).toBeDefined();
    expect(typeof config.STRAPI_URL).toBe('string');
    expect(config.STRAPI_URL.length).toBeGreaterThan(0);
  });

  it('should export API_ENDPOINTS object', () => {
    expect(config.API_ENDPOINTS).toBeDefined();
    expect(typeof config.API_ENDPOINTS).toBe('object');
  });

  it('should have all expected endpoint keys', () => {
    const expectedKeys = [
      'HERO_SLIDER', 'STATISTIC', 'COMMITMENT', 'DIAGRAM', 'PORTFOLIO', 'FAQ',
      'ABOUT_HERO', 'ABOUT_JOURNEY', 'ABOUT_TEAM', 'COREVALUES',
      'SERVICE_HERO', 'NEWS_HERO', 'COMMUNITY_HERO',
      'LAYOUT_NAVBAR', 'LAYOUT_FOOTER', 'LAYOUT_CTABANNER', 'LAYOUT_NEWSLETTER',
      'SINGLE_POST', 'SINGLE_COMMUNITY_POST',
      'AUTH_LOCAL', 'AUTH_REGISTER', 'USERS_ME',
      'TOURS', 'TOUR_CATEGORIES',
      'BOOKINGS', 'BOOKING_CREATE_PAYMENT', 'BOOKING_MY_BOOKINGS',
      'CHATBOT_QUERY',
    ];

    expectedKeys.forEach(key => {
      expect(config.API_ENDPOINTS).toHaveProperty(key);
    });
  });

  it('should have all endpoint values starting with /api/', () => {
    Object.entries(config.API_ENDPOINTS).forEach(([key, value]) => {
      expect(value).toMatch(/^\/api\//);
    });
  });

  it('should have correct AUTH_LOCAL endpoint', () => {
    expect(config.API_ENDPOINTS.AUTH_LOCAL).toBe('/api/auth/local');
  });

  it('should have correct AUTH_REGISTER endpoint', () => {
    expect(config.API_ENDPOINTS.AUTH_REGISTER).toBe('/api/auth/local/register');
  });

  it('should have correct BOOKING_CREATE_PAYMENT endpoint', () => {
    expect(config.API_ENDPOINTS.BOOKING_CREATE_PAYMENT).toBe('/api/bookings/create-payment-url');
  });
});
