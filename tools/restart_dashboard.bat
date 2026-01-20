@echo off
echo === Restarting Dashboard Server ===
echo Killing any existing Python processes...
taskkill /F /IM python.exe 2>nul
timeout /t 2 /nobreak >nul
echo Starting dashboard server on port 5173...
cd /d "%~dp0.."
start "Dashboard Server" python tools/serve_dashboard.py
echo.
echo Server started! Dashboard: http://localhost:5173/dashboard/
pause
