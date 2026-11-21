@echo off
echo ========================================================
echo         Starting ClipForge Video Studio Pro
echo ========================================================
echo.

echo 1. Starting Backend API Server (FastAPI on Port 8000)...
start "ClipForge Backend" cmd /k "cd /d %~dp0clipforge-backend && python run.py"

timeout /t 2 >nul

echo 2. Starting Web Application (Vite on Port 3000)...
start "ClipForge Web" cmd /k "cd /d %~dp0clipforge-web && npm run dev"

timeout /t 2 >nul

echo 3. Opening Web Studio in Browser...
start http://localhost:3000

echo.
echo ClipForge is now running!
echo - Web Studio:    http://localhost:3000
echo - Backend API:   http://localhost:8000
echo - API Docs:      http://localhost:8000/docs
echo.
pause
