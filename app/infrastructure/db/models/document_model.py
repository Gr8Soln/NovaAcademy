import uuid
from typing import Optional

from sqlalchemy import ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.infrastructure.db.base import Base


class DocumentModel(Base):
    """SQLAlchemy model for uploaded documents."""

    __tablename__ = "documents"

    user_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    class_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("groups.id", ondelete="CASCADE"), nullable=False, index=True
    )
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    file_type: Mapped[str] = mapped_column(String(20), nullable=False)          # pdf | txt | docx | md
    file_size_bytes: Mapped[int] = mapped_column(Integer, nullable=False)
    processing_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default="pending", index=True
    )  # pending | processing | ready | failed
    page_count: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    chunk_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)
    file_url: Mapped[str] = mapped_column(String(1000), nullable=False)
    file_id: Mapped[str] = mapped_column(String(255), nullable=False)
    file_extension: Mapped[str] = mapped_column(String(20), nullable=False)

    # Relationships
    chunks: Mapped[list["DocumentChunkModel"]] = relationship(
        back_populates="document", cascade="all, delete-orphan"
    )


class DocumentChunkModel(Base):
    """
    A single text chunk extracted from a document.

    Stores the embedding model name and dimension used at index-time so the
    search path can embed queries with the exact same model, guaranteeing
    vector-space compatibility.
    """

    __tablename__ = "document_chunks"

    document_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True
    )
    content: Mapped[str] = mapped_column(Text, nullable=False)
    chunk_index: Mapped[int] = mapped_column(Integer, nullable=False)
    token_count: Mapped[int] = mapped_column(Integer, nullable=False, default=0)

    embedding_model: Mapped[str] = mapped_column(
        String(100), nullable=False
    )  # e.g. "text-embedding-3-small"
    embedding_dim: Mapped[int] = mapped_column(
        Integer, nullable=False
    )  # e.g. 1536
    vector_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        nullable=True
    )  # Qdrant point UUID (null until upsert completes)

    # Relationships
    document: Mapped["DocumentModel"] = relationship(back_populates="chunks")
