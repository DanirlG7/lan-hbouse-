package lanhouse.simulacao;

/**
 * Retrato de uma pessoa (cliente ou funcionário) num instante. O front usa o setor para saber
 * onde desenhar e a ação para o balão de texto. "computador" é o número do PC quando a pessoa
 * está usando ou mexendo em um, e null caso contrário.
 */
public record PersonagemVisual(String id, String nome, String papel, boolean cliente, Setor setor,
                               String acao, Integer computador) {
}
