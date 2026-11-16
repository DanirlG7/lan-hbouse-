@echo off
rem Compila (se preciso) e executa. Os argumentos vao direto para o programa:
rem   executar.bat                      menu interativo
rem   executar.bat --demo               roteiro automatico das regras
rem   executar.bat --simular            dia inteiro simulado
rem   executar.bat --simular --semente=7 --painel=120
cd /d "%~dp0"
chcp 65001 >nul
if not exist out call compilar.bat
if errorlevel 1 exit /b 1
java -Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -cp out lanhouse.Main %*
