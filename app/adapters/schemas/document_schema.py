from datetime import datetime
from typing import Optional
from uuid import UUID

from pydantic import BaseModel


class DocumentResponse(BaseModel):
    """Full document response including processing metadata."""
    id: UUID
    user_id: UUID
    class_id: UUID
    title: str
    file_type: str
    file_size_bytes: int
    processing_status: str          # pending | processing | ready | failed
    page_count: Optional[int]
    chunk_count: int
    file_url: str
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class DocumentChunkResponse(BaseModel):
    """Single chunk response (used for debugging / admin views)."""
    id: UUID
    document_id: UUID
    chunk_index: int
    token_count: int
    embedding_model: str
    embedding_dim: int
    vector_id: Optional[UUID]
    content: str                    # exposed for inspection; omit in public search
    created_at: datetime

    class Config:
        from_attributes = True


class UploadDocumentResponse(BaseModel):
    """Response returned immediately after upload (before processing finishes)."""
    document: DocumentResponse
    message: str = (
        "Document uploaded. Processing (chunking + embedding) is running in the background. "
        "Poll GET /documents/{id} to check processing_status."
    )


class VectorSearchResult(BaseModel):
    """One hit from a vector similarity search."""
    chunk_id: str
    document_id: str
    content: str
    score: float
    embedding_model: str
    chunk_index: int
