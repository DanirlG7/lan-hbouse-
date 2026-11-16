package lanhouse.controller;

import lanhouse.Contexto;
import lanhouse.model.Cliente;

/** Menu de clientes. */
public class ClienteController extends ControllerBase {

    public ClienteController(Contexto ctx) {
        super(ctx);
    }

    public void menu() {
        while (true) {
            int opcao = lerOpcao("CLIENTES", "Voltar",
                    "Cadastrar cliente", "Atualizar nome e telefone", "Buscar por CPF", "Listar clientes");
            switch (opcao) {
                case 1 -> cadastrar();
                case 2 -> atualizar();
                case 3 -> buscarPorCpf();
                case 4 -> listar();
                default -> {
                    return;
                }
            }
        }
    }

    private void cadastrar() {
        executar("cliente.cadastrar", () -> {
            String nome = io.lerTexto("Nome: ");
            String telefone = io.lerTexto("Telefone: ");
            String cpf = io.lerTexto("CPF: ");
            Cliente cliente = ctx.clienteService().cadastrar(operador(), nome, telefone, cpf);
            io.sucesso("Cliente cadastrado: " + cliente);
        });
    }

    private void atualizar() {
        executar("cliente.atualizar", () -> {
            int id = io.lerInteiro("ID do cliente: ");
            io.mensagem("  Dados atuais: " + ctx.clienteService().buscarPorId(id));
            String nome = io.lerTexto("Novo nome: ");
            String telefone = io.lerTexto("Novo telefone: ");
            Cliente cliente = ctx.clienteService().atualizar(operador(), id, nome, telefone);
            io.sucesso("Cliente atualizado: " + cliente);
        });
    }

    private void buscarPorCpf() {
        executar("cliente.buscar", () -> {
            String cpf = io.lerTexto("CPF: ");
            io.mensagem("  " + ctx.clienteService().buscarPorCpf(cpf));
        });
    }

    private void listar() {
        executar("cliente.listar", () ->
                io.listar(ctx.clienteService().listar(), "Nenhum cliente cadastrado."));
    }
}
