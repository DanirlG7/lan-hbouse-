package lanhouse.evento;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import lanhouse.model.AreaComputador;
import lanhouse.model.FormaPagamento;

/**
 * Fatos que aconteceram no sistema, publicados pelos serviços depois que a operação deu certo.
 * Quem escuta (a simulação, a tela do jogo, um log) reage sem conhecer a regra de negócio.
 *
 * Cada evento é um registro imutável com cópias dos dados (números, textos, enums e valores
 * monetários), nunca as entidades do model: assim ninguém altera o estado do sistema por um
 * ouvinte e os eventos podem ser guardados, enviados a outra thread ou gravados sem risco.
 */
public sealed interface Evento {

    /** Instante em que o fato ocorreu, segundo o relógio do sistema (real ou simulado). */
    LocalDateTime momento();

    record ClienteCadastrado(LocalDateTime momento, int clienteId, String clienteNome,
                             int operadorId, String operadorNome) implements Evento {
    }

    record SessaoIniciada(LocalDateTime momento, int sessaoId, int clienteId, String clienteNome,
                          int computadorNumero, AreaComputador area, BigDecimal tarifaHora,
                          int operadorId, String operadorNome) implements Evento {
    }

    record ConsumoRegistrado(LocalDateTime momento, int sessaoId, int produtoId, String produtoNome,
                             int quantidade, BigDecimal subtotal, int estoqueRestante,
                             int operadorId, String operadorNome) implements Evento {
    }

    record SessaoEncerrada(LocalDateTime momento, int sessaoId, int clienteId, String clienteNome,
                           int computadorNumero, long minutosCobrados, BigDecimal valorBruto,
                           int operadorId, String operadorNome) implements Evento {
    }

    record PagamentoRegistrado(LocalDateTime momento, int pagamentoId, int sessaoId, FormaPagamento forma,
                               BigDecimal valorTotal, int operadorId, String operadorNome) implements Evento {
    }

    record PagamentoConfirmado(LocalDateTime momento, int pagamentoId, int sessaoId, FormaPagamento forma,
                               BigDecimal valorTotal, int operadorId, String operadorNome) implements Evento {
    }

    /** estoqueDevolvido é true só no primeiro estorno da sessão (a reposição acontece uma única vez). */
    record PagamentoEstornado(LocalDateTime momento, int pagamentoId, int sessaoId, FormaPagamento forma,
                              BigDecimal valorTotal, boolean estoqueDevolvido,
                              int operadorId, String operadorNome) implements Evento {
    }

    record ComputadorCadastrado(LocalDateTime momento, int computadorNumero, AreaComputador area,
                                BigDecimal tarifaHora, int operadorId, String operadorNome) implements Evento {
    }

    record TarifaAlterada(LocalDateTime momento, int computadorNumero, BigDecimal tarifaAnterior,
                          BigDecimal tarifaNova, int operadorId, String operadorNome) implements Evento {
    }

    record ComputadorEmManutencao(LocalDateTime momento, int computadorNumero,
                                  int operadorId, String operadorNome) implements Evento {
    }

    record ManutencaoConcluida(LocalDateTime momento, int computadorNumero,
                               int operadorId, String operadorNome) implements Evento {
    }

    record ProdutoReabastecido(LocalDateTime momento, int produtoId, String produtoNome, int quantidade,
                               int estoqueAtual, int operadorId, String operadorNome) implements Evento {
    }
}
