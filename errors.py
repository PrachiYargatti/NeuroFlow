"""
utils/errors.py — typed exceptions so the UI can show meaningful,
specific error messages instead of raw tracebacks.
"""


class SteamrollerError(Exception):
    """Base class for all Steamroller-specific errors."""


class NoSpeechDetectedError(SteamrollerError):
    """Raised when the input audio has no detectable speech."""


class TranscriptionError(SteamrollerError):
    """Raised when Whisper fails or produces unusable output."""


class MicrophoneError(SteamrollerError):
    """Raised when the microphone cannot be accessed or recorded from."""


class KaggleUnavailableError(SteamrollerError):
    """Raised when no working Kaggle F5-TTS GPU endpoint could be found."""


class VoiceCloningError(SteamrollerError):
    """Raised when the remote F5-TTS voice cloning call fails."""


class NetworkError(SteamrollerError):
    """Raised on connection/timeout issues talking to the Kaggle endpoint."""
