import config from './strapi';

describe('strapi config', () => {
  it('should export API_URL', () => {
    expect(config.API_URL).toBeDefined();
    expect(typeof config.API_URL).toBe('string');
    expect(config.API_URL.length).toBeGreaterThan(0);
  });

  it('should export backward-compatible STRAPI_URL alias', () => {
    expect(config.STRAPI_URL).toBe(config.API_URL);
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
      'TOURS',
      'BOOKINGS', 'BOOKING_MY_BOOKINGS', 'BOOKING_AVAILABILITY',
      'PAYMENT_CREATE_URL', 'PAYMENT_VNPAY_RETURN',
      'BOOKING_CREATE_PAYMENT',
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

  it('should route BOOKING_CREATE_PAYMENT to Payment Service', () => {
    expect(config.API_ENDPOINTS.BOOKING_CREATE_PAYMENT).toBe('/api/payments/create-url');
    expect(config.API_ENDPOINTS.PAYMENT_CREATE_URL).toBe('/api/payments/create-url');
  });

  it('should have correct booking endpoints', () => {
    expect(config.API_ENDPOINTS.BOOKINGS).toBe('/api/bookings');
    expect(config.API_ENDPOINTS.BOOKING_MY_BOOKINGS).toBe('/api/bookings/my-bookings');
    expect(config.API_ENDPOINTS.BOOKING_AVAILABILITY).toBe('/api/bookings/availability');
  });

  it('should have correct chatbot endpoint', () => {
    expect(config.API_ENDPOINTS.CHATBOT_QUERY).toBe('/api/chatbot/query');
  });
});
