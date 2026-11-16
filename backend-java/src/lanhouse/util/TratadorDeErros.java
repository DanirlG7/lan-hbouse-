package lanhouse.util;

import lanhouse.exception.EntradaEncerradaException;
import lanhouse.exception.LanHouseException;

/** Executa ações dos controllers convertendo exceções em mensagens, sem mostrar stack trace. */
public final class TratadorDeErros {

    private TratadorDeErros() {
    }

    /**
     * Erros de negócio mostram a própria mensagem. Erros inesperados mostram uma mensagem
     * genérica e vão para o log. O fim da entrada do console é repassado adiante.
     */
    public static void executar(ConsoleIO io, String origem, Runnable acao) {
        try {
            acao.run();
        } catch (EntradaEncerradaException e) {
            throw e;
        } catch (LanHouseException e) {
            io.erro(e.getMessage());
            AppLog.aviso(origem + " | " + e.getCodigo() + " | " + e.getMessage());
        } catch (RuntimeException e) {
            io.erro("Ocorreu um erro inesperado. A operação foi cancelada.");
            AppLog.erro(origem + " | falha inesperada", e);
        }
    }
}
