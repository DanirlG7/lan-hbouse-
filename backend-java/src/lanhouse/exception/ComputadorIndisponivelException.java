package lanhouse.exception;

/** Computador em uso ou em manutenção: não pode iniciar nova sessão. */
public class ComputadorIndisponivelException extends LanHouseException {

    public ComputadorIndisponivelException(String mensagem) {
        super("COMPUTADOR_INDISPONIVEL", mensagem);
    }
}
