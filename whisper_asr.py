"""
asr/whisper_asr.py — Speech-to-text using OpenAI Whisper (CPU-friendly).

Model choice rationale (CPU laptop, no GPU):
    tiny   — fastest, noticeably worse accuracy, more hallucination on stutter.
    base   — good speed/accuracy trade-off for short clips.
    small  — DEFAULT. Best accuracy-per-CPU-second for stuttered speech;
             still finishes a 10-30s clip in a reasonable time on CPU.
    medium — noticeably more accurate but slow on CPU (kept optional, not default).

We deliberately avoid "large"/"large-v3" as the default: on CPU it is too
slow for an interactive app, and Steamroller's stutter-repair stage (NLP +
agents) already compensates for many small ASR errors.
"""
from __future__ import annotations

import os
import tempfile
from pathlib import Path
from typing import Optional

import numpy as np

from config.settings import settings
from utils.audio_utils import has_speech, normalize_audio
from utils.errors import NoSpeechDetectedError, TranscriptionError

# Anti-hallucination decoding options applied to every transcription.
_WHISPER_OPTS = dict(
    verbose=False,
    fp16=False,
    beam_size=1,
    best_of=1,
    temperature=0,                     # greedy/deterministic decoding
    condition_on_previous_text=False,  # stops "text drift" cascades
    no_speech_threshold=0.6,           # reject near-silent segments
    logprob_threshold=-1.0,            # reject low-confidence segments
    compression_ratio_threshold=2.4,   # catches repetitive hallucinated loops
    initial_prompt=(
        "Transcribe exactly what is spoken, including stutters and false "
        "starts. Do not guess missing words. Do not complete sentences."
    ),
)

_MODEL_CACHE: dict = {}


def _load_model(model_size: str):
    if model_size not in _MODEL_CACHE:
        import whisper  # imported lazily so app startup stays fast

        _MODEL_CACHE[model_size] = whisper.load_model(model_size)
    return _MODEL_CACHE[model_size]


def transcribe(
    audio: np.ndarray,
    model_size: Optional[str] = None,
    language: Optional[str] = None,
) -> str:
    """Transcribe a float32 mono numpy array at settings.sample_rate.

    Raises:
        NoSpeechDetectedError: audio is silent / has no detectable speech.
        TranscriptionError: Whisper produced empty or very low-confidence text.
    """
    import whisper  # noqa: F401  (ensures a clear ImportError if missing)

    model_size = model_size or settings.whisper_model
    audio = normalize_audio(audio)

    if not has_speech(audio, settings.sample_rate):
        raise NoSpeechDetectedError("No speech detected. Please speak clearly and try again.")

    model = _load_model(model_size)

    tmp = tempfile.NamedTemporaryFile(suffix=".wav", delete=False)
    try:
        from scipy.io.wavfile import write as wav_write

        wav_write(tmp.name, settings.sample_rate, (audio * 32767).astype(np.int16))
        tmp.close()

        result = model.transcribe(tmp.name, language=language, **_WHISPER_OPTS)
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass

    text = (result.get("text") or "").strip()
    if not text:
        raise TranscriptionError("Whisper could not detect any speech in the audio.")

    segments = result.get("segments", [])
    if segments:
        avg_logprob = float(np.mean([s.get("avg_logprob", -10) for s in segments]))
        if avg_logprob < -1.5:
            raise TranscriptionError(
                "Transcription confidence was too low. Please record again in a quieter environment."
            )

    return text


def transcribe_file_bytes(
    file_bytes: bytes,
    filename: str = "audio.wav",
    model_size: Optional[str] = None,
    language: Optional[str] = None,
) -> str:
    """Transcribe raw uploaded file bytes (wav/mp3/m4a/ogg/flac)."""
    import whisper

    suffix = Path(filename).suffix or ".wav"
    tmp = tempfile.NamedTemporaryFile(suffix=suffix, delete=False)
    try:
        tmp.write(file_bytes)
        tmp.flush()
        tmp.close()
        audio = whisper.load_audio(tmp.name)  # resamples to 16kHz mono internally
    finally:
        try:
            os.unlink(tmp.name)
        except OSError:
            pass

    return transcribe(audio, model_size=model_size, language=language)
