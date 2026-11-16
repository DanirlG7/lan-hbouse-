package lanhouse.model;

import java.util.Set;

/** Recepcionista: clientes, sessões, consumo e pagamentos. Não estorna nem gera relatórios. */
public class Recepcionista extends Funcionario {

    private static final Set<Permissao> PERMISSOES = conjunto(
            Permissao.CADASTRAR_CLIENTE,
            Permissao.ATUALIZAR_CLIENTE,
            Permissao.INICIAR_SESSAO,
            Permissao.ENCERRAR_SESSAO,
            Permissao.REGISTRAR_CONSUMO,
            Permissao.REGISTRAR_PAGAMENTO,
            Permissao.CONSULTAR_HISTORICO,
            Permissao.CONSULTAR_EQUIPE);

    public Recepcionista(int id, String nome, String login, String senha, Genero genero, Turno turno) {
        super(id, nome, login, senha, genero, turno);
    }

    @Override
    public String getCargo() {
        return "Recepcionista";
    }

    @Override
    public Set<Permissao> getPermissoes() {
        return PERMISSOES;
    }
}
