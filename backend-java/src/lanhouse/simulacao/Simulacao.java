package lanhouse.simulacao;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Optional;
import java.util.Random;
import java.util.Set;
import java.util.TreeMap;

import lanhouse.Contexto;
import lanhouse.evento.Evento;
import lanhouse.exception.DadosInvalidosException;
import lanhouse.exception.EstoqueInsuficienteException;
import lanhouse.exception.LanHouseException;
import lanhouse.model.AreaComputador;
import lanhouse.model.Cliente;
import lanhouse.model.Computador;
import lanhouse.model.Desenvolvedor;
import lanhouse.model.FormaPagamento;
import lanhouse.model.Funcionario;
import lanhouse.model.Limpeza;
import lanhouse.model.Pagamento;
import lanhouse.model.Produto;
import lanhouse.model.Recepcionista;
import lanhouse.model.Relatorio;
import lanhouse.model.Sessao;
import lanhouse.model.StatusComputador;
import lanhouse.model.SuporteTecnico;
import lanhouse.model.Turno;
import lanhouse.simulacao.ClienteVirtual.Etapa;
import lanhouse.tempo.RelogioSimulado;
import lanhouse.model.Administrador;

/**
 * Simula um dia inteiro da lan house, um minuto por passo. Clientes chegam, esperam, jogam,
 * compram lanche, pagam e vão embora; a equipe atende, limpa e conserta computadores. Todas as
 * ações passam pelos mesmos serviços do menu (regras, permissões, estoque, eventos), então o
 * que acontece aqui é o sistema de verdade funcionando, só que sozinho.
 *
 * Repetível: tudo que é sorteado usa um único gerador com a semente da configuração, a ordem
 * das decisões é fixa e o tempo vem do relógio simulado. Mesma semente, mesmo dia.
 * Não é thread-safe: use de uma thread só (a fachada cuida disso para o front).
 */
public class Simulacao {

    /** Quanto tempo simulado passa a cada passo. */
    public static final Duration PASSO = Duration.ofMinutes(1);

    private static final int ACOES_POR_PASSO = 2;
    private static final int ESTOQUE_MINIMO = 15;
    private static final int REPOSICAO = 40;
    private static final int[] DURACOES = {30, 60, 90, 120, 180, 240};
    private static final double[] PESOS_DURACAO = {0.15, 0.30, 0.20, 0.20, 0.10, 0.05};
    private static final FormaPagamento[] FORMAS =
            {FormaPagamento.PIX, FormaPagamento.DINHEIRO, FormaPagamento.DEBITO, FormaPagamento.CREDITO};
    private static final double[] PESOS_FORMA = {0.45, 0.20, 0.20, 0.15};

    private enum TipoServico { LIMPEZA, REPARO }

    private static final class ServicoDePc {
        final TipoServico tipo;
        final int computador;
        final AreaComputador area;
        final LocalDateTime fim;
        int executorId;

        ServicoDePc(TipoServico tipo, int computador, AreaComputador area, LocalDateTime fim, int executorId) {
            this.tipo = tipo;
            this.computador = computador;
            this.area = area;
            this.fim = fim;
            this.executorId = executorId;
        }
    }

    private record EstornoAgendado(int pagamentoId, LocalDateTime quando) {
    }

    private final Contexto ctx;
    private final RelogioSimulado relogio;
    private final ConfiguracaoSimulacao cfg;
    private final Funcionario admin;
    private final List<Funcionario> equipe;
    private final Random rng;
    private final GeradorDePessoas gerador = new GeradorDePessoas();

    private final LocalDateTime abertura;
    private final LocalDateTime ultimaEntrada;
    private final LocalDateTime fechamento;

    private final List<ClienteVirtual> presentes = new ArrayList<>();
    private final Map<Integer, ServicoDePc> servicos = new TreeMap<>();
    private final List<EstornoAgendado> estornosAgendados = new ArrayList<>();
    private final Map<Integer, Integer> usosNoPasso = new HashMap<>();
    private Map<Integer, Integer> usosVisiveis = Map.of();
    private final List<String> anomalias = new ArrayList<>();

