"""
tts/f5_tts_client.py — client for the remote F5-TTS voice-cloning server
that runs on Kaggle's free GPU (see kaggle_server/f5_tts_server.py).

This is the ONLY text-to-speech path in Steamroller. There is no local /
placeholder / system-voice fallback: if the Kaggle GPU endpoint can't be
reached, cloning fails loudly with a clear error instead of silently
downgrading to a fake voice.
"""
from __future__ import annotations

import requests

from config.settings import settings
from services.kaggle_gpu import resolve_endpoint
from utils.errors import NetworkError, VoiceCloningError

_cached_endpoint: str | None = None


def _get_endpoint(force_refresh: bool = False, progress_cb=None) -> str:
    global _cached_endpoint
    if _cached_endpoint and not force_refresh:
        return _cached_endpoint
    _cached_endpoint = resolve_endpoint(progress_cb=progress_cb)
    return _cached_endpoint


def clone_voice(
    text: str,
    reference_audio_bytes: bytes,
    reference_filename: str = "reference.wav",
    progress_cb=None,
) -> bytes:
    """Send repaired text + a reference clip to the Kaggle F5-TTS server and
    return the cloned WAV audio bytes.

    Raises:
        VoiceCloningError: the server responded but generation failed.
        NetworkError: the server could not be reached / timed out.
    """
    if not text or not text.strip():
        raise VoiceCloningError("Cannot synthesise empty text.")

    endpoint = _get_endpoint(progress_cb=progress_cb)

    try:
        response = requests.post(
            f"{endpoint}/clone",
            data={"text": text},
            files={"reference_audio": (reference_filename, reference_audio_bytes, "audio/wav")},
            timeout=settings.tts_request_timeout,
        )
    except requests.Timeout as exc:
        raise NetworkError(
            "The Kaggle F5-TTS server timed out. Try a shorter reference clip, "
            "or increase TTS_REQUEST_TIMEOUT in your .env."
        ) from exc
    except requests.RequestException as exc:
        # Endpoint may have gone stale mid-session — retry once with a fresh lookup.
        try:
            endpoint = _get_endpoint(force_refresh=True, progress_cb=progress_cb)
            response = requests.post(
                f"{endpoint}/clone",
                data={"text": text},
                files={"reference_audio": (reference_filename, reference_audio_bytes, "audio/wav")},
                timeout=settings.tts_request_timeout,
            )
        except requests.RequestException as exc2:
            raise NetworkError(f"Could not reach the Kaggle F5-TTS server: {exc2}") from exc2

    if response.status_code != 200:
        raise VoiceCloningError(
            f"Voice cloning failed on the Kaggle server (HTTP {response.status_code}): {response.text[:300]}"
        )

    audio_bytes = response.content
    if not audio_bytes:
        raise VoiceCloningError("Kaggle server returned empty audio.")

    return audio_bytes
