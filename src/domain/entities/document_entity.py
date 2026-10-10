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
class ExtractedChunk:
    chunks: list[str]
    total_pages: Optional[int] = None
    
    
@dataclass
class EmbeddedChunk:
    index: int
    chunk: str
    embedding: list[float]

@dataclass
class DocumentChunksAndEmbeddings:
    document_id: str
    user_id: str
    class_id: str
    created_at: datetime
    embedding_model: str
    embedding_dim: int
    embedded_chunks: list[EmbeddedChunk]
    

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
    user_id: UUID
    file_id: str
    title: str
    file_type: str                         
    file_size_bytes: int
    file_url: str
    file_extension: str
    class_id: Optional[UUID] = None
    id: UUID = field(default_factory=uuid4)
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
        if self.processing_status not in [ProcessingStatus.PENDING, ProcessingStatus.FAILED]:
            raise ValueError(f"Cannot start processing from status '{self.processing_status}'")
        self.processing_status = ProcessingStatus.PROCESSING
        self.updated_at = datetime.now(timezone.utc)

    def mark_ready(self, chunk_count: int, page_count: Optional[int] = None) -> None:
        """Transition to READY after successful chunking/embedding."""
        if self.processing_status != ProcessingStatus.PROCESSING:
            raise ValueError(f"Cannot mark ready from status '{self.processing_status}'")
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