    private boolean encerrado;

    // contadores da própria simulação
    private int chegadas;
    private int desistencias;
    private int vendasEsgotadas;
    private int limpezas;
    private int reparos;
    private int picoDeOcupacao;
    private int filaMaxima;
    private final int[] chegadasPorHora = new int[24];
    private final long[] ocupacaoSoma = new long[24];
    private final int[] ocupacaoAmostras = new int[24];

    // contadores montados a partir dos eventos publicados pelos serviços
    private int novosClientes;
    private int sessoes;
    private long minutosCobrados;
    private int itensVendidos;
    private BigDecimal vendasBomboniere = BigDecimal.ZERO;
    private int atendidos;
    private int estornos;
    private BigDecimal valorEstornado = BigDecimal.ZERO;
    private int reposicoes;
    private final BigDecimal[] faturamentoPorHora = new BigDecimal[24];

    /**
     * Prepara o dia. O relógio simulado é levado até a hora de abertura (ele não pode estar
     * depois dela). O administrador informado é quem repõe estoque e faz os estornos.
     */
    public Simulacao(Contexto ctx, RelogioSimulado relogio, ConfiguracaoSimulacao cfg, Funcionario admin) {
        this.ctx = Objects.requireNonNull(ctx, "ctx");
        this.relogio = Objects.requireNonNull(relogio, "relogio");
        this.cfg = Objects.requireNonNull(cfg, "cfg");
        this.admin = Objects.requireNonNull(admin, "admin");
        if (!(admin instanceof Administrador)) {
            throw new DadosInvalidosException("A simulação precisa de um Administrador.");
        }
        this.equipe = ctx.funcionarioService().listar(admin);
        this.rng = new Random(cfg.semente());
        this.abertura = cfg.dia().atTime(cfg.abertura());
        this.ultimaEntrada = cfg.dia().atTime(cfg.ultimaEntrada());
        this.fechamento = cfg.dia().atTime(cfg.fechamento());
        for (int h = 0; h < 24; h++) {
            faturamentoPorHora[h] = BigDecimal.ZERO;
        }
        for (Cliente c : ctx.clienteService().listar()) {
            gerador.reservar(c.getCpf());
        }
        if (relogio.agora().isAfter(abertura)) {
            throw new DadosInvalidosException("O relógio já passou da hora de abertura da simulação.");
        }
        relogio.avancarPara(abertura);
        ctx.eventos().inscrever(this::contabilizar);
    }

    public ConfiguracaoSimulacao configuracao() {
        return cfg;
    }

    public boolean terminou() {
        return encerrado;
    }

    /** Roda o dia até o fim e devolve o resumo. */
    public ResumoDoDia executarDiaCompleto() {
        int limite = 24 * 60 * 2; // trava de segurança: nunca roda mais que dois dias de passos
        while (!encerrado && limite-- > 0) {
            avancarPasso();
        }
        return resumo();
    }

    /** Faz um minuto simulado passar e deixa todo mundo agir. Não faz nada depois do fim. */
    public void avancarPasso() {
        if (encerrado) {
            return;
        }
        relogio.avancar(PASSO);
        LocalDateTime agora = relogio.agora();

        usosVisiveis = Map.copyOf(usosNoPasso);
        usosNoPasso.clear();
        presentes.removeIf(ClienteVirtual::saiu);
        reatribuirServicos(agora);

        if (agora.isBefore(ultimaEntrada)) {
            chegadas(agora);
        }
        if (agora.getMinute() == 0 && agora.isBefore(fechamento)) {
            conferirEstoque();
        }
        concluirServicos(agora);
        sortearFalhas(agora);
        atenderFila(agora);
        movimentarJogadores(agora);
        fecharSessoes(agora);
        confirmarPagamentos(agora);
        executarEstornos(agora);
        amostrar(agora);

        if (!agora.isBefore(fechamento) && presentes.stream().allMatch(ClienteVirtual::saiu)) {
            encerrado = true;
            presentes.clear(); // o dia acabou: o retrato final não tem mais ninguém na loja nem na rua
        }
    }

