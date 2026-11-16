package lanhouse.exception;

/** Base de todas as exceções de negócio. O código estável serve para logs e auditoria. */
public class LanHouseException extends RuntimeException {

    private final String codigo;

    public LanHouseException(String codigo, String mensagem) {
        super(mensagem);
        this.codigo = codigo;
    }

    public LanHouseException(String codigo, String mensagem, Throwable causa) {
        super(mensagem, causa);
        this.codigo = codigo;
    }

    public String getCodigo() {
        return codigo;
    }
}
