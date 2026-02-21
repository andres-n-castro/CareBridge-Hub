import os
import json
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

with open("prompt/prompt.txt", "r", encoding="utf-8") as f:
    prompt = f.read()

with open("transcripts/transcript.txt", "r", encoding="utf-8") as f:
    transcript = f.read()

with open("prompt/schema.json", "r", encoding="utf-8") as f:
    schema = json.load(f)

response = client.responses.create(
    model="gpt-4.1-mini",
    input=[
        {"role": "developer", "content": prompt},
        {"role": "user", "content": transcript}
    ],
    text={
        "format": {
            "type": "json_schema",
            "name": "nurse_shift_handoff",
            "schema": schema,
            "strict": False
        }
    }
)

# output_text is a convenience string containing the structured JSON
result = json.loads(response.output_text)

with open("transcripts/transcript.json", "w", encoding="utf-8") as f:
    json.dump(result, f, indent=2)

print("Structured JSON saved to transcript.json")