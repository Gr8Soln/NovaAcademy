"""Get a single document by ID with ownership check."""

from __future__ import annotations

import uuid

from app.domain.entities.document import Document
from app.domain.exceptions import AuthorizationError, DocumentNotFoundError
from app.interfaces.repositories.document_repository import IDocumentRepository


class GetDocumentUseCase:
    def __init__(self, document_repo: IDocumentRepository) -> None:
        self._document_repo = document_repo

    async def execute(self, document_id: uuid.UUID, user_id: uuid.UUID) -> Document:
        doc = await self._document_repo.get_by_id(document_id)
        if not doc:
            raise DocumentNotFoundError(f"Document {document_id} not found")
        if doc.user_id != user_id:
            raise AuthorizationError("You do not own this document")
        return doc
