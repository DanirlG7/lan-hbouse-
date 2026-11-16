package lanhouse.repository.memoria;

import java.util.List;
import java.util.Optional;

import lanhouse.model.Funcionario;
import lanhouse.model.Turno;
import lanhouse.repository.FuncionarioRepository;

public class FuncionarioRepositoryMemoria extends RepositorioMemoria<Funcionario> implements FuncionarioRepository {

    @Override
    protected int chaveDe(Funcionario funcionario) {
        return funcionario.getId();
    }

    @Override
    public Optional<Funcionario> buscarPorLogin(String login) {
        return primeiro(f -> f.getLogin().equalsIgnoreCase(login));
    }

    @Override
    public List<Funcionario> listarPorTurno(Turno turno) {
        return filtrar(f -> f.getTurno() == turno);
    }

    @Override
    public boolean inserirSeLoginLivre(Funcionario funcionario) {
        return inserirSe(funcionario, existente -> existente.getLogin().equalsIgnoreCase(funcionario.getLogin()));
    }
}
