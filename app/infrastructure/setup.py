from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, HTTPException, Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.adapters.schemas.response_schema import error_response
from app.core.config import settings
from app.core.logging import get_logger
from app.infrastructure.api.routes.auth_router import router as auth_router

logger = get_logger(__name__)


# ── Lifespan ────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(_: FastAPI):
    """Startup / shutdown lifecycle hook."""
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(parents=True, exist_ok=True)
    logger.info("App started")
    yield
    logger.info("App shutdown complete")


def create_app() -> FastAPI:
    """Build and return a fully-configured FastAPI application."""

    app = FastAPI(
        title=settings.APP_NAME,
        version="0.1.0",
        lifespan=lifespan,
        docs_url=f"{settings.API_PREFIX}/docs",
        redoc_url=f"{settings.API_PREFIX}/redoc",
        openapi_url=f"{settings.API_PREFIX}/openapi.json",
    )

    # ── Middleware ───────────────────────────────────────────────

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # ── Exception handlers ──────────────────────────────────────

    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(
        request: Request, exc: RequestValidationError
    ):
        errors = exc.errors()
        error_messages = []
        for error in errors:
            field = " -> ".join(
                str(loc) for loc in error["loc"] if loc != "body"
            )
            message = error["msg"]
            error_messages.append(f"{field}: {message}")

        detail = "; ".join(error_messages) if error_messages else "Validation error"
        response = error_response(detail)
        return JSONResponse(status_code=422, content=jsonable_encoder(response))

    @app.exception_handler(HTTPException)
    async def http_exception_handler(request: Request, exc: HTTPException):
        response = error_response(exc.detail)
        return JSONResponse(
            status_code=exc.status_code, content=jsonable_encoder(response)
        )

    @app.exception_handler(Exception)
    async def general_exception_handler(request: Request, exc: Exception):
        logger.error(f"Unexpected error: {exc!s}")
        response = error_response(
            "An unexpected error occurred. Please try again later."
        )
        return JSONResponse(status_code=500, content=jsonable_encoder(response))

    # ── Routes ──────────────────────────────────────────────────

    app.include_router(auth_router, prefix=settings.API_PREFIX)

    @app.get(f"{settings.API_PREFIX}/health")
    async def health():
        return {"status": "ok", "app": settings.APP_NAME}


    return app

    