    // ------------------------------------------------------------------ chegada e fila

    private double multiplicadorDaHora(int hora) {
        if (hora < 12) {
            return 0.6;
        }
        if (hora < 14) {
            return 1.0;
        }
        if (hora < 18) {
            return 1.6;
        }
        if (hora < 22) {
            return 2.2;
        }
        return 1.2;
    }

    private void chegadas(LocalDateTime agora) {
        double probabilidade = cfg.chegadasPorHora() * multiplicadorDaHora(agora.getHour()) / 60.0;
        if (rng.nextDouble() >= probabilidade) {
            return;
        }
        chegadas++;
        chegadasPorHora[agora.getHour()]++;

        boolean quemSeraNovo = rng.nextDouble() < cfg.chanceNovoCliente();
        Cliente existente = quemSeraNovo ? null : sortearClienteExistente();
        String nome = null;
        String telefone = null;
        String cpf = null;
        if (existente == null) {
            nome = gerador.nome(rng);
            telefone = gerador.telefone(rng);
            cpf = gerador.cpf(rng);
        }
        boolean vip = rng.nextDouble() < cfg.chanceAreaVip();
        boolean aceitaOutra = rng.nextBoolean();
        int paciencia = 10 + rng.nextInt(16);
        int duracao = sortearDuracao();
        presentes.add(new ClienteVirtual(chegadas, agora, vip, aceitaOutra, paciencia, duracao, existente,
                nome, telefone, cpf));
    }

    private Cliente sortearClienteExistente() {
        Set<Integer> ocupados = new HashSet<>();
        for (ClienteVirtual v : presentes) {
            if (v.cliente != null) {
                ocupados.add(v.cliente.getId());
            }
        }
        List<Cliente> livres = ctx.clienteService().listar().stream()
                .filter(c -> !ocupados.contains(c.getId())).toList();
        return livres.isEmpty() ? null : livres.get(rng.nextInt(livres.size()));
    }

    private int sortearDuracao() {
        return DURACOES[sortear(PESOS_DURACAO)] + rng.nextInt(11);
    }

    private int sortear(double[] pesos) {
        double ponto = rng.nextDouble();
        double acumulado = 0;
        for (int i = 0; i < pesos.length; i++) {
            acumulado += pesos[i];
            if (ponto < acumulado) {
                return i;
            }
        }
        return pesos.length - 1;
    }

    private void atenderFila(LocalDateTime agora) {
        boolean fechou = !agora.isBefore(fechamento);
        for (ClienteVirtual v : new ArrayList<>(presentes)) {
            if (v.etapa != Etapa.NA_FILA) {
                continue;
            }
            if (fechou || agora.isAfter(v.chegouEm.plusMinutes(v.pacienciaMinutos))) {
                desistir(v);
                continue;
            }
            Optional<Computador> pc = escolherComputador(v);
            if (pc.isEmpty()) {
                continue;
            }
            Funcionario recepcao = recepcionista(agora);
            if (recepcao == null) {
                break; // balcão ocupado ou sem ninguém: o resto da fila espera o próximo passo
            }
            try {
                if (v.cliente == null) {
                    v.cliente = ctx.clienteService().cadastrar(recepcao, v.nomeNovo, v.telefoneNovo, v.cpfNovo);
                }
                Sessao sessao = ctx.sessaoService().iniciar(recepcao, v.cliente.getId(), pc.get().getNumero());
                v.sessaoId = sessao.getId();
                v.computador = pc.get().getNumero();
                LocalDateTime fim = agora.plusMinutes(v.duracaoMinutos);
                v.fimPlanejado = fim.isAfter(fechamento) ? fechamento : fim;
                v.etapa = Etapa.JOGANDO;
                if (v.duracaoMinutos > 20 && rng.nextDouble() < 0.7) {
                    v.proximoConsumo = agora.plusMinutes(5 + rng.nextInt(v.duracaoMinutos - 15));
                }
            } catch (LanHouseException e) {
                anomalia(agora, "iniciar atendimento do visitante " + v.numero, e);
                desistir(v);
            }
        }
    }

