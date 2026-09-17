"""
config/settings.py — single source of truth for all configuration.

All values can be overridden with environment variables or a `.env` file
in the project root (see `.env.example`). Nothing here should be hardcoded
anywhere else in the codebase.
"""
from __future__ import annotations

import os
from dataclasses import dataclass, field
from pathlib import Path

from dotenv import load_dotenv

load_dotenv()  # loads .env if present, silently no-ops otherwise

BASE_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BASE_DIR / "uploads"
OUTPUTS_DIR = BASE_DIR / "outputs"
UPLOADS_DIR.mkdir(exist_ok=True)
OUTPUTS_DIR.mkdir(exist_ok=True)


def _get_bool(name: str, default: bool) -> bool:
    val = os.getenv(name)
    if val is None:
        return default
    return val.strip().lower() in {"1", "true", "yes", "on"}


@dataclass(frozen=True)
class Settings:
    # ---- Whisper (ASR) ----------------------------------------------------
    whisper_model: str = os.getenv("WHISPER_MODEL", "small")
    sample_rate: int = int(os.getenv("SAMPLE_RATE", "16000"))

    # ---- Remote F5-TTS (Kaggle GPU) ---------------------------------------
    # Direct URL to a currently-running F5-TTS server (e.g. an ngrok URL).
    # This is the fast path: if it's set and reachable, it is used as-is.
    kaggle_tts_url: str = os.getenv("KAGGLE_TTS_URL", "").strip().rstrip("/")

    # Optional: a Kaggle Dataset ("username/slug") that the running Kaggle
    # notebook keeps updated with its current public endpoint URL. Used to
    # auto-discover a fresh URL when KAGGLE_TTS_URL is stale or unset.
    kaggle_endpoint_dataset: str = os.getenv("KAGGLE_ENDPOINT_DATASET", "").strip()

    # Optional: Kaggle notebook ("username/kernel-slug") to auto-launch via
    # the official Kaggle API when no live endpoint can be found.
    kaggle_kernel_ref: str = os.getenv("KAGGLE_KERNEL_REF", "").strip()

    # Kaggle API credentials (only needed for auto-launch / dataset polling).
    kaggle_username: str = os.getenv("KAGGLE_USERNAME", "").strip()
    kaggle_key: str = os.getenv("KAGGLE_KEY", "").strip()

    auto_launch_kaggle: bool = _get_bool("AUTO_LAUNCH_KAGGLE", True)
    kaggle_health_timeout: float = float(os.getenv("KAGGLE_HEALTH_TIMEOUT", "5"))
    kaggle_launch_wait_seconds: int = int(os.getenv("KAGGLE_LAUNCH_WAIT_SECONDS", "480"))
    kaggle_poll_interval_seconds: int = int(os.getenv("KAGGLE_POLL_INTERVAL_SECONDS", "15"))
    tts_request_timeout: float = float(os.getenv("TTS_REQUEST_TIMEOUT", "180"))

    paths: dict = field(default_factory=lambda: {"uploads": UPLOADS_DIR, "outputs": OUTPUTS_DIR})


settings = Settings()
