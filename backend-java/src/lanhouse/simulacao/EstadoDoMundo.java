package lanhouse.simulacao;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Retrato imutável de tudo que o front precisa desenhar num instante da simulação. Não guarda
 * referência a entidades do sistema, então pode ser lido de outra thread sem risco.
 */
public record EstadoDoMundo(LocalDateTime agora, boolean aberto, boolean encerrado, int filaTamanho,
                            int computadoresEmUso, List<PersonagemVisual> personagens,
                            List<ComputadorVisual> computadores) {

    public EstadoDoMundo {
        personagens = List.copyOf(personagens);
        computadores = List.copyOf(computadores);
    }

    /** Personagens que estão num setor. */
    public List<PersonagemVisual> noSetor(Setor setor) {
        return personagens.stream().filter(p -> p.setor() == setor).toList();
    }
}
