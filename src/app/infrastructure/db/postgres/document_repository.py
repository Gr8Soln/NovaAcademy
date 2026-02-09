"""Postgres document repository implementation."""

from __future__ import annotations

import uuid
from typing import List, Optional

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.domain.entities.document import Document, DocumentChunk
from app.infrastructure.db.mappers import (
    chunk_entity_to_model,
    chunk_model_to_entity,
    document_entity_to_model,
    document_model_to_entity,
)
from app.infrastructure.db.models import DocumentChunkModel, DocumentModel
from app.interfaces.repositories.document_repository import IDocumentRepository


class PostgresDocumentRepository(IDocumentRepository):
    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    async def create(self, document: Document) -> Document:
        model = document_entity_to_model(document)
        self._session.add(model)
        await self._session.flush()
        await self._session.refresh(model)
        return document_model_to_entity(model)

    async def get_by_id(self, document_id: uuid.UUID) -> Optional[Document]:
        result = await self._session.execute(select(DocumentModel).where(DocumentModel.id == document_id))
        model = result.scalar_one_or_none()
        return document_model_to_entity(model) if model else None

    async def list_by_user(self, user_id: uuid.UUID, offset: int = 0, limit: int = 20) -> List[Document]:
        result = await self._session.execute(
            select(DocumentModel)
            .where(DocumentModel.user_id == user_id)
            .order_by(DocumentModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        return [document_model_to_entity(m) for m in result.scalars().all()]

    async def update(self, document: Document) -> Document:
        result = await self._session.execute(select(DocumentModel).where(DocumentModel.id == document.id))
        model = result.scalar_one_or_none()
        if model:
            model.title = document.title
            model.processing_status = document.processing_status.value
            model.page_count = document.page_count
            model.chunk_count = document.chunk_count
            model.updated_at = document.updated_at
            await self._session.flush()
            await self._session.refresh(model)
            return document_model_to_entity(model)
        return document

    async def delete(self, document_id: uuid.UUID) -> None:
        result = await self._session.execute(select(DocumentModel).where(DocumentModel.id == document_id))
        model = result.scalar_one_or_none()
        if model:
            await self._session.delete(model)
            await self._session.flush()

    # ── Chunks ──────────────────────────────────────────────────

    async def create_chunks(self, chunks: List[DocumentChunk]) -> List[DocumentChunk]:
        models = [chunk_entity_to_model(c) for c in chunks]
        self._session.add_all(models)
        await self._session.flush()
        return chunks

    async def get_chunks_by_document(self, document_id: uuid.UUID) -> List[DocumentChunk]:
        result = await self._session.execute(
            select(DocumentChunkModel)
            .where(DocumentChunkModel.document_id == document_id)
            .order_by(DocumentChunkModel.chunk_index)
        )
        return [chunk_model_to_entity(m) for m in result.scalars().all()]

    async def delete_chunks_by_document(self, document_id: uuid.UUID) -> None:
        result = await self._session.execute(
            select(DocumentChunkModel).where(DocumentChunkModel.document_id == document_id)
        )
        for model in result.scalars().all():
            await self._session.delete(model)
        await self._session.flush()
