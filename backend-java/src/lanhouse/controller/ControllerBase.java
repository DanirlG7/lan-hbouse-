package lanhouse.controller;

import java.util.Locale;
import java.util.Objects;
import java.util.function.Function;

import lanhouse.Contexto;
import lanhouse.model.Funcionario;
import lanhouse.util.ConsoleIO;
import lanhouse.util.TratadorDeErros;

/** Base dos controllers: acesso ao contexto e utilitários de menu e leitura. */
public abstract class ControllerBase {

    protected final Contexto ctx;
    protected final ConsoleIO io;

    protected ControllerBase(Contexto ctx) {
        this.ctx = Objects.requireNonNull(ctx, "ctx");
        this.io = ctx.io();
    }

    protected Funcionario operador() {
        return ctx.operador();
    }

    /** Executa a ação mostrando erros de negócio como mensagem, sem derrubar o programa. */
    protected void executar(String origem, Runnable acao) {
        TratadorDeErros.executar(io, origem, acao);
    }

    /**
     * Mostra um menu numerado (1..n) mais a opção 0 e devolve o número escolhido.
     * Repete a pergunta até a opção ser válida.
     */
    protected int lerOpcao(String titulo, String rotuloZero, String... opcoes) {
        io.titulo(titulo);
        for (int i = 0; i < opcoes.length; i++) {
            io.mensagem("  " + (i + 1) + " - " + opcoes[i]);
        }
        io.mensagem("  0 - " + rotuloZero);
        while (true) {
            int numero = io.lerInteiro("Opção: ");
            if (numero >= 0 && numero <= opcoes.length) {
                return numero;
            }
            io.erro("Opção inválida. Escolha um número de 0 a " + opcoes.length + ".");
        }
    }

    /** Lista os valores de um enum numerados e devolve o escolhido. */
    protected <E extends Enum<E>> E escolherEnum(String pergunta, E[] valores, Function<E, String> rotulo) {
        for (int i = 0; i < valores.length; i++) {
            io.mensagem("  " + (i + 1) + " - " + rotulo.apply(valores[i]));
        }
        while (true) {
            int numero = io.lerInteiro(pergunta);
            if (numero >= 1 && numero <= valores.length) {
                return valores[numero - 1];
            }
            io.erro("Escolha um número de 1 a " + valores.length + ".");
        }
    }

    /** Pergunta s/n. Qualquer resposta diferente de "s" ou "sim" conta como não. */
    protected boolean confirmar(String pergunta) {
        String resposta = io.lerTexto(pergunta + " (s/n): ").toLowerCase(Locale.ROOT);
        return resposta.equals("s") || resposta.equals("sim");
    }
}
