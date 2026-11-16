package lanhouse.model;

import java.util.Set;

/** Desenvolvedor: acesso somente de consulta (histórico e equipe). */
public class Desenvolvedor extends Funcionario {

    private static final Set<Permissao> PERMISSOES = conjunto(
            Permissao.CONSULTAR_HISTORICO,
            Permissao.CONSULTAR_EQUIPE);

    public Desenvolvedor(int id, String nome, String login, String senha, Genero genero, Turno turno) {
        super(id, nome, login, senha, genero, turno);
    }

    @Override
    public String getCargo() {
        return "Desenvolvedor";
    }

    @Override
    public Set<Permissao> getPermissoes() {
        return PERMISSOES;
    }
}
