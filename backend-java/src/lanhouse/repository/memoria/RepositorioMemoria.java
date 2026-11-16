package lanhouse.repository.memoria;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.TreeMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.locks.ReentrantLock;
import java.util.function.Predicate;
import java.util.function.Supplier;

import lanhouse.repository.Repositorio;

/**
 * Base dos repositórios em memória. Os objetos ficam num TreeMap (ordenado pela chave) e todo
 * acesso passa por um lock explícito. As listas devolvidas são cópias, nunca a coleção interna.
 */
public abstract class RepositorioMemoria<T> implements Repositorio<T> {

    private final Map<Integer, T> dados = new TreeMap<>();
    private final ReentrantLock lock = new ReentrantLock();
    private final AtomicInteger sequencia = new AtomicInteger();

    /** Chave inteira que identifica a entidade neste repositório (id ou número). */
    protected abstract int chaveDe(T entidade);

    @Override
    public int proximoId() {
        return sequencia.incrementAndGet();
    }

    @Override
    public void salvar(T entidade) {
        Objects.requireNonNull(entidade, "entidade");
        sincronizado(() -> dados.put(chaveDe(entidade), entidade));
    }

    @Override
    public boolean inserirSeNovo(T entidade) {
        return inserirSe(entidade, existente -> false);
    }

    @Override
    public Optional<T> buscarPorId(int id) {
        return sincronizado(() -> Optional.ofNullable(dados.get(id)));
    }

    @Override
    public List<T> listarTodos() {
        return sincronizado(() -> List.copyOf(dados.values()));
    }

    @Override
    public int contar() {
        return sincronizado(dados::size);
    }

    /**
     * Inserção atômica: só insere se a chave for nova e nenhum registro existente satisfizer
     * o critério de conflito. Verificação e inserção acontecem no mesmo lock.
     */
    protected boolean inserirSe(T entidade, Predicate<T> conflito) {
        Objects.requireNonNull(entidade, "entidade");
        return sincronizado(() -> {
            int chave = chaveDe(entidade);
            if (dados.containsKey(chave) || dados.values().stream().anyMatch(conflito)) {
                return false;
            }
            dados.put(chave, entidade);
            return true;
        });
    }

    protected List<T> filtrar(Predicate<T> criterio) {
        return sincronizado(() -> dados.values().stream().filter(criterio).toList());
    }

    protected Optional<T> primeiro(Predicate<T> criterio) {
        return sincronizado(() -> dados.values().stream().filter(criterio).findFirst());
    }

    /** Último registro (maior chave) que satisfaz o critério. */
    protected Optional<T> ultimo(Predicate<T> criterio) {
        return sincronizado(() -> dados.values().stream().filter(criterio).reduce((anterior, atual) -> atual));
    }

    private <R> R sincronizado(Supplier<R> acao) {
        lock.lock();
        try {
            return acao.get();
        } finally {
            lock.unlock();
        }
    }
}
