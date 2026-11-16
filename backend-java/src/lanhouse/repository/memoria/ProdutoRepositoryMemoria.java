package lanhouse.repository.memoria;

import java.util.Optional;

import lanhouse.model.Produto;
import lanhouse.repository.ProdutoRepository;

public class ProdutoRepositoryMemoria extends RepositorioMemoria<Produto> implements ProdutoRepository {

    @Override
    protected int chaveDe(Produto produto) {
        return produto.getId();
    }

    @Override
    public Optional<Produto> buscarPorNome(String nome) {
        return primeiro(p -> p.getNome().equalsIgnoreCase(nome));
    }

    @Override
    public boolean inserirSeNomeLivre(Produto produto) {
        return inserirSe(produto, existente -> existente.getNome().equalsIgnoreCase(produto.getNome()));
    }
}
