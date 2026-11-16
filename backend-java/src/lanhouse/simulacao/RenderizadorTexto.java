package lanhouse.simulacao;

import java.util.List;
import java.util.stream.Collectors;

import lanhouse.model.StatusComputador;
import lanhouse.util.Formatador;

/**
 * Desenha o estado do mundo em texto, uma vista de cima simplificada. Serve para ver a
 * simulação no terminal e para conferir que o retrato (EstadoDoMundo) tem tudo que o front
 * vai precisar.
 */
public final class RenderizadorTexto {

    private RenderizadorTexto() {
    }

    public static String painel(EstadoDoMundo estado) {
        StringBuilder sb = new StringBuilder();
        sb.append("+-- ").append(Formatador.dataHora(estado.agora()))
                .append(estado.encerrado() ? " | ENCERRADO" : estado.aberto() ? " | ABERTO" : " | FECHADO")
                .append(" | Fila: ").append(estado.filaTamanho())
                .append(" | PCs em uso: ").append(estado.computadoresEmUso()).append('/')
                .append(estado.computadores().size()).append('\n');

        for (Setor setor : Setor.values()) {
            List<PersonagemVisual> gente = estado.noSetor(setor);
            sb.append(String.format("| %-11s: ", setor.getDescricao()));
            sb.append(gente.isEmpty() ? "-" : gente.stream()
                    .map(p -> abreviar(p.nome(), 14) + " (" + p.acao() + ")")
                    .collect(Collectors.joining("; ")));
            sb.append('\n');
            if (setor == Setor.AREA_COMUM || setor == Setor.AREA_VIP) {
                sb.append("|             ").append(computadores(estado, setor)).append('\n');
            }
        }
        return sb.toString().stripTrailing();
    }

    private static String computadores(EstadoDoMundo estado, Setor setor) {
        return estado.computadores().stream()
                .filter(pc -> Setor.doComputador(pc.area()) == setor)
                .map(pc -> String.format("[%02d %-8s]", pc.numero(), rotulo(pc)))
                .collect(Collectors.joining(" "));
    }

    private static String rotulo(ComputadorVisual pc) {
        if (pc.status() == StatusComputador.MANUTENCAO) {
            return "MANUTEN.";
        }
        if (pc.status() == StatusComputador.DISPONIVEL) {
            return "livre";
        }
        return abreviar(pc.usuario() == null ? "em uso" : pc.usuario(), 8);
    }

    private static String abreviar(String texto, int limite) {
        return texto.length() <= limite ? texto : texto.substring(0, limite);
    }
}
