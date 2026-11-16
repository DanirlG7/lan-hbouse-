package lanhouse.repository;

import java.util.List;
import java.util.Optional;

import lanhouse.model.Funcionario;
import lanhouse.model.Turno;

public interface FuncionarioRepository extends Repositorio<Funcionario> {

    /** Busca ignorando maiúsculas e minúsculas (o login é guardado em minúsculas). */
    Optional<Funcionario> buscarPorLogin(String login);

    List<Funcionario> listarPorTurno(Turno turno);

    /** Insere só se o login estiver livre. Devolve false se já existir outro funcionário com ele. */
    boolean inserirSeLoginLivre(Funcionario funcionario);
}
