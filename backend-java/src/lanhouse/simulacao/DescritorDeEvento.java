package lanhouse.simulacao;

import java.time.format.DateTimeFormatter;

import lanhouse.evento.Evento;
import lanhouse.util.Formatador;

/** Transforma um evento do sistema numa frase curta, para logs, painéis e o feed do front. */
public final class DescritorDeEvento {

    private static final DateTimeFormatter HORA = DateTimeFormatter.ofPattern("HH:mm");

    private DescritorDeEvento() {
    }

    /** Frase sem o horário. */
    public static String descrever(Evento evento) {
        if (evento instanceof Evento.ClienteCadastrado e) {
            return "Novo cliente cadastrado: " + e.clienteNome() + " (por " + e.operadorNome() + ")";
        }
        if (evento instanceof Evento.SessaoIniciada e) {
            return e.clienteNome() + " começou a jogar no PC " + e.computadorNumero()
                    + " (" + e.area().getDescricao() + ", " + Formatador.moeda(e.tarifaHora()) + "/h)";
        }
        if (evento instanceof Evento.ConsumoRegistrado e) {
            return e.quantidade() + "x " + e.produtoNome() + " na sessão #" + e.sessaoId()
                    + " (" + Formatador.moeda(e.subtotal()) + "), restam " + e.estoqueRestante();
        }
        if (evento instanceof Evento.SessaoEncerrada e) {
            return e.clienteNome() + " terminou no PC " + e.computadorNumero() + ": "
                    + e.minutosCobrados() + " min, " + Formatador.moeda(e.valorBruto()) + " bruto";
        }
        if (evento instanceof Evento.PagamentoRegistrado e) {
            return "Pagamento #" + e.pagamentoId() + " da sessão #" + e.sessaoId() + " via "
                    + e.forma().getDescricao() + ": " + Formatador.moeda(e.valorTotal());
        }
        if (evento instanceof Evento.PagamentoConfirmado e) {
            return "Pagamento #" + e.pagamentoId() + " confirmado (" + e.forma().getDescricao() + ", "
                    + Formatador.moeda(e.valorTotal()) + ")";
        }
        if (evento instanceof Evento.PagamentoEstornado e) {
            return "Pagamento #" + e.pagamentoId() + " ESTORNADO (" + Formatador.moeda(e.valorTotal()) + ")"
                    + (e.estoqueDevolvido() ? ", estoque devolvido" : "");
        }
        if (evento instanceof Evento.ComputadorCadastrado e) {
            return "Novo PC " + e.computadorNumero() + " (" + e.area().getDescricao() + ", "
                    + Formatador.moeda(e.tarifaHora()) + "/h) por " + e.operadorNome();
        }
        if (evento instanceof Evento.TarifaAlterada e) {
            return "Tarifa do PC " + e.computadorNumero() + " de " + Formatador.moeda(e.tarifaAnterior())
                    + " para " + Formatador.moeda(e.tarifaNova()) + "/h (" + e.operadorNome() + ")";
        }
        if (evento instanceof Evento.ComputadorEmManutencao e) {
            return "PC " + e.computadorNumero() + " fora de uso (" + e.operadorNome() + ")";
        }
        if (evento instanceof Evento.ManutencaoConcluida e) {
            return "PC " + e.computadorNumero() + " liberado (" + e.operadorNome() + ")";
        }
        if (evento instanceof Evento.ProdutoReabastecido e) {
            return "Estoque de " + e.produtoNome() + " reposto: +" + e.quantidade() + " (agora " + e.estoqueAtual() + ")";
        }
        return evento.toString();
    }

    /** Frase com o horário na frente: "14:25 Ana começou a jogar...". */
    public static String descreverComHora(Evento evento) {
        return evento.momento().format(HORA) + " " + descrever(evento);
    }
}
