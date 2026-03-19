@echo off
echo ===================================================
echo     Starting Financial SLM System 
echo ===================================================

echo [1] Starting Backend Server (FastAPI / Uvicorn)
start cmd /k "cd code\backend && .\venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"

echo [2] Starting Frontend Server (Vite / React)
start cmd /k "cd code\frontend && npm run dev"

echo.
echo Both servers are starting up in separate windows!
echo Backend API: http://127.0.0.1:8000
echo Frontend UI: http://localhost:5173
echo.
echo You can close this window.
pause
