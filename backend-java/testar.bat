@echo off
rem Compila o sistema e os testes e roda tudo. Termina com codigo 0 se tudo passou.
cd /d "%~dp0"
chcp 65001 >nul
call compilar.bat
if errorlevel 1 exit /b 1
if exist out-teste rmdir /s /q out-teste
mkdir out-teste
javac -encoding UTF-8 -cp out -d out-teste -sourcepath teste teste\lanhouse\teste\ExecutarTestes.java
if errorlevel 1 exit /b 1
java -Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -cp out;out-teste lanhouse.teste.ExecutarTestes
