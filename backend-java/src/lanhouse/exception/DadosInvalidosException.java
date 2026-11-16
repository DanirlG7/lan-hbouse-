package lanhouse.exception;

/** Dado de entrada ausente, mal formatado ou fora das regras (nome vazio, CPF inválido, valor negativo). */
public class DadosInvalidosException extends LanHouseException {

    public DadosInvalidosException(String mensagem) {
        super("DADOS_INVALIDOS", mensagem);
    }
}
