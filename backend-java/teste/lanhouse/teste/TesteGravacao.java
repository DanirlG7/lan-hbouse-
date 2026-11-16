package lanhouse.teste;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Proxy;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.IdentityHashMap;
import java.util.List;
import java.util.Map;

import lanhouse.Contexto;
import lanhouse.demo.Demonstracao;
import lanhouse.model.Cliente;
import lanhouse.model.Computador;
import lanhouse.model.Funcionario;
import lanhouse.model.ItemConsumacao;
import lanhouse.model.Pagamento;
import lanhouse.model.Produto;
import lanhouse.model.Sessao;
import lanhouse.repository.ClienteRepository;
import lanhouse.repository.ComputadorRepository;
import lanhouse.repository.FuncionarioRepository;
import lanhouse.repository.PagamentoRepository;
import lanhouse.repository.ProdutoRepository;
import lanhouse.repository.Repositorios;
import lanhouse.repository.SessaoRepository;
import lanhouse.repository.memoria.RepositoriosMemoria;
import lanhouse.simulacao.ConfiguracaoSimulacao;
import lanhouse.simulacao.Simulacao;
import lanhouse.tempo.RelogioSimulado;
import lanhouse.util.ConsoleIO;
import lanhouse.util.DadosIniciais;

/**
 * Garante que todo objeto alterado é gravado no repositório (condição para trocar a memória por
 * um banco). Um espião em cada repositório guarda uma "impressão digital" do objeto a cada
 * gravação; a cada evento publicado, confere se algum objeto do sistema mudou sem ser gravado.
 */
final class TesteGravacao {

    private final Map<Object, String> gravado = new IdentityHashMap<>();
    private Repositorios reais;
    private int gravacoes;
    private int violacoes;
    private final List<String> detalhes = new ArrayList<>();

    private TesteGravacao() {
    }

    static int executar(PrintStream out) {
        Verificador v = new Verificador("Gravação nos repositórios (pronto para banco de dados)", out);

        TesteGravacao demo = new TesteGravacao();
        demo.rodarDemonstracao();
        v.confere("demonstração completa: " + demo.gravacoes + " gravações, nenhuma alteração ficou sem gravar"
                + demo.resumoDasViolacoes(), demo.violacoes == 0);

        TesteGravacao dia = new TesteGravacao();
        dia.rodarDiaSimulado();
        v.confere("dia simulado inteiro: " + dia.gravacoes + " gravações, nenhuma alteração ficou sem gravar"
                + dia.resumoDasViolacoes(), dia.violacoes == 0);

        demo.reais.produtos().buscarPorId(1).orElseThrow().reabastecer(7); // altera SEM gravar
        v.confere("controle positivo: o detector acusa uma alteração feita sem gravar",
                demo.sujos().stream().anyMatch(s -> s.startsWith("ALTERADO SEM GRAVAR: gravado=P1|")));
        return v.falhas();
    }

    private String resumoDasViolacoes() {
        return violacoes == 0 ? "" : " -> " + detalhes.get(0);
    }

    // ------------------------------------------------------------------ cenários

    private Contexto criarContexto(RelogioSimulado relogio) {
        reais = RepositoriosMemoria.criar();
        Repositorios espioes = new Repositorios(
                espiao(FuncionarioRepository.class, reais.funcionarios()),
                espiao(ClienteRepository.class, reais.clientes()),
                espiao(ComputadorRepository.class, reais.computadores()),
                espiao(ProdutoRepository.class, reais.produtos()),
                espiao(SessaoRepository.class, reais.sessoes()),
                espiao(PagamentoRepository.class, reais.pagamentos()));
        ConsoleIO mudo = new ConsoleIO(InputStream.nullInputStream(), new PrintStream(OutputStream.nullOutputStream()));
        Contexto ctx = new Contexto(mudo, relogio, espioes);
        conferir("logo após a carga inicial");
        ctx.eventos().inscrever(e -> conferir("ao publicar " + e.getClass().getSimpleName()));
        return ctx;
    }

    private void rodarDemonstracao() {
        RelogioSimulado relogio = new RelogioSimulado(Demonstracao.INICIO_PADRAO);
        Contexto ctx = criarContexto(relogio);
        new Demonstracao(ctx, relogio).executar();
        Funcionario admin = ctx.funcionarioService().autenticar(DadosIniciais.LOGIN_ADMIN, DadosIniciais.SENHA_PADRAO);
        // operações que não publicam evento: conferir logo depois de cada uma
        ctx.clienteService().atualizar(admin, 1, "Ana Beatriz M. Souza", "11911112222");
        conferir("depois de atualizar cliente");
        ctx.produtoService().atualizarPreco(admin, 1, new BigDecimal("5.00"));
        conferir("depois de atualizar preço");
        ctx.produtoService().cadastrar(admin, "Água", new BigDecimal("3.00"), 30);
        conferir("depois de cadastrar produto");
        ctx.computadorService().cadastrar(admin, 20, lanhouse.model.AreaComputador.COMUM, null);
        conferir("depois de cadastrar computador");
        ctx.computadorService().alterarTarifa(admin, 20, new BigDecimal("8.00"));
        conferir("depois de alterar tarifa");
        conferir("fim");
    }

