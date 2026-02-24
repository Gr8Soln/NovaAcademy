import asyncio
from uuid import UUID

from celery import Task

from app.adapters.repositories import SQLDocumentRepository
from app.adapters.services.document_extractor import DocumentExtractor
from app.adapters.services.local_storage import LocalStorage
from app.adapters.services.ollama_embedder import OllamaEmbedder
from app.adapters.services.qdrant_vector import QdrantVector
from app.application.use_cases.document_usecases import ProcessDocumentUseCase
from app.core.config import settings
from app.core.logging import get_logger
from app.infrastructure.celery_app import celery_app
from app.infrastructure.db import async_session_factory

logger = get_logger(__name__)


# ===== Celery Task =========================

@celery_app.task(name="process_document", bind=True, max_retries=3)
def process_document(self: Task, document_id: str) -> None:
    asyncio.run(_process_document(document_id))


async def _process_document(document_id: str) -> None:
    async with async_session_factory() as session:
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


# ===== Celery Task (Periodic) =========================

@celery_app.task(name="process-pending-documents", bind=True, max_retries=3)
def process_pending_documents(self: Task) -> None:
    asyncio.run(_process_pending_documents())


async def _process_pending_documents() -> None:
    async with async_session_factory() as session:
        repo = SQLDocumentRepository(session)
        documents = await repo.get_stale_unprocessed(older_than_minutes=5)

        if not documents:
            logger.info("No stale documents to process.")
            return

        logger.info(f"Found {len(documents)} stale document(s) to reprocess.")

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