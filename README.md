# NovaAcademy

AI-powered personalized study platform. Upload documents, generate quizzes and flashcards, track progress, challenge friends, and climb leaderboards — all driven by LLMs and vector search.

---

## Tech Stack

| Layer               | Technology                                    |
| ------------------- | --------------------------------------------- |
| API                 | FastAPI, Uvicorn                              |
| Database            | PostgreSQL 16 (asyncpg, SQLAlchemy 2.0)       |
| Cache / Leaderboard | Redis 7                                       |
| Vector Search       | Qdrant                                        |
| LLM                 | OpenAI (GPT-4.1, text-embedding-3-small)      |
| Auth                | JWT (python-jose), bcrypt, Google OAuth       |
| Document Parsing    | pypdf, python-docx, python-pptx, Pillow (OCR) |
| Frontend            | React, Vite, Tailwind CSS                     |
| Migrations          | Alembic                                       |

---

## Project Structure

```
.
├── app/
│   ├── main.py                         # Backend entrypoint (uvicorn)
│   ├── core/                           # Shared app config and logging
│   │   ├── config.py
│   │   └── logging.py
│   ├── domain/                         # Layer 1: entities and domain exceptions
│   │   ├── entities/
│   │   └── exceptions/
│   ├── application/                    # Layer 2: use-cases and interfaces (ports)
│   │   ├── use_cases/
│   │   ├── interfaces/
│   │   └── dtos/
│   ├── adapters/                       # Layer 3: concrete implementations
│   │   ├── agents/                     # Prompt and agent orchestration adapters
│   │   │   ├── prompt_service.py
│   │   │   └── prompts/
│   │   ├── repositories/               # SQLAlchemy repository implementations
│   │   ├── gateways/                   # Third-party payment adapters
│   │   │   ├── stripe_gateway.py
│   │   │   └── paystack_gateway.py
│   │   ├── schemas/                    # FastAPI request/response schemas
│   │   └── services/                   # JWT, Redis, email, storage, LLM, vector services
│   └── infrastructure/                 # Layer 4: framework/drivers
│       ├── setup.py                    # FastAPI app factory (create_app)
│       ├── celery_app.py               # Celery app + beat schedule
│       ├── api/                        # Routers and DI wiring
│       ├── db/                         # ORM models, mappers, session, migrations
│       ├── tasks/                      # Celery task modules
│       └── ws/                         # WebSocket handlers
├── migrations/                         # Alembic env and revision history
├── templates/                          # HTML email templates
├── uploads/                            # User-uploaded document storage (local dev)
├── logs/                               # Application/runtime logs
├── scripts/                            # Utility scripts (bootstrap, setup helpers)
├── nginx/                              # Backend/infra nginx configs
├── ui/                                 # React + Vite frontend
│   ├── package.json
│   ├── vite.config.ts
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   ├── index.html
│   ├── public/                         # Static assets copied as-is
│   └── src/
│       ├── main.tsx                    # React app mount
│       ├── App.tsx                     # Root app shell
│       ├── index.css                   # Global styles + Tailwind imports
│       ├── components/                 # Reusable UI components
│       ├── pages/                      # Route-level screens
│       ├── hooks/                      # Reusable React hooks
│       ├── stores/                     # Client state stores (zustand)
│       ├── lib/                        # Shared frontend utilities
│       ├── styles/                     # Additional style modules/tokens
│       └── types/                      # Frontend TS types
├── docker-compose.yml
├── Dockerfile.be
├── Dockerfile.ui
├── pyproject.toml
├── requirements.txt
└── README.md
```

Dependencies point **inward**: infrastructure → adapters → application → domain.

---

## 🐳 Running with Docker (Recommended)

The easiest way to get NovaAcademy running is via **Docker Compose**. This will start the frontend, backend, AI models, and all necessary databases with a single command.

### 1. Prerequisites

