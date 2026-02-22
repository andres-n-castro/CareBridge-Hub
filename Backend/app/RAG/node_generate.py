import logging

from app.llm_parse.parser import generate_form
from .state import GraphState

logger = logging.getLogger(__name__)


def initialization_node(state: GraphState) -> dict:
    logger.info("[RAG] initialization_node: generating initial form from transcript")
    extracted = generate_form(state["transcript"])
    logger.info("[RAG] initialization_node: form generated successfully")
    logger.debug("[RAG] initialization_node: extracted_form=%s", extracted)
    return {"extracted_form": extracted, "loop_count": 0}
