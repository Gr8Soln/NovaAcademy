"""Abstract LLM service interface."""

from __future__ import annotations

from abc import ABC, abstractmethod
from typing import AsyncIterator, List, Optional


class ILLMService(ABC):

    @abstractmethod
    async def generate(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> str:
        """Generate a complete response."""
        ...

    @abstractmethod
    async def generate_stream(
        self,
        prompt: str,
        system_prompt: Optional[str] = None,
        temperature: float = 0.7,
        max_tokens: int = 1024,
    ) -> AsyncIterator[str]:
        """Yield token-by-token via an async iterator (for SSE)."""
        ...
