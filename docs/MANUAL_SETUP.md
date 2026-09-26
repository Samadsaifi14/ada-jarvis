# Manual setup

These steps require your PC, credentials or explicit account consent.

## 1. Clone and install

~~~powershell
git clone https://github.com/Samadsaifi14/final-.git
cd final-
powershell -ExecutionPolicy Bypass -File .\scripts\bootstrap_windows.ps1
~~~

After renaming the repository to ada-jarvis, use the new URL instead.

## 2. Ollama / Qwen

Make sure Ollama is running at http://127.0.0.1:11434.

~~~powershell
ollama list
ollama pull qwen3:8b
~~~

Set ADA_LLM_MODEL in .env to the exact installed model name.

## 3. Existing ADA voice stack

Set ADA_PIPER_EXE, ADA_PIPER_MODEL, ADA_WHISPER_MODEL, ADA_WHISPER_DEVICE and ADA_WHISPER_COMPUTE_TYPE in .env.

Your existing wake-word/microphone loop can call POST /v1/chat. The repository already contains reusable faster-whisper and Piper adapters.

## 4. Gmail / Calendar / Drive

ChatGPT connections do not transfer credentials to the local ADA process.

In Google Cloud Console:
1. Enable Gmail API, Calendar API and Drive API.
2. Configure OAuth consent.
3. Create an OAuth Client ID for Desktop app.
4. Save the downloaded JSON as secrets/google_client_secret.json.
5. Run:

~~~powershell
.\.venv\Scripts\python.exe .\scripts\google_auth.py
~~~

Start read-only. Enable ADA_GOOGLE_WRITE_ENABLED only after reviewing scopes.

## 5. GitHub monitoring

Create a fine-grained read-only PAT and put it in .env:

ADA_GITHUB_TOKEN=...
ADA_GITHUB_REPOS=Samadsaifi14/bio-nexus-

Do not give write access initially.

## 6. n8n

Install Docker Desktop, then:

~~~powershell
docker compose up -d n8n
~~~

Open http://127.0.0.1:5678 and create the local owner account.

## 7. Home Assistant

Create a long-lived token and set ADA_HOME_ASSISTANT_URL and ADA_HOME_ASSISTANT_TOKEN.

## 8. Telephone calls

Create/verify a telephony account and secure HTTPS voice bridge. Set the Twilio variables only if using Twilio. Exotel/SIP can replace the provider adapter.

Do not expose port 47821 directly to the public Internet.

## 9. Test

~~~powershell
.\.venv\Scripts\Activate.ps1
ada serve
~~~

In another terminal:

~~~powershell
powershell -ExecutionPolicy Bypass -File .\scripts\smoke_test.ps1
ada chat "List my open tasks"
ada briefing
~~~

## 10. Start with Windows

Only after tests pass:

~~~powershell
powershell -ExecutionPolicy Bypass -File .\scripts\install_startup_task.ps1
~~~

Keep Google/GitHub read-only, outbound calls disabled and arbitrary shell blocked during initial testing.
