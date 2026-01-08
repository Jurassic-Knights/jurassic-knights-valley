# Stop Dashboard Server
# Kills all python processes running serve_dashboard.py

Get-Process python -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*serve_dashboard*" } | Stop-Process -Force
Write-Host "Dashboard server stopped" -ForegroundColor Yellow
Start-Sleep -Seconds 1
