@echo off
title Day Code Len GitHub
cd /d "%~dp0"
echo ===================================================
echo     DANG KHOI TAO VA DAY CODE LEN GITHUB...
echo ===================================================
echo.

if not exist .git (
    echo [*] Khoi tao Git repository...
    git init
    git branch -M main
)

echo [*] Dang kiem tra va them cac file vao commit...
git add .
git commit -m "Squid Game Hoc Duong - Random student picker"

echo.
echo ===================================================
echo Hay nhap link repository GitHub cua ban:
echo (Vi du: https://github.com/username/squid-game.git)
echo ===================================================
set /p REPO_URL="Link GitHub Repo: "

if "%REPO_URL%"=="" (
    echo [!] Ban chua nhap link Repo. Thoat!
    pause
    exit /b
)

git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%
echo.
echo [*] Dang day code len GitHub (main)...
git push -u origin main

echo.
echo ===================================================
echo  HOAN TAT! Code da duoc day len GitHub thanh cong.
echo  Bay gio ban co the vao Vercel de Deploy.
echo ===================================================
pause
