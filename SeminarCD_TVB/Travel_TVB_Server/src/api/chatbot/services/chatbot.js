'use strict';

/**
 * Chatbot Service — RAG Orchestration
 *
 * Coordinates between the vector store (ChromaDB) and LLM (Gemini 2.0 Flash)
 * to generate grounded responses about tours.
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const vectorStore = require('./vectorStore');

const LLM_MODEL = 'gemini-2.5-flash';

let genAI = null;

function getGenAI() {
  if (!genAI) {
    const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GOOGLE_AI_API_KEY environment variable is not set.');
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/**
 * Build the system prompt with retrieved context.
 */
function buildSystemPrompt(language, contextChunks) {
  const langNames = {
    vi: 'Vietnamese (Tiếng Việt)',
    en: 'English',
    zh: 'Chinese (中文)',
  };
  const langName = langNames[language] || langNames.vi;

  const contextText = contextChunks.length > 0
    ? contextChunks
        .map((chunk, i) => {
          const meta = chunk.metadata || {};
          return `--- Tour ${i + 1}: ${meta.tourName || 'Unknown'} (slug: ${meta.tourSlug || 'N/A'}) ---\n${chunk.content}`;
        })
        .join('\n\n')
    : 'No relevant tour data found.';

  return `You are a friendly and helpful tour guide assistant for "Travel TVB", a Vietnamese travel agency website.

STRICT RULES:
1. Answer ONLY based on the TOUR DATA CONTEXT provided below. Do NOT make up or hallucinate any information.
2. If the user asks about something NOT covered in the context, politely say you don't have that specific information and suggest they browse the full tour catalog at /tours.
3. Always respond in ${langName}.
4. When recommending tours, mention: tour name, price, duration (days/nights), location, and rating when available.
5. Format prices in Vietnamese dong (₫) with thousand separators.
6. Keep responses concise but informative (2-4 paragraphs max).
7. Be warm, enthusiastic, and use a conversational tone appropriate for a travel assistant.
8. If a user greets you, respond warmly and ask how you can help them find a tour.
9. When mentioning a tour, always include its slug in this format: [tour-slug] so the frontend can create links.

TOUR DATA CONTEXT:
${contextText}`;
}

/**
 * Extract tour sources from context chunks that were likely mentioned in the reply.
 */
function extractSources(contextChunks, reply) {
  const seen = new Set();
  const sources = [];

  for (const chunk of contextChunks) {
    const meta = chunk.metadata || {};
    const slug = meta.tourSlug;
    const name = meta.tourName;

    if (!slug || seen.has(slug)) continue;

    // Check if this tour was likely referenced in the reply
    const nameWords = (name || '').split(/\s+/).filter((w) => w.length > 2);
    const isReferenced =
      reply.includes(slug) ||
      reply.includes(`[${slug}]`) ||
      nameWords.some((word) => reply.toLowerCase().includes(word.toLowerCase()));

    if (isReferenced) {
      seen.add(slug);
      sources.push({
        tourName: name,
        tourSlug: slug,
        price: meta.price || null,
        location: meta.location || null,
      });
    }
  }

  return sources;
}

/**
 * Main chat function — the RAG pipeline.
 *
 * @param {string} message - User's message
 * @param {string} language - Language code (vi, en, zh)
 * @param {Array<{role: string, content: string}>} history - Conversation history (last 5 messages)
 * @returns {Promise<{reply: string, sources: Array}>}
 */
async function chat(message, language = 'vi', history = []) {
  try {
    // Step 1: Search vector store for relevant tour chunks
    const contextChunks = await vectorStore.search(message, 5, language);

    // Step 2: Build system prompt with context
    const systemPrompt = buildSystemPrompt(language, contextChunks);

    // Step 3: Build conversation messages for Gemini
    const ai = getGenAI();
    const model = ai.getGenerativeModel({
      model: LLM_MODEL,
      systemInstruction: systemPrompt,
    });

    // Build chat history for context
    // Gemini requires history to start with role 'user', so drop leading 'model' messages
    let chatHistory = history
      .slice(-10) // Last 10 messages (5 pairs)
      .map((msg) => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      }));

    // Drop leading 'model' messages — Gemini rejects history starting with 'model'
    while (chatHistory.length > 0 && chatHistory[0].role === 'model') {
      chatHistory.shift();
    }

    const chat = model.startChat({
      history: chatHistory,
    });

    // Step 4: Send the user's message and get response
    const result = await chat.sendMessage(message);
    const reply = result.response.text();

    // Step 5: Extract sources from context that were referenced
    const sources = extractSources(contextChunks, reply);

    return { reply, sources };
  } catch (error) {
    console.error('[Chatbot] Error in chat pipeline:', error);

    // Return a friendly error message based on language
    const errorMessages = {
      vi: 'Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau hoặc truy cập trang /tours để xem các tour.',
      en: 'Sorry, I\'m experiencing a technical issue. Please try again later or visit /tours to browse tours.',
      zh: '抱歉，我遇到了技术问题。请稍后再试或访问 /tours 浏览旅游线路。',
    };

    return {
      reply: errorMessages[language] || errorMessages.vi,
      sources: [],
    };
  }
}

module.exports = {
  chat,
};
