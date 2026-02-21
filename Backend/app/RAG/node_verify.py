from __future__ import annotations
import json
from typing import List

from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from .prompts import VERIFY_SYSTEM_PROMPT
from .state import GraphState


class VerificationResult(BaseModel):
    is_valid: bool
    errors: List[str]


_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
_auditor = _llm.with_structured_output(VerificationResult)


def verify_node(state: GraphState) -> dict:
    user_message = (
        f"RAW TRANSCRIPT:\n{state['transcript']}\n\n"
        f"EXTRACTED JSON FORM:\n{json.dumps(state['extracted_form'], indent=2)}"
    )

    result: VerificationResult = _auditor.invoke([
        {"role": "system", "content": VERIFY_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ])

    return {
        "is_valid": result.is_valid,
        "verification_errors": result.errors,
    }
