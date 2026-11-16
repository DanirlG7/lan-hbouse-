package lanhouse.repository;

import java.util.Optional;

import lanhouse.model.Produto;

public interface ProdutoRepository extends Repositorio<Produto> {

    /** Busca ignorando maiúsculas e minúsculas. */
    Optional<Produto> buscarPorNome(String nome);

    /** Insere só se o nome estiver livre. Devolve false se já existir produto com esse nome. */
    boolean inserirSeNomeLivre(Produto produto);
}
