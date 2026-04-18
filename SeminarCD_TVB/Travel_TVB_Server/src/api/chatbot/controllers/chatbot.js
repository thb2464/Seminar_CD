'use strict';

/**
 * Chatbot Controller
 *
 * Handles POST /api/chatbot/query requests.
 * Validates input, applies rate limiting, and delegates to the chatbot service.
 *
 * NOTE: This is a custom API without a Strapi content type, so we export
 * a plain object instead of using createCoreController.
 */

const chatbotService = require('../services/chatbot');

// --- Simple in-memory rate limiter ---
const rateLimitMap = new Map(); // IP -> { timestamps: number[] }
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 15; // 15 requests per minute per IP

function isRateLimited(ip) {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry) {
    rateLimitMap.set(ip, { timestamps: [now] });
    return false;
  }

  // Remove timestamps outside the window
  entry.timestamps = entry.timestamps.filter(
    (ts) => now - ts < RATE_LIMIT_WINDOW_MS
  );

  if (entry.timestamps.length >= RATE_LIMIT_MAX_REQUESTS) {
    return true;
  }

  entry.timestamps.push(now);
  return false;
}

// Clean up old entries every 5 minutes to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of rateLimitMap.entries()) {
    entry.timestamps = entry.timestamps.filter(
      (ts) => now - ts < RATE_LIMIT_WINDOW_MS
    );
    if (entry.timestamps.length === 0) {
      rateLimitMap.delete(ip);
    }
  }
}, 5 * 60 * 1000);

module.exports = {
  /**
   * POST /api/chatbot/query
   *
   * Body: {
   *   message: string (required),
   *   language?: string (default: 'vi'),
   *   history?: Array<{role: 'user'|'bot', content: string}> (default: []),
   *   sessionId?: string
   * }
   *
   * Response: {
   *   data: { reply: string, sources: Array<{tourName, tourSlug}> }
   * }
   */
  async query(ctx) {
    // Rate limiting
    const clientIp =
      ctx.request.ip ||
      ctx.request.headers['x-forwarded-for'] ||
      'unknown';

    if (isRateLimited(clientIp)) {
      ctx.status = 429;
      ctx.body = {
        error: {
          status: 429,
          message: 'Too many requests. Please wait a moment before trying again.',
        },
      };
      return;
    }

    // Validate input
    const body = ctx.request.body || {};
    const { message, language, history, sessionId } = body;

    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      ctx.status = 400;
      ctx.body = {
        error: {
          status: 400,
          message: 'Message is required and must be a non-empty string.',
        },
      };
      return;
    }

    // Sanitize inputs
    const cleanMessage = message.trim().substring(0, 500); // Max 500 chars
    const cleanLanguage = ['vi', 'en', 'zh'].includes(language) ? language : 'vi';
    const cleanHistory = Array.isArray(history)
      ? history
          .slice(-10) // Max last 10 messages
          .filter(
            (msg) =>
              msg &&
              typeof msg.content === 'string' &&
              ['user', 'bot'].includes(msg.role)
          )
          .map((msg) => ({
            role: msg.role,
            content: msg.content.substring(0, 500),
          }))
      : [];

    try {
      strapi.log.info(
        `[Chatbot] Query from ${clientIp}: "${cleanMessage.substring(0, 50)}..." (lang: ${cleanLanguage})`
      );

      const result = await chatbotService.chat(
        cleanMessage,
        cleanLanguage,
        cleanHistory
      );

      ctx.body = {
        data: {
          reply: result.reply,
          sources: result.sources,
        },
      };
    } catch (err) {
      strapi.log.error('[Chatbot] Query failed:', err);
      ctx.status = 500;
      ctx.body = {
        error: {
          status: 500,
          message: 'An unexpected error occurred. Please try again later.',
        },
      };
    }
  },
};