    private Optional<Computador> escolherComputador(ClienteVirtual v) {
        List<Computador> livres = ctx.computadorService().listarDisponiveis();
        AreaComputador preferida = v.prefereVip ? AreaComputador.VIP : AreaComputador.COMUM;
        List<Computador> daArea = livres.stream().filter(c -> c.getArea() == preferida).toList();
        if (!daArea.isEmpty()) {
            return Optional.of(daArea.get(rng.nextInt(daArea.size())));
        }
        if (v.aceitaOutraArea) {
            List<Computador> outras = livres.stream().filter(c -> c.getArea() != preferida).toList();
            if (!outras.isEmpty()) {
                return Optional.of(outras.get(rng.nextInt(outras.size())));
            }
        }
        return Optional.empty();
    }

    private void desistir(ClienteVirtual v) {
        v.etapa = Etapa.DESISTIU;
        desistencias++;
    }

    // ------------------------------------------------------------------ durante a sessão

    private void movimentarJogadores(LocalDateTime agora) {
        for (ClienteVirtual v : new ArrayList<>(presentes)) {
            if (v.etapa != Etapa.JOGANDO && v.etapa != Etapa.NA_BOMBONIERE) {
                continue;
            }
            if (!agora.isBefore(v.fimPlanejado)) {
                v.etapa = Etapa.A_PAGAR; // acabou o tempo (inclusive no meio de uma compra)
                continue;
            }
            if (v.etapa == Etapa.JOGANDO) {
                if (v.proximoConsumo != null && !agora.isBefore(v.proximoConsumo)) {
                    v.etapa = Etapa.NA_BOMBONIERE;
                    v.passosRestantes = 2 + rng.nextInt(3);
                    v.proximoConsumo = null;
                }
            } else {
                v.passosRestantes--;
                if (v.passosRestantes <= 0) {
                    comprarLanche(v, agora);
                }
            }
        }
    }

    private void comprarLanche(ClienteVirtual v, LocalDateTime agora) {
        Funcionario recepcao = recepcionista(agora);
        if (recepcao == null) {
            v.passosRestantes = 1; // espera o balcão ficar livre
            return;
        }
        List<Produto> produtos = ctx.produtoService().listar();
        Produto produto = produtos.get(rng.nextInt(produtos.size()));
        int quantidade = rng.nextDouble() < 0.25 ? 2 : 1;
        try {
            ctx.sessaoService().registrarConsumo(recepcao, v.sessaoId, produto.getId(), quantidade);
        } catch (EstoqueInsuficienteException e) {
            vendasEsgotadas++; // vai embora sem o lanche: faz parte do dia
        } catch (LanHouseException e) {
            anomalia(agora, "compra do visitante " + v.numero, e);
        }
        v.etapa = Etapa.JOGANDO;
        long restante = Duration.between(agora, v.fimPlanejado).toMinutes();
        if (restante > 30 && rng.nextDouble() < 0.5) {
            v.proximoConsumo = agora.plusMinutes(15 + rng.nextInt((int) Math.min(45, restante - 20)));
        }
    }

    // ------------------------------------------------------------------ pagamento

