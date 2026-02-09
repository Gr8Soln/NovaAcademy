"""List documents for a user."""

from __future__ import annotations

import uuid
from typing import List

from app.domain.entities.document import Document
from app.interfaces.repositories.document_repository import IDocumentRepository


class ListDocumentsUseCase:
    def __init__(self, document_repo: IDocumentRepository) -> None:
        self._document_repo = document_repo

    async def execute(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> List[Document]:
        return await self._document_repo.list_by_user(user_id, offset=offset, limit=limit)
