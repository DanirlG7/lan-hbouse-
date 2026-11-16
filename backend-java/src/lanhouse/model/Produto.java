package lanhouse.model;

import java.math.BigDecimal;
import java.math.RoundingMode;

import lanhouse.exception.DadosInvalidosException;
import lanhouse.exception.EstoqueInsuficienteException;
import lanhouse.util.Formatador;
import lanhouse.util.Validador;

/** Produto da bomboniere, com preço em BigDecimal e controle de estoque. */
public class Produto {

    private final int id;
    private final String nome;
    private BigDecimal preco;
    private int quantidadeEstoque;

    public Produto(int id, String nome, BigDecimal preco, int quantidadeEstoque) {
        this.id = id;
        this.nome = Validador.textoObrigatorio(nome, "Nome do produto");
        this.preco = normalizarPreco(preco);
        this.quantidadeEstoque = Validador.quantidadeNaoNegativa(quantidadeEstoque, "Estoque");
    }

    /** Baixa do estoque. Lança EstoqueInsuficienteException se não houver quantidade suficiente. */
    public synchronized void baixarEstoque(int quantidade) {
        Validador.quantidadePositiva(quantidade, "Quantidade");
        if (quantidade > quantidadeEstoque) {
            throw new EstoqueInsuficienteException(nome, quantidadeEstoque, quantidade);
        }
        quantidadeEstoque -= quantidade;
    }

    /** Soma ao estoque (reabastecimento ou devolução por estorno). */
    public synchronized void reabastecer(int quantidade) {
        Validador.quantidadePositiva(quantidade, "Quantidade");
        try {
            quantidadeEstoque = Math.addExact(quantidadeEstoque, quantidade);
        } catch (ArithmeticException e) {
            throw new DadosInvalidosException("Estoque acima do limite permitido.");
        }
    }

    /** Define o estoque como valor absoluto (inventário). */
    public synchronized void definirEstoque(int quantidade) {
        this.quantidadeEstoque = Validador.quantidadeNaoNegativa(quantidade, "Estoque");
    }

    /** Altera o preço. Vale só para consumos futuros: cada item lançado congela o preço do momento. */
    public synchronized void atualizarPreco(BigDecimal novoPreco) {
        this.preco = normalizarPreco(novoPreco);
    }

    private static BigDecimal normalizarPreco(BigDecimal valor) {
        Validador.naoNulo(valor, "Preço");
        return Validador.valorPositivo(valor.setScale(2, RoundingMode.HALF_UP), "Preço");
    }

    public int getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public synchronized BigDecimal getPreco() {
        return preco;
    }

    public synchronized int getQuantidadeEstoque() {
        return quantidadeEstoque;
    }

    @Override
    public synchronized String toString() {
        return "#" + id + " " + nome + " | " + Formatador.moeda(preco) + " | estoque: " + quantidadeEstoque;
    }
}
