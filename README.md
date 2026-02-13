# Gr8Academy 🎓

AI-powered personalized study platform — upload your study materials and learn with an AI tutor.

## Architecture

**Clean Architecture (Uncle Bob)** with strict dependency flow:

```
Infrastructure → Interfaces → Use Cases → Domain
```

| Layer              | Purpose                                                    | Location                  |
| ------------------ | ---------------------------------------------------------- | ------------------------- |
| **Domain**         | Pure entities, value objects, exceptions                   | `app/domain/`         |
| **Use Cases**      | Business rules orchestration                               | `app/use_cases/`      |
| **Interfaces**     | Abstract contracts (repositories, services)                | `app/interfaces/`     |
| **Infrastructure** | Concrete implementations (Postgres, Redis, Qdrant, OpenAI) | `app/infrastructure/` |
| **API**            | FastAPI routers                                            | `app/api/`            |
| **Core**           | Config, DI container, DB/Redis/Vector init                 | `app/core/`           |

### Swapping Providers

Change only `app/core/dependencies.py` to replace any provider:

- **LLM**: OpenAI → Ollama/Llama3 (change `OpenAILLMService` → your impl)
- **Vector DB**: Qdrant → Pinecone (implement `IVectorRepository`)
- **Database**: Postgres → MySQL (implement repository interfaces)

## Tech Stack

- **Backend**: FastAPI, SQLAlchemy (async), Pydantic v2, Redis, Qdrant
- **Frontend**: React 19, TypeScript, Vite, TailwindCSS, TanStack Query, Zustand
- **AI**: OpenAI GPT-4.1 (or compatible), RAG pipeline, SSE streaming
- **Infra**: Docker, PostgreSQL, Redis, Qdrant

## Quick Start

### Docker (recommended)

```bash
# 1. Copy and configure env
cp .env.example .env
# Edit .env with your OPENAI_API_KEY, SECRET_KEY, etc.

# 2. Start everything
docker compose up -d

# 3. Run database migrations
docker compose exec backend alembic upgrade head

# 4. Open the app
# UI: http://localhost:3000
# API docs: http://localhost:8000/api/docs
```

### Local Development

```bash
# Backend
cd gr8academy
python -m venv .venv
.venv\Scripts\activate        # Windows
pip install -r requirements.txt
set PYTHONPATH=app             # Windows
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# Frontend
cd ui
npm install
npm run dev
```

### Database Migrations

```bash
# Generate a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head
```

## Project Structure

```
gr8academy/
├── app/
│   ├── domain/           # Pure entities, exceptions
│   ├── use_cases/        # Auth, Documents, AI, Student
│   ├── interfaces/       # Abstract repositories & services
│   ├── infrastructure/   # Postgres, Qdrant, OpenAI, Redis, JWT
│   ├── api/              # FastAPI routers
│   ├── core/             # Config, DI, DB/Redis/Vector init
│   ├── schemas/          # Pydantic request/response models
│   ├── utils/            # SSE helpers
│   └── main.py           # FastAPI app entry point
├── ui/                   # React + Vite + TailwindCSS
├── alembic/              # Database migrations
├── docker-compose.yml
├── requirements.txt
└── pyproject.toml
```

## API Endpoints

| Method | Path                          | Description                   |
| ------ | ----------------------------- | ----------------------------- |
| POST   | `/api/v1/auth/register`       | Register with email/password  |
| POST   | `/api/v1/auth/login`          | Login                         |
| POST   | `/api/v1/auth/google`         | Google OAuth login            |
| POST   | `/api/v1/auth/refresh`        | Refresh access token          |
| GET    | `/api/v1/users/me`            | Get current user              |
| POST   | `/api/v1/documents/`          | Upload document               |
| GET    | `/api/v1/documents/`          | List documents                |
| GET    | `/api/v1/documents/{id}`      | Get document                  |
| POST   | `/api/v1/ai/ask`              | RAG Q&A (SSE stream)          |
| POST   | `/api/v1/ai/summary`          | Generate summary (SSE stream) |
| POST   | `/api/v1/ai/quiz`             | Generate quiz                 |
| POST   | `/api/v1/ai/flashcards`       | Generate flashcards           |
| GET    | `/api/v1/quizzes/`            | List quizzes                  |
| POST   | `/api/v1/quizzes/{id}/submit` | Submit quiz answers           |
| GET    | `/api/v1/dashboard/`          | Get dashboard data            |

## License

MIT
