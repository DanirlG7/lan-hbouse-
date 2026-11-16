package lanhouse.repository;

import java.util.List;
import java.util.Optional;

import lanhouse.model.Computador;

/** Computadores são identificados pelo número (não usam proximoId). */
public interface ComputadorRepository extends Repositorio<Computador> {

    Optional<Computador> buscarPorNumero(int numero);

    /** Foto do momento: o status pode mudar logo depois. Quem ocupa de verdade é Computador.ocupar(). */
    List<Computador> listarDisponiveis();
}
