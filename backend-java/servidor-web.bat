@echo off
rem Compila e sobe o servidor HTTP JDK 17+ (porta 8080) para integrar com o front-end Web.
cd /d "%~dp0"
chcp 65001 >nul
call compilar.bat
if errorlevel 1 exit /b 1
java -Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -cp out lanhouse.web.ServidorHttpLanHouse
