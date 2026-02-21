"""
Initialization node — wraps the AI engineer's JSON extraction function.

The teammate's function is expected to:
  - Accept a raw transcript string
  - Return a dict matching the PatientCreate schema

TODO (AI Engineer): Replace the placeholder import below with the real one, e.g.:
  from app.stt.extractor import generate_json as teammate_generate_json
"""
from __future__ import annotations
from .state import GraphState


def teammate_generate_json(transcript: str) -> dict:
    """Placeholder — replace with the real import from the AI engineer's extractor."""
    raise NotImplementedError(
        "teammate_generate_json has not been implemented yet. "
        "Import the real function from the STT extractor module."
    )


def initialization_node(state: GraphState) -> dict:
    extracted = teammate_generate_json(state["transcript"])
    return {"extracted_form": extracted}
