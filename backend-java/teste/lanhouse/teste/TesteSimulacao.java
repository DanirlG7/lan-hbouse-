package lanhouse.teste;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import lanhouse.Contexto;
import lanhouse.model.Funcionario;
import lanhouse.model.ItemConsumacao;
import lanhouse.model.Produto;
import lanhouse.model.Sessao;
import lanhouse.model.StatusComputador;
import lanhouse.simulacao.ComputadorVisual;
import lanhouse.simulacao.ConfiguracaoSimulacao;
import lanhouse.simulacao.EstadoDoMundo;
import lanhouse.simulacao.PersonagemVisual;
import lanhouse.simulacao.ResumoDoDia;
import lanhouse.simulacao.Simulacao;
import lanhouse.tempo.RelogioSimulado;
import lanhouse.util.ConsoleIO;
import lanhouse.util.DadosIniciais;

/** O dia simulado: repetibilidade, regras que nunca podem ser quebradas e dinheiro/estoque que fecham. */
final class TesteSimulacao {

    private TesteSimulacao() {
    }

    /** Um dia rodado do começo ao fim, com tudo que os testes precisam conferir. */
    private static final class Dia {
        final Contexto ctx;
        final RelogioSimulado relogio;
        final Simulacao simulacao;
        final Observador observador;
        final Map<Integer, Integer> estoqueInicial = new HashMap<>();
        ResumoDoDia resumo;

        Dia(ConfiguracaoSimulacao cfg) {
            relogio = new RelogioSimulado(cfg.dia().atStartOfDay());
            ConsoleIO mudo = new ConsoleIO(InputStream.nullInputStream(), new PrintStream(OutputStream.nullOutputStream()));
            ctx = new Contexto(mudo, relogio);
            Funcionario admin = ctx.funcionarioService().autenticar(DadosIniciais.LOGIN_ADMIN, DadosIniciais.SENHA_PADRAO);
            for (Produto p : ctx.produtoService().listar()) {
                estoqueInicial.put(p.getId(), p.getQuantidadeEstoque());
            }
            observador = new Observador(ctx.eventos());
            simulacao = new Simulacao(ctx, relogio, cfg, admin);
        }

        void rodar() {
            resumo = simulacao.executarDiaCompleto();
        }
    }

    static int executar(PrintStream out) {
        Verificador v = new Verificador("Simulação do dia", out);

        long[] sementes = {1, 7, 42, 2026, 31102026};
        for (long semente : sementes) {
            Dia dia = new Dia(ConfiguracaoSimulacao.padrao(semente));
            dia.rodar();
            invariantes(v, "semente " + semente, dia);
        }

        // dia sob estresse: muito movimento, defeitos e estornos frequentes, quase todo mundo novo
        ConfiguracaoSimulacao estresse = new ConfiguracaoSimulacao(99, LocalDate.of(2026, 10, 31),
                LocalTime.of(8, 0), LocalTime.of(22, 30), LocalTime.of(23, 55),
                16.0, 0.9, 0.5, 0.01, 0.9, 0.3);
        Dia dura = new Dia(estresse);
        dura.rodar();
        invariantes(v, "dia sob estresse", dura);
        v.confere("dia sob estresse: houve fila grande e desistências (" + dura.resumo.filaMaxima() + " na fila, "
                + dura.resumo.desistencias() + " desistências)", dura.resumo.filaMaxima() >= 5 && dura.resumo.desistencias() > 0);

        repetibilidade(v);
        retratoDoMundo(v);
        return v.falhas();
    }

    private static void invariantes(Verificador v, String rotulo, Dia dia) {
        ResumoDoDia r = dia.resumo;
        Observador o = dia.observador;
        String p = rotulo + ": ";

        v.confere(p + "nenhuma anomalia (nenhuma operação do roteiro foi recusada)" + detalhe(r.anomalias()),
                r.anomalias().isEmpty());
        v.confere(p + "nenhuma regra quebrada durante o dia" + detalhe(o.violacoes), o.violacoes.isEmpty());
        v.confere(p + "o dia terminou no mesmo dia, às " + dia.relogio.agora().toLocalTime(),
                dia.simulacao.terminou() && dia.relogio.agora().toLocalDate().equals(r.dia()));
        v.confere(p + "houve movimento (" + r.chegadas() + " chegadas, " + r.sessoes() + " sessões)",
                r.chegadas() > 20 && r.sessoes() > 10);

        v.igual(p + "nenhuma sessão ficou ativa", 0, dia.ctx.sessaoService().listarAtivas().size());
        v.igual(p + "o observador também vê todas as sessões fechadas", 0, o.abertasAgora());
        boolean algumEmUso = dia.ctx.computadorService().listar().stream()
                .anyMatch(c -> c.getStatus() == StatusComputador.EM_USO);
        v.confere(p + "nenhum PC ficou em uso", !algumEmUso);

        v.igual(p + "todo cliente que jogou pagou (atendidos = sessões)", r.sessoes(), r.atendidos());
        v.igual(p + "pagamentos confirmados no relatório = atendidos - estornos", r.atendidos() - r.estornos(),
                r.faturamento().pagamentosConfirmados());

        BigDecimal porForma = r.faturamento().faturamentoPorForma().values().stream()
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        BigDecimal porHora = r.porHora().stream().map(ResumoDoDia.LinhaHoraria::faturamento)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        v.valor(p + "faturamento oficial = confirmado - estornado visto pelos eventos",
                o.liquido().toPlainString(), r.faturamento().faturamentoTotal());
        v.valor(p + "faturamento oficial = soma por forma de pagamento", r.faturamento().faturamentoTotal().toPlainString(), porForma);
        v.valor(p + "faturamento oficial = soma da tabela por hora", r.faturamento().faturamentoTotal().toPlainString(), porHora);

        conservacaoDoEstoque(v, p, dia);

        Set<String> cpfs = new HashSet<>();
        v.confere(p + "nenhum CPF repetido entre os clientes",
                dia.ctx.clienteService().listar().stream().allMatch(c -> cpfs.add(c.getCpf())));
    }

