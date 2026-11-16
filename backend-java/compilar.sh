#!/usr/bin/env sh
# Compila o sistema para a pasta ./out (precisa de JDK 17 ou mais novo).
set -e
cd "$(dirname "$0")"
rm -rf out
mkdir -p out
find src -name "*.java" > .fontes.tmp
javac -encoding UTF-8 -d out @.fontes.tmp
rm -f .fontes.tmp
echo "Compilado em ./out"
