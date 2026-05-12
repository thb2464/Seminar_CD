# AI Chatbot Service

RAG chatbot over the Travel TVB tour catalog. Replaces `Travel_TVB_Server/src/api/chatbot/`.

- **Stack**: FastAPI · Google Gemini (`gemini-2.5-flash` + `gemini-embedding-001`) · ChromaDB
- **Endpoint**: `POST /api/chat/query` (proxied as `/api/chatbot/*` through Kong)
- **Health**: `GET /health`

## Local development

```bash
cd services/ai-chatbot-service
python -m venv .venv && source .venv/bin/activate  # on Windows: .venv\Scripts\activate
pip install -e ".[dev]"
cp .env.example .env  # fill in GOOGLE_AI_API_KEY
uvicorn app.main:app --reload --port 8080
```

## Test

```bash
pytest
```

## Index tours

```bash
python -m app.scripts.index_tours
```

Pulls tours from the Catalog Service (or the monolith Strapi while Sprint 3 is in progress) and upserts embedded chunks into ChromaDB.

## Docker

```bash
docker build -t travel-tvb/ai-chatbot-service .
docker run --rm -p 8080:8080 --env-file .env travel-tvb/ai-chatbot-service
```
