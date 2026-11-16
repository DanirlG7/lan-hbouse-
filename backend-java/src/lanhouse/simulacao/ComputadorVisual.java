package lanhouse.simulacao;

import lanhouse.model.AreaComputador;
import lanhouse.model.StatusComputador;

/** Retrato de um computador: quem está usando (ou null) e em que situação ele está. */
public record ComputadorVisual(int numero, AreaComputador area, StatusComputador status, String usuario) {
}
