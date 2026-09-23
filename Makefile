.DEFAULT_GOAL := help

.PHONY: help setup dev stop backend frontend worker beat flower mobile mobile-ios mobile-android tunnel infra infra-down postgres redis ollama migrate migration test lint format typecheck logs clean

help:
	@echo 'Usage: make <target>'
	@echo ''
	@echo 'Targets:'
	@echo '  setup              Set up the local development environment'
	@echo '  dev                Start all core services (backend, frontend, worker, beat)'
	@echo '  stop               Stop all running development services'
	@echo '  backend            Start the FastAPI backend'
	@echo '  frontend           Start the Vite/React frontend'
	@echo '  worker             Start the Celery worker'
	@echo '  beat               Start the Celery beat'
	@echo '  flower             Start the Celery flower (monitoring)'
	@echo '  mobile             Start the Expo mobile app'
	@echo '  mobile-ios         Start the Expo mobile app in iOS simulator'
	@echo '  mobile-android     Start the Expo mobile app in Android emulator'
	@echo '  tunnel             Start ngrok tunnel'
	@echo '  infra              Start core local Docker infrastructure (postgres, redis, qdrant)'
	@echo '  infra-down         Stop all local Docker infrastructure'
	@echo '  postgres           Start local PostgreSQL in Docker'
	@echo '  redis              Start local Redis in Docker'
	@echo '  ollama             Start local Ollama in Docker'
	@echo '  migrate            Run database migrations'
	@echo '  migration          Create a new migration (usage: make migration name="message")'
	@echo '  test               Run backend tests'
	@echo '  lint               Run backend linters'
	@echo '  format             Format backend code'
	@echo '  typecheck          Run backend type checking'
	@echo '  clean              Clean up cached files and build artifacts'

setup:
	@./scripts/setup.sh

stop:
	@./scripts/stop.sh


dev:
	@./scripts/dev.sh

backend:
	@./scripts/backend.sh

frontend:
	@./scripts/frontend.sh

worker:
	@./scripts/worker.sh

beat:
	@./scripts/beat.sh

flower:
	@./scripts/flower.sh

mobile:
	@./scripts/mobile.sh

mobile-ios:
	@./scripts/mobile.sh ios

mobile-android:
	@./scripts/mobile.sh android

tunnel:
	@./scripts/tunnel.sh

infra:
	@./scripts/infra.sh up

infra-down:
	@./scripts/infra.sh down

postgres:
	@./scripts/infra.sh up postgres

redis:
	@./scripts/infra.sh up redis

ollama:
	@./scripts/infra.sh up ollama

migrate:
	@./scripts/migrate.sh

migration:
	@./scripts/migrate.sh "$(name)"

test:
	.venv/bin/pytest

lint:
	.venv/bin/ruff check app

format:
	.venv/bin/ruff format app

typecheck:
	.venv/bin/mypy app

clean:
	find . -type d -name "__pycache__" -exec rm -rf {} +
	rm -rf .ruff_cache
	rm -rf .mypy_cache