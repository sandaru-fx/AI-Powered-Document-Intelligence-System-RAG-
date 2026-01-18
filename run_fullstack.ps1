$ErrorActionPreference = "Stop"

Write-Host "Starting AI Document Intelligence (Full-Stack)..." -ForegroundColor Cyan

# Ensure we are in the root directory (script location)
$RootDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $RootDir

# 1. Start Backend (Run as module from root in a new window)
Write-Host "Starting Backend on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", ".\venv\Scripts\python.exe -m backend.main"

# 2. Wait a few seconds for backend to initialize
Start-Sleep -Seconds 3

# 3. Start Frontend (In a new window)
Write-Host "Starting Frontend on http://localhost:3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

Write-Host "Both servers are starting up in separate windows!" -ForegroundColor Yellow
Write-Host "You can close this window now." -ForegroundColor Gray
