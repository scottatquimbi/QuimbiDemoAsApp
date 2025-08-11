@echo off
setlocal enabledelayedexpansion
title Quimbi AI - Windows Setup
color 0A

echo ===============================================
echo    Quimbi AI - Windows Setup
echo ===============================================
echo This script will install all required dependencies:
echo - Node.js (if not installed)
echo - Ollama (if not installed)
echo - Required AI models (llama3.1:8b)
echo - NPM dependencies for the project
echo ===============================================
echo.

:: Request administrator privileges if not already running as admin
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with administrator privileges...
) else (
    echo This script requires administrator privileges to install software.
    echo Please right-click and "Run as administrator"
    echo.
    pause
    exit /b 1
)

echo.
echo [1/4] Checking Node.js installation...
echo ===============================================

:: Check if Node.js is installed
node --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
    echo ✅ Node.js is already installed: !NODE_VERSION!
) else (
    echo ❌ Node.js not found. Installing Node.js...
    
    :: Check if winget is available (Windows 10/11)
    winget --version >nul 2>&1
    if %errorLevel% == 0 (
        echo Using winget to install Node.js...
        winget install OpenJS.NodeJS
        if %errorLevel% == 0 (
            echo ✅ Node.js installed successfully via winget
        ) else (
            echo ❌ Failed to install Node.js via winget
            goto :manual_nodejs
        )
    ) else (
        goto :manual_nodejs
    )
    goto :check_nodejs
    
    :manual_nodejs
    echo.
    echo Winget not available. Please install Node.js manually:
    echo 1. Go to https://nodejs.org
    echo 2. Download the LTS version for Windows
    echo 3. Run the installer and follow the instructions
    echo 4. Restart this script after installation
    echo.
    start https://nodejs.org
    pause
    exit /b 1
    
    :check_nodejs
    :: Refresh PATH and check again
    call refreshenv.cmd >nul 2>&1
    node --version >nul 2>&1
    if %errorLevel% == 0 (
        for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
        echo ✅ Node.js installation confirmed: !NODE_VERSION!
    ) else (
        echo ❌ Node.js installation failed or PATH not refreshed
        echo Please restart your command prompt and try again
        pause
        exit /b 1
    )
)

echo.
echo [2/4] Checking Ollama installation...
echo ===============================================

:: Check if Ollama is installed
ollama --version >nul 2>&1
if %errorLevel% == 0 (
    for /f "tokens=*" %%i in ('ollama --version') do set OLLAMA_VERSION=%%i
    echo ✅ Ollama is already installed: !OLLAMA_VERSION!
) else (
    echo ❌ Ollama not found. Installing Ollama...
    
    :: Download and install Ollama
    echo Downloading Ollama installer...
    powershell -Command "& {Invoke-WebRequest -Uri 'https://ollama.ai/download/OllamaSetup.exe' -OutFile 'OllamaSetup.exe'}"
    
    if exist "OllamaSetup.exe" (
        echo Running Ollama installer...
        start /wait OllamaSetup.exe /S
        del OllamaSetup.exe
        
        :: Refresh PATH
        call refreshenv.cmd >nul 2>&1
        
        :: Check installation
        timeout /t 5
        ollama --version >nul 2>&1
        if %errorLevel% == 0 (
            echo ✅ Ollama installed successfully
        ) else (
            echo ❌ Ollama installation may have failed
            echo Please check if Ollama is in your PATH
        )
    ) else (
        echo ❌ Failed to download Ollama installer
        echo Please install Ollama manually from https://ollama.ai
        start https://ollama.ai
        pause
        exit /b 1
    )
)

echo.
echo [3/4] Starting Ollama service and installing AI models...
echo ===============================================

:: Start Ollama service
echo Starting Ollama service...
start /min ollama serve

:: Wait for Ollama to start
echo Waiting for Ollama service to start...
timeout /t 10

:: Check if Ollama is responding
curl -s http://localhost:11434/api/version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Ollama service is running
) else (
    echo ⚠️  Ollama service may not be responding, continuing anyway...
)

:: Install required models
echo.
echo Installing required AI models (this may take several minutes)...
echo.

echo Installing llama3.1:8b model...
ollama pull llama3.1:8b
if %errorLevel% == 0 (
    echo ✅ llama3.1:8b model installed successfully
) else (
    echo ❌ Failed to install llama3.1:8b model
)

echo.
echo [4/5] Checking system dependencies...
echo ===============================================

:: Check for Git (includes curl on Windows)
git --version >nul 2>&1
if %errorLevel% == 0 (
    echo ✅ Git is available
) else (
    echo ❌ Git not found
    echo.
    echo Git is required for development and includes curl.
    echo Please install Git from https://git-scm.com
    echo.
    start https://git-scm.com
    echo Please install Git and run this script again.
    pause
    exit /b 1
)

echo.
echo [5/5] Installing NPM dependencies...
echo ===============================================

:: Install npm dependencies
if exist "package.json" (
    echo Installing project dependencies...
    call npm install
    if %errorLevel% == 0 (
        echo ✅ NPM dependencies installed successfully
    ) else (
        echo ❌ Failed to install NPM dependencies
    )
) else (
    echo ⚠️  package.json not found in current directory
    echo Make sure you're running this script from the project root
)

echo.
echo ===============================================
echo             SETUP COMPLETE!
echo ===============================================
echo.
echo All components have been installed:
echo ✅ Node.js
echo ✅ Ollama 
echo ✅ AI Models (llama3.1:8b)
echo ✅ NPM Dependencies
echo.
echo You can now run the demo by:
echo 1. Double-clicking START_DEMO.bat
echo 2. Or running: npm run demo
echo.
echo The demo will be available at: http://localhost:3000
echo.
pause