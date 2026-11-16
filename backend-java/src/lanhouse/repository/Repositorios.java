package lanhouse.repository;

import java.util.Objects;

/**
 * Os seis repositórios do sistema reunidos num objeto só. É o ponto único para trocar o
 * armazenamento: o Contexto recebe um Repositorios e não sabe se por trás há memória ou banco.
 */
public record Repositorios(FuncionarioRepository funcionarios, ClienteRepository clientes,
                           ComputadorRepository computadores, ProdutoRepository produtos,
                           SessaoRepository sessoes, PagamentoRepository pagamentos) {

    public Repositorios {
        Objects.requireNonNull(funcionarios, "funcionarios");
        Objects.requireNonNull(clientes, "clientes");
        Objects.requireNonNull(computadores, "computadores");
        Objects.requireNonNull(produtos, "produtos");
        Objects.requireNonNull(sessoes, "sessoes");
        Objects.requireNonNull(pagamentos, "pagamentos");
    }
}
