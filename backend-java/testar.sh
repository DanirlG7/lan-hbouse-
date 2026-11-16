#!/usr/bin/env sh
# Compila o sistema e os testes e roda tudo. Termina com código 0 se tudo passou.
set -e
cd "$(dirname "$0")"
./compilar.sh
rm -rf out-teste
mkdir -p out-teste
find teste -name "*.java" > .fontes.tmp
javac -encoding UTF-8 -cp out -d out-teste @.fontes.tmp
rm -f .fontes.tmp
exec java -Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -cp out:out-teste lanhouse.teste.ExecutarTestes
