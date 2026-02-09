"""SQLAlchemy ORM models — separate from domain entities."""

from __future__ import annotations

import uuid
from datetime import datetime

from sqlalchemy import (
    JSON,
    Boolean,
    Column,
    DateTime,
    Enum,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import DeclarativeBase, relationship


class Base(DeclarativeBase):
    pass


class UserModel(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(320), unique=True, nullable=False, index=True)
    full_name = Column(String(256), nullable=False)
    hashed_password = Column(String(256), nullable=True)
    auth_provider = Column(String(16), nullable=False, default="email")
    google_sub = Column(String(256), unique=True, nullable=True, index=True)
    avatar_url = Column(String(512), nullable=True)
    is_active = Column(Boolean, default=True, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    documents = relationship("DocumentModel", back_populates="user", cascade="all, delete-orphan")


class DocumentModel(Base):
    __tablename__ = "documents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(512), nullable=False)
    file_path = Column(String(1024), nullable=False)
    file_type = Column(String(16), nullable=False)
    file_size_bytes = Column(Integer, nullable=False, default=0)
    processing_status = Column(String(16), nullable=False, default="pending")
    page_count = Column(Integer, nullable=True)
    chunk_count = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    user = relationship("UserModel", back_populates="documents")
    chunks = relationship("DocumentChunkModel", back_populates="document", cascade="all, delete-orphan")


class DocumentChunkModel(Base):
    __tablename__ = "document_chunks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    chunk_index = Column(Integer, nullable=False, default=0)
    content = Column(Text, nullable=False)
    page_number = Column(Integer, nullable=True)
    token_count = Column(Integer, nullable=False, default=0)
    embedding_id = Column(String(256), nullable=True)
    metadata_ = Column("metadata", JSON, nullable=True, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    document = relationship("DocumentModel", back_populates="chunks")


class QuizModel(Base):
    __tablename__ = "quizzes"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    title = Column(String(512), nullable=False)
    description = Column(Text, nullable=True, default="")
    total_questions = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    questions = relationship("QuizQuestionModel", back_populates="quiz", cascade="all, delete-orphan")


class QuizQuestionModel(Base):
    __tablename__ = "quiz_questions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    quiz_id = Column(UUID(as_uuid=True), ForeignKey("quizzes.id", ondelete="CASCADE"), nullable=False, index=True)
    question_text = Column(Text, nullable=False)
    question_type = Column(String(32), nullable=False, default="multiple_choice")
    options = Column(JSON, nullable=True, default=list)
    correct_answer = Column(Text, nullable=False)
    explanation = Column(Text, nullable=True, default="")
    difficulty = Column(String(16), nullable=False, default="medium")
    source_chunk_ids = Column(JSON, nullable=True, default=list)
    order_ = Column("order", Integer, nullable=False, default=0)

    quiz = relationship("QuizModel", back_populates="questions")


class StudentProgressModel(Base):
    __tablename__ = "student_progress"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    document_id = Column(UUID(as_uuid=True), ForeignKey("documents.id", ondelete="CASCADE"), nullable=False, index=True)
    topic_mastery = Column(JSON, nullable=True, default=dict)
    quizzes_taken = Column(Integer, nullable=False, default=0)
    questions_answered = Column(Integer, nullable=False, default=0)
    correct_answers = Column(Integer, nullable=False, default=0)
    total_study_time_seconds = Column(Integer, nullable=False, default=0)
    last_study_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
