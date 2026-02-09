"""Upload a study document — create DB record, save file."""

from __future__ import annotations

import uuid

from app.domain.entities.document import Document, DocumentType
from app.interfaces.repositories.document_repository import IDocumentRepository


class UploadDocumentUseCase:
    def __init__(self, document_repo: IDocumentRepository) -> None:
        self._document_repo = document_repo

    async def execute(
        self,
        user_id: uuid.UUID,
        title: str,
        file_path: str,
        file_type: str,
        file_size_bytes: int,
    ) -> Document:
        doc = Document(
            user_id=user_id,
            title=title,
            file_path=file_path,
            file_type=DocumentType(file_type),
            file_size_bytes=file_size_bytes,
        )
        return await self._document_repo.create(doc)
