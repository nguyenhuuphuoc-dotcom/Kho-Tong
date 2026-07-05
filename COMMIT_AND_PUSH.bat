@echo off
chcp 65001 >nul
title Deploy KhoUNICE Web

cd /d "D:\AI\Test AI\KhoUNICE_Web"

echo.
echo ==========================================
echo   DEPLOY KHOUNICE - HP Cons Viet Nam
echo ==========================================
echo.

:: Kiem tra co thay doi gi khong
git status --short > nul 2>&1
git diff --quiet && git diff --cached --quiet
if %errorlevel%==0 (
    echo [INFO] Khong co thay doi nao de push.
    pause
    exit /b
)

echo [1/3] Cac file da thay doi:
git status --short
echo.

:: Hoi message commit
set /p MSG="[2/3] Nhap mo ta thay doi (Enter de dung mac dinh): "
if "%MSG%"=="" set MSG=update: cap nhat app %date% %time%

:: Add, commit, push
git add -A
git commit -m "%MSG%"

echo.
echo [3/3] Dang push len GitHub...
git push

echo.
echo ==========================================
echo   XONG! Render se tu dong build lai.
echo   Cho ~3-5 phut roi F5 trang web de test.
echo ==========================================
echo.
pause
