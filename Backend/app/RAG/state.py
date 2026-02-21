from __future__ import annotations
from typing import List
from typing_extensions import TypedDict


class GraphState(TypedDict):
    transcript: str           # Raw diarized text from STT
    extracted_form: dict      # JSON data from extraction — updated each correction cycle
    verification_errors: List[str]  # Errors flagged by the auditor node
    is_valid: bool            # Routing flag: True exits the loop, False triggers regeneration
