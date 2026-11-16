#!/usr/bin/env sh
# Compila e sobe o servidor HTTP JDK 17+ (porta 8080) para integrar com o front-end Web.
cd "$(dirname "$0")"
./compilar.sh || exit 1
exec java -Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -cp out lanhouse.web.ServidorHttpLanHouse
