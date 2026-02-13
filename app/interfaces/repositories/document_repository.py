"""Abstract document repository interface."""

from __future__ import annotations

import uuid
from abc import ABC, abstractmethod
from typing import List, Optional

from app.domain.entities.document import Document, DocumentChunk


class IDocumentRepository(ABC):

    @abstractmethod
    async def create(self, document: Document) -> Document:
        ...

    @abstractmethod
    async def get_by_id(self, document_id: uuid.UUID) -> Optional[Document]:
        ...

    @abstractmethod
    async def list_by_user(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> List[Document]:
        ...

    @abstractmethod
    async def update(self, document: Document) -> Document:
        ...

    @abstractmethod
    async def delete(self, document_id: uuid.UUID) -> None:
        ...

    # ── Chunk operations ────────────────────────────────────────

    @abstractmethod
    async def create_chunks(self, chunks: List[DocumentChunk]) -> List[DocumentChunk]:
        ...

    @abstractmethod
    async def get_chunks_by_document(self, document_id: uuid.UUID) -> List[DocumentChunk]:
        ...

    @abstractmethod
    async def delete_chunks_by_document(self, document_id: uuid.UUID) -> None:
        ...

    @abstractmethod
    async def count_by_user(self, user_id: uuid.UUID) -> int:
        """Count documents owned by a user."""
        ...
