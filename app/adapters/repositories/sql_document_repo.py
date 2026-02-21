from typing import Optional
from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.interfaces import IDocumentInterface
from app.domain.entities import Document, DocumentChunk, ProcessingStatus
from app.infrastructure.db import DocumentChunkModel, DocumentModel


class SQLDocumentRepository(IDocumentInterface):
    """PostgreSQL implementation of the document repository."""

    def __init__(self, session: AsyncSession) -> None:
        self._session = session

    # ── Document CRUD ────────────────────────────────────────────

    async def save(self, document: Document) -> Document:
        """Persist a new or updated document."""
        result = await self._session.execute(
            select(DocumentModel).where(DocumentModel.id == document.id)
        )
        model = result.scalar_one_or_none()

        if model:
            # Update mutable fields
            model.title = document.title
            model.processing_status = document.processing_status.value
            model.page_count = document.page_count
            model.chunk_count = document.chunk_count
            model.updated_at = document.updated_at
        else:
            model = DocumentModel(
                id=document.id,
                user_id=document.user_id,
                class_id=document.class_id,
                title=document.title,
                file_type=document.file_type,
                file_size_bytes=document.file_size_bytes,
                processing_status=document.processing_status.value,
                page_count=document.page_count,
                chunk_count=document.chunk_count,
                file_url=document.file_url,
                file_id=document.file_id,
                file_extension=document.file_extension,
                created_at=document.created_at,
                updated_at=document.updated_at,
            )
            self._session.add(model)

        await self._session.flush()
        return document

    async def get_by_id(
        self, document_id: UUID, user_id: UUID
    ) -> Optional[Document]:
        result = await self._session.execute(
            select(DocumentModel).where(
                and_(
                    DocumentModel.id == document_id,
                    DocumentModel.user_id == user_id,
                )
            )
        )
        model = result.scalar_one_or_none()
        return self._to_entity(model) if model else None

    async def list_by_user(
        self,
        user_id: UUID,
        offset: int = 0,
        limit: int = 20,
        class_id: Optional[UUID] = None,
    ) -> tuple[list[Document], int]:
        base = select(DocumentModel).where(DocumentModel.user_id == user_id)
        if class_id:
            base = base.where(DocumentModel.class_id == class_id)

        # Total count
        from sqlalchemy import func as sa_func
        count_q = select(sa_func.count()).select_from(base.subquery())
        total = (await self._session.execute(count_q)).scalar_one()

        # Paginated rows
        rows_q = (
            base.order_by(DocumentModel.created_at.desc())
            .offset(offset)
            .limit(limit)
        )
        rows = (await self._session.execute(rows_q)).scalars().all()

        return [self._to_entity(r) for r in rows], total

    async def delete(self, document_id: UUID, user_id: UUID) -> bool:
        result = await self._session.execute(
            select(DocumentModel).where(
                and_(
                    DocumentModel.id == document_id,
                    DocumentModel.user_id == user_id,
                )
            )
        )
        model = result.scalar_one_or_none()
        if model:
            await self._session.delete(model)
            await self._session.flush()
            return True
        return False

    # ── Chunks ───────────────────────────────────────────────────

    async def save_chunk(self, chunk: DocumentChunk) -> DocumentChunk:
        model = self._chunk_to_model(chunk)
        self._session.add(model)
        await self._session.flush()
        return chunk

    async def save_chunks(self, chunks: list[DocumentChunk]) -> list[DocumentChunk]:
        for chunk in chunks:
            model = self._chunk_to_model(chunk)
            self._session.add(model)
        await self._session.flush()
        return chunks

    async def get_chunks(self, document_id: UUID) -> list[DocumentChunk]:
        result = await self._session.execute(
            select(DocumentChunkModel)
            .where(DocumentChunkModel.document_id == document_id)
            .order_by(DocumentChunkModel.chunk_index)
        )
        return [self._chunk_to_entity(m) for m in result.scalars().all()]

    async def delete_chunks(self, document_id: UUID) -> None:
        from sqlalchemy import delete as sa_delete
        await self._session.execute(
            sa_delete(DocumentChunkModel).where(
                DocumentChunkModel.document_id == document_id
            )
        )
        await self._session.flush()

    # ── Mappers ──────────────────────────────────────────────────

    @staticmethod
    def _to_entity(model: DocumentModel) -> Document:
        return Document(
            id=model.id,
            user_id=model.user_id,
            class_id=model.class_id,
            title=model.title,
            file_type=model.file_type,
            file_size_bytes=model.file_size_bytes,
            processing_status=ProcessingStatus(model.processing_status),
            page_count=model.page_count,
            chunk_count=model.chunk_count,
            file_url=model.file_url,
            file_id=model.file_id,
            file_extension=model.file_extension,
            created_at=model.created_at,
            updated_at=model.updated_at,
        )

    @staticmethod
    def _chunk_to_model(chunk: DocumentChunk) -> DocumentChunkModel:
        return DocumentChunkModel(
            id=chunk.id,
            document_id=chunk.document_id,
            content=chunk.content,
            chunk_index=chunk.chunk_index,
            token_count=chunk.token_count,
            embedding_model=chunk.embedding_model,
            embedding_dim=chunk.embedding_dim,
            vector_id=chunk.vector_id,
            created_at=chunk.created_at,
        )

    @staticmethod
    def _chunk_to_entity(model: DocumentChunkModel) -> DocumentChunk:
        return DocumentChunk(
            id=model.id,
            document_id=model.document_id,
            content=model.content,
            chunk_index=model.chunk_index,
            token_count=model.token_count,
            embedding_model=model.embedding_model,
            embedding_dim=model.embedding_dim,
            vector_id=model.vector_id,
            created_at=model.created_at,
        )
