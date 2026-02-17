import uuid

from pydantic import BaseModel, Field


class AskQuestionRequest(BaseModel):
    document_id: uuid.UUID
    question: str = Field(..., min_length=1, max_length=2000)
    top_k: int = Field(default=5, ge=1, le=20)


class GenerateSummaryRequest(BaseModel):
    document_id: uuid.UUID


class GenerateQuizRequest(BaseModel):
    document_id: uuid.UUID
    num_questions: int = Field(default=10, ge=1, le=50)


class GenerateFlashcardsRequest(BaseModel):
    document_id: uuid.UUID
    num_cards: int = Field(default=20, ge=1, le=100)


class FlashcardResponse(BaseModel):
    front: str
    back: str


class FlashcardsResponse(BaseModel):
    flashcards: list[FlashcardResponse]
