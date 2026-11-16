package lanhouse.model;

/** Ações protegidas do sistema. Cada cargo declara o conjunto de permissões que possui. */
public enum Permissao {
    CADASTRAR_CLIENTE("cadastrar cliente"),
    ATUALIZAR_CLIENTE("atualizar cliente"),
    GERENCIAR_COMPUTADOR("gerenciar computadores"),
    MANUTENCAO_COMPUTADOR("enviar/liberar computador de manutenção"),
    GERENCIAR_PRODUTO("gerenciar produtos e estoque"),
    INICIAR_SESSAO("iniciar sessão"),
    ENCERRAR_SESSAO("encerrar sessão"),
    REGISTRAR_CONSUMO("registrar consumo"),
    REGISTRAR_PAGAMENTO("registrar e confirmar pagamento"),
    ESTORNAR_PAGAMENTO("estornar pagamento"),
    CONSULTAR_HISTORICO("consultar histórico"),
    CONSULTAR_EQUIPE("consultar equipe"),
    GERENCIAR_EQUIPE("cadastrar funcionários"),
    GERAR_RELATORIO("gerar relatórios"),
    CONSULTAR_AUDITORIA("consultar auditoria");

    private final String descricao;

    Permissao(String descricao) {
        this.descricao = descricao;
    }

    public String getDescricao() {
        return descricao;
    }
}
