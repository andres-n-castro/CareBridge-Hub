from __future__ import annotations
import logging
from typing import Literal

from langgraph.graph import StateGraph, START, END

from .state import GraphState, MAX_LOOPS
from .node_generate import initialization_node
from .node_verify import verify_node
from .node_regenerate import regenerate_node

logger = logging.getLogger(__name__)


def _route_after_verify(state: GraphState) -> Literal["regenerate_node", "__end__"]:
    if state["is_valid"]:
        logger.info("[RAG] router: form validated — done")
        return END

    if state.get("loop_count", 0) >= MAX_LOOPS:
        logger.warning(
            "[RAG] router: loop limit (%d) reached — returning best form despite errors: %s",
            MAX_LOOPS,
            state["verification_errors"],
        )
        return END

    return "regenerate_node"


builder = StateGraph(GraphState)

builder.add_node("initialization_node", initialization_node)
builder.add_node("verify_node", verify_node)
builder.add_node("regenerate_node", regenerate_node)

builder.add_edge(START, "initialization_node")
builder.add_edge("initialization_node", "verify_node")
builder.add_conditional_edges("verify_node", _route_after_verify)
builder.add_edge("regenerate_node", "verify_node")

compiled_graph = builder.compile()
