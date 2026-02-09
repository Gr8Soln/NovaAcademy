"""Generate a quiz from document content."""

from __future__ import annotations

import json
import uuid

from app.domain.entities.quiz import DifficultyLevel, Quiz, QuestionType, QuizQuestion
from app.domain.exceptions import DocumentNotFoundError
from app.interfaces.repositories.document_repository import IDocumentRepository
from app.interfaces.repositories.quiz_repository import IQuizRepository
from app.interfaces.services.llm_service import ILLMService


_SYSTEM_PROMPT = (
    "You are an AI quiz generator. Given study material, create quiz questions. "
    "Return ONLY a JSON array where each element has: question_text, question_type "
    '("multiple_choice"|"true_false"|"short_answer"), options (array, for MCQ), '
    "correct_answer, explanation, difficulty (\"easy\"|\"medium\"|\"hard\")."
)


class GenerateQuizUseCase:
    def __init__(
        self,
        document_repo: IDocumentRepository,
        quiz_repo: IQuizRepository,
        llm_service: ILLMService,
    ) -> None:
        self._document_repo = document_repo
        self._quiz_repo = quiz_repo
        self._llm = llm_service

    async def execute(
        self,
        user_id: uuid.UUID,
        document_id: uuid.UUID,
        num_questions: int = 10,
    ) -> Quiz:
        doc = await self._document_repo.get_by_id(document_id)
        if not doc:
            raise DocumentNotFoundError(f"Document {document_id} not found")

        chunks = await self._document_repo.get_chunks_by_document(document_id)
        full_text = "\n\n".join(c.content for c in chunks[:30])  # limit context

        prompt = (
            f"Study material:\n\n{full_text}\n\n"
            f"Generate exactly {num_questions} quiz questions as a JSON array."
        )

        raw = await self._llm.generate(prompt, system_prompt=_SYSTEM_PROMPT, max_tokens=4096)
        questions_data = json.loads(raw)

        quiz = Quiz(user_id=user_id, document_id=document_id, title=f"Quiz – {doc.title}")
        for q in questions_data:
            quiz.add_question(
                QuizQuestion(
                    question_text=q["question_text"],
                    question_type=QuestionType(q["question_type"]),
                    options=q.get("options", []),
                    correct_answer=q["correct_answer"],
                    explanation=q.get("explanation", ""),
                    difficulty=DifficultyLevel(q.get("difficulty", "medium")),
                )
            )

        return await self._quiz_repo.create(quiz)
