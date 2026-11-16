package lanhouse.repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import lanhouse.model.Pagamento;

public interface PagamentoRepository extends Repositorio<Pagamento> {

    List<Pagamento> listarPorSessao(int sessaoId);

    /** Pagamento mais recente da sessão (maior ID), em qualquer status. */
    Optional<Pagamento> buscarUltimoPorSessao(int sessaoId);

    /**
     * Pagamentos cuja data de registro está entre as duas datas (inclusivas), em qualquer
     * status. Quem gera o relatório filtra depois por status e por sessão encerrada.
     */
    List<Pagamento> listarPorPeriodo(LocalDate de, LocalDate ate);

    /**
     * Insere só se a sessão não tiver pagamento PENDENTE ou CONFIRMADO. Pagamento estornado
     * não bloqueia: depois de um estorno é possível registrar outro.
     */
    boolean inserirSeSemPagamentoAtivo(Pagamento pagamento);
}
