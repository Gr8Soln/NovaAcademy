.DEFAULT_GOAL := help

ifeq ($(OS),Windows_NT)
VENV_PYTHON := .venv/Scripts/python.exe
BOOTSTRAP_PYTHON ?= py -3
else
VENV_PYTHON := .venv/bin/python
BOOTSTRAP_PYTHON ?= python3
endif

PYTHON ?= $(VENV_PYTHON)
PORT ?= 8000
OLLAMA_CHAT_MODEL ?= qwen3:latest
OLLAMA_EMBEDDING_MODEL ?= nomic-embed-text

.PHONY: help venv install migrate backend worker beat ui dev ollama-pull docker-up docker-up-openai docker-up-host-ollama docker-migrate docker-down docker-logs

help:
	@echo 'make install               Install backend and UI dependencies'
	@echo 'make migrate               Run database migrations'
	@echo 'make dev                   Start local backend, workers, beat, and UI'
	@echo 'make ollama-pull           Pull Ollama models explicitly (host or Docker)'
	@echo 'make docker-up             Build and start the full Compose stack'
	@echo 'make docker-up-openai      Start Compose using an external OpenAI provider'
	@echo 'make docker-up-host-ollama Start Compose stack using host Ollama'
	@echo 'make docker-migrate        Run migrations inside the backend container'
	@echo 'make docker-down           Stop Compose services'
	@echo 'make docker-logs           Follow Compose logs'

venv:
	$(BOOTSTRAP_PYTHON) -m venv .venv

install: venv
	$(PYTHON) -m pip install -r requirements.txt
	cd ui && npm install

migrate: venv
	$(PYTHON) -m alembic upgrade head

backend: venv
	$(PYTHON) -m uvicorn app.main:app --host 0.0.0.0 --port $(PORT) --reload

worker: venv
	$(PYTHON) -m celery -A app.infrastructure.celery_app worker --loglevel=info

beat: venv
	$(PYTHON) -m celery -A app.infrastructure.celery_app beat --loglevel=info

ui:
	cd ui && npm run dev -- --host 0.0.0.0

dev:
	@printf '%s\n' 'Run these targets in separate terminals: make migrate, make backend, make worker, make beat, make ui'

ollama-pull:
	$(PYTHON) scripts/pull_ollama.py $(OLLAMA_CHAT_MODEL) $(OLLAMA_EMBEDDING_MODEL)

docker-up:
	docker compose up --build -d --remove-orphans

docker-up-openai:
	LLM_PROVIDER=openai docker compose up --build -d --remove-orphans postgres redis qdrant backend worker beat ui

docker-up-host-ollama:
	OLLAMA_HOST_DOCKER=http://host.docker.internal:11434 docker compose up --build -d --remove-orphans postgres redis qdrant backend worker beat ui

docker-migrate:
	docker compose exec backend python -m alembic upgrade head

docker-down:
	docker compose down

docker-logs:
	docker compose logs -f