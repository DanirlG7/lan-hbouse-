package lanhouse.repository;

import java.util.List;

import lanhouse.model.Sessao;

public interface SessaoRepository extends Repositorio<Sessao> {

    List<Sessao> listarAtivas();

    List<Sessao> listarPorCliente(int clienteId);
}