    private void fecharSessoes(LocalDateTime agora) {
        for (ClienteVirtual v : new ArrayList<>(presentes)) {
            if (v.etapa != Etapa.A_PAGAR) {
                continue;
            }
            Funcionario recepcao = recepcionista(agora);
            if (recepcao == null) {
                break;
            }
            try {
                ctx.sessaoService().encerrar(recepcao, v.sessaoId);
                v.forma = FORMAS[sortear(PESOS_FORMA)];
                Pagamento pagamento = ctx.pagamentoService().registrar(recepcao, v.sessaoId, v.forma);
                v.pagamentoId = pagamento.getId();
                v.passosRestantes = agora.isBefore(fechamento) ? 1 + rng.nextInt(3) : 1;
                v.etapa = Etapa.AGUARDANDO_PAGAMENTO;
                sortearLimpeza(agora, v.computador);
            } catch (LanHouseException e) {
                anomalia(agora, "fechar sessão do visitante " + v.numero, e);
                v.etapa = Etapa.SAINDO;
            }
        }
    }

    private void confirmarPagamentos(LocalDateTime agora) {
        for (ClienteVirtual v : new ArrayList<>(presentes)) {
            if (v.etapa != Etapa.AGUARDANDO_PAGAMENTO) {
                continue;
            }
            v.passosRestantes--;
            if (v.passosRestantes > 0) {
                continue;
            }
            Funcionario recepcao = recepcionistaDoTurno(agora);
            if (recepcao == null) {
                v.passosRestantes = 1;
                continue;
            }
            try {
                ctx.pagamentoService().confirmar(recepcao, v.pagamentoId);
                if (rng.nextDouble() < cfg.chanceEstorno()) {
                    LocalDateTime quando = agora.plusMinutes(30 + rng.nextInt(150));
                    if (quando.isBefore(fechamento)) {
                        estornosAgendados.add(new EstornoAgendado(v.pagamentoId, quando));
                    }
                }
            } catch (LanHouseException e) {
                anomalia(agora, "confirmar pagamento do visitante " + v.numero, e);
            }
            v.etapa = Etapa.SAINDO;
        }
    }

    private void executarEstornos(LocalDateTime agora) {
        for (EstornoAgendado e : new ArrayList<>(estornosAgendados)) {
            if (agora.isBefore(e.quando())) {
                continue;
            }
            estornosAgendados.remove(e);
            try {
                ctx.pagamentoService().estornar(admin, e.pagamentoId());
            } catch (LanHouseException ex) {
                anomalia(agora, "estorno do pagamento #" + e.pagamentoId(), ex);
            }
        }
    }

    // ------------------------------------------------------------------ equipe, PCs e estoque

    private void sortearLimpeza(LocalDateTime agora, int numeroComputador) {
        if (rng.nextDouble() >= cfg.chanceLimpeza()) {
            return;
        }
        Funcionario limpeza = primeiroDoTurno(Limpeza.class, agora);
        if (limpeza == null) {
            return;
        }
        enviarParaServico(TipoServico.LIMPEZA, limpeza, numeroComputador, agora.plusMinutes(5 + rng.nextInt(8)), agora);
    }

    private void sortearFalhas(LocalDateTime agora) {
        Funcionario suporte = primeiroDoTurno(SuporteTecnico.class, agora);
        for (Computador pc : ctx.computadorService().listarDisponiveis()) {
            if (servicos.containsKey(pc.getNumero())) {
                continue;
            }
            if (rng.nextDouble() < cfg.falhaPcPorMinuto() && suporte != null && agora.isBefore(fechamento)) {
                enviarParaServico(TipoServico.REPARO, suporte, pc.getNumero(),
                        agora.plusMinutes(45 + rng.nextInt(76)), agora);
            }
        }
    }

    private void enviarParaServico(TipoServico tipo, Funcionario executor, int numero, LocalDateTime fim,
                                   LocalDateTime agora) {
        try {
            Computador pc = ctx.computadorService().enviarParaManutencao(executor, numero);
            servicos.put(numero, new ServicoDePc(tipo, numero, pc.getArea(), fim, executor.getId()));
            if (tipo == TipoServico.LIMPEZA) {
                limpezas++;
            } else {
                reparos++;
            }
        } catch (LanHouseException e) {
            anomalia(agora, "enviar PC " + numero + " para " + tipo, e);
        }
    }

