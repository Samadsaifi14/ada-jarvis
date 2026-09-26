# ADA — Local-First Personal Operating Agent

ADA expands the existing Windows voice assistant into a persistent personal operating agent: local LLM reasoning, voice, memory, tasks, schedules, Google Workspace context, GitHub project monitoring, Windows actions, notifications and optional telephone calls.

> Safety first: ADA does not give the model unrestricted PowerShell, file deletion, messaging, Git pushes, purchases or security-setting access. Tool calls pass through a risk policy and audit log. Risky actions require approval; high-risk actions are blocked.

## Architecture

Mic / CLI / API / Phone
→ speech-to-text
→ Ollama + Qwen
→ orchestrator
→ safety / approvals / audit
→ Google Workspace, GitHub, Windows, n8n, Home Assistant, telephony
→ Piper TTS

Your existing faster-whisper + Ollama/Qwen + Piper ADA stack can remain in place while this repository supplies orchestration, persistent memory, scheduling, integrations, safety and API layers.

## Included in v0.1

- FastAPI local control plane on 127.0.0.1.
- Ollama chat + tool-calling loop.
- SQLite tasks, memory, approvals and audit events.
- SAFE / ASK / BLOCK risk policy.
- Allow-listed Windows app launching, URL opening and file reads.
- Approval-gated diagnostic commands.
- Google OAuth adapter for Gmail, Calendar and Drive.
- GitHub repository monitoring.
- Morning briefing synthesis and scheduler.
- Optional Twilio call trigger.
- n8n and Home Assistant clients.
- faster-whisper and Piper adapters.
- Windows bootstrap/startup scripts.
- CI and core tests.

## Windows quick start

~~~powershell
git clone https://github.com/Samadsaifi14/final-.git
cd final-
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap_windows.ps1
.\.venv\Scripts\Activate.ps1
ada serve
~~~

Open http://127.0.0.1:47821/docs locally.

Read docs/MANUAL_SETUP.md before enabling account integrations or telephone calls.

## Security boundary

The model is treated as untrusted input. It may propose actions; ADA validates the tool, arguments and policy before execution. Sensitive writes require explicit approval. Secrets belong only in .env / secrets/ and are ignored by Git.
