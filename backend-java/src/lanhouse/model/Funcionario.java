package lanhouse.model;

import java.util.Arrays;
import java.util.Collections;
import java.util.EnumSet;
import java.util.Set;

import lanhouse.exception.PermissaoNegadaException;
import lanhouse.util.Seguranca;
import lanhouse.util.Validador;

/**
 * Funcionário da lan house (classe abstrata). Cada cargo concreto define o próprio nome e o
 * próprio conjunto de permissões, e o restante do sistema usa isso de forma polimórfica.
 */
public abstract class Funcionario {

    private final int id;
    private final String nome;
    private final String login;
    private final String senhaHash;
    private final Genero genero;
    private final Turno turno;

    protected Funcionario(int id, String nome, String login, String senha, Genero genero, Turno turno) {
        this.id = id;
        this.nome = Validador.nome(nome);
        this.login = Validador.login(login);
        this.senhaHash = Seguranca.gerarHash(Validador.senha(senha));
        this.genero = Validador.naoNulo(genero, "Gênero");
        this.turno = Validador.naoNulo(turno, "Turno");
    }

    /** Nome do cargo, exibido nos menus, extratos e auditoria. */
    public abstract String getCargo();

    /** Permissões do cargo. O conjunto devolvido é imutável. */
    public abstract Set<Permissao> getPermissoes();

    public boolean temPermissao(Permissao permissao) {
        return getPermissoes().contains(permissao);
    }

    /** Validação central de autorização: lança PermissaoNegadaException se o cargo não permite. */
    public void exigirPermissao(Permissao permissao) {
        if (!temPermissao(permissao)) {
            throw new PermissaoNegadaException("O cargo " + getCargo() + " não tem permissão para "
                    + permissao.getDescricao() + ".");
        }
    }

    /** Atalho para serviços e controllers: rejeita operador nulo e delega a exigirPermissao. */
    public static void autorizar(Funcionario operador, Permissao permissao) {
        if (operador == null) {
            throw new PermissaoNegadaException("Operador não identificado.");
        }
        operador.exigirPermissao(permissao);
    }

    public boolean senhaConfere(String senhaDigitada) {
        return Seguranca.conferir(senhaDigitada, senhaHash);
    }

    /** Monta um conjunto imutável de permissões. Uso interno das subclasses. */
    protected static Set<Permissao> conjunto(Permissao... permissoes) {
        EnumSet<Permissao> conjunto = EnumSet.noneOf(Permissao.class);
        conjunto.addAll(Arrays.asList(permissoes));
        return Collections.unmodifiableSet(conjunto);
    }

    public int getId() {
        return id;
    }

    public String getNome() {
        return nome;
    }

    public String getLogin() {
        return login;
    }

    public Genero getGenero() {
        return genero;
    }

    public Turno getTurno() {
        return turno;
    }

    @Override
    public boolean equals(Object outro) {
        if (this == outro) {
            return true;
        }
        if (outro == null || getClass() != outro.getClass()) {
            return false;
        }
        return id == ((Funcionario) outro).id;
    }

    @Override
    public int hashCode() {
        return Integer.hashCode(id);
    }

    @Override
    public String toString() {
        return "#" + id + " " + nome + " | " + getCargo() + " | " + turno.getDescricao();
    }
}
