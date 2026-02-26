#!/bin/sh

# This script pulls the necessary Ollama models on startup.
# Since it's running in a separate container, it points to the 'ollama' service.

echo "Waiting for Ollama server to start at http://ollama:11434..."
MAX_RETRIES=60
RETRY_COUNT=0

until curl -s http://ollama:11434/api/tags > /dev/null; do
    RETRY_COUNT=$((RETRY_COUNT+1))
    if [ $RETRY_COUNT -ge $MAX_RETRIES ]; then
        echo "Ollama server failed to start at ollama:11434. Exiting."
        exit 1
    fi
    echo "Attempt $RETRY_COUNT: Ollama not ready yet..."
    sleep 3
done

echo "Ollama is ready! Pulling models..."

# Use OLLAMA_HOST environment variable for the ollama binary
export OLLAMA_HOST=http://ollama:11434

echo "Pulling Qwen 3 (Chat Model)..."
ollama pull qwen3:latest

echo "Pulling Nomic Embed Text (Embedding Model)..."
ollama pull nomic-embed-text

echo "Ollama bootstrap complete!"
