#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PYTHON="${PYTHON:-.venv/bin/python}"

if [ ! -f "$PYTHON" ]; then
    echo "Error: Python environment not found at $PYTHON. Please run 'make setup' first."
    exit 1
fi

if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

echo "Starting Celery Flower..."
exec "$PYTHON" -m celery -A app.infrastructure.celery_app flower --port=5555 --url_prefix=/flower

