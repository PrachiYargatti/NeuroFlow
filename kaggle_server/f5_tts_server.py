"""
kaggle_server/f5_tts_server.py
===============================
Paste this as the LAST cell of your Kaggle notebook (replacing the
`uvicorn server:app ...` line), after the existing install cells:

    !pip install f5-tts==1.1.10 gradio==5.50.0 protobuf==3.20.3 -q
    !pip install torch==2.4.0+cu121 torchvision==0.19.0+cu121 torchaudio==2.4.0+cu121 --extra-index-url https://download.pytorch.org/whl/cu121
    !pip install transformers==4.44.2 accelerate==0.34.2
    !pip install fastapi uvicorn python-multipart pyngrok nest_asyncio kaggle -q

Then set two Kaggle Secrets (Add-ons → Secrets) before running:
    NGROK_AUTH_TOKEN   — from https://dashboard.ngrok.com/get-started/your-authtoken
    KAGGLE_API_TOKEN    — the *contents* of your kaggle.json ({"username":...,"key":...})
                          (only needed if you want the auto-discovery dataset feature)

This cell:
    1. Loads F5-TTS once on the GPU and keeps it warm (no reload per request).
    2. Serves a tiny FastAPI app with /health and /clone.
    3. Opens a public ngrok tunnel so your laptop can reach this notebook.
    4. (Optional) publishes the current ngrok URL to a Kaggle Dataset so the
       local app can auto-discover it — see services/kaggle_gpu.py.
"""

import json
import os
import tempfile
import uuid

import nest_asyncio
import torch
import uvicorn
from fastapi import FastAPI, File, Form, UploadFile
from fastapi.responses import FileResponse, JSONResponse
from pyngrok import ngrok

# ---------------------------------------------------------------------------
# 1. Load F5-TTS once, on GPU, and keep it resident in memory.
# ---------------------------------------------------------------------------
from f5_tts.api import F5TTS

DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"[F5-TTS] Loading model on {DEVICE} …")
tts_model = F5TTS(device=DEVICE)
print("[F5-TTS] Model ready.")

app = FastAPI(title="Steamroller F5-TTS Server")


@app.get("/health")
def health():
    return {"status": "ok", "device": DEVICE}


@app.post("/clone")
async def clone(text: str = Form(...), reference_audio: UploadFile = File(...)):
    """Voice-clone `text` using `reference_audio` as the speaker reference."""
    try:
        ref_bytes = await reference_audio.read()
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as ref_tmp:
            ref_tmp.write(ref_bytes)
            ref_path = ref_tmp.name

        out_path = os.path.join(tempfile.gettempdir(), f"clone_{uuid.uuid4().hex}.wav")

        # F5-TTS infers the reference transcript automatically when ref_text=""
        tts_model.infer(
            ref_file=ref_path,
            ref_text="",
            gen_text=text,
            file_wave=out_path,
            remove_silence=True,
        )

        return FileResponse(out_path, media_type="audio/wav", filename="cloned.wav")
    except Exception as exc:  # noqa: BLE001 — return the real error to the client
        return JSONResponse(status_code=500, content={"error": str(exc)})


# ---------------------------------------------------------------------------
# 2. Open a public tunnel so the local Steamroller app can reach us.
# ---------------------------------------------------------------------------
ngrok_token = os.environ.get("NGROK_AUTH_TOKEN") or (
    __import__("kaggle_secrets").UserSecretsClient().get_secret("NGROK_AUTH_TOKEN")
    if os.path.exists("/kaggle") else None
)
if ngrok_token:
    ngrok.set_auth_token(ngrok_token)

public_url = ngrok.connect(8000, "http")
print(f"\n[F5-TTS] PUBLIC ENDPOINT: {public_url}\n")
print("Copy this into your local .env as KAGGLE_TTS_URL for the fast path.")

# ---------------------------------------------------------------------------
# 3. (Optional) publish the URL to a Kaggle Dataset for auto-discovery.
#    Requires a Kaggle Dataset to already exist (created once, manually) and
#    the KAGGLE_API_TOKEN secret set above.
# ---------------------------------------------------------------------------
ENDPOINT_DATASET = os.environ.get("STEAMROLLER_ENDPOINT_DATASET", "")  # e.g. "yourname/steamroller-endpoint"
try:
    if ENDPOINT_DATASET and os.path.exists("/kaggle"):
        token = __import__("kaggle_secrets").UserSecretsClient().get_secret("KAGGLE_API_TOKEN")
        creds = json.loads(token)
        os.makedirs(os.path.expanduser("~/.kaggle"), exist_ok=True)
        with open(os.path.expanduser("~/.kaggle/kaggle.json"), "w") as f:
            json.dump(creds, f)
        os.chmod(os.path.expanduser("~/.kaggle/kaggle.json"), 0o600)

        publish_dir = "/kaggle/working/endpoint_publish"
        os.makedirs(publish_dir, exist_ok=True)
        with open(os.path.join(publish_dir, "endpoint_url.txt"), "w") as f:
            f.write(str(public_url).replace("NgrokTunnel: \"", "").split('"')[0].strip())
        with open(os.path.join(publish_dir, "dataset-metadata.json"), "w") as f:
            json.dump({"title": "steamroller-endpoint", "id": ENDPOINT_DATASET, "licenses": [{"name": "CC0-1.0"}]}, f)

        os.system(f"kaggle datasets version -p {publish_dir} -m 'update endpoint url' --dir-mode zip")
        print(f"[F5-TTS] Published endpoint URL to Kaggle Dataset: {ENDPOINT_DATASET}")
except Exception as exc:  # noqa: BLE001
    print(f"[F5-TTS] Skipped dataset auto-publish ({exc}). Direct KAGGLE_TTS_URL still works.")

# ---------------------------------------------------------------------------
# 4. Serve. This keeps running until the Kaggle session ends (up to the GPU
#    session time limit) — leave this cell running for as long as you need
#    the endpoint available.
# ---------------------------------------------------------------------------
nest_asyncio.apply()
uvicorn.run(app, host="0.0.0.0", port=8000)
