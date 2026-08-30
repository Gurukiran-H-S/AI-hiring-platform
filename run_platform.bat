@echo off
title AI Unified Recruitment & Candidate Evaluation Platform
color 0A

echo =====================================================================
echo    AI Unified Recruitment & Candidate Evaluation Platform Launcher
echo =====================================================================
echo.
echo [1/2] Starting FastAPI Backend on http://localhost:8000 ...
start "AI Hiring Backend (FastAPI)" cmd /k "cd /d %~dp0backend && venv\Scripts\python -m app.main"

timeout /t 3 /nobreak >nul

echo [2/2] Starting React Vite Frontend on http://localhost:5173 ...
start "AI Hiring Frontend (Vite)" cmd /k "cd /d %~dp0frontend && npm run dev"

echo.
echo =====================================================================
echo  Both services have been launched in dedicated terminal windows!
echo.
echo  - Frontend Web UI:  http://localhost:5173
echo  - Backend REST API: http://localhost:8000
echo  - Swagger API Docs: http://localhost:8000/api/docs
echo.
echo  Demo Credentials:
echo    * Candidate: candidate@gmail.com / admin@123
echo    * Recruiter: recruiter@gmail.com / admin@123
echo    * Admin:     admin@gmail.com     / admin@123
echo =====================================================================
echo.
pause
