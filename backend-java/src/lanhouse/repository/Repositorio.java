package lanhouse.repository;

import java.util.List;
import java.util.Optional;

/**
 * Contrato comum de todos os repositórios. Os serviços dependem só destas interfaces; quem
 * guarda os dados de verdade (memória hoje, banco depois) fica em outro pacote e pode ser
 * trocado sem mexer em serviços, controllers ou model.
 *
 * Regras que toda implementação deve respeitar:
 * - salvar(...) é chamado pelos serviços DEPOIS de qualquer alteração em um objeto. Em memória
 *   isso não muda nada (a instância é a mesma), mas um banco só grava o que for salvo.
 * - Os métodos inserirSe... verificam e inserem de forma atômica (sem brecha entre os dois).
 * - As listas devolvidas são cópias: alterá-las não altera o repositório.
 * - Nenhum repositório valida permissão nem lança exceção de negócio; as buscas devolvem
 *   Optional e o serviço decide o que fazer quando não acha.
 */
public interface Repositorio<T> {

    /** Reserva e devolve o próximo ID sequencial (1, 2, 3...). Seguro para uso concorrente. */
    int proximoId();

    /** Insere ou substitui a entidade que tiver a mesma chave. */
    void salvar(T entidade);

    /** Insere somente se a chave ainda não existir. Devolve false se já existia. */
    boolean inserirSeNovo(T entidade);

    /** Busca pela chave da entidade (o ID, ou o número no caso do computador). */
    Optional<T> buscarPorId(int id);

    /** Todos os registros, ordenados pela chave. */
    List<T> listarTodos();

    int contar();
}
