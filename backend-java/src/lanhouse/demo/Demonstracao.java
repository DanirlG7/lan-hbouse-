package lanhouse.demo;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.TreeMap;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.stream.Collectors;

import lanhouse.Contexto;
import lanhouse.evento.BarramentoEventos.Inscricao;
import lanhouse.evento.Evento;
import lanhouse.exception.LanHouseException;
import lanhouse.model.FormaPagamento;
import lanhouse.model.Funcionario;
import lanhouse.model.Pagamento;
import lanhouse.model.Produto;
import lanhouse.model.Relatorio;
import lanhouse.model.Sessao;
import lanhouse.tempo.RelogioSimulado;
import lanhouse.util.ConsoleIO;
import lanhouse.util.DadosIniciais;
import lanhouse.util.Formatador;

/**
 * Fluxo automático que exercita as principais regras do sistema, sem digitar nada. O tempo é
 * simulado: a demonstração "avança o relógio" para cobrar horas de uso sem esperar, e o
 * resultado é sempre o mesmo a cada execução.
 */
public class Demonstracao {

    /** Instante em que o relógio simulado da demonstração começa. */
    public static final LocalDateTime INICIO_PADRAO = LocalDateTime.of(2026, 10, 31, 14, 0);

    private static final int LINHAS_DE_AUDITORIA = 12;

    private final Contexto ctx;
    private final RelogioSimulado relogio;
    private final ConsoleIO io;

    /** Todos os eventos recebidos do barramento (preenchido por um ouvinte geral). */
    private final List<Evento> recebidos = Collections.synchronizedList(new ArrayList<>());
    /** Só os encerramentos de sessão (preenchido por um ouvinte de tipo específico). */
    private final List<Evento.SessaoEncerrada> encerradas = Collections.synchronizedList(new ArrayList<>());

    public Demonstracao(Contexto ctx, RelogioSimulado relogio) {
        this.ctx = Objects.requireNonNull(ctx, "ctx");
        this.relogio = Objects.requireNonNull(relogio, "relogio");
        this.io = ctx.io();
    }

    public void executar() {
        io.titulo("DEMONSTRAÇÃO AUTOMÁTICA - LAN HOUSE");

        Funcionario admin = ctx.funcionarioService().autenticar(DadosIniciais.LOGIN_ADMIN, DadosIniciais.SENHA_PADRAO);
        Funcionario recepcao = ctx.funcionarioService().autenticar("fernanda.oliveira", DadosIniciais.SENHA_PADRAO);
        Funcionario suporte = ctx.funcionarioService().autenticar("bruno.alves", DadosIniciais.SENHA_PADRAO);
        io.sucesso("Logados: " + admin.getNome() + ", " + recepcao.getNome() + " e " + suporte.getNome());

        ctx.eventos().inscrever(recebidos::add);
        ctx.eventos().inscrever(Evento.SessaoEncerrada.class, encerradas::add);

        Produto chocolate = ctx.produtoService().buscarPorNome("Barras de Chocolate");
        Produto refrigerante = ctx.produtoService().buscarPorNome("Refrigerantes");
        Produto preTreino = ctx.produtoService().buscarPorNome("Pré-treino");

        sessaoComPix(admin, recepcao, chocolate, refrigerante);
        regraDosMinutos(recepcao);
        sessaoVip(admin, recepcao, preTreino);
        permissoesEManutencao(recepcao, suporte);
        eventosPublicados(admin, chocolate);
        relatorioEAuditoria(admin);

        io.titulo("FIM DA DEMONSTRAÇÃO");
    }

