package lanhouse.model;

public enum StatusSessao {
    ATIVA("Ativa"),
    ENCERRADA("Encerrada");

    private final String descricao;

    StatusSessao(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
