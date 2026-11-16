package lanhouse.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lanhouse.exception.DadosInvalidosException;
import lanhouse.exception.SessaoInvalidaException;
import lanhouse.tempo.Relogio;
import lanhouse.util.Formatador;
import lanhouse.util.Validador;

/**
 * Sessão de uso de um computador por um cliente. A tarifa é congelada na abertura.
 * Cobrança do tempo: proporcional por minuto, minutos iniciados contam por inteiro,
 * mínimo de 1 minuto. Os valores usam BigDecimal com HALF_UP.
 */
public class Sessao {

    private static final BigDecimal MINUTOS_POR_HORA = BigDecimal.valueOf(60);

    private final int id;
    private final Cliente cliente;
    private final Computador computador;
    private final LocalDateTime inicio;
    private final BigDecimal tarifaHora;
    private final Funcionario operadorAbertura;
    private final Relogio relogio;
    private final List<ItemConsumacao> itens = new ArrayList<>();

    private StatusSessao status = StatusSessao.ATIVA;
    private LocalDateTime fim;
    private Funcionario operadorEncerramento;
    private boolean estoqueDevolvido;

    /** O início da sessão é a hora atual do relógio informado, que também mede sessões ainda ativas. */
    public Sessao(int id, Cliente cliente, Computador computador, Funcionario operador, Relogio relogio) {
        this.id = id;
        this.cliente = Validador.naoNulo(cliente, "Cliente");
        this.computador = Validador.naoNulo(computador, "Computador");
        this.operadorAbertura = Validador.naoNulo(operador, "Operador");
        this.relogio = Validador.naoNulo(relogio, "Relógio");
        this.inicio = relogio.agora();
        this.tarifaHora = computador.getTarifaHora();
    }

    /** Lança o consumo: confere se a sessão está ativa, baixa o estoque e registra o item. */
    public synchronized ItemConsumacao registrarConsumo(Produto produto, int quantidade) {
        Validador.naoNulo(produto, "Produto");
        Validador.quantidadePositiva(quantidade, "Quantidade");
        if (status != StatusSessao.ATIVA) {
            throw new SessaoInvalidaException("A sessão #" + id + " está encerrada e não aceita novos consumos.");
        }
        produto.baixarEstoque(quantidade);
        ItemConsumacao item = new ItemConsumacao(produto, quantidade);
        itens.add(item);
        return item;
    }

    /** Encerra a sessão no momento informado. O serviço libera o computador em seguida. */
    public synchronized void encerrar(Funcionario operador, LocalDateTime momento) {
        Validador.naoNulo(operador, "Operador");
        Validador.naoNulo(momento, "Data/hora de encerramento");
        if (status != StatusSessao.ATIVA) {
            throw new SessaoInvalidaException("A sessão #" + id + " já foi encerrada.");
        }
        if (momento.isBefore(inicio)) {
            throw new DadosInvalidosException("O encerramento não pode ser anterior ao início da sessão.");
        }
        this.fim = momento;
        this.operadorEncerramento = operador;
        this.status = StatusSessao.ENCERRADA;
    }

    /**
     * Marca o estoque como devolvido. Retorna true só na primeira chamada; quem receber true
     * deve repor o estoque dos itens. Garante a devolução uma única vez por sessão.
     */
    public synchronized boolean marcarEstoqueDevolvido() {
        if (estoqueDevolvido) {
            return false;
        }
        estoqueDevolvido = true;
        return true;
    }

    /** Minutos cobrados até o fim da sessão (ou até agora, se ainda estiver ativa). */
    public synchronized long getMinutosCobrados() {
        return minutosCobrados(fim != null ? fim : relogio.agora());
    }

    /** Minutos iniciados contam por inteiro (arredonda para cima), com mínimo de 1 minuto. */
    public long minutosCobrados(LocalDateTime ate) {
        Duration duracao = Duration.between(inicio, ate);
        long minutos = duracao.toMinutes();
        if (!duracao.minusMinutes(minutos).isZero()) {
            minutos++;
        }
        return Math.max(1, minutos);
    }

    /** Valor do tempo de uso: tarifa/hora x minutos / 60, com um único arredondamento HALF_UP. */
    public synchronized BigDecimal getValorTempo() {
        return tarifaHora.multiply(BigDecimal.valueOf(getMinutosCobrados()))
                .divide(MINUTOS_POR_HORA, 2, RoundingMode.HALF_UP);
    }

    public synchronized BigDecimal getValorProdutos() {
        BigDecimal total = BigDecimal.ZERO;
        for (ItemConsumacao item : itens) {
            total = total.add(item.getSubtotal());
        }
        return total.setScale(2, RoundingMode.HALF_UP);
    }

    /** Tempo + produtos, antes de qualquer desconto da forma de pagamento. */
    public synchronized BigDecimal getValorBruto() {
        return getValorTempo().add(getValorProdutos()).setScale(2, RoundingMode.HALF_UP);
    }

    public int getId() {
        return id;
    }

    public Cliente getCliente() {
        return cliente;
    }

    public Computador getComputador() {
        return computador;
    }

    public LocalDateTime getInicio() {
        return inicio;
    }

    public BigDecimal getTarifaHora() {
        return tarifaHora;
    }

    public Funcionario getOperadorAbertura() {
        return operadorAbertura;
    }

    public synchronized LocalDateTime getFim() {
        return fim;
    }

    public synchronized StatusSessao getStatus() {
        return status;
    }

    public synchronized boolean isAtiva() {
        return status == StatusSessao.ATIVA;
    }

    public synchronized Funcionario getOperadorEncerramento() {
        return operadorEncerramento;
    }

    public synchronized boolean isEstoqueDevolvido() {
        return estoqueDevolvido;
    }

    /** Cópia imutável dos itens consumidos. */
    public synchronized List<ItemConsumacao> getItens() {
        return List.copyOf(itens);
    }

    @Override
    public synchronized String toString() {
        return "Sessão #" + id + " | " + cliente.getNome() + " | PC " + String.format("%02d", computador.getNumero())
                + " (" + computador.getArea().getDescricao() + ") | início " + Formatador.dataHora(inicio)
                + " | " + status.getDescricao();
    }
}
