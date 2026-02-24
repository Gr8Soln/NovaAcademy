from celery import Celery
from celery.schedules import crontab

from app.core.config import settings

celery_app = Celery(
    "novaacademy",
    broker=settings.CELERY_BROKER,
    backend=settings.CELERY_BACKEND,
)

# Periodic function
celery_app.conf.beat_schedule = {
    "process-pending-documents": {
        "task": "process-pending-documents",
        "schedule": crontab(minute='*/5'),
    },
}

# Celery Configuration
celery_app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes
    task_soft_time_limit=25 * 60,  # 25 minutes
    worker_prefetch_multiplier=4,
    worker_max_tasks_per_child=1000,
)

celery_app.autodiscover_tasks(['app.infrastructure.tasks'])
