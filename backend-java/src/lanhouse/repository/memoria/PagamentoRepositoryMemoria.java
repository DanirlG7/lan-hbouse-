package lanhouse.repository.memoria;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

import lanhouse.model.Pagamento;
import lanhouse.model.StatusPagamento;
import lanhouse.repository.PagamentoRepository;

public class PagamentoRepositoryMemoria extends RepositorioMemoria<Pagamento> implements PagamentoRepository {

    @Override
    protected int chaveDe(Pagamento pagamento) {
        return pagamento.getId();
    }

    @Override
    public List<Pagamento> listarPorSessao(int sessaoId) {
        return filtrar(p -> p.getSessaoId() == sessaoId);
    }

    @Override
    public Optional<Pagamento> buscarUltimoPorSessao(int sessaoId) {
        return ultimo(p -> p.getSessaoId() == sessaoId);
    }

    @Override
    public List<Pagamento> listarPorPeriodo(LocalDate de, LocalDate ate) {
        return filtrar(p -> {
            LocalDate dia = p.getDataPagamento().toLocalDate();
            return !dia.isBefore(de) && !dia.isAfter(ate);
        });
    }

    @Override
    public boolean inserirSeSemPagamentoAtivo(Pagamento pagamento) {
        return inserirSe(pagamento, existente ->
                existente.getSessaoId() == pagamento.getSessaoId()
                        && existente.getStatus() != StatusPagamento.ESTORNADO);
    }
}
