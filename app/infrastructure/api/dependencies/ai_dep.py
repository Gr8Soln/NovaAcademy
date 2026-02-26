from fastapi import Depends
from app.application.use_cases.ai_use_cases import GenerateQuizUseCase, AnalyzeStudentPerformanceUseCase
from app.application.interfaces.llm_interface import ILLMInterface
from app.application.use_cases.document_usecases import SearchDocumentsUseCase
from app.infrastructure.api.dependencies.core_dep import get_llm_service
from app.infrastructure.api.dependencies.document_dep import get_search_documents_usecase
from app.adapters.agents.nova_agent import NovaAgent
from app.application.use_cases.tutor_usecases import TutorUseCase

async def get_generate_quiz_usecase(
    llm: ILLMInterface = Depends(get_llm_service),
    search_use_case: SearchDocumentsUseCase = Depends(get_search_documents_usecase)
) -> GenerateQuizUseCase:
    return GenerateQuizUseCase(llm, search_use_case)

async def get_analyze_performance_usecase(
    llm: ILLMInterface = Depends(get_llm_service)
) -> AnalyzeStudentPerformanceUseCase:
    return AnalyzeStudentPerformanceUseCase(llm)

async def get_nova_agent(
    llm: ILLMInterface = Depends(get_llm_service),
    tutor_use_case: TutorUseCase = Depends(lambda: None), # Placeholder for now to avoid circularity if any
    quiz_use_case: GenerateQuizUseCase = Depends(get_generate_quiz_usecase)
) -> NovaAgent:
    # Note: In a real app we'd configure the model name from settings
    return NovaAgent(model_name="gpt-4", tutor_use_case=tutor_use_case, quiz_use_case=quiz_use_case)
