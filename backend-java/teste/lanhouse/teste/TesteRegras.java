package lanhouse.teste;

import java.io.PrintStream;
import java.math.BigDecimal;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import lanhouse.evento.Evento;
import lanhouse.exception.AutenticacaoException;
import lanhouse.exception.ComputadorIndisponivelException;
import lanhouse.exception.DadosInvalidosException;
import lanhouse.exception.EntidadeNaoEncontradaException;
import lanhouse.exception.EstoqueInsuficienteException;
import lanhouse.exception.PagamentoDuplicadoException;
import lanhouse.exception.PagamentoInvalidoException;
import lanhouse.exception.PermissaoNegadaException;
import lanhouse.exception.SessaoInvalidaException;
import lanhouse.model.AreaComputador;
import lanhouse.model.Computador;
import lanhouse.model.FormaPagamento;
import lanhouse.model.Pagamento;
import lanhouse.model.Recepcionista;
import lanhouse.model.Genero;
import lanhouse.model.Relatorio;
import lanhouse.model.Sessao;
import lanhouse.model.Turno;
import lanhouse.tempo.RelogioSimulado;

/** Regras de negócio do enunciado (RN01 a RN10) e das regras acrescentadas no projeto. */
final class TesteRegras {

    private TesteRegras() {
    }

    static int executar(PrintStream out) {
        Verificador v = new Verificador("Regras de negócio", out);
        cobranca(v);
        cadastroDeComputadores(v);
        pixEArredondamento(v);
        computadorIndisponivel(v);
        sessaoEncerradaDuasVezes(v);
        ciclosDoPagamento(v);
        permissoes(v);
        estoqueEEstorno(v);
        relatorioSoConfirmados(v);
        autenticacao(v);
        valoresCongelados(v);
        cadastroValidacoes(v);
        buscasInexistentes(v);
        operacaoRecusadaNaoPublicaEvento(v);
        relogio(v);
        return v.falhas();
    }

    /** RN03/RN04: minuto iniciado conta inteiro, mínimo de 1 minuto, tarifa por hora. */
    private static void cobranca(Verificador v) {
        Mundo m = new Mundo();
        Sessao a = m.jogar(1, 1, Duration.ofSeconds(59));
        v.igual("59 segundos cobram 1 minuto", 1L, a.getMinutosCobrados());
        v.valor("59 segundos custam", "0.10", a.getValorTempo());

        Sessao b = m.jogar(2, 2, Duration.ofSeconds(61));
        v.igual("61 segundos cobram 2 minutos", 2L, b.getMinutosCobrados());
        v.valor("61 segundos custam", "0.20", b.getValorTempo());

        Sessao c = m.jogar(3, 3, Duration.ofMinutes(60));
        v.igual("1 hora exata cobra 60 minutos", 60L, c.getMinutosCobrados());
        v.valor("1 hora na área comum custa", "6.00", c.getValorTempo());

        Sessao d = m.jogar(4, 4, Duration.ofMinutes(85));
        v.valor("85 minutos na área comum custam", "8.50", d.getValorTempo());

        Sessao e = m.jogar(5, 9, Duration.ofMinutes(130));
        v.valor("130 minutos na área VIP custam (21,666... arredonda para cima)", "21.67", e.getValorTempo());

        Sessao f = m.jogar(6, 5, Duration.ZERO);
        v.igual("sessão de zero segundos cobra o mínimo de 1 minuto", 1L, f.getMinutosCobrados());
    }

