from typing import Optional
from uuid import UUID

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    status,
    UploadFile,
)

from app.adapters.schemas import (    
    DocumentResponse,
    UploadDocumentResponse,
    generate_pagination,
    success_response,
)
from app.application.use_cases import (
    DeleteDocumentUseCase,
    GetDocumentUseCase,
    ListDocumentsUseCase,
    SearchDocumentsUseCase,
    UploadDocumentUseCase,
)
from app.domain.entities import User
from app.infrastructure.api.dependencies import (
    get_current_user,
    get_delete_document_usecase,
    get_get_document_usecase,
    get_list_documents_usecase,
    get_search_documents_usecase,
    get_upload_document_usecase,
)

router = APIRouter(prefix="/documents", tags=["Documents"])

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
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(..., description="Document file (PDF, TXT, DOCX, MD)"),
    class_id: UUID = Form(..., description="Class this document belongs to"),
    title: Optional[str] = Form(None, description="Display title; defaults to filename"),
    current_user: User = Depends(get_current_user),
    use_case: UploadDocumentUseCase = Depends(get_upload_document_usecase),
):
    """
    Upload a document to a class.

    The file is stored immediately and the endpoint returns right away with
    `processing_status = "pending"`.  Chunking and embedding run in the
    background.  Poll `GET /documents/{id}` to track progress.
    """
    try:
        document = await use_case.execute(
            file=file,
            user_id=current_user.id,
            class_id=class_id,
            title=title,
        )
        background_tasks.add_task(use_case.process_document, document)
        return success_response(
            message="Document uploaded. Embedding is running in the background.",
            data=UploadDocumentResponse(
                document=_doc_response(document)
            ).model_dump(mode="json"),
        )
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(exc))


@router.get("/")
async def list_documents(
    offset: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    class_id: Optional[UUID] = Query(None, description="Filter by class"),
    current_user: User = Depends(get_current_user),
    use_case: ListDocumentsUseCase = Depends(get_list_documents_usecase),
):
    """List documents owned by the current user (paginated)."""
    documents, total = await use_case.execute(
        user_id=current_user.id,
        offset=offset,
        limit=limit,
        class_id=class_id,
    )
    page = offset // limit + 1 if limit else 1
    pagination = generate_pagination(
        current_page=page,
        page_size=limit,
        total_data=total,
        total_fetched=len(documents),
    )
    return success_response(
        message="Documents retrieved",
        data=[_doc_response(d).model_dump(mode="json") for d in documents],
        metadata=pagination,
    )


@router.get("/{document_id}")
async def get_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    use_case: GetDocumentUseCase = Depends(get_get_document_usecase),
):
    """Retrieve a single document by ID (must be owned by caller)."""
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


@router.delete("/{document_id}", status_code=status.HTTP_200_OK)
async def delete_document(
    document_id: UUID,
    current_user: User = Depends(get_current_user),
    use_case: DeleteDocumentUseCase = Depends(get_delete_document_usecase),
):
    """
    Permanently delete a document and ALL its data:
    - SQL records (document + chunks)
    - Qdrant vectors
    - Stored file
    """
    try:
        await use_case.execute(document_id=document_id, user_id=current_user.id)
        return success_response(message="Document deleted successfully")
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))


@router.get("/search")
async def search_documents(
    q: str = Query(..., min_length=1, description="Search query"),
    class_id: Optional[UUID] = Query(None, description="Filter by class"),
    limit: int = Query(5, ge=1, le=20, description="Top K results"),
    current_user: User = Depends(get_current_user),
    use_case: SearchDocumentsUseCase = Depends(get_search_documents_usecase),
):
    """
    Perform semantic search across documents using vector similarity.
    Returns the most relevant chunks from the caller's documents.
    """
    try:
        results = await use_case.execute(
            query=q,
            user_id=current_user.id,
            class_id=class_id,
            top_k=limit,
        )
        return success_response(
            message="Search results retrieved",
            data=results,
        )
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(exc)
        )

