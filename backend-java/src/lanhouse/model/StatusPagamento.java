package lanhouse.model;

public enum StatusPagamento {
    PENDENTE("Pendente"),
    CONFIRMADO("Confirmado"),
    ESTORNADO("Estornado");

    private final String descricao;

    StatusPagamento(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
