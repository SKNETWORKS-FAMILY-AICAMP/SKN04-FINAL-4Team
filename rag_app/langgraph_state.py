from typing import TypedDict, Annotated
from langgraph.graph.message import add_messages


class State(TypedDict):
    question: Annotated[list, add_messages]
    context: Annotated[str, "Context"]
    answer: Annotated[str, "Answer"]
    generation: Annotated[str, "LLM generated answer"]
    # messages: Annotated[list, add_messages]
    domain: Annotated[str, "Domain"]
    filter: Annotated[str, "Filter"]