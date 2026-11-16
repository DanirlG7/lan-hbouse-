package lanhouse.web;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import java.nio.charset.StandardCharsets;
import java.util.List;
import lanhouse.fachada.EventoRegistrado;
import lanhouse.fachada.JogoLanHouse;
import lanhouse.simulacao.ResumoDoDia;

/**
 * Adaptador HTTP nativo do JDK 17 (zero dependências externas) que expõe a fachada
 * JogoLanHouse via JSON para o Front-end Web React Pixel Art na porta 8080.
 *
 * Para usar no projeto Java em backend-java/:
 * 1. Execute backend-java\servidor-web.bat (ou ./servidor-web.sh no Linux/Mac)
 * 2. Ou rode manualmente: compilar.bat e java -cp out lanhouse.web.ServidorHttpLanHouse
 */
public final class ServidorHttpLanHouse {

    private static JogoLanHouse jogo = JogoLanHouse.novo(2026L);

    public static void main(String[] args) throws IOException {
        int porta = 8080;
        HttpServer server = HttpServer.create(new InetSocketAddress(porta), 0);

        server.createContext("/api/health", exchange -> {
            if (tratarPreflight(exchange)) return;
            responderJson(exchange, 200, "{\"ok\":true,\"motor\":\"JogoLanHouse-JDK17\",\"agora\":\"" + jogo.agora() + "\"}");
        });

        server.createContext("/api/avancar", exchange -> {
            if (tratarPreflight(exchange)) return;
            int passos = jogo.avancar(1);
            ResumoDoDia r = jogo.resumo();
            String json = String.format(
                    "{\"passos\":%d,\"terminou\":%s,\"agora\":\"%s\",\"sessoes\":%d,\"atendidos\":%d,\"itensVendidos\":%d}",
                    passos, jogo.terminou(), jogo.agora(), r.sessoes(), r.atendidos(), r.itensVendidos()
            );
            responderJson(exchange, 200, json);
        });

        server.createContext("/api/eventos", exchange -> {
            if (tratarPreflight(exchange)) return;
            List<EventoRegistrado> eventos = jogo.eventosApos(Math.max(0, jogo.ultimaSequencia() - 20));
            StringBuilder sb = new StringBuilder("[");
            for (int i = 0; i < eventos.size(); i++) {
                EventoRegistrado e = eventos.get(i);
                if (i > 0) sb.append(",");
                sb.append("{\"seq\":").append(e.sequencia())
                  .append(",\"tipo\":\"").append(escapar(e.tipo())).append("\"")
                  .append(",\"descricao\":\"").append(escapar(e.texto())).append("\"}");
            }
            sb.append("]");
            responderJson(exchange, 200, sb.toString());
        });

        server.setExecutor(null);
        server.start();
        System.out.println("Servidor HTTP LanHouse POO iniciado em http://localhost:" + porta + "/api/health");
    }

    private static boolean tratarPreflight(HttpExchange exchange) throws IOException {
        exchange.getResponseHeaders().add("Access-Control-Allow-Origin", "*");
        exchange.getResponseHeaders().add("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        exchange.getResponseHeaders().add("Access-Control-Allow-Headers", "Content-Type");
        if ("OPTIONS".equalsIgnoreCase(exchange.getRequestMethod())) {
            exchange.sendResponseHeaders(204, -1);
            return true;
        }
        return false;
    }

    private static void responderJson(HttpExchange exchange, int status, String corpo) throws IOException {
        byte[] bytes = corpo.getBytes(StandardCharsets.UTF_8);
        exchange.getResponseHeaders().add("Content-Type", "application/json; charset=utf-8");
        exchange.sendResponseHeaders(status, bytes.length);
        try (OutputStream os = exchange.getResponseBody()) {
            os.write(bytes);
        }
    }

    private static String escapar(String s) {
        return s == null ? "" : s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", " ");
    }
}