    /** Sessão de 1h25 na área comum: consumo, Pix, estorno (só admin) com devolução de estoque. */
    private void sessaoComPix(Funcionario admin, Funcionario recepcao, Produto chocolate, Produto refrigerante) {
        io.titulo("1. Sessão comum (PC 1) com consumo e Pix");
        mostrarHora();

        Sessao sessao = ctx.sessaoService().iniciar(recepcao, 1, 1);
        io.sucesso("Sessão #" + sessao.getId() + " aberta para " + sessao.getCliente().getNome() + " no PC 1.");

        passar(Duration.ofMinutes(40));
        ctx.sessaoService().registrarConsumo(recepcao, sessao.getId(), chocolate.getId(), 2);
        ctx.sessaoService().registrarConsumo(recepcao, sessao.getId(), refrigerante.getId(), 1);
        io.sucesso("Consumo: 2 x Barras de Chocolate e 1 x Refrigerantes.");
        mostrarEstoque("Estoque após o consumo", chocolate, refrigerante);

        tentar("consumir mais chocolate do que existe no estoque",
                () -> ctx.sessaoService().registrarConsumo(recepcao, sessao.getId(), chocolate.getId(), 9999));

        passar(Duration.ofMinutes(45));
        ctx.sessaoService().encerrar(recepcao, sessao.getId());
        io.sucesso("Sessão #" + sessao.getId() + " encerrada.");
        io.exibirTexto(ctx.relatorioService().extrato(recepcao, sessao.getId()));

        tentar("registrar pagamento de uma sessão ainda ativa (nova sessão no PC 4)", () -> {
            Sessao aberta = ctx.sessaoService().iniciar(recepcao, 3, 4);
            try {
                ctx.pagamentoService().registrar(recepcao, aberta.getId(), FormaPagamento.PIX);
            } finally {
                ctx.sessaoService().encerrar(recepcao, aberta.getId());
            }
        });

        Pagamento pix = ctx.pagamentoService().registrar(recepcao, sessao.getId(), FormaPagamento.PIX);
        io.sucesso("Pagamento #" + pix.getId() + " registrado: " + pix.getStatus().getDescricao() + ".");
        tentar("registrar um segundo pagamento ativo na mesma sessão",
                () -> ctx.pagamentoService().registrar(recepcao, sessao.getId(), FormaPagamento.DINHEIRO));

        ctx.pagamentoService().confirmar(recepcao, pix.getId());
        io.sucesso("Pagamento #" + pix.getId() + " confirmado (Pix: 5% de desconto).");
        io.exibirTexto(ctx.relatorioService().extrato(recepcao, sessao.getId()));

        tentar("recepcionista estornar um pagamento (só o Administrador pode)",
                () -> ctx.pagamentoService().estornar(recepcao, pix.getId()));

        ctx.pagamentoService().estornar(admin, pix.getId());
        io.sucesso("Pagamento #" + pix.getId() + " estornado pelo Administrador.");
        mostrarEstoque("Estoque após o estorno (produtos devolvidos)", chocolate, refrigerante);

        Pagamento dinheiro = ctx.pagamentoService().registrar(recepcao, sessao.getId(), FormaPagamento.DINHEIRO);
        ctx.pagamentoService().confirmar(recepcao, dinheiro.getId());
        io.sucesso("Novo pagamento #" + dinheiro.getId() + " em dinheiro confirmado.");
        mostrarEstoque("Estoque depois do novo pagamento (não pode baixar de novo)", chocolate, refrigerante);
    }

    /** Minuto iniciado conta por inteiro, com mínimo de 1 minuto. */
    private void regraDosMinutos(Funcionario recepcao) {
        io.titulo("2. Regra dos minutos (tarifa comum: R$ 6,00/h)");

        cobrarPor("59 segundos", Duration.ofSeconds(59), 4, 5, recepcao);
        cobrarPor("61 segundos", Duration.ofSeconds(61), 5, 6, recepcao);
        cobrarPor("1 hora exata", Duration.ofHours(1), 6, 7, recepcao);
    }

    private void cobrarPor(String rotulo, Duration uso, int clienteId, int pc, Funcionario recepcao) {
        Sessao sessao = ctx.sessaoService().iniciar(recepcao, clienteId, pc);
        passar(uso);
        ctx.sessaoService().encerrar(recepcao, sessao.getId());
        io.mensagem("  " + rotulo + " no PC " + pc + " -> " + sessao.getMinutosCobrados() + " min cobrados, "
                + Formatador.moeda(sessao.getValorTempo()));
    }

