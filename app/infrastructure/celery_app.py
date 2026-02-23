from celery import Celery

from app.core.config import settings

celery_app = Celery(
    "novaacademy",
    broker=settings.CELERY_BROKER,
    backend=settings.CELERY_BACKEND,
)


celery_app.conf.beat_schedule = {
    "retry-pending-documents": {
        "task": "retry_pending_documents",
        "schedule": 5 * 60,  # every 5 minutes
    },
}