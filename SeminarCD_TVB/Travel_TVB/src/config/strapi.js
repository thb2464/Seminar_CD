// config/strapi.js
const config = {
  // Base URL for Strapi API
  STRAPI_URL: import.meta.env.VITE_STRAPI_URL || 'https://dashboard.lamweb.fun',

  // API endpoints
  API_ENDPOINTS: {
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

    // Auth endpoints
    AUTH_LOCAL: '/api/auth/local',
    AUTH_REGISTER: '/api/auth/local/register',
    USERS_ME: '/api/users/me',

    // Tour endpoints
    TOURS: '/api/tours',
    TOUR_CATEGORIES: '/api/tour-categories',

    // Booking endpoints
    BOOKINGS: '/api/bookings',
    BOOKING_CREATE_PAYMENT: '/api/bookings/create-payment-url',
    BOOKING_MY_BOOKINGS: '/api/bookings/my-bookings',
    BOOKING_AVAILABILITY: '/api/bookings/availability',

    // Chatbot endpoint
    CHATBOT_QUERY: '/api/chatbot/query',
  }
};

export default config;