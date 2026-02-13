"""Abstract document parser service — converts raw files to text chunks."""

from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import List


@dataclass
class ParsedChunk:
    content: str
    page_number: int | None = None
    metadata: dict | None = None


class IDocumentParserService(ABC):

    @abstractmethod
    async def parse(self, file_path: str, file_type: str) -> List[ParsedChunk]:
        """Parse a file and return text chunks."""
        ...
