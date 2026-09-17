"""
agents/repair_agents.py — multi-agent fluency repair.

Four lightweight, fast, local rule-based agents each propose a repaired
version of the already NLP-cleaned text, focusing on a different concern
(meaning preservation, grammar, concision, sequence fidelity). A scorer
picks the best candidate. This runs in parallel and in milliseconds — no
LLM call is needed for a task this narrow, which keeps the pipeline fast
and fully offline.
"""
from __future__ import annotations

import re
from concurrent.futures import ThreadPoolExecutor
from dataclasses import dataclass
from difflib import SequenceMatcher
from typing import List, Optional


def _normalize_sentence(text: str) -> str:
    text = re.sub(r"\s+", " ", text or "").strip(" ,")
    text = re.sub(r"\s+([,.!?])", r"\1", text)
    text = re.sub(r"([,.!?])(?=\S)", r"\1 ", text)
    text = re.sub(r"\bi\b", "I", text, flags=re.IGNORECASE)
    if text:
        text = text[0].upper() + text[1:]
    if text and not text.endswith((".", "!", "?")):
        text += "."
    return text


class BaseRepairAgent:
    name: str = "base"

    def repair(self, text: str) -> str:
        raise NotImplementedError


class MeaningPreservationAgent(BaseRepairAgent):
    """Minimal edits — only strips leftover fillers, keeps wording intact."""

    name = "meaning_preservation"

    def repair(self, text: str) -> str:
        text = re.sub(r"\b(uh|um|ah|er|hmm|you know)\b[,.\s]*", " ", text or "", flags=re.IGNORECASE)
        return _normalize_sentence(text)


class GrammarAgent(BaseRepairAgent):
    """Fixes common contraction/grammar slips left after cleaning."""

    name = "grammar"

    def repair(self, text: str) -> str:
        text = re.sub(r"\bcan not\b", "cannot", text or "", flags=re.IGNORECASE)
        text = re.sub(r"\bdont\b", "don't", text, flags=re.IGNORECASE)
        text = re.sub(r"\bcant\b", "can't", text, flags=re.IGNORECASE)
        text = re.sub(r"\bim\b", "I'm", text, flags=re.IGNORECASE)
        return _normalize_sentence(text)


class ConciseFluentAgent(BaseRepairAgent):
    """More aggressive cleanup — collapses stray repeats and stretched letters."""

    name = "concise_fluent"

    def repair(self, text: str) -> str:
        text = text or ""
        text = re.sub(r"\b(uh|um|ah|er|hmm|you know|basically|actually|like)\b", " ", text, flags=re.IGNORECASE)
        text = re.sub(r"\b(\w+)(?:\s+\1\b)+", r"\1", text, flags=re.IGNORECASE)
        text = re.sub(r"([a-zA-Z])\1{2,}", r"\1", text)  # "sooooo" -> "so"
        return _normalize_sentence(text)


class SequenceOptimizedAgent(BaseRepairAgent):
    """Targets leftover restart fragments like 'I-I-I' or 'w-w-want'."""

    name = "sequence_optimized"

    def repair(self, text: str) -> str:
        text = text or ""
        text = re.sub(r"\b(?:[A-Za-z]{1,3}-){1,}(?=[A-Za-z])", "", text)
        text = re.sub(r"\b(\w+)(?:[,.\s]+\1\b)+", r"\1", text, flags=re.IGNORECASE)
        return _normalize_sentence(text)


AGENTS: List[BaseRepairAgent] = [
    MeaningPreservationAgent(),
    GrammarAgent(),
    ConciseFluentAgent(),
    SequenceOptimizedAgent(),
]


@dataclass
class RepairCandidate:
    agent_name: str
    text: str
    score: float


@dataclass
class RepairResult:
    final_text: str
    chosen_agent: str
    candidates: List[RepairCandidate]


def _score(original_text: str, candidate_text: str) -> float:
    """Blend of meaning preservation, grammar hygiene, and repetition-freeness."""
    if not candidate_text:
        return 0.0

    meaning = SequenceMatcher(None, original_text, candidate_text).ratio()

    grammar = 1.0
    if not candidate_text[0].isupper():
        grammar -= 0.2
    if not candidate_text.endswith((".", "!", "?")):
        grammar -= 0.2
    if "  " in candidate_text:
        grammar -= 0.1
    if re.search(r"\s+[,.!?]", candidate_text):
        grammar -= 0.1
    grammar = max(grammar, 0.0)

    words = candidate_text.lower().split()
    repeated = sum(1 for i in range(1, len(words)) if words[i] == words[i - 1])
    concise = max(1 - (repeated / len(words)), 0.0) if words else 0.0

    return round(0.55 * meaning + 0.30 * grammar + 0.15 * concise, 4)


def run_multi_agent_repair(cleaned_text: str, original_text: Optional[str] = None) -> RepairResult:
    """Run all agents in parallel on the (already NLP-cleaned) text and pick the
    highest-scoring, most meaning-preserving fluent candidate."""
    reference = original_text if original_text is not None else cleaned_text

    with ThreadPoolExecutor(max_workers=len(AGENTS)) as executor:
        repaired_texts = list(executor.map(lambda a: a.repair(cleaned_text), AGENTS))

    candidates = [
        RepairCandidate(agent.name, text, _score(reference, text))
        for agent, text in zip(AGENTS, repaired_texts)
    ]
    best = max(candidates, key=lambda c: c.score)
    return RepairResult(final_text=best.text, chosen_agent=best.agent_name, candidates=candidates)
