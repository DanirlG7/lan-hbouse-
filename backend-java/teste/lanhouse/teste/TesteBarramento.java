package lanhouse.teste;

import java.io.PrintStream;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.atomic.AtomicInteger;

import lanhouse.evento.BarramentoEventos;
import lanhouse.evento.Evento;
import lanhouse.evento.PublicadorEventos;
import lanhouse.util.AppLog;

/** O barramento de eventos: ordem, filtro por tipo, cancelamento, isolamento de falhas e concorrência. */
final class TesteBarramento {

    private TesteBarramento() {
    }

    private static Evento evento(int i) {
        return new Evento.ManutencaoConcluida(LocalDateTime.of(2026, 1, 1, 0, 0).plusMinutes(i), i, 1, "teste");
    }

    static int executar(PrintStream out) throws Exception {
        Verificador v = new Verificador("Barramento de eventos", out);

        BarramentoEventos bus = new BarramentoEventos();
        List<String> ordem = new ArrayList<>();
        bus.inscrever(e -> ordem.add("A"));
        bus.inscrever(Evento.ManutencaoConcluida.class, e -> ordem.add("B"));
        bus.inscrever(Evento.SessaoEncerrada.class, e -> ordem.add("C-não-deve-receber"));
        bus.publicar(evento(1));
        v.igual("entrega na ordem das inscrições e só para o tipo certo", List.of("A", "B"), ordem);

        AtomicInteger recebidos = new AtomicInteger();
        BarramentoEventos.Inscricao inscricao = bus.inscrever(e -> recebidos.incrementAndGet());
        bus.publicar(evento(2));
        inscricao.cancelar();
        bus.publicar(evento(3));
        inscricao.cancelar();
        v.igual("cancelar para de receber (e cancelar duas vezes é inofensivo)", 1, recebidos.get());

        AppLog.limpar();
        BarramentoEventos b2 = new BarramentoEventos();
        AtomicInteger depois = new AtomicInteger();
        b2.inscrever(e -> {
            throw new IllegalStateException("ouvinte quebrado de propósito");
        });
        b2.inscrever(e -> depois.incrementAndGet());
        b2.publicar(evento(4));
        v.igual("exceção de um ouvinte não impede o seguinte de receber", 1, depois.get());
        v.confere("a exceção do ouvinte foi registrada no log",
                AppLog.registros().stream().anyMatch(l -> l.contains("Ouvinte falhou ao receber ManutencaoConcluida")));

        BarramentoEventos b3 = new BarramentoEventos();
        AtomicInteger total = new AtomicInteger();
        b3.inscrever(e -> total.incrementAndGet());
        ExecutorService pool = Executors.newFixedThreadPool(8);
        List<Future<?>> tarefas = new ArrayList<>();
        for (int t = 0; t < 8; t++) {
            tarefas.add(pool.submit(() -> {
                for (int i = 0; i < 2000; i++) {
                    BarramentoEventos.Inscricao temporaria = b3.inscrever(e -> { });
                    b3.publicar(evento(i));
                    temporaria.cancelar();
                }
            }));
        }
        for (Future<?> f : tarefas) {
            f.get();
        }
        pool.shutdown();
        v.igual("8 threads x 2000 eventos: nenhum perdido", 16000, total.get());
        v.igual("8 threads inscrevendo e cancelando: nada ficou para trás", 1, b3.quantidadeDeOuvintes());

        v.recusa("publicar nulo é recusado", NullPointerException.class, () -> bus.publicar(null));
        PublicadorEventos.descartar().publicar(evento(5));
        v.confere("o publicador que descarta aceita e ignora", true);
        return v.falhas();
    }
}
