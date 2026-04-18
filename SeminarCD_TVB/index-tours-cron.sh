#!/bin/bash
# Scheduled ChromaDB tour indexing script
# Runs via cron to keep chatbot vector data in sync with Strapi content

PROJECT_DIR="/srv/TuanSP/DACN_TourGuideWeb/Travel_TVB_Server"
LOG_FILE="/srv/TuanSP/DACN_TourGuideWeb/index-tours-cron.log"

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "========== INDEX STARTED =========="

# Check Strapi is reachable
if ! curl -s -o /dev/null -w '' --max-time 5 http://localhost:17234/_health; then
  log "SKIP: Strapi is not running (port 17234)"
  log "========== INDEX ABORTED =========="
  exit 1
fi

# Check ChromaDB is reachable
if ! curl -s -o /dev/null --max-time 5 http://localhost:42839/api/v1; then
  log "SKIP: ChromaDB is not running (port 42839)"
  log "========== INDEX ABORTED =========="
  exit 1
fi

cd "$PROJECT_DIR"

# Override Strapi URL — the .env has PORT=17234 but the script defaults to 1337
export STRAPI_URL="http://localhost:17234"
export CHROMADB_URL="http://localhost:42839"

log "Running indexTours.js..."
node src/api/chatbot/scripts/indexTours.js 2>&1 | tee -a "$LOG_FILE"
EXIT_CODE=${PIPESTATUS[0]}

if [ $EXIT_CODE -eq 0 ]; then
  log "Indexing completed successfully"
else
  log "ERROR: Indexing failed with exit code $EXIT_CODE"
fi

log "========== INDEX FINISHED =========="
