$ErrorActionPreference = "Stop"
$Repo = (Resolve-Path "$PSScriptRoot\..").Path
$Python = Join-Path $Repo ".venv\Scripts\python.exe"

if (-not (Test-Path $Python)) {
    throw "Virtual environment missing. Run bootstrap_windows.ps1 first."
}

$Action = New-ScheduledTaskAction -Execute $Python -Argument "-m uvicorn ada.api.app:app --host 127.0.0.1 --port 47821" -WorkingDirectory $Repo
$Trigger = New-ScheduledTaskTrigger -AtLogOn -User $env:USERNAME
$Settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 1)
Register-ScheduledTask -TaskName "ADA Personal Agent" -Action $Action -Trigger $Trigger -Settings $Settings -Description "Starts ADA local agent after sign-in" -Force | Out-Null
Write-Host "Installed Windows Scheduled Task: ADA Personal Agent"
