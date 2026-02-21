import os
import json
from openai import OpenAI
from dotenv import load_dotenv
load_dotenv()


client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

def main():
    with open("prompt.txt", "r") as f:
        prompt = f.read()

    with open("sample_transcript.txt", "r") as f:
        transcript = f.read()

    response = client.chat.completions.create(
        model="gpt-4o-mini",
        response_format={"type": "json_object"},
        messages=[
            {
                "role": "developer",
                "content": prompt + "\n\nIMPORTANT: Return only valid JSON."
            },
            {
                "role": "user",
                "content": "Extract the nursing handoff fields from this transcript and return ONLY JSON:\n\n"
                           + transcript
            }
        ],
    )

    print(response.choices[0].message.content)

if __name__ == "__main__":
    main()