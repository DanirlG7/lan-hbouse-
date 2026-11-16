package lanhouse.simulacao;

import java.util.HashSet;
import java.util.Random;
import java.util.Set;

/** Sorteia nomes, telefones e CPFs válidos (e nunca repetidos) para os clientes novos. */
final class GeradorDePessoas {

    private static final String[] NOMES = {
            "Ana", "Bruno", "Carla", "Daniel", "Eduarda", "Felipe", "Gabriela", "Henrique", "Isabela", "João",
            "Karina", "Leonardo", "Marcela", "Nicolas", "Olívia", "Paulo", "Queila", "Rodrigo", "Sabrina",
            "Tiago", "Úrsula", "Vinícius", "Wesley", "Yasmin", "Zeca", "Alice", "Bernardo", "Cecília",
            "Davi", "Elisa", "Fábio", "Giovana", "Hugo", "Ingrid", "Jorge", "Kátia", "Lucas", "Mariana"};

    private static final String[] SOBRENOMES = {
            "Almeida", "Barbosa", "Cardoso", "Dias", "Esteves", "Farias", "Gomes", "Hernandes", "Ibrahim",
            "Jesus", "Lopes", "Moraes", "Nascimento", "Oliveira", "Pinto", "Queiroz", "Ribeiro", "Santana",
            "Teixeira", "Uchoa", "Vasconcelos", "Xavier", "Zanetti", "Araújo", "Batista", "Campos", "Duarte"};

    private final Set<String> cpfsUsados = new HashSet<>();

    /** Informa CPFs que já existem, para nunca gerar um repetido. */
    void reservar(String cpf) {
        cpfsUsados.add(cpf);
    }

    String nome(Random rng) {
        return NOMES[rng.nextInt(NOMES.length)] + " " + SOBRENOMES[rng.nextInt(SOBRENOMES.length)];
    }

    /** DDD 11, celular de 9 dígitos começando em 9. */
    String telefone(Random rng) {
        StringBuilder sb = new StringBuilder("119");
        for (int i = 0; i < 8; i++) {
            sb.append(rng.nextInt(10));
        }
        return sb.toString();
    }

    /** CPF com dígitos verificadores corretos, único entre os já gerados e reservados. */
    String cpf(Random rng) {
        while (true) {
            StringBuilder base = new StringBuilder();
            for (int i = 0; i < 9; i++) {
                base.append(rng.nextInt(10));
            }
            int primeiro = digito(base.toString(), 10);
            int segundo = digito(base.toString() + primeiro, 11);
            String cpf = base.toString() + primeiro + segundo;
            if (cpf.chars().distinct().count() > 1 && cpfsUsados.add(cpf)) {
                return cpf;
            }
        }
    }

    private static int digito(String digitos, int pesoInicial) {
        int soma = 0;
        for (int i = 0; i < digitos.length(); i++) {
            soma += (digitos.charAt(i) - '0') * (pesoInicial - i);
        }
        int resto = soma % 11;
        return resto < 2 ? 0 : 11 - resto;
    }
}
