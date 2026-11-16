@echo off
rem Compila o sistema para a pasta .\out (precisa de JDK 17 ou mais novo).
cd /d "%~dp0"
if exist out rmdir /s /q out
mkdir out
javac -encoding UTF-8 -d out -sourcepath src src\lanhouse\Main.java src\lanhouse\web\ServidorHttpLanHouse.java
if errorlevel 1 exit /b 1
echo Compilado em .\out
