package lanhouse.repository;

import java.util.Optional;

import lanhouse.model.Cliente;

public interface ClienteRepository extends Repositorio<Cliente> {

    /** O CPF deve estar normalizado (11 dígitos), como devolvido por Validador.cpf. */
    Optional<Cliente> buscarPorCpf(String cpf);

    /** Insere só se o CPF estiver livre. Devolve false se já existir cliente com esse CPF. */
    boolean inserirSeCpfLivre(Cliente cliente);
}