    private void rodarDiaSimulado() {
        RelogioSimulado relogio = new RelogioSimulado(java.time.LocalDateTime.of(2026, 10, 31, 0, 0));
        Contexto ctx = criarContexto(relogio);
        Funcionario admin = ctx.funcionarioService().autenticar(DadosIniciais.LOGIN_ADMIN, DadosIniciais.SENHA_PADRAO);
        new Simulacao(ctx, relogio, ConfiguracaoSimulacao.padrao(11), admin).executarDiaCompleto();
        conferir("fim do dia");
    }

    // ------------------------------------------------------------------ detector

    private static String impressao(Object o) {
        if (o instanceof Cliente c) {
            return "C" + c.getId() + "|" + c.getNome() + "|" + c.getTelefone();
        }
        if (o instanceof Computador c) {
            return "PC" + c.getNumero() + "|" + c.getStatus() + "|" + c.getTarifaHora();
        }
        if (o instanceof Produto p) {
            return "P" + p.getId() + "|" + p.getPreco() + "|" + p.getQuantidadeEstoque();
        }
        if (o instanceof Funcionario f) {
            return "F" + f.getId();
        }
        if (o instanceof Sessao s) {
            StringBuilder itens = new StringBuilder();
            for (ItemConsumacao i : s.getItens()) {
                itens.append(i.getProduto().getId()).append('x').append(i.getQuantidade())
                        .append('@').append(i.getPrecoUnitario()).append(',');
            }
            return "S" + s.getId() + "|" + s.getStatus() + "|" + s.getFim() + "|"
                    + (s.getOperadorEncerramento() == null ? "-" : s.getOperadorEncerramento().getId())
                    + "|" + s.isEstoqueDevolvido() + "|" + itens;
        }
        if (o instanceof Pagamento p) {
            return "G" + p.getId() + "|" + p.getStatus() + "|"
                    + (p.getConfirmadoPor() == null ? "-" : p.getConfirmadoPor().getId()) + "|" + p.getDataConfirmacao()
                    + "|" + (p.getEstornadoPor() == null ? "-" : p.getEstornadoPor().getId()) + "|" + p.getDataEstorno();
        }
        throw new IllegalArgumentException(o.getClass().getName());
    }

    @SuppressWarnings("unchecked")
    private <R> R espiao(Class<R> interfaceDoRepositorio, R real) {
        return (R) Proxy.newProxyInstance(interfaceDoRepositorio.getClassLoader(),
                new Class<?>[]{interfaceDoRepositorio}, (proxy, metodo, args) -> {
                    try {
                        Object resultado = metodo.invoke(real, args);
                        boolean grava = metodo.getName().equals("salvar")
                                || (metodo.getName().startsWith("inserirSe") && Boolean.TRUE.equals(resultado));
                        if (grava) {
                            gravado.put(args[0], impressao(args[0]));
                            gravacoes++;
                        }
                        return resultado;
                    } catch (InvocationTargetException e) {
                        throw e.getCause();
                    }
                });
    }

    private List<String> sujos() {
        List<Object> todos = new ArrayList<>();
        todos.addAll(reais.funcionarios().listarTodos());
        todos.addAll(reais.clientes().listarTodos());
        todos.addAll(reais.computadores().listarTodos());
        todos.addAll(reais.produtos().listarTodos());
        todos.addAll(reais.sessoes().listarTodos());
        todos.addAll(reais.pagamentos().listarTodos());
        List<String> resultado = new ArrayList<>();
        for (Object o : todos) {
            String salvo = gravado.get(o);
            if (salvo == null) {
                resultado.add("NUNCA GRAVADO: " + impressao(o));
            } else if (!salvo.equals(impressao(o))) {
                resultado.add("ALTERADO SEM GRAVAR: gravado=" + salvo + " atual=" + impressao(o));
            }
        }
        return resultado;
    }

    private void conferir(String quando) {
        List<String> sujos = sujos();
        if (!sujos.isEmpty()) {
            violacoes++;
            detalhes.add(quando + " -> " + sujos.get(0));
        }
    }
}
