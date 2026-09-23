#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

echo "Setting up NovaAcademy local environment..."

# 1. Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: python3 is required."
    exit 1
fi

# 2. Check Node
if ! command -v npm &> /dev/null; then
    echo "Error: Node.js (npm) is required."
    exit 1
fi

# 3. Create .venv if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
fi

# 4. Install backend dependencies
echo "Installing backend dependencies..."
./.venv/bin/pip install -r requirements.txt

# 5. Install frontend dependencies
echo "Installing frontend dependencies..."
cd frontend
npm install
cd ..

# 6. .env.example -> .env
if [ ! -f ".env" ]; then
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "Please update .env with your specific configuration."
else
    echo ".env already exists, skipping creation."
fi

echo ""
echo "Setup complete!"
echo "Run 'make dev' to start the local development server."

