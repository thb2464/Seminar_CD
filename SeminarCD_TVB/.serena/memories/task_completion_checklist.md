# Task Completion Checklist

When finishing a coding task, run the following:

## Frontend (Travel_TVB/)
1. **Lint**: `cd Travel_TVB && npm run lint`
2. **Tests**: `cd Travel_TVB && npm run test`
3. **Build check** (optional): `cd Travel_TVB && npm run build`

## Backend (Travel_TVB_Server/)
1. **Tests**: `cd Travel_TVB_Server && npm run test`
2. **Build check** (optional): `cd Travel_TVB_Server && npm run build`

## After adding/updating tour data
- Re-index ChromaDB: `node Travel_TVB_Server/src/api/chatbot/scripts/indexTours.js`

## Notes
- No formatter (e.g., Prettier) is configured — format is ESLint-enforced only
- CI runs on GitHub Actions (push/PR to main and develop): frontend-tests + backend-tests jobs