    /** RF03 (cadastrar computador) e RN10 (só quem tem permissão altera tarifas). */
    private static void cadastroDeComputadores(Verificador v) {
        Mundo m = new Mundo();
        List<Evento> eventos = new ArrayList<>();
        m.ctx.eventos().inscrever(eventos::add);

        Computador padrao = m.ctx.computadorService().cadastrar(m.admin, 13, AreaComputador.VIP, null);
        v.valor("sem informar tarifa vale a padrão da área VIP", "10.00", padrao.getTarifaHora());
        Computador especial = m.ctx.computadorService().cadastrar(m.admin, 14, AreaComputador.COMUM, new BigDecimal("7.5"));
        v.valor("tarifa informada é normalizada para 2 casas", "7.50", especial.getTarifaHora());
        v.igual("os PCs novos aparecem na listagem", 14, m.ctx.computadorService().listar().size());
        v.confere("PC novo nasce disponível", m.ctx.computadorService().buscarPorNumero(13).isDisponivel());

        v.recusa("número de PC repetido", DadosInvalidosException.class,
                () -> m.ctx.computadorService().cadastrar(m.admin, 13, AreaComputador.COMUM, null));
        v.recusa("número de PC zero", DadosInvalidosException.class,
                () -> m.ctx.computadorService().cadastrar(m.admin, 0, AreaComputador.COMUM, null));
        v.recusa("tarifa negativa", DadosInvalidosException.class,
                () -> m.ctx.computadorService().cadastrar(m.admin, 15, AreaComputador.COMUM, new BigDecimal("-1")));
        v.recusa("PC sem área", RuntimeException.class,
                () -> m.ctx.computadorService().cadastrar(m.admin, 15, null, null));
        v.recusa("RN10: recepcionista não cadastra PC", PermissaoNegadaException.class,
                () -> m.ctx.computadorService().cadastrar(m.recepcao, 15, AreaComputador.COMUM, null));
        v.recusa("RN10: recepcionista não altera tarifa", PermissaoNegadaException.class,
                () -> m.ctx.computadorService().alterarTarifa(m.recepcao, 1, new BigDecimal("1.00")));
        v.recusa("RN10: suporte técnico não altera tarifa", PermissaoNegadaException.class,
                () -> m.ctx.computadorService().alterarTarifa(m.suporte, 1, new BigDecimal("1.00")));
        v.recusa("alterar tarifa de PC inexistente", EntidadeNaoEncontradaException.class,
                () -> m.ctx.computadorService().alterarTarifa(m.admin, 99, new BigDecimal("5.00")));
        v.recusa("tarifa zero", DadosInvalidosException.class,
                () -> m.ctx.computadorService().alterarTarifa(m.admin, 1, BigDecimal.ZERO));

        Sessao jogando = m.abrir(1, 1);
        m.ctx.computadorService().alterarTarifa(m.admin, 1, new BigDecimal("9.00"));
        m.passar(Duration.ofMinutes(60));
        m.encerrar(jogando);
        v.valor("quem já estava jogando mantém a tarifa com que começou", "6.00", jogando.getValorTempo());
        v.valor("a sessão seguinte usa a tarifa nova", "9.00", m.jogar(2, 1, Duration.ofMinutes(60)).getValorTempo());

        long cadastrados = eventos.stream().filter(e -> e instanceof Evento.ComputadorCadastrado).count();
        long alteradas = eventos.stream().filter(e -> e instanceof Evento.TarifaAlterada).count();
        v.confere("2 eventos de cadastro e 1 de tarifa (as recusas não publicam)", cadastrados == 2 && alteradas == 1);
    }

    private static void pixEArredondamento(Verificador v) {
        Mundo m = new Mundo();
        Sessao s = m.abrir(1, 1);
        m.ctx.sessaoService().registrarConsumo(m.recepcao, s.getId(), m.produto("Barras de Chocolate").getId(), 2);
        m.ctx.sessaoService().registrarConsumo(m.recepcao, s.getId(), m.produto("Refrigerantes").getId(), 1);
        m.passar(Duration.ofMinutes(85));
        m.encerrar(s);
        v.valor("produtos: 2 x 4,50 + 6,00", "15.00", s.getValorProdutos());
        v.valor("total bruto = tempo 8,50 + produtos 15,00", "23.50", s.getValorBruto());

        Pagamento pix = m.ctx.pagamentoService().registrar(m.recepcao, s.getId(), FormaPagamento.PIX);
        v.valor("Pix paga 95% (22,325 arredonda para 22,33)", "22.33", pix.getValorTotal());
        v.valor("desconto do Pix", "1.17", pix.getDesconto());

        for (FormaPagamento forma : new FormaPagamento[]{FormaPagamento.DINHEIRO, FormaPagamento.DEBITO,
                FormaPagamento.CREDITO}) {
            Mundo mx = new Mundo();
            Sessao sx = mx.jogar(1, 1, Duration.ofMinutes(85));
            Pagamento p = mx.ctx.pagamentoService().registrar(mx.recepcao, sx.getId(), forma);
            v.valor(forma.getDescricao() + " paga o valor integral", "8.50", p.getValorTotal());
        }
    }

