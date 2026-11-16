package lanhouse.exception;

/** Já existe um pagamento pendente ou confirmado para a sessão. */
public class PagamentoDuplicadoException extends LanHouseException {

    public PagamentoDuplicadoException(String mensagem) {
        super("PAGAMENTO_DUPLICADO", mensagem);
    }
}
