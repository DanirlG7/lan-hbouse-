package lanhouse.evento;

import java.util.List;
import java.util.Objects;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

import lanhouse.util.AppLog;

/**
 * Barramento de eventos em memória (padrão Observer). Os serviços publicam; ouvintes se
 * inscrevem para todos os eventos ou só para um tipo.
 *
 * Regras:
 * - A entrega é síncrona, na mesma thread de quem publicou, na ordem das inscrições. Isso
 *   deixa a simulação previsível. Ouvinte lento deve repassar o evento a uma fila própria.
 * - Um ouvinte que lança exceção não derruba a operação de negócio nem impede os demais de
 *   receber: o erro é registrado no AppLog e a entrega continua.
 * - Seguro para uso concorrente; dá para se inscrever e cancelar enquanto eventos circulam.
 */
public class BarramentoEventos implements PublicadorEventos {

    /** Devolvida ao se inscrever; chame cancelar() para parar de receber eventos. */
    @FunctionalInterface
    public interface Inscricao {
        void cancelar();
    }

    private record Entrada(Class<? extends Evento> tipo, Consumer<Evento> ouvinte) {
    }

    private final List<Entrada> entradas = new CopyOnWriteArrayList<>();

    /** Recebe todos os eventos. */
    public Inscricao inscrever(Consumer<? super Evento> ouvinte) {
        return inscrever(Evento.class, ouvinte);
    }

    /** Recebe apenas eventos do tipo informado, por exemplo SessaoEncerrada.class. */
    public <E extends Evento> Inscricao inscrever(Class<E> tipo, Consumer<? super E> ouvinte) {
        Objects.requireNonNull(tipo, "tipo");
        Objects.requireNonNull(ouvinte, "ouvinte");
        Entrada entrada = new Entrada(tipo, evento -> ouvinte.accept(tipo.cast(evento)));
        entradas.add(entrada);
        return () -> entradas.remove(entrada);
    }

    @Override
    public void publicar(Evento evento) {
        Objects.requireNonNull(evento, "evento");
        for (Entrada entrada : entradas) {
            if (!entrada.tipo().isInstance(evento)) {
                continue;
            }
            try {
                entrada.ouvinte().accept(evento);
            } catch (RuntimeException e) {
                AppLog.erro("Ouvinte falhou ao receber " + evento.getClass().getSimpleName(), e);
            }
        }
    }

    /** Quantidade de ouvintes inscritos agora. */
    public int quantidadeDeOuvintes() {
        return entradas.size();
    }
}
