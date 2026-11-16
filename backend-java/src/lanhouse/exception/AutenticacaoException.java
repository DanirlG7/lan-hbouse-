package lanhouse.exception;

/** Falha de login. A mensagem é propositalmente genérica para não revelar se o usuário existe. */
public class AutenticacaoException extends LanHouseException {

    public AutenticacaoException() {
        super("AUTENTICACAO", "Login ou senha inválidos.");
    }
}
