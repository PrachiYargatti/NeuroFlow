"""
services/kaggle_gpu.py — locates a live F5-TTS GPU inference endpoint
running on Kaggle, launching it automatically where Kaggle's API allows.

WHAT KAGGLE ACTUALLY LETS US AUTOMATE (read this before changing behaviour)
-----------------------------------------------------------------------------
Kaggle has no public API to spin up an interactive, low-latency GPU HTTP
endpoint on demand the way a serverless GPU provider would. What it *does*
provide is the official `kaggle` API/CLI, which can:
    - push a notebook and trigger it to execute on Kaggle's servers
      (`kaggle kernels push`) without opening a browser,
    - poll whether that run is queued / running / finished
      (`kaggle kernels status`),
    - download files from a Kaggle Dataset (`kaggle datasets download`).

There is no endpoint to fetch *live* logs or a *live* URL from a kernel
while it is still running. So instead of trying to fake that, this project
uses a small, honest workaround: the Kaggle-side server (see
`kaggle_server/f5_tts_server.py`) publishes its own public ngrok URL to a
Kaggle Dataset it updates via the Kaggle API from *inside* the notebook.
This client polls that dataset for a fresh URL.

Net effect for you as the user:
    1. First time only: create a small Kaggle Dataset (e.g. "your-name/steamroller-endpoint")
       and add your Kaggle API token — see README "Kaggle GPU Setup".
    2. After that, running `streamlit run app.py` is enough. This service:
         a. checks KAGGLE_TTS_URL directly (fast path — already running session),
         b. if that fails, checks the Kaggle Dataset for a fresher URL,
         c. if that also fails and auto-launch is enabled, triggers the
            Kaggle kernel to run via the API and polls the dataset until the
            server comes online (this takes a few minutes — Kaggle has to
            allocate a GPU, install dependencies and load the model; there is
            no way to avoid this cold-start latency).
    If none of that succeeds, a clear, actionable `KaggleUnavailableError`
    is raised — never a silent fallback to a fake/local voice.
"""
from __future__ import annotations

import subprocess
import time
from typing import Optional

import requests

from config.settings import settings
from utils.errors import KaggleUnavailableError


def _health_check(url: str) -> bool:
    if not url:
        return False
    try:
        resp = requests.get(f"{url}/health", timeout=settings.kaggle_health_timeout)
        return resp.status_code == 200 and resp.json().get("status") == "ok"
    except requests.RequestException:
        return False


def _fetch_url_from_dataset() -> Optional[str]:
    """Read the latest published endpoint URL from a Kaggle Dataset, if configured."""
    if not settings.kaggle_endpoint_dataset or not (settings.kaggle_username and settings.kaggle_key):
        return None
    try:
        import tempfile
        from pathlib import Path

        with tempfile.TemporaryDirectory() as tmp_dir:
            subprocess.run(
                [
                    "kaggle", "datasets", "download",
                    "-d", settings.kaggle_endpoint_dataset,
                    "-f", "endpoint_url.txt",
                    "-p", tmp_dir,
                    "--force",
                ],
                check=True,
                capture_output=True,
                timeout=60,
            )
            url_file = Path(tmp_dir) / "endpoint_url.txt"
            if url_file.exists():
                return url_file.read_text().strip().rstrip("/")
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired, FileNotFoundError):
        return None
    return None


def _trigger_kernel_run() -> bool:
    """Ask Kaggle (via API/CLI, no browser) to run the F5-TTS server kernel."""
    if not settings.kaggle_kernel_ref or not (settings.kaggle_username and settings.kaggle_key):
        return False
    try:
        subprocess.run(
            ["kaggle", "kernels", "status", settings.kaggle_kernel_ref],
            check=False, capture_output=True, timeout=30,
        )
        subprocess.run(
            ["kaggle", "kernels", "pull", settings.kaggle_kernel_ref, "-p", "/tmp/steamroller_kernel"],
            check=False, capture_output=True, timeout=60,
        )
        result = subprocess.run(
            ["kaggle", "kernels", "push", "-p", "/tmp/steamroller_kernel"],
            check=False, capture_output=True, timeout=60,
        )
        return result.returncode == 0
    except (FileNotFoundError, subprocess.TimeoutExpired):
        return False


def resolve_endpoint(progress_cb=None) -> str:
    """Return a verified, reachable F5-TTS server base URL.

    Args:
        progress_cb: optional callable(str) invoked with human-readable
            status updates, so the Streamlit UI can show live progress.

    Raises:
        KaggleUnavailableError: no reachable endpoint could be found/started.
    """

    def report(msg: str) -> None:
        if progress_cb:
            progress_cb(msg)

    # 1. Fast path — a directly configured, already-running session.
    if settings.kaggle_tts_url:
        report("Checking configured Kaggle GPU endpoint…")
        if _health_check(settings.kaggle_tts_url):
            return settings.kaggle_tts_url

    # 2. Auto-discovery — ask the Kaggle Dataset for a fresher URL.
    report("Looking up the latest published Kaggle endpoint…")
    discovered = _fetch_url_from_dataset()
    if discovered and _health_check(discovered):
        return discovered

    # 3. Auto-launch — trigger the Kaggle kernel via the API and wait.
    if settings.auto_launch_kaggle and settings.kaggle_kernel_ref:
        report("No live GPU endpoint found. Launching the Kaggle notebook via the Kaggle API…")
        if _trigger_kernel_run():
            deadline = time.time() + settings.kaggle_launch_wait_seconds
            while time.time() < deadline:
                report("Waiting for the Kaggle GPU session to come online (model loading takes a few minutes)…")
                time.sleep(settings.kaggle_poll_interval_seconds)
                url = _fetch_url_from_dataset()
                if url and _health_check(url):
                    return url

    raise KaggleUnavailableError(
        "Could not reach the F5-TTS GPU server on Kaggle.\n\n"
        "Fix one of the following:\n"
        "  1. Start your Kaggle notebook session (it runs the F5-TTS server) and make sure "
        "KAGGLE_TTS_URL in your .env matches its printed ngrok URL, or\n"
        "  2. Set KAGGLE_ENDPOINT_DATASET + Kaggle credentials so this app can auto-discover the URL, or\n"
        "  3. Set KAGGLE_KERNEL_REF + Kaggle credentials so this app can auto-launch the notebook via the Kaggle API.\n\n"
        "See README.md → 'Kaggle GPU Setup' for the one-time setup steps."
    )
