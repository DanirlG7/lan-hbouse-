package lanhouse.model;

import java.util.Set;

/** Administrador: possui todas as permissões, incluindo estorno, relatórios e auditoria. */
public class Administrador extends Funcionario {

    private static final Set<Permissao> PERMISSOES = conjunto(Permissao.values());

    public Administrador(int id, String nome, String login, String senha, Genero genero, Turno turno) {
        super(id, nome, login, senha, genero, turno);
    }

    @Override
    public String getCargo() {
        return "Administrador";
    }

    @Override
    public Set<Permissao> getPermissoes() {
        return PERMISSOES;
    }
}
