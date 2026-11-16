package lanhouse.model;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.EnumMap;
import java.util.Map;

import lanhouse.exception.DadosInvalidosException;
import lanhouse.util.Validador;

/** Resultado imutável do relatório de faturamento de um período (datas inclusivas). */
public record Relatorio(LocalDate de, LocalDate ate, int pagamentosConfirmados,
                        Map<FormaPagamento, BigDecimal> faturamentoPorForma,
                        BigDecimal faturamentoTotal) {

    public Relatorio {
        Validador.naoNulo(de, "Data inicial");
        Validador.naoNulo(ate, "Data final");
        Validador.naoNulo(faturamentoPorForma, "Faturamento por forma");
        Validador.naoNulo(faturamentoTotal, "Faturamento total");
        if (de.isAfter(ate)) {
            throw new DadosInvalidosException("A data inicial não pode ser posterior à data final.");
        }
        EnumMap<FormaPagamento, BigDecimal> copia = new EnumMap<>(FormaPagamento.class);
        copia.putAll(faturamentoPorForma);
        faturamentoPorForma = Collections.unmodifiableMap(copia);
    }
}
