package lanhouse.model;

import lanhouse.util.Formatador;
import lanhouse.util.Validador;

/** Cliente da lan house. O CPF é imutável; nome e telefone podem ser atualizados. */
public class Cliente {

    private final int id;
    private final String cpf;
    private String nome;
    private String telefone;

    public Cliente(int id, String nome, String telefone, String cpf) {
        this.id = id;
        this.nome = Validador.nome(nome);
        this.telefone = Validador.telefone(telefone);
        this.cpf = Validador.cpf(cpf);
    }

    /** Atualiza nome e telefone. Valida os dois antes de alterar qualquer um. */
    public synchronized void atualizar(String novoNome, String novoTelefone) {
        String nomeValidado = Validador.nome(novoNome);
        String telefoneValidado = Validador.telefone(novoTelefone);
        this.nome = nomeValidado;
        this.telefone = telefoneValidado;
    }

    public int getId() {
        return id;
    }

    /** Somente os 11 dígitos do CPF. */
    public String getCpf() {
        return cpf;
    }

    public synchronized String getNome() {
        return nome;
    }

    public synchronized String getTelefone() {
        return telefone;
    }

    @Override
    public synchronized String toString() {
        return "#" + id + " " + nome + " | CPF " + Formatador.cpfMascarado(cpf)
                + " | " + Formatador.telefone(telefone);
    }
}