    /** estoque final = inicial - consumido + reposto + devolvido nos estornos. */
    private static void conservacaoDoEstoque(Verificador v, String p, Dia dia) {
        Map<Integer, Integer> devolvido = new HashMap<>();
        for (int sessaoId : dia.observador.sessoesComEstoqueDevolvido) {
            Sessao s = dia.ctx.sessaoService().buscarPorId(sessaoId);
            for (ItemConsumacao item : s.getItens()) {
                devolvido.merge(item.getProduto().getId(), item.getQuantidade(), Integer::sum);
            }
        }
        boolean tudoFecha = true;
        boolean nenhumNegativo = true;
        String problema = "";
        for (Produto produto : dia.ctx.produtoService().listar()) {
            int id = produto.getId();
            int esperado = dia.estoqueInicial.get(id) - dia.observador.consumido.getOrDefault(id, 0)
                    + dia.observador.reposto.getOrDefault(id, 0) + devolvido.getOrDefault(id, 0);
            if (esperado != produto.getQuantidadeEstoque()) {
                tudoFecha = false;
                problema = produto.getNome() + ": esperado " + esperado + ", obtido " + produto.getQuantidadeEstoque();
            }
            if (produto.getQuantidadeEstoque() < 0) {
                nenhumNegativo = false;
            }
        }
        v.confere(p + "estoque de todos os produtos fecha (inicial - consumo + reposição + devolução)"
                + (problema.isEmpty() ? "" : " -> " + problema), tudoFecha);
        v.confere(p + "nenhum estoque ficou negativo", nenhumNegativo);
    }

    private static String detalhe(List<String> itens) {
        return itens.isEmpty() ? "" : " -> " + itens.get(0);
    }

    private static void repetibilidade(Verificador v) {
        Dia a = new Dia(ConfiguracaoSimulacao.padrao(2026));
        Dia b = new Dia(ConfiguracaoSimulacao.padrao(2026));
        Dia c = new Dia(ConfiguracaoSimulacao.padrao(2027));
        a.rodar();
        b.rodar();
        c.rodar();
        v.igual("mesma semente: o resumo do dia é idêntico", a.resumo.texto(), b.resumo.texto());
        v.igual("mesma semente: os " + a.observador.linhas.size() + " acontecimentos são idênticos, na mesma ordem",
                a.observador.linhas, b.observador.linhas);
        v.confere("semente diferente: o dia é diferente", !a.resumo.texto().equals(c.resumo.texto()));
    }

    /** O retrato que o front lê precisa ser coerente a cada minuto do dia. */
    private static void retratoDoMundo(Verificador v) {
        Dia dia = new Dia(ConfiguracaoSimulacao.padrao(5));
        int passos = 0;
        int problemas = 0;
        String primeiro = "";
        boolean viuAberto = false;
        boolean viuEncerrado = false;
        while (!dia.simulacao.terminou() && passos++ < 3000) {
            dia.simulacao.avancarPasso();
            EstadoDoMundo e = dia.simulacao.estado();
            String erro = coerencia(e);
            if (erro != null) {
                problemas++;
                if (primeiro.isEmpty()) {
                    primeiro = e.agora() + ": " + erro;
                }
            }
            viuAberto |= e.aberto();
            viuEncerrado |= e.encerrado();
        }
        EstadoDoMundo fim = dia.simulacao.estado();
        v.confere("retrato coerente nos " + passos + " minutos do dia" + (primeiro.isEmpty() ? "" : " -> " + primeiro),
                problemas == 0);
        v.confere("o retrato indica aberto durante o dia e encerrado no fim", viuAberto && viuEncerrado && fim.encerrado());
        v.confere("no fim ninguém está dentro da loja nem usando PC",
                fim.personagens().stream().noneMatch(PersonagemVisual::cliente) && fim.computadoresEmUso() == 0);
        v.recusa("a lista de personagens do retrato é imutável", UnsupportedOperationException.class,
                () -> fim.personagens().add(null));
    }

    private static String coerencia(EstadoDoMundo e) {
        Set<String> ids = new HashSet<>();
        for (PersonagemVisual p : e.personagens()) {
            if (!ids.add(p.id())) {
                return "personagem repetido " + p.id();
            }
        }
        Set<Integer> numeros = new HashSet<>();
        int emUso = 0;
        for (ComputadorVisual pc : e.computadores()) {
            numeros.add(pc.numero());
            boolean usando = pc.status() == StatusComputador.EM_USO;
            if (usando) {
                emUso++;
            }
            if (usando != (pc.usuario() != null)) {
                return "PC " + pc.numero() + " " + pc.status() + " com usuário " + pc.usuario();
            }
        }
        if (emUso != e.computadoresEmUso()) {
            return "contagem de PCs em uso diverge";
        }
        for (PersonagemVisual p : e.personagens()) {
            if (p.computador() != null && !numeros.contains(p.computador())) {
                return p.nome() + " aponta para um PC que não existe";
            }
        }
        return null;
    }
}
