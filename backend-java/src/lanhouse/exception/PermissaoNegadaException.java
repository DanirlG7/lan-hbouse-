package lanhouse.exception;

/** O cargo do operador não possui a permissão exigida pela operação. */
public class PermissaoNegadaException extends LanHouseException {

    public PermissaoNegadaException(String mensagem) {
        super("PERMISSAO_NEGADA", mensagem);
    }
}
