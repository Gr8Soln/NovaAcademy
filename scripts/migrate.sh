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

if [ -n "${1:-}" ]; then
    echo "Creating new migration: $1"
    exec "$PYTHON" -m alembic revision --autogenerate -m "$1"
else
    echo "Running database migrations..."
    exec "$PYTHON" -m alembic upgrade head
fi

