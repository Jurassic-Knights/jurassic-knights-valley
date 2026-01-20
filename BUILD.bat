@echo off
cd /d "%~dp0"
echo Building production bundle...
echo.
call npm run build
echo.
echo Build complete! Output in dist/ folder
pause
