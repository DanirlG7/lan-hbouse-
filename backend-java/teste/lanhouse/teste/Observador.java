package lanhouse.teste;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import lanhouse.evento.BarramentoEventos;
import lanhouse.evento.Evento;
import lanhouse.simulacao.DescritorDeEvento;

/**
 * Escuta todos os eventos de um dia e confere, na ordem em que acontecem, as regras que nunca
 * podem ser quebradas (um PC com uma sessão por vez, pagamento só depois de encerrar etc.).
 */
final class Observador {

    final List<String> violacoes = new ArrayList<>();
    final List<String> linhas = new ArrayList<>();

    BigDecimal confirmado = BigDecimal.ZERO;
    BigDecimal estornado = BigDecimal.ZERO;
    final Map<Integer, Integer> consumido = new HashMap<>();
    final Map<Integer, Integer> reposto = new HashMap<>();
    final List<Integer> sessoesComEstoqueDevolvido = new ArrayList<>();

    private final Map<Integer, Integer> sessaoAbertaNoPc = new HashMap<>();
    private final Set<Integer> pcsEmManutencao = new HashSet<>();
    private final Set<Integer> sessoesEncerradas = new HashSet<>();
    private LocalDateTime ultimoMomento;

    Observador(BarramentoEventos barramento) {
        barramento.inscrever(this::receber);
    }

    int abertasAgora() {
        return sessaoAbertaNoPc.size();
    }

    private void receber(Evento e) {
        linhas.add(e.getClass().getSimpleName() + " " + DescritorDeEvento.descreverComHora(e));
        if (ultimoMomento != null && e.momento().isBefore(ultimoMomento)) {
            violacoes.add("tempo andou para trás em " + e);
        }
        ultimoMomento = e.momento();

        if (e instanceof Evento.SessaoIniciada s) {
            if (sessaoAbertaNoPc.containsKey(s.computadorNumero())) {
                violacoes.add("duas sessões ao mesmo tempo no PC " + s.computadorNumero());
            }
            if (pcsEmManutencao.contains(s.computadorNumero())) {
                violacoes.add("sessão iniciada em PC em manutenção: " + s.computadorNumero());
            }
            sessaoAbertaNoPc.put(s.computadorNumero(), s.sessaoId());
        } else if (e instanceof Evento.SessaoEncerrada s) {
            Integer aberta = sessaoAbertaNoPc.remove(s.computadorNumero());
            if (aberta == null || aberta != s.sessaoId()) {
                violacoes.add("encerrou a sessão " + s.sessaoId() + " que não estava aberta no PC " + s.computadorNumero());
            }
            sessoesEncerradas.add(s.sessaoId());
        } else if (e instanceof Evento.PagamentoRegistrado p) {
            if (!sessoesEncerradas.contains(p.sessaoId())) {
                violacoes.add("pagamento registrado antes de encerrar a sessão " + p.sessaoId());
            }
        } else if (e instanceof Evento.PagamentoConfirmado p) {
            confirmado = confirmado.add(p.valorTotal());
        } else if (e instanceof Evento.PagamentoEstornado p) {
            estornado = estornado.add(p.valorTotal());
            if (p.estoqueDevolvido()) {
                sessoesComEstoqueDevolvido.add(p.sessaoId());
            }
        } else if (e instanceof Evento.ConsumoRegistrado c) {
            consumido.merge(c.produtoId(), c.quantidade(), Integer::sum);
            if (c.estoqueRestante() < 0) {
                violacoes.add("estoque negativo após consumo de " + c.produtoNome());
            }
        } else if (e instanceof Evento.ProdutoReabastecido r) {
            reposto.merge(r.produtoId(), r.quantidade(), Integer::sum);
        } else if (e instanceof Evento.ComputadorEmManutencao m) {
            if (sessaoAbertaNoPc.containsKey(m.computadorNumero())) {
                violacoes.add("PC " + m.computadorNumero() + " foi para manutenção com sessão aberta");
            }
            if (!pcsEmManutencao.add(m.computadorNumero())) {
                violacoes.add("PC " + m.computadorNumero() + " entrou em manutenção duas vezes seguidas");
            }
        } else if (e instanceof Evento.ManutencaoConcluida m) {
            if (!pcsEmManutencao.remove(m.computadorNumero())) {
                violacoes.add("PC " + m.computadorNumero() + " saiu de uma manutenção que não existia");
            }
        }
    }

    BigDecimal liquido() {
        return confirmado.subtract(estornado);
    }
}
