package lanhouse.util;

import java.math.BigDecimal;
import java.util.Locale;
import java.util.regex.Pattern;

import lanhouse.exception.DadosInvalidosException;

/** Validações e normalizações de dados de entrada. Todas lançam DadosInvalidosException. */
public final class Validador {

    private static final Pattern PADRAO_NOME = Pattern.compile("^\\p{L}[\\p{L} .'-]*$");
    private static final Pattern PADRAO_LOGIN = Pattern.compile("^[a-z0-9._]{3,30}$");

    private Validador() {
    }

    public static <T> T naoNulo(T valor, String campo) {
        if (valor == null) {
            throw new DadosInvalidosException(campo + " é obrigatório.");
        }
        return valor;
    }

    /** Texto obrigatório; devolve o valor sem espaços nas pontas. */
    public static String textoObrigatorio(String valor, String campo) {
        if (valor == null || valor.trim().isEmpty()) {
            throw new DadosInvalidosException(campo + " é obrigatório.");
        }
        return valor.trim();
    }

    /** Nome de pessoa: de 2 a 80 caracteres, só letras, espaço, ponto, apóstrofo e hífen. */
    public static String nome(String valor) {
        String nome = textoObrigatorio(valor, "Nome");
        if (nome.length() < 2 || nome.length() > 80 || !PADRAO_NOME.matcher(nome).matches()) {
            throw new DadosInvalidosException("Nome inválido: use de 2 a 80 letras, sem números.");
        }
        return nome;
    }

    /** Login: de 3 a 30 caracteres entre letras, números, ponto e sublinhado. Devolve em minúsculas. */
    public static String login(String valor) {
        String login = textoObrigatorio(valor, "Login").toLowerCase(Locale.ROOT);
        if (!PADRAO_LOGIN.matcher(login).matches()) {
            throw new DadosInvalidosException(
                    "Login inválido: use de 3 a 30 caracteres entre letras, números, ponto e sublinhado.");
        }
        return login;
    }

    /** Senha: de 6 a 72 caracteres. Não é alterada (espaços fazem parte da senha). */
    public static String senha(String valor) {
        if (valor == null || valor.length() < 6 || valor.length() > 72) {
            throw new DadosInvalidosException("Senha inválida: use de 6 a 72 caracteres.");
        }
        return valor;
    }

    /** Telefone brasileiro com DDD: 10 ou 11 dígitos. Devolve só os dígitos. */
    public static String telefone(String valor) {
        String digitos = somenteDigitos(textoObrigatorio(valor, "Telefone"));
        if (digitos.length() != 10 && digitos.length() != 11) {
            throw new DadosInvalidosException("Telefone inválido: informe DDD + número (10 ou 11 dígitos).");
        }
        return digitos;
    }

    /** CPF com dígitos verificadores corretos. Aceita pontos e traço; devolve só os 11 dígitos. */
    public static String cpf(String valor) {
        String digitos = somenteDigitos(textoObrigatorio(valor, "CPF"));
        if (!cpfValido(digitos)) {
            throw new DadosInvalidosException("CPF inválido.");
        }
        return digitos;
    }

    public static BigDecimal valorPositivo(BigDecimal valor, String campo) {
        naoNulo(valor, campo);
        if (valor.signum() <= 0) {
            throw new DadosInvalidosException(campo + " deve ser maior que zero.");
        }
        return valor;
    }

    public static BigDecimal valorNaoNegativo(BigDecimal valor, String campo) {
        naoNulo(valor, campo);
        if (valor.signum() < 0) {
            throw new DadosInvalidosException(campo + " não pode ser negativo.");
        }
        return valor;
    }

    public static int quantidadePositiva(int valor, String campo) {
        if (valor <= 0) {
            throw new DadosInvalidosException(campo + " deve ser maior que zero.");
        }
        return valor;
    }

    public static int quantidadeNaoNegativa(int valor, String campo) {
        if (valor < 0) {
            throw new DadosInvalidosException(campo + " não pode ser negativa.");
        }
        return valor;
    }

    public static String somenteDigitos(String valor) {
        return valor.replaceAll("\\D", "");
    }

    private static boolean cpfValido(String cpf) {
        if (cpf.length() != 11 || cpf.chars().distinct().count() == 1) {
            return false; // tamanho errado ou todos os dígitos iguais (111.111.111-11)
        }
        return digitoVerificador(cpf, 9) == cpf.charAt(9) - '0'
                && digitoVerificador(cpf, 10) == cpf.charAt(10) - '0';
    }

    /** Calcula um dígito verificador do CPF usando os primeiros "quantidade" dígitos. */
    private static int digitoVerificador(String cpf, int quantidade) {
        int soma = 0;
        for (int i = 0; i < quantidade; i++) {
            soma += (cpf.charAt(i) - '0') * (quantidade + 1 - i);
        }
        int resto = (soma * 10) % 11;
        return resto == 10 ? 0 : resto;
    }
}
