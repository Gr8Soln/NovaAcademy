from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from app.api.v1.ai_router import router as ai_router
from app.api.analytics.analytics_router import router as analytics_router
from app.api.auth.auth_router import router as auth_router
from app.api.challenges.challenges_router import router as challenges_router
from app.api.dashboard.dashboard_router import router as dashboard_router
from app.api.documents.documents_router import router as documents_router
from app.api.leaderboard.leaderboard_router import router as leaderboard_router
from app.api.notifications.notifications_router import router as notifications_router
from app.api.points.points_router import router as points_router
from app.api.quizzes.quizzes_router import router as quizzes_router
from app.api.study_sessions.study_sessions_router import router as study_sessions_router
from app.api.users.users_router import router as users_router
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
app.include_router(notifications_router, prefix=settings.API_PREFIX)
app.include_router(challenges_router, prefix=settings.API_PREFIX)
app.include_router(points_router, prefix=settings.API_PREFIX)
app.include_router(leaderboard_router, prefix=settings.API_PREFIX)
app.include_router(study_sessions_router, prefix=settings.API_PREFIX)
app.include_router(analytics_router, prefix=settings.API_PREFIX)




# ── Exception handlers ─────────────────────────────────────────

# @app.exception_handler(RequestValidationError)
# async def validation_exception_handler(request: Request, exc: RequestValidationError):
#     """Handle Pydantic validation errors with structured JSON response."""
#     errors = exc.errors()
#     # Extract meaningful error messages
#     error_messages = []
#     for error in errors:
#         field = " -> ".join(str(loc) for loc in error["loc"] if loc != "body")
#         message = error["msg"]
#         error_messages.append(f"{field}: {message}")
    
#     detail = "; ".join(error_messages) if error_messages else "Validation error"
#     response = success_response(ResponseStatus.FAILED, detail)
#     return JSONResponse(status_code=422, content=jsonable_encoder(response))



# ── Health check ────────────────────────────────────────────────

@app.get("/api/health")
async def health():
    return {"status": "ok", "app": settings.APP_NAME}


# ── Serve React SPA (production) ───────────────────────────────

UI_BUILD_DIR = Path(__file__).resolve().parent.parent.parent / "ui" / "dist"

if UI_BUILD_DIR.is_dir():
    app.mount("/", StaticFiles(directory=str(UI_BUILD_DIR), html=True), name="spa")
