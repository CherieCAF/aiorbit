@echo off
title AIOrbit — Command Center
setlocal enabledelayedexpansion

:: Aesthetic Header
echo.
echo  ╔════════════════════════════════════════════════════════╗
echo  ║  AIOrbit: Startup AI Governance ^& Financial Oversight    ║
echo  ╚════════════════════════════════════════════════════════╝
echo.

:: Check for node_modules
if not exist "node_modules\" (
    echo  [!] Missing dependencies. Running npm install...
    call npm install
)

echo.
echo  [+] Starting Secure Dev Environment...
echo  Access Portal: http://localhost:3000
echo.

:: Launch App
cd /d "%~dp0"
npm run dev

pause
