from typing import Annotated, Dict, Any, List
from typing_extensions import TypedDict

from langgraph.graph import StateGraph, END
from langgraph.graph.message import add_messages
from langchain_openai import ChatOpenAI
from langchain_core.messages import BaseMessage, HumanMessage, SystemMessage

from app.domain.entities.ai_entity import NovaState, AIActionType
from app.application.use_cases.tutor_usecases import TutorUseCase
from app.application.use_cases.ai_use_cases import GenerateQuizUseCase

class AgentState(TypedDict):
    messages: Annotated[List[BaseMessage], add_messages]
    context: Dict[str, Any]

class NovaAgent:
    """The core LangGraph-based agent for NovaAI."""

    def __init__(
        self, 
        model_name: str = "gpt-4",
        tutor_use_case: TutorUseCase = None,
        quiz_use_case: GenerateQuizUseCase = None
    ):
        self.llm = ChatOpenAI(model=model_name)
        self.tutor_use_case = tutor_use_case
        self.quiz_use_case = quiz_use_case
        self.graph = self._build_graph()

    def _build_graph(self):
        workflow = StateGraph(AgentState)

        # Define nodes
        workflow.add_node("router", self._route_node)
        workflow.add_node("tutor", self._tutor_node)
        workflow.add_node("quiz_gen", self._quiz_gen_node)

        # Build edges
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
        """Analyze user intent and route accordingly."""
        last_message = state["messages"][-1].content.lower()
        
        if "quiz" in last_message or "mcq" in last_message:
            return {"context": {"action": "quiz"}}
        return {"context": {"action": "tutor"}}

    def _routing_logic(self, state: AgentState):
        action = state["context"].get("action")
        if action == "quiz":
            return "quiz"
        return "tutor"

    async def _tutor_node(self, state: AgentState):
        """Consult materials and answer questions."""
        if not self.tutor_use_case:
            response = await self.llm.ainvoke(state["messages"])
            return {"messages": [response]}
        
        # Get last user question
        question = state["messages"][-1].content
        user_id = state["context"].get("user_id")
        class_id = state["context"].get("class_id")
        
        # Note: In a real implementation, we'd need to pass user_id/class_id via context
        answer = await self.tutor_use_case.execute(
            question=question,
            user_id=user_id,
            class_id=class_id
        )
        return {"messages": [HumanMessage(content=answer)]}

    async def _quiz_gen_node(self, state: AgentState):
        """Generate a quiz."""
        if not self.quiz_use_case:
            return {"messages": [HumanMessage(content="I'm sorry, I cannot generate quizzes right now.")]}
            
        user_id = state["context"].get("user_id")
        class_id = state["context"].get("class_id")
        
        quiz = await self.quiz_use_case.execute(
            user_id=user_id,
            class_id=class_id,
            quiz_type=QuizType.MCQ,
            num_questions=5
        )
        
        response = f"I've generated a quiz for you: {quiz.title}. You can start it in the quiz section!"
        return {"messages": [HumanMessage(content=response)]}

    async def run(self, input_text: str, user_id: Any = None, class_id: Any = None, conversation_id: str = None):
        """Execute the graph."""
        initial_state = {
            "messages": [HumanMessage(content=input_text)],
            "context": {
                "user_id": user_id,
                "class_id": class_id
            }
        }
        config = {"configurable": {"thread_id": conversation_id}} if conversation_id else {}
        return await self.graph.ainvoke(initial_state, config=config)
