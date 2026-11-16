package lanhouse.tempo;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Objects;

import lanhouse.exception.DadosInvalidosException;

/**
 * Relógio controlado: o tempo só passa quando alguém chama avancar(...). Isso torna
 * demonstrações e simulações repetíveis (mesmo roteiro, mesmos valores) e permite cobrar
 * horas de uso sem esperar. O tempo nunca anda para trás. Seguro para uso concorrente.
 */
public class RelogioSimulado implements Relogio {

    private LocalDateTime atual;

    public RelogioSimulado(LocalDateTime inicio) {
        this.atual = Objects.requireNonNull(inicio, "inicio");
    }

    @Override
    public synchronized LocalDateTime agora() {
        return atual;
    }

    /** Faz o tempo passar. A duração não pode ser negativa. */
    public synchronized void avancar(Duration duracao) {
        Objects.requireNonNull(duracao, "duracao");
        if (duracao.isNegative()) {
            throw new DadosInvalidosException("O relógio não pode voltar no tempo.");
        }
        atual = atual.plus(duracao);
    }

    /** Salta para um instante futuro (ou o mesmo instante). Voltar no tempo é recusado. */
    public synchronized void avancarPara(LocalDateTime instante) {
        Objects.requireNonNull(instante, "instante");
        if (instante.isBefore(atual)) {
            throw new DadosInvalidosException("O relógio não pode voltar no tempo.");
        }
        atual = instante;
    }
}
