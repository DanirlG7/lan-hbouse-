package lanhouse.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

import lanhouse.evento.Evento;
import lanhouse.evento.PublicadorEventos;
import lanhouse.exception.DadosInvalidosException;
import lanhouse.exception.EntidadeNaoEncontradaException;
import lanhouse.model.Funcionario;
import lanhouse.model.Permissao;
import lanhouse.model.Produto;
import lanhouse.repository.ProdutoRepository;
import lanhouse.tempo.Relogio;
import lanhouse.util.AppLog;

/**
 * Cadastro e estoque da bomboniere. A baixa de estoque por consumo acontece dentro da
 * sessão (Sessao.registrarConsumo), não aqui.
 */
public class ProdutoService {

    private final ProdutoRepository repositorio;
    private final PublicadorEventos eventos;
    private final Relogio relogio;

    public ProdutoService(ProdutoRepository repositorio, PublicadorEventos eventos, Relogio relogio) {
        this.repositorio = Objects.requireNonNull(repositorio, "repositorio");
        this.eventos = Objects.requireNonNull(eventos, "eventos");
        this.relogio = Objects.requireNonNull(relogio, "relogio");
    }

    /** O construtor de Produto valida nome, preço e quantidade. O nome não pode se repetir. */
    public Produto cadastrar(Funcionario operador, String nome, BigDecimal preco, int quantidadeInicial) {
        Funcionario.autorizar(operador, Permissao.GERENCIAR_PRODUTO);

        int id = repositorio.proximoId();
        Produto novo = new Produto(id, nome, preco, quantidadeInicial);
        if (!repositorio.inserirSeNomeLivre(novo)) {
            throw new DadosInvalidosException("Já existe um produto com esse nome.");
        }
        AppLog.info("Produto #" + novo.getId() + " (" + novo.getNome() + ") cadastrado por "
                + operador.getNome());
        return novo;
    }

    /** Soma unidades ao estoque. A quantidade precisa ser maior que zero. */
    public Produto reabastecer(Funcionario operador, int produtoId, int quantidade) {
        Funcionario.autorizar(operador, Permissao.GERENCIAR_PRODUTO);
        if (quantidade <= 0) {
            throw new DadosInvalidosException("A quantidade de reposição deve ser maior que zero.");
        }
        Produto produto = buscarPorId(produtoId);
        produto.reabastecer(quantidade);
        repositorio.salvar(produto);
        AppLog.info("Estoque de '" + produto.getNome() + "' reposto em " + quantidade
                + " un. por " + operador.getNome());
        eventos.publicar(new Evento.ProdutoReabastecido(relogio.agora(), produto.getId(), produto.getNome(),
                quantidade, produto.getQuantidadeEstoque(), operador.getId(), operador.getNome()));
        return produto;
    }

    /** O novo preço vale só para consumos futuros: itens já lançados mantêm o preço congelado. */
    public Produto atualizarPreco(Funcionario operador, int produtoId, BigDecimal novoPreco) {
        Funcionario.autorizar(operador, Permissao.GERENCIAR_PRODUTO);

        Produto produto = buscarPorId(produtoId);
        produto.atualizarPreco(novoPreco);
        repositorio.salvar(produto);
        AppLog.info("Preço de '" + produto.getNome() + "' atualizado por " + operador.getNome());
        return produto;
    }

    /**
     * Grava o estado atual de um produto alterado por outro serviço (baixa no consumo,
     * devolução no estorno). Sem checagem de permissão: quem chama já autorizou a operação maior.
     */
    public void persistir(Produto produto) {
        repositorio.salvar(produto);
    }

    public Produto buscarPorId(int id) {
        return repositorio.buscarPorId(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Produto #" + id + " não encontrado."));
    }

    public Produto buscarPorNome(String nome) {
        String chave = nome == null ? "" : nome.trim();
        return repositorio.buscarPorNome(chave)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Produto '" + chave + "' não encontrado."));
    }

    public List<Produto> listar() {
        return repositorio.listarTodos();
    }
}
