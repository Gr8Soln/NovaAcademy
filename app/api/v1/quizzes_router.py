"""Quiz API router."""

from __future__ import annotations

import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.dependencies import (get_current_user, get_quiz_repository,
                                   get_student_progress_repository)
from app.domain.entities.user import User
from app.domain.exceptions import QuizNotFoundError
from app.interfaces.repositories.quiz_repository import IQuizRepository
from app.interfaces.repositories.student_progress_repository import \
    IStudentProgressRepository
from app.schemas.quizzes import (QuizQuestionResponse, QuizResponse,
                                 QuizResultResponse, SubmitQuizRequest)
from app.schemas.response import paginated_response, success_response
from app.use_cases.student import RecordQuizResultUseCase

router = APIRouter(prefix="/quizzes", tags=["quizzes"])


@router.get("/")
async def list_quizzes(
    offset: int = 0,
    limit: int = 20,
    quiz_repo: IQuizRepository = Depends(get_quiz_repository),
    current_user: User = Depends(get_current_user),
):
    quizzes = await quiz_repo.list_by_user(current_user.id, offset=offset, limit=limit)
    total = await quiz_repo.count_by_user(current_user.id)
    return paginated_response(
        data=[
            QuizResponse(
                id=q.id,
                user_id=q.user_id,
                document_id=q.document_id,
                title=q.title,
                description=q.description,
                total_questions=q.total_questions,
                created_at=q.created_at,
                questions=[
                    QuizQuestionResponse(
                        id=qq.id,
                        question_text=qq.question_text,
                        question_type=qq.question_type.value,
                        options=qq.options,
                        correct_answer=qq.correct_answer,
                        explanation=qq.explanation,
                        difficulty=qq.difficulty.value,
                        order=qq.order,
                    )
                    for qq in q.questions
                ],
            ).model_dump(mode="json")
            for q in quizzes
        ],
        message="Quizzes retrieved",
        total=total,
        offset=offset,
        limit=limit,
    )


@router.get("/{quiz_id}")
async def get_quiz(
    quiz_id: uuid.UUID,
    quiz_repo: IQuizRepository = Depends(get_quiz_repository),
    current_user: User = Depends(get_current_user),
):
    quiz = await quiz_repo.get_by_id(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")
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
        message="Quiz retrieved",
    )


@router.post("/{quiz_id}/submit")
async def submit_quiz(
    quiz_id: uuid.UUID,
    body: SubmitQuizRequest,
    quiz_repo: IQuizRepository = Depends(get_quiz_repository),
    progress_repo: IStudentProgressRepository = Depends(get_student_progress_repository),
    current_user: User = Depends(get_current_user),
):
    quiz = await quiz_repo.get_by_id(quiz_id)
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz not found")

    correct, total = quiz.score(body.answers)

    uc = RecordQuizResultUseCase(progress_repo)
    await uc.execute(current_user.id, quiz.document_id, correct, total)

    return success_response(
        data=QuizResultResponse(
            quiz_id=quiz.id,
            correct=correct,
            total=total,
            accuracy=correct / total if total > 0 else 0.0,
        ).model_dump(mode="json"),
        message="Quiz submitted",
    )
