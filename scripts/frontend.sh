#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../frontend"

if [ ! -d "node_modules" ]; then
    echo "Error: node_modules not found. Please run 'make setup' first."
    exit 1
fi

if [ -f "../.env" ]; then
    set -a
    source ../.env
    set +a
fi

echo "Starting Frontend..."
exec npm run dev -- --host 0.0.0.0

