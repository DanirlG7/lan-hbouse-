package lanhouse.service;

import java.util.List;
import java.util.Objects;
import java.util.function.Function;

import lanhouse.exception.AutenticacaoException;
import lanhouse.exception.DadosInvalidosException;
import lanhouse.exception.EntidadeNaoEncontradaException;
import lanhouse.model.Funcionario;
import lanhouse.model.Permissao;
import lanhouse.model.Turno;
import lanhouse.repository.FuncionarioRepository;
import lanhouse.util.AppLog;

/** Autenticação e cadastro da equipe. */
public class FuncionarioService {

    private final FuncionarioRepository repositorio;

    public FuncionarioService(FuncionarioRepository repositorio) {
        this.repositorio = Objects.requireNonNull(repositorio, "repositorio");
    }

    /**
     * Valida login e senha. A mensagem é a mesma para login inexistente e senha errada,
     * para não revelar quais logins existem.
     */
    public Funcionario autenticar(String login, String senha) {
        String chave = login == null ? "" : login.trim();
        String senhaInformada = senha == null ? "" : senha;

        Funcionario encontrado = repositorio.buscarPorLogin(chave).orElse(null);
        if (encontrado == null || !encontrado.senhaConfere(senhaInformada)) {
            AppLog.aviso("Falha de autenticação para o login '" + higienizar(chave) + "'");
            throw new AutenticacaoException();
        }
        AppLog.info("Login realizado: " + encontrado.getNome());
        return encontrado;
    }

    /**
     * Cadastra um funcionário. O serviço gera o ID e entrega à fábrica, que cria o cargo
     * desejado, por exemplo: id -> new Recepcionista(id, ...). Só quem tem GERENCIAR_EQUIPE.
     */
    public Funcionario cadastrar(Funcionario operador, Function<Integer, Funcionario> fabrica) {
        Funcionario.autorizar(operador, Permissao.GERENCIAR_EQUIPE);
        Objects.requireNonNull(fabrica, "fabrica");

        int id = repositorio.proximoId();
        Funcionario novo = fabrica.apply(id);
        if (novo == null || novo.getId() != id) {
            throw new IllegalArgumentException("A fábrica deve criar o funcionário com o ID recebido.");
        }
        if (!repositorio.inserirSeLoginLivre(novo)) {
            throw new DadosInvalidosException("Já existe um funcionário com o login informado.");
        }
        AppLog.info("Funcionário #" + novo.getId() + " (" + novo.getNome() + ") cadastrado por "
                + operador.getNome());
        return novo;
    }

    public List<Funcionario> listar(Funcionario operador) {
        Funcionario.autorizar(operador, Permissao.CONSULTAR_EQUIPE);
        return repositorio.listarTodos();
    }

    public List<Funcionario> listarPorTurno(Funcionario operador, Turno turno) {
        Funcionario.autorizar(operador, Permissao.CONSULTAR_EQUIPE);
        Objects.requireNonNull(turno, "turno");
        return repositorio.listarPorTurno(turno);
    }

    public Funcionario buscarPorId(Funcionario operador, int id) {
        Funcionario.autorizar(operador, Permissao.CONSULTAR_EQUIPE);
        return repositorio.buscarPorId(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Funcionário #" + id + " não encontrado."));
    }

    /** Remove quebras de linha e limita o tamanho antes de gravar texto digitado no log. */
    private static String higienizar(String texto) {
        String limpo = texto.replaceAll("\\p{Cntrl}", "?");
        return limpo.length() > 40 ? limpo.substring(0, 40) + "..." : limpo;
    }
}
