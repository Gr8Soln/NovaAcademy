from uuid import UUID

from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.adapters.repositories import SQLDocumentRepository
from app.adapters.services import DocumentExtractor, OllamaEmbedder
from app.application.interfaces import (IDocumentEmbedderInterface,
                                        IDocumentExtractorInterface,
                                        IDocumentInterface, IStorageService,
                                        IVectorStoreInterface)
from app.application.use_cases import (DeleteDocumentUseCase,
                                       GetDocumentUseCase,
                                       ListDocumentsUseCase,
                                       SearchDocumentsUseCase,
                                       UploadDocumentUseCase)
from app.core.config import Settings, get_settings
from app.infrastructure.db import get_db_session

from .core_dep import get_storage_service


def get_document_repository(
    session: AsyncSession = Depends(get_db_session),
) -> IDocumentInterface:
    return SQLDocumentRepository(session)


def get_document_extractor() -> IDocumentExtractorInterface:
    return DocumentExtractor()


async def get_vector_store(
    settings: Settings = Depends(get_settings),
) -> IVectorStoreInterface:
    """Singleton Qdrant client (one connection pool for all requests)."""
    from app.adapters.services.qdrant_vector import QdrantVector

    return QdrantVector(
        host=settings.QDRANT_HOST,
        port=settings.QDRANT_PORT,
        api_key=settings.QDRANT_API_KEY,
    )
    


def get_document_embedder() -> IDocumentEmbedderInterface:
    return OllamaEmbedder()


def get_upload_document_usecase(
    document_repo: IDocumentInterface = Depends(get_document_repository),
    storage: IStorageService = Depends(get_storage_service),
    extractor: IDocumentExtractorInterface = Depends(get_document_extractor),
    embedder: IDocumentEmbedderInterface = Depends(get_document_embedder),
    vector_store: IVectorStoreInterface = Depends(get_vector_store),
) -> UploadDocumentUseCase:
    return UploadDocumentUseCase(
        document_repo=document_repo,
        storage=storage,
        extractor=extractor,
        embedder=embedder,
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
    vector_store: IVectorStoreInterface = Depends(get_vector_store),
) -> DeleteDocumentUseCase:
    return DeleteDocumentUseCase(
        document_repo=document_repo,
        storage=storage,
        vector_store=vector_store,
    )


def get_search_documents_usecase(
    vector_store: IVectorStoreInterface = Depends(get_vector_store),
    embedder: IDocumentEmbedderInterface = Depends(get_document_embedder),
) -> SearchDocumentsUseCase:
    return SearchDocumentsUseCase(vector_store=vector_store, embedder=embedder)


