from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app.domain.entities import Document
from app.domain.entities.document_entity import (DocumentChunksAndEmbeddings,
                                                 ExtractedChunk)


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

class IDocumentExtractorInterface(ABC):
    """Service for reading raw text out of uploaded files and splitting it."""

    @abstractmethod
    async def extract(self, file_path: str) -> tuple[str, Optional[int]]:
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
    def chunk(self, text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
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
    
    
    @abstractmethod
    async def extract_and_chunk(self, file_path: str, chunk_size: int = 500, overlap: int = 50) -> ExtractedChunk:
        """
        Extract text from a file and split it into chunks.

        Args:
            file_path: Absolute path to the stored file.

        Returns:
            ExtractedChunk with the list of text chunks and total page count.
        """
        ...
        
        
    

class IDocumentEmbedderInterface(ABC):
    """
    """

    @abstractmethod
    async def embed(self, text: str) -> tuple[str, list[float]]:
        """
        Embed a text string into a vector.

        Args:
            text: The text to embed.
        Returns:
            A tuple of (text, embedding vector).
        """
        ...

    @abstractmethod
    async def embed_multiple(self, texts: list[str]) -> list[tuple[str, list[float]]]:
        """
        Embed multiple text strings into vectors.

        Args:
            texts: The list of texts to embed.
        Returns:
            A list of (text, embedding vector) tuples.
        """
        ...



class IVectorStoreInterface(ABC):
    @abstractmethod
    async def store_embeddings(
        self,
        data: DocumentChunksAndEmbeddings,
    ) -> None:
        """
        Embed each chunk and upsert into the vector store.

        Returns the same chunks with vector_id populated.
        """
        ...

    @abstractmethod
    async def delete_embeddings(self, document_id: str) -> None:
        """Remove all vectors belonging to a document from the store."""
        ...

    @abstractmethod
    async def search_embeddings(
        self,
        embedded_query: list[float],
        top_k: int = 5,
        user_id: Optional[str] = None,
        class_id: Optional[str] = None,
        document_id: Optional[str] = None,
    ) -> list[dict[str, str | int]]:
        """
        Embed a query string and return the top-k most similar chunks.

        Uses the same model stored on the indexed chunks for consistency.

        Returns:
            List of dicts with keys:
              - chunk_id, document_id, content, score, embedding_model
        """
        ...
