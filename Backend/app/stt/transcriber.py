import os
from io import BytesIO

from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))


def transcribe_audio(audio_bytes: bytes, filename: str = "audio.m4a") -> str:
    """Convert raw audio bytes to a transcript string using Whisper."""
    audio_file = BytesIO(audio_bytes)
    audio_file.name = filename  # OpenAI SDK requires a name with an extension

    transcript = _client.audio.transcriptions.create(
        model="gpt-4o-transcribe",
        file=audio_file,
        response_format="text",
        language="en",
    )
    return transcript
