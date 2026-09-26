$ErrorActionPreference = "Stop"
$base = "http://127.0.0.1:47821"
Write-Host "Health:"
Invoke-RestMethod "$base/health" | ConvertTo-Json -Depth 8
Write-Host "Tasks:"
Invoke-RestMethod "$base/v1/tasks" | ConvertTo-Json -Depth 8