    /** RN01 e RN05. */
    private static void computadorIndisponivel(Verificador v) {
        Mundo m = new Mundo();
        m.abrir(1, 1);
        v.recusa("RN01: PC ocupado não recebe nova sessão", ComputadorIndisponivelException.class,
                () -> m.abrir(2, 1));
        m.ctx.computadorService().enviarParaManutencao(m.suporte, 2);
        v.recusa("RN05: PC em manutenção não recebe sessão", ComputadorIndisponivelException.class,
                () -> m.abrir(3, 2));
        v.recusa("PC em uso não vai para manutenção", ComputadorIndisponivelException.class,
                () -> m.ctx.computadorService().enviarParaManutencao(m.suporte, 1));
        m.ctx.computadorService().concluirManutencao(m.suporte, 2);
        v.confere("depois da manutenção o PC volta a aceitar sessão", m.abrir(3, 2) != null);
        v.confere("PCs disponíveis não incluem os ocupados",
                m.ctx.computadorService().listarDisponiveis().stream().noneMatch(c -> c.getNumero() == 1));
    }

    /** RN07. */
    private static void sessaoEncerradaDuasVezes(Verificador v) {
        Mundo m = new Mundo();
        Sessao s = m.jogar(1, 1, Duration.ofMinutes(10));
        v.recusa("RN07: sessão encerrada não encerra de novo", SessaoInvalidaException.class,
                () -> m.encerrar(s));
        v.recusa("sessão encerrada não aceita consumo", SessaoInvalidaException.class,
                () -> m.ctx.sessaoService().registrarConsumo(m.recepcao, s.getId(), m.produto("Café").getId(), 1));
        v.confere("o PC foi liberado uma única vez e está disponível",
                m.ctx.computadorService().buscarPorNumero(1).isDisponivel());
    }

    /** RN06 e RN08, mais as transições de status. */
    private static void ciclosDoPagamento(Verificador v) {
        Mundo m = new Mundo();
        Sessao ativa = m.abrir(1, 1);
        v.recusa("RN06: não paga sessão ainda ativa", PagamentoInvalidoException.class,
                () -> m.ctx.pagamentoService().registrar(m.recepcao, ativa.getId(), FormaPagamento.PIX));
        v.recusa("RN06: não paga sessão inexistente", EntidadeNaoEncontradaException.class,
                () -> m.ctx.pagamentoService().registrar(m.recepcao, 999, FormaPagamento.PIX));

        m.passar(Duration.ofMinutes(30));
        m.encerrar(ativa);
        Pagamento p = m.ctx.pagamentoService().registrar(m.recepcao, ativa.getId(), FormaPagamento.DINHEIRO);
        v.recusa("RN08: segundo pagamento ativo na mesma sessão", PagamentoDuplicadoException.class,
                () -> m.ctx.pagamentoService().registrar(m.recepcao, ativa.getId(), FormaPagamento.PIX));
        v.recusa("pagamento pendente não pode ser estornado", PagamentoInvalidoException.class,
                () -> m.ctx.pagamentoService().estornar(m.admin, p.getId()));

        m.ctx.pagamentoService().confirmar(m.recepcao, p.getId());
        v.recusa("pagamento confirmado não confirma de novo", PagamentoInvalidoException.class,
                () -> m.ctx.pagamentoService().confirmar(m.recepcao, p.getId()));
        v.recusa("RN08: confirmado também bloqueia novo pagamento", PagamentoDuplicadoException.class,
                () -> m.ctx.pagamentoService().registrar(m.recepcao, ativa.getId(), FormaPagamento.PIX));

        m.ctx.pagamentoService().estornar(m.admin, p.getId());
        v.recusa("pagamento estornado não estorna de novo", PagamentoInvalidoException.class,
                () -> m.ctx.pagamentoService().estornar(m.admin, p.getId()));
        Pagamento novo = m.ctx.pagamentoService().registrar(m.recepcao, ativa.getId(), FormaPagamento.PIX);
        v.confere("depois do estorno é permitido pagar de novo", novo.getId() != p.getId());
        v.igual("a sessão passa a ter 2 pagamentos no histórico", 2, m.ctx.pagamentoService().listarPorSessao(ativa.getId()).size());
    }

