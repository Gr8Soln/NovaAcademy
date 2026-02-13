from __future__ import annotations

from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.api.ai.router import router as ai_router
from app.api.analytics.router import router as analytics_router
from app.api.auth.router import router as auth_router
from app.api.challenges.router import router as challenges_router
from app.api.dashboard.router import router as dashboard_router
from app.api.documents.router import router as documents_router
from app.api.leaderboard.router import router as leaderboard_router
from app.api.notifications.router import router as notifications_router
from app.api.points.router import router as points_router
from app.api.posts.router import router as posts_router
from app.api.quizzes.router import router as quizzes_router
from app.api.social.router import router as social_router
from app.api.study_sessions.router import router as study_sessions_router
from app.api.users.router import router as users_router
from app.core.config import settings

# ── API routers ─────────────────────────────────────────────────



@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    yield
    # Shutdown — close connections if needed


app = FastAPI(
    title=settings.APP_NAME,
    version="0.1.0",
    lifespan=lifespan,
    docs_url="/api/v1/docs",
    redoc_url="/api/v1/redoc",
    openapi_url="/api/v1/openapi.json",
)

# ── CORS ────────────────────────────────────────────────────────

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── API routes ──────────────────────────────────────────────────

app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(documents_router, prefix=settings.API_PREFIX)
app.include_router(ai_router, prefix=settings.API_PREFIX)
app.include_router(quizzes_router, prefix=settings.API_PREFIX)
app.include_router(dashboard_router, prefix=settings.API_PREFIX)
app.include_router(social_router, prefix=settings.API_PREFIX)
app.include_router(posts_router, prefix=settings.API_PREFIX)
app.include_router(notifications_router, prefix=settings.API_PREFIX)
app.include_router(challenges_router, prefix=settings.API_PREFIX)
app.include_router(points_router, prefix=settings.API_PREFIX)
app.include_router(leaderboard_router, prefix=settings.API_PREFIX)
app.include_router(study_sessions_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)


# ── Health check ────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}


# ── Serve React SPA (production) ───────────────────────────────

UI_BUILD_DIR = Path(__file__).resolve().parent.parent.parent / "ui" / "dist"

if UI_BUILD_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(UI_BUILD_DIR), html=True), name="spa")
