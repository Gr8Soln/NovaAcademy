from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Optional, Dict, Any
from uuid import UUID, uuid4

class QuizType(str, Enum):
    MCQ = "mcq"
    THEORY = "theory"
    FLASHCARD = "flashcard"

class AIActionType(str, Enum):
    ANSWER_QUESTION = "answer_question"
    GENERATE_QUIZ = "generate_quiz"
    EXPLAIN_DOCUMENT = "explain_document"
    ANALYZE_PERFORMANCE = "analyze_performance"

@dataclass
class QuizQuestion:
    id: UUID = field(default_factory=uuid4)
    question_text: str = ""
    options: List[str] = field(default_factory=list)
    correct_answer: str = ""
    explanation: Optional[str] = None

@dataclass
class Quiz:
    title: str
    quiz_type: QuizType
    questions: List[QuizQuestion]
    document_id: Optional[UUID] = None
    class_id: Optional[UUID] = None
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class PerformanceAnalysis:
    student_id: UUID
    class_id: UUID
    strong_areas: List[str]
    weak_areas: List[str]
    recommendations: List[str]
    summary: str
    id: UUID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=datetime.utcnow)

@dataclass
class NovaState:
    """State for LangGraph agent."""
    messages: List[Dict[str, Any]] = field(default_factory=list)
    user_id: Optional[UUID] = None
    class_id: Optional[UUID] = None
    document_id: Optional[UUID] = None
    action_type: Optional[AIActionType] = None
    context_chunks: List[str] = field(default_factory=list)
    generated_content: Any = None # Can be Quiz, PerformanceAnalysis, or str