    /** RN10 e o controle de acesso por cargo. */
    private static void permissoes(Verificador v) {
        Mundo m = new Mundo();
        Sessao s = m.jogar(1, 1, Duration.ofMinutes(10));
        Pagamento p = m.ctx.pagamentoService().registrar(m.recepcao, s.getId(), FormaPagamento.PIX);
        m.ctx.pagamentoService().confirmar(m.recepcao, p.getId());

        v.recusa("recepcionista não estorna", PermissaoNegadaException.class,
                () -> m.ctx.pagamentoService().estornar(m.recepcao, p.getId()));
        v.recusa("recepcionista não cadastra funcionário", PermissaoNegadaException.class,
                () -> m.ctx.funcionarioService().cadastrar(m.recepcao,
                        id -> new Recepcionista(id, "Teste Silva", "teste.silva", "senha123", Genero.FEMININO, Turno.TURNO_1)));
        v.recusa("recepcionista não gera relatório", PermissaoNegadaException.class,
                () -> m.ctx.relatorioService().gerar(m.recepcao, m.relogio.hoje(), m.relogio.hoje()));
        v.recusa("recepcionista não vê a auditoria", PermissaoNegadaException.class,
                () -> m.ctx.relatorioService().auditoria(m.recepcao));
        v.recusa("recepcionista não manda PC para manutenção", PermissaoNegadaException.class,
                () -> m.ctx.computadorService().enviarParaManutencao(m.recepcao, 3));
        v.recusa("recepcionista não repõe estoque", PermissaoNegadaException.class,
                () -> m.ctx.produtoService().reabastecer(m.recepcao, 1, 5));
        v.recusa("suporte técnico não abre sessão", PermissaoNegadaException.class,
                () -> m.ctx.sessaoService().iniciar(m.suporte, 2, 3));
        v.recusa("limpeza não abre sessão", PermissaoNegadaException.class,
                () -> m.ctx.sessaoService().iniciar(m.limpeza, 2, 3));
        v.recusa("operador nulo é recusado", PermissaoNegadaException.class,
                () -> m.ctx.sessaoService().iniciar(null, 2, 3));
        v.confere("limpeza pode mandar PC para manutenção/limpeza",
                m.ctx.computadorService().enviarParaManutencao(m.limpeza, 4) != null);
        v.confere("administrador pode estornar", m.ctx.pagamentoService().estornar(m.admin, p.getId()) != null);
        v.confere("administrador gera relatório", m.ctx.relatorioService().gerar(m.admin, m.relogio.hoje(), m.relogio.hoje()) != null);
    }

