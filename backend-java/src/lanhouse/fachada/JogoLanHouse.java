package lanhouse.fachada;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayDeque;
import java.util.ArrayList;
import java.util.Deque;
import java.util.List;

import lanhouse.Contexto;
import lanhouse.evento.Evento;
import lanhouse.model.Funcionario;
import lanhouse.simulacao.ConfiguracaoSimulacao;
import lanhouse.simulacao.DescritorDeEvento;
import lanhouse.simulacao.EstadoDoMundo;
import lanhouse.simulacao.ResumoDoDia;
import lanhouse.simulacao.Simulacao;
import lanhouse.tempo.RelogioSimulado;
import lanhouse.util.ConsoleIO;
import lanhouse.util.DadosIniciais;

/**
 * Porta de entrada do front. Esconde Contexto, serviços, relógio e simulação atrás de poucos
 * métodos: avançar o tempo, ver o estado do mundo, ler o feed de acontecimentos e pedir o resumo.
 *
 * Tudo que o front recebe é imutável (registros com cópias), então a tela pode desenhar sem
 * risco de alterar o sistema. Os métodos são sincronizados: um laço de jogo numa thread pode
 * chamar avancar() enquanto a thread da tela chama estado() e eventosApos().
 *
 * Quem decide a velocidade é o front: ele chama avancar() quantas vezes por segundo quiser
 * (cada chamada é um minuto simulado, ver passo()).
 */
public final class JogoLanHouse {

    private static final int CAPACIDADE_DO_FEED = 1000;

    private final RelogioSimulado relogio;
    private final Simulacao simulacao;
    private final Deque<EventoRegistrado> feed = new ArrayDeque<>();
    private long sequencia;

    private JogoLanHouse(RelogioSimulado relogio, Simulacao simulacao) {
        this.relogio = relogio;
        this.simulacao = simulacao;
    }

    /** Dia padrão com a semente informada. A mesma semente produz sempre o mesmo dia. */
    public static JogoLanHouse novo(long semente) {
        return novo(ConfiguracaoSimulacao.padrao(semente));
    }

    public static JogoLanHouse novo(ConfiguracaoSimulacao configuracao) {
        RelogioSimulado relogio = new RelogioSimulado(configuracao.dia().atStartOfDay());
        ConsoleIO mudo = new ConsoleIO(InputStream.nullInputStream(), new PrintStream(OutputStream.nullOutputStream()));
        Contexto ctx = new Contexto(mudo, relogio);
        Funcionario admin = ctx.funcionarioService().autenticar(DadosIniciais.LOGIN_ADMIN, DadosIniciais.SENHA_PADRAO);
        Simulacao simulacao = new Simulacao(ctx, relogio, configuracao, admin);
        JogoLanHouse jogo = new JogoLanHouse(relogio, simulacao);
        ctx.eventos().inscrever(jogo::registrar);
        return jogo;
    }

    private synchronized void registrar(Evento evento) {
        feed.addLast(new EventoRegistrado(++sequencia, evento.momento(), evento.getClass().getSimpleName(),
                DescritorDeEvento.descrever(evento)));
        if (feed.size() > CAPACIDADE_DO_FEED) {
            feed.removeFirst();
        }
    }

    /** Quanto tempo simulado passa em cada avancar(). */
    public Duration passo() {
        return Simulacao.PASSO;
    }

    public ConfiguracaoSimulacao configuracao() {
        return simulacao.configuracao();
    }

    /** Avança um passo (um minuto simulado). Não faz nada depois do fim do dia. */
    public synchronized void avancar() {
        simulacao.avancarPasso();
    }

    /** Avança até "passos" passos, parando se o dia acabar. Devolve quantos foram dados. */
    public synchronized int avancar(int passos) {
        int dados = 0;
        while (dados < passos && !simulacao.terminou()) {
            simulacao.avancarPasso();
            dados++;
        }
        return dados;
    }

    public synchronized boolean terminou() {
        return simulacao.terminou();
    }

    public synchronized LocalDateTime agora() {
        return relogio.agora();
    }

    /** Retrato do mundo agora: pessoas, setores e computadores. */
    public synchronized EstadoDoMundo estado() {
        return simulacao.estado();
    }

    /** Acontecimentos novos desde a sequência informada (use 0 para ler tudo que ainda está no feed). */
    public synchronized List<EventoRegistrado> eventosApos(long ultimaSequenciaVista) {
        List<EventoRegistrado> novos = new ArrayList<>();
        for (EventoRegistrado e : feed) {
            if (e.sequencia() > ultimaSequenciaVista) {
                novos.add(e);
            }
        }
        return novos;
    }

    /** Sequência do último acontecimento registrado (0 se ainda não houve nenhum). */
    public synchronized long ultimaSequencia() {
        return sequencia;
    }

    /** Resumo do dia até agora (o dia completo, se já terminou). */
    public synchronized ResumoDoDia resumo() {
        return simulacao.resumo();
    }
}
