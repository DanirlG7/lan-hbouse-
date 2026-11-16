package lanhouse.teste;

import java.io.PrintStream;

/** Roda todos os testes e termina com código 0 (tudo certo) ou 1 (alguma falha). */
public final class ExecutarTestes {

    private ExecutarTestes() {
    }

    public static void main(String[] args) throws Exception {
        PrintStream out = System.out;
        long inicio = System.nanoTime();
        int falhas = 0;
        falhas += TesteRegras.executar(out);
        falhas += TesteBarramento.executar(out);
        falhas += TesteGravacao.executar(out);
        falhas += TesteSimulacao.executar(out);
        falhas += TesteFachada.executar(out);

        out.println();
        out.println("=".repeat(60));
        out.println(falhas == 0 ? " TODOS OS TESTES PASSARAM" : " " + falhas + " FALHA(S)");
        out.println(" tempo: " + (System.nanoTime() - inicio) / 1_000_000 + " ms");
        out.println("=".repeat(60));
        System.exit(falhas == 0 ? 0 : 1);
    }
}
