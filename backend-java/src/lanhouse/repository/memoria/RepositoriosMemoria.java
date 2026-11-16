package lanhouse.repository.memoria;

import lanhouse.repository.Repositorios;

/** Fábrica do conjunto de repositórios em memória (vazios). */
public final class RepositoriosMemoria {

    private RepositoriosMemoria() {
    }

    public static Repositorios criar() {
        return new Repositorios(
                new FuncionarioRepositoryMemoria(),
                new ClienteRepositoryMemoria(),
                new ComputadorRepositoryMemoria(),
                new ProdutoRepositoryMemoria(),
                new SessaoRepositoryMemoria(),
                new PagamentoRepositoryMemoria());
    }
}
