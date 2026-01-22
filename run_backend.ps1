# Run the Backend with the Virtual Environment Python
$VENV_PYTHON = ".\venv\Scripts\python.exe"

Write-Host "Starting AI Document Intelligence Backend..." -ForegroundColor Cyan
& $VENV_PYTHON -m backend.main
