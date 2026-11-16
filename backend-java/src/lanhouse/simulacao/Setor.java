package lanhouse.simulacao;

import lanhouse.model.AreaComputador;

/** Lugares da lan house vistos de cima. O front desenha um cenário para cada setor. */
public enum Setor {
    RUA("Rua"),
    RECEPCAO("Recepção"),
    AREA_COMUM("Área Comum"),
    AREA_VIP("Área VIP"),
    BOMBONIERE("Bomboniere"),
    MANUTENCAO("Manutenção"),
    ESCRITORIO("Escritório");

    private final String descricao;

    Setor(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }

    /** Setor onde fica um computador da área informada. */
    public static Setor doComputador(AreaComputador area) {
        return area == AreaComputador.VIP ? AREA_VIP : AREA_COMUM;
    }
}
