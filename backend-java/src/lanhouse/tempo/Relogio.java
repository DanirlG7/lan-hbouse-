package lanhouse.tempo;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * Fonte única de data e hora do sistema. Nenhuma classe de negócio chama LocalDateTime.now()
 * diretamente: todas pedem a hora a um Relogio. Em produção ele é o relógio real; na
 * demonstração e na simulação, um relógio controlado que avança sob comando.
 */
public interface Relogio {

    /** Data e hora atuais segundo este relógio. */
    LocalDateTime agora();

    /** Data atual segundo este relógio. */
    default LocalDate hoje() {
        return agora().toLocalDate();
    }
}