    private static void estoqueEEstorno(Verificador v) {
        Mundo m = new Mundo();
        List<Evento.PagamentoEstornado> estornos = new ArrayList<>();
        m.ctx.eventos().inscrever(Evento.PagamentoEstornado.class, estornos::add);

        v.igual("estoque inicial de chocolate", 50, m.estoque("Barras de Chocolate"));
        Sessao s = m.abrir(1, 1);
        int chocolate = m.produto("Barras de Chocolate").getId();
        m.ctx.sessaoService().registrarConsumo(m.recepcao, s.getId(), chocolate, 2);
        v.igual("consumo baixa o estoque", 48, m.estoque("Barras de Chocolate"));

        v.recusa("estoque insuficiente é recusado", EstoqueInsuficienteException.class,
                () -> m.ctx.sessaoService().registrarConsumo(m.recepcao, s.getId(), chocolate, 9999));
        v.igual("consumo recusado não mexe no estoque", 48, m.estoque("Barras de Chocolate"));
        v.igual("consumo recusado não cria item na sessão", 1, s.getItens().size());

        m.passar(Duration.ofMinutes(20));
        m.encerrar(s);
        Pagamento p1 = m.ctx.pagamentoService().registrar(m.recepcao, s.getId(), FormaPagamento.PIX);
        m.ctx.pagamentoService().confirmar(m.recepcao, p1.getId());
        m.ctx.pagamentoService().estornar(m.admin, p1.getId());
        v.igual("estorno devolve o estoque", 50, m.estoque("Barras de Chocolate"));

        Pagamento p2 = m.ctx.pagamentoService().registrar(m.recepcao, s.getId(), FormaPagamento.DINHEIRO);
        v.igual("novo pagamento depois do estorno não baixa estoque de novo", 50, m.estoque("Barras de Chocolate"));
        m.ctx.pagamentoService().confirmar(m.recepcao, p2.getId());
        m.ctx.pagamentoService().estornar(m.admin, p2.getId());
        v.igual("segundo estorno da mesma sessão NÃO devolve de novo", 50, m.estoque("Barras de Chocolate"));
        v.confere("evento do 1º estorno marca estoque devolvido", estornos.size() == 2 && estornos.get(0).estoqueDevolvido());
        v.confere("evento do 2º estorno marca que não devolveu", estornos.size() == 2 && !estornos.get(1).estoqueDevolvido());
    }

    /** RN09. */
    private static void relatorioSoConfirmados(Verificador v) {
        Mundo m = new Mundo();
        Sessao a = m.jogar(1, 1, Duration.ofMinutes(30));
        Sessao b = m.jogar(2, 2, Duration.ofMinutes(30));
        Sessao c = m.jogar(3, 3, Duration.ofMinutes(30));
        Sessao d = m.jogar(4, 4, Duration.ofMinutes(30));
        m.encerrar(m.abrir(5, 5)); // sessão sem pagamento nenhum

        Pagamento pa = m.ctx.pagamentoService().registrar(m.recepcao, a.getId(), FormaPagamento.DINHEIRO);
        m.ctx.pagamentoService().confirmar(m.recepcao, pa.getId());
        m.ctx.pagamentoService().registrar(m.recepcao, b.getId(), FormaPagamento.PIX); // fica pendente
        Pagamento pc = m.ctx.pagamentoService().registrar(m.recepcao, c.getId(), FormaPagamento.DEBITO);
        m.ctx.pagamentoService().confirmar(m.recepcao, pc.getId());
        m.ctx.pagamentoService().estornar(m.admin, pc.getId()); // confirmado e depois estornado
        Pagamento pd = m.ctx.pagamentoService().registrar(m.recepcao, d.getId(), FormaPagamento.PIX);
        m.ctx.pagamentoService().confirmar(m.recepcao, pd.getId());

        Relatorio r = m.ctx.relatorioService().gerar(m.admin, m.relogio.hoje(), m.relogio.hoje());
        v.igual("RN09: só 2 pagamentos entram (pendente e estornado ficam de fora)", 2, r.pagamentosConfirmados());
        v.valor("total = dinheiro 3,00 + Pix 2,85 (3,00 com 5% de desconto)", "5.85", r.faturamentoTotal());
        v.valor("por forma: dinheiro", "3.00", r.faturamentoPorForma().get(FormaPagamento.DINHEIRO));
        v.valor("por forma: Pix", "2.85", r.faturamentoPorForma().get(FormaPagamento.PIX));
        v.valor("por forma: débito (estornado) fica zerado", "0.00", r.faturamentoPorForma().get(FormaPagamento.DEBITO));

        LocalDateTime amanha = m.relogio.agora().plusDays(1);
        Relatorio vazio = m.ctx.relatorioService().gerar(m.admin, amanha.toLocalDate(), amanha.toLocalDate());
        v.valor("período sem pagamentos fatura zero", "0.00", vazio.faturamentoTotal());
        v.recusa("data inicial depois da final é recusada", DadosInvalidosException.class,
                () -> m.ctx.relatorioService().gerar(m.admin, amanha.toLocalDate(), m.relogio.hoje()));
    }

