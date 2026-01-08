@echo off
cd /d "%~dp0"
powershell -WindowStyle Hidden -Command "Start-Process python -ArgumentList 'serve_dashboard.py' -WindowStyle Hidden"
echo Dashboard started at http://localhost:8765
timeout /t 2 >nul
