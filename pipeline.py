"""
pipeline.py — orchestrates the full Steamroller flow:

    audio bytes -> Whisper ASR -> NLP cleaning -> multi-agent repair
                -> F5-TTS voice cloning (Kaggle GPU) -> cloned audio bytes

Kept separate from app.py so the pipeline can be reused (CLI, tests,
notebook) without importing Streamlit.
"""
from __future__ import annotations

from dataclasses import dataclass, field
from typing import Callable, Optional

from agents.repair_agents import run_multi_agent_repair
from asr.whisper_asr import transcribe_file_bytes
from nlp.cleaner import clean_asr_output
from tts.f5_tts_client import clone_voice

ProgressCB = Optional[Callable[[str, int], None]]


@dataclass
class PipelineResult:
    raw_text: str = ""
    cleaned_text: str = ""
    final_text: str = ""
    chosen_agent: str = ""
    cloned_audio: bytes = b""
    timings: dict = field(default_factory=dict)


def run_pipeline(
    audio_bytes: bytes,
    filename: str,
    whisper_model: str,
    language: Optional[str],
    on_progress: ProgressCB = None,
) -> PipelineResult:
    """Run the full repair + voice-clone pipeline. Raises on failure — the
    caller (Streamlit UI) is responsible for catching typed errors from
    utils.errors and showing them to the user."""
    import time

    def report(msg: str, pct: int) -> None:
        if on_progress:
            on_progress(msg, pct)

    result = PipelineResult()
    t_start = time.perf_counter()

    report("Transcribing audio with Whisper…", 10)
    t0 = time.perf_counter()
    result.raw_text = transcribe_file_bytes(
        audio_bytes, filename=filename, model_size=whisper_model, language=language
    )
    result.timings["asr"] = round(time.perf_counter() - t0, 2)

    report("Cleaning stutter patterns…", 35)
    t0 = time.perf_counter()
    cleaning_report = clean_asr_output(result.raw_text)
    result.cleaned_text = cleaning_report.cleaned
    result.timings["nlp"] = round(time.perf_counter() - t0, 2)

    report("Repairing fluency with multi-agent system…", 55)
    t0 = time.perf_counter()
    repair = run_multi_agent_repair(result.cleaned_text, original_text=result.raw_text)
    result.final_text = repair.final_text
    result.chosen_agent = repair.chosen_agent
    result.timings["repair"] = round(time.perf_counter() - t0, 2)

    report("Cloning voice with F5-TTS on Kaggle GPU…", 70)
    t0 = time.perf_counter()

    def tts_progress(msg: str) -> None:
        report(msg, 80)

    result.cloned_audio = clone_voice(
        text=result.final_text,
        reference_audio_bytes=audio_bytes,
        reference_filename=filename,
        progress_cb=tts_progress,
    )
    result.timings["tts"] = round(time.perf_counter() - t0, 2)

    result.timings["total"] = round(time.perf_counter() - t_start, 2)
    report("Done.", 100)
    return result
