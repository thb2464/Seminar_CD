'use strict';

/**
 * Chatbot custom routes
 * POST /api/chatbot/query — public endpoint for chatbot queries
 */
module.exports = {
  routes: [
    {
      method: 'POST',
      path: '/chatbot/query',
      handler: 'chatbot.query',
      config: {
        policies: [],
        middlewares: [],
        auth: false,
      },
    },
  ],
};
