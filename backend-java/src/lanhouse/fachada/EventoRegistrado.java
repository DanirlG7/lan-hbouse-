package lanhouse.fachada;

import java.time.LocalDateTime;

/**
 * Uma linha do feed de acontecimentos. A sequência cresce de 1 em 1: o front guarda a última
 * que viu e pede só as novas (eventosApos), sem precisar ouvir o barramento diretamente.
 */
public record EventoRegistrado(long sequencia, LocalDateTime momento, String tipo, String texto) {
}
