import React, { useState, useEffect } from "react";
import {
  Crosshair, Swords, Bug, Monitor, Siren, Search, Microscope, Fingerprint,
  KeyRound, Code2, Cloud, Network, Briefcase, ClipboardCheck, ShieldCheck,
  Send, Loader2, RotateCcw, Radio, Download, History, ChevronDown, ChevronUp, Languages,
  Paperclip, AlertTriangle, ExternalLink,
} from "lucide-react";

const COLORS = {
  bg: "#0B0E14",
  panel: "#10141D",
  panelAlt: "#161B26",
  border: "#232B3A",
  borderActive: "#3A4257",
  text: "#E6EAF2",
  textMuted: "#7C8599",
  amber: "#FFB454",
  teal: "#4FD1C5",
  danger: "#FF6B6B",
};

const GUARD =
  " Stay strictly within legal, authorized, defensive-minded security practice. " +
  "Never produce working exploit code, malware payloads, or attack instructions for real " +
  "unauthorized targets — speak in methodology, frameworks, checklists, and risk analysis. " +
  "Keep the answer under 160 words, in tight bullet points, using markdown '- ' bullets.";

const EXPERTS = [
  { id: "pentest", name: "Penetration Tester", tag: "Offense", icon: Crosshair,
    system: "You are a senior penetration tester. Given a task, outline the testing methodology, relevant frameworks (OWASP, PTES), and key risk areas to check." + GUARD },
  { id: "redteam", name: "Red Teamer", tag: "Offense", icon: Swords,
    system: "You are a red team lead. Given a task, think in terms of adversary simulation, attack-chain planning from recon to objective, and how a blue team would likely detect each stage." + GUARD },
  { id: "bugbounty", name: "Bug Bounty Hunter", tag: "Offense", icon: Bug,
    system: "You are an experienced bug bounty hunter. Given a task, suggest realistic vulnerability classes to target, a recon approach, and how to write a strong, responsible disclosure report." + GUARD },
  { id: "soc", name: "SOC Analyst", tag: "Defense", icon: Monitor,
    system: "You are a SOC analyst. Given a task, describe what alerts, logs, or telemetry matter, how you'd triage, and how to spot false positives vs real incidents." + GUARD },
  { id: "ir", name: "Incident Responder", tag: "Defense", icon: Siren,
    system: "You are an incident responder. Given a task, outline containment, eradication, and recovery steps, and what evidence to preserve." + GUARD },
  { id: "threathunt", name: "Threat Hunter", tag: "Defense", icon: Search,
    system: "You are a threat hunter. Given a task, describe hypothesis-driven hunting: which MITRE ATT&CK TTPs you'd hunt for and what data sources you'd query." + GUARD },
  { id: "malware", name: "Malware Analyst", tag: "Specialist", icon: Microscope,
    system: "You are a malware analyst. Given a task, describe a static/dynamic analysis approach, sandboxing, and the indicators of compromise you'd extract, at a conceptual level." + GUARD },
  { id: "forensics", name: "Digital Forensics Expert", tag: "Specialist", icon: Fingerprint,
    system: "You are a digital forensics expert. Given a task, outline evidence acquisition, chain of custody, and which artifacts you'd examine across disk, memory, and logs." + GUARD },
  { id: "crypto", name: "Cryptographer", tag: "Specialist", icon: KeyRound,
    system: "You are a cryptography specialist. Given a task, assess relevant algorithms, key management, and common implementation pitfalls." + GUARD },
  { id: "appsec", name: "AppSec Engineer", tag: "Specialist", icon: Code2,
    system: "You are an application security engineer. Given a task, identify secure coding practices, likely OWASP Top 10 risks, and how to bake security into the SDLC." + GUARD },
  { id: "cloudsec", name: "Cloud Security Engineer", tag: "Specialist", icon: Cloud,
    system: "You are a cloud security engineer. Given a task, assess IAM, misconfiguration risk, and best practices across AWS, Azure, and GCP." + GUARD },
  { id: "netsec", name: "Network Security Engineer", tag: "Specialist", icon: Network,
    system: "You are a network security engineer. Given a task, assess segmentation, firewall and VPN posture, and traffic monitoring." + GUARD },
  { id: "consultant", name: "Security Consultant", tag: "Strategy", icon: Briefcase,
    system: "You are an independent security consultant. Given a task, give pragmatic, business-aware advice and a short prioritized roadmap." + GUARD },
  { id: "grc", name: "GRC Specialist", tag: "Strategy", icon: ClipboardCheck,
    system: "You are a GRC specialist. Given a task, map it to relevant frameworks (ISO 27001, NIST, GDPR/DPDP) and key policy or risk considerations." + GUARD },
  { id: "ciso", name: "CISO", tag: "Strategy", icon: ShieldCheck,
    system: "You are a CISO. Given a task, give an executive-level view: business risk, budget and resourcing tradeoffs, and what you'd report to a board." + GUARD },
];

const ORCHESTRATOR_SYSTEM =
  "You are the orchestrator for a 15-person AI security team. Given a task description, pick the 2 to 6 " +
  "most relevant team members from this exact id list: pentest, redteam, bugbounty, soc, ir, threathunt, " +
  "malware, forensics, crypto, appsec, cloudsec, netsec, consultant, grc, ciso. Respond with ONLY raw JSON, " +
  'no markdown fences, no commentary, in this exact shape: {"selected":[{"id":"...","reason":"short clause, under 10 words"}]}. ' +
  "Pick the smallest relevant set, not all of them.";

