package lanhouse;

import java.util.Objects;

import lanhouse.exception.SessaoInvalidaException;
import lanhouse.model.Funcionario;
import lanhouse.evento.BarramentoEventos;
import lanhouse.repository.Repositorios;
import lanhouse.repository.memoria.RepositoriosMemoria;
import lanhouse.service.ClienteService;
import lanhouse.service.ComputadorService;
import lanhouse.service.FuncionarioService;
import lanhouse.service.PagamentoService;
import lanhouse.service.ProdutoService;
import lanhouse.service.RelatorioService;
import lanhouse.service.SessaoService;
import lanhouse.tempo.Relogio;
import lanhouse.tempo.RelogioReal;
import lanhouse.util.AppLog;
import lanhouse.util.ConsoleIO;
import lanhouse.util.DadosIniciais;

/**
 * Monta manualmente repositórios e serviços (sem framework), carrega os dados iniciais e
 * guarda quem está logado. Os controllers recebem este objeto e pegam dele o que precisam.
 */
public class Contexto {

    private final ConsoleIO io;
    private final Relogio relogio;
    private final BarramentoEventos eventos;
    private final FuncionarioService funcionarioService;
    private final ClienteService clienteService;
    private final ComputadorService computadorService;
    private final ProdutoService produtoService;
    private final SessaoService sessaoService;
    private final PagamentoService pagamentoService;
    private final RelatorioService relatorioService;

    private volatile Funcionario operador;

    /** Contexto com o relógio real (uso normal). */
    public Contexto(ConsoleIO io) {
        this(io, new RelogioReal());
    }

    /** Contexto com o relógio informado: o simulado na demonstração e na simulação. */
    public Contexto(ConsoleIO io, Relogio relogio) {
        this(io, relogio, RepositoriosMemoria.criar());
    }

    /**
     * Contexto completo: relógio e repositórios informados. É aqui que se escolhe onde os dados
     * ficam (memória, banco de dados). A carga inicial só roda se o armazenamento estiver vazio.
     */
    public Contexto(ConsoleIO io, Relogio relogio, Repositorios repositorios) {
        this.io = Objects.requireNonNull(io, "io");
        this.relogio = Objects.requireNonNull(relogio, "relogio");
        Objects.requireNonNull(repositorios, "repositorios");
        this.eventos = new BarramentoEventos();
        AppLog.usarRelogio(relogio);

        if (repositorios.funcionarios().contar() == 0) {
            DadosIniciais.popular(repositorios.funcionarios(), repositorios.clientes(),
                    repositorios.computadores(), repositorios.produtos());
        }

        this.funcionarioService = new FuncionarioService(repositorios.funcionarios());
        this.clienteService = new ClienteService(repositorios.clientes(), eventos, relogio);
        this.computadorService = new ComputadorService(repositorios.computadores(), eventos, relogio);
        this.produtoService = new ProdutoService(repositorios.produtos(), eventos, relogio);
        this.sessaoService = new SessaoService(repositorios.sessoes(), clienteService, computadorService,
                produtoService, eventos, relogio);
        this.pagamentoService = new PagamentoService(repositorios.pagamentos(), repositorios.sessoes(),
                produtoService, eventos, relogio);
        this.relatorioService = new RelatorioService(repositorios.pagamentos(), repositorios.sessoes());
    }

    public ConsoleIO io() {
        return io;
    }

    public Relogio relogio() {
        return relogio;
    }

    /** Barramento onde a simulação, a tela e outros ouvintes se inscrevem. */
    public BarramentoEventos eventos() {
        return eventos;
    }

    public FuncionarioService funcionarioService() {
        return funcionarioService;
    }

    public ClienteService clienteService() {
        return clienteService;
    }

    public ComputadorService computadorService() {
        return computadorService;
    }

    public ProdutoService produtoService() {
        return produtoService;
    }

    public SessaoService sessaoService() {
        return sessaoService;
    }

    public PagamentoService pagamentoService() {
        return pagamentoService;
    }

    public RelatorioService relatorioService() {
        return relatorioService;
    }

    // ---------- usuário logado ----------

    public boolean temOperador() {
        return operador != null;
    }

    /** Funcionário logado. Sem login, lança SessaoInvalidaException. */
    public Funcionario operador() {
        Funcionario atual = operador;
        if (atual == null) {
            throw new SessaoInvalidaException("Faça login para continuar.");
        }
        return atual;
    }

    public void definirOperador(Funcionario funcionario) {
        this.operador = Objects.requireNonNull(funcionario, "funcionario");
    }

    public void encerrarLogin() {
        this.operador = null;
    }
}
