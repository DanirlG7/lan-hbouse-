package lanhouse.util;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

import lanhouse.model.FormaPagamento;
import lanhouse.model.ItemConsumacao;
import lanhouse.model.Pagamento;
import lanhouse.model.Relatorio;
import lanhouse.model.Sessao;

/** Formatação de valores e montagem do extrato (cupom) da sessão. */
public final class Formatador {

    private static final int LARGURA = 60;
    private static final Locale PT_BR = Locale.forLanguageTag("pt-BR");
    private static final DateTimeFormatter FORMATO_DATA = DateTimeFormatter.ofPattern("dd/MM/yyyy");
    private static final DateTimeFormatter FORMATO_DATA_HORA = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private Formatador() {
    }

    /** Ex.: R$ 1.234,56. Valor nulo vira "-". */
    public static String moeda(BigDecimal valor) {
        if (valor == null) {
            return "-";
        }
        BigDecimal arredondado = valor.setScale(2, RoundingMode.HALF_UP);
        // DecimalFormat não é thread-safe, então cada chamada cria o seu.
        DecimalFormat formato = new DecimalFormat("#,##0.00", DecimalFormatSymbols.getInstance(PT_BR));
        String texto = formato.format(arredondado.abs());
        return (arredondado.signum() < 0 ? "-" : "") + "R$ " + texto;
    }

    public static String data(LocalDate data) {
        return data == null ? "-" : data.format(FORMATO_DATA);
    }

    public static String dataHora(LocalDateTime dataHora) {
        return dataHora == null ? "-" : dataHora.format(FORMATO_DATA_HORA);
    }

    /** Mostra só parte do CPF: ***.456.789-**. Entrada fora do padrão vira "***". */
    public static String cpfMascarado(String cpf) {
        if (cpf == null || cpf.length() != 11) {
            return "***";
        }
        return "***." + cpf.substring(3, 6) + "." + cpf.substring(6, 9) + "-**";
    }

    /** (11) 91234-5678 ou (11) 1234-5678. Qualquer outro tamanho é devolvido como veio. */
    public static String telefone(String digitos) {
        if (digitos == null) {
            return "-";
        }
        if (digitos.length() == 11) {
            return "(" + digitos.substring(0, 2) + ") " + digitos.substring(2, 7) + "-" + digitos.substring(7);
        }
        if (digitos.length() == 10) {
            return "(" + digitos.substring(0, 2) + ") " + digitos.substring(2, 6) + "-" + digitos.substring(6);
        }
        return digitos;
    }

    /**
     * Extrato da sessão. O pagamento pode ser nulo (ainda não registrado); nesse caso mostra
     * o total bruto e lembra do desconto do Pix.
     */
    public static String extrato(Sessao sessao, Pagamento pagamento) {
        String separador = "=".repeat(LARGURA);
        StringBuilder sb = new StringBuilder();

        sb.append(separador).append('\n');
        sb.append(centralizar("LAN HOUSE - EXTRATO DA SESSÃO #" + sessao.getId())).append('\n');
        sb.append(separador).append('\n');

        sb.append(campo("Cliente", sessao.getCliente().getNome()));
        sb.append(campo("Computador", String.format("PC %02d (%s)", sessao.getComputador().getNumero(),
                sessao.getComputador().getArea().getDescricao())));
        sb.append(campo("Início", dataHora(sessao.getInicio())));
        sb.append(campo("Fim", sessao.getFim() == null ? "em andamento" : dataHora(sessao.getFim())));
        sb.append(campo("Aberta por", sessao.getOperadorAbertura().getNome()));
        if (sessao.getOperadorEncerramento() != null) {
            sb.append(campo("Encerrada por", sessao.getOperadorEncerramento().getNome()));
        }

        sb.append('\n');
        sb.append(valor("Tempo (" + moeda(sessao.getTarifaHora()) + "/h x " + sessao.getMinutosCobrados() + " min)",
                sessao.getValorTempo()));

        sb.append("  Bomboniere:\n");
        if (sessao.getItens().isEmpty()) {
            sb.append("    (nenhum item consumido)\n");
        } else {
            for (ItemConsumacao item : sessao.getItens()) {
                sb.append("    ").append(item).append('\n');
            }
        }
        sb.append(valor("Produtos", sessao.getValorProdutos()));

        sb.append("-".repeat(LARGURA)).append('\n');
        if (pagamento == null) {
            sb.append(valor("TOTAL BRUTO", sessao.getValorBruto()));
            sb.append("  Pagamento ainda não registrado (Pix tem 5% de desconto).\n");
        } else {
            sb.append(valor("Total bruto", pagamento.getValorBruto()));
            if (pagamento.getDesconto().signum() > 0) {
                sb.append(valor("Desconto (" + pagamento.getForma().getDescricao() + ")",
                        pagamento.getDesconto().negate()));
            }
            sb.append(valor("TOTAL A PAGAR", pagamento.getValorTotal()));
            sb.append(campo("Forma", pagamento.getForma().getDescricao()));
            sb.append(campo("Status", pagamento.getStatus().getDescricao()));
        }
        sb.append(separador);
        return sb.toString();
    }

    /** Texto do relatório de faturamento: período, quantidade de pagamentos, total por forma e total geral. */
    public static String relatorio(Relatorio relatorio) {
        String separador = "=".repeat(LARGURA);
        StringBuilder sb = new StringBuilder();
        sb.append(separador).append('\n');
        sb.append(centralizar("LAN HOUSE - FATURAMENTO")).append('\n');
        sb.append(separador).append('\n');
        sb.append(campo("Período", data(relatorio.de()) + " a " + data(relatorio.ate())));
        sb.append(campo("Pagamentos", String.valueOf(relatorio.pagamentosConfirmados()) + " confirmado(s)"));
        sb.append("  Por forma de pagamento:\n");
        for (FormaPagamento forma : FormaPagamento.values()) {
            BigDecimal quantia = relatorio.faturamentoPorForma().get(forma);
            sb.append(valor("  " + forma.getDescricao(), quantia == null ? BigDecimal.ZERO : quantia));
        }
        sb.append("-".repeat(LARGURA)).append('\n');
        sb.append(valor("TOTAL ARRECADADO", relatorio.faturamentoTotal()));
        sb.append(separador);
        return sb.toString();
    }

    private static String campo(String rotulo, String conteudo) {
        return String.format("  %-14s %s%n", rotulo + ":", conteudo).replace(System.lineSeparator(), "\n");
    }

    private static String valor(String rotulo, BigDecimal quantia) {
        return String.format("  %-40s %15s%n", rotulo, moeda(quantia)).replace(System.lineSeparator(), "\n");
    }

    private static String centralizar(String texto) {
        int espacos = Math.max(0, (LARGURA - texto.length()) / 2);
        return " ".repeat(espacos) + texto;
    }
}
