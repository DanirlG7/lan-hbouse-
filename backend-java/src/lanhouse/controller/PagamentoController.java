package lanhouse.controller;

import lanhouse.Contexto;
import lanhouse.model.FormaPagamento;
import lanhouse.model.Funcionario;
import lanhouse.model.Pagamento;
import lanhouse.model.Permissao;
import lanhouse.model.Sessao;
import lanhouse.util.Formatador;

/** Menu de pagamentos: registrar, confirmar e estornar. */
public class PagamentoController extends ControllerBase {

    public PagamentoController(Contexto ctx) {
        super(ctx);
    }

    public void menu() {
        while (true) {
            int opcao = lerOpcao("PAGAMENTOS", "Voltar",
                    "Registrar pagamento de sessão encerrada", "Confirmar pagamento",
                    "Estornar pagamento (só Administrador)", "Ver pagamentos de uma sessão");
            switch (opcao) {
                case 1 -> registrar();
                case 2 -> confirmar();
                case 3 -> estornar();
                case 4 -> listarPorSessao();
                default -> {
                    return;
                }
            }
        }
    }

    private void registrar() {
        executar("pagamento.registrar", () -> {
            int sessaoId = io.lerInteiro("ID da sessão encerrada: ");
            Sessao sessao = ctx.sessaoService().buscarPorId(sessaoId);
            io.mensagem("  Total bruto da sessão: " + Formatador.moeda(sessao.getValorBruto())
                    + " (Pix tem 5% de desconto)");
            FormaPagamento forma = escolherEnum("Forma de pagamento: ", FormaPagamento.values(),
                    FormaPagamento::getDescricao);
            Pagamento pagamento = ctx.pagamentoService().registrar(operador(), sessaoId, forma);
            io.sucesso("Pagamento #" + pagamento.getId() + " registrado como "
                    + pagamento.getStatus().getDescricao() + ". Total: "
                    + Formatador.moeda(pagamento.getValorTotal()));
        });
    }

    private void confirmar() {
        executar("pagamento.confirmar", () -> {
            int id = io.lerInteiro("ID do pagamento: ");
            Pagamento pagamento = ctx.pagamentoService().confirmar(operador(), id);
            io.sucesso("Pagamento #" + pagamento.getId() + " " + pagamento.getStatus().getDescricao() + ".");
        });
    }

    private void estornar() {
        executar("pagamento.estornar", () -> {
            // Nega logo no começo, antes de pedir o ID e a confirmação.
            Funcionario.autorizar(operador(), Permissao.ESTORNAR_PAGAMENTO);
            int id = io.lerInteiro("ID do pagamento: ");
            if (!confirmar("Estornar o pagamento #" + id + "? Os produtos da sessão voltam ao estoque")) {
                io.mensagem("Estorno cancelado.");
                return;
            }
            Pagamento pagamento = ctx.pagamentoService().estornar(operador(), id);
            io.sucesso("Pagamento #" + pagamento.getId() + " " + pagamento.getStatus().getDescricao() + ".");
        });
    }

    private void listarPorSessao() {
        executar("pagamento.listar", () -> {
            int sessaoId = io.lerInteiro("ID da sessão: ");
            io.listar(ctx.pagamentoService().listarPorSessao(sessaoId),
                    "Nenhum pagamento registrado para essa sessão.");
        });
    }
}
