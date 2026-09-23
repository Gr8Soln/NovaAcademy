#!/bin/bash
set -euo pipefail

# NovaAcademy FastAPI + Celery local development startup script.

GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}$1${NC}"
}

log_ok() {
    echo -e "${GREEN}$1${NC}"
}

log_warn() {
    echo -e "${YELLOW}$1${NC}"
}

log_error() {
    echo -e "${RED}$1${NC}"
}

log_info "Starting NovaAcademy development services..."

if ! command -v python3 >/dev/null 2>&1 && ! command -v python >/dev/null 2>&1; then
    log_error "Python is not installed or not on PATH."
    exit 1
fi

PYTHON_BIN="python3"
if ! command -v python3 >/dev/null 2>&1; then
    PYTHON_BIN="python"
fi

if [ ! -d ".venv" ]; then
    log_info "No .venv found. Creating virtual environment..."
    "$PYTHON_BIN" -m venv .venv
    log_ok "Created .venv"
fi

if [ -f ".venv/bin/activate" ]; then
    # Linux/macOS venv activation.
    source .venv/bin/activate
elif [ -f ".venv/Scripts/activate" ]; then
    # Git Bash on Windows venv activation.
    source .venv/Scripts/activate
else
    log_error "Unable to find activation script for .venv"
    exit 1
fi

log_ok "Activated virtual environment (.venv)"

python -m pip install --upgrade pip

if [ ! -f "requirements.txt" ]; then
    log_error "requirements.txt not found"
    exit 1
fi

REQ_STAMP=".venv/.requirements.installed"
if [ ! -f "$REQ_STAMP" ] || [ "requirements.txt" -nt "$REQ_STAMP" ]; then
    log_info "Installing/updating dependencies from requirements.txt..."
    python -m pip install -r requirements.txt
    touch "$REQ_STAMP"
    log_ok "Dependencies installed"
else
    log_ok "Dependencies already up-to-date"
fi

if [ -f ".env" ]; then
    # Export variables so Alembic/Celery/Uvicorn can all use them.
    set -a
    source .env
    set +a
    log_ok "Loaded environment variables from .env"
else
    log_warn "Warning: .env file not found. Continuing with current environment"
fi

if [ -f "alembic.ini" ]; then
    log_info "Running database migrations..."
    python -m alembic upgrade head
    log_ok "Migrations complete"
else
    log_warn "alembic.ini not found, skipping migrations"
fi

CELERY_APP="app.infrastructure.celery_app.celery_app"
CELERY_WORKER_ARGS="--loglevel=info"

case "$(uname -s 2>/dev/null || echo unknown)" in
    MINGW*|MSYS*|CYGWIN*)
        CELERY_WORKER_ARGS="--pool=solo --loglevel=info"
        log_info "Windows environment detected, using Celery solo pool"
        ;;
esac

log_info "Restarting Celery worker and beat..."
pkill -f "celery -A ${CELERY_APP} worker" >/dev/null 2>&1 || true
pkill -f "celery -A ${CELERY_APP} beat" >/dev/null 2>&1 || true

nohup celery -A "${CELERY_APP}" worker ${CELERY_WORKER_ARGS} > celery_worker.log 2>&1 &
nohup celery -A "${CELERY_APP}" beat --loglevel=info > celery_beat.log 2>&1 &

log_ok "Celery worker and beat started"
log_info "Worker log: celery_worker.log"
log_info "Beat log: celery_beat.log"

PORT=${PORT:-8000}
log_ok "Starting Uvicorn on port ${PORT}"
log_info "API docs: http://localhost:${PORT}/docs"

exec uvicorn app.main:app --host 0.0.0.0 --port "${PORT}" --reload