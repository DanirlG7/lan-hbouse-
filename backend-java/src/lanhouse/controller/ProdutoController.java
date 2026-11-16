package lanhouse.controller;

import java.math.BigDecimal;

import lanhouse.Contexto;
import lanhouse.model.Produto;

/** Menu da bomboniere (produtos e estoque). */
public class ProdutoController extends ControllerBase {

    public ProdutoController(Contexto ctx) {
        super(ctx);
    }

    public void menu() {
        while (true) {
            int opcao = lerOpcao("BOMBONIERE", "Voltar",
                    "Listar produtos e estoque", "Cadastrar produto", "Reabastecer estoque", "Atualizar preço");
            switch (opcao) {
                case 1 -> listar();
                case 2 -> cadastrar();
                case 3 -> reabastecer();
                case 4 -> atualizarPreco();
                default -> {
                    return;
                }
            }
        }
    }

    private void listar() {
        executar("produto.listar", () ->
                io.listar(ctx.produtoService().listar(), "Nenhum produto cadastrado."));
    }

    private void cadastrar() {
        executar("produto.cadastrar", () -> {
            String nome = io.lerTexto("Nome do produto: ");
            BigDecimal preco = io.lerDecimal("Preço (ex.: 6,50): ");
            int quantidade = io.lerInteiro("Quantidade inicial em estoque: ");
            Produto produto = ctx.produtoService().cadastrar(operador(), nome, preco, quantidade);
            io.sucesso("Produto cadastrado: " + produto);
        });
    }

    private void reabastecer() {
        executar("produto.reabastecer", () -> {
            io.listar(ctx.produtoService().listar(), "Nenhum produto cadastrado.");
            int id = io.lerInteiro("ID do produto: ");
            int quantidade = io.lerInteiro("Quantidade a adicionar: ");
            Produto produto = ctx.produtoService().reabastecer(operador(), id, quantidade);
            io.sucesso("Estoque atualizado: " + produto);
        });
    }

    private void atualizarPreco() {
        executar("produto.preco", () -> {
            io.listar(ctx.produtoService().listar(), "Nenhum produto cadastrado.");
            int id = io.lerInteiro("ID do produto: ");
            BigDecimal preco = io.lerDecimal("Novo preço (ex.: 6,50): ");
            Produto produto = ctx.produtoService().atualizarPreco(operador(), id, preco);
            io.sucesso("Preço atualizado (vale só para novos consumos): " + produto);
        });
    }
}
