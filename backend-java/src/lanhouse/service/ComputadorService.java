package lanhouse.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Objects;

import lanhouse.evento.Evento;
import lanhouse.evento.PublicadorEventos;
import lanhouse.exception.DadosInvalidosException;
import lanhouse.exception.EntidadeNaoEncontradaException;
import lanhouse.model.AreaComputador;
import lanhouse.model.Computador;
import lanhouse.model.Funcionario;
import lanhouse.model.Permissao;
import lanhouse.repository.ComputadorRepository;
import lanhouse.tempo.Relogio;
import lanhouse.util.AppLog;

/**
 * Consulta e manutenção dos computadores. Ocupar e liberar durante a sessão é feito pelo
 * SessaoService. A regra "não enviar para manutenção um PC ocupado" fica no model.
 */
public class ComputadorService {

    private final ComputadorRepository repositorio;
    private final PublicadorEventos eventos;
    private final Relogio relogio;

    public ComputadorService(ComputadorRepository repositorio, PublicadorEventos eventos, Relogio relogio) {
        this.repositorio = Objects.requireNonNull(repositorio, "repositorio");
        this.eventos = Objects.requireNonNull(eventos, "eventos");
        this.relogio = Objects.requireNonNull(relogio, "relogio");
    }

    /**
     * Grava o estado atual de um computador alterado por outro serviço (ocupar/liberar numa
     * sessão). Sem checagem de permissão: quem chama já autorizou a operação maior.
     */
    public void persistir(Computador computador) {
        repositorio.salvar(computador);
    }

    /**
     * RF03: cadastra um computador. Se a tarifa for nula, vale a tarifa padrão da área. O número
     * não pode se repetir. Só quem tem GERENCIAR_COMPUTADOR (Administrador).
     */
    public Computador cadastrar(Funcionario operador, int numero, AreaComputador area, BigDecimal tarifaHora) {
        Funcionario.autorizar(operador, Permissao.GERENCIAR_COMPUTADOR);

        Computador novo = new Computador(numero, area, tarifaHora);
        if (!repositorio.inserirSeNovo(novo)) {
            throw new DadosInvalidosException("Já existe um computador com o número " + numero + ".");
        }
        AppLog.info("PC " + numero + " cadastrado por " + operador.getNome());
        eventos.publicar(new Evento.ComputadorCadastrado(relogio.agora(), numero, novo.getArea(),
                novo.getTarifaHora(), operador.getId(), operador.getNome()));
        return novo;
    }

    /**
     * RN10: altera a tarifa por hora. Vale só para sessões futuras; quem está jogando mantém a
     * tarifa com que começou. Só quem tem GERENCIAR_COMPUTADOR (Administrador).
     */
    public Computador alterarTarifa(Funcionario operador, int numero, BigDecimal novaTarifa) {
        Funcionario.autorizar(operador, Permissao.GERENCIAR_COMPUTADOR);

        Computador computador = buscarPorNumero(numero);
        BigDecimal anterior = computador.getTarifaHora();
        computador.alterarTarifa(novaTarifa);
        repositorio.salvar(computador);
        AppLog.info("Tarifa do PC " + numero + " alterada de " + anterior + " para "
                + computador.getTarifaHora() + " por " + operador.getNome());
        eventos.publicar(new Evento.TarifaAlterada(relogio.agora(), numero, anterior,
                computador.getTarifaHora(), operador.getId(), operador.getNome()));
        return computador;
    }

    public Computador buscarPorNumero(int numero) {
        return repositorio.buscarPorNumero(numero)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Computador " + numero + " não encontrado."));
    }

    public List<Computador> listar() {
        return repositorio.listarTodos();
    }

    /** Foto do momento: o status pode mudar logo depois. */
    public List<Computador> listarDisponiveis() {
        return repositorio.listarDisponiveis();
    }

    public Computador enviarParaManutencao(Funcionario operador, int numero) {
        Funcionario.autorizar(operador, Permissao.MANUTENCAO_COMPUTADOR);

        Computador computador = buscarPorNumero(numero);
        computador.enviarParaManutencao();
        repositorio.salvar(computador);
        AppLog.info("PC " + numero + " enviado para manutenção por " + operador.getNome());
        eventos.publicar(new Evento.ComputadorEmManutencao(relogio.agora(), numero,
                operador.getId(), operador.getNome()));
        return computador;
    }

    public Computador concluirManutencao(Funcionario operador, int numero) {
        Funcionario.autorizar(operador, Permissao.MANUTENCAO_COMPUTADOR);

        Computador computador = buscarPorNumero(numero);
        computador.concluirManutencao();
        repositorio.salvar(computador);
        AppLog.info("PC " + numero + " liberado da manutenção por " + operador.getNome());
        eventos.publicar(new Evento.ManutencaoConcluida(relogio.agora(), numero,
                operador.getId(), operador.getNome()));
        return computador;
    }
}
