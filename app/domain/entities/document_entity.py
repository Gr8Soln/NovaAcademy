from dataclasses import dataclass, field
from datetime import datetime, timezone
from enum import Enum
from typing import Optional
from uuid import UUID, uuid4


class ProcessingStatus(str, Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    READY = "ready"
    FAILED = "failed"


@dataclass
class DocumentChunk:
    """
    A single chunk of a document after text extraction and splitting.
    Each chunk is independently embedded and stored in the vector store.

    IMPORTANT: embedding_model must match the model used at query time.
    Vectors from different models are NOT comparable.
    """
    id: UUID = field(default_factory=uuid4)
    document_id: UUID
    content: str
    chunk_index: int
    token_count: int
    embedding_model: str                    # e.g. "text-embedding-3-small"
    embedding_dim: int                      # e.g. 1536
    vector_id: Optional[UUID] = None        # Qdrant point ID (set after upsert)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def assign_vector_id(self, vector_id: UUID) -> None:
        """Record the Qdrant point ID after successful embedding upsert."""
        self.vector_id = vector_id


@dataclass
class Document:
    """
    Represents a learning document uploaded to a specific class.

    BUSINESS RULES:
    - Every document MUST belong to a class (class_id required).
    - Only the uploading user (user_id) or class admin can delete the document.
    - Processing follows: PENDING → PROCESSING → READY | FAILED.
    - chunk_count is set only when processing succeeds.
    """
    id: UUID = field(default_factory=uuid4)
    user_id: UUID
    class_id: UUID                          # FK → ChatGroup (groups table)
    file_id: str
    title: str
    file_type: str                          # e.g. "pdf", "txt"
    file_size_bytes: int
    file_url: str
    file_extension: str
    processing_status: ProcessingStatus = ProcessingStatus.PENDING
    page_count: Optional[int] = None
    chunk_count: int = 0
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __post_init__(self) -> None:
        if not self.title or not self.title.strip():
            raise ValueError("Document title cannot be empty")
        if self.file_size_bytes <= 0:
            raise ValueError("File size must be positive")

    def mark_processing(self) -> None:
        """Transition to PROCESSING; only valid from PENDING."""
        if self.processing_status != ProcessingStatus.PENDING:
            raise ValueError(
                f"Cannot start processing from status '{self.processing_status}'"
            )
        self.processing_status = ProcessingStatus.PROCESSING
        self.updated_at = datetime.now(timezone.utc)

    def mark_ready(self, chunk_count: int, page_count: Optional[int] = None) -> None:
        """Transition to READY after successful chunking/embedding."""
        if self.processing_status != ProcessingStatus.PROCESSING:
            raise ValueError(
                f"Cannot mark ready from status '{self.processing_status}'"
            )
        if chunk_count < 1:
            raise ValueError("A completed document must have at least one chunk")
        self.processing_status = ProcessingStatus.READY
        self.chunk_count = chunk_count
        if page_count is not None:
            self.page_count = page_count
        self.updated_at = datetime.now(timezone.utc)

    def mark_failed(self) -> None:
        """Transition to FAILED on processing error."""
        self.processing_status = ProcessingStatus.FAILED
        self.updated_at = datetime.now(timezone.utc)