    private static void autenticacao(Verificador v) {
        Mundo m = new Mundo();
        v.recusa("senha errada", AutenticacaoException.class,
                () -> m.ctx.funcionarioService().autenticar("carlos.lima", "errada"));
        v.recusa("login inexistente", AutenticacaoException.class,
                () -> m.ctx.funcionarioService().autenticar("fantasma", "Lan@House2026"));
        String msg1 = mensagem(() -> m.ctx.funcionarioService().autenticar("carlos.lima", "errada"));
        String msg2 = mensagem(() -> m.ctx.funcionarioService().autenticar("fantasma", "qualquer"));
        v.confere("a mensagem não revela se o login existe", msg1 != null && msg1.equals(msg2));
        v.confere("login não diferencia maiúsculas", m.ctx.funcionarioService()
                .autenticar("CARLOS.LIMA", "Lan@House2026") != null);
        v.confere("a senha não aparece no toString do funcionário", !m.admin.toString().contains("Lan@House2026"));
    }

    private static String mensagem(Runnable acao) {
        try {
            acao.run();
            return null;
        } catch (RuntimeException e) {
            return e.getMessage();
        }
    }

    /** Tarifa da sessão e preço do item não mudam depois de lançados. */
    private static void valoresCongelados(Verificador v) {
        Mundo m = new Mundo();
        Sessao s = m.abrir(1, 3);
        m.ctx.computadorService().buscarPorNumero(3).alterarTarifa(new BigDecimal("20.00"));
        m.passar(Duration.ofMinutes(60));
        m.encerrar(s);
        v.valor("mudar a tarifa durante a sessão não afeta ela", "6.00", s.getValorTempo());
        Sessao nova = m.jogar(2, 3, Duration.ofMinutes(60));
        v.valor("a sessão seguinte já usa a tarifa nova", "20.00", nova.getValorTempo());

        Mundo p = new Mundo();
        Sessao sp = p.abrir(1, 1);
        int cafe = p.produto("Café").getId();
        p.ctx.sessaoService().registrarConsumo(p.recepcao, sp.getId(), cafe, 1);
        p.ctx.produtoService().atualizarPreco(p.admin, cafe, new BigDecimal("5.00"));
        p.ctx.sessaoService().registrarConsumo(p.recepcao, sp.getId(), cafe, 1);
        v.valor("item lançado antes do reajuste mantém o preço", "3.50", sp.getItens().get(0).getSubtotal());
        v.valor("item lançado depois usa o preço novo", "5.00", sp.getItens().get(1).getSubtotal());
    }

