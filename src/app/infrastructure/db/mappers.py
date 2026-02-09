"""Mapper helpers — convert between domain entities and ORM models."""

from __future__ import annotations

from app.domain.entities.document import Document, DocumentChunk, DocumentType, ProcessingStatus
from app.domain.entities.quiz import DifficultyLevel, Quiz, QuestionType, QuizQuestion
from app.domain.entities.student_progress import StudentProgress
from app.domain.entities.user import AuthProvider, User
from app.infrastructure.db.models import (
    DocumentChunkModel,
    DocumentModel,
    QuizModel,
    QuizQuestionModel,
    StudentProgressModel,
    UserModel,
)


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
