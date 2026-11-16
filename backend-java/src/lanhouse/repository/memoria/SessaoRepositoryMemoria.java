package lanhouse.repository.memoria;

import java.util.List;

import lanhouse.model.Sessao;
import lanhouse.repository.SessaoRepository;

public class SessaoRepositoryMemoria extends RepositorioMemoria<Sessao> implements SessaoRepository {

    @Override
    protected int chaveDe(Sessao sessao) {
        return sessao.getId();
    }

    @Override
    public List<Sessao> listarAtivas() {
        return filtrar(Sessao::isAtiva);
    }

    @Override
    public List<Sessao> listarPorCliente(int clienteId) {
        return filtrar(s -> s.getCliente().getId() == clienteId);
    }
}