    /** Sessão VIP de 2h10 com pagamento que fica pendente. */
    private void sessaoVip(Funcionario admin, Funcionario recepcao, Produto preTreino) {
        io.titulo("3. Sessão VIP (PC 9, R$ 10,00/h) com pagamento pendente");
        mostrarHora();

        Sessao sessao = ctx.sessaoService().iniciar(recepcao, 2, 9);
        io.sucesso("Sessão #" + sessao.getId() + " aberta para " + sessao.getCliente().getNome() + " no PC 9.");

        tentar("abrir outra sessão no PC 9 enquanto ele está ocupado",
                () -> ctx.sessaoService().iniciar(recepcao, 3, 9));

        passar(Duration.ofMinutes(130));
        ctx.sessaoService().registrarConsumo(recepcao, sessao.getId(), preTreino.getId(), 1);
        ctx.sessaoService().encerrar(recepcao, sessao.getId());
        io.sucesso("Sessão #" + sessao.getId() + " encerrada.");
        io.exibirTexto(ctx.relatorioService().extrato(recepcao, sessao.getId()));

        Pagamento credito = ctx.pagamentoService().registrar(recepcao, sessao.getId(), FormaPagamento.CREDITO);
        io.sucesso("Pagamento #" + credito.getId() + " registrado como " + credito.getStatus().getDescricao()
                + " e deixado sem confirmar.");
        tentar("estornar um pagamento que ainda não foi confirmado",
                () -> ctx.pagamentoService().estornar(admin, credito.getId()));
    }

    /** Permissões por cargo e ciclo de manutenção de um computador. */
    private void permissoesEManutencao(Funcionario recepcao, Funcionario suporte) {
        io.titulo("4. Permissões e manutenção");

        tentar("recepcionista enviar um PC para manutenção",
                () -> ctx.computadorService().enviarParaManutencao(recepcao, 3));

        ctx.computadorService().enviarParaManutencao(suporte, 2);
        io.sucesso("Suporte técnico enviou o PC 2 para manutenção.");
        tentar("abrir sessão em um PC que está em manutenção",
                () -> ctx.sessaoService().iniciar(recepcao, 3, 2));
        ctx.computadorService().concluirManutencao(suporte, 2);
        io.sucesso("Suporte técnico concluiu a manutenção do PC 2.");

        tentar("recepcionista alterar a tarifa de um PC (RN10)",
                () -> ctx.computadorService().alterarTarifa(recepcao, 3, new java.math.BigDecimal("1.00")));
        Funcionario admin = ctx.funcionarioService().autenticar(DadosIniciais.LOGIN_ADMIN, DadosIniciais.SENHA_PADRAO);
        ctx.computadorService().cadastrar(admin, 13, lanhouse.model.AreaComputador.VIP, null);
        ctx.computadorService().alterarTarifa(admin, 13, new java.math.BigDecimal("12.00"));
        io.sucesso("Administrador cadastrou o PC 13 (VIP, tarifa padrão) e passou a tarifa para R$ 12,00.");

        tentar("login com senha errada",
                () -> ctx.funcionarioService().autenticar(DadosIniciais.LOGIN_ADMIN, "senha-errada"));
        tentar("recepcionista cadastrar funcionário",
                () -> ctx.funcionarioService().cadastrar(recepcao, id -> null));
    }

