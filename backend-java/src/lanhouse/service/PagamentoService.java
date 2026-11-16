package lanhouse.service;

import java.util.List;
import java.util.Objects;

import lanhouse.evento.Evento;
import lanhouse.evento.PublicadorEventos;
import lanhouse.exception.EntidadeNaoEncontradaException;
import lanhouse.exception.PagamentoDuplicadoException;
import lanhouse.exception.PagamentoInvalidoException;
import lanhouse.model.FormaPagamento;
import lanhouse.model.Funcionario;
import lanhouse.model.ItemConsumacao;
import lanhouse.model.Pagamento;
import lanhouse.model.Permissao;
import lanhouse.model.Produto;
import lanhouse.model.Sessao;
import lanhouse.model.StatusSessao;
import lanhouse.repository.PagamentoRepository;
import lanhouse.repository.SessaoRepository;
import lanhouse.tempo.Relogio;
import lanhouse.util.AppLog;

/** Registro, confirmação e estorno de pagamentos. */
public class PagamentoService {

    private final PagamentoRepository repositorio;
    private final SessaoRepository sessaoRepositorio;
    private final ProdutoService produtoService;
    private final PublicadorEventos eventos;
    private final Relogio relogio;

    public PagamentoService(PagamentoRepository repositorio, SessaoRepository sessaoRepositorio,
                            ProdutoService produtoService, PublicadorEventos eventos, Relogio relogio) {
        this.repositorio = Objects.requireNonNull(repositorio, "repositorio");
        this.sessaoRepositorio = Objects.requireNonNull(sessaoRepositorio, "sessaoRepositorio");
        this.produtoService = Objects.requireNonNull(produtoService, "produtoService");
        this.eventos = Objects.requireNonNull(eventos, "eventos");
        this.relogio = Objects.requireNonNull(relogio, "relogio");
    }

    /**
     * Registra o pagamento (começa PENDENTE) de uma sessão encerrada. Só é recusado se a sessão
     * já tiver pagamento PENDENTE ou CONFIRMADO; depois de um estorno, pode-se pagar de novo.
     */
    public Pagamento registrar(Funcionario operador, int sessaoId, FormaPagamento forma) {
        Funcionario.autorizar(operador, Permissao.REGISTRAR_PAGAMENTO);
        Objects.requireNonNull(forma, "forma");

        Sessao sessao = buscarSessao(sessaoId);
        if (sessao.getStatus() != StatusSessao.ENCERRADA) {
            throw new PagamentoInvalidoException("A sessão #" + sessaoId + " ainda não foi encerrada.");
        }

        Pagamento pagamento = new Pagamento(repositorio.proximoId(), sessao, forma, operador, relogio.agora());
        if (!repositorio.inserirSeSemPagamentoAtivo(pagamento)) {
            throw new PagamentoDuplicadoException("A sessão #" + sessaoId + " já possui um pagamento ativo.");
        }
        AppLog.info("Pagamento #" + pagamento.getId() + " registrado para a sessão #" + sessaoId
                + " (" + forma.getDescricao() + ") por " + operador.getNome());
        eventos.publicar(new Evento.PagamentoRegistrado(pagamento.getDataPagamento(), pagamento.getId(),
                sessaoId, forma, pagamento.getValorTotal(), operador.getId(), operador.getNome()));
        return pagamento;
    }

    /** Confirma um pagamento pendente. A regra de status fica no model. */
    public Pagamento confirmar(Funcionario operador, int pagamentoId) {
        Funcionario.autorizar(operador, Permissao.REGISTRAR_PAGAMENTO);

        Pagamento pagamento = buscarPorId(pagamentoId);
        pagamento.confirmar(operador, relogio.agora());
        repositorio.salvar(pagamento);
        AppLog.info("Pagamento #" + pagamento.getId() + " confirmado por " + operador.getNome());
        eventos.publicar(new Evento.PagamentoConfirmado(pagamento.getDataConfirmacao(), pagamento.getId(),
                pagamento.getSessaoId(), pagamento.getForma(), pagamento.getValorTotal(),
                operador.getId(), operador.getNome()));
        return pagamento;
    }

    /**
     * Estorna um pagamento confirmado e devolve ao estoque os produtos consumidos na sessão.
     * A devolução acontece uma única vez por sessão (controlada por marcarEstoqueDevolvido).
     * Só quem tem ESTORNAR_PAGAMENTO (Administrador) pode estornar.
     */
    public Pagamento estornar(Funcionario operador, int pagamentoId) {
        Funcionario.autorizar(operador, Permissao.ESTORNAR_PAGAMENTO);

        Pagamento pagamento = buscarPorId(pagamentoId);
        pagamento.estornar(operador, relogio.agora()); // o model recusa se não estiver confirmado
        repositorio.salvar(pagamento);

        Sessao sessao = buscarSessao(pagamento.getSessaoId());
        boolean estoqueDevolvido = sessao.marcarEstoqueDevolvido();
        if (estoqueDevolvido) {
            for (ItemConsumacao item : sessao.getItens()) {
                // Instância atual do produto no repositório (num banco, a do item seria uma cópia).
                Produto produto = produtoService.buscarPorId(item.getProduto().getId());
                produto.reabastecer(item.getQuantidade());
                produtoService.persistir(produto);
            }
            sessaoRepositorio.salvar(sessao); // a marca "estoque devolvido" mudou
            AppLog.info("Estoque da sessão #" + sessao.getId() + " devolvido no estorno.");
        }
        AppLog.info("Pagamento #" + pagamento.getId() + " estornado por " + operador.getNome());
        eventos.publicar(new Evento.PagamentoEstornado(pagamento.getDataEstorno(), pagamento.getId(),
                pagamento.getSessaoId(), pagamento.getForma(), pagamento.getValorTotal(), estoqueDevolvido,
                operador.getId(), operador.getNome()));
        return pagamento;
    }

    public Pagamento buscarPorId(int id) {
        return repositorio.buscarPorId(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Pagamento #" + id + " não encontrado."));
    }

    public List<Pagamento> listarPorSessao(int sessaoId) {
        return repositorio.listarPorSessao(sessaoId);
    }

    private Sessao buscarSessao(int sessaoId) {
        return sessaoRepositorio.buscarPorId(sessaoId)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Sessão #" + sessaoId + " não encontrada."));
    }
}
