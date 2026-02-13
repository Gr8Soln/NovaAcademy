"""Dashboard API router."""

from __future__ import annotations

from fastapi import APIRouter, Depends

from app.core.dependencies import (get_current_user, get_document_repository,
                                   get_student_progress_repository)
from app.domain.entities.user import User
from app.interfaces.repositories.document_repository import IDocumentRepository
from app.interfaces.repositories.student_progress_repository import \
    IStudentProgressRepository
from app.schemas.dashboard import DashboardResponse, ProgressResponse
from app.schemas.response import success_response
from app.use_cases.student import GetDashboardUseCase

router = APIRouter(prefix="/dashboard", tags=["dashboard"])


@router.get("/")
async def get_dashboard(
    doc_repo: IDocumentRepository = Depends(get_document_repository),
    progress_repo: IStudentProgressRepository = Depends(get_student_progress_repository),
    current_user: User = Depends(get_current_user),
):
    uc = GetDashboardUseCase(doc_repo, progress_repo)
    data = await uc.execute(current_user.id)
    return success_response(
        data=DashboardResponse(
            total_documents=data.total_documents,
            total_quizzes_taken=data.total_quizzes_taken,
            overall_accuracy=data.overall_accuracy,
            total_study_time_seconds=data.total_study_time_seconds,
            recent_documents=[
                {
                    "id": str(d.id),
                    "title": d.title,
                    "status": d.processing_status.value,
                    "created_at": d.created_at.isoformat(),
                }
                for d in data.documents[:10]
            ],
            progress_records=[
                ProgressResponse(
                    id=p.id,
                    user_id=p.user_id,
                    document_id=p.document_id,
                    topic_mastery=p.topic_mastery,
                    quizzes_taken=p.quizzes_taken,
                    questions_answered=p.questions_answered,
                    correct_answers=p.correct_answers,
                    accuracy=p.accuracy,
                    total_study_time_seconds=p.total_study_time_seconds,
                    last_study_at=p.last_study_at,
                )
                for p in data.progress_records
            ],
        ).model_dump(mode="json"),
        message="Dashboard retrieved",
    )
