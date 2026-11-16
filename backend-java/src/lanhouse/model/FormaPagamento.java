package lanhouse.model;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Formas de pagamento aceitas. O cálculo do total é polimórfico: cada constante
 * decide como tratar o valor bruto. Só o PIX tem desconto (5%).
 */
public enum FormaPagamento {

    PIX("Pix") {
        @Override
        public BigDecimal calcularTotal(BigDecimal valorBruto) {
            return valorBruto.multiply(new BigDecimal("0.95")).setScale(2, RoundingMode.HALF_UP);
        }
    },
    DINHEIRO("Dinheiro"),
    DEBITO("Débito"),
    CREDITO("Crédito");

    private final String descricao;

    FormaPagamento(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }

    /** Total a cobrar para o valor bruto informado. Padrão: valor integral, 2 casas, HALF_UP. */
    public BigDecimal calcularTotal(BigDecimal valorBruto) {
        return valorBruto.setScale(2, RoundingMode.HALF_UP);
    }
}
