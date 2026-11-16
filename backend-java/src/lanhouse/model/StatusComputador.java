package lanhouse.model;

public enum StatusComputador {
    DISPONIVEL("Disponível"),
    EM_USO("Em uso"),
    MANUTENCAO("Em manutenção");

    private final String descricao;

    StatusComputador(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
