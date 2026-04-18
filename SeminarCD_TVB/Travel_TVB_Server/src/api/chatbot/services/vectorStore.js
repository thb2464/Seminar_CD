'use strict';

/**
 * Vector Store Service — ChromaDB + Google Gemini Embeddings
 *
 * Handles embedding generation and vector search for tour data.
 * Used by the chatbot service for RAG (Retrieval Augmented Generation).
 */

const { GoogleGenerativeAI } = require('@google/generative-ai');
const { ChromaClient } = require('chromadb');

const COLLECTION_NAME = 'tour_embeddings';
const EMBEDDING_MODEL = 'gemini-embedding-001';

let chromaClient = null;
let collection = null;
let genAI = null;

/**
 * Sleep helper for rate-limit retries.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Initialize ChromaDB client and get/create the tour_embeddings collection.
 */
async function initialize() {
  if (collection) return collection;

  const chromaUrl = process.env.CHROMADB_URL || 'http://localhost:42839';
  const apiKey = process.env.GOOGLE_AI_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GOOGLE_AI_API_KEY environment variable is not set.');
  }

  genAI = new GoogleGenerativeAI(apiKey);

  // Parse URL into host/port for ChromaDB client (avoids deprecated 'path' param)
  const parsedUrl = new URL(chromaUrl);
  chromaClient = new ChromaClient({
    ssl: parsedUrl.protocol === 'https:',
    host: parsedUrl.hostname,
    port: parseInt(parsedUrl.port) || (parsedUrl.protocol === 'https:' ? 443 : 8000),
  });

  // Get or create the collection
  collection = await chromaClient.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: { description: 'Tour data embeddings for RAG chatbot' },
  });

  console.log(`[VectorStore] Connected to ChromaDB at ${chromaUrl}, collection: ${COLLECTION_NAME}`);
  return collection;
}

/**
 * Generate embedding for a text string with retry on rate-limit (429).
 * Uses gemini-embedding-001 (3072 dimensions).
 * @param {string} text - Text to embed
 * @returns {Promise<number[]>} - Embedding vector
 */
async function embedText(text) {
  if (!genAI) {
    await initialize();
  }

  const model = genAI.getGenerativeModel({ model: EMBEDDING_MODEL });
  const MAX_RETRIES = 5;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (err) {
      const is429 = err.status === 429 || (err.message && err.message.includes('429'));
      if (is429 && attempt < MAX_RETRIES) {
        const waitMs = attempt * 5000; // 5s, 10s, 15s, 20s
        console.log(`[VectorStore] Rate limited (429). Waiting ${waitMs / 1000}s before retry ${attempt + 1}/${MAX_RETRIES}...`);
        await sleep(waitMs);
      } else {
        throw err;
      }
    }
  }
}

/**
 * Batch embed multiple texts (sequential calls with inter-request delay).
 * @param {string[]} texts - Array of texts to embed
 * @returns {Promise<number[][]>} - Array of embedding vectors
 */
async function embedBatch(texts) {
  const embeddings = [];
  for (let i = 0; i < texts.length; i++) {
    const embedding = await embedText(texts[i]);
    embeddings.push(embedding);
    // Small delay between requests to stay under free-tier rate limits (15 RPM)
    if (i < texts.length - 1) {
      await sleep(1000);
    }
  }
  return embeddings;
}

/**
 * Add documents to the ChromaDB collection.
 * @param {Array<{id: string, content: string, metadata: object}>} documents
 */
async function addDocuments(documents) {
  await initialize();

  if (!documents || documents.length === 0) return 0;

  // Process in batches of 5 to stay within rate limits
  const BATCH_SIZE = 5;
  let totalAdded = 0;

  for (let i = 0; i < documents.length; i += BATCH_SIZE) {
    const batch = documents.slice(i, i + BATCH_SIZE);
    const texts = batch.map((doc) => doc.content);
    const embeddings = await embedBatch(texts);

    await collection.upsert({
      ids: batch.map((doc) => doc.id),
      documents: texts,
      embeddings: embeddings,
      metadatas: batch.map((doc) => doc.metadata),
    });

    totalAdded += batch.length;
    console.log(`[VectorStore] Upserted batch ${Math.floor(i / BATCH_SIZE) + 1}: ${batch.length} documents (total: ${totalAdded})`);
  }

  return totalAdded;
}

/**
 * Search for relevant documents in ChromaDB.
 * @param {string} query - User's question
 * @param {number} nResults - Number of results to return (default: 5)
 * @param {string} language - Language code to filter by (vi, en, zh)
 * @returns {Promise<Array<{content: string, metadata: object, distance: number}>>}
 */
async function search(query, nResults = 5, language = 'vi') {
  await initialize();

  const queryEmbedding = await embedText(query);

  // Search in the requested language first
  let results = await collection.query({
    queryEmbeddings: [queryEmbedding],
    nResults: nResults,
    where: { language: language },
  });

  // Fallback: if no results in requested language, search in English
  const hasResults = results?.documents?.[0]?.length > 0;
  if (!hasResults && language !== 'en') {
    console.log(`[VectorStore] No results for language '${language}', falling back to 'en'`);
    results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: nResults,
      where: { language: 'en' },
    });
  }

  // Final fallback: search without language filter
  const hasResultsNow = results?.documents?.[0]?.length > 0;
  if (!hasResultsNow) {
    console.log(`[VectorStore] No results with language filter, searching all languages`);
    results = await collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: nResults,
    });
  }

  if (!results || !results.documents || !results.documents[0]) {
    return [];
  }

  return results.documents[0].map((doc, index) => ({
    content: doc,
    metadata: results.metadatas[0][index],
    distance: results.distances[0][index],
  }));
}

/**
 * Delete all documents in the collection (useful for re-indexing).
 */
async function clearCollection() {
  await initialize();

  // Delete and recreate the collection
  await chromaClient.deleteCollection({ name: COLLECTION_NAME });
  collection = await chromaClient.getOrCreateCollection({
    name: COLLECTION_NAME,
    metadata: { description: 'Tour data embeddings for RAG chatbot' },
  });

  console.log(`[VectorStore] Collection ${COLLECTION_NAME} cleared and recreated.`);
}

module.exports = {
  initialize,
  embedText,
  embedBatch,
  addDocuments,
  search,
  clearCollection,
};
