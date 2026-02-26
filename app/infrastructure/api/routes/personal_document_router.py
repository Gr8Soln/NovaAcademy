from typing import Optional
from uuid import UUID

from fastapi import (APIRouter, Depends, File, Form, HTTPException, Query,
                     UploadFile, status)

from app.adapters.schemas import (DocumentResponse, UploadDocumentResponse,
                                   generate_pagination, success_response)
from app.application.use_cases import (DeleteDocumentUseCase,
                                       GetDocumentUseCase,
                                       ListDocumentsUseCase,
                                       UploadDocumentUseCase)
from app.core.logging import get_logger
from app.domain.entities import User
from app.infrastructure.api.dependencies import (get_current_user,
                                                 get_delete_document_usecase,
                                                 get_get_document_usecase,
                                                 get_list_documents_usecase,
                                                 get_upload_document_usecase)
from app.infrastructure.tasks import process_document

logger = get_logger(__name__)

router = APIRouter(prefix="/documents", tags=["Personal Documents"])

# ── Helpers ───────────────────────────────────────────────────────────

def _doc_response(doc) -> DocumentResponse:
    return DocumentResponse(
        id=doc.id,
        user_id=doc.user_id,
        class_id=doc.class_id,
        title=doc.title,
        file_type=doc.file_type,
        file_size_bytes=doc.file_size_bytes,
        processing_status=doc.processing_status.value,
        page_count=doc.page_count,
        chunk_count=doc.chunk_count,
        file_url=doc.file_url,
        created_at=doc.created_at,
        updated_at=doc.updated_at,
    )


# ── Endpoints ─────────────────────────────────────────────────────────

@router.post("/", status_code=status.HTTP_201_CREATED)
async def upload_personal_document(
    file: UploadFile = File(..., description="Document file (PDF, TXT, DOCX, MD)"),
    title: Optional[str] = Form(None, description="Display title; defaults to filename"),
    current_user: User = Depends(get_current_user),
    use_case: UploadDocumentUseCase = Depends(get_upload_document_usecase),
):
    """
    Upload a personal document (not linked to a class).
    """
    try:
        document = await use_case.execute(
            file=file,
            user_id=current_user.id,
            class_id=None,  # This makes it personal
            title=title,
        )
        
        # Process the document in background
        process_document.delay(str(document.id))
        
        return success_response(
            message="Document uploaded to your personal library.",
            data=UploadDocumentResponse(
                document=_doc_response(document)
            ).model_dump(mode="json"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/")
async def list_personal_documents(
    offset: int = Query(0, ge=0),
    limit: int = Query(24, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    use_case: ListDocumentsUseCase = Depends(get_list_documents_usecase),
):
    """List all documents belonging to the user (personal and shared)."""
    documents, total = await use_case.execute(
        user_id=current_user.id,
        offset=offset,
        limit=limit,
        class_id=None, # List all
    )
    page = offset // limit + 1 if limit else 1
    pagination = generate_pagination(
        current_page=page,
        page_size=limit,
        total_data=total,
        total_fetched=len(documents),
    )
    return success_response(
        message="Personal library retrieved",
        data=[_doc_response(d).model_dump(mode="json") for d in documents],
        metadata=pagination,
    )


@router.get("/{document_id}")
async def get_document_global(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    use_case: GetDocumentUseCase = Depends(get_get_document_usecase),
):
    """Retrieve any document belonging to the user by its unique ID."""
    try:
        document = await use_case.execute(
            document_id=document_id, user_id=current_user.id
        )
        return success_response(
            message="Document retrieved",
            data=_doc_response(document).model_dump(mode="json"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.delete("/{document_id}")
async def delete_document_global(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    use_case: DeleteDocumentUseCase = Depends(get_delete_document_usecase),
):
    """Permanently delete a document from the personal library."""
    try:
        await use_case.execute(document_id=document_id, user_id=current_user.id)
        return success_response(message="Document deleted successfully")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
