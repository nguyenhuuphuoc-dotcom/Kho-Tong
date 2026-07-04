@echo off
chcp 65001 >nul
echo ========================================
echo  COMMIT VA PUSH LEN GITHUB
echo ========================================
echo.

cd /d "D:\AI\Test AI\KhoUNICE_Web"

echo [1/3] Kiem tra trang thai...
git status --short
echo.

echo [2/3] Add tat ca thay doi...
git add -A

echo [3/3] Commit va push...
git commit -m "feat: TonKho CRUD + them dau tieng Viet toan bo UI + edit/xoa danh muc + autocomplete"
git push

echo.
echo ========================================
echo  XONG! Render se tu dong build lai.
echo  Cho ~3-5 phut roi Ctrl+Shift+R de test.
echo ========================================
pause
