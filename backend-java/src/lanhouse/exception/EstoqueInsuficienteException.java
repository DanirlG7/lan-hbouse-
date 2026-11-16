package lanhouse.exception;

/** Quantidade pedida maior que o estoque disponível do produto. */
public class EstoqueInsuficienteException extends LanHouseException {

    public EstoqueInsuficienteException(String produto, int disponivel, int solicitado) {
        super("ESTOQUE_INSUFICIENTE", "Estoque insuficiente de \"" + produto + "\": disponível "
                + disponivel + ", solicitado " + solicitado + ".");
    }
}
