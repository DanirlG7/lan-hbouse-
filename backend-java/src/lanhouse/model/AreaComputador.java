package lanhouse.model;

import java.math.BigDecimal;

/** Área do computador, com a tarifa horária padrão de cada uma. */
public enum AreaComputador {
    COMUM("Área Comum", new BigDecimal("6.00")),
    VIP("VIP", new BigDecimal("10.00"));

    private final String descricao;
    private final BigDecimal tarifaPadrao;

    AreaComputador(String descricao, BigDecimal tarifaPadrao) {
        this.descricao = descricao;
        this.tarifaPadrao = tarifaPadrao;
    }

    public String getDescricao() {
        return descricao;
    }

    public BigDecimal getTarifaPadrao() {
        return tarifaPadrao;
    }
}
