package lanhouse.exception;

/** Busca por ID ou número que não encontrou nenhum registro. */
public class EntidadeNaoEncontradaException extends LanHouseException {

    public EntidadeNaoEncontradaException(String mensagem) {
        super("NAO_ENCONTRADO", mensagem);
    }

    public EntidadeNaoEncontradaException(String entidade, Object identificador) {
        this(entidade + " não encontrado(a): " + identificador + ".");
    }
}
