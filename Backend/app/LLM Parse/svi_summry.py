import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

api_key = os.getenv("OPENAI_API_KEY")
if not api_key:
    raise ValueError("OPENAI_API_KEY not found.")

client = OpenAI(api_key=api_key)

with open("prompt/svi_prompt.txt", "r", encoding="utf-8") as f:
    prompt = f.read()

with open("transcripts/svi.txt", "r", encoding="utf-8") as f:
    transcript = f.read()

with open("prompt/svi_schema.json", "r", encoding="utf-8") as f:
    schema = json.load(f)


def extract_output_text(resp) -> str:
    """
    Robustly concatenate all text parts from a Responses API object.
    Avoids assuming output[0].content[0].
    """
    parts = []
    for msg in getattr(resp, "output", []) or []:
        for c in getattr(msg, "content", []) or []:
            # Most common: ResponseOutputText has `.text`
            t = getattr(c, "text", None)
            if t:
                parts.append(t)
    return "\n".join(parts).strip()


response = client.responses.create(
    model="gpt-4.1-mini",
    temperature=0.2,
    input=[
        {
            "role": "developer",
            "content": prompt + "\n\nReturn ONLY valid JSON. No markdown. No code blocks."
        },
        {"role": "user", "content": transcript},
    ],
    text={
        "format": {
            "type": "json_schema",
            "name": "svi_nurse_guidance",
            "schema": schema,
            "strict": True
        }
    }
)

output_text = extract_output_text(response)

try:
    result = json.loads(output_text)
except json.JSONDecodeError:
    print("Model did not return valid JSON.")
    print("Raw output:\n", output_text)
    raise

with open("transcripts/svi_summary.json", "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2)

print("Structured JSON saved to transcripts/svi_summary.json")