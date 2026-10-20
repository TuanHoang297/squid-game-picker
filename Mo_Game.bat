@echo off
title Squid Game Hoc Duong - Khao Bai
cd /d "%~dp0"
echo ===================================================
echo   DANG KHOI DONG SQUID GAME KHAO BAI...
echo ===================================================
echo.
timeout /t 1 /nobreak >nul
start http://localhost:5173/
call npx vite --port 5173
pause
