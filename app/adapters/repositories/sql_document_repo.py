from typing import Optional
from uuid import UUID

from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.application.interfaces import IDocumentInterface
from app.core.logging import get_logger
from app.domain.entities import Document, ProcessingStatus
from app.infrastructure.db import DocumentModel

logger = get_logger(__name__)


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
