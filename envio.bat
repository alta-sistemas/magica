@echo off
setlocal

cd /d "C:\Users\Lidy\Downloads\estudio-dtf-halftone"

set REPO_URL=https://github.com/alta-sistemas/magica.git

echo Pasta atual:
cd

git add .

set /p MSG=Digite a mensagem do commit: 

git commit -m "%MSG%"

git remote remove origin 2>nul
git remote add origin %REPO_URL%

git push -u origin master

pause
