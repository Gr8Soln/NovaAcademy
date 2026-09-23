#!/usr/bin/env bash
set -u

echo "Stopping NovaAcademy development services..."

# Kill Backend (uvicorn)
echo "Stopping Backend..."
pkill -f "uvicorn app.main:app" || true

# Kill Frontend (vite/npm)
echo "Stopping Frontend..."
pkill -f "vite" || true

# Kill Celery processes
echo "Stopping Celery Worker..."
pkill -f "celery.*worker" || true

echo "Stopping Celery Beat..."
pkill -f "celery.*beat" || true

echo "Stopping Celery Flower..."
pkill -f "celery.*flower" || true

# Kill Ngrok
echo "Stopping Ngrok tunnel..."
pkill -f "ngrok http" || true

echo "All services stopped."

