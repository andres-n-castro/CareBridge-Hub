from app.llm_parse.parser import generate_form
from .state import GraphState


def initialization_node(state: GraphState) -> dict:
    extracted = generate_form(state["transcript"])
    return {"extracted_form": extracted}
