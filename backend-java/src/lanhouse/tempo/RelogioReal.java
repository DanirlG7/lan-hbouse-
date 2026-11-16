package lanhouse.tempo;

import java.time.Clock;
import java.time.LocalDateTime;
import java.util.Objects;

/** Relógio do sistema operacional. É o usado no modo interativo. */
public class RelogioReal implements Relogio {

    private final Clock clock;

    public RelogioReal() {
        this(Clock.systemDefaultZone());
    }

    /** Aceita um Clock específico (útil para fixar o fuso horário). */
    public RelogioReal(Clock clock) {
        this.clock = Objects.requireNonNull(clock, "clock");
    }

    @Override
    public LocalDateTime agora() {
        return LocalDateTime.now(clock);
    }
}
