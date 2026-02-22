import os
import json
from pathlib import Path

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

_LLM_PARSE_DIR = Path(__file__).parent.parent / "LLM Parse" / "prompt"

with open(_LLM_PARSE_DIR / "prompt.txt", "r", encoding="utf-8") as f:
    _PROMPT = f.read()

with open(_LLM_PARSE_DIR / "schema.json", "r", encoding="utf-8") as f:
    _SCHEMA = json.load(f)


def generate_form(transcript: str) -> dict:
    """Extract a structured handoff form from a raw transcript."""
    response = _client.chat.completions.create(
        model="gpt-4o-mini",
        messages=[
            {"role": "system", "content": _PROMPT},
            {"role": "user", "content": transcript},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": {
                "name": "nurse_shift_handoff",
                "schema": _SCHEMA,
                "strict": False,
            },
        },
    )
    return json.loads(response.choices[0].message.content)
