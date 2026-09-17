"""ui/styles.py — professional, minimal, dark/light-friendly theme."""

CSS = """
<style>
:root {
  --bg:#f6f8fb; --surface:#ffffff; --border:#e2e8f0;
  --accent:#0ea5b7; --accent2:#14b8a6; --text:#0f172a; --muted:#64748b;
  --green:#059669; --red:#dc2626; --radius:16px;
}
@media (prefers-color-scheme: dark) {
  :root {
    --bg:#0b1220; --surface:#111827; --border:#1f2937;
    --text:#e5e7eb; --muted:#94a3b8;
  }
}
html, body, [data-testid="stAppViewContainer"] { background:var(--bg)!important; color:var(--text)!important; }
[data-testid="stSidebar"] { background:var(--surface)!important; border-right:1px solid var(--border); }
#MainMenu, footer, header { visibility:hidden; }

.hero { text-align:center; padding:1.1rem 1rem 1.5rem; }
.hero h1 { margin:0; font-size:2.1rem; font-weight:800; letter-spacing:-0.02em; }
.hero p { color:var(--muted); max-width:680px; margin:.5rem auto 0; }

.card { background:var(--surface); border:1px solid var(--border); border-radius:var(--radius);
        padding:1.3rem; box-shadow:0 6px 18px rgba(15,23,42,.06); margin-bottom:1rem; }
.card-title { font-weight:800; letter-spacing:.05em; margin-bottom:.8rem; text-transform:uppercase; font-size:.85rem; color:var(--muted); }

.text-block { background:rgba(14,165,183,.06); border:1px solid var(--border); border-left:4px solid var(--accent);
              border-radius:12px; padding:1rem; min-height:80px; line-height:1.7; word-break:break-word; }
.text-block.final { border-left-color:var(--green); background:rgba(5,150,105,.08); font-weight:600; }
.text-block.empty { color:var(--muted); font-style:italic; font-weight:400; }

.stButton > button { background:linear-gradient(135deg,var(--accent),var(--accent2))!important; color:white!important;
                      border:0!important; border-radius:12px!important; font-weight:700!important; padding:.7rem 1rem!important; }
.stButton > button:hover { opacity:.9; }
.stDownloadButton > button { border-radius:12px!important; font-weight:700!important; }

.status-pill { display:inline-block; background:rgba(5,150,105,.12); color:var(--green); border:1px solid rgba(5,150,105,.3);
               border-radius:999px; padding:.25rem .7rem; font-weight:700; font-size:.8rem; margin:.15rem .25rem .15rem 0; }
.rec-pill { display:inline-block; background:rgba(220,38,38,.1); color:var(--red); border:1px solid rgba(220,38,38,.3);
            border-radius:999px; padding:.3rem .8rem; font-weight:800; font-size:.88rem; animation:pulse 1.1s ease-in-out infinite; }
@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }

.timeline { display:flex; gap:.4rem; flex-wrap:wrap; margin-top:.5rem; }
.timeline .step { flex:1; min-width:120px; background:var(--surface); border:1px solid var(--border);
                   border-radius:10px; padding:.6rem .8rem; font-size:.82rem; }
.timeline .step .label { color:var(--muted); font-weight:700; text-transform:uppercase; font-size:.68rem; }
.timeline .step .value { font-weight:800; margin-top:.15rem; }

.small-note { color:var(--muted); font-size:.85rem; line-height:1.5; }
[data-testid="stFileUploader"] section { background:rgba(14,165,183,.05)!important; border:2px dashed rgba(14,165,183,.4)!important; border-radius:16px!important; }
[data-testid="stTabs"] [role="tab"] { font-weight:700; }
</style>
"""
