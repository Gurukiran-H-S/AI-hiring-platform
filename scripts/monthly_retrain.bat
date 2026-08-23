@echo off
REM ============================================================
REM  HireAI Monthly Model Retraining
REM  Called by Windows Task Scheduler on the 1st of every month.
REM  Manual run: double-click this file or run from cmd.
REM ============================================================

set BACKEND_DIR=%~dp0..\backend

echo [%date% %time%] Starting HireAI monthly retrain...
cd /d "%BACKEND_DIR%"

call venv\Scripts\activate.bat
python -m ml.training.monthly_retrain

echo [%date% %time%] Retrain finished. See backend\ml\logs for details.
pause
