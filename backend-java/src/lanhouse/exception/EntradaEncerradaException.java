package lanhouse.exception;

/**
 * Fim da entrada do console (Ctrl+D / Ctrl+Z). Fica fora da hierarquia de negócio de
 * propósito: não é erro do usuário e não deve ser tratada como mensagem amigável.
 */
public class EntradaEncerradaException extends RuntimeException {

    public EntradaEncerradaException() {
        super("Entrada encerrada.");
    }
}
