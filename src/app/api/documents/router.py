"""Document upload & management API router."""

from __future__ import annotations

import os
import uuid
from pathlib import Path

from fastapi import APIRouter, Depends, HTTPException, UploadFile, status

from app.core.config import settings
from app.core.dependencies import get_current_user, get_document_repository
from app.domain.entities.user import User
from app.domain.exceptions import AuthorizationError, DocumentNotFoundError
from app.interfaces.repositories.document_repository import IDocumentRepository
from app.schemas.documents import DocumentListResponse, DocumentResponse
from app.use_cases.documents import GetDocumentUseCase, ListDocumentsUseCase, UploadDocumentUseCase

router = APIRouter(prefix="/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {"pdf", "docx", "pptx", "txt", "png", "jpg", "jpeg"}


def _get_file_type(filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower()
    if ext in ("png", "jpg", "jpeg"):
        return "image"
    return ext


@router.post("/", response_model=DocumentResponse, status_code=status.HTTP_201_CREATED)
async def upload_document(
    file: UploadFile,
    doc_repo: IDocumentRepository = Depends(get_document_repository),
    current_user: User = Depends(get_current_user),
):
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Unsupported file type: {ext}")

    # Save file
    upload_dir = Path(settings.UPLOAD_DIR) / str(current_user.id)
    upload_dir.mkdir(parents=True, exist_ok=True)
    file_id = uuid.uuid4()
    file_path = upload_dir / f"{file_id}.{ext}"

    content = await file.read()
    with open(file_path, "wb") as f:
        f.write(content)

    uc = UploadDocumentUseCase(doc_repo)
    doc = await uc.execute(
        user_id=current_user.id,
        title=file.filename or "Untitled",
        file_path=str(file_path),
        file_type=_get_file_type(file.filename or ""),
        file_size_bytes=len(content),
    )

    return DocumentResponse(
        id=doc.id,
        user_id=doc.user_id,
        title=doc.title,
        file_type=doc.file_type.value,
        file_size_bytes=doc.file_size_bytes,
        processing_status=doc.processing_status.value,
        page_count=doc.page_count,
        chunk_count=doc.chunk_count,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


@router.get("/", response_model=DocumentListResponse)
async def list_documents(
    offset: int = 0,
    limit: int = 20,
    doc_repo: IDocumentRepository = Depends(get_document_repository),
    current_user: User = Depends(get_current_user),
):
    uc = ListDocumentsUseCase(doc_repo)
    docs = await uc.execute(current_user.id, offset=offset, limit=limit)
    return DocumentListResponse(
        documents=[
            DocumentResponse(
                id=d.id,
                user_id=d.user_id,
                title=d.title,
                file_type=d.file_type.value,
                file_size_bytes=d.file_size_bytes,
                processing_status=d.processing_status.value,
                page_count=d.page_count,
                chunk_count=d.chunk_count,
                created_at=d.created_at,
                updated_at=d.updated_at,
            )
            for d in docs
        ],
        total=len(docs),
    )


@router.get("/{document_id}", response_model=DocumentResponse)
async def get_document(
    document_id: uuid.UUID,
    doc_repo: IDocumentRepository = Depends(get_document_repository),
    current_user: User = Depends(get_current_user),
):
    try:
        uc = GetDocumentUseCase(doc_repo)
        doc = await uc.execute(document_id, current_user.id)
        return DocumentResponse(
            id=doc.id,
            user_id=doc.user_id,
            title=doc.title,
            file_type=doc.file_type.value,
            file_size_bytes=doc.file_size_bytes,
            processing_status=doc.processing_status.value,
            page_count=doc.page_count,
            chunk_count=doc.chunk_count,
            created_at=doc.created_at,
            updated_at=doc.updated_at,
        )
    except DocumentNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
    except AuthorizationError as exc:
        raise HTTPException(status_code=403, detail=str(exc))
