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
app/
├── domain/                  # Layer 1 — Entities & business rules
│   ├── entities/            # Pure dataclasses (User, Document, Quiz …)
│   └── exceptions/          # Domain exceptions (no framework deps)
│
├── application/             # Layer 2 — Use cases & ports
│   ├── use_cases/           # Application logic (RegisterUseCase …)
│   ├── interfaces/          # Abstract ports (IUserRepository, IAuthService …)
│   └── dtos/                # Data transfer objects
│
├── adapters/                # Layer 3 — Interface adapters
│   ├── repositories/        # Concrete repo implementations (SQLAlchemy)
│   ├── gateways/            # External service adapters (Stripe, Paystack)
│   ├── schemas/             # Pydantic request/response schemas
│   └── services/            # Service implementations (JWT, cache …)
│
├── infrastructure/          # Layer 4 — Frameworks & drivers
│   ├── api/
│   │   ├── routes/          # FastAPI routers
│   │   └── dependencies.py  # Dependency injection wiring
│   ├── db/
│   │   ├── base.py          # SQLAlchemy DeclarativeBase
│   │   ├── models/          # ORM models
│   │   ├── mapper.py        # Entity ↔ Model mappers
│   │   └── session.py       # Async session factory
│   └── setup.py             # App factory (create_app)
│
├── core/                    # Shared config & logging
│   ├── config.py            # pydantic-settings (reads .env)
│   └── logging.py           # Loguru setup
│
└── main.py                  # Entry point
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
| Service        | URL / Port               | Description                      |
| -------------- | ------------------------ | -------------------------------- |
| **Frontend**   | `http://localhost:3000`  | Main Web Application            |
| **Backend API**| `http://localhost:8000`  | API Root & WebSockets           |
| **API Docs**   | `http://localhost:8000/api/v1/docs` | Swagger UI (Interactive Docs) |
| **PostgreSQL** | `localhost:5432`         | Local Database Access           |
| **Ollama**     | `localhost:11434`        | Local LLM API                   |

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

### 4. Celery (worker & beat)

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

### 5. Run

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
