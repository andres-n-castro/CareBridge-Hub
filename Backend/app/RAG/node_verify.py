from __future__ import annotations
import json
import logging
from typing import List

from langchain_openai import ChatOpenAI
from pydantic import BaseModel

from .prompts import VERIFY_SYSTEM_PROMPT
from .state import GraphState

logger = logging.getLogger(__name__)


class VerificationResult(BaseModel):
    is_valid: bool
    errors: List[str]


_llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
_auditor = _llm.with_structured_output(VerificationResult)


def verify_node(state: GraphState) -> dict:
    loop = state.get("loop_count", 0)
    logger.info("[RAG] verify_node: running audit (loop %d)", loop)

    user_message = (
        f"RAW TRANSCRIPT:\n{state['transcript']}\n\n"
        f"EXTRACTED JSON FORM:\n{json.dumps(state['extracted_form'], indent=2)}"
    )

    result: VerificationResult = _auditor.invoke([
        {"role": "system", "content": VERIFY_SYSTEM_PROMPT},
        {"role": "user", "content": user_message},
    ])

    if result.is_valid:
        logger.info("[RAG] verify_node: form is VALID — exiting loop")
    else:
        logger.warning("[RAG] verify_node: hallucinations detected on loop %d", loop)
        for i, err in enumerate(result.errors, 1):
            logger.warning("[RAG]   error %d: %s", i, err)

    return {
        "is_valid": result.is_valid,
        "verification_errors": result.errors,
    }
