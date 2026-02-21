import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

audio_path = "audio/audio.m4a"

with open(audio_path, "rb") as f:
    transcript = client.audio.transcriptions.create(
        model="gpt-4o-transcribe",
        file=f,
        response_format="text",
        language="en"
    )

with open("transcripts/transcript.txt", "w", encoding="utf-8") as f:
    f.write(transcript)

print("Transcript saved to transcript.txt")