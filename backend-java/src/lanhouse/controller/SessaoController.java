package lanhouse.controller;

import lanhouse.Contexto;
import lanhouse.model.Sessao;
import lanhouse.util.Formatador;

/** Menu de sessões: abrir, lançar consumo e encerrar. */
public class SessaoController extends ControllerBase {

    public SessaoController(Contexto ctx) {
        super(ctx);
    }

    public void menu() {
        while (true) {
            int opcao = lerOpcao("SESSÕES", "Voltar",
                    "Iniciar sessão", "Registrar consumo", "Encerrar sessão",
                    "Listar sessões ativas", "Histórico de um cliente");
            switch (opcao) {
                case 1 -> iniciar();
                case 2 -> registrarConsumo();
                case 3 -> encerrar();
                case 4 -> listarAtivas();
                case 5 -> historicoDoCliente();
                default -> {
                    return;
                }
            }
        }
    }

    private void iniciar() {
        executar("sessao.iniciar", () -> {
            io.mensagem("Computadores disponíveis:");
            io.listar(ctx.computadorService().listarDisponiveis(), "Nenhum computador disponível agora.");
            int clienteId = io.lerInteiro("ID do cliente: ");
            int numeroComputador = io.lerInteiro("Número do computador: ");
            Sessao sessao = ctx.sessaoService().iniciar(operador(), clienteId, numeroComputador);
            io.sucesso("Sessão #" + sessao.getId() + " aberta para " + sessao.getCliente().getNome()
                    + " no PC " + sessao.getComputador().getNumero() + ".");
        });
    }

    private void registrarConsumo() {
        executar("sessao.consumo", () -> {
            io.mensagem("Sessões ativas:");
            io.listar(ctx.sessaoService().listarAtivas(), "Nenhuma sessão ativa.");
            io.mensagem("Produtos:");
            io.listar(ctx.produtoService().listar(), "Nenhum produto cadastrado.");
            int sessaoId = io.lerInteiro("ID da sessão: ");
            int produtoId = io.lerInteiro("ID do produto: ");
            int quantidade = io.lerInteiro("Quantidade: ");
            Sessao sessao = ctx.sessaoService().registrarConsumo(operador(), sessaoId, produtoId, quantidade);
            io.sucesso("Consumo registrado. Produtos na sessão #" + sessao.getId() + ": "
                    + Formatador.moeda(sessao.getValorProdutos()));
        });
    }

    private void encerrar() {
        executar("sessao.encerrar", () -> {
            io.mensagem("Sessões ativas:");
            io.listar(ctx.sessaoService().listarAtivas(), "Nenhuma sessão ativa.");
            int sessaoId = io.lerInteiro("ID da sessão a encerrar: ");
            Sessao sessao = ctx.sessaoService().encerrar(operador(), sessaoId);
            io.exibirTexto(Formatador.extrato(sessao, null));
            io.mensagem("Registre o pagamento no menu Pagamentos.");
        });
    }

    private void listarAtivas() {
        executar("sessao.ativas", () ->
                io.listar(ctx.sessaoService().listarAtivas(), "Nenhuma sessão ativa."));
    }

    private void historicoDoCliente() {
        executar("sessao.historico", () -> {
            int clienteId = io.lerInteiro("ID do cliente: ");
            io.listar(ctx.sessaoService().listarPorCliente(operador(), clienteId),
                    "Esse cliente ainda não tem sessões.");
        });
    }
}
