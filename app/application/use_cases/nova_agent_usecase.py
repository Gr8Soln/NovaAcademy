import uuid
from typing import Any, Dict, List, Annotated
from typing_extensions import TypedDict

from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.application.interfaces.llm_interface import ILLMInterface
from app.application.use_cases.tutor_usecases import TutorUseCase
from app.application.use_cases.ai_use_cases import GenerateQuizUseCase
from app.adapters.agents.prompt_service import PromptService
from app.domain.entities.ai_entity import QuizType


class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    context: Dict[str, Any]


class NovaAgentUseCase:
    """
    Use case that orchestration the Nova AI agentic flow using LangGraph.
    It takes an ILLMInterface, allowing flexibility between different LLM providers.
    """

    def __init__(
        self,
        llm: ILLMInterface,
        tutor_use_case: TutorUseCase,
        quiz_use_case: GenerateQuizUseCase,
        prompt_service: PromptService
    ):
        self._llm = llm
        self._tutor_use_case = tutor_use_case
        self._quiz_use_case = quiz_use_case
        self._prompt_service = prompt_service
        self._graph = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(AgentState)

        workflow.add_node("router", self._route_node)
        workflow.add_node("tutor", self._tutor_node)
        workflow.add_node("quiz_gen", self._quiz_gen_node)

        workflow.set_entry_point("router")
        workflow.add_conditional_edges(
            "router",
            self._routing_logic,
            {
                "tutor": "tutor",
                "quiz": "quiz_gen",
                "end": END
            }
        )
        workflow.add_edge("tutor", END)
        workflow.add_edge("quiz_gen", END)

        return workflow.compile()

    async def _route_node(self, state: AgentState):
        """Analyze user intent using a dynamic prompt."""
        last_message = state["messages"][-1].content
        
        prompt = self._prompt_service.get_prompt("router", {"user_message": last_message})
        
        # Use our LLM interface
        # We need a way to 'complete' with the prompt. 
        # Since ILLMInterface is high-level, we use it directly.
        action = await self._llm.complete(prompt)
        action = action.strip().lower()
        
        if "quiz" in action:
            return {"context": {"action": "quiz"}}
        return {"context": {"action": "tutor"}}

    def _routing_logic(self, state: AgentState):
        action = state["context"].get("action")
        if action == "quiz":
            return "quiz"
        return "tutor"

    async def _tutor_node(self, state: AgentState):
        """Handle tutoring requests using context-aware prompts."""
        question = state["messages"][-1].content
        user_id = state["context"].get("user_id")
        class_id = state["context"].get("class_id")

        # 1. Retrieve context (via TutorUseCase)
        # Note: TutorUseCase currently does LLM call internally, 
        # but here we might just want the retrieval part if we want Nova to handle the final chain.
        # However, to keep it simple and reuse existing logic:
        answer = await self._tutor_use_case.execute(
            question=question,
            user_id=user_id,
            class_id=class_id
        )
        
        return {"messages": [HumanMessage(content=answer)]}

    async def _quiz_gen_node(self, state: AgentState):
        """Handle quiz generation."""
        user_id = state["context"].get("user_id")
        class_id = state["context"].get("class_id")
        
        quiz = await self._quiz_use_case.execute(
            user_id=user_id,
            class_id=class_id,
            quiz_type=QuizType.MCQ,
            num_questions=5
        )
        
        response = f"I've generated a quiz for you: {quiz.title}. You can start it in the quiz section!"
        return {"messages": [HumanMessage(content=response)]}

    async def execute(
        self, 
        input_text: str, 
        user_id: uuid.UUID = None, 
        class_id: uuid.UUID = None, 
        conversation_id: str = None
    ) -> Dict[str, Any]:
        """Execute the agentic workflow."""
        initial_state = {
            "messages": [HumanMessage(content=input_text)],
            "context": {
                "user_id": user_id,
                "class_id": class_id
            }
        }
        
        # LangGraph dynamic execution
        # Note: We use a wrapper since we can't easily use LangChain's Runnable directly 
        # with our custom ILLMInterface without an adapter.
        # However, for now, the nodes handle the calls.
        
        return await self._graph.ainvoke(initial_state)
