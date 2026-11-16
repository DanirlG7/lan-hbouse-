package lanhouse.exception;

/** Transição de pagamento não permitida (estornar sem confirmar, confirmar duas vezes, sessão ainda ativa). */
public class PagamentoInvalidoException extends LanHouseException {

    public PagamentoInvalidoException(String mensagem) {
        super("PAGAMENTO_INVALIDO", mensagem);
    }
}
