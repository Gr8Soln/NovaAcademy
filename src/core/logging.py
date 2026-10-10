import os
import sys

from loguru import logger

from app.core.config import settings

# -----------------------------------------------------------
# Global Loguru configuration
# -----------------------------------------------------------

LOG_DIR = settings.LOG_DIR.lower()
os.makedirs(LOG_DIR, exist_ok=True)

# Remove any pre-existing handlers
logger.remove()

# Determine environment mode
IS_PRODUCTION = settings.ENV.lower() == "production"

# ------------------ FORMAT DEFINITIONS ---------------------
DEV_FORMAT = (
    "<green>{time:YYYY-MM-DD HH:mm:ss.SSS}</green> | "
    "<level>{level: <8}</level> | "
    "<cyan>{name}</cyan>:<cyan>{function}</cyan>:<cyan>{line}</cyan> - "
    "<level>{message}</level>"
)

PROD_FORMAT = (
    "{time:YYYY-MM-DDTHH:mm:ss.SSSZ} | "
    "{level} | "
    "{name}:{function}:{line} - {message}"
)

# ------------------ HANDLER CONFIG --------------------------
# Console output (colored + emoji for dev, plain for prod)
logger.add(
    sys.stdout,
    colorize=not IS_PRODUCTION,
    format=DEV_FORMAT if not IS_PRODUCTION else PROD_FORMAT,
    enqueue=True,           # multiprocess safe
    backtrace=not IS_PRODUCTION,
    diagnose=not IS_PRODUCTION,
)

# File output (rotating)
logger.add(
    f"{LOG_DIR}/backend.log",
    rotation="20 MB",        # rotate every 20MB
    retention="14 days",     # keep 14 days of logs
    compression="zip",       # compress old logs
    enqueue=True,
    colorize=False,
    serialize=IS_PRODUCTION, # JSON logs in production
    format=PROD_FORMAT,
)

# -----------------------------------------------------------
# Stdlib / Uvicorn / Celery integration
# -----------------------------------------------------------

import logging


class InterceptHandler(logging.Handler):
    """Redirect standard logging messages (e.g. from Uvicorn, Celery) into Loguru."""

    def emit(self, record: logging.LogRecord):
        try:
            level = logger.level(record.levelname).name
        except ValueError:
            level = record.levelno
        frame, depth = logging.currentframe(), 2
        while frame and frame.f_code.co_filename == logging.__file__:
            frame = frame.f_back
            depth += 1
        logger.opt(depth=depth, exception=record.exc_info).log(level, record.getMessage())


# Replace root handlers
logging.basicConfig(handlers=[InterceptHandler()], level=0, force=True)

for noisy_logger in ["uvicorn", "uvicorn.error", "uvicorn.access", "celery", "sqlalchemy"]:
    logging.getLogger(noisy_logger).handlers = [InterceptHandler()]
    logging.getLogger(noisy_logger).propagate = False


# -----------------------------------------------------------
# Public helper
# -----------------------------------------------------------

def get_logger(service: str = "main"):
    """
    Returns a Loguru logger instance bound to the given service context.
    Use this everywhere instead of logging.getLogger().
    """
    return logger.bind(service=service)
