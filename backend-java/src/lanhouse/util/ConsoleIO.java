package lanhouse.util;

import java.io.BufferedReader;
import java.io.Console;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.PrintStream;
import java.io.UncheckedIOException;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.format.ResolverStyle;
import java.util.Collection;
import java.util.regex.Pattern;

import lanhouse.exception.EntradaEncerradaException;

/**
 * Entrada e saída do console. Todos os métodos de leitura repetem a pergunta até receber um
 * valor válido. Fim da entrada (Ctrl+D / Ctrl+Z) lança EntradaEncerradaException.
 */
public class ConsoleIO {

    private static final int LARGURA = 60;
    private static final Pattern PADRAO_INTEIRO = Pattern.compile("^-?\\d{1,9}$");
    private static final Pattern PADRAO_DECIMAL = Pattern.compile("^-?\\d+([.,]\\d+)?$");
    private static final DateTimeFormatter FORMATO_DATA =
            DateTimeFormatter.ofPattern("dd/MM/uuuu").withResolverStyle(ResolverStyle.STRICT);

    private final BufferedReader entrada;
    private final PrintStream saida;
    private final boolean terminalReal;
    private boolean avisouEcoDeSenha;

    /** Console padrão: teclado e tela. */
    public ConsoleIO() {
        this(System.in, System.out);
    }

    /** Entrada e saída customizadas (usado pela demonstração e por testes). */
    public ConsoleIO(InputStream in, PrintStream out) {
        this.entrada = new BufferedReader(new InputStreamReader(in, StandardCharsets.UTF_8));
        this.saida = out;
        this.terminalReal = in == System.in;
    }

    // ---------- saída ----------

    public void titulo(String texto) {
        saida.println();
        saida.println("=".repeat(LARGURA));
        saida.println(" " + texto);
        saida.println("=".repeat(LARGURA));
    }

    public void mensagem(String texto) {
        saida.println(texto);
    }

    public void sucesso(String texto) {
        saida.println("[OK] " + texto);
    }

    public void erro(String texto) {
        saida.println("[ERRO] " + texto);
    }

    /** Imprime um texto já formatado (extratos, relatórios) sem alterações. */
    public void exibirTexto(String texto) {
        saida.println(texto);
    }

    /** Lista cada item em uma linha; se estiver vazia, mostra a mensagem informada. */
    public void listar(Collection<?> itens, String mensagemVazia) {
        if (itens == null || itens.isEmpty()) {
            saida.println("  " + mensagemVazia);
            return;
        }
        for (Object item : itens) {
            saida.println("  " + item);
        }
    }

    // ---------- entrada ----------

    /** Lê uma linha de texto sem espaços nas pontas. Pode devolver texto vazio. */
    public String lerTexto(String pergunta) {
        return lerLinha(pergunta).trim();
    }

    /** Lê um número inteiro de até 9 dígitos, repetindo a pergunta se for inválido. */
    public int lerInteiro(String pergunta) {
        while (true) {
            String texto = lerTexto(pergunta);
            if (PADRAO_INTEIRO.matcher(texto).matches()) {
                return Integer.parseInt(texto);
            }
            erro("Digite um número inteiro (até 9 dígitos).");
        }
    }

    /** Lê um valor decimal (aceita vírgula ou ponto), repetindo a pergunta se for inválido. */
    public BigDecimal lerDecimal(String pergunta) {
        while (true) {
            BigDecimal valor = converterDecimal(lerTexto(pergunta));
            if (valor != null) {
                return valor;
            }
            erro("Valor inválido. Exemplo: 12,50");
        }
    }

    /** Como lerDecimal, mas Enter sem digitar nada devolve null. */
    public BigDecimal lerDecimalOpcional(String pergunta) {
        while (true) {
            String texto = lerTexto(pergunta);
            if (texto.isEmpty()) {
                return null;
            }
            BigDecimal valor = converterDecimal(texto);
            if (valor != null) {
                return valor;
            }
            erro("Valor inválido. Exemplo: 12,50 (ou Enter para o padrão)");
        }
    }

    /** Lê uma data dd/MM/aaaa; Enter sem digitar nada devolve o valor padrão. */
    public LocalDate lerData(String pergunta, LocalDate padrao) {
        while (true) {
            String texto = lerTexto(pergunta);
            if (texto.isEmpty()) {
                return padrao;
            }
            try {
                return LocalDate.parse(texto, FORMATO_DATA);
            } catch (DateTimeParseException e) {
                erro("Data inválida. Use o formato dd/MM/aaaa, por exemplo 31/10/2026.");
            }
        }
    }

    /** Lê a senha. Em terminal real a digitação fica oculta; em IDEs ela aparece na tela. */
    public String lerSenha(String pergunta) {
        Console console = terminalReal ? System.console() : null;
        if (console != null) {
            char[] senha = console.readPassword("%s", pergunta);
            if (senha == null) {
                throw new EntradaEncerradaException();
            }
            String texto = new String(senha);
            java.util.Arrays.fill(senha, ' ');
            return texto;
        }
        if (terminalReal && !avisouEcoDeSenha) {
            avisouEcoDeSenha = true;
            mensagem("(Este terminal não oculta a digitação: a senha aparecerá na tela.)");
        }
        return lerLinha(pergunta);
    }

    // ---------- internos ----------

    private String lerLinha(String pergunta) {
        saida.print(pergunta);
        saida.flush();
        try {
            String linha = entrada.readLine();
            if (linha == null) {
                throw new EntradaEncerradaException();
            }
            return linha;
        } catch (IOException e) {
            throw new UncheckedIOException("Falha ao ler a entrada.", e);
        }
    }

    /** Devolve null se o texto não for um decimal válido. */
    private static BigDecimal converterDecimal(String texto) {
        if (!PADRAO_DECIMAL.matcher(texto).matches()) {
            return null;
        }
        return new BigDecimal(texto.replace(',', '.'));
    }
}
