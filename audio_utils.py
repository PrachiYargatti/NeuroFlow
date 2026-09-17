"""
utils/audio_utils.py — small, dependency-light audio helpers shared across
the pipeline (WAV encoding, normalization, simple energy-based VAD).
"""
from __future__ import annotations

import io
import wave

import numpy as np


def numpy_to_wav_bytes(audio: np.ndarray, sample_rate: int) -> bytes:
    """Encode a float32 mono numpy array in [-1, 1] as 16-bit PCM WAV bytes."""
    audio_int16 = (np.clip(audio, -1.0, 1.0) * 32767).astype(np.int16)
    buf = io.BytesIO()
    with wave.open(buf, "wb") as wf:
        wf.setnchannels(1)
        wf.setsampwidth(2)
        wf.setframerate(sample_rate)
        wf.writeframes(audio_int16.tobytes())
    return buf.getvalue()


def normalize_audio(audio: np.ndarray, target_peak: float = 0.9) -> np.ndarray:
    """Peak-normalize audio so quiet mic input doesn't cause ASR hallucination."""
    if audio.size == 0:
        return audio
    peak = float(np.abs(audio).max())
    if peak < 1e-6:
        return audio
    return audio * (target_peak / peak)


def has_speech(audio: np.ndarray, sample_rate: int, rms_threshold: float = 0.01) -> bool:
    """Simple energy-based VAD: True if the loudest half of 20ms frames carry
    enough RMS energy to plausibly contain speech (rejects silence/noise)."""
    if audio.size == 0:
        return False
    frame_len = max(1, int(sample_rate * 0.02))
    frames = [audio[i : i + frame_len] for i in range(0, len(audio) - frame_len, frame_len)]
    if not frames:
        return float(np.sqrt(np.mean(audio ** 2))) >= rms_threshold
    energies = sorted((float(np.sqrt(np.mean(f ** 2))) for f in frames), reverse=True)
    top_half = energies[: max(1, len(energies) // 2)]
    return float(np.mean(top_half)) >= rms_threshold
