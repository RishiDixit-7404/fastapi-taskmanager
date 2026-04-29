@echo off
setlocal

cd /d "%~dp0"

if not exist ".venv\Scripts\python.exe" (
    echo Virtual environment not found. Run install_backend_deps.bat first.
    exit /b 1
)

".venv\Scripts\python.exe" -m uvicorn main:app --reload --host 127.0.0.1 --port 8080
