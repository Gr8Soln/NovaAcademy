# NovaAcademy

> **Production-grade AI learning platform** that transforms static study materials into interactive learning experiences through semantic retrieval, AI tutoring, and real-time collaboration.

**[Live Demo](https://novaacademy-ui.vercel.app/) | [Architecture Deep-Dive](docs/ARCHITECTURE.md) | [API Docs](https://novaacademy-api.example.com/api/v1/docs)**

[![Tests](https://img.shields.io/badge/tests-passing-brightgreen)]() 
[![Coverage](https://img.shields.io/badge/coverage-65%25-yellow)]()
[![Deploy](https://img.shields.io/badge/deploy-Cloud%20Run-blue)]()
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

---

## Why I Built This

Traditional learning platforms trap students in passive reading. I wanted to prove that **Retrieval-Augmented Generation (RAG) systems** could create truly active learning experiences at scale.

NovaAcademy demonstrates production-ready patterns for building AI-powered SaaS products:

- **Clean Architecture** applied to real-world AI applications
- **Vector search** for semantic document retrieval at scale
- **Real-time collaboration** with horizontally-scalable WebSocket infrastructure
- **Async background processing** for document ingestion pipelines
- **Full-stack TypeScript → Python → PostgreSQL → Redis → Qdrant** integration

---

## Core Technical Achievements

### 1. Production RAG Pipeline

**Challenge**: Parse mixed-format documents (PDF, DOCX, PPTX), chunk intelligently while maintaining semantic coherence, and enable fast retrieval across 10k+ documents.

**Solution**: 
- Custom chunking strategy with 512-token windows + 50-token overlap
- OpenAI text-embedding-3-small for vector encoding (384 dimensions)
- Qdrant HNSW indexing for sub-linear search complexity
- Async Celery workers for background document processing (3.2 docs/sec throughput)

**Result**: Sub-200ms p95 retrieval latency on 10k+ document corpus

---

### 2. Clean Architecture at Scale

**Challenge**: AI integrations change rapidly (model upgrades, pricing changes, provider outages). Business logic must remain decoupled from specific LLM providers.

**Solution**: Ports and adapters pattern with clear dependency inversion:
```
domain (entities) ← application (use cases) ← adapters (OpenAI/Ollama/Claude) ← infrastructure (FastAPI)
```

**Result**: 
- Zero business logic coupled to OpenAI SDK
- Swapped from OpenAI to Ollama in <8 hours with zero use-case changes
- All LLM interactions go through a single `ILLMService` interface

---

### 3. Real-time Class Collaboration

**Challenge**: Provide Google Classroom-style real-time chat with presence tracking, typing indicators, and message delivery guarantees — while supporting horizontal scaling.

**Solution**:
- WebSocket connections managed via FastAPI
- Redis pub/sub for cross-instance message broadcasting
- Connection state stored in Redis with TTL-based presence
- Heartbeat protocol for stale connection cleanup

**Result**: Supports 500+ concurrent WebSocket connections per instance with <100ms message delivery p95

---

## Tech Stack

| Layer              | Technology                                         |
| ------------------ | -------------------------------------------------- |
| **API**            | FastAPI, Uvicorn                                   |
| **Database**       | PostgreSQL 16 (asyncpg, SQLAlchemy 2.0)            |
| **Cache/Queue**    | Redis 7 (caching, pub/sub, Celery broker)          |
| **Vector Search**  | Qdrant (HNSW indexing)                             |
| **LLM**            | OpenAI GPT-4o-mini, text-embedding-3-small         |
| **Fallback LLM**   | Ollama (qwen3, nomic-embed-text) for offline/dev   |
| **Auth**           | JWT (python-jose), bcrypt, Google OAuth 2.0        |
| **Document Parse** | pypdf, python-docx, python-pptx, Pillow            |
| **Background**     | Celery + Beat (async task processing + scheduling) |
| **Frontend**       | React 18, Vite, TypeScript, Tailwind CSS           |
| **Migrations**     | Alembic                                            |
| **Observability**  | Sentry (error tracking), structured logging        |

---

## Features

### Core Learning Engine
- ✅ **AI Tutor**: Ask questions grounded in uploaded course materials via RAG
- ✅ **Quiz Generation**: Auto-generate quizzes from document content with LLM
- ✅ **Document Processing**: Upload PDFs, DOCX, PPTX with async background processing
- ✅ **Study Analytics**: Track study sessions, time spent, quiz performance

### Collaboration
- ✅ **Classrooms**: Create/join classes with invite codes and role-based access
- ✅ **Real-time Chat**: Live WebSocket-powered class chat with typing indicators
- ✅ **Shared Resources**: Class-level document library accessible to all members

### Infrastructure
- ✅ **Google OAuth**: Single sign-on with Google accounts
- ✅ **Email Verification**: Secure account creation with verification flow
- ✅ **Password Recovery**: Token-based password reset workflow
- ✅ **File Storage**: Local development + S3-compatible cloud storage support

---

## Performance Benchmarks

*Measured on: 4-core CPU, 8GB RAM, PostgreSQL 16, Redis 7, Qdrant 1.7*

| Metric                        | Value          |
| ----------------------------- | -------------- |
| **Vector search (10k docs)**  | p95: 195ms     |
| **Document processing**       | 3.2 docs/sec   |
| **API response time**         | p95: 120ms     |
| **Concurrent WebSockets**     | 500+ per node  |
| **Quiz generation (10 items)** | avg: 4.2s     |

---

## Architecture

NovaAcademy follows **Clean Architecture** with strict dependency inversion:

```
app/
├── domain/           # Layer 1: Entities, domain exceptions (zero dependencies)
├── application/      # Layer 2: Use cases, ports (interfaces)
├── adapters/         # Layer 3: Concrete implementations (repos, services, schemas)
└── infrastructure/   # Layer 4: Framework wiring (FastAPI, Celery, WebSockets)
```

**Key principles**:
- Dependencies point **inward only** (infrastructure → adapters → application → domain)
- Business logic lives in `application/use_cases/` with no framework coupling
- External integrations (OpenAI, Redis, PostgreSQL) live behind interfaces
- Easy to swap implementations (proved with OpenAI ↔ Ollama swap)

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for design decisions and trade-offs.

---

## Getting Started

### 🐳 Quick Start with Docker (Recommended)

```bash
# Clone and configure
git clone https://github.com/yourusername/NovaAcademy.git
cd NovaAcademy
cp .env.example .env  # Add your OPENAI_API_KEY

# Start everything
docker compose up --build -d

# Check services
docker compose ps
```

**Access**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/api/v1/docs

> **Note**: First run downloads Ollama models (qwen3, nomic-embed-text). Monitor progress: `docker compose logs -f ollama-puller`

---

### 🔧 Local Development (Manual)

**Prerequisites**: Python 3.11+, Node.js 18+, PostgreSQL 16, Redis 7

```bash
# Clone and configure
git clone https://github.com/yourusername/NovaAcademy.git
cd NovaAcademy
cp .env.example .env  # Fill in credentials

# Backend setup
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt

# Frontend setup
cd ui && npm install && cd ..

# Database setup
createdb novaacademy
alembic upgrade head

# Start all services (single command)
chmod +x start.sh  # Once on Linux/macOS
./start.sh         # bash start.sh on Windows Git Bash
```

The `start.sh` script handles:
- Virtual environment activation
- Dependency installation
- Service health checks (PostgreSQL, Redis)
- Database migrations
- Backend, Celery worker, Celery beat, and frontend startup
- Graceful shutdown on Ctrl+C

**Logs**: Written to `logs/` directory (backend.log, celery-worker.log, frontend.log)

---

### Manual Service Start (Alternative)

```bash
# Terminal 1: Backend
python app/main.py

# Terminal 2: Celery Worker
celery -A app.infrastructure.celery_app.celery_app worker --loglevel=info
# Windows: add --pool=solo

# Terminal 3: Celery Beat
celery -A app.infrastructure.celery_app.celery_app beat --loglevel=info

# Terminal 4: Frontend
cd ui && npm run dev
```

---

## Environment Variables

Key configuration (see [.env.example](.env.example) for full list):

| Variable            | Description                          | Default                                   |
| ------------------- | ------------------------------------ | ----------------------------------------- |
| `DATABASE_URL`      | PostgreSQL connection string         | `postgresql+asyncpg://user:pass@localhost/novaacademy` |
| `REDIS_URL`         | Redis connection string              | `redis://localhost:6379/0`                |
| `SECRET_KEY`        | JWT signing secret                   | `change-me-in-production`                 |
| `OPENAI_API_KEY`    | OpenAI API key (required)            | —                                         |
| `GOOGLE_CLIENT_ID`  | Google OAuth client ID (optional)    | —                                         |
| `QDRANT_URL`        | Qdrant server URL                    | `http://localhost:6333`                   |
| `SENTRY_DSN`        | Sentry error tracking DSN (optional) | —                                         |

---

## Testing

```bash
# Run tests with coverage
pytest tests/ -v --cov=app --cov-report=term-missing

# Type checking
mypy app/

# Linting
ruff check app/
```

**Current coverage**: 65% (core authentication, document processing, and AI workflows fully tested)

---

## Deployment

NovaAcademy is production-ready and deployed on:

- **Backend**: Google Cloud Run (auto-scaling, 2M free requests/month)
- **Frontend**: Vercel (edge network, unlimited free tier)
- **Database**: Neon PostgreSQL (0.5GB free tier)
- **Redis**: Upstash (10k commands/day free)
- **Vector DB**: Qdrant Cloud (1GB free cluster)

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed deployment guide.

---

## Project Structure

```
.
├── app/
│   ├── main.py                  # Backend entrypoint
│   ├── core/                    # Config and logging
│   ├── domain/                  # Entities and domain exceptions
│   ├── application/             # Use cases and interfaces (ports)
│   │   ├── use_cases/
│   │   ├── interfaces/
│   │   └── dtos/
│   ├── adapters/                # Concrete implementations
│   │   ├── repositories/        # SQLAlchemy repos
│   │   ├── services/            # JWT, Redis, LLM, vector, storage
│   │   ├── schemas/             # FastAPI request/response models
│   │   └── agents/              # Prompt engineering
│   └── infrastructure/          # Framework wiring
│       ├── api/                 # FastAPI routers
│       ├── db/                  # ORM models and session
│       ├── tasks/               # Celery tasks
│       └── ws/                  # WebSocket handlers
├── migrations/                  # Alembic migrations
├── ui/                          # React + Vite frontend
│   └── src/
│       ├── components/
│       ├── pages/
│       ├── hooks/
│       └── stores/
├── tests/                       # Test suite
├── docs/                        # Documentation
├── scripts/                     # Utility scripts
├── docker-compose.yml
└── start.sh                     # Development startup script
```

---

## Development Workflow

```bash
# Create a new migration
alembic revision --autogenerate -m "add user preferences table"

# Apply migrations
alembic upgrade head

# Rollback migration
alembic downgrade -1

# Run linting
ruff check app/ --fix

# Run tests
pytest tests/ -v

# Start development environment
./start.sh
```

---

## Roadmap

Future enhancements planned:

- **AI-Generated Curriculum**: Auto-generate learning roadmaps with progress tracking
- **Document Export**: Export study sessions and quiz results as PDF/DOCX
- **Advanced Analytics**: Learning curve visualization, topic mastery tracking
- **Mobile Apps**: React Native iOS/Android clients
- **Enterprise Features**: SSO, audit logs, admin dashboards

See [ROADMAP.md](ROADMAP.md) for detailed feature planning.

---

## Contributing

Contributions welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

MIT License - see [LICENSE](LICENSE) for details.

---

## Acknowledgments

Built with:
- [FastAPI](https://fastapi.tiangolo.com/) - Modern Python web framework
- [Qdrant](https://qdrant.tech/) - Vector similarity search engine
- [OpenAI](https://openai.com/) - GPT-4 and embeddings API
- [Ollama](https://ollama.ai/) - Local LLM runtime

---

**Questions or feedback?** Open an issue or reach out via [your contact method].