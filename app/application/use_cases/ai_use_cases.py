import uuid
from typing import List, Optional
from app.domain.entities.ai_entity import Quiz, QuizType, PerformanceAnalysis
from app.application.interfaces.llm_interface import ILLMInterface
from app.application.use_cases.document_usecases import SearchDocumentsUseCase

class GenerateQuizUseCase:
    """Use case to generate a quiz from documents."""
    
    SYSTEM_PROMPT = """You are Nova, an expert educational content generator.
Your task is to generate a quiz based on the provided study materials.
Follow the requested format (MCQ, Theory, or Flashcard) strictly.
For MCQ, provide 4 options and the correct answer with an explanation."""

    def __init__(self, llm: ILLMInterface, search_use_case: SearchDocumentsUseCase):
        self._llm = llm
        self._search_use_case = search_use_case

    async def execute(
        self, 
        user_id: uuid.UUID,
        quiz_type: QuizType = QuizType.MCQ,
        document_id: Optional[uuid.UUID] = None,
        class_id: Optional[uuid.UUID] = None,
        num_questions: int = 5
    ) -> Quiz:
        # Retrieve context
        context_chunks = await self._search_use_case.execute(
            query="Key concepts and main points for quiz generation",
            user_id=user_id,
            class_id=class_id,
            top_k=10
        )
        
        if document_id:
            context_chunks = [c for c in context_chunks if c.get("document_id") == str(document_id)]

        context_text = "\n\n".join([c["content"] for c in context_chunks])
        
        prompt = f"""Generate a {quiz_type.value} quiz with {num_questions} questions.
Context:
{context_text}

Output format: JSON with a 'title' and a list of 'questions' each having 'question_text', 'options' (if MCQ), 'correct_answer', and 'explanation'."""

        # In a real implementation, we'd use structured output parsing here.
        # For now, we'll assume a helper or just direct completion.
        response = await self._llm.complete(prompt, system_message=self.SYSTEM_PROMPT)
        
        # Parse response into Quiz entity (simplified for now)
        # Note: Proper parsing into Quiz entity would go here.
        return Quiz(
            title=f"Quiz on {document_id or 'Course Materials'}",
            quiz_type=quiz_type,
            questions=[], # Questions would be parsed from response
            document_id=document_id,
            class_id=class_id
        )

class AnalyzeStudentPerformanceUseCase:
    """Use case to analyze student performance and identify gaps."""
    
    SYSTEM_PROMPT = """You are Nova, an expert academic advisor.
Analyze the student's performance data and provide insights into their strong and weak areas."""

    def __init__(self, llm: ILLMInterface):
        self._llm = llm

    async def execute(self, student_id: uuid.UUID, class_id: uuid.UUID) -> PerformanceAnalysis:
        # This would normally pull from a PerformanceRepository
        # For now, placeholder metrics
        prompt = f"Analyze performance for student {student_id} in class {class_id}."
        
        # response = await self._llm.complete(prompt, system_message=self.SYSTEM_PROMPT)
        
        return PerformanceAnalysis(
            student_id=student_id,
            class_id=class_id,
            strong_areas=["Concept A", "Concept B"],
            weak_areas=["Concept C"],
            recommendations=["Review Chapter 3", "Practice more MCQs on Concept C"],
            summary="Overall good progress, but needs focus on specific advanced topics."
        )