    private void concluirServicos(LocalDateTime agora) {
        for (ServicoDePc s : new ArrayList<>(servicos.values())) {
            if (agora.isBefore(s.fim)) {
                continue;
            }
            Funcionario executor = s.tipo == TipoServico.LIMPEZA
                    ? primeiroDoTurno(Limpeza.class, agora) : primeiroDoTurno(SuporteTecnico.class, agora);
            if (executor == null) {
                continue; // ninguém do tipo no turno: tenta de novo no próximo passo
            }
            try {
                ctx.computadorService().concluirManutencao(executor, s.computador);
            } catch (LanHouseException e) {
                anomalia(agora, "concluir serviço do PC " + s.computador, e);
            }
            servicos.remove(s.computador);
        }
    }

    /** Se quem estava fazendo o serviço saiu do turno, outra pessoa do mesmo cargo assume. */
    private void reatribuirServicos(LocalDateTime agora) {
        for (ServicoDePc s : servicos.values()) {
            Funcionario atual = funcionarioPorId(s.executorId);
            Turno turno = turnoDe(agora.toLocalTime());
            if (atual == null || atual.getTurno() != turno) {
                Funcionario novo = s.tipo == TipoServico.LIMPEZA
                        ? primeiroDoTurno(Limpeza.class, agora) : primeiroDoTurno(SuporteTecnico.class, agora);
                if (novo != null) {
                    s.executorId = novo.getId();
                }
            }
        }
    }

    private void conferirEstoque() {
        for (Produto p : ctx.produtoService().listar()) {
            if (p.getQuantidadeEstoque() < ESTOQUE_MINIMO) {
                try {
                    ctx.produtoService().reabastecer(admin, p.getId(), REPOSICAO);
                } catch (LanHouseException e) {
                    anomalia(relogio.agora(), "repor estoque de " + p.getNome(), e);
                }
            }
        }
    }

    // ------------------------------------------------------------------ pessoas da equipe

    private static Turno turnoDe(LocalTime hora) {
        return hora.getHour() < 16 ? Turno.TURNO_1 : Turno.TURNO_2;
    }

    private Funcionario primeiroDoTurno(Class<? extends Funcionario> tipo, LocalDateTime agora) {
        Turno turno = turnoDe(agora.toLocalTime());
        for (Funcionario f : equipe) {
            if (tipo.isInstance(f) && f.getTurno() == turno) {
                return f;
            }
        }
        return null;
    }

    private Funcionario recepcionistaDoTurno(LocalDateTime agora) {
        return primeiroDoTurno(Recepcionista.class, agora);
    }

    /** Recepcionista do turno com fôlego neste passo (depois do fechamento não há limite). */
    private Funcionario recepcionista(LocalDateTime agora) {
        Turno turno = turnoDe(agora.toLocalTime());
        boolean semLimite = !agora.isBefore(fechamento);
        for (Funcionario f : equipe) {
            if (f instanceof Recepcionista && f.getTurno() == turno) {
                int usados = usosNoPasso.getOrDefault(f.getId(), 0);
                if (semLimite || usados < ACOES_POR_PASSO) {
                    usosNoPasso.merge(f.getId(), 1, Integer::sum);
                    return f;
                }
            }
        }
        return null;
    }

    private Funcionario funcionarioPorId(int id) {
        for (Funcionario f : equipe) {
            if (f.getId() == id) {
                return f;
            }
        }
        return null;
    }

    // ------------------------------------------------------------------ medições e eventos

    private void amostrar(LocalDateTime agora) {
        int emUso = 0;
        for (Computador pc : ctx.computadorService().listar()) {
            if (pc.getStatus() == StatusComputador.EM_USO) {
                emUso++;
            }
        }
        int hora = agora.getHour();
        ocupacaoSoma[hora] += emUso;
        ocupacaoAmostras[hora]++;
        picoDeOcupacao = Math.max(picoDeOcupacao, emUso);
        long fila = presentes.stream().filter(v -> v.etapa == Etapa.NA_FILA).count();
        filaMaxima = Math.max(filaMaxima, (int) fila);
    }

