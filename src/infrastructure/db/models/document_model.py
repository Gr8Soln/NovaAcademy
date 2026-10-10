import uuid
from typing import Optional

from sqlalchemy import ForeignKey, Integer, String
from sqlalchemy.orm import Mapped, mapped_column

from app.infrastructure.db.base import Base


class DocumentModel(Base):
    """SQLAlchemy model for uploaded documents."""

    __tablename__ = "documents"

    user_id: Mapped[uuid.UUID] = mapped_column(nullable=False, index=True)
    class_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        ForeignKey("groups.id", ondelete="CASCADE"), nullable=True, index=True
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

