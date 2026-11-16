package lanhouse.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.List;
import java.util.function.Supplier;

import lanhouse.tempo.Relogio;

/**
 * Registro de auditoria e diagnóstico em memória. Guarda só os últimos registros
 * (limite fixo) e não escreve no console, para não atrapalhar os menus.
 */
public final class AppLog {

    private static final int LIMITE_REGISTROS = 2000;
    private static final DateTimeFormatter FORMATO = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm:ss");
    private static final Deque<String> REGISTROS = new ArrayDeque<>();
    private static volatile Supplier<LocalDateTime> fonteDeTempo = LocalDateTime::now;

    private AppLog() {
    }

    /**
     * Faz os carimbos de hora do log seguirem o relógio informado (por exemplo, o simulado).
     * O log é global; o Contexto chama isto uma vez ao ser criado.
     */
    public static void usarRelogio(Relogio relogio) {
        fonteDeTempo = relogio::agora;
    }

    public static void info(String mensagem) {
        registrar("INFO", mensagem);
    }

    public static void aviso(String mensagem) {
        registrar("AVISO", mensagem);
    }

    /** Registra o erro com a classe e a mensagem da causa, sem stack trace. */
    public static void erro(String mensagem, Throwable causa) {
        String detalhe = causa == null ? "" : " | causa: " + causa.getClass().getSimpleName() + ": " + causa.getMessage();
        registrar("ERRO", mensagem + detalhe);
    }

    /** Cópia dos registros, do mais antigo para o mais recente. */
    public static List<String> registros() {
        synchronized (REGISTROS) {
            return List.copyOf(REGISTROS);
        }
    }

    /** Apaga todos os registros (usado em testes e demonstrações). */
    public static void limpar() {
        synchronized (REGISTROS) {
            REGISTROS.clear();
        }
    }

    private static void registrar(String nivel, String mensagem) {
        String linha = fonteDeTempo.get().format(FORMATO) + " [" + nivel + "] "
                + (mensagem == null ? "" : mensagem);
        synchronized (REGISTROS) {
            if (REGISTROS.size() >= LIMITE_REGISTROS) {
                REGISTROS.removeFirst();
            }
            REGISTROS.addLast(linha);
        }
    }
}
