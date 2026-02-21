from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app.domain.entities import Document, DocumentChunk


class IDocumentInterface(ABC):
    """Persistence interface for documents and their chunks."""

    @abstractmethod
    async def save(self, document: Document) -> Document:
        """Persist a new or updated document record."""
        ...

    @abstractmethod
    async def get_by_id(self, document_id: UUID, user_id: UUID) -> Optional[Document]:
        """
        Return a document by ID, scoped to the owning user.
        Returns None if not found or if user_id does not match.
        """
        ...

    @abstractmethod
    async def list_by_user(
        self,
        user_id: UUID,
        offset: int = 0,
        limit: int = 20,
        class_id: Optional[UUID] = None,
    ) -> tuple[list[Document], int]:
        """
        Paginated list of a user's documents.

        Args:
            user_id: Owner filter.
            offset: Number of records to skip.
            limit: Max records to return.
            class_id: Optional – filter by class.

        Returns:
            (documents, total_count)
        """
        ...

    @abstractmethod
    async def delete(self, document_id: UUID, user_id: UUID) -> bool:
        """
        Delete a document record.
        Returns True if deleted, False if not found / not owned.
        """
        ...

    # ── Chunks ──────────────────────────────────────────────────────

    @abstractmethod
    async def save_chunk(self, chunk: DocumentChunk) -> DocumentChunk:
        """Persist a single document chunk."""
        ...

    @abstractmethod
    async def save_chunks(self, chunks: list[DocumentChunk]) -> list[DocumentChunk]:
        """Bulk-persist document chunks."""
        ...

    @abstractmethod
    async def get_chunks(self, document_id: UUID) -> list[DocumentChunk]:
        """Return all chunks for a document, ordered by chunk_index."""
        ...

    @abstractmethod
    async def delete_chunks(self, document_id: UUID) -> None:
        """Delete all chunks associated with a document."""
        ...


class IDocumentExtractorInterface(ABC):
    """Service for reading raw text out of uploaded files and splitting it."""

    @abstractmethod
    async def extract_text(self, file_path: str, file_type: str) -> tuple[str, Optional[int]]:
        """
        Extract plain text from a stored file.

        Args:
            file_path: Absolute path to the stored file.
            file_type: Lower-case file extension without dot (e.g. 'pdf', 'txt').

        Returns:
            (text_content, page_count) – page_count is None for non-page formats.

        Raises:
            ValueError: If file_type is unsupported.
        """
        ...

    @abstractmethod
    def chunk_text(
        self,
        text: str,
        chunk_size: int = 500,
        overlap: int = 50,
    ) -> list[str]:
        """
        Split text into overlapping chunks.

        Args:
            text: Full extracted text.
            chunk_size: Approximate token count per chunk (measured in words).
            overlap: Number of words to repeat between adjacent chunks.

        Returns:
            List of text chunks.
        """
        ...


class IVectorStoreInterface(ABC):
    """
    Abstract interface for the vector/embedding store (Qdrant).

    CRITICAL: The same embedding model must be used at both index-time
    (upsert_chunks) and query-time (search). Chunks store the model name
    so the implementation can enforce this.
    """

    @abstractmethod
    async def upsert_chunks(
        self,
        document_id: UUID,
        user_id: UUID,
        class_id: UUID,
        chunks: list[DocumentChunk],
    ) -> list[DocumentChunk]:
        """
        Embed each chunk and upsert into the vector store.

        Returns the same chunks with vector_id populated.
        """
        ...

    @abstractmethod
    async def delete_document_vectors(self, document_id: UUID) -> None:
        """Remove all vectors belonging to a document from the store."""
        ...

    @abstractmethod
    async def search(
        self,
        query: str,
        user_id: UUID,
        top_k: int = 5,
        class_id: Optional[UUID] = None,
    ) -> list[dict]:
        """
        Embed a query string and return the top-k most similar chunks.

        Uses the same model stored on the indexed chunks for consistency.

        Returns:
            List of dicts with keys:
              - chunk_id, document_id, content, score, embedding_model
        """
        ...
