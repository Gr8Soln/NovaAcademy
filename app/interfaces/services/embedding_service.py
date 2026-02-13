"""Abstract embedding service interface."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import List


class IEmbeddingService(ABC):

    @abstractmethod
    async def embed(self, texts: List[str]) -> List[List[float]]:
        """Return embedding vectors for the given texts."""
        ...

    @abstractmethod
    async def embed_query(self, text: str) -> List[float]:
        """Embed a single query string."""
        ...
