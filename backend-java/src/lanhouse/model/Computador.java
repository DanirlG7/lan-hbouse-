package lanhouse.model;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.Locale;

import lanhouse.exception.ComputadorIndisponivelException;
import lanhouse.exception.DadosInvalidosException;
import lanhouse.util.Formatador;
import lanhouse.util.Validador;

/** Computador da lan house (Área Comum ou VIP), identificado pelo número. */
public class Computador {

    private final int numero;
    private final AreaComputador area;
    private BigDecimal tarifaHora;
    private StatusComputador status = StatusComputador.DISPONIVEL;

    /** Se a tarifa for nula, usa a tarifa padrão da área. */
    public Computador(int numero, AreaComputador area, BigDecimal tarifaHora) {
        this.numero = Validador.quantidadePositiva(numero, "Número do computador");
        this.area = Validador.naoNulo(area, "Área");
        this.tarifaHora = tarifaHora == null ? area.getTarifaPadrao() : normalizarTarifa(tarifaHora);
    }

    /** Altera a tarifa. Vale apenas para sessões futuras, pois cada sessão congela a própria tarifa. */
    public synchronized void alterarTarifa(BigDecimal novaTarifa) {
        this.tarifaHora = normalizarTarifa(novaTarifa);
    }

    /** DISPONIVEL para EM_USO. Chamado pelo serviço ao iniciar uma sessão. */
    public synchronized void ocupar() {
        if (status != StatusComputador.DISPONIVEL) {
            throw new ComputadorIndisponivelException("O computador " + rotulo() + " está "
                    + status.getDescricao().toLowerCase(Locale.ROOT) + ".");
        }
        status = StatusComputador.EM_USO;
    }

    /** EM_USO para DISPONIVEL. Chamado pelo serviço ao encerrar uma sessão. */
    public synchronized void liberar() {
        if (status != StatusComputador.EM_USO) {
            throw new ComputadorIndisponivelException("O computador " + rotulo() + " não está em uso.");
        }
        status = StatusComputador.DISPONIVEL;
    }

    /** DISPONIVEL para MANUTENCAO. Computador em uso não pode ser enviado. */
    public synchronized void enviarParaManutencao() {
        if (status == StatusComputador.EM_USO) {
            throw new ComputadorIndisponivelException("O computador " + rotulo()
                    + " está em uso. Encerre a sessão antes de enviá-lo para manutenção.");
        }
        if (status == StatusComputador.MANUTENCAO) {
            throw new ComputadorIndisponivelException("O computador " + rotulo() + " já está em manutenção.");
        }
        status = StatusComputador.MANUTENCAO;
    }

    /** MANUTENCAO para DISPONIVEL. */
    public synchronized void concluirManutencao() {
        if (status != StatusComputador.MANUTENCAO) {
            throw new DadosInvalidosException("O computador " + rotulo() + " não está em manutenção.");
        }
        status = StatusComputador.DISPONIVEL;
    }

    public synchronized boolean isDisponivel() {
        return status == StatusComputador.DISPONIVEL;
    }

    private static BigDecimal normalizarTarifa(BigDecimal tarifa) {
        Validador.naoNulo(tarifa, "Tarifa");
        return Validador.valorPositivo(tarifa.setScale(2, RoundingMode.HALF_UP), "Tarifa por hora");
    }

    private String rotulo() {
        return String.format("PC %02d", numero);
    }

    public int getNumero() {
        return numero;
    }

    public AreaComputador getArea() {
        return area;
    }

    public synchronized BigDecimal getTarifaHora() {
        return tarifaHora;
    }

    public synchronized StatusComputador getStatus() {
        return status;
    }

    @Override
    public synchronized String toString() {
        return rotulo() + " | " + area.getDescricao() + " | " + Formatador.moeda(tarifaHora) + "/h | "
                + status.getDescricao();
    }
}
