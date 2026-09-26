$ErrorActionPreference = "Stop"

Write-Host "ADA Windows bootstrap"

if (-not (Get-Command python -ErrorAction SilentlyContinue)) {
    throw "Python 3.11+ is required and was not found on PATH."
}
if (-not (Get-Command git -ErrorAction SilentlyContinue)) {
    throw "Git is required and was not found on PATH."
}

if (-not (Test-Path ".venv")) {
    python -m venv .venv
}

& .\.venv\Scripts\python.exe -m pip install --upgrade pip
& .\.venv\Scripts\python.exe -m pip install -e ".[voice,dev]"

if (-not (Test-Path ".env")) {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example. Edit it before enabling integrations."
}

New-Item -ItemType Directory -Force -Path "data" | Out-Null
New-Item -ItemType Directory -Force -Path "secrets" | Out-Null

Write-Host "Checking Ollama..."
try {
    $null = Invoke-RestMethod -Uri "http://127.0.0.1:11434/api/tags" -TimeoutSec 3
    Write-Host "Ollama is reachable."
} catch {
    Write-Warning "Ollama is not reachable at http://127.0.0.1:11434. Start Ollama before running ADA."
}

Write-Host "Bootstrap complete. Edit .env, run google_auth.py if using Google, then activate .venv and run: ada serve"
