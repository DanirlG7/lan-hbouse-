package lanhouse.controller;

import java.math.BigDecimal;

import lanhouse.Contexto;
import lanhouse.model.AreaComputador;
import lanhouse.model.Computador;

/** Menu de computadores e manutenção. */
public class ComputadorController extends ControllerBase {

    public ComputadorController(Contexto ctx) {
        super(ctx);
    }

    public void menu() {
        while (true) {
            int opcao = lerOpcao("COMPUTADORES", "Voltar",
                    "Listar todos", "Listar disponíveis", "Enviar para manutenção", "Concluir manutenção",
                    "Cadastrar computador", "Alterar tarifa por hora");
            switch (opcao) {
                case 1 -> listarTodos();
                case 2 -> listarDisponiveis();
                case 3 -> enviarParaManutencao();
                case 4 -> concluirManutencao();
                case 5 -> cadastrar();
                case 6 -> alterarTarifa();
                default -> {
                    return;
                }
            }
        }
    }

    private void cadastrar() {
        executar("computador.cadastrar", () -> {
            int numero = io.lerInteiro("Número do novo computador: ");
            AreaComputador area = escolherEnum("Área: ", AreaComputador.values(), AreaComputador::getDescricao);
            BigDecimal tarifa = io.lerDecimalOpcional("Tarifa por hora (Enter = padrão da área): ");
            Computador computador = ctx.computadorService().cadastrar(operador(), numero, area, tarifa);
            io.sucesso("Computador cadastrado: " + computador);
        });
    }

    private void alterarTarifa() {
        executar("computador.tarifa", () -> {
            int numero = io.lerInteiro("Número do computador: ");
            BigDecimal tarifa = io.lerDecimal("Nova tarifa por hora (vale só para sessões futuras): ");
            Computador computador = ctx.computadorService().alterarTarifa(operador(), numero, tarifa);
            io.sucesso("Tarifa atualizada: " + computador);
        });
    }

    private void listarTodos() {
        executar("computador.listar", () ->
                io.listar(ctx.computadorService().listar(), "Nenhum computador cadastrado."));
    }

    private void listarDisponiveis() {
        executar("computador.disponiveis", () ->
                io.listar(ctx.computadorService().listarDisponiveis(), "Nenhum computador disponível agora."));
    }

    private void enviarParaManutencao() {
        executar("computador.manutencao", () -> {
            int numero = io.lerInteiro("Número do computador: ");
            Computador computador = ctx.computadorService().enviarParaManutencao(operador(), numero);
            io.sucesso("Enviado para manutenção: " + computador);
        });
    }

    private void concluirManutencao() {
        executar("computador.concluir", () -> {
            int numero = io.lerInteiro("Número do computador: ");
            Computador computador = ctx.computadorService().concluirManutencao(operador(), numero);
            io.sucesso("Computador liberado: " + computador);
        });
    }
}
