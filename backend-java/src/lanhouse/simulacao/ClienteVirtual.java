package lanhouse.simulacao;

import java.time.LocalDateTime;

import lanhouse.model.Cliente;
import lanhouse.model.FormaPagamento;

/** Estado interno de um cliente simulado: a máquina de estados do dia dele na lan house. */
final class ClienteVirtual {

    enum Etapa {
        NA_FILA, JOGANDO, NA_BOMBONIERE, A_PAGAR, AGUARDANDO_PAGAMENTO, SAINDO, DESISTIU
    }

    final int numero;               // ordem de chegada no dia (identifica o visitante)
    final LocalDateTime chegouEm;
    final boolean prefereVip;
    final boolean aceitaOutraArea;
    final int pacienciaMinutos;
    final int duracaoMinutos;

    // cadastro: já existe (cliente != null) ou será criado no atendimento
    Cliente cliente;
    final String nomeNovo;
    final String telefoneNovo;
    final String cpfNovo;

    Etapa etapa = Etapa.NA_FILA;
    int sessaoId;
    int computador;
    LocalDateTime fimPlanejado;
    LocalDateTime proximoConsumo;
    int passosRestantes;            // tempo parado na bomboniere ou esperando a aprovação do pagamento
    FormaPagamento forma;
    int pagamentoId;

    ClienteVirtual(int numero, LocalDateTime chegouEm, boolean prefereVip, boolean aceitaOutraArea,
                   int pacienciaMinutos, int duracaoMinutos, Cliente existente,
                   String nomeNovo, String telefoneNovo, String cpfNovo) {
        this.numero = numero;
        this.chegouEm = chegouEm;
        this.prefereVip = prefereVip;
        this.aceitaOutraArea = aceitaOutraArea;
        this.pacienciaMinutos = pacienciaMinutos;
        this.duracaoMinutos = duracaoMinutos;
        this.cliente = existente;
        this.nomeNovo = nomeNovo;
        this.telefoneNovo = telefoneNovo;
        this.cpfNovo = cpfNovo;
    }

    String nome() {
        return cliente != null ? cliente.getNome() : nomeNovo;
    }

    boolean temComputador() {
        return etapa == Etapa.JOGANDO || etapa == Etapa.NA_BOMBONIERE || etapa == Etapa.A_PAGAR;
    }

    boolean saiu() {
        return etapa == Etapa.SAINDO || etapa == Etapa.DESISTIU;
    }
}
