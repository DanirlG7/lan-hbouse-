package lanhouse.evento;

/**
 * O que os serviços enxergam do sistema de eventos: só a capacidade de publicar. Quem escuta
 * se inscreve no BarramentoEventos, que implementa esta interface.
 */
public interface PublicadorEventos {

    /** Avisa a quem estiver escutando que o fato aconteceu. Nunca lança exceção de ouvinte. */
    void publicar(Evento evento);

    /** Publicador que descarta tudo. Útil em testes e onde ninguém precisa escutar. */
    static PublicadorEventos descartar() {
        return evento -> { };
    }
}
