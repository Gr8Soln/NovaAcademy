#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

PORT="${PORT:-8000}"

if ! command -v ngrok &> /dev/null; then
    echo "Error: ngrok is not installed. Please install it first."
    exit 1
fi

if [ -f ".env" ]; then
    set -a
    source .env
    set +a
fi

echo "Starting ngrok tunnel for port $PORT..."
if [ -n "${NGROK_URL:-}" ]; then
    exec ngrok http --url="${NGROK_URL}" "$PORT"
else
    exec ngrok http "$PORT"
fi

