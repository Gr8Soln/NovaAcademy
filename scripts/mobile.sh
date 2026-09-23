#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/../mobile"

if [ ! -d "node_modules" ]; then
    echo "Error: mobile/node_modules not found. Please run 'npm install' inside the mobile directory."
    exit 1
fi

if [ -f "../.env" ]; then
    set -a
    source ../.env
    set +a
fi

PLATFORM="${1:-}"

echo "Starting Mobile App (Expo)..."
if [ "$PLATFORM" = "ios" ]; then
    exec npx expo start --ios
elif [ "$PLATFORM" = "android" ]; then
    exec npx expo start --android
else
    exec npx expo start
fi

