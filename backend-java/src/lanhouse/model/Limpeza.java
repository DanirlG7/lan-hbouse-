package lanhouse.model;

import java.util.Set;

/** Limpeza: só envia e libera computadores da manutenção/limpeza. */
public class Limpeza extends Funcionario {

    private static final Set<Permissao> PERMISSOES = conjunto(Permissao.MANUTENCAO_COMPUTADOR);

    public Limpeza(int id, String nome, String login, String senha, Genero genero, Turno turno) {
        super(id, nome, login, senha, genero, turno);
    }

    @Override
    public String getCargo() {
        return "Limpeza";
    }

    @Override
    public Set<Permissao> getPermissoes() {
        return PERMISSOES;
    }
}