const SYNTH_SYSTEM =
  "You are the lead synthesizer for a security team producing a professional engagement report. You'll receive " +
  "a task (optionally with pasted recon data and real NVD CVE/CVSS lookups) plus several specialist inputs " +
  "labelled by role. Merge them into ONE report using markdown headers ('## ') in exactly this order: " +
  "'## Executive Summary' (2-3 plain-language sentences for a non-technical stakeholder), " +
  "'## Scope' (1-2 sentences on what was assessed, based on the task/recon given), " +
  "'## Findings' (deduplicated bullets, EVERY bullet starts with exactly one of [Critical], [High], or [Medium] — " +
  "if real CVE/CVSS data was provided for something, you MUST use that exact severity and cite the CVE ID instead " +
  "of guessing your own severity for it), " +
  "'## Remediation' (prioritized, actionable bullets mapped to the findings above), " +
  "'## Watch Out For' (short list of secondary risks, blind spots, or false-positive traps). " +
  "Use '- ' bullets. Under 420 words total.";

const FOLLOWUP_SYSTEM =
  "You are the lead of a security lab continuing a live consult. You already produced a mission report for a " +
  "task. Answer the follow-up question directly and practically, staying consistent with the report. Stay within " +
  "legal, authorized, defensive-minded practice — never provide exploit code or malware for unauthorized targets. " +
  "Use markdown bullets, under 180 words.";

async function callClaude(system, userMsg) {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-5",
      max_tokens: 1000,
      system,
      messages: [{ role: "user", content: userMsg }],
    }),
  });
  if (!res.ok) throw new Error("API error " + res.status);
  const data = await res.json();
  return (data.content || []).map((b) => b.text || "").join("\n").trim();
}

function extractServiceVersions(raw) {
  if (!raw || !raw.trim()) return [];
  const pairs = new Set();
  try {
    const data = JSON.parse(raw);
    const walk = (node) => {
      if (pairs.size >= 8) return;
      if (Array.isArray(node)) node.forEach(walk);
      else if (node && typeof node === "object") {
        const svc = node.service || node.product || node.name;
        const ver = node.version || node.banner_version;
        if (svc && ver) pairs.add(`${svc} ${ver}`.trim());
        Object.values(node).forEach(walk);
      }
    };
    walk(data);
  } catch {
    // not valid JSON — fall through to regex scan below
  }
  const re = /\b([A-Za-z][A-Za-z0-9_.\-]{2,20})\/?\s+v?(\d+\.\d+(?:\.\d+)?)\b/g;
  let m;
  while ((m = re.exec(raw)) && pairs.size < 8) pairs.add(`${m[1]} ${m[2]}`);
  return Array.from(pairs).slice(0, 4);
}

async function fetchCVEsForPairs(pairs, apiKey) {
  const out = [];
  for (const pair of pairs) {
    let attempt = 0;
    while (attempt < 3) {
      try {
        const url = `https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(pair)}&resultsPerPage=2`;
        const res = await fetch(url, { headers: apiKey ? { apiKey } : {} });
        if (res.status === 429) {
          attempt++;
          await new Promise((r) => setTimeout(r, 1500 * attempt)); // backoff on rate limit
          continue;
        }
        if (!res.ok) break;
        const data = await res.json();
        (data.vulnerabilities || []).forEach((v) => {
          const cve = v.cve || {};
          const desc = (cve.descriptions || []).find((d) => d.lang === "en")?.value || "";
          const metrics = cve.metrics || {};
          const best = (metrics.cvssMetricV31 || metrics.cvssMetricV30 || metrics.cvssMetricV2 || [])[0];
          const score = best?.cvssData?.baseScore ?? null;
          const severity = best?.cvssData?.baseSeverity || best?.baseSeverity || null;
          out.push({ pair, id: cve.id, desc, score, severity });
        });
        break;
      } catch {
        break; // network/CORS failure — skip this pair, don't break the whole run
      }
    }
    await new Promise((r) => setTimeout(r, apiKey ? 150 : 700)); // API key raises NVD's rate limit ~10x
  }
  return out;
}

function inlineMd(str, keyBase) {
  const parts = str.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((p, i) =>
    p.startsWith("**") && p.endsWith("**") ? (
      <strong key={keyBase + i} style={{ color: COLORS.text }}>{p.slice(2, -2)}</strong>
    ) : (
      <React.Fragment key={keyBase + i}>{p}</React.Fragment>
    )
  );
}

function priorityBadge(text) {
  const m = text.match(/^\[(Critical|High|Medium)\]\s*/i);
  if (!m) return null;
  const level = m[1];
  const color = level.toLowerCase() === "critical" ? COLORS.danger : level.toLowerCase() === "high" ? COLORS.amber : COLORS.teal;
  return { level, color, rest: text.slice(m[0].length) };
}

