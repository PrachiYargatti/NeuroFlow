"""
ui/recorder.py — manual start/stop microphone recording, no fixed duration.

Streamlit reruns the whole script on every interaction, so the recording
state (the active sounddevice stream + captured frames) is kept in
st.session_state, and a background sounddevice.InputStream callback appends
audio chunks independently of Streamlit's rerun cycle. A live timer is
rendered with st.fragment(run_every=...) so the UI updates every second
while recording without blocking the rest of the app.

Note: this records from the machine Streamlit is running on (server-side
microphone) — correct for the intended local ("streamlit run app.py")
usage described in the project brief. It is not a browser-microphone
capture, which would need a JS component for a remote deployment.
"""
from __future__ import annotations

import time

import numpy as np
import streamlit as st

from config.settings import settings
from utils.audio_utils import normalize_audio, numpy_to_wav_bytes
from utils.errors import MicrophoneError


def _init_state() -> None:
    st.session_state.setdefault("rec_stream", None)
    st.session_state.setdefault("rec_frames", [])
    st.session_state.setdefault("rec_active", False)
    st.session_state.setdefault("rec_start_time", None)
    st.session_state.setdefault("rec_result_bytes", None)


def start_recording() -> None:
    _init_state()
    if st.session_state.rec_active:
        return
    try:
        import sounddevice as sd
    except Exception as exc:  # noqa: BLE001
        raise MicrophoneError(f"Microphone library unavailable: {exc}") from exc

    # The callback runs on a background audio thread, not Streamlit's
    # script-run thread, so it closes over a plain list (captured directly,
    # not via repeated st.session_state lookups) to stay thread-safe.
    frame_buffer: list = []
    st.session_state.rec_buffer_ref = frame_buffer

    def _audio_callback(indata, frames, time_info, status):
        frame_buffer.append(indata.copy())

    try:
        st.session_state.rec_frames = []
        stream = sd.InputStream(
            samplerate=settings.sample_rate,
            channels=1,
            dtype="float32",
            callback=_audio_callback,
        )
        stream.start()
        st.session_state.rec_stream = stream
        st.session_state.rec_active = True
        st.session_state.rec_start_time = time.time()
        st.session_state.rec_result_bytes = None
    except Exception as exc:  # noqa: BLE001
        raise MicrophoneError(f"Could not access the microphone: {exc}") from exc


def stop_recording() -> bytes:
    _init_state()
    stream = st.session_state.rec_stream
    if stream is None:
        raise MicrophoneError("No active recording to stop.")

    try:
        stream.stop()
        stream.close()
    finally:
        st.session_state.rec_stream = None
        st.session_state.rec_active = False

    frames = st.session_state.get("rec_buffer_ref", [])
    st.session_state.rec_buffer_ref = []
    if not frames:
        raise MicrophoneError("No audio was captured. Please try recording again.")

    audio = np.concatenate(frames, axis=0).flatten()
    audio = normalize_audio(audio)
    wav_bytes = numpy_to_wav_bytes(audio, settings.sample_rate)
    st.session_state.rec_result_bytes = wav_bytes
    return wav_bytes


def is_recording() -> bool:
    _init_state()
    return bool(st.session_state.rec_active)


def elapsed_seconds() -> float:
    _init_state()
    if not st.session_state.rec_active or not st.session_state.rec_start_time:
        return 0.0
    return time.time() - st.session_state.rec_start_time


@st.fragment(run_every=1)
def render_live_timer() -> None:
    """Auto-refreshing timer + status pill shown only while recording."""
    if is_recording():
        secs = int(elapsed_seconds())
        mins, s = divmod(secs, 60)
        st.markdown(
            f"<div class='rec-pill'>🔴 Recording — {mins:02d}:{s:02d} — click Stop when finished</div>",
            unsafe_allow_html=True,
        )
