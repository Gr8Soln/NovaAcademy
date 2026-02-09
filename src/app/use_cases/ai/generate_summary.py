"""Generate a summary of a document."""

from __future__ import annotations

import uuid
from typing import AsyncIterator

from app.domain.exceptions import DocumentNotFoundError
from app.interfaces.repositories.document_repository import IDocumentRepository
from app.interfaces.services.llm_service import ILLMService


_SYSTEM_PROMPT = (
    "You are a helpful AI tutor. Produce a clear, well-organized summary of the "
    "student's study material. Use headings, bullet points, and highlight key concepts."
)


class GenerateSummaryUseCase:
    def __init__(
        self,
        document_repo: IDocumentRepository,
        llm_service: ILLMService,
    ) -> None:
        self._document_repo = document_repo
        self._llm = llm_service

    async def execute(self, document_id: uuid.UUID) -> AsyncIterator[str]:
        doc = await self._document_repo.get_by_id(document_id)
        if not doc:
            raise DocumentNotFoundError(f"Document {document_id} not found")

        chunks = await self._document_repo.get_chunks_by_document(document_id)
        full_text = "\n\n".join(c.content for c in chunks)

        prompt = f"Study material:\n\n{full_text}\n\nProvide a comprehensive summary."

        async for token in self._llm.generate_stream(prompt, system_prompt=_SYSTEM_PROMPT, max_tokens=2048):
            yield token
