"""Document domain entities — uploaded study materials and their chunks."""

from __future__ import annotations

import uuid
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Optional


class DocumentType(str, Enum):
    PDF = "pdf"
    DOCX = "docx"
    PPTX = "pptx"
    IMAGE = "image"
    TXT = "txt"


class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"


@dataclass
class Document:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    user_id: uuid.UUID = field(default_factory=uuid.uuid4)
    title: str = ""
    file_path: str = ""
    file_type: DocumentType = DocumentType.PDF
    file_size_bytes: int = 0
    processing_status: ProcessingStatus = ProcessingStatus.PENDING
    page_count: Optional[int] = None
    chunk_count: int = 0
    created_at: datetime = field(default_factory=datetime.utcnow)
    updated_at: datetime = field(default_factory=datetime.utcnow)

    # ── Business rules ──────────────────────────────────────────

    def mark_processing(self) -> None:
        self.processing_status = ProcessingStatus.PROCESSING
        self.updated_at = datetime.utcnow()

    def mark_completed(self, chunk_count: int, page_count: Optional[int] = None) -> None:
        self.processing_status = ProcessingStatus.COMPLETED
        self.chunk_count = chunk_count
        self.page_count = page_count
        self.updated_at = datetime.utcnow()

    def mark_failed(self) -> None:
        self.processing_status = ProcessingStatus.FAILED
        self.updated_at = datetime.utcnow()

    @property
    def is_ready(self) -> bool:
        return self.processing_status == ProcessingStatus.COMPLETED


@dataclass
class DocumentChunk:
    id: uuid.UUID = field(default_factory=uuid.uuid4)
    document_id: uuid.UUID = field(default_factory=uuid.uuid4)
    chunk_index: int = 0
    content: str = ""
    page_number: Optional[int] = None
    token_count: int = 0
    embedding_id: Optional[str] = None  # Reference in vector DB
    metadata: dict = field(default_factory=dict)
    created_at: datetime = field(default_factory=datetime.utcnow)
