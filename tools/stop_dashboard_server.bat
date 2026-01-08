@echo off
echo Stopping Dashboard Server...
taskkill /F /IM pythonw.exe /FI "WINDOWTITLE eq serve_dashboard*" 2>nul
taskkill /F /IM python.exe /FI "WINDOWTITLE eq serve_dashboard*" 2>nul
echo Done.
pause
