@echo off
title Game Support AI - One-Click Setup

echo ===============================================
echo    Game Support AI - One-Click Setup  
echo ===============================================
echo.
echo This will install everything you need:
echo - Node.js (if missing)
echo - Ollama AI platform  
echo - Required AI models
echo - Project dependencies
echo.
echo Choose your installation method:
echo.
echo [1] Windows-specific installer (recommended for Windows)
echo [2] Universal Node.js installer (works on all platforms)
echo [3] Exit
echo.

choice /c 123 /n /m "Enter your choice (1, 2, or 3): "

if errorlevel 3 goto :exit
if errorlevel 2 goto :universal
if errorlevel 1 goto :windows

:windows
echo.
echo Running Windows-specific setup...
call SETUP_WINDOWS.bat
goto :end

:universal
echo.
echo Running universal Node.js setup...
node SETUP.js
if errorlevel 1 (
    echo.
    echo Universal setup requires Node.js to be installed first.
    echo Falling back to Windows-specific setup...
    call SETUP_WINDOWS.bat
)
goto :end

:exit
echo.
echo Setup cancelled.
goto :end

:end
echo.
pause