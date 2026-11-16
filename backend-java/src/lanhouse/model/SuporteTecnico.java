package lanhouse.model;

import java.util.Set;

/** Suporte técnico: manutenção de computadores e consulta de histórico. */
public class SuporteTecnico extends Funcionario {

    private static final Set<Permissao> PERMISSOES = conjunto(
            Permissao.MANUTENCAO_COMPUTADOR,
            Permissao.CONSULTAR_HISTORICO);

    public SuporteTecnico(int id, String nome, String login, String senha, Genero genero, Turno turno) {
        super(id, nome, login, senha, genero, turno);
    }

    @Override
    public String getCargo() {
        return "Suporte Técnico";
    }

    @Override
    public Set<Permissao> getPermissoes() {
        return PERMISSOES;
    }
}
