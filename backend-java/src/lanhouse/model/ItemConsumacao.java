package lanhouse.model;

import java.math.BigDecimal;

import lanhouse.util.Formatador;
import lanhouse.util.Validador;

/** Item consumido na bomboniere durante uma sessão. O preço unitário é congelado no lançamento. */
public class ItemConsumacao {

    private final Produto produto;
    private final int quantidade;
    private final BigDecimal precoUnitario;

    public ItemConsumacao(Produto produto, int quantidade) {
        this.produto = Validador.naoNulo(produto, "Produto");
        this.quantidade = Validador.quantidadePositiva(quantidade, "Quantidade");
        this.precoUnitario = produto.getPreco();
    }

    public BigDecimal getSubtotal() {
        return precoUnitario.multiply(BigDecimal.valueOf(quantidade));
    }

    public Produto getProduto() {
        return produto;
    }

    public int getQuantidade() {
        return quantidade;
    }

    public BigDecimal getPrecoUnitario() {
        return precoUnitario;
    }

    @Override
    public String toString() {
        return quantidade + "x " + produto.getNome() + " (" + Formatador.moeda(precoUnitario) + ") = "
                + Formatador.moeda(getSubtotal());
    }
}
