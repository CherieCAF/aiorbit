@echo off
title AIOrbit — Dev Server
echo.
echo  ╔══════════════════════════════════════╗
echo  ║   AIOrbit — Personal AI Command Center  ║
echo  ╚══════════════════════════════════════╝
echo.
echo  Starting dev server...
echo  Open http://localhost:3000 in your browser
echo.
cd /d "%~dp0"
npm run dev
pause
