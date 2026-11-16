package lanhouse.controller;

import lanhouse.Contexto;

/** Menu principal: encaminha para o controller de cada área. */
public class MenuController extends ControllerBase {

    private final SessaoController sessoes;
    private final PagamentoController pagamentos;
    private final ClienteController clientes;
    private final ComputadorController computadores;
    private final ProdutoController produtos;
    private final FuncionarioController equipe;
    private final RelatorioController relatorios;

    public MenuController(Contexto ctx) {
        super(ctx);
        this.sessoes = new SessaoController(ctx);
        this.pagamentos = new PagamentoController(ctx);
        this.clientes = new ClienteController(ctx);
        this.computadores = new ComputadorController(ctx);
        this.produtos = new ProdutoController(ctx);
        this.equipe = new FuncionarioController(ctx);
        this.relatorios = new RelatorioController(ctx);
    }

    /** Roda o menu principal até a pessoa escolher sair (logout). */
    public void exibir() {
        while (true) {
            io.mensagem("");
            io.mensagem("Operador: " + operador().getNome());
            int opcao = lerOpcao("MENU PRINCIPAL", "Sair (logout)",
                    "Sessões", "Pagamentos", "Clientes", "Computadores",
                    "Bomboniere", "Equipe", "Relatórios");
            switch (opcao) {
                case 1 -> sessoes.menu();
                case 2 -> pagamentos.menu();
                case 3 -> clientes.menu();
                case 4 -> computadores.menu();
                case 5 -> produtos.menu();
                case 6 -> equipe.menu();
                case 7 -> relatorios.menu();
                default -> {
                    return;
                }
            }
        }
    }
}
