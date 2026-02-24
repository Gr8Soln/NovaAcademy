import datetime
from typing import Optional
from uuid import UUID

from app.application.interfaces import (IDocumentEmbedderInterface,
                                        IDocumentExtractorInterface,
                                        IDocumentInterface, IStorageService,
                                        IVectorStoreInterface)
from app.core.config import settings
from app.core.logging import get_logger
from app.domain.entities import (Document, DocumentChunksAndEmbeddings,
                                 EmbeddedChunk)

logger = get_logger(__name__)

class UploadDocumentUseCase:
    """
    Upload a document file, persist it, then trigger async processing.

    Flow:
    1. Validate file type and size
    2. Store file via IStorageService
    3. Create Document entity (status=PENDING)
    4. Persist document record
    5. Background: extract text → chunk → embed → upsert to vector store → mark READY
    """

    SUPPORTED_TYPES = {"pdf", "txt", "docx", "csv", "xlsx", "pptx", "png", "jpg", "jpeg"}
    MAX_SIZE_BYTES = settings.MAX_DOCUMENT_SIZE_MB * 1024 * 1024

    def __init__(
        self,
        document_repo: IDocumentInterface,
        storage: IStorageService,
        extractor: IDocumentExtractorInterface,
        embedder: IDocumentEmbedderInterface,
        vector_store: IVectorStoreInterface,
    ) -> None:
        self._repo = document_repo
        self._storage = storage
        self._extractor = extractor
        self._embedder = embedder
        self._vector_store = vector_store

    async def execute(
        self,
        file,                               # FastAPI UploadFile
        user_id: UUID,
        class_id: UUID,
        title: Optional[str] = None,
    ) -> Document:
        """
        Synchronous part: validates, stores file, persists Document (PENDING).
        Returns immediately; processing happens in a background task.
        Call process_document() separately in a BackgroundTask.
        """
        filename: str = file.filename or "document"
        ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""

        if ext not in self.SUPPORTED_TYPES:
            raise ValueError(
                f"Unsupported file type '.{ext}'. "
                f"Allowed: {', '.join(sorted(self.SUPPORTED_TYPES))}"
            )

        # Read size without loading all content twice
        file_bytes = await file.read()
        if len(file_bytes) > self.MAX_SIZE_BYTES:
            raise ValueError(
                f"File exceeds maximum size of {settings.MAX_DOCUMENT_SIZE_MB} MB"
            )
        await file.seek(0)

        # Persist the raw file
        storage_result = await self._storage.upload_document(file, max_size_mb=settings.MAX_DOCUMENT_SIZE_MB)

        doc_title = title or filename
        document = Document(
            user_id=user_id,
            class_id=class_id,
            title=doc_title.strip(),
            file_type=ext,
            file_size_bytes=len(file_bytes),
            file_url=storage_result["file_url"],
            file_id=storage_result["file_id"],
            file_extension=storage_result["file_extension"],
        )
        return await self._repo.save(document)


    async def process_document(self, document_id: UUID, user_id: UUID) -> None:
        """
        Heavy background processing: extract → chunk → embed → store.
        Should be called via FastAPI BackgroundTasks after execute().
        """
        document = await self._repo.get_by_id(document_id, user_id)
        if not document:
            raise ValueError("Document not found")

        try:
            document.mark_processing()
            await self._repo.save(document)

            file_path = self._storage.get_file_path(
                document.file_id, document.file_extension
            )
            extracted_chunk = await self._extractor.extract_and_chunk(file_path)

            raw_chunks = extracted_chunk.chunks
            page_count = extracted_chunk.total_pages
            if not raw_chunks:
                raise ValueError("No text could be extracted from the document")
            
            # Embed chunks using the embedder service 
            embedded_chunks = await self._embedder.embed_multiple(raw_chunks)
            
            # Embed and store in vector store (fills vector_id on each chunk)
            await self._vector_store.store_embeddings(
                DocumentChunksAndEmbeddings(
                    document_id=str(document.id),
                    user_id=str(document.user_id),
                    class_id=str(document.class_id),
                    created_at=datetime.datetime.now(datetime.timezone.utc),
                    embedding_model=self._embedder.__class__.__name__,
                    embedding_dim=len(embedded_chunks[0][1]) if embedded_chunks else 0,
                    embedded_chunks=[
                        EmbeddedChunk(
                            index=i,
                            chunk=chunk,
                            embedding=embedding,
                        )
                        for i, (chunk, embedding) in enumerate(embedded_chunks)
                    ],                    
               )
            )

            document.mark_ready(chunk_count=len(embedded_chunks), page_count=page_count)
            await self._repo.save(document)

        except Exception:
            document.mark_failed()
            await self._repo.save(document)
            raise


class GetDocumentUseCase:
    """Retrieve a single document by ID; caller must own it."""

    def __init__(self, document_repo: IDocumentInterface) -> None:
        self._repo = document_repo

    async def execute(self, document_id: UUID, user_id: UUID) -> Document:
        document = await self._repo.get_by_id(document_id, user_id)
        if not document:
            raise ValueError("Document not found")
        return document


class ListDocumentsUseCase:
    """List documents for the calling user, with optional class filter."""

    def __init__(self, document_repo: IDocumentInterface) -> None:
        self._repo = document_repo

    async def execute(
        self,
        user_id: UUID,
        offset: int = 0,
        limit: int = 20,
        class_id: Optional[UUID] = None,
    ) -> tuple[list[Document], int]:
        return await self._repo.list_by_user(
            user_id=user_id,
            offset=offset,
            limit=min(limit, 100),
            class_id=class_id,
        )


class DeleteDocumentUseCase:
    """Delete a document and all its associated data."""

    def __init__(
        self,
        document_repo: IDocumentInterface,
        storage: IStorageService,
        vector_store: IVectorStoreInterface,
    ) -> None:
        self._repo = document_repo
        self._storage = storage
        self._vector_store = vector_store

    async def execute(self, document_id: UUID, user_id: UUID) -> None:
        document = await self._repo.get_by_id(document_id, user_id)
        if not document:
            raise ValueError("Document not found")

        # 1. Remove vectors from Qdrant
        await self._vector_store.delete_embeddings(str(document_id))
        
        # 3. Delete physical file
        await self._storage.delete_file(document.file_id, document.file_extension)


class SearchDocumentsUseCase:
    def __init__(self, vector_store: IVectorStoreInterface, embedder: IDocumentEmbedderInterface) -> None:
        self._vector_store = vector_store
        self._embedder = embedder

    async def execute(
        self,
        query: str,
        user_id: UUID,
        class_id: Optional[UUID] = None,
        top_k: int = 5,
    ) -> list[dict]:
        """
        Retrieves the top-k most similar chunks from the vector store.
        Returns a list of similarity results.
        """
        if not query or not query.strip():
            return []
        
        # Embed query string
        _, embedded_query = await self._embedder.embed(query.strip())
        
        # Retrieve similar chunks from vector store
        return await self._vector_store.search_embeddings(
            embedded_query,
            user_id=str(user_id) if user_id else None,
            class_id=str(class_id) if class_id else None,
            top_k=top_k,
        )


