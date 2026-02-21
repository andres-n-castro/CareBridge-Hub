from __future__ import annotations
import json
from pathlib import Path

from langchain_openai import ChatOpenAI

from .prompts import REGENERATE_SYSTEM_PROMPT
from .state import GraphState

with open(Path(__file__).parent.parent / "LLM Parse" / "schema.json", encoding="utf-8") as f:
    _SCHEMA = json.load(f)

_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
_corrector = _llm.with_structured_output(schema=_SCHEMA)


def regenerate_node(state: GraphState) -> dict:
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

    return {"extracted_form": corrected}
