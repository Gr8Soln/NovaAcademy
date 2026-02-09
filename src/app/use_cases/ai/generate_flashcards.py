"""Generate flashcards from document content."""

from __future__ import annotations

import json
import uuid
from dataclasses import dataclass
from typing import List

from app.domain.exceptions import DocumentNotFoundError
from app.interfaces.repositories.document_repository import IDocumentRepository
from app.interfaces.services.llm_service import ILLMService


@dataclass
class Flashcard:
    front: str
    back: str


_SYSTEM_PROMPT = (
    "You are an AI flashcard generator. Given study material, create flashcards for effective review. "
    'Return ONLY a JSON array where each element has: "front" (question/term), "back" (answer/definition).'
)


class GenerateFlashcardsUseCase:
    def __init__(
        self,
        document_repo: IDocumentRepository,
        llm_service: ILLMService,
    ) -> None:
        self._document_repo = document_repo
        self._llm = llm_service

    async def execute(self, document_id: uuid.UUID, num_cards: int = 20) -> List[Flashcard]:
        doc = await self._document_repo.get_by_id(document_id)
        if not doc:
            raise DocumentNotFoundError(f"Document {document_id} not found")

        chunks = await self._document_repo.get_chunks_by_document(document_id)
        full_text = "\n\n".join(c.content for c in chunks[:30])

        prompt = (
            f"Study material:\n\n{full_text}\n\n"
            f"Generate exactly {num_cards} flashcards as a JSON array."
        )

        raw = await self._llm.generate(prompt, system_prompt=_SYSTEM_PROMPT, max_tokens=4096)
        cards_data = json.loads(raw)
        return [Flashcard(front=c["front"], back=c["back"]) for c in cards_data]
