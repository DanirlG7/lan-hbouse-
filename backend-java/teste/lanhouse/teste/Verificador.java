package lanhouse.teste;

import java.io.PrintStream;
import java.math.BigDecimal;

/** Conferências simples para os testes (o projeto não usa framework de testes). */
final class Verificador {

    private final PrintStream saida;
    private int total;
    private int falhas;

    Verificador(String grupo, PrintStream saida) {
        this.saida = saida;
        saida.println();
        saida.println("--- " + grupo);
    }

    void confere(String descricao, boolean condicao) {
        total++;
        if (condicao) {
            saida.println("  ok      " + descricao);
        } else {
            falhas++;
            saida.println("  FALHOU  " + descricao);
        }
    }

    void valor(String descricao, String esperado, BigDecimal atual) {
        confere(descricao + " (esperado " + esperado + ", obtido " + atual + ")",
                atual != null && new BigDecimal(esperado).compareTo(atual) == 0);
    }

    void igual(String descricao, Object esperado, Object atual) {
        confere(descricao + " (esperado " + esperado + ", obtido " + atual + ")",
                esperado == null ? atual == null : esperado.equals(atual));
    }

    /** A ação precisa lançar exatamente uma exceção do tipo informado (ou subtipo). */
    void recusa(String descricao, Class<? extends Throwable> tipo, Runnable acao) {
        try {
            acao.run();
            confere(descricao + " (deveria ter sido recusado)", false);
        } catch (Throwable t) {
            confere(descricao + " -> " + t.getClass().getSimpleName(), tipo.isInstance(t));
        }
    }

    int falhas() {
        return falhas;
    }

    int total() {
        return total;
    }
}
