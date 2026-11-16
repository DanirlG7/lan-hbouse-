package lanhouse.repository.memoria;

import java.util.Optional;

import lanhouse.model.Cliente;
import lanhouse.repository.ClienteRepository;

public class ClienteRepositoryMemoria extends RepositorioMemoria<Cliente> implements ClienteRepository {

    @Override
    protected int chaveDe(Cliente cliente) {
        return cliente.getId();
    }

    @Override
    public Optional<Cliente> buscarPorCpf(String cpf) {
        return primeiro(c -> c.getCpf().equals(cpf));
    }

    @Override
    public boolean inserirSeCpfLivre(Cliente cliente) {
        return inserirSe(cliente, existente -> existente.getCpf().equals(cliente.getCpf()));
    }
}