    private void contabilizar(Evento evento) {
        if (evento instanceof Evento.ClienteCadastrado) {
            novosClientes++;
        } else if (evento instanceof Evento.SessaoIniciada) {
            sessoes++;
        } else if (evento instanceof Evento.SessaoEncerrada e) {
            minutosCobrados += e.minutosCobrados();
        } else if (evento instanceof Evento.ConsumoRegistrado e) {
            itensVendidos += e.quantidade();
            vendasBomboniere = vendasBomboniere.add(e.subtotal());
        } else if (evento instanceof Evento.PagamentoConfirmado e) {
            atendidos++;
            int hora = e.momento().getHour();
            faturamentoPorHora[hora] = faturamentoPorHora[hora].add(e.valorTotal());
        } else if (evento instanceof Evento.PagamentoEstornado e) {
            estornos++;
            valorEstornado = valorEstornado.add(e.valorTotal());
            int hora = e.momento().getHour();
            faturamentoPorHora[hora] = faturamentoPorHora[hora].subtract(e.valorTotal());
        } else if (evento instanceof Evento.ProdutoReabastecido) {
            reposicoes++;
        }
    }

    private void anomalia(LocalDateTime agora, String onde, LanHouseException e) {
        anomalias.add(String.format("%02d:%02d %s: %s", agora.getHour(), agora.getMinute(), onde, e.getMessage()));
    }

    // ------------------------------------------------------------------ o que o front enxerga

    /** Retrato do mundo agora: onde cada pessoa está, o que faz e como estão os computadores. */
    public EstadoDoMundo estado() {
        LocalDateTime agora = relogio.agora();
        boolean aberto = !encerrado && !agora.isBefore(abertura) && agora.isBefore(fechamento);
        List<PersonagemVisual> gente = new ArrayList<>();
        Map<Integer, String> usuarioDoPc = new HashMap<>();

        for (ClienteVirtual v : presentes) {
            gente.add(personagemDoCliente(v, agora));
            if (v.temComputador()) {
                usuarioDoPc.put(v.computador, v.nome());
            }
        }
        if (!encerrado) {
            for (Funcionario f : equipe) {
                PersonagemVisual p = personagemDaEquipe(f, agora);
                if (p != null) {
                    gente.add(p);
                }
            }
        }

        List<ComputadorVisual> pcs = new ArrayList<>();
        int emUso = 0;
        for (Computador pc : ctx.computadorService().listar()) {
            if (pc.getStatus() == StatusComputador.EM_USO) {
                emUso++;
            }
            pcs.add(new ComputadorVisual(pc.getNumero(), pc.getArea(), pc.getStatus(),
                    usuarioDoPc.get(pc.getNumero())));
        }
        int fila = (int) presentes.stream().filter(v -> v.etapa == Etapa.NA_FILA).count();
        return new EstadoDoMundo(agora, aberto, encerrado, fila, emUso, gente, pcs);
    }

    private PersonagemVisual personagemDoCliente(ClienteVirtual v, LocalDateTime agora) {
        String id = "visitante-" + v.numero;
        String nome = v.nome();
        switch (v.etapa) {
            case NA_FILA:
                long espera = Duration.between(v.chegouEm, agora).toMinutes();
                return new PersonagemVisual(id, nome, "Cliente", true, Setor.RECEPCAO,
                        "Na fila há " + espera + " min", null);
            case JOGANDO:
                return new PersonagemVisual(id, nome, "Cliente", true, setorDoPc(v.computador),
                        "Jogando no PC " + v.computador, v.computador);
            case NA_BOMBONIERE:
                return new PersonagemVisual(id, nome, "Cliente", true, Setor.BOMBONIERE,
                        "Comprando um lanche", v.computador);
            case A_PAGAR:
                return new PersonagemVisual(id, nome, "Cliente", true, Setor.RECEPCAO,
                        "Indo pagar", v.computador);
            case AGUARDANDO_PAGAMENTO:
                return new PersonagemVisual(id, nome, "Cliente", true, Setor.RECEPCAO,
                        "Pagando no " + v.forma.getDescricao(), null);
            case DESISTIU:
                return new PersonagemVisual(id, nome, "Cliente", true, Setor.RUA, "Desistiu de esperar", null);
            default:
                return new PersonagemVisual(id, nome, "Cliente", true, Setor.RUA, "Indo embora", null);
        }
    }

