@echo off
echo ================================================
echo    PASSWORD MANAGER - Quick Start
echo ================================================
echo.

cd /d "%~dp0"

echo Installing dependencies...
pip install -r backend\requirements.txt -q

echo.
echo Starting server...
echo.
echo Server URL: http://localhost:5000
echo.
echo To load the extension:
echo   Chrome: chrome://extensions - Load unpacked - Select 'extension' folder
echo   Firefox: about:debugging - Load Temporary Add-on - Select manifest.json
echo.
echo Press Ctrl+C to stop the server
echo ================================================
echo.

python backend\app.py

pause