    /** Mostra o que os serviços publicaram e prova que um ouvinte defeituoso não atrapalha a operação. */
    private void eventosPublicados(Funcionario admin, Produto chocolate) {
        io.titulo("5. Eventos publicados pelos serviços");

        List<Evento> copia;
        synchronized (recebidos) {
            copia = List.copyOf(recebidos);
        }
        io.mensagem("  " + copia.size() + " eventos recebidos por um ouvinte geral, por tipo:");
        Map<String, Long> porTipo = copia.stream().collect(Collectors.groupingBy(
                e -> e.getClass().getSimpleName(), TreeMap::new, Collectors.counting()));
        porTipo.forEach((tipo, quantidade) -> io.mensagem("    " + tipo + ": " + quantidade));

        io.mensagem("  Os 3 primeiros (o consumo que falhou por falta de estoque não publicou nada):");
        for (int i = 0; i < Math.min(3, copia.size()); i++) {
            io.mensagem("    " + copia.get(i));
        }

        List<Evento.SessaoEncerrada> fechadas;
        synchronized (encerradas) {
            fechadas = List.copyOf(encerradas);
        }
        BigDecimal somaBruta = fechadas.stream().map(Evento.SessaoEncerrada::valorBruto)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        io.mensagem("  Ouvinte só de SessaoEncerrada: " + fechadas.size() + " sessões, valor bruto somado "
                + Formatador.moeda(somaBruta) + " (calculado apenas pelos eventos).");

        io.mensagem("  Ouvinte defeituoso (lança exceção a cada evento) inscrito antes de um ouvinte normal:");
        AtomicInteger recebidoPeloNormal = new AtomicInteger();
        Inscricao defeituoso = ctx.eventos().inscrever(e -> {
            throw new IllegalStateException("ouvinte quebrado de propósito");
        });
        Inscricao normal = ctx.eventos().inscrever(e -> recebidoPeloNormal.incrementAndGet());
        int antes = ctx.produtoService().buscarPorId(chocolate.getId()).getQuantidadeEstoque();
        ctx.produtoService().reabastecer(admin, chocolate.getId(), 5);
        int depois = ctx.produtoService().buscarPorId(chocolate.getId()).getQuantidadeEstoque();
        defeituoso.cancelar();
        normal.cancelar();
        io.mensagem("    Estoque de chocolate: " + antes + " -> " + depois
                + " (a operação concluiu), eventos recebidos pelo ouvinte normal: " + recebidoPeloNormal.get()
                + " (a entrega continuou), ouvintes inscritos agora: " + ctx.eventos().quantidadeDeOuvintes()
                + " (os dois inscritos do teste foram cancelados).");
    }

    private void relatorioEAuditoria(Funcionario admin) {
        io.titulo("6. Relatório do dia e auditoria");
        mostrarHora();

        LocalDate hoje = relogio.hoje();
        Relatorio relatorio = ctx.relatorioService().gerar(admin, hoje, hoje);
        io.mensagem("Só o pagamento confirmado da sessão 1 deve aparecer (o estornado e o pendente ficam de fora):");
        io.exibirTexto(Formatador.relatorio(relatorio));

        List<String> registros = ctx.relatorioService().auditoria(admin);
        int inicio = Math.max(0, registros.size() - LINHAS_DE_AUDITORIA);
        io.mensagem("");
        io.mensagem("Últimos " + (registros.size() - inicio) + " de " + registros.size() + " registros de auditoria:");
        io.listar(registros.subList(inicio, registros.size()), "Nenhum registro.");
    }

    /** Faz o tempo simulado passar. */
    private void passar(Duration duracao) {
        relogio.avancar(duracao);
    }

    private void mostrarHora() {
        io.mensagem("  Relógio simulado: " + Formatador.dataHora(relogio.agora()));
    }

    /** Executa uma ação que deve falhar por regra de negócio e mostra o motivo. */
    private void tentar(String descricao, Runnable acao) {
        try {
            acao.run();
            io.mensagem("  [ATENÇÃO] Era esperada uma falha ao tentar: " + descricao);
        } catch (LanHouseException e) {
            io.mensagem("  [esperado] " + descricao + " -> " + e.getMessage());
        }
    }

    private void mostrarEstoque(String titulo, Produto... produtos) {
        io.mensagem("  " + titulo + ":");
        for (Produto produto : produtos) {
            io.mensagem("    " + ctx.produtoService().buscarPorId(produto.getId()));
        }
    }
}
