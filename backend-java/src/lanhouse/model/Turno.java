package lanhouse.model;

public enum Turno {
    TURNO_1("Turno 1 (08h às 16h)"),
    TURNO_2("Turno 2 (16h às 00h)");

    private final String descricao;

    Turno(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
