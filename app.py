"""
app.py — Steamroller: AI Speech Repair Assistant.

Run with:
    streamlit run app.py

Flow: record/upload speech -> Whisper ASR -> NLP cleaning -> multi-agent
repair -> F5-TTS voice cloning on a Kaggle GPU -> download repaired audio.
"""
import html
import time

import streamlit as st

from pipeline import run_pipeline
from ui import recorder
from ui.styles import CSS
from utils.errors import SteamrollerError

st.set_page_config(page_title="Steamroller", page_icon="🎙️", layout="wide", initial_sidebar_state="expanded")
st.markdown(CSS, unsafe_allow_html=True)


def esc(text: str) -> str:
    return html.escape(text or "")


DEFAULTS = {
    "raw_audio": None,
    "filename": "audio.wav",
    "raw_text": "",
    "final_text": "",
    "chosen_agent": "",
    "cloned_audio": None,
    "timings": {},
    "error": None,
}
for key, default in DEFAULTS.items():
    st.session_state.setdefault(key, default)

# ── sidebar ──────────────────────────────────────────────────────────────
with st.sidebar:
    st.markdown("## 🎙️ STEAMROLLER")
    st.caption("Stuttered speech → fluent, voice-cloned speech")
    st.markdown("---")

    whisper_model = st.selectbox(
        "Whisper model", ["base", "small", "medium"], index=1,
        help="small = best accuracy/speed balance on CPU. medium = more accurate, slower.",
    )
    language = st.selectbox(
        "Language", ["Auto-detect", "English", "Hindi", "Spanish", "French", "German"], index=0,
    )
    lang_code = {
        "Auto-detect": None, "English": "en", "Hindi": "hi",
        "Spanish": "es", "French": "fr", "German": "de",
    }[language]

    st.markdown("---")
    st.markdown(
        "<div class='small-note'>Voice output always uses <b>F5-TTS</b>, "
        "running on your Kaggle GPU notebook, to clone the original speaker's voice. "
        "No local/system TTS is ever used.</div>",
        unsafe_allow_html=True,
    )
    st.markdown("---")
    if st.button("Clear Session", use_container_width=True):
        for k in list(st.session_state.keys()):
            del st.session_state[k]
        st.rerun()

# ── hero ─────────────────────────────────────────────────────────────────
st.markdown(
    """
    <div class='hero'>
      <h1>Steamroller — Speech Repair Assistant</h1>
      <p>Record live or upload audio. Steamroller transcribes it, repairs stuttering
      while preserving meaning, and clones the repaired speech back in your own voice.</p>
    </div>
    """,
    unsafe_allow_html=True,
)

if st.session_state.error:
    st.error(st.session_state.error)

left, right = st.columns([1, 1], gap="large")

# ── LEFT: input ──────────────────────────────────────────────────────────
with left:
    st.markdown("<div class='card'><div class='card-title'>Voice Input</div>", unsafe_allow_html=True)
    tab_upload, tab_live = st.tabs(["📂 Upload Audio File", "🎤 Live Recording"])

    with tab_upload:
        uploaded = st.file_uploader(
            "Supported: WAV, MP3, M4A, OGG, FLAC",
            type=["wav", "mp3", "m4a", "ogg", "flac"],
            label_visibility="collapsed",
        )
        if uploaded:
            st.session_state.raw_audio = uploaded.getvalue()
            st.session_state.filename = uploaded.name
            st.audio(st.session_state.raw_audio)

    with tab_live:
        st.markdown(
            "<p class='small-note'>Click Start, speak naturally, click Stop when you're done — "
            "no fixed time limit.</p>",
            unsafe_allow_html=True,
        )
        rec_col1, rec_col2 = st.columns(2)
        with rec_col1:
            start_clicked = st.button(
                "🎤 Start Recording", use_container_width=True, disabled=recorder.is_recording()
            )
        with rec_col2:
            stop_clicked = st.button(
                "⏹ Stop Recording", use_container_width=True, disabled=not recorder.is_recording()
            )

        if start_clicked:
            try:
                recorder.start_recording()
                st.rerun()
            except SteamrollerError as exc:
                st.session_state.error = str(exc)
                st.rerun()

        if stop_clicked:
            try:
                wav_bytes = recorder.stop_recording()
                st.session_state.raw_audio = wav_bytes
                st.session_state.filename = "live_recording.wav"
                st.session_state.error = None
                st.rerun()
            except SteamrollerError as exc:
                st.session_state.error = str(exc)
                st.rerun()

        recorder.render_live_timer()

        if not recorder.is_recording() and st.session_state.filename == "live_recording.wav" and st.session_state.raw_audio:
            st.success("Recording captured. Click **Repair Speech** to process.")
            st.audio(st.session_state.raw_audio, format="audio/wav")

    st.markdown("</div>", unsafe_allow_html=True)

    process = st.button(
        "🔧 Repair Speech",
        disabled=not bool(st.session_state.raw_audio) or recorder.is_recording(),
        use_container_width=True,
    )

