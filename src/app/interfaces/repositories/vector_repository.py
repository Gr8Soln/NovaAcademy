"""Abstract vector repository interface — decoupled from any specific vector DB."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List, Optional


@dataclass
class VectorSearchResult:
    chunk_id: str
    content: str
    score: float
    metadata: dict


class IVectorRepository(ABC):

    @abstractmethod
    async def upsert(
        self,
        collection: str,
        ids: List[str],
        embeddings: List[List[float]],
        documents: List[str],
        metadatas: Optional[List[dict]] = None,
    ) -> None:
        """Insert or update vectors in the store."""
        ...

    @abstractmethod
    async def search(
        self,
        collection: str,
        query_embedding: List[float],
        top_k: int = 5,
    ) -> List[VectorSearchResult]:
        """Return the top-k most similar results."""
        ...

    @abstractmethod
    async def delete(self, collection: str, ids: List[str]) -> None:
        """Delete vectors by ID."""
        ...

    @abstractmethod
    async def delete_collection(self, collection: str) -> None:
        """Drop an entire collection."""
        ...
