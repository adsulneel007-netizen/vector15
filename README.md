# VECTOR15

A multi-agent AI security lab. Describe a task, and an orchestrator assigns 2-6 specialists
(from 15 available roles — Penetration Tester, Red Teamer, SOC Analyst, Incident Responder,
Cloud Security Engineer, CISO, and more) to analyze it, then synthesizes their input into a
single prioritized mission report.

## Features
- **15 specialist AI personas** spanning Offense, Defense, Specialist, and Strategy roles
- **Orchestrator** auto-selects the relevant team for any given task
- **Real CVE/CVSS grounding** — looks up actual vulnerability data from NIST's NVD database
  instead of letting the AI guess severity
- **Recon data integration** — paste or fetch structured recon output (host/port/service/version)
  to ground the analysis in real scan data, not just a hypothetical scenario
- **Professional report output** — Executive Summary → Scope → Findings → Remediation →
  Watch Out For, exportable as Markdown or PDF
- **Session history** — past engagements are saved locally and can be reloaded

## Stack
- React (frontend)
- Anthropic API (Claude) — powers the orchestrator, specialists, and synthesis
- NVD REST API — real CVE/CVSS lookups
- FastAPI (optional local backend, `recon_api.py`) — wraps a recon script into an API endpoint

## Running the frontend
This is built as a single React component. Drop it into any React app (Create React App,
Vite, Next.js) as a page/component. Requires `lucide-react` for icons.

The Claude API calls in this version assume they're routed through a proxy that injects
the API key server-side — if running standalone, you'll need to add your own backend
proxy for `https://api.anthropic.com/v1/messages` rather than calling it directly from
the browser (browsers can't safely hold API keys).

## Running the optional recon backend
```bash
pip install -r requirements.txt
uvicorn recon_api:app --reload --port 8000
```
Then hit `http://localhost:8000/scan?target=<ip>` to get structured recon JSON,
or paste it directly in VECTOR15's "Attach recon.py output" panel.

**Note:** `recon_api.py` ships with placeholder nmap-based logic. Replace the body of
`run_recon()` with your own recon script's logic — keep the return shape
(`{"host": ..., "ports": [{"port", "service", "version"}, ...]}`) so VECTOR15's parser
can read it.

## Disclaimer
For learning and authorized security work only. Every specialist persona is instructed
to stay within legal, defensive-minded practice — no exploit code or attack instructions
for unauthorized targets.
