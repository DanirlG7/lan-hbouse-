package lanhouse.service;

import java.util.List;
import java.util.Objects;

import lanhouse.evento.Evento;
import lanhouse.evento.PublicadorEventos;
import lanhouse.exception.EntidadeNaoEncontradaException;
import lanhouse.model.Cliente;
import lanhouse.model.Computador;
import lanhouse.model.Funcionario;
import lanhouse.model.ItemConsumacao;
import lanhouse.model.Permissao;
import lanhouse.model.Produto;
import lanhouse.model.Sessao;
import lanhouse.repository.SessaoRepository;
import lanhouse.tempo.Relogio;
import lanhouse.util.AppLog;

/** Abertura, consumo e encerramento de sessões. */
public class SessaoService {

    private final SessaoRepository repositorio;
    private final ClienteService clienteService;
    private final ComputadorService computadorService;
    private final ProdutoService produtoService;
    private final PublicadorEventos eventos;
    private final Relogio relogio;

    public SessaoService(SessaoRepository repositorio, ClienteService clienteService,
                         ComputadorService computadorService, ProdutoService produtoService,
                         PublicadorEventos eventos, Relogio relogio) {
        this.repositorio = Objects.requireNonNull(repositorio, "repositorio");
        this.clienteService = Objects.requireNonNull(clienteService, "clienteService");
        this.computadorService = Objects.requireNonNull(computadorService, "computadorService");
        this.produtoService = Objects.requireNonNull(produtoService, "produtoService");
        this.eventos = Objects.requireNonNull(eventos, "eventos");
        this.relogio = Objects.requireNonNull(relogio, "relogio");
    }

    /**
     * Abre a sessão. O computador é ocupado primeiro: é essa chamada que garante que dois
     * atendimentos simultâneos não peguem o mesmo PC. Se algo falhar depois, o PC é liberado.
     */
    public Sessao iniciar(Funcionario operador, int clienteId, int numeroComputador) {
        Funcionario.autorizar(operador, Permissao.INICIAR_SESSAO);

        Cliente cliente = clienteService.buscarPorId(clienteId);
        Computador computador = computadorService.buscarPorNumero(numeroComputador);

        computador.ocupar(); // lança ComputadorIndisponivelException se não estiver livre
        Sessao sessao;
        try {
            sessao = new Sessao(repositorio.proximoId(), cliente, computador, operador, relogio);
            repositorio.salvar(sessao);
            computadorService.persistir(computador); // agora EM_USO
        } catch (RuntimeException e) {
            computador.liberar();
            throw e;
        }
        AppLog.info("Sessão #" + sessao.getId() + " aberta: cliente #" + cliente.getId()
                + ", PC " + computador.getNumero() + ", operador " + operador.getNome());
        eventos.publicar(new Evento.SessaoIniciada(sessao.getInicio(), sessao.getId(), cliente.getId(),
                cliente.getNome(), computador.getNumero(), computador.getArea(), sessao.getTarifaHora(),
                operador.getId(), operador.getNome()));
        return sessao;
    }

    /** Lança um produto na sessão. A baixa de estoque e a checagem ficam em Sessao.registrarConsumo. */
    public Sessao registrarConsumo(Funcionario operador, int sessaoId, int produtoId, int quantidade) {
        Funcionario.autorizar(operador, Permissao.REGISTRAR_CONSUMO);

        Sessao sessao = buscarPorId(sessaoId);
        Produto produto = produtoService.buscarPorId(produtoId);
        ItemConsumacao item = sessao.registrarConsumo(produto, quantidade);
        repositorio.salvar(sessao);          // novo item na sessão
        produtoService.persistir(produto);   // estoque baixou
        AppLog.info("Consumo na sessão #" + sessao.getId() + ": " + quantidade + " x "
                + produto.getNome() + " (operador " + operador.getNome() + ")");
        eventos.publicar(new Evento.ConsumoRegistrado(relogio.agora(), sessao.getId(), produto.getId(),
                produto.getNome(), quantidade, item.getSubtotal(), produto.getQuantidadeEstoque(),
                operador.getId(), operador.getNome()));
        return sessao;
    }

    /**
     * Encerra a sessão e libera o computador. A sessão é encerrada primeiro: se já estava
     * encerrada, o model recusa e o computador não é mexido.
     */
    public Sessao encerrar(Funcionario operador, int sessaoId) {
        Funcionario.autorizar(operador, Permissao.ENCERRAR_SESSAO);

        Sessao sessao = buscarPorId(sessaoId);
        sessao.encerrar(operador, relogio.agora());
        // Busca a instância atual do computador no repositório (num banco, a da sessão seria uma cópia).
        Computador computador = computadorService.buscarPorNumero(sessao.getComputador().getNumero());
        computador.liberar();
        repositorio.salvar(sessao);
        computadorService.persistir(computador);
        AppLog.info("Sessão #" + sessao.getId() + " encerrada por " + operador.getNome()
                + " (" + sessao.getMinutosCobrados() + " min)");
        eventos.publicar(new Evento.SessaoEncerrada(sessao.getFim(), sessao.getId(), sessao.getCliente().getId(),
                sessao.getCliente().getNome(), sessao.getComputador().getNumero(), sessao.getMinutosCobrados(),
                sessao.getValorBruto(), operador.getId(), operador.getNome()));
        return sessao;
    }

    public Sessao buscarPorId(int id) {
        return repositorio.buscarPorId(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Sessão #" + id + " não encontrada."));
    }

    public List<Sessao> listarAtivas() {
        return repositorio.listarAtivas();
    }

    public List<Sessao> listarPorCliente(Funcionario operador, int clienteId) {
        Funcionario.autorizar(operador, Permissao.CONSULTAR_HISTORICO);
        clienteService.buscarPorId(clienteId); // falha se o cliente não existir
        return repositorio.listarPorCliente(clienteId);
    }

}