    private static void cadastroValidacoes(Verificador v) {
        Mundo m = new Mundo();
        v.recusa("CPF com dígito verificador errado", DadosInvalidosException.class,
                () -> m.ctx.clienteService().cadastrar(m.recepcao, "Maria Silva", "11999998888", "529.982.247-24"));
        v.recusa("CPF com todos os dígitos iguais", DadosInvalidosException.class,
                () -> m.ctx.clienteService().cadastrar(m.recepcao, "Maria Silva", "11999998888", "111.111.111-11"));
        v.recusa("telefone curto demais", DadosInvalidosException.class,
                () -> m.ctx.clienteService().cadastrar(m.recepcao, "Maria Silva", "9999", "529.982.247-25"));
        v.recusa("nome com número", DadosInvalidosException.class,
                () -> m.ctx.clienteService().cadastrar(m.recepcao, "Maria 2", "11999998888", "529.982.247-25"));
        v.confere("cadastro válido funciona e guarda só os dígitos do CPF",
                m.ctx.clienteService().cadastrar(m.recepcao, "Maria Silva", "(11) 99999-8888", "529.982.247-25")
                        .getCpf().equals("52998224725"));
        v.recusa("CPF repetido (mesmo escrito de outro jeito) é recusado", DadosInvalidosException.class,
                () -> m.ctx.clienteService().cadastrar(m.recepcao, "Outra Pessoa", "11988887777", "52998224725"));
        v.recusa("produto com nome repetido", DadosInvalidosException.class,
                () -> m.ctx.produtoService().cadastrar(m.admin, "café", new BigDecimal("3.00"), 5));
        v.recusa("produto com preço zero", DadosInvalidosException.class,
                () -> m.ctx.produtoService().cadastrar(m.admin, "Água", BigDecimal.ZERO, 5));
    }

    private static void buscasInexistentes(Verificador v) {
        Mundo m = new Mundo();
        v.recusa("cliente inexistente", EntidadeNaoEncontradaException.class, () -> m.abrir(999, 1));
        v.recusa("computador inexistente", EntidadeNaoEncontradaException.class, () -> m.abrir(1, 99));
        v.recusa("pagamento inexistente", EntidadeNaoEncontradaException.class,
                () -> m.ctx.pagamentoService().confirmar(m.recepcao, 999));
        v.recusa("sessão inexistente", EntidadeNaoEncontradaException.class,
                () -> m.ctx.sessaoService().encerrar(m.recepcao, 999));
    }

    /** Evento só existe para fato que aconteceu: operação recusada não publica nada. */
    private static void operacaoRecusadaNaoPublicaEvento(Verificador v) {
        Mundo m = new Mundo();
        Sessao s = m.jogar(1, 1, Duration.ofMinutes(5));
        Pagamento p = m.ctx.pagamentoService().registrar(m.recepcao, s.getId(), FormaPagamento.PIX);
        m.ctx.pagamentoService().confirmar(m.recepcao, p.getId());
        m.abrir(2, 2);

        int[] contagem = {0};
        m.ctx.eventos().inscrever(e -> contagem[0]++);
        try { m.abrir(3, 2); } catch (RuntimeException ignorado) { }
        try { m.ctx.sessaoService().registrarConsumo(m.recepcao, s.getId(), 1, 1); } catch (RuntimeException ignorado) { }
        try { m.ctx.pagamentoService().registrar(m.recepcao, s.getId(), FormaPagamento.PIX); } catch (RuntimeException ignorado) { }
        try { m.ctx.pagamentoService().confirmar(m.recepcao, p.getId()); } catch (RuntimeException ignorado) { }
        try { m.ctx.pagamentoService().estornar(m.recepcao, p.getId()); } catch (RuntimeException ignorado) { }
        try { m.ctx.computadorService().enviarParaManutencao(m.recepcao, 5); } catch (RuntimeException ignorado) { }
        v.igual("6 operações recusadas publicaram 0 eventos", 0, contagem[0]);
    }

    private static void relogio(Verificador v) {
        RelogioSimulado r = new RelogioSimulado(LocalDateTime.of(2026, 1, 1, 10, 0));
        r.avancar(Duration.ofMinutes(5));
        v.igual("relógio avança", LocalDateTime.of(2026, 1, 1, 10, 5), r.agora());
        v.recusa("relógio não aceita duração negativa", DadosInvalidosException.class,
                () -> r.avancar(Duration.ofMinutes(-1)));
        v.recusa("relógio não volta no tempo", DadosInvalidosException.class,
                () -> r.avancarPara(LocalDateTime.of(2026, 1, 1, 9, 0)));
        v.igual("o relógio continua onde estava depois das recusas", LocalDateTime.of(2026, 1, 1, 10, 5), r.agora());
    }
}
