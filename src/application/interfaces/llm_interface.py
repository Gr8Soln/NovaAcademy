from abc import ABC, abstractmethod
from typing import AsyncGenerator, List, Optional


class ILLMInterface(ABC):
    """Generic interface for LLM completions."""

    @abstractmethod
    async def complete(
        self, 
        prompt: str, 
        system_message: Optional[str] = None,
        max_tokens: int = 1000
    ) -> str:
        """Get a full completion from the LLM."""
        ...

    @abstractmethod
    async def complete_stream(
        self, 
        prompt: str, 
        system_message: Optional[str] = None,
        max_tokens: int = 1000
    ) -> AsyncGenerator[str, None]:
        """Get a streaming completion from the LLM."""
        ...
