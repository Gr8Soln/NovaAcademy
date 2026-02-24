import asyncio
from uuid import UUID

from celery import Task
from sqlalchemy.ext.asyncio import (AsyncSession, async_sessionmaker,
                                    create_async_engine)

from app.adapters.repositories import SQLDocumentRepository
from app.adapters.services.document_extractor import DocumentExtractor
from app.adapters.services.local_storage import LocalStorage
from app.adapters.services.ollama_embedder import OllamaEmbedder
from app.adapters.services.qdrant_vector import QdrantVector
from app.application.use_cases.document_usecases import ProcessDocumentUseCase
from app.core.config import settings
from app.core.logging import get_logger
from app.infrastructure.celery_app import celery_app

logger = get_logger(__name__)


async def _create_session() -> tuple:
    """Create a short-lived engine + session for use inside Celery tasks.
    Returns (engine, session) so the caller can dispose the engine before
    the event loop created by asyncio.run() is closed."""
    engine = create_async_engine(
        settings.DATABASE_URL, echo=settings.DEBUG, pool_pre_ping=True
    )
    factory = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    session = factory()
    return engine, session


# ===== Celery Task =========================

@celery_app.task(name="process_document", bind=True, max_retries=3)
def process_document(self: Task, document_id: str) -> None:
    asyncio.run(_process_document(document_id))


async def _process_document(document_id: str) -> None:
    engine, session = await _create_session()
    try:
        async with session:
            repo = SQLDocumentRepository(session)
            document = await repo.get_any_by_id(UUID(document_id))
            
            if not document:
                logger.error(f"Document {document_id} not found.")
                return

            use_case = ProcessDocumentUseCase(
                document_repo=repo,
                extractor=DocumentExtractor(),
                storage=LocalStorage(
                    base_url=settings.BASE_URL,
                    upload_dir=settings.UPLOAD_DIR,    
                ),
                embedder=OllamaEmbedder(
                    host=settings.OLLAMA_HOST,
                    model=settings.OLLAMA_EMBEDDING_MODEL,
                ),
                vector_store=QdrantVector(
                    host=settings.QDRANT_HOST,
                    port=settings.QDRANT_PORT,
                ),
            )
            await use_case.execute(document)
    finally:
        await engine.dispose()


# ===== Celery Task (Periodic) =========================

@celery_app.task(name="process-pending-documents", bind=True, max_retries=3)
def process_pending_documents(self: Task) -> None:
    asyncio.run(_process_pending_documents())


async def _process_pending_documents() -> None:
    engine, session = await _create_session()
    try:
        async with session:
            repo = SQLDocumentRepository(session)
            documents = await repo.get_stale_unprocessed(older_than_minutes=5)

            if not documents:
                logger.info("No stale documents to process.")
                return

            logger.info(f"🔥 Found {len(documents)} stale document(s) to reprocess.")

            use_case = ProcessDocumentUseCase(
                document_repo=repo,
                extractor=DocumentExtractor(),
                storage=LocalStorage(
                    base_url=settings.BASE_URL,
                    upload_dir=settings.UPLOAD_DIR,    
                ),
                embedder=OllamaEmbedder(
                    host=settings.OLLAMA_HOST,
                    model=settings.OLLAMA_EMBEDDING_MODEL,
                ),
                vector_store=QdrantVector(
                    host=settings.QDRANT_HOST,
                    port=settings.QDRANT_PORT,
                ),
            )

            for document in documents:
                try:
                    await use_case.execute(document)
                except Exception as exc:
                    logger.error(f"Failed to reprocess document {document.id}: {exc}")
    finally:
        await engine.dispose()