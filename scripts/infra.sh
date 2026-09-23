#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

COMMAND="${1:-up}"
SERVICE="${2:-}"

if ! command -v docker &> /dev/null; then
    echo "Error: Docker is required for local infrastructure."
    exit 1
fi

if [ "$COMMAND" = "up" ]; then
    if [ -z "$SERVICE" ]; then
        echo "Starting all core local infrastructure (Postgres, Redis, Qdrant)..."
        exec docker compose up -d postgres redis qdrant
    else
        echo "Starting $SERVICE..."
        exec docker compose up -d "$SERVICE"
    fi
elif [ "$COMMAND" = "down" ]; then
    echo "Stopping local infrastructure..."
    exec docker compose down
else
    echo "Unknown command: $COMMAND"
    exit 1
fi