- [Docker](https://docs.docker.com/get-docker/) and [Docker Compose](https://docs.docker.com/compose/install/)

### 2. Launch the Stack

```bash
# Clone the repository
git clone <repo-url> && cd NovaAcademy

# Create environment file and fill in your secrets
cp .env.example .env

# Start everything
docker compose up --build -d
```

### 3. Service Access

| Service         | URL / Port                          | Description                   |
| --------------- | ----------------------------------- | ----------------------------- |
| **Frontend**    | `http://localhost:3000`             | Main Web Application          |
| **Backend API** | `http://localhost:8000`             | API Root & WebSockets         |
| **API Docs**    | `http://localhost:8000/api/v1/docs` | Swagger UI (Interactive Docs) |
| **PostgreSQL**  | `localhost:5432`                    | Local Database Access         |
| **Ollama**      | `localhost:11434`                   | Local LLM API                 |

> [!NOTE]
> On the first run, the `ollama-puller` service will take a few minutes to download the required models (`qwen3` and `nomic-embed-text`). You can monitor progress with: `docker compose logs -f ollama-puller`.

---

## 🔧 Manual Setup (Development)

### Prerequisites

- Python 3.11+
- PostgreSQL 16
- Redis 7
- Qdrant (optional — needed for document Q&A)
- Node.js 18+ (for the frontend)

### 1. Clone & configure

```bash
git clone <repo-url> && cd NovaAcademy
cp .env.example .env
# Edit .env with your database credentials, API keys, etc.
```

### 2. Install dependencies

```bash
# Backend (using uv)
uv sync

# Frontend
cd ui && npm install
```

### 3. Set up the database

```bash
# Create the database
createdb novaacademy

# Run migrations
alembic upgrade head
```

### 4. Start everything with script (recommended for local non-Docker)

You can start backend, frontend, Celery worker, and Celery beat with one command:

```bash
# From project root
chmod +x start.sh   # run once (Linux/macOS)
./start.sh
```

For Git Bash on Windows:

```bash
bash start.sh
```

The script will:

- Load variables from `.env`
- Set up and activate `.venv`
- Install backend and frontend dependencies
- Run migrations
- Start backend, Celery worker, Celery beat, and frontend

Press `Ctrl+C` to stop all services.

### 5. Start services manually (alternative)

If you prefer starting services individually, use the commands below.

#### Celery (worker & beat)

Assumptions:

- Redis is available at REDIS_URL (e.g. redis://localhost:6379/0)
- Celery app is defined in `app/infrastructure/celery_app.py` or your project entry (adjust `-A` accordingly)

Start worker

```bash
celery -A app.infrastructure.celery_app.celery_app worker --loglevel=info

# For Windows (no multiprocessing):
celery -A app.infrastructure.celery_app.celery_app worker --pool=solo --loglevel=info
```

Start beat (scheduler)

```bash
celery -A app.infrastructure.celery_app.celery_app beat --loglevel=info
```

---

#### Backend + Frontend

```bash
# Backend — starts on http://localhost:8000
python app/main.py

# Frontend — starts on http://localhost:5173
cd ui && npm run dev
```

API docs available at **http://localhost:8000/api/v1/docs**.

---

## Environment Variables

See [.env.example](.env.example) for all available options. Key variables:

| Variable           | Description                                   | Default                                                          |
| ------------------ | --------------------------------------------- | ---------------------------------------------------------------- |
| `DATABASE_URL`     | PostgreSQL connection string                  | `postgresql+asyncpg://postgres:admin@localhost:5432/novaacademy` |
| `REDIS_URL`        | Redis connection string                       | `redis://localhost:6379/0`                                       |
| `SECRET_KEY`       | JWT signing key                               | `change-me-in-production`                                        |
| `OPENAI_API_KEY`   | OpenAI API key (for Q&A, quizzes, flashcards) | —                                                                |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional)             | —                                                                |

---

## Development

```bash
# Lint
ruff check app/

# Type check
mypy app/

# Tests
pytest

# Create a migration
alembic revision --autogenerate -m "description"
```

---

## License

MIT
