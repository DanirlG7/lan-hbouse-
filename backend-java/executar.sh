#!/usr/bin/env sh
# Compila (se preciso) e executa. Os argumentos vão direto para o programa:
#   ./executar.sh                         menu interativo
#   ./executar.sh --demo                  roteiro automático das regras
#   ./executar.sh --simular               dia inteiro simulado
#   ./executar.sh --simular --semente=7 --painel=120
#   ./executar.sh --ajuda
cd "$(dirname "$0")"
[ -d out ] || ./compilar.sh || exit 1
exec java -Dfile.encoding=UTF-8 -Dstdout.encoding=UTF-8 -Dsun.stdout.encoding=UTF-8 -cp out lanhouse.Main "$@"
