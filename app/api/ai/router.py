"""AI endpoints — Q&A (SSE), summaries, quizzes, flashcards."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse

from app.core.dependencies import (get_current_user, get_document_repository,
                                   get_embedding_service, get_llm_service,
                                   get_quiz_repository, get_vector_repository)
from app.domain.entities.user import User
from app.domain.exceptions import DocumentNotFoundError
from app.interfaces.repositories.document_repository import IDocumentRepository
from app.interfaces.repositories.quiz_repository import IQuizRepository
from app.interfaces.repositories.vector_repository import IVectorRepository
from app.interfaces.services.embedding_service import IEmbeddingService
from app.interfaces.services.llm_service import ILLMService
from app.schemas.ai import (AskQuestionRequest, FlashcardResponse,
                            FlashcardsResponse, GenerateFlashcardsRequest,
                            GenerateQuizRequest, GenerateSummaryRequest)
from app.schemas.quizzes import QuizQuestionResponse, QuizResponse
from app.schemas.response import success_response
from app.use_cases.ai import (AskQuestionUseCase, GenerateFlashcardsUseCase,
                              GenerateQuizUseCase, GenerateSummaryUseCase)
from app.utils.sse import sse_stream

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/ask")
async def ask_question(
    body: AskQuestionRequest,
    doc_repo: IDocumentRepository = Depends(get_document_repository),
    vector_repo: IVectorRepository = Depends(get_vector_repository),
    embedding_service: IEmbeddingService = Depends(get_embedding_service),
    llm_service: ILLMService = Depends(get_llm_service),
    current_user: User = Depends(get_current_user),
):
    """RAG Q&A with SSE streaming response."""
    try:
        uc = AskQuestionUseCase(doc_repo, vector_repo, embedding_service, llm_service)
        token_stream = uc.execute(body.document_id, body.question, body.top_k)
        return StreamingResponse(sse_stream(token_stream), media_type="text/event-stream")
    except DocumentNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/summary")
async def generate_summary(
    body: GenerateSummaryRequest,
    doc_repo: IDocumentRepository = Depends(get_document_repository),
    llm_service: ILLMService = Depends(get_llm_service),
    current_user: User = Depends(get_current_user),
):
    """Generate a document summary with SSE streaming."""
    try:
        uc = GenerateSummaryUseCase(doc_repo, llm_service)
        token_stream = uc.execute(body.document_id)
        return StreamingResponse(sse_stream(token_stream), media_type="text/event-stream")
    except DocumentNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/quiz")
async def generate_quiz(
    body: GenerateQuizRequest,
    doc_repo: IDocumentRepository = Depends(get_document_repository),
    quiz_repo: IQuizRepository = Depends(get_quiz_repository),
    llm_service: ILLMService = Depends(get_llm_service),
    current_user: User = Depends(get_current_user),
):
    try:
        uc = GenerateQuizUseCase(doc_repo, quiz_repo, llm_service)
        quiz = await uc.execute(current_user.id, body.document_id, body.num_questions)
        return success_response(
            data=QuizResponse(
                id=quiz.id,
                user_id=quiz.user_id,
                document_id=quiz.document_id,
                title=quiz.title,
                description=quiz.description,
                total_questions=quiz.total_questions,
                created_at=quiz.created_at,
                questions=[
                    QuizQuestionResponse(
                        id=q.id,
                        question_text=q.question_text,
                        question_type=q.question_type.value,
                        options=q.options,
                        correct_answer=q.correct_answer,
                        explanation=q.explanation,
                        difficulty=q.difficulty.value,
                        order=q.order,
                    )
                    for q in quiz.questions
                ],
            ).model_dump(mode="json"),
            message="Quiz generated",
        )
    except DocumentNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))


@router.post("/flashcards")
async def generate_flashcards(
    body: GenerateFlashcardsRequest,
    doc_repo: IDocumentRepository = Depends(get_document_repository),
    llm_service: ILLMService = Depends(get_llm_service),
    current_user: User = Depends(get_current_user),
):
    try:
        uc = GenerateFlashcardsUseCase(doc_repo, llm_service)
        cards = await uc.execute(body.document_id, body.num_cards)
        return success_response(
            data=FlashcardsResponse(
                flashcards=[FlashcardResponse(front=c.front, back=c.back) for c in cards]
            ).model_dump(mode="json"),
            message="Flashcards generated",
        )
    except DocumentNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc))
