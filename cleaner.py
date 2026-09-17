"""
nlp/cleaner.py — rule-based cleaning of raw ASR text before agent repair.

Handles, in order (order matters — syllable stutters must be fixed before
word-repetition collapsing, otherwise "b-because because" survives):
    1. Syllable-level stutters      e.g. "b-b-because"      -> "because"
    2. Partial / broken word stubs  e.g. "wha- what is"      -> "what is"
    3. Word-level repetitions       e.g. "I I I want"        -> "I want"
    4. Phrase-level repetitions     e.g. "I want to I want to go" -> "I want to go"
    5. Filler words                 e.g. "um", "uh", "like"  -> removed
    6. Whitespace / capitalization / punctuation normalization
"""
from __future__ import annotations

import re
from dataclasses import dataclass, field
from typing import List, Tuple

FILLER_PATTERNS = [
    r"\b(um+|uh+|erm*|ah+|eh+|hmm+|mm+)\b",
    r"\b(like,?\s*like)\b",
    r"\b(you\s*know,?\s*you\s*know)\b",
    r"\b(so+|well+)\b(?=\s)",
]

# "b-b-because" / "s-s-s-so"  ->  "because" / "so"
_SYLLABLE_STUTTER = re.compile(r"\b(?:[a-z]{1,4}-){1,}(?=[a-z])", re.IGNORECASE)

# A trailing broken word fragment immediately followed by the completed word,
# e.g. "wha- what is" or "I wan- want to go".
_PARTIAL_WORD = re.compile(
    r"\b(\w{1,6})-\s+(\1\w*)\b", re.IGNORECASE
)

# "I I I want"  ->  "I want"
_WORD_REPETITION = re.compile(r"\b(\w+)(?:\s+\1){1,4}\b", re.IGNORECASE)

# "I want to go I want to go"  ->  "I want to go"
_PHRASE_REPETITION = re.compile(r"\b(.{5,40}?)\s+\1\b", re.IGNORECASE)


@dataclass
class CleaningReport:
    original: str
    cleaned: str
    fillers_removed: int = 0
    repetitions_fixed: int = 0
    syllable_stutters_fixed: int = 0
    partial_words_fixed: int = 0
    issues: List[str] = field(default_factory=list)


def _fix_syllable_stutters(text: str) -> Tuple[str, int]:
    count = len(_SYLLABLE_STUTTER.findall(text))
    text = _SYLLABLE_STUTTER.sub("", text)
    return re.sub(r"\s{2,}", " ", text).strip(), count


def _fix_partial_words(text: str) -> Tuple[str, int]:
    new_text, n = _PARTIAL_WORD.subn(r"\2", text)
    return new_text, n


def _fix_word_repetitions(text: str) -> Tuple[str, int]:
    return _WORD_REPETITION.subn(r"\1", text)


def _fix_phrase_repetitions(text: str) -> Tuple[str, int]:
    return _PHRASE_REPETITION.subn(r"\1", text)


def _remove_fillers(text: str) -> Tuple[str, int]:
    count = 0
    for pattern in FILLER_PATTERNS:
        text, n = re.subn(pattern, "", text, flags=re.IGNORECASE)
        count += n
    return re.sub(r"\s{2,}", " ", text).strip(), count


def _normalize_whitespace_and_case(text: str) -> str:
    text = re.sub(r"\s+", " ", text).strip(" ,")
    text = re.sub(r"\s+([,.!?])", r"\1", text)
    text = re.sub(r"([,.!?])(?=\S)", r"\1 ", text)
    text = re.sub(r"\bi\b", "I", text, flags=re.IGNORECASE)
    if text:
        text = text[0].upper() + text[1:]
    return text


def clean_asr_output(raw_text: str) -> CleaningReport:
    """Run the full deterministic cleaning pipeline on raw ASR text."""
    issues: List[str] = []
    text = (raw_text or "").strip()

    text, syl_fixed = _fix_syllable_stutters(text)
    if syl_fixed:
        issues.append(f"Syllable stutters fixed: {syl_fixed}")

    text, partial_fixed = _fix_partial_words(text)
    if partial_fixed:
        issues.append(f"Partial/broken words fixed: {partial_fixed}")

    text, word_reps = _fix_word_repetitions(text)
    if word_reps:
        issues.append(f"Word repetitions fixed: {word_reps}")

    text, phrase_reps = _fix_phrase_repetitions(text)
    if phrase_reps:
        issues.append(f"Phrase repetitions fixed: {phrase_reps}")

    text, fillers = _remove_fillers(text)
    if fillers:
        issues.append(f"Fillers removed: {fillers}")

    text = _normalize_whitespace_and_case(text)

    return CleaningReport(
        original=raw_text,
        cleaned=text,
        fillers_removed=fillers,
        repetitions_fixed=word_reps + phrase_reps,
        syllable_stutters_fixed=syl_fixed,
        partial_words_fixed=partial_fixed,
        issues=issues,
    )
