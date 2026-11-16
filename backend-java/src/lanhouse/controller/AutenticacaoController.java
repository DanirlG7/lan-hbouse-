package lanhouse.controller;

import lanhouse.Contexto;
import lanhouse.model.Funcionario;
import lanhouse.util.AppLog;

/** Login e logout. */
public class AutenticacaoController extends ControllerBase {

    private static final String COMANDO_SAIR = "sair";

    public AutenticacaoController(Contexto ctx) {
        super(ctx);
    }

    /**
     * Pede login e senha até autenticar. Devolve false se a pessoa digitar "sair" no login,
     * o que significa encerrar o programa.
     */
    public boolean entrar() {
        io.titulo("LAN HOUSE - LOGIN");
        io.mensagem("Digite 'sair' no login para encerrar o programa.");
        while (!ctx.temOperador()) {
            String login = io.lerTexto("Login: ");
            if (login.equalsIgnoreCase(COMANDO_SAIR)) {
                return false;
            }
            String senha = io.lerSenha("Senha: ");
            executar("login", () -> {
                Funcionario funcionario = ctx.funcionarioService().autenticar(login, senha);
                ctx.definirOperador(funcionario);
                io.sucesso("Bem-vindo(a), " + funcionario.getNome() + ".");
            });
        }
        return true;
    }

    /** Encerra o login atual (se houver). */
    public void sair() {
        if (ctx.temOperador()) {
            AppLog.info("Logout: " + ctx.operador().getNome());
            ctx.encerrarLogin();
            io.mensagem("Você saiu do sistema.");
        }
    }
}
