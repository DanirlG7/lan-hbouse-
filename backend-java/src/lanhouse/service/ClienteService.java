package lanhouse.service;

import java.util.List;
import java.util.Objects;

import lanhouse.exception.DadosInvalidosException;
import lanhouse.evento.Evento;
import lanhouse.evento.PublicadorEventos;
import lanhouse.exception.EntidadeNaoEncontradaException;
import lanhouse.model.Cliente;
import lanhouse.model.Funcionario;
import lanhouse.model.Permissao;
import lanhouse.repository.ClienteRepository;
import lanhouse.tempo.Relogio;
import lanhouse.util.AppLog;
import lanhouse.util.Validador;

/** Cadastro, atualização e consulta de clientes. */
public class ClienteService {

    private final ClienteRepository repositorio;
    private final PublicadorEventos eventos;
    private final Relogio relogio;

    public ClienteService(ClienteRepository repositorio, PublicadorEventos eventos, Relogio relogio) {
        this.repositorio = Objects.requireNonNull(repositorio, "repositorio");
        this.eventos = Objects.requireNonNull(eventos, "eventos");
        this.relogio = Objects.requireNonNull(relogio, "relogio");
    }

    /** O construtor de Cliente valida nome, telefone e CPF. O CPF não pode se repetir. */
    public Cliente cadastrar(Funcionario operador, String nome, String telefone, String cpf) {
        Funcionario.autorizar(operador, Permissao.CADASTRAR_CLIENTE);

        int id = repositorio.proximoId();
        Cliente novo = new Cliente(id, nome, telefone, cpf);
        if (!repositorio.inserirSeCpfLivre(novo)) {
            throw new DadosInvalidosException("Já existe um cliente cadastrado com esse CPF.");
        }
        AppLog.info("Cliente #" + novo.getId() + " cadastrado por " + operador.getNome());
        eventos.publicar(new Evento.ClienteCadastrado(relogio.agora(), novo.getId(), novo.getNome(),
                operador.getId(), operador.getNome()));
        return novo;
    }

    /** Atualiza nome e telefone. O CPF não muda. */
    public Cliente atualizar(Funcionario operador, int clienteId, String nome, String telefone) {
        Funcionario.autorizar(operador, Permissao.ATUALIZAR_CLIENTE);

        Cliente cliente = buscarPorId(clienteId);
        cliente.atualizar(nome, telefone);
        repositorio.salvar(cliente);
        AppLog.info("Cliente #" + cliente.getId() + " atualizado por " + operador.getNome());
        return cliente;
    }

    public Cliente buscarPorId(int id) {
        return repositorio.buscarPorId(id)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Cliente #" + id + " não encontrado."));
    }

    /** Aceita CPF com ou sem pontuação; inválido lança DadosInvalidosException. */
    public Cliente buscarPorCpf(String cpf) {
        String normalizado = Validador.cpf(cpf);
        return repositorio.buscarPorCpf(normalizado)
                .orElseThrow(() -> new EntidadeNaoEncontradaException("Nenhum cliente encontrado com esse CPF."));
    }

    public List<Cliente> listar() {
        return repositorio.listarTodos();
    }
}
