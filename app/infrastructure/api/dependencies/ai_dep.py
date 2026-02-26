from fastapi import Depends
from app.application.use_cases.ai_use_cases import GenerateQuizUseCase, AnalyzeStudentPerformanceUseCase
from app.application.interfaces.llm_interface import ILLMInterface
from app.application.use_cases.document_usecases import SearchDocumentsUseCase
from app.infrastructure.api.dependencies.core_dep import get_llm_service
from app.infrastructure.api.dependencies.document_dep import get_search_documents_usecase
from app.infrastructure.api.dependencies.tutor_dep import get_tutor_usecase
from app.application.use_cases.nova_agent_usecase import NovaAgentUseCase
from app.adapters.agents.prompt_service import PromptService
from app.application.use_cases.tutor_usecases import TutorUseCase

async def get_prompt_service() -> PromptService:
    return PromptService()

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
    tutor_use_case: TutorUseCase = Depends(get_tutor_usecase),
    quiz_use_case: GenerateQuizUseCase = Depends(get_generate_quiz_usecase),
    prompt_service: PromptService = Depends(get_prompt_service)
) -> NovaAgentUseCase:
    return NovaAgentUseCase(
        llm=llm, 
        tutor_use_case=tutor_use_case, 
        quiz_use_case=quiz_use_case,
        prompt_service=prompt_service
    )
