package lanhouse.model;

/** Desenvolvedor Front-end: herda as permissões do desenvolvedor e muda apenas o nome do cargo. */
public class DesenvolvedorFrontEnd extends Desenvolvedor {

    public DesenvolvedorFrontEnd(int id, String nome, String login, String senha, Genero genero, Turno turno) {
        super(id, nome, login, senha, genero, turno);
    }

    @Override
    public String getCargo() {
        return "Desenvolvedor Front-end";
    }
}