function MarkdownLite({ text }) {
  if (!text) return null;
  const lines = text.split("\n").filter((l) => l.trim() !== "");
  const blocks = [];
  let list = [];
  const flush = () => { if (list.length) { blocks.push({ type: "ul", items: list }); list = []; } };
  lines.forEach((line) => {
    const t = line.trim();
    if (t.startsWith("## ")) { flush(); blocks.push({ type: "h", text: t.replace(/^##\s*/, "") }); }
    else if (t.startsWith("- ") || t.startsWith("* ")) { list.push(t.replace(/^[-*]\s*/, "")); }
    else { flush(); blocks.push({ type: "p", text: t }); }
  });
  flush();
  return (
    <div>
      {blocks.map((b, i) => {
        if (b.type === "h")
          return (
            <div key={i} style={{ fontFamily: "var(--font-display)", fontSize: 13, letterSpacing: "0.05em",
              textTransform: "uppercase", color: COLORS.amber, margin: "12px 0 6px" }}>
              {b.text}
            </div>
          );
        if (b.type === "ul")
          return (
            <ul key={i} style={{ margin: "2px 0 10px", paddingLeft: 0, listStyle: "none" }}>
              {b.items.map((it, j) => {
                const badge = priorityBadge(it);
                return (
                  <li key={j} style={{ marginBottom: 6, color: COLORS.text, fontSize: 13.5, lineHeight: 1.55, display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <span style={{ color: COLORS.textMuted, marginTop: 1 }}>—</span>
                    <span>
                      {badge && (
                        <span style={{
                          fontFamily: "var(--font-mono)", fontSize: 9.5, fontWeight: 600, color: badge.color,
                          border: `1px solid ${badge.color}`, borderRadius: 4, padding: "1px 5px",
                          marginRight: 6, textTransform: "uppercase", letterSpacing: "0.03em",
                        }}>{badge.level}</span>
                      )}
                      {inlineMd(badge ? badge.rest : it, "i" + i + j)}
                    </span>
                  </li>
                );
              })}
            </ul>
          );
        return (
          <p key={i} style={{ margin: "2px 0 10px", color: COLORS.text, fontSize: 13.5, lineHeight: 1.55 }}>
            {inlineMd(b.text, "p" + i)}
          </p>
        );
      })}
    </div>
  );
}

function StatusDot({ status }) {
  const color = status === "thinking" ? COLORS.amber : status === "done" ? COLORS.teal : COLORS.textMuted;
  return (
    <span style={{
      width: 7, height: 7, borderRadius: 999, background: color, display: "inline-block",
      animation: status === "thinking" ? "pulseDot 1.1s ease-in-out infinite" : "none",
      boxShadow: status === "done" ? `0 0 6px ${COLORS.teal}` : "none",
    }} />
  );
}

export default function CyberSecurityLab() {
  const [task, setTask] = useState("");
  const [phase, setPhase] = useState("idle"); // idle | suggesting | ready | working | synthesizing | done | error
  const [activeIds, setActiveIds] = useState(new Set());
  const [reasons, setReasons] = useState({});
  const [responses, setResponses] = useState({});
  const [statuses, setStatuses] = useState({});
  const [report, setReport] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [followUp, setFollowUp] = useState("");
  const [followUpLog, setFollowUpLog] = useState([]);
  const [followUpBusy, setFollowUpBusy] = useState(false);
  const [lang, setLang] = useState("en"); // en | hi
  const [history, setHistory] = useState([]);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [reconRaw, setReconRaw] = useState("");
  const [reconOpen, setReconOpen] = useState(false);
  const [cveResults, setCveResults] = useState([]);
  const [cveLoading, setCveLoading] = useState(false);
  const [cveChecked, setCveChecked] = useState(false);
  const [nvdKey, setNvdKey] = useState("");
  const [nvdKeyOpen, setNvdKeyOpen] = useState(false);
  const [reconApiUrl, setReconApiUrl] = useState("");
  const [reconFetching, setReconFetching] = useState(false);
  const [reconFetchError, setReconFetchError] = useState("");

  const busy = phase === "suggesting" || phase === "working" || phase === "synthesizing";
  const langSuffix = lang === "hi"
    ? " Respond in casual Hinglish (Hindi conversational tone, written in Roman/English script), the way a senior talks to a junior."
    : "";

  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get("lab:history", false);
        if (res && res.value) setHistory(JSON.parse(res.value));
      } catch {
        // no history yet, that's fine
      }
      try {
        const res2 = await window.storage.get("lab:nvdkey", false);
        if (res2 && res2.value) setNvdKey(res2.value);
      } catch {
        // no saved key, that's fine
      }
    })();
  }, []);

  async function saveNvdKey(key) {
    setNvdKey(key);
    try {
      await window.storage.set("lab:nvdkey", key, false);
    } catch {
      // storage unavailable, key still works for this session
    }
  }

  async function saveToHistory(entry) {
    try {
      const updated = [entry, ...history].slice(0, 20);
      setHistory(updated);
      await window.storage.set("lab:history", JSON.stringify(updated), false);
    } catch {
      // storage unavailable, continue without persistence
    }
  }

  function loadFromHistory(entry) {
    setTask(entry.task);
    setReport(entry.report);
    setActiveIds(new Set());
    setReasons({});
    setResponses({});
    setFollowUpLog([]);
    setFollowUp("");
    setError("");
    setPhase("done");
    setHistoryOpen(false);
  }

  async function fetchFromReconApi() {
    if (!reconApiUrl.trim()) return;
    setReconFetching(true);
    setReconFetchError("");
    try {
      const res = await fetch(reconApiUrl.trim());
      if (!res.ok) throw new Error(`API returned ${res.status}`);
      const data = await res.json();
      setReconRaw(JSON.stringify(data, null, 2));
      setCveChecked(false);
      setCveResults([]);
    } catch (e) {
      setReconFetchError(
        "Couldn't reach the recon API — check it's running (uvicorn recon_api:app --port 8000), " +
        "the URL is correct, and CORS is allowed."
      );
    } finally {
      setReconFetching(false);
    }
  }

  async function runCveLookup() {
    const pairs = extractServiceVersions(reconRaw);
    setCveChecked(false);
    if (pairs.length === 0) { setCveResults([]); setCveChecked(true); return; }
    setCveLoading(true);
    try {
      const results = await fetchCVEsForPairs(pairs, nvdKey.trim() || null);
      setCveResults(results);
    } finally {
      setCveLoading(false);
      setCveChecked(true);
    }
  }

  function buildEnrichedContext() {
    let ctx = `Task: ${task}`;
    if (reconRaw.trim()) {
      ctx += `\n\nRecon data (from recon.py):\n${reconRaw.trim().slice(0, 3000)}`;
    }
    if (cveResults.length > 0) {
      const lines = cveResults
        .map((c) => `${c.id} (CVSS ${c.score ?? "?"} ${c.severity ?? ""}) — affects ${c.pair}: ${c.desc.slice(0, 140)}`)
        .join("\n");
      ctx += `\n\nReal CVE/CVSS data from NVD — use these exact IDs and severities, don't invent your own for these:\n${lines}`;
    }
    return ctx;
  }

  async function suggestTeam() {
    if (!task.trim() || busy) return;
    setError(""); setReport(""); setResponses({}); setFollowUpLog([]); setFollowUp("");
    const init = {}; EXPERTS.forEach((e) => (init[e.id] = "idle"));
    setStatuses(init);
    setPhase("suggesting");
    try {
      const raw = await callClaude(ORCHESTRATOR_SYSTEM, buildEnrichedContext());
      const clean = raw.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      const sel = (parsed.selected || []).filter((s) => EXPERTS.some((e) => e.id === s.id));
      if (sel.length === 0) throw new Error("empty selection");
      const ids = new Set(sel.map((s) => s.id));
      const reasonMap = {}; sel.forEach((s) => (reasonMap[s.id] = s.reason));
      setActiveIds(ids);
      setReasons(reasonMap);
      setPhase("ready");
    } catch {
      setError("Couldn't assign the team. Try briefing again.");
      setPhase("error");
    }
  }

  function toggleExpert(id) {
    if (phase !== "ready") return;
    setActiveIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  async function deployTeam() {
    if (activeIds.size === 0 || busy) return;
    setPhase("working");
    const ids = Array.from(activeIds);
    const thinking = { ...statuses }; ids.forEach((id) => (thinking[id] = "thinking"));
    setStatuses(thinking);
    try {
      const results = await Promise.all(
        ids.map(async (id) => {
          const expert = EXPERTS.find((e) => e.id === id);
          const reasonText = reasons[id] || "Added manually for this task.";
          try {
            const text = await callClaude(
              expert.system + langSuffix,
              `${buildEnrichedContext()}\n\nWhy you're on this: ${reasonText}\n\nGive your expert read.`
            );
            return [id, text];
          } catch {
            return [id, "Could not reach this specialist. Try deploying again."];
          }
        })
      );
      const respMap = {}; results.forEach(([id, text]) => (respMap[id] = text));
      setResponses(respMap);
      const done = { ...thinking }; ids.forEach((id) => (done[id] = "done"));
      setStatuses(done);

      setPhase("synthesizing");
      const combined = ids
        .map((id) => `### ${EXPERTS.find((e) => e.id === id)?.name}\n${respMap[id]}`)
        .join("\n\n");
      const finalReport = await callClaude(
        SYNTH_SYSTEM + langSuffix,
        `${buildEnrichedContext()}\n\nSpecialist inputs:\n${combined}`
      );
      setReport(finalReport);
      setPhase("done");
      saveToHistory({ task, report: finalReport, ts: Date.now() });
    } catch {
      setError("Operation broke mid-stream. Try again.");
      setPhase("error");
    }
  }

  function resetAll() {
    setTask(""); setPhase("idle"); setActiveIds(new Set()); setReasons({}); setResponses({});
    setReport(""); setError(""); setFollowUp(""); setFollowUpLog([]); setCopied(false);
    setReconRaw(""); setCveResults([]); setCveChecked(false);
  }

  async function copyReport() {
    try {
      await navigator.clipboard.writeText(report);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard unavailable
    }
  }

  function printReportAsPdf() {
    try {
      const win = window.open("", "_blank");
      if (!win) return;
      const escaped = report
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const html = escaped
        .split("\n")
        .map((line) => {
          const t = line.trim();
          if (t.startsWith("## ")) return `<h2>${t.slice(3)}</h2>`;
          if (t.startsWith("- ") || t.startsWith("* ")) return `<li>${t.slice(2)}</li>`;
          if (t === "") return "";
          return `<p>${t}</p>`;
        })
        .join("\n")
        .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`);
      win.document.write(`<!DOCTYPE html><html><head><title>Security Assessment Report</title>
        <style>
          body { font-family: Georgia, serif; max-width: 720px; margin: 40px auto; color: #1a1a1a; line-height: 1.6; }
          h1 { font-size: 22px; border-bottom: 2px solid #333; padding-bottom: 8px; }
          h2 { font-size: 16px; margin-top: 24px; text-transform: uppercase; letter-spacing: 0.03em; color: #333; }
          .meta { font-size: 12px; color: #555; margin: 10px 0 20px; }
          li { margin-bottom: 6px; }
        </style></head><body>
        <h1>Security Assessment Report</h1>
        <div class="meta">Task: ${task.replace(/</g, "&lt;")}<br/>Date: ${new Date().toLocaleDateString()}<br/>
        Specialists: ${Array.from(activeIds).map((id) => EXPERTS.find((e) => e.id === id)?.name).filter(Boolean).join(", ")}
        ${cveResults.length > 0 ? "<br/>CVEs referenced: " + cveResults.map((c) => c.id).join(", ") : ""}</div>
        ${html}
        </body></html>`);
      win.document.close();
      win.focus();
      setTimeout(() => win.print(), 400);
    } catch {
      // popup blocked or print unavailable — Copy/Download still work
    }
  }

  function downloadReport() {
    try {
      const header =
        `# Security Assessment Report\n\n` +
        `**Task:** ${task}\n` +
        `**Date:** ${new Date().toLocaleDateString()}\n` +
        `**Specialists consulted:** ${Array.from(activeIds).map((id) => EXPERTS.find((e) => e.id === id)?.name).filter(Boolean).join(", ")}\n` +
        (cveResults.length > 0 ? `**CVEs referenced:** ${cveResults.map((c) => c.id).join(", ")}\n` : "") +
        `\n---\n\n`;
      const blob = new Blob([header + report], { type: "text/markdown" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = "security-assessment-report.md";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      // download unsupported in this context
    }
  }

  async function askFollowUp() {
    if (!followUp.trim() || followUpBusy) return;
    const q = followUp.trim();
    setFollowUp("");
    setFollowUpBusy(true);
    try {
      const hist = followUpLog.map((qa) => `Q: ${qa.q}\nA: ${qa.answer}`).join("\n\n");
      const context = `Original task: ${task}\n\nMission report:\n${report}\n\n${
        hist ? "Earlier follow-ups:\n" + hist + "\n\n" : ""
      }New question: ${q}`;
      const answer = await callClaude(FOLLOWUP_SYSTEM + langSuffix, context);
      setFollowUpLog((prev) => [...prev, { q, answer }]);
    } catch {
      setFollowUpLog((prev) => [...prev, { q, answer: "Could not reach the lab. Try asking again." }]);
    } finally {
      setFollowUpBusy(false);
    }
  }

  const showSelection = phase !== "idle" && phase !== "suggesting";

  return (
    <div style={{
      "--font-display": "'Space Grotesk', sans-serif",
      "--font-body": "'Inter', sans-serif",
      "--font-mono": "'IBM Plex Mono', monospace",
      background: COLORS.bg, color: COLORS.text, minHeight: "100%",
      fontFamily: "var(--font-body)", padding: "28px 18px 60px", boxSizing: "border-box",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap');
        @keyframes pulseDot { 0%,100%{opacity:1} 50%{opacity:0.3} }
        @keyframes spin { to { transform: rotate(360deg); } }
        textarea::placeholder, input::placeholder { color: ${COLORS.textMuted}; }
        textarea:focus, button:focus-visible, input:focus { outline: 2px solid ${COLORS.amber}; outline-offset: 2px; }
      `}</style>

      <div style={{ maxWidth: 920, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4, flexWrap: "wrap", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Radio size={18} color={COLORS.amber} />
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.15em",
              color: COLORS.textMuted, textTransform: "uppercase" }}>15 specialists · 1 operation</span>
          </div>
          <button onClick={() => setLang(lang === "en" ? "hi" : "en")} style={{
            display: "flex", alignItems: "center", gap: 6, background: COLORS.panel,
            border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, borderRadius: 7,
            padding: "6px 11px", fontSize: 12, cursor: "pointer",
          }}>
            <Languages size={13} /> {lang === "en" ? "English" : "Hinglish"}
          </button>
        </div>
        <h1 style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: "clamp(26px,5vw,38px)",
          margin: "4px 0 6px", letterSpacing: "-0.02em" }}>
          Cyber Security Lab
        </h1>
        <p style={{ color: COLORS.textMuted, fontSize: 14, margin: "0 0 18px", maxWidth: 560 }}>
          Brief the desk on a task. The orchestrator suggests the right specialists — you can adjust the team —
          then deploy them for one combined mission report, with follow-ups after.
        </p>

        {/* History */}
        {history.length > 0 && (
          <div style={{ marginBottom: 18 }}>
            <button onClick={() => setHistoryOpen(!historyOpen)} style={{
              display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none",
              color: COLORS.textMuted, fontSize: 12.5, cursor: "pointer", padding: 0,
            }}>
              <History size={13} /> Past ops ({history.length}) {historyOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {historyOpen && (
              <div style={{ marginTop: 8, display: "grid", gap: 6 }}>
                {history.map((h, i) => (
                  <button key={i} onClick={() => loadFromHistory(h)} style={{
                    textAlign: "left", background: COLORS.panel, border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, padding: "8px 11px", cursor: "pointer", color: COLORS.text, fontSize: 12.5,
                  }}>
                    <span style={{ color: COLORS.textMuted, fontFamily: "var(--font-mono)", fontSize: 10.5 }}>
                      {new Date(h.ts).toLocaleDateString()}{" "}
                    </span>
                    {h.task.length > 70 ? h.task.slice(0, 70) + "…" : h.task}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Task console */}
        <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 16, marginBottom: 24 }}>
          <textarea
            value={task}
            onChange={(e) => setTask(e.target.value)}
            disabled={phase !== "idle" && phase !== "error"}
            placeholder="e.g. We're about to launch a college portal — what should we check before go-live?"
            rows={3}
            style={{
              width: "100%", resize: "vertical", background: "transparent", border: "none", color: COLORS.text,
              fontFamily: "var(--font-mono)", fontSize: 13.5, lineHeight: 1.5, boxSizing: "border-box",
            }}
          />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
            {phase !== "idle" && (
              <button onClick={resetAll} disabled={busy} style={{
                display: "flex", alignItems: "center", gap: 6, background: "transparent",
                border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, borderRadius: 7,
                padding: "8px 12px", fontSize: 13, cursor: busy ? "default" : "pointer",
              }}>
                <RotateCcw size={14} /> New op
              </button>
            )}

            {(phase === "idle" || phase === "error") && (
              <button onClick={suggestTeam} disabled={!task.trim()} style={{
                display: "flex", alignItems: "center", gap: 7,
                background: !task.trim() ? COLORS.panelAlt : COLORS.amber,
                color: !task.trim() ? COLORS.textMuted : "#1A1300",
                border: "none", borderRadius: 7, padding: "9px 16px", fontSize: 13.5, fontWeight: 600,
                cursor: !task.trim() ? "default" : "pointer",
              }}>
                <Send size={14} /> Brief the team
              </button>
            )}

            {phase === "ready" && (
              <button onClick={deployTeam} disabled={activeIds.size === 0} style={{
                display: "flex", alignItems: "center", gap: 7,
                background: activeIds.size === 0 ? COLORS.panelAlt : COLORS.teal,
                color: activeIds.size === 0 ? COLORS.textMuted : "#04201D",
                border: "none", borderRadius: 7, padding: "9px 16px", fontSize: 13.5, fontWeight: 600,
                cursor: activeIds.size === 0 ? "default" : "pointer",
              }}>
                <Send size={14} /> Deploy team ({activeIds.size})
              </button>
            )}

            {(phase === "suggesting" || phase === "working" || phase === "synthesizing") && (
              <button disabled style={{
                display: "flex", alignItems: "center", gap: 7, background: COLORS.panelAlt,
                color: COLORS.textMuted, border: "none", borderRadius: 7, padding: "9px 16px", fontSize: 13.5, fontWeight: 600,
              }}>
                <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                {phase === "suggesting" ? "Assigning team…" : phase === "working" ? "Specialists working…" : "Writing report…"}
              </button>
            )}
          </div>
          {phase === "ready" && (
            <div style={{ marginTop: 10, fontSize: 11.5, color: COLORS.textMuted }}>
              Tap any specialist below to add or remove them before deploying.
            </div>
          )}
        </div>

        {/* Recon attach + real CVE grounding */}
        {(phase === "idle" || phase === "error") && (
          <div style={{ marginBottom: 24 }}>
            <button onClick={() => setReconOpen(!reconOpen)} style={{
              display: "flex", alignItems: "center", gap: 6, background: "transparent", border: "none",
              color: COLORS.textMuted, fontSize: 12.5, cursor: "pointer", padding: 0,
            }}>
              <Paperclip size={13} /> Attach recon.py output (optional) {reconOpen ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
            {reconOpen && (
              <div style={{ marginTop: 10, background: COLORS.panel, border: `1px solid ${COLORS.border}`, borderRadius: 10, padding: 14 }}>
                <div style={{ display: "flex", gap: 8, marginBottom: 10, flexWrap: "wrap" }}>
                  <input
                    value={reconApiUrl}
                    onChange={(e) => setReconApiUrl(e.target.value)}
                    placeholder="http://localhost:8000/scan?target=10.0.0.5"
                    style={{
                      flex: 1, minWidth: 220, background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`,
                      borderRadius: 7, padding: "8px 10px", color: COLORS.text, fontSize: 12.5,
                      fontFamily: "var(--font-mono)", boxSizing: "border-box",
                    }}
                  />
                  <button onClick={fetchFromReconApi} disabled={!reconApiUrl.trim() || reconFetching} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: !reconApiUrl.trim() || reconFetching ? COLORS.panelAlt : COLORS.amber,
                    color: !reconApiUrl.trim() || reconFetching ? COLORS.textMuted : "#1A1300",
                    border: "none", borderRadius: 7, padding: "8px 14px", fontSize: 12.5, fontWeight: 600,
                    cursor: !reconApiUrl.trim() || reconFetching ? "default" : "pointer",
                  }}>
                    {reconFetching ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : "Fetch"}
                  </button>
                </div>
                {reconFetchError && (
                  <div style={{ fontSize: 11.5, color: COLORS.danger, marginBottom: 10 }}>{reconFetchError}</div>
                )}
                <div style={{ fontSize: 11, color: COLORS.textMuted, marginBottom: 10 }}>
                  Run your recon backend locally (recon_api.py) and paste its /scan URL above — or just paste raw output below.
                </div>
                <textarea
                  value={reconRaw}
                  onChange={(e) => { setReconRaw(e.target.value); setCveChecked(false); setCveResults([]); }}
                  placeholder='Paste recon.py JSON or raw output here — e.g. {"host":"10.0.0.5","ports":[{"port":22,"service":"OpenSSH","version":"7.2p2"}]}'
                  rows={5}
                  style={{
                    width: "100%", resize: "vertical", background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`,
                    borderRadius: 7, color: COLORS.text, fontFamily: "var(--font-mono)", fontSize: 12.5,
                    lineHeight: 1.5, boxSizing: "border-box", padding: 10,
                  }}
                />
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
                  <button onClick={runCveLookup} disabled={!reconRaw.trim() || cveLoading} style={{
                    display: "flex", alignItems: "center", gap: 6,
                    background: !reconRaw.trim() || cveLoading ? COLORS.panelAlt : COLORS.teal,
                    color: !reconRaw.trim() || cveLoading ? COLORS.textMuted : "#04201D",
                    border: "none", borderRadius: 7, padding: "7px 12px", fontSize: 12.5, fontWeight: 600,
                    cursor: !reconRaw.trim() || cveLoading ? "default" : "pointer",
                  }}>
                    {cveLoading ? <Loader2 size={13} style={{ animation: "spin 1s linear infinite" }} /> : <AlertTriangle size={13} />}
                    {cveLoading ? "Checking NVD…" : "Look up real CVEs"}
                  </button>
                  <span style={{ fontSize: 11, color: COLORS.textMuted }}>
                    Extracts service/version pairs and queries the public NVD database for real CVSS scores.
                  </span>
                </div>

                <div style={{ marginTop: 10 }}>
                  <button onClick={() => setNvdKeyOpen(!nvdKeyOpen)} style={{
                    background: "transparent", border: "none", color: COLORS.textMuted, fontSize: 11,
                    cursor: "pointer", padding: 0, textDecoration: "underline", textUnderlineOffset: 2,
                  }}>
                    {nvdKey ? "NVD API key saved — edit" : "Have an NVD API key? Add it (avoids rate-limit failures)"}
                  </button>
                  {nvdKeyOpen && (
                    <div style={{ marginTop: 8, display: "flex", gap: 8, flexWrap: "wrap" }}>
                      <input
                        value={nvdKey}
                        onChange={(e) => saveNvdKey(e.target.value)}
                        placeholder="Free key from nvd.nist.gov/developers/request-an-api-key"
                        style={{
                          flex: 1, minWidth: 220, background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`,
                          borderRadius: 7, padding: "7px 10px", color: COLORS.text, fontSize: 12,
                          fontFamily: "var(--font-mono)", boxSizing: "border-box",
                        }}
                      />
                    </div>
                  )}
                </div>

                {cveChecked && cveResults.length === 0 && (
                  <div style={{ marginTop: 10, fontSize: 12, color: COLORS.textMuted }}>
                    No service/version pairs detected, or NVD returned nothing — team will still use the recon text as context, just without real CVSS grounding.
                  </div>
                )}

                {cveResults.length > 0 && (
                  <div style={{ marginTop: 12, display: "grid", gap: 8 }}>
                    {cveResults.map((c, i) => (
                      <div key={i} style={{ background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`, borderRadius: 8, padding: 10 }}>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 6 }}>
                          <a href={`https://nvd.nist.gov/vuln/detail/${c.id}`} target="_blank" rel="noreferrer"
                            style={{ color: COLORS.amber, fontFamily: "var(--font-mono)", fontSize: 12.5, fontWeight: 600,
                              textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                            {c.id} <ExternalLink size={11} />
                          </a>
                          {c.score != null && (
                            <span style={{
                              fontFamily: "var(--font-mono)", fontSize: 10.5, fontWeight: 600,
                              color: c.score >= 9 ? COLORS.danger : c.score >= 7 ? COLORS.amber : COLORS.teal,
                              border: `1px solid ${c.score >= 9 ? COLORS.danger : c.score >= 7 ? COLORS.amber : COLORS.teal}`,
                              borderRadius: 4, padding: "1px 6px",
                            }}>
                              CVSS {c.score} {c.severity || ""}
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: 11.5, color: COLORS.textMuted, marginTop: 4 }}>
                          affects: {c.pair}
                        </div>
                        <div style={{ fontSize: 12.5, color: COLORS.text, marginTop: 4, lineHeight: 1.4 }}>
                          {c.desc.length > 220 ? c.desc.slice(0, 220) + "…" : c.desc}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Roster */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: 8, marginBottom: 26 }}>
          {EXPERTS.map((ex) => {
            const Icon = ex.icon;
            const isActive = activeIds.has(ex.id);
            const dim = showSelection && !isActive;
            const clickable = phase === "ready";
            return (
              <div key={ex.id} onClick={() => toggleExpert(ex.id)} style={{
                background: COLORS.panel, border: `1px solid ${isActive ? COLORS.borderActive : COLORS.border}`,
                borderRadius: 9, padding: "10px 11px", opacity: dim ? 0.35 : 1,
                transition: "opacity 0.3s, border-color 0.3s", cursor: clickable ? "pointer" : "default",
              }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Icon size={15} color={isActive ? COLORS.amber : COLORS.textMuted} />
                  <StatusDot status={statuses[ex.id] || "idle"} />
                </div>
                <div style={{ fontSize: 12.5, fontWeight: 600, marginTop: 7, lineHeight: 1.25 }}>{ex.name}</div>
                <div style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: COLORS.textMuted, marginTop: 2, textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  {ex.tag}
                </div>
              </div>
            );
          })}
        </div>

        {error && (
          <div style={{ background: "#1F1212", border: `1px solid ${COLORS.danger}`, color: COLORS.danger,
            borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 20 }}>
            {error}
          </div>
        )}

        {/* Expert briefs */}
        {(phase === "working" || phase === "synthesizing" || (phase === "done" && Object.keys(responses).length > 0)) && (
          <div style={{ display: "grid", gap: 10, marginBottom: 26 }}>
            {Array.from(activeIds).map((id) => {
              const ex = EXPERTS.find((e) => e.id === id);
              if (!ex) return null;
              const Icon = ex.icon;
              return (
                <div key={id} style={{ background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`, borderRadius: 9, padding: 14 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <Icon size={14} color={COLORS.amber} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{ex.name}</span>
                    {reasons[id] && <span style={{ fontSize: 11, color: COLORS.textMuted }}>· {reasons[id]}</span>}
                  </div>
                  {statuses[id] === "thinking" ? (
                    <div style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: COLORS.textMuted }}>analyzing…</div>
                  ) : (
                    <MarkdownLite text={responses[id]} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Mission report */}
        {report && (
          <div style={{ background: COLORS.panel, border: `1px solid ${COLORS.amber}`, borderRadius: 10, padding: 18 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <ShieldCheck size={16} color={COLORS.teal} />
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 15 }}>Mission Report</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <button onClick={copyReport} style={{
                  background: "transparent", border: `1px solid ${COLORS.border}`,
                  color: copied ? COLORS.teal : COLORS.textMuted, borderRadius: 6,
                  padding: "5px 10px", fontSize: 11.5, cursor: "pointer",
                }}>
                  {copied ? "Copied" : "Copy"}
                </button>
                <button onClick={printReportAsPdf} style={{
                  display: "flex", alignItems: "center", gap: 4, background: "transparent",
                  border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, borderRadius: 6,
                  padding: "5px 10px", fontSize: 11.5, cursor: "pointer",
                }}>
                  PDF
                </button>
                <button onClick={downloadReport} style={{
                  display: "flex", alignItems: "center", gap: 4, background: "transparent",
                  border: `1px solid ${COLORS.border}`, color: COLORS.textMuted, borderRadius: 6,
                  padding: "5px 10px", fontSize: 11.5, cursor: "pointer",
                }}>
                  <Download size={11} /> .md
                </button>
              </div>
            </div>
            <MarkdownLite text={report} />

            {followUpLog.length > 0 && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLORS.border}`, display: "grid", gap: 12 }}>
                {followUpLog.map((qa, i) => (
                  <div key={i}>
                    <div style={{ fontSize: 12, color: COLORS.amber, marginBottom: 4, fontFamily: "var(--font-mono)" }}>
                      Q: {qa.q}
                    </div>
                    <MarkdownLite text={qa.answer} />
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 8, marginTop: 14, paddingTop: 14, borderTop: `1px solid ${COLORS.border}` }}>
              <input
                value={followUp}
                onChange={(e) => setFollowUp(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") askFollowUp(); }}
                placeholder="Ask the lab a follow-up…"
                disabled={followUpBusy}
                style={{
                  flex: 1, background: COLORS.panelAlt, border: `1px solid ${COLORS.border}`, borderRadius: 7,
                  padding: "8px 10px", color: COLORS.text, fontSize: 13, fontFamily: "var(--font-body)", boxSizing: "border-box",
                }}
              />
              <button onClick={askFollowUp} disabled={followUpBusy || !followUp.trim()} style={{
                display: "flex", alignItems: "center", gap: 6,
                background: followUpBusy || !followUp.trim() ? COLORS.panelAlt : COLORS.teal,
                color: followUpBusy || !followUp.trim() ? COLORS.textMuted : "#04201D",
                border: "none", borderRadius: 7, padding: "8px 14px", fontSize: 13, fontWeight: 600,
                cursor: followUpBusy || !followUp.trim() ? "default" : "pointer",
              }}>
                {followUpBusy ? <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} /> : "Ask"}
              </button>
            </div>
          </div>
        )}

        <p style={{ color: COLORS.textMuted, fontSize: 11.5, marginTop: 28, fontStyle: "italic" }}>
          For learning and authorized work only — not a substitute for certified, real-world security advice.
        </p>
      </div>
    </div>
  );
}
