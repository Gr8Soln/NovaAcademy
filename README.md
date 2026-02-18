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

## Getting Started

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

### 4. Run

```bash
# Backend — starts on http://localhost:8000
python app/main.py

# Frontend — starts on http://localhost:5173
cd ui && npm run dev
```

API docs available at **http://localhost:8000/api/v1/docs**.

---

## Docker

Spin up the full stack (backend, frontend, Postgres, Redis, Qdrant):

```bash
docker compose up --build
```

| Service     | Port |
| ----------- | ---- |
| Backend API | 8000 |
| Frontend    | 3000 |
| PostgreSQL  | 5432 |
| Redis       | 6379 |
| Qdrant      | 6333 |

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
