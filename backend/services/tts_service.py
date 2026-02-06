import os
import httpx
import json

MURF_API_URL = "https://api.murf.ai/v1/speech/generate"

# Voice ID Mapping (Best guess based on research, user can update)
VOICE_MAP = {
    'en': 'en-US-alicia',   # Default English
    'hi': 'hi-IN-aman',     # Hindi Male
    'ta': 'ta-IN-murali',   # Tamil Male
    'gu': 'gu-IN-suresh',   # Gujarati (Placeholder/Guess)
    'mr': 'mr-IN-ananya'    # Marathi (Placeholder/Guess)
}

async def generate_speech(text: str, language_code: str = 'en'):
    """
    Generate speech using Murf.ai API
    """
    api_key = os.getenv("MURF_API_KEY")
    if not api_key:
        raise Exception("MURF_API_KEY not found in environment variables")

    voice_id = VOICE_MAP.get(language_code, 'en-US-alicia')

    headers = {
        "Content-Type": "application/json",
        "api-key": api_key,
        "Accept": "application/json"
    }

    payload = {
        "voiceId": voice_id,
        "text": text,
        "format": "MP3",
        "channelType": "MONO"
    }

    async with httpx.AsyncClient() as client:
        print(f"[TTS] Calling Murf.ai for voice {voice_id}...", flush=True)
        response = await client.post(MURF_API_URL, json=payload, headers=headers, timeout=30.0)
        
        if response.status_code != 200:
            print(f"[TTS] Error: {response.text}", flush=True)
            raise Exception(f"Murf API Error: {response.status_code}")

        result = response.json()
        audio_url = result.get("audioFile")
        
        if not audio_url:
             raise Exception("No audio URL returned from Murf")

        print(f"[TTS] Audio generated: {audio_url}", flush=True)
        
        # Download the audio file to stream it back
        audio_response = await client.get(audio_url)
        return audio_response.content
