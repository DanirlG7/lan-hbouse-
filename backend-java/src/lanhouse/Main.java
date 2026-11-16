package lanhouse;

import lanhouse.controller.AutenticacaoController;
import lanhouse.controller.MenuController;
import lanhouse.demo.Demonstracao;
import lanhouse.exception.EntradaEncerradaException;
import lanhouse.fachada.EventoRegistrado;
import lanhouse.fachada.JogoLanHouse;
import lanhouse.simulacao.RenderizadorTexto;
import lanhouse.tempo.RelogioSimulado;
import lanhouse.util.AppLog;
import lanhouse.util.ConsoleIO;

/**
 * Ponto de entrada.
 *   (sem argumentos)   menu interativo, com o relógio real
 *   --demo             roteiro automático que exercita as regras do sistema
 *   --simular          dia inteiro simulado; opções: --semente=N  --verboso  --painel=N
 *   --ajuda            lista as opções
 */
public final class Main {

    private static final long SEMENTE_PADRAO = 2026;

    private Main() {
    }

    public static void main(String[] args) {
        ConsoleIO io = new ConsoleIO();
        try {
            if (tem(args, "--ajuda")) {
                mostrarAjuda(io);
            } else if (tem(args, "--demo")) {
                RelogioSimulado relogio = new RelogioSimulado(Demonstracao.INICIO_PADRAO);
                new Demonstracao(new Contexto(io, relogio), relogio).executar();
            } else if (tem(args, "--simular")) {
                simular(io, args);
            } else {
                executarInterativo(new Contexto(io), io);
            }
        } catch (EntradaEncerradaException e) {
            io.mensagem("");
            io.mensagem("Entrada encerrada. Até logo.");
        } catch (IllegalArgumentException e) {
            io.erro(e.getMessage());
        } catch (RuntimeException e) {
            io.erro("Falha ao executar o sistema: " + e.getMessage());
            AppLog.erro("Falha fatal", e);
        }
    }

    private static boolean tem(String[] args, String opcao) {
        for (String argumento : args) {
            if (opcao.equalsIgnoreCase(argumento)) {
                return true;
            }
        }
        return false;
    }

    /** Valor numérico de uma opção do tipo --nome=123, ou o padrão se ela não foi informada. */
    private static long valor(String[] args, String nome, long padrao) {
        String prefixo = nome + "=";
        for (String argumento : args) {
            if (argumento.toLowerCase().startsWith(prefixo)) {
                try {
                    return Long.parseLong(argumento.substring(prefixo.length()));
                } catch (NumberFormatException e) {
                    throw new IllegalArgumentException("Valor inválido em " + argumento + " (use um número inteiro).");
                }
            }
        }
        return padrao;
    }

    private static void simular(ConsoleIO io, String[] args) {
        long semente = valor(args, "--semente", SEMENTE_PADRAO);
        long painelACada = valor(args, "--painel", 0);
        boolean verboso = tem(args, "--verboso");

        JogoLanHouse jogo = JogoLanHouse.novo(semente);
        io.titulo("SIMULAÇÃO DE UM DIA (semente " + semente + ")");
        long vistos = 0;
        long passos = 0;
        while (!jogo.terminou()) {
            jogo.avancar();
            passos++;
            if (verboso) {
                for (EventoRegistrado e : jogo.eventosApos(vistos)) {
                    io.mensagem("  " + e.momento().toLocalTime() + " " + e.texto());
                    vistos = e.sequencia();
                }
            }
            if (painelACada > 0 && passos % painelACada == 0) {
                io.mensagem("");
                io.mensagem(RenderizadorTexto.painel(jogo.estado()));
            }
        }
        io.mensagem("");
        io.exibirTexto(jogo.resumo().texto());
    }

    private static void mostrarAjuda(ConsoleIO io) {
        io.titulo("LAN HOUSE - OPÇÕES");
        io.mensagem("  (sem argumentos)  menu interativo (login: carlos.lima / Lan@House2026)");
        io.mensagem("  --demo            roteiro automático que exercita as regras");
        io.mensagem("  --simular         simula um dia inteiro da lan house");
        io.mensagem("      --semente=N   semente do sorteio (mesma semente = mesmo dia). Padrão: " + SEMENTE_PADRAO);
        io.mensagem("      --verboso     mostra cada acontecimento durante o dia");
        io.mensagem("      --painel=N    desenha o painel do mundo a cada N minutos simulados");
        io.mensagem("  --ajuda           esta lista");
    }

    private static void executarInterativo(Contexto ctx, ConsoleIO io) {
        AutenticacaoController login = new AutenticacaoController(ctx);
        MenuController menu = new MenuController(ctx);

        io.titulo("LAN HOUSE - SISTEMA DE GERENCIAMENTO");
        while (login.entrar()) {
            menu.exibir();
            login.sair();
        }
        io.mensagem("Programa encerrado.");
    }
}
