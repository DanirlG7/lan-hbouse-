package lanhouse.simulacao;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Objects;

import lanhouse.exception.DadosInvalidosException;

/**
 * Parâmetros de um dia simulado. Com a mesma configuração (principalmente a semente) o dia
 * acontece sempre igual, o que torna a simulação repetível e testável.
 *
 * Horários: a loja abre em "abertura", para de aceitar clientes novos em "ultimaEntrada" e
 * encerra em "fechamento". Tudo precisa acontecer no mesmo dia, para o relatório do dia fechar.
 */
public record ConfiguracaoSimulacao(long semente, LocalDate dia, LocalTime abertura, LocalTime ultimaEntrada,
                                    LocalTime fechamento, double chegadasPorHora, double chanceNovoCliente,
                                    double chanceAreaVip, double falhaPcPorMinuto, double chanceLimpeza,
                                    double chanceEstorno) {

    public ConfiguracaoSimulacao {
        Objects.requireNonNull(dia, "dia");
        Objects.requireNonNull(abertura, "abertura");
        Objects.requireNonNull(ultimaEntrada, "ultimaEntrada");
        Objects.requireNonNull(fechamento, "fechamento");
        if (!abertura.isBefore(ultimaEntrada) || !ultimaEntrada.isBefore(fechamento)) {
            throw new DadosInvalidosException("Horários inválidos: abertura < última entrada < fechamento.");
        }
        if (fechamento.isAfter(LocalTime.of(23, 55))) {
            throw new DadosInvalidosException("O fechamento deve ser até 23:55, para tudo acontecer no mesmo dia.");
        }
        if (chegadasPorHora < 0) {
            throw new DadosInvalidosException("Chegadas por hora não pode ser negativo.");
        }
        probabilidade(chanceNovoCliente, "chanceNovoCliente");
        probabilidade(chanceAreaVip, "chanceAreaVip");
        probabilidade(falhaPcPorMinuto, "falhaPcPorMinuto");
        probabilidade(chanceLimpeza, "chanceLimpeza");
        probabilidade(chanceEstorno, "chanceEstorno");
    }

    private static void probabilidade(double valor, String nome) {
        if (valor < 0 || valor > 1) {
            throw new DadosInvalidosException(nome + " deve estar entre 0 e 1.");
        }
    }

    /** Dia padrão: 31/10/2026, das 08h às 23h55, com movimento moderado. */
    public static ConfiguracaoSimulacao padrao(long semente) {
        return new ConfiguracaoSimulacao(semente, LocalDate.of(2026, 10, 31),
                LocalTime.of(8, 0), LocalTime.of(22, 30), LocalTime.of(23, 55),
                5.0, 0.25, 0.25, 0.0004, 0.60, 0.04);
    }
}
