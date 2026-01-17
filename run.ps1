$ErrorActionPreference = "Stop"

# Check if venv exists
if (-not (Test-Path "venv")) {
    Write-Host "Creating virtual environment..." -ForegroundColor Yellow
    python -m venv venv
}

# Activate virtual environment
Write-Host "Activating virtual environment..." -ForegroundColor Green
. .\venv\Scripts\Activate.ps1

# Install dependencies if needed
if (Test-Path "requirements.txt") {
    Write-Host "Checking dependencies..." -ForegroundColor Green
    pip install -r requirements.txt
}

# Run the app
Write-Host "Starting Streamlit app..." -ForegroundColor Cyan
streamlit run app.py
