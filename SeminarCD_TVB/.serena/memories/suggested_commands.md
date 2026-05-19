# Suggested Commands

## System: Windows (use `cd`, `dir`, `copy`, etc. or PowerShell equivalents)
- List files: `dir` or use Glob tool
- Find files: use Glob/Grep tools

## Frontend (Travel_TVB/)
```
cd Travel_TVB
npm install          # Install dependencies
npm run dev          # Start dev server at http://localhost:5173
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # ESLint linting
npm run test         # Run Vitest tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

## Backend (Travel_TVB_Server/)
```
cd Travel_TVB_Server
npm install          # Install dependencies
npm run develop      # Start Strapi dev mode (auto-reload) at http://localhost:1337
npm run build        # Build Strapi admin panel
npm run start        # Production mode
npm run test         # Run Jest tests
npm run test:watch   # Watch mode
npm run test:coverage # Coverage report
```

## ChromaDB (for chatbot)
```
pip install chromadb
chroma run --host 0.0.0.0 --port 8000
# OR with Docker:
docker run -d --name chromadb -p 8000:8000 -v chroma_data:/chroma/chroma chromadb/chroma:latest
```

## Utility Scripts (from root)
```
node migrate-strapi-locales.mjs                              # Migrate locale content
node Travel_TVB_Server/src/api/chatbot/scripts/indexTours.js  # Index tours into ChromaDB
```

## Environment Setup
- Backend: copy `.env.example` to `.env` in `Travel_TVB_Server/`
- Frontend: create `.env` in `Travel_TVB/` with VITE_STRAPI_URL and VITE_STRAPI_API_TOKEN
