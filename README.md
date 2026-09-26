# ADA — Local-First Personal Operating Agent

ADA expands the existing Windows voice assistant into a persistent personal operating agent: local LLM reasoning, voice, memory, tasks, schedules, Google Workspace context, GitHub project monitoring, Windows actions, notifications and optional telephone calls.

> Safety first: ADA does not give the model unrestricted PowerShell, file deletion, messaging, Git pushes, purchases or security-setting access. Tool calls pass through a risk policy and audit log. Risky actions require approval; high-risk actions are blocked.

## Architecture

Mic / CLI / API / Phone
→ faster-whisper
→ Ollama + Qwen
→ orchestrator
→ safety / approvals / audit
→ Google Workspace, GitHub, Windows, n8n, Home Assistant, telephony
→ Piper TTS
→ speaker

## Included in v0.2

- FastAPI local control plane on 127.0.0.1.
- Ollama chat + tool-calling loop.
- SQLite tasks, memory, approvals and audit events.
- SAFE / ASK / BLOCK risk policy.
- Allow-listed Windows app launching, URL opening and file reads.
- Approval-gated diagnostic commands.
- Google OAuth adapter for Gmail, Calendar and Drive.
- GitHub repository monitoring.
- Morning briefing synthesis and scheduler.
- Optional Twilio call trigger abstraction.
- n8n and Home Assistant clients.
- faster-whisper speech recognition.
- Microphone recording and device discovery.
- Piper synthesis and speaker playback.
- Interactive voice loop: microphone → Whisper → ADA → Qwen → Piper.
- ADA doctor diagnostics for local and optional layers.
- Windows bootstrap/startup scripts.
- CI and core tests.

## Windows quick start

~~~powershell
git clone https://github.com/Samadsaifi14/ada-jarvis.git
cd ada-jarvis
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap_windows.ps1
.\.venv\Scripts\Activate.ps1
pip install -e ".[voice]"
ada doctor
ada serve
~~~

Open http://127.0.0.1:47821/docs locally.

### Test text first

~~~powershell
ada chat "Hello ADA"
~~~

### Inspect microphones and speakers

~~~powershell
ada audio-devices
~~~

### Test one spoken turn

~~~powershell
ada voice-once --seconds 6
~~~

If Piper has not been configured yet, test speech recognition + reasoning without TTS:

~~~powershell
ada voice-once --seconds 6 --no-speak
~~~

### Run interactive voice mode

~~~powershell
ada voice --seconds 6
~~~

Press Enter, speak for the configured number of seconds, and ADA will transcribe, reason and respond. Type q to leave voice mode.

## Piper

Set the actual executable and voice model paths in .env:

~~~text
ADA_PIPER_EXE=C:\path\to\piper.exe
ADA_PIPER_MODEL=C:\path\to\en_US-lessac-medium.onnx
~~~

Do not use placeholder paths.

## Diagnostics

~~~powershell
ada doctor
~~~

This checks Ollama/Qwen, audio devices, Piper, Google authorization, GitHub configuration, n8n and Home Assistant. Optional integrations may report NO until you configure them; Ollama is the core readiness check.

Read docs/MANUAL_SETUP.md before enabling account integrations or telephone calls.

## Security boundary

The model is treated as untrusted input. It may propose actions; ADA validates the tool, arguments and policy before execution. Sensitive writes require explicit approval. Secrets belong only in .env / secrets/ and are ignored by Git.
