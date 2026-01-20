@echo off
cd /d "c:\Users\Anthony\.gemini\antigravity\scratch\jurassic-knights-valley\tools"
start /B python serve_dashboard.py
echo Dashboard server started at http://localhost:5173
echo You can close this window - server keeps running.
timeout /t 3 >nul
