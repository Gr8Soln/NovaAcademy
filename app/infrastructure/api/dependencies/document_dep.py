from uuid import UUID

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.repositories import SQLDocumentRepository
from app.adapters.services import DocumentExtractorService
from app.application.interfaces import (
    IDocumentExtractorInterface,
    IDocumentInterface,
    IStorageService,
    IVectorStoreInterface,
)
from app.application.use_cases import (
    DeleteDocumentUseCase,
    GetDocumentUseCase,
    ListDocumentsUseCase,
    SearchDocumentsUseCase,
    UploadDocumentUseCase,
)
from app.core.config import Settings, get_settings
from app.infrastructure.db import get_db_session

from .auth_dep import get_current_user
from .chat_dep import get_chat_group_repository
from .core_dep import get_storage_service

_qdrant_instance = None


def get_document_repository(
    session: AsyncSession = Depends(get_db_session),
) -> IDocumentInterface:
    return SQLDocumentRepository(session)


def get_document_extractor_service() -> IDocumentExtractorInterface:
    return DocumentExtractorService()


async def get_vector_store_service(
    settings: Settings = Depends(get_settings),
) -> IVectorStoreInterface:
    """Singleton Qdrant client (one connection pool for all requests)."""
    global _qdrant_instance
    if _qdrant_instance is None:
        from app.adapters.vectors.qdrant_vector_store import QdrantVectorStore

        _qdrant_instance = QdrantVectorStore(
            qdrant_host=settings.QDRANT_HOST,
            qdrant_port=settings.QDRANT_PORT,
            openai_api_key=settings.OPENAI_API_KEY or "",
        )
    return _qdrant_instance


def get_upload_document_usecase(
    document_repo: IDocumentInterface = Depends(get_document_repository),
    storage: IStorageService = Depends(get_storage_service),
    extractor: IDocumentExtractorInterface = Depends(get_document_extractor_service),
    vector_store: IVectorStoreInterface = Depends(get_vector_store_service),
) -> UploadDocumentUseCase:
    return UploadDocumentUseCase(
        document_repo=document_repo,
        storage=storage,
        extractor=extractor,
        vector_store=vector_store,
    )


def get_get_document_usecase(
    document_repo: IDocumentInterface = Depends(get_document_repository),
) -> GetDocumentUseCase:
    return GetDocumentUseCase(document_repo=document_repo)


def get_list_documents_usecase(
    document_repo: IDocumentInterface = Depends(get_document_repository),
) -> ListDocumentsUseCase:
    return ListDocumentsUseCase(document_repo=document_repo)


def get_delete_document_usecase(
    document_repo: IDocumentInterface = Depends(get_document_repository),
    storage: IStorageService = Depends(get_storage_service),
    vector_store: IVectorStoreInterface = Depends(get_vector_store_service),
) -> DeleteDocumentUseCase:
    return DeleteDocumentUseCase(
        document_repo=document_repo,
        storage=storage,
        vector_store=vector_store,
    )


def get_search_documents_usecase(
    vector_store: IVectorStoreInterface = Depends(get_vector_store_service),
) -> SearchDocumentsUseCase:
    return SearchDocumentsUseCase(vector_store=vector_store)