    private Setor setorDoPc(int numero) {
        for (Computador pc : ctx.computadorService().listar()) {
            if (pc.getNumero() == numero) {
                return Setor.doComputador(pc.getArea());
            }
        }
        return Setor.AREA_COMUM;
    }

    private PersonagemVisual personagemDaEquipe(Funcionario f, LocalDateTime agora) {
        String id = "funcionario-" + f.getId();
        boolean noTurno = f.getTurno() == turnoDe(agora.toLocalTime());
        if (f instanceof Administrador) {
            return new PersonagemVisual(id, f.getNome(), f.getCargo(), false, Setor.ESCRITORIO, "Administrando", null);
        }
        if (!noTurno) {
            return null; // fora do turno: não está na loja
        }
        if (f instanceof Recepcionista) {
            boolean ocupado = usosVisiveis.getOrDefault(f.getId(), 0) > 0;
            return new PersonagemVisual(id, f.getNome(), f.getCargo(), false, Setor.RECEPCAO,
                    ocupado ? "Atendendo cliente" : "Aguardando no balcão", null);
        }
        if (f instanceof Desenvolvedor) {
            return new PersonagemVisual(id, f.getNome(), f.getCargo(), false, Setor.ESCRITORIO, "Programando", null);
        }
        for (ServicoDePc s : servicos.values()) {
            if (s.executorId == f.getId()) {
                if (s.tipo == TipoServico.LIMPEZA) {
                    return new PersonagemVisual(id, f.getNome(), f.getCargo(), false, Setor.doComputador(s.area),
                            "Limpando o PC " + s.computador, s.computador);
                }
                return new PersonagemVisual(id, f.getNome(), f.getCargo(), false, Setor.MANUTENCAO,
                        "Consertando o PC " + s.computador, s.computador);
            }
        }
        String espera = f instanceof SuporteTecnico ? "De prontidão" : "Aguardando chamado";
        return new PersonagemVisual(id, f.getNome(), f.getCargo(), false, Setor.MANUTENCAO, espera, null);
    }

    // ------------------------------------------------------------------ resumo

    /** Resumo até o momento (o dia completo, se já terminou). */
    public ResumoDoDia resumo() {
        Relatorio relatorio = ctx.relatorioService().gerar(admin, cfg.dia(), cfg.dia());
        int totalPcs = ctx.computadorService().listar().size();
        List<ResumoDoDia.LinhaHoraria> linhas = new ArrayList<>();
        for (int h = cfg.abertura().getHour(); h < 24; h++) {
            double ocupacao = ocupacaoAmostras[h] == 0 || totalPcs == 0 ? 0
                    : 100.0 * ocupacaoSoma[h] / ocupacaoAmostras[h] / totalPcs;
            linhas.add(new ResumoDoDia.LinhaHoraria(h, chegadasPorHora[h], ocupacao, faturamentoPorHora[h]));
        }
        return new ResumoDoDia(cfg.dia(), cfg.semente(), chegadas, desistencias, atendidos, novosClientes,
                sessoes, minutosCobrados, itensVendidos, vendasBomboniere, vendasEsgotadas, reposicoes,
                estornos, valorEstornado, limpezas, reparos, totalPcs, picoDeOcupacao, filaMaxima,
                relatorio, linhas, anomalias);
    }
}
