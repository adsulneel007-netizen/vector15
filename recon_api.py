"""
recon_api.py — turns a recon script into a local API that VECTOR15 can call directly.

WHAT THIS IS: a generic scaffold. I don't have Pirates' actual recon.py, so this file
has a placeholder `run_recon(target)` function with example nmap-based logic.
REPLACE the inside of `run_recon()` with your real recon.py logic (import your module,
call your functions) — keep the return shape the same so VECTOR15's parser understands it.

HOW TO USE:
1. pip install fastapi uvicorn python-nmap   (or drop python-nmap if you don't use it)
2. Put your real recon.py in the same folder, import it below instead of the placeholder
3. Run:  uvicorn recon_api:app --reload --port 8000
4. In VECTOR15, paste this URL: http://localhost:8000/scan?target=<ip_or_host>
5. VECTOR15 will fetch it directly instead of needing manual copy-paste

OUTPUT SHAPE (this is what VECTOR15's parser expects):
{
  "host": "10.0.0.5",
  "ports": [
    {"port": 22, "service": "OpenSSH", "version": "7.2p2", "state": "open"},
    {"port": 80, "service": "Apache", "version": "2.4.49", "state": "open"}
  ]
}
"""

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
import subprocess
import re

app = FastAPI(title="Recon API")

# Allow VECTOR15 (running in the browser, possibly on claude.ai) to call this local API.
# Tighten allow_origins in production — "*" is fine for local testing only.
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["GET"],
    allow_headers=["*"],
)


def run_recon(target: str) -> dict:
    """
    PLACEHOLDER — replace this with your real recon.py logic.

    Example below shells out to nmap (must be installed: `apt install nmap` / `brew install nmap`)
    and parses service/version banners. If your recon.py already returns a dict/JSON,
    just call your function here instead and return its output directly.
    """
    try:
        result = subprocess.run(
            ["nmap", "-sV", "--open", target],
            capture_output=True, text=True, timeout=120
        )
    except FileNotFoundError:
        raise HTTPException(status_code=500, detail="nmap not installed on this machine")
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="scan timed out")

    ports = []
    # crude nmap text-output parser — matches lines like: "22/tcp open  ssh     OpenSSH 7.2p2"
    pattern = re.compile(r"(\d+)/tcp\s+open\s+(\S+)\s+(.*)")
    for line in result.stdout.splitlines():
        m = pattern.match(line.strip())
        if m:
            port, svc, banner = m.groups()
            version_match = re.search(r"(\d+\.\d+(\.\d+)?)", banner)
            ports.append({
                "port": int(port),
                "service": svc,
                "version": version_match.group(1) if version_match else "",
                "banner": banner.strip(),
                "state": "open",
            })

    return {"host": target, "ports": ports}


@app.get("/scan")
def scan(target: str = Query(..., description="IP or hostname to scan — must be a target you're authorized to test")):
    if not target or any(c in target for c in [";", "&", "|", "`", "$"]):
        raise HTTPException(status_code=400, detail="invalid target")
    return run_recon(target)


@app.get("/health")
def health():
    return {"status": "ok"}
