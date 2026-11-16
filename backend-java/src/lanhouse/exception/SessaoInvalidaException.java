package lanhouse.exception;

/** Operação incompatível com o estado da sessão (encerrar sessão já encerrada, consumo em sessão encerrada). */
public class SessaoInvalidaException extends LanHouseException {

    public SessaoInvalidaException(String mensagem) {
        super("SESSAO_INVALIDA", mensagem);
    }
}
