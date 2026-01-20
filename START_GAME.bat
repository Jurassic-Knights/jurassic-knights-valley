@echo off
cd /d "%~dp0"
echo Starting Jurassic Knights dev server...
echo.
echo Game will open at http://localhost:5173
echo Press Ctrl+C to stop the server
echo.
npm run dev
pause
