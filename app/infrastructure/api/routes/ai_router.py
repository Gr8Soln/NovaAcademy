from uuid import UUID
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from app.adapters.schemas import success_response
from app.application.use_cases.tutor_usecases import TutorUseCase
from app.domain.entities import User
from app.infrastructure.api.dependencies import (
    get_current_user, get_tutor_usecase
)

router = APIRouter(prefix="/ai", tags=["AI Tutor"])


class AskRequest(BaseModel):
    document_id: Optional[UUID] = None
    class_id: Optional[UUID] = None
    question: str
    top_k: int = 5
    stream: bool = False


@router.post("/ask")
async def ask_tutor(
    request: AskRequest,
    current_user: User = Depends(get_current_user),
    use_case: TutorUseCase = Depends(get_tutor_usecase),
):
    """
    Ask the AI tutor a question about specific documents or a class.
    Supports both streaming and non-streaming responses.
    """
    if request.stream:
        return StreamingResponse(
            use_case.execute_stream(
                question=request.question,
                user_id=current_user.id,
                document_id=request.document_id,
                class_id=request.class_id,
                top_k=request.top_k
            ),
            media_type="text/event-stream"
        )
    
    answer = await use_case.execute(
        question=request.question,
        user_id=current_user.id,
        document_id=request.document_id,
        class_id=request.class_id,
        top_k=request.top_k
    )
    return success_response(message="AI Tutor response", data={"answer": answer})
