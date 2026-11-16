package lanhouse.teste;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.concurrent.atomic.AtomicReference;

import lanhouse.Contexto;
import lanhouse.fachada.EventoRegistrado;
import lanhouse.fachada.JogoLanHouse;
import lanhouse.model.Funcionario;
import lanhouse.simulacao.ConfiguracaoSimulacao;
import lanhouse.simulacao.EstadoDoMundo;
import lanhouse.simulacao.Simulacao;
import lanhouse.tempo.RelogioSimulado;
import lanhouse.util.ConsoleIO;
import lanhouse.util.DadosIniciais;

/** A porta de entrada do front: passos, retrato, feed incremental e uso com várias threads. */
final class TesteFachada {

    private TesteFachada() {
    }

    static int executar(PrintStream out) throws Exception {
        Verificador v = new Verificador("Fachada para o front", out);

        JogoLanHouse jogo = JogoLanHouse.novo(7);
        v.igual("o dia começa às 08:00", LocalDateTime.of(2026, 10, 31, 8, 0), jogo.agora());
        v.igual("avançar(60) dá 60 passos", 60, jogo.avancar(60));
        v.igual("depois de 60 minutos são 09:00", LocalDateTime.of(2026, 10, 31, 9, 0), jogo.agora());
        v.confere("o retrato diz que está aberto", jogo.estado().aberto() && !jogo.estado().encerrado());

        jogo.avancar(240);
        List<EventoRegistrado> tudo = jogo.eventosApos(0);
        v.confere("o feed tem acontecimentos depois de 5 horas (" + tudo.size() + ")", !tudo.isEmpty());
        boolean crescente = true;
        for (int i = 1; i < tudo.size(); i++) {
            crescente &= tudo.get(i).sequencia() == tudo.get(i - 1).sequencia() + 1;
        }
        v.confere("as sequências do feed crescem de 1 em 1, sem buracos", crescente);
        v.confere("a última sequência bate com o feed", tudo.get(tudo.size() - 1).sequencia() == jogo.ultimaSequencia());
        long vista = jogo.ultimaSequencia();
        v.confere("pedir só o que é novo, sem avançar, devolve vazio", jogo.eventosApos(vista).isEmpty());
        jogo.avancar(120);
        List<EventoRegistrado> novos = jogo.eventosApos(vista);
        v.confere("depois de avançar vêm só os novos (" + novos.size() + ")",
                !novos.isEmpty() && novos.get(0).sequencia() == vista + 1);
        v.confere("cada acontecimento tem tipo e texto legível",
                novos.stream().allMatch(e -> !e.tipo().isBlank() && !e.texto().isBlank()));

        int restante = jogo.avancar(100_000);
        v.confere("avançar muito para quando o dia acaba (" + restante + " passos dados)", jogo.terminou() && restante < 100_000);
        LocalDateTime fim = jogo.agora();
        jogo.avancar();
        v.igual("avançar depois do fim não faz nada", fim, jogo.agora());
        v.confere("o feed guarda no máximo 1000 acontecimentos", jogo.eventosApos(0).size() <= 1000);

        // o resultado pela fachada é o mesmo de montar tudo à mão com a mesma semente
        RelogioSimulado relogio = new RelogioSimulado(LocalDateTime.of(2026, 10, 31, 0, 0));
        ConsoleIO mudo = new ConsoleIO(InputStream.nullInputStream(), new PrintStream(OutputStream.nullOutputStream()));
        Contexto ctx = new Contexto(mudo, relogio);
        Funcionario admin = ctx.funcionarioService().autenticar(DadosIniciais.LOGIN_ADMIN, DadosIniciais.SENHA_PADRAO);
        String direto = new Simulacao(ctx, relogio, ConfiguracaoSimulacao.padrao(7), admin).executarDiaCompleto().texto();
        v.igual("a fachada produz o mesmo dia que a simulação montada à mão", direto, jogo.resumo().texto());

        usoConcorrente(v);
        return v.falhas();
    }

    /** Uma thread joga enquanto outra desenha: nada pode dar erro nem voltar atrás. */
    private static void usoConcorrente(Verificador v) throws Exception {
        JogoLanHouse jogo = JogoLanHouse.novo(3);
        AtomicBoolean terminou = new AtomicBoolean();
        AtomicReference<Throwable> erro = new AtomicReference<>();

        Thread laco = new Thread(() -> {
            try {
                while (!jogo.terminou()) {
                    jogo.avancar();
                }
            } catch (Throwable t) {
                erro.set(t);
            } finally {
                terminou.set(true);
            }
        });
        int leituras = 0;
        boolean sequenciaVoltou = false;
        boolean tempoVoltou = false;
        long ultimaSequencia = 0;
        LocalDateTime ultimoInstante = LocalDateTime.MIN;
        laco.start();
        try {
            while (!terminou.get() || leituras < 50) {
                EstadoDoMundo estado = jogo.estado();
                long sequencia = jogo.ultimaSequencia();
                jogo.eventosApos(Math.max(0, sequencia - 20));
                sequenciaVoltou |= sequencia < ultimaSequencia;
                tempoVoltou |= estado.agora().isBefore(ultimoInstante);
                ultimaSequencia = sequencia;
                ultimoInstante = estado.agora();
                leituras++;
            }
        } catch (Throwable t) {
            erro.compareAndSet(null, t);
        }
        laco.join();
        v.confere("jogar e desenhar ao mesmo tempo: " + leituras + " leituras sem nenhum erro"
                + (erro.get() == null ? "" : " -> " + erro.get()), erro.get() == null);
        v.confere("durante o uso concorrente nem o tempo nem a sequência voltaram atrás", !sequenciaVoltou && !tempoVoltou);
        v.confere("o dia terminou normalmente no uso concorrente", jogo.terminou());
    }
}
