@echo off
echo ============================
echo DIAGNOSTICO GIT
echo ============================

echo.
echo Pasta atual:
cd

echo.
echo Testando git...
git --version

echo.
echo Status do repositorio:
git status

echo.
echo Remotos configurados:
git remote -v

echo.
pause
