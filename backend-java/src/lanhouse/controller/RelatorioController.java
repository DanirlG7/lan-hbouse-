package lanhouse.controller;

import java.time.LocalDate;

import lanhouse.Contexto;
import lanhouse.model.Relatorio;
import lanhouse.util.Formatador;

/** Menu de relatórios, extrato e auditoria. */
public class RelatorioController extends ControllerBase {

    public RelatorioController(Contexto ctx) {
        super(ctx);
    }

    public void menu() {
        while (true) {
            int opcao = lerOpcao("RELATÓRIOS", "Voltar",
                    "Faturamento por período", "Extrato de uma sessão", "Auditoria (registros do sistema)");
            switch (opcao) {
                case 1 -> faturamento();
                case 2 -> extrato();
                case 3 -> auditoria();
                default -> {
                    return;
                }
            }
        }
    }

    private void faturamento() {
        executar("relatorio.faturamento", () -> {
            LocalDate hoje = ctx.relogio().hoje();
            LocalDate de = io.lerData("Data inicial dd/MM/aaaa (Enter = hoje): ", hoje);
            LocalDate ate = io.lerData("Data final dd/MM/aaaa (Enter = hoje): ", hoje);
            Relatorio relatorio = ctx.relatorioService().gerar(operador(), de, ate);
            io.exibirTexto(Formatador.relatorio(relatorio));
        });
    }

    private void extrato() {
        executar("relatorio.extrato", () -> {
            int sessaoId = io.lerInteiro("ID da sessão: ");
            io.exibirTexto(ctx.relatorioService().extrato(operador(), sessaoId));
        });
    }

    private void auditoria() {
        executar("relatorio.auditoria", () ->
                io.listar(ctx.relatorioService().auditoria(operador()), "Nenhum registro."));
    }
}
