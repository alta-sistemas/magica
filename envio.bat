@echo off
setlocal EnableDelayedExpansion

REM ===== CONFIGURE AQUI A PASTA DO PROJETO =====
cd /d "C:\Users\Lidy\Downloads\estudio-dtf-halftone"

REM ===== URL DO REPOSITÓRIO =====
set REPO_URL=https://github.com/alta-sistemas/magica.git

echo ==========================================
echo Pasta atual:
cd
echo ==========================================

REM Se não for um repositório ainda, inicializa
if not exist ".git" (
    echo Iniciando repositorio Git...
    git init
)

REM Detecta branch atual
for /f "delims=" %%i in ('git branch --show-current') do set BRANCH=%%i

REM Se não tiver branch ainda, cria main
if "%BRANCH%"=="" (
    set BRANCH=main
    git checkout -b main
)

echo Branch atual: %BRANCH%

REM Adiciona arquivos
git add .

REM Verifica se há mudanças
git diff --cached --quiet
if %errorlevel%==0 (
    echo Nenhuma alteracao para commit.
    goto PUSH
)

set /p MSG=Digite a mensagem do commit: 

git commit -m "%MSG%"

:PUSH

REM Configura remoto (sem erro se já existir)
git remote remove origin 2>nul
git remote add origin %REPO_URL%

REM Tenta puxar antes (evita erro de divergencia)
git pull origin %BRANCH% --rebase 2>nul

REM Faz push
git push -u origin %BRANCH%

echo ==========================================
echo Processo finalizado.
echo ==========================================

pause
