package lanhouse.teste;

import java.io.InputStream;
import java.io.OutputStream;
import java.io.PrintStream;
import java.time.Duration;
import java.time.LocalDateTime;

import lanhouse.Contexto;
import lanhouse.model.Funcionario;
import lanhouse.model.Produto;
import lanhouse.model.Sessao;
import lanhouse.tempo.RelogioSimulado;
import lanhouse.util.ConsoleIO;
import lanhouse.util.DadosIniciais;

/** Um sistema novo, com os dados iniciais e o relógio parado às 10h, para cada teste de regra. */
final class Mundo {

    final RelogioSimulado relogio;
    final Contexto ctx;
    final Funcionario admin;
    final Funcionario recepcao;
    final Funcionario suporte;
    final Funcionario limpeza;

    Mundo() {
        relogio = new RelogioSimulado(LocalDateTime.of(2026, 10, 31, 10, 0));
        ConsoleIO mudo = new ConsoleIO(InputStream.nullInputStream(), new PrintStream(OutputStream.nullOutputStream()));
        ctx = new Contexto(mudo, relogio);
        admin = entrar("carlos.lima");
        recepcao = entrar("fernanda.oliveira");
        suporte = entrar("bruno.alves");
        limpeza = entrar("patricia.gomes");
    }

    private Funcionario entrar(String login) {
        return ctx.funcionarioService().autenticar(login, DadosIniciais.SENHA_PADRAO);
    }

    Sessao abrir(int clienteId, int pc) {
        return ctx.sessaoService().iniciar(recepcao, clienteId, pc);
    }

    Sessao encerrar(Sessao sessao) {
        return ctx.sessaoService().encerrar(recepcao, sessao.getId());
    }

    void passar(Duration duracao) {
        relogio.avancar(duracao);
    }

    /** Abre, deixa o tempo passar e encerra. */
    Sessao jogar(int clienteId, int pc, Duration duracao) {
        Sessao sessao = abrir(clienteId, pc);
        passar(duracao);
        return encerrar(sessao);
    }

    Produto produto(String nome) {
        return ctx.produtoService().buscarPorNome(nome);
    }

    int estoque(String nome) {
        return produto(nome).getQuantidadeEstoque();
    }
}
