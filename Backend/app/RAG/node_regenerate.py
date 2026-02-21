from __future__ import annotations
import json

from langchain_openai import ChatOpenAI

from app.schemas.patient import PatientCreate
from .prompts import REGENERATE_SYSTEM_PROMPT
from .state import GraphState


_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
_corrector = _llm.with_structured_output(PatientCreate)


def regenerate_node(state: GraphState) -> dict:
    errors_block = "\n".join(f"- {e}" for e in state["verification_errors"])

    user_message = (
        f"RAW TRANSCRIPT:\n{state['transcript']}\n\n"
        f"PREVIOUSLY EXTRACTED JSON:\n{json.dumps(state['extracted_form'], indent=2)}\n\n"
        f"VERIFICATION ERRORS:\n{errors_block}"
    )

    corrected: PatientCreate = _corrector.invoke([
        {"role": "system", "content": REGENERATE_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ])

    return {"extracted_form": corrected.model_dump()}
