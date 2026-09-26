# ADA Architecture

## Principles

1. Local first.
2. Least privilege.
3. Human approval for sensitive writes.
4. Tool results are authoritative.
5. Every action is auditable.
6. Integrations are replaceable adapters.

## Layers

L8 Interfaces: CLI | local REST API | voice | phone bridge  
L7 Experience: briefings | tasks | project updates | conversations  
L6 Orchestration: Qwen/Ollama tool loop | context assembly  
L5 Safety: risk policy | approvals | audit  
L4 Tools: files | Windows | Google | GitHub | Home Assistant | telephony  
L3 Automation: APScheduler | n8n | webhooks  
L2 Memory: SQLite tasks | memories | approvals | audit  
L1 Speech: faster-whisper | Piper  
L0 OS/hardware: Windows | microphone | speakers | GPU

APScheduler handles ADA-owned routines. n8n handles event workflows, retries and deterministic integrations. The language model should not be used as a cron daemon.

Recommended phone path: telephone provider → secure voice bridge (LiveKit/Pipecat/TwiML) → private ADA API → realtime response. Do not expose ADA's local API directly to the Internet.
