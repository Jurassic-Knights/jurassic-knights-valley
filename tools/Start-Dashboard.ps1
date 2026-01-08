# Start Dashboard Server in Background
# Double-click this file or run from PowerShell

$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Start-Process -FilePath python -ArgumentList "serve_dashboard.py" -WindowStyle Hidden

Write-Host "Dashboard server started at http://localhost:8000" -ForegroundColor Green
Write-Host "Server is running in background (no visible window)"
Start-Sleep -Seconds 2
