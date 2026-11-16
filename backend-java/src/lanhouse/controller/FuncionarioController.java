package lanhouse.controller;

import lanhouse.Contexto;
import lanhouse.model.Administrador;
import lanhouse.model.Desenvolvedor;
import lanhouse.model.DesenvolvedorFrontEnd;
import lanhouse.model.Funcionario;
import lanhouse.model.Genero;
import lanhouse.model.Limpeza;
import lanhouse.model.Permissao;
import lanhouse.model.Recepcionista;
import lanhouse.model.SuporteTecnico;
import lanhouse.model.Turno;

/** Menu da equipe. */
public class FuncionarioController extends ControllerBase {

    public FuncionarioController(Contexto ctx) {
        super(ctx);
    }

    public void menu() {
        while (true) {
            int opcao = lerOpcao("EQUIPE", "Voltar",
                    "Listar equipe", "Listar por turno", "Buscar por ID", "Cadastrar funcionário");
            switch (opcao) {
                case 1 -> listar();
                case 2 -> listarPorTurno();
                case 3 -> buscarPorId();
                case 4 -> cadastrar();
                default -> {
                    return;
                }
            }
        }
    }

    private void listar() {
        executar("funcionario.listar", () ->
                io.listar(ctx.funcionarioService().listar(operador()), "Nenhum funcionário cadastrado."));
    }

    private void listarPorTurno() {
        executar("funcionario.turno", () -> {
            Turno turno = escolherEnum("Turno: ", Turno.values(), Turno::getDescricao);
            io.listar(ctx.funcionarioService().listarPorTurno(operador(), turno),
                    "Nenhum funcionário nesse turno.");
        });
    }

    private void buscarPorId() {
        executar("funcionario.buscar", () -> {
            int id = io.lerInteiro("ID do funcionário: ");
            io.mensagem("  " + ctx.funcionarioService().buscarPorId(operador(), id));
        });
    }

    private void cadastrar() {
        executar("funcionario.cadastrar", () -> {
            // Falha logo no começo se a pessoa não puder cadastrar, antes de pedir todos os dados.
            Funcionario.autorizar(operador(), Permissao.GERENCIAR_EQUIPE);

            int cargo = lerOpcao("CARGO DO NOVO FUNCIONÁRIO", "Cancelar",
                    "Administrador", "Desenvolvedor", "Desenvolvedor Front-end",
                    "Suporte Técnico", "Recepcionista", "Limpeza");
            if (cargo == 0) {
                return;
            }
            String nome = io.lerTexto("Nome: ");
            String login = io.lerTexto("Login: ");
            String senha = io.lerSenha("Senha: ");
            Genero genero = escolherEnum("Gênero: ", Genero.values(), Genero::getDescricao);
            Turno turno = escolherEnum("Turno: ", Turno.values(), Turno::getDescricao);

            Funcionario novo = ctx.funcionarioService().cadastrar(operador(),
                    id -> criarFuncionario(cargo, id, nome, login, senha, genero, turno));
            io.sucesso("Funcionário cadastrado: " + novo);
        });
    }

    /** Único ponto que conhece os construtores de cada cargo. */
    private Funcionario criarFuncionario(int cargo, int id, String nome, String login, String senha,
                                         Genero genero, Turno turno) {
        return switch (cargo) {
            case 1 -> new Administrador(id, nome, login, senha, genero, turno);
            case 2 -> new Desenvolvedor(id, nome, login, senha, genero, turno);
            case 3 -> new DesenvolvedorFrontEnd(id, nome, login, senha, genero, turno);
            case 4 -> new SuporteTecnico(id, nome, login, senha, genero, turno);
            case 5 -> new Recepcionista(id, nome, login, senha, genero, turno);
            case 6 -> new Limpeza(id, nome, login, senha, genero, turno);
            default -> throw new IllegalStateException("Cargo inválido: " + cargo);
        };
    }
}
