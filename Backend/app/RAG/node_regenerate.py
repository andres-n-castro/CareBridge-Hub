from __future__ import annotations
import json
import logging
from pathlib import Path

from langchain_openai import ChatOpenAI

from .prompts import REGENERATE_SYSTEM_PROMPT
from .state import GraphState

logger = logging.getLogger(__name__)

with open(Path(__file__).parent.parent / "LLM Parse" / "schema.json", encoding="utf-8") as f:
    _SCHEMA = {**json.load(f), "title": "nurse_shift_handoff"}

_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
_corrector = _llm.with_structured_output(schema=_SCHEMA)


def regenerate_node(state: GraphState) -> dict:
    loop = state.get("loop_count", 0) + 1
    logger.info("[RAG] regenerate_node: correcting form (loop %d)", loop)

    errors_block = "\n".join(f"- {e}" for e in state["verification_errors"])

    user_message = (
        f"RAW TRANSCRIPT:\n{state['transcript']}\n\n"
        f"PREVIOUSLY EXTRACTED JSON:\n{json.dumps(state['extracted_form'], indent=2)}\n\n"
        f"VERIFICATION ERRORS:\n{errors_block}"
    )

    corrected: dict = _corrector.invoke([
        {"role": "system", "content": REGENERATE_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ])

    logger.info("[RAG] regenerate_node: correction complete")
    return {"extracted_form": corrected, "loop_count": loop}
