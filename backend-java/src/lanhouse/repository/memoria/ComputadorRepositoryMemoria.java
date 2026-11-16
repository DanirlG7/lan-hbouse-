package lanhouse.repository.memoria;

import java.util.List;
import java.util.Optional;

import lanhouse.model.Computador;
import lanhouse.repository.ComputadorRepository;

public class ComputadorRepositoryMemoria extends RepositorioMemoria<Computador> implements ComputadorRepository {

    @Override
    protected int chaveDe(Computador computador) {
        return computador.getNumero();
    }

    @Override
    public Optional<Computador> buscarPorNumero(int numero) {
        return buscarPorId(numero);
    }

    @Override
    public List<Computador> listarDisponiveis() {
        return filtrar(Computador::isDisponivel);
    }
}
