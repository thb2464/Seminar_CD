// config/strapi.js
//
// Central API configuration. All frontend API calls go through the Kong
// gateway. VITE_API_GATEWAY_URL is the primary env var; VITE_STRAPI_URL
// is accepted as a backwards-compatible fallback during the Sprint 6
// migration window.
const config = {
  API_URL:
    import.meta.env.VITE_API_GATEWAY_URL ||
    import.meta.env.VITE_STRAPI_URL ||
    'http://localhost:8000',

  // Backward-compatible alias — existing code that references
  // config.STRAPI_URL keeps working until Sprint 6 is fully closed out.
  get STRAPI_URL() {
    return this.API_URL;
  },

  // API endpoints — grouped by owning microservice
  API_ENDPOINTS: {
    // --- Content Service (Strapi) ---
    HERO_SLIDER: '/api/home-hero-slider',
    STATISTIC: '/api/home-statistic',
    COMMITMENT: '/api/home-commitment',
    DIAGRAM: '/api/home-diagram',
    PORTFOLIO: '/api/home-portfolio',
    FAQ: '/api/faq',
    ABOUT_HERO: '/api/about-hero',
    ABOUT_JOURNEY: '/api/about-journey',
    ABOUT_TEAM: '/api/about-team',
    COREVALUES: '/api/about-core-value',
    SERVICE_HERO: '/api/service-hero',
    SERVICE_INSURANCETYPE: '/api/services-insurance-type',
    CONTACT_MAP: '/api/contact-map',
    CONTACT_FORM: '/api/contact-form',
    NEWS_HERO: '/api/news-hero',
    COMMUNITY_HERO: '/api/community-hero',
    INDIVIDUAL_SERVICES: '/api/individual-services',
    LAYOUT_NAVBAR: '/api/layout-navbar',
    SINGLE_POST: '/api/single-posts',
    SINGLE_COMMUNITY_POST: '/api/single-community-posts',
    LAYOUT_POPULAR_POSTS: '/api/layout-popular-post',
    LAYOUT_FOOTER: '/api/layout-footer',
    FORM_SUBMISSION: '/api/form-submissions',
    LAYOUT_CTABANNER: '/api/layout-cta-banner',
    LAYOUT_NEWSLETTER: '/api/layout-newsletter',
    NEWSLETTER_SUBMISSION: '/api/newsletter-email-submissons/:id',

    // --- Identity Service ---
    AUTH_LOCAL: '/api/auth/local',
    AUTH_REGISTER: '/api/auth/local/register',
    USERS_ME: '/api/users/me',

    // --- Catalog Service ---
    TOURS: '/api/tours',
    TOUR_CATEGORIES: '/api/tour-categories',

    // --- Booking Service ---
    BOOKINGS: '/api/bookings',
    BOOKING_MY_BOOKINGS: '/api/bookings/my-bookings',
    BOOKING_AVAILABILITY: '/api/bookings/availability',

    // --- Payment Service ---
    PAYMENT_CREATE_URL: '/api/payments/create-url',
    PAYMENT_VNPAY_RETURN: '/api/payments/vnpay-return',

    // Backward-compatible alias for the old monolith endpoint name.
    // Profile.jsx used BOOKING_CREATE_PAYMENT; it now routes to the
    // Payment Service through Kong.
    get BOOKING_CREATE_PAYMENT() {
      return '/api/payments/create-url';
    },

    // --- AI Chatbot Service ---
    CHATBOT_QUERY: '/api/chatbot/query',
  }
};

export default config;