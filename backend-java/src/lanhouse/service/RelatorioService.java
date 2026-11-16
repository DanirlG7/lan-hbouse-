package lanhouse.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

import lanhouse.exception.DadosInvalidosException;
import lanhouse.exception.EntidadeNaoEncontradaException;
import lanhouse.model.FormaPagamento;
import lanhouse.model.Funcionario;
import lanhouse.model.Pagamento;
import lanhouse.model.Permissao;
import lanhouse.model.Relatorio;
import lanhouse.model.Sessao;
import lanhouse.model.StatusPagamento;
import lanhouse.model.StatusSessao;
import lanhouse.repository.PagamentoRepository;
import lanhouse.repository.SessaoRepository;
import lanhouse.util.AppLog;
import lanhouse.util.Formatador;

/** Relatório de faturamento, extrato da sessão e consulta à auditoria. */
public class RelatorioService {

    private final PagamentoRepository pagamentoRepositorio;
    private final SessaoRepository sessaoRepositorio;

    public RelatorioService(PagamentoRepository pagamentoRepositorio, SessaoRepository sessaoRepositorio) {
        this.pagamentoRepositorio = Objects.requireNonNull(pagamentoRepositorio, "pagamentoRepositorio");
        this.sessaoRepositorio = Objects.requireNonNull(sessaoRepositorio, "sessaoRepositorio");
    }

    /**
     * RN09: faturamento do período (datas inclusivas, pela data do pagamento). Entram só
     * pagamentos CONFIRMADOS de sessões ENCERRADAS; pendentes e estornados ficam de fora.
     */
    public Relatorio gerar(Funcionario operador, LocalDate de, LocalDate ate) {
        Funcionario.autorizar(operador, Permissao.GERAR_RELATORIO);
        if (de == null || ate == null) {
            throw new DadosInvalidosException("Informe as duas datas do período.");
        }
        if (de.isAfter(ate)) {
            throw new DadosInvalidosException("A data inicial não pode ser depois da data final.");
        }

        List<Pagamento> confirmados = pagamentoRepositorio.listarPorPeriodo(de, ate).stream()
                .filter(p -> p.getStatus() == StatusPagamento.CONFIRMADO)
                .filter(this::sessaoEncerrada)
                .toList();

        AppLog.info("Relatório " + Formatador.data(de) + " a " + Formatador.data(ate)
                + " gerado por " + operador.getNome());
        return montarRelatorio(de, ate, confirmados);
    }

    /** Texto do extrato da sessão, com o pagamento mais recente (se houver). */
    public String extrato(Funcionario operador, int sessaoId) {
        Funcionario.autorizar(operador, Permissao.CONSULTAR_HISTORICO);

        Sessao sessao = sessaoRepositorio.buscarPorId(sessaoId)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Sessão #" + sessaoId + " não encontrada."));
        Pagamento pagamento = pagamentoRepositorio.buscarUltimoPorSessao(sessaoId).orElse(null);
        return Formatador.extrato(sessao, pagamento);
    }

    /** Registros de auditoria em memória, do mais antigo para o mais recente. */
    public List<String> auditoria(Funcionario operador) {
        Funcionario.autorizar(operador, Permissao.CONSULTAR_AUDITORIA);
        return AppLog.registros();
    }

    private boolean sessaoEncerrada(Pagamento pagamento) {
        return sessaoRepositorio.buscarPorId(pagamento.getSessaoId())
                .map(s -> s.getStatus() == StatusSessao.ENCERRADA)
                .orElse(false);
    }

    /** Soma quantidade, total geral e total por forma de pagamento (valores já com desconto). */
    private Relatorio montarRelatorio(LocalDate de, LocalDate ate, List<Pagamento> confirmados) {
        Map<FormaPagamento, BigDecimal> porForma = new EnumMap<>(FormaPagamento.class);
        for (FormaPagamento forma : FormaPagamento.values()) {
            porForma.put(forma, BigDecimal.ZERO.setScale(2));
        }
        BigDecimal total = BigDecimal.ZERO.setScale(2);
        for (Pagamento pagamento : confirmados) {
            porForma.merge(pagamento.getForma(), pagamento.getValorTotal(), BigDecimal::add);
            total = total.add(pagamento.getValorTotal());
        }
        return new Relatorio(de, ate, confirmados.size(), porForma, total);
    }
}