# ── RIGHT: output ────────────────────────────────────────────────────────
with right:
    st.markdown("<div class='card'><div class='card-title'>Repaired Text</div>", unsafe_allow_html=True)
    if st.session_state.final_text:
        st.markdown(f"<div class='text-block final'>{esc(st.session_state.final_text)}</div>", unsafe_allow_html=True)
        if st.session_state.chosen_agent:
            st.markdown(
                f"<div class='small-note' style='margin-top:.5rem'>Selected by agent: "
                f"<b>{esc(st.session_state.chosen_agent)}</b></div>",
                unsafe_allow_html=True,
            )
    else:
        st.markdown("<div class='text-block empty'>The repaired sentence will appear here after processing.</div>", unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

    st.markdown("<div class='card'><div class='card-title'>Cloned Voice Output</div>", unsafe_allow_html=True)
    if st.session_state.cloned_audio:
        st.audio(st.session_state.cloned_audio, format="audio/wav")
        st.download_button(
            "⬇️ Download Repaired Audio",
            data=st.session_state.cloned_audio,
            file_name="steamroller_repaired.wav",
            mime="audio/wav",
            use_container_width=True,
        )
    else:
        st.markdown("<div class='text-block empty'>Voice-cloned audio will appear here.</div>", unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)

# ── pipeline execution ──────────────────────────────────────────────────
if process:
    st.session_state.error = None
    st.session_state.raw_text = ""
    st.session_state.final_text = ""
    st.session_state.chosen_agent = ""
    st.session_state.cloned_audio = None
    st.session_state.timings = {}

    progress_bar = st.progress(0)
    status = st.empty()

    def on_progress(msg: str, pct: int) -> None:
        status.info(msg)
        progress_bar.progress(pct)

    try:
        result = run_pipeline(
            audio_bytes=st.session_state.raw_audio,
            filename=st.session_state.filename,
            whisper_model=whisper_model,
            language=lang_code,
            on_progress=on_progress,
        )
        st.session_state.raw_text = result.raw_text
        st.session_state.final_text = result.final_text
        st.session_state.chosen_agent = result.chosen_agent
        st.session_state.cloned_audio = result.cloned_audio
        st.session_state.timings = result.timings

        status.success(f"✅ Done in {result.timings.get('total', '?')}s.")
        time.sleep(0.4)
        st.rerun()

    except SteamrollerError as exc:
        st.session_state.error = str(exc)
        st.rerun()
    except Exception as exc:  # noqa: BLE001 — last-resort catch, still shown clearly
        st.session_state.error = f"Unexpected error: {exc}"
        st.rerun()

# ── processing timeline ─────────────────────────────────────────────────
if st.session_state.timings:
    st.markdown("<div class='card'><div class='card-title'>Processing Timeline</div>", unsafe_allow_html=True)
    labels = {"asr": "ASR", "nlp": "NLP Cleaning", "repair": "Agent Repair", "tts": "Voice Cloning", "total": "Total"}
    steps_html = "".join(
        f"<div class='step'><div class='label'>{labels.get(k, k)}</div><div class='value'>{v}s</div></div>"
        for k, v in st.session_state.timings.items()
    )
    st.markdown(f"<div class='timeline'>{steps_html}</div>", unsafe_allow_html=True)
    st.markdown("</div>", unsafe_allow_html=True)
