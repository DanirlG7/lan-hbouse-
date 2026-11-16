package lanhouse.model;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lanhouse.exception.PagamentoInvalidoException;
import lanhouse.util.Formatador;
import lanhouse.util.Validador;

/**
 * Pagamento de uma sessão encerrada. Nasce PENDENTE, pode ser CONFIRMADO e só pode ser
 * ESTORNADO depois de confirmado. Os valores são congelados no registro.
 */
public class Pagamento {

    private final int id;
    private final Sessao sessao;
    private final FormaPagamento forma;
    private final BigDecimal valorBruto;
    private final BigDecimal valorTotal;
    private final LocalDateTime dataPagamento;
    private final Funcionario registradoPor;

    private StatusPagamento status = StatusPagamento.PENDENTE;
    private Funcionario confirmadoPor;
    private LocalDateTime dataConfirmacao;
    private Funcionario estornadoPor;
    private LocalDateTime dataEstorno;

    public Pagamento(int id, Sessao sessao, FormaPagamento forma, Funcionario operador,
                     LocalDateTime dataPagamento) {
        this.id = id;
        this.sessao = Validador.naoNulo(sessao, "Sessão");
        this.forma = Validador.naoNulo(forma, "Forma de pagamento");
        this.registradoPor = Validador.naoNulo(operador, "Operador");
        this.dataPagamento = Validador.naoNulo(dataPagamento, "Data do pagamento");
        if (sessao.getStatus() != StatusSessao.ENCERRADA) {
            throw new PagamentoInvalidoException("Só é possível pagar uma sessão encerrada. "
                    + "Encerre a sessão #" + sessao.getId() + " primeiro.");
        }
        this.valorBruto = sessao.getValorBruto();
        this.valorTotal = forma.calcularTotal(valorBruto);
    }

    /** PENDENTE para CONFIRMADO, no momento informado. */
    public synchronized void confirmar(Funcionario operador, LocalDateTime momento) {
        Validador.naoNulo(operador, "Operador");
        Validador.naoNulo(momento, "Data/hora da confirmação");
        if (status != StatusPagamento.PENDENTE) {
            throw new PagamentoInvalidoException("O pagamento #" + id + " está "
                    + status.getDescricao().toLowerCase() + " e não pode ser confirmado.");
        }
        this.status = StatusPagamento.CONFIRMADO;
        this.confirmadoPor = operador;
        this.dataConfirmacao = momento;
    }

    /** CONFIRMADO para ESTORNADO, no momento informado. Pagamento pendente não pode ser estornado. */
    public synchronized void estornar(Funcionario operador, LocalDateTime momento) {
        Validador.naoNulo(operador, "Operador");
        Validador.naoNulo(momento, "Data/hora do estorno");
        if (status != StatusPagamento.CONFIRMADO) {
            throw new PagamentoInvalidoException("O pagamento #" + id + " está "
                    + status.getDescricao().toLowerCase() + ". Só é possível estornar um pagamento confirmado.");
        }
        this.status = StatusPagamento.ESTORNADO;
        this.estornadoPor = operador;
        this.dataEstorno = momento;
    }

    /** Desconto concedido pela forma de pagamento (5% no Pix, zero nas demais). */
    public BigDecimal getDesconto() {
        return valorBruto.subtract(valorTotal);
    }

    public int getId() {
        return id;
    }

    public Sessao getSessao() {
        return sessao;
    }

    public int getSessaoId() {
        return sessao.getId();
    }

    public FormaPagamento getForma() {
        return forma;
    }

    public BigDecimal getValorBruto() {
        return valorBruto;
    }

    public BigDecimal getValorTotal() {
        return valorTotal;
    }

    /** Data/hora do registro do pagamento; é a data usada nos relatórios. */
    public LocalDateTime getDataPagamento() {
        return dataPagamento;
    }

    public Funcionario getRegistradoPor() {
        return registradoPor;
    }

    public synchronized StatusPagamento getStatus() {
        return status;
    }

    public synchronized Funcionario getConfirmadoPor() {
        return confirmadoPor;
    }

    public synchronized LocalDateTime getDataConfirmacao() {
        return dataConfirmacao;
    }

    public synchronized Funcionario getEstornadoPor() {
        return estornadoPor;
    }

    public synchronized LocalDateTime getDataEstorno() {
        return dataEstorno;
    }

    @Override
    public synchronized String toString() {
        return "Pagamento #" + id + " | Sessão #" + sessao.getId() + " | " + forma.getDescricao() + " | "
                + Formatador.moeda(valorTotal) + " | " + status.getDescricao() + " | "
                + Formatador.dataHora(dataPagamento);
    }
}
