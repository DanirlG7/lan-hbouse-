package lanhouse.simulacao;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

import lanhouse.model.FormaPagamento;
import lanhouse.model.Relatorio;
import lanhouse.util.Formatador;

/**
 * Números do dia simulado. "faturamento" é o relatório oficial do sistema (só pagamentos
 * confirmados e não estornados); os demais vêm dos eventos publicados pelos serviços.
 */
public record ResumoDoDia(LocalDate dia, long semente, int chegadas, int desistencias, int atendidos,
                          int novosClientes, int sessoes, long minutosCobrados, int itensVendidos,
                          BigDecimal vendasBomboniere, int vendasEsgotadas, int reposicoesDeEstoque,
                          int estornos, BigDecimal valorEstornado, int limpezas, int reparos,
                          int totalComputadores, int picoDeOcupacao, int filaMaxima, Relatorio faturamento,
                          List<LinhaHoraria> porHora, List<String> anomalias) {

    public ResumoDoDia {
        porHora = List.copyOf(porHora);
        anomalias = List.copyOf(anomalias);
    }

    /** Uma linha da tabela por hora. O faturamento é líquido: confirmações menos estornos da hora. */
    public record LinhaHoraria(int hora, int chegadas, double ocupacaoPercentual, BigDecimal faturamento) {
    }

    public String texto() {
        String linha = "=".repeat(60);
        StringBuilder sb = new StringBuilder();
        sb.append(linha).append('\n');
        sb.append(" RESUMO DO DIA ").append(Formatador.data(dia)).append("  (semente ").append(semente).append(")\n");
        sb.append(linha).append('\n');
        sb.append(String.format("  Chegadas: %d | Desistências: %d | Atendidos (pagos): %d%n",
                chegadas, desistencias, atendidos));
        sb.append(String.format("  Clientes novos cadastrados: %d%n", novosClientes));
        sb.append(String.format("  Sessões: %d | Tempo cobrado: %dh%02dmin%n", sessoes, minutosCobrados / 60,
                minutosCobrados % 60));
        sb.append(String.format("  Pico de ocupação: %d de %d PCs | Maior fila: %d%n", picoDeOcupacao,
                totalComputadores, filaMaxima));
        sb.append(String.format("  Bomboniere: %d itens, %s | Esgotados na hora: %d | Reposições: %d%n",
                itensVendidos, Formatador.moeda(vendasBomboniere), vendasEsgotadas, reposicoesDeEstoque));
        sb.append(String.format("  Limpezas: %d | Reparos: %d%n", limpezas, reparos));
        sb.append(String.format("  Estornos: %d (%s)%n", estornos, Formatador.moeda(valorEstornado)));

        sb.append('\n').append("  Hora | Chegadas | Ocupação | Faturamento líquido\n");
        sb.append("  -----+----------+----------+--------------------\n");
        for (LinhaHoraria l : porHora) {
            sb.append(String.format(Locale.ROOT, "  %02dh  | %8d | %7.0f%% | %18s%n", l.hora(), l.chegadas(),
                    l.ocupacaoPercentual(), Formatador.moeda(l.faturamento())));
        }

        sb.append('\n').append("  FATURAMENTO OFICIAL (relatório do sistema)\n");
        for (FormaPagamento forma : FormaPagamento.values()) {
            BigDecimal quantia = faturamento.faturamentoPorForma().get(forma);
            sb.append(String.format("    %-10s %15s%n", forma.getDescricao(), Formatador.moeda(quantia)));
        }
        sb.append(String.format("    %-10s %15s  (%d pagamentos confirmados)%n", "TOTAL",
                Formatador.moeda(faturamento.faturamentoTotal()), faturamento.pagamentosConfirmados()));

        if (!anomalias.isEmpty()) {
            sb.append('\n').append("  ANOMALIAS (").append(anomalias.size()).append("):\n");
            anomalias.stream().limit(10).forEach(a -> sb.append("    - ").append(a).append('\n'));
        }
        sb.append(linha);
        return sb.toString();
    }
}
