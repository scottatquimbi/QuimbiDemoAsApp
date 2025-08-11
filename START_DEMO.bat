@echo off
title Quimbi AI Demo Launcher v3.0
color 0A

echo ===============================================
echo       Quimbi AI Demo Launcher v3.0
echo ===============================================
echo.
echo LATEST FEATURES:
echo   Three-part response system (Summary → Solution → Compensation)
echo   Automated ticket generation with unique IDs
echo   Immediate CRM trigger (no user response wait)
echo   Professional third-person case reports
echo   Context-aware responses with player details
echo   Enhanced AI response parsing and duplication prevention
echo.

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org
    echo.
    pause
    exit /b 1
)

:: Check if Ollama is running
echo Checking if Ollama is running...
curl -s http://localhost:11434/api/version >nul 2>&1
if errorlevel 1 (
    echo WARNING: Ollama is not running or not accessible at localhost:11434
    echo Please make sure Ollama is installed and running
    echo You can start Ollama by running: ollama serve
    echo.
    echo Continuing anyway... the demo will show connection errors if Ollama is not available
    echo.
    timeout /t 3
)

:: Check if npm dependencies are installed
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if errorlevel 1 (
        echo ERROR: Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Start the development server
echo.
echo Starting Quimbi AI Demo...
echo The demo will open automatically in your default browser
echo Press Ctrl+C to stop the server when you're done
echo.

:: Start the server and wait a moment for it to start
start /min cmd /c "npm run dev"

:: Wait for server to start and then open browser
timeout /t 5
start http://localhost:3000

echo.
echo Demo is starting...
echo If the browser didn't open automatically, go to: http://localhost:3000
echo.
echo Try the latest features:
echo  - Notice the professional case analysis popup
echo  - Experience the three-part response workflow
echo  - See automated ticket generation and immediate CRM completion
echo  - Observe context-aware responses using player details
echo.
echo Press any key to close this launcher (the server will keep running)
pause >nul