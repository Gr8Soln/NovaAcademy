#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-8000}"
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

echo "Starting Backend on port $PORT..."
exec "$PYTHON" -m uvicorn app.main:app --host 0.0.0.0 --port "$PORT" --reload

