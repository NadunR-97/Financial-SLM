@echo off
echo ===================================================
echo     Installing Dependencies for Financial SLM
echo ===================================================

echo [1] Installing Backend Dependencies...
cd code\backend
call .\venv\Scripts\python.exe -m pip install -r requirements.txt
cd ..\..

echo [2] Installing Frontend Dependencies...
cd code\frontend
call npm install
cd ..\..

echo.
echo Installation complete! You can now run start_system.bat
pause
