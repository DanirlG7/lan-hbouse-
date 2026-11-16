package lanhouse.util;

import java.math.BigDecimal;
import java.util.function.Function;

import lanhouse.model.Administrador;
import lanhouse.model.AreaComputador;
import lanhouse.model.Cliente;
import lanhouse.model.Computador;
import lanhouse.model.Desenvolvedor;
import lanhouse.model.DesenvolvedorFrontEnd;
import lanhouse.model.Funcionario;
import lanhouse.model.Genero;
import lanhouse.model.Limpeza;
import lanhouse.model.Produto;
import lanhouse.model.Recepcionista;
import lanhouse.model.SuporteTecnico;
import lanhouse.model.Turno;
import lanhouse.repository.ClienteRepository;
import lanhouse.repository.ComputadorRepository;
import lanhouse.repository.FuncionarioRepository;
import lanhouse.repository.ProdutoRepository;

/**
 * Popula o sistema com dados de demonstração: equipe, clientes, computadores e bomboniere.
 * A distribuição de gênero da equipe existe apenas aqui, para os dados iniciais.
 */
public final class DadosIniciais {

    /** Login do administrador criado nos dados iniciais. */
    public static final String LOGIN_ADMIN = "carlos.lima";

    /** Senha de demonstração de todos os funcionários iniciais. Troque fora de testes. */
    public static final String SENHA_PADRAO = "Lan@House2026";

    private static final int PCS_COMUNS = 8;
    private static final int PCS_VIP = 4;

    private DadosIniciais() {
    }

    /** Cadastra todos os dados iniciais. Chame uma única vez, com os repositórios ainda vazios. */
    public static void popular(FuncionarioRepository funcionarios, ClienteRepository clientes,
                               ComputadorRepository computadores, ProdutoRepository produtos) {
        popularFuncionarios(funcionarios);
        popularClientes(clientes);
        popularComputadores(computadores);
        popularProdutos(produtos);
        AppLog.info("Dados iniciais carregados: " + funcionarios.contar() + " funcionários, "
                + clientes.contar() + " clientes, " + computadores.contar() + " computadores, "
                + produtos.contar() + " produtos.");
    }

    // ---------- equipe ----------

    private static void popularFuncionarios(FuncionarioRepository repo) {
        inserir(repo, id -> new Administrador(id, "Carlos Eduardo Lima", LOGIN_ADMIN,
                SENHA_PADRAO, Genero.MASCULINO, Turno.TURNO_1));

        inserir(repo, id -> new Desenvolvedor(id, "Mariana Souza", "mariana.souza",
                SENHA_PADRAO, Genero.FEMININO, Turno.TURNO_1));

        inserir(repo, id -> new DesenvolvedorFrontEnd(id, "Rafael Costa", "rafael.costa",
                SENHA_PADRAO, Genero.MASCULINO, Turno.TURNO_2));

        inserir(repo, id -> new SuporteTecnico(id, "Bruno Alves", "bruno.alves",
                SENHA_PADRAO, Genero.MASCULINO, Turno.TURNO_2));

        inserir(repo, id -> new SuporteTecnico(id, "Juliana Ramos", "juliana.ramos",
                SENHA_PADRAO, Genero.FEMININO, Turno.TURNO_1));

        inserir(repo, id -> new Recepcionista(id, "Fernanda Oliveira", "fernanda.oliveira",
                SENHA_PADRAO, Genero.FEMININO, Turno.TURNO_1));

        inserir(repo, id -> new Recepcionista(id, "Lucas Pereira", "lucas.pereira",
                SENHA_PADRAO, Genero.MASCULINO, Turno.TURNO_2));

        inserir(repo, id -> new Limpeza(id, "Patrícia Gomes", "patricia.gomes",
                SENHA_PADRAO, Genero.FEMININO, Turno.TURNO_1));

        inserir(repo, id -> new Limpeza(id, "Roberto Santos", "roberto.santos",
                SENHA_PADRAO, Genero.MASCULINO, Turno.TURNO_2));
    }

    private static void inserir(FuncionarioRepository repo, Function<Integer, Funcionario> fabrica) {
        Funcionario funcionario = fabrica.apply(repo.proximoId());
        if (!repo.inserirSeLoginLivre(funcionario)) {
            throw new IllegalStateException("Login duplicado nos dados iniciais: " + funcionario.getLogin());
        }
    }

    // ---------- clientes ----------

    private static void popularClientes(ClienteRepository repo) {
        adicionarCliente(repo, "Ana Beatriz Martins", "11988880001", "278391045");
        adicionarCliente(repo, "João Pedro Ferreira", "11988880002", "381402156");
        adicionarCliente(repo, "Camila Rodrigues", "11988880003", "492513267");
        adicionarCliente(repo, "Gustavo Henrique Nunes", "11988880004", "503624378");
        adicionarCliente(repo, "Larissa Carvalho", "11988880005", "614735489");
        adicionarCliente(repo, "Thiago Barbosa", "11988880006", "725846590");
    }

    private static void adicionarCliente(ClienteRepository repo, String nome, String telefone, String cpfBase) {
        Cliente cliente = new Cliente(repo.proximoId(), nome, telefone, cpfComDigitos(cpfBase));
        if (!repo.inserirSeCpfLivre(cliente)) {
            throw new IllegalStateException("CPF duplicado nos dados iniciais: " + nome);
        }
    }

    // ---------- computadores ----------

    private static void popularComputadores(ComputadorRepository repo) {
        int numero = 1;
        for (int i = 0; i < PCS_COMUNS; i++, numero++) {
            repo.salvar(new Computador(numero, AreaComputador.COMUM, null)); // null = tarifa padrão da área
        }
        for (int i = 0; i < PCS_VIP; i++, numero++) {
            repo.salvar(new Computador(numero, AreaComputador.VIP, null));
        }
    }

    // ---------- bomboniere ----------

    private static void popularProdutos(ProdutoRepository repo) {
        adicionarProduto(repo, "Barras de Chocolate", "4.50", 50);
        adicionarProduto(repo, "Barras de Proteína", "8.90", 40);
        adicionarProduto(repo, "Refrigerantes", "6.00", 60);
        adicionarProduto(repo, "Sucos", "5.50", 40);
        adicionarProduto(repo, "Pré-treino", "12.00", 25);
        adicionarProduto(repo, "Café", "3.50", 80);
        adicionarProduto(repo, "Cappuccino", "6.50", 60);
    }

    private static void adicionarProduto(ProdutoRepository repo, String nome, String preco, int quantidade) {
        Produto produto = new Produto(repo.proximoId(), nome, new BigDecimal(preco), quantidade);
        if (!repo.inserirSeNomeLivre(produto)) {
            throw new IllegalStateException("Produto duplicado nos dados iniciais: " + nome);
        }
    }

    // ---------- CPF ----------

    /** Recebe 9 dígitos e devolve o CPF de 11 dígitos com os dois verificadores calculados. */
    static String cpfComDigitos(String base) {
        if (base == null || !base.matches("\\d{9}")) {
            throw new IllegalArgumentException("A base do CPF deve ter exatamente 9 dígitos.");
        }
        int primeiro = digitoVerificador(base, 10);
        int segundo = digitoVerificador(base + primeiro, 11);
        return base + primeiro + segundo;
    }

    private static int digitoVerificador(String digitos, int pesoInicial) {
        int soma = 0;
        for (int i = 0; i < digitos.length(); i++) {
            soma += Character.getNumericValue(digitos.charAt(i)) * (pesoInicial - i);
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
