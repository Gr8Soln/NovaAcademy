"""Mapper helpers — convert between domain entities and ORM models."""

from __future__ import annotations

from app.domain.entities.challenge import Challenge, ChallengeStatus
from app.domain.entities.document import (Document, DocumentChunk,
                                          DocumentType, ProcessingStatus)
from app.domain.entities.notification import Notification, NotificationType
from app.domain.entities.point_transaction import PointAction, PointTransaction
from app.domain.entities.quiz import (DifficultyLevel, QuestionType, Quiz,
                                      QuizQuestion)
from app.domain.entities.student_progress import StudentProgress
from app.domain.entities.study_session import StudySession
from app.domain.entities.user import AuthProvider, User
from app.infrastructure.db.models import (ChallengeModel, DocumentChunkModel,
                                          DocumentModel, NotificationModel,
                                          PointTransactionModel, QuizModel,
                                          QuizQuestionModel,
                                          StudentProgressModel,
                                          StudySessionModel, UserModel)

# ── User ────────────────────────────────────────────────────────

def user_model_to_entity(m: UserModel) -> User:
    return User(
        id=m.id,
        email=m.email,
        full_name=m.full_name,
        hashed_password=m.hashed_password,
        auth_provider=AuthProvider(m.auth_provider),
        google_sub=m.google_sub,
        avatar_url=m.avatar_url,
        is_active=m.is_active,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


def user_entity_to_model(e: User) -> UserModel:
    return UserModel(
        id=e.id,
        email=e.email,
        full_name=e.full_name,
        hashed_password=e.hashed_password,
        auth_provider=e.auth_provider.value,
        google_sub=e.google_sub,
        avatar_url=e.avatar_url,
        is_active=e.is_active,
        created_at=e.created_at,
        updated_at=e.updated_at,
    )


# ── Document ────────────────────────────────────────────────────

def document_model_to_entity(m: DocumentModel) -> Document:
    return Document(
        id=m.id,
        user_id=m.user_id,
        title=m.title,
        file_path=m.file_path,
        file_type=DocumentType(m.file_type),
        file_size_bytes=m.file_size_bytes,
        processing_status=ProcessingStatus(m.processing_status),
        page_count=m.page_count,
        chunk_count=m.chunk_count,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


def document_entity_to_model(e: Document) -> DocumentModel:
    return DocumentModel(
        id=e.id,
        user_id=e.user_id,
        title=e.title,
        file_path=e.file_path,
        file_type=e.file_type.value,
        file_size_bytes=e.file_size_bytes,
        processing_status=e.processing_status.value,
        page_count=e.page_count,
        chunk_count=e.chunk_count,
        created_at=e.created_at,
        updated_at=e.updated_at,
    )


# ── DocumentChunk ───────────────────────────────────────────────

def chunk_model_to_entity(m: DocumentChunkModel) -> DocumentChunk:
    return DocumentChunk(
        id=m.id,
        document_id=m.document_id,
        chunk_index=m.chunk_index,
        content=m.content,
        page_number=m.page_number,
        token_count=m.token_count,
        embedding_id=m.embedding_id,
        metadata=m.metadata_ or {},
        created_at=m.created_at,
    )


def chunk_entity_to_model(e: DocumentChunk) -> DocumentChunkModel:
    return DocumentChunkModel(
        id=e.id,
        document_id=e.document_id,
        chunk_index=e.chunk_index,
        content=e.content,
        page_number=e.page_number,
        token_count=e.token_count,
        embedding_id=e.embedding_id,
        metadata_=e.metadata,
        created_at=e.created_at,
    )


# ── Quiz ────────────────────────────────────────────────────────

def quiz_model_to_entity(m: QuizModel) -> Quiz:
    questions = [
        QuizQuestion(
            id=q.id,
            quiz_id=q.quiz_id,
            question_text=q.question_text,
            question_type=QuestionType(q.question_type),
            options=q.options or [],
            correct_answer=q.correct_answer,
            explanation=q.explanation or "",
            difficulty=DifficultyLevel(q.difficulty),
            source_chunk_ids=q.source_chunk_ids or [],
            order=q.order_,
        )
        for q in m.questions
    ]
    return Quiz(
        id=m.id,
        user_id=m.user_id,
        document_id=m.document_id,
        title=m.title,
        description=m.description or "",
        questions=questions,
        total_questions=m.total_questions,
        created_at=m.created_at,
    )


def quiz_entity_to_model(e: Quiz) -> QuizModel:
    model = QuizModel(
        id=e.id,
        user_id=e.user_id,
        document_id=e.document_id,
        title=e.title,
        description=e.description,
        total_questions=e.total_questions,
        created_at=e.created_at,
    )
    model.questions = [
        QuizQuestionModel(
            id=q.id,
            quiz_id=e.id,
            question_text=q.question_text,
            question_type=q.question_type.value,
            options=q.options,
            correct_answer=q.correct_answer,
            explanation=q.explanation,
            difficulty=q.difficulty.value,
            source_chunk_ids=q.source_chunk_ids,
            order_=q.order,
        )
        for q in e.questions
    ]
    return model


# ── StudentProgress ─────────────────────────────────────────────

def progress_model_to_entity(m: StudentProgressModel) -> StudentProgress:
    return StudentProgress(
        id=m.id,
        user_id=m.user_id,
        document_id=m.document_id,
        topic_mastery=m.topic_mastery or {},
        quizzes_taken=m.quizzes_taken,
        questions_answered=m.questions_answered,
        correct_answers=m.correct_answers,
        total_study_time_seconds=m.total_study_time_seconds,
        last_study_at=m.last_study_at,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


def progress_entity_to_model(e: StudentProgress) -> StudentProgressModel:
    return StudentProgressModel(
        id=e.id,
        user_id=e.user_id,
        document_id=e.document_id,
        topic_mastery=e.topic_mastery,
        quizzes_taken=e.quizzes_taken,
        questions_answered=e.questions_answered,
        correct_answers=e.correct_answers,
        total_study_time_seconds=e.total_study_time_seconds,
        last_study_at=e.last_study_at,
        created_at=e.created_at,
        updated_at=e.updated_at,
    )


# ── Follow ──────────────────────────────────────────────────────

def follow_model_to_entity(m: FollowModel) -> Follow:
    return Follow(
        id=m.id,
        follower_id=m.follower_id,
        following_id=m.following_id,
        created_at=m.created_at,
    )


def follow_entity_to_model(e: Follow) -> FollowModel:
    return FollowModel(
        id=e.id,
        follower_id=e.follower_id,
        following_id=e.following_id,
        created_at=e.created_at,
    )


# ── Post ────────────────────────────────────────────────────────

def post_model_to_entity(m: PostModel) -> Post:
    return Post(
        id=m.id,
        user_id=m.user_id,
        content=m.content,
        post_type=PostType(m.post_type),
        like_count=m.like_count,
        impression_count=m.impression_count,
        created_at=m.created_at,
    )


def post_entity_to_model(e: Post) -> PostModel:
    return PostModel(
        id=e.id,
        user_id=e.user_id,
        content=e.content,
        post_type=e.post_type.value,
        like_count=e.like_count,
        impression_count=e.impression_count,
        created_at=e.created_at,
    )


def post_like_model_to_entity(m: PostLikeModel) -> PostLike:
    return PostLike(
        id=m.id,
        post_id=m.post_id,
        user_id=m.user_id,
        created_at=m.created_at,
    )


def post_like_entity_to_model(e: PostLike) -> PostLikeModel:
    return PostLikeModel(
        id=e.id,
        post_id=e.post_id,
        user_id=e.user_id,
        created_at=e.created_at,
    )


# ── Notification ────────────────────────────────────────────────

def notification_model_to_entity(m: NotificationModel) -> Notification:
    return Notification(
        id=m.id,
        user_id=m.user_id,
        type=NotificationType(m.type),
        title=m.title,
        message=m.message,
        data=m.data or {},
        is_read=m.is_read,
        created_at=m.created_at,
    )


def notification_entity_to_model(e: Notification) -> NotificationModel:
    return NotificationModel(
        id=e.id,
        user_id=e.user_id,
        type=e.type.value,
        title=e.title,
        message=e.message,
        data=e.data,
        is_read=e.is_read,
        created_at=e.created_at,
    )


# ── Challenge ───────────────────────────────────────────────────

def challenge_model_to_entity(m: ChallengeModel) -> Challenge:
    return Challenge(
        id=m.id,
        challenger_id=m.challenger_id,
        opponent_id=m.opponent_id,
        document_id=m.document_id,
        quiz_id=m.quiz_id,
        question_count=m.question_count,
        wager_amount=m.wager_amount,
        status=ChallengeStatus(m.status),
        challenger_score=m.challenger_score,
        opponent_score=m.opponent_score,
        winner_id=m.winner_id,
        expires_at=m.expires_at,
        completed_at=m.completed_at,
        created_at=m.created_at,
        updated_at=m.updated_at,
    )


def challenge_entity_to_model(e: Challenge) -> ChallengeModel:
    return ChallengeModel(
        id=e.id,
        challenger_id=e.challenger_id,
        opponent_id=e.opponent_id,
        document_id=e.document_id,
        quiz_id=e.quiz_id,
        question_count=e.question_count,
        wager_amount=e.wager_amount,
        status=e.status.value,
        challenger_score=e.challenger_score,
        opponent_score=e.opponent_score,
        winner_id=e.winner_id,
        expires_at=e.expires_at,
        completed_at=e.completed_at,
        created_at=e.created_at,
        updated_at=e.updated_at,
    )


# ── PointTransaction ───────────────────────────────────────────

def point_transaction_model_to_entity(m: PointTransactionModel) -> PointTransaction:
    return PointTransaction(
        id=m.id,
        user_id=m.user_id,
        action=PointAction(m.action),
        points=m.points,
        description=m.description,
        reference_id=m.reference_id,
        created_at=m.created_at,
    )


def point_transaction_entity_to_model(e: PointTransaction) -> PointTransactionModel:
    return PointTransactionModel(
        id=e.id,
        user_id=e.user_id,
        action=e.action.value,
        points=e.points,
        description=e.description,
        reference_id=e.reference_id,
        created_at=e.created_at,
    )


# ── StudySession ────────────────────────────────────────────────

def study_session_model_to_entity(m: StudySessionModel) -> StudySession:
    return StudySession(
        id=m.id,
        user_id=m.user_id,
        document_id=m.document_id,
        started_at=m.started_at,
        last_heartbeat_at=m.last_heartbeat_at,
        ended_at=m.ended_at,
        duration_seconds=m.duration_seconds,
        is_active=m.is_active,
    )


def study_session_entity_to_model(e: StudySession) -> StudySessionModel:
    return StudySessionModel(
        id=e.id,
        user_id=e.user_id,
        document_id=e.document_id,
        started_at=e.started_at,
        last_heartbeat_at=e.last_heartbeat_at,
        ended_at=e.ended_at,
        duration_seconds=e.duration_seconds,
        is_active=e.is_active,
    )
