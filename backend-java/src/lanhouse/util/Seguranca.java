package lanhouse.util;

import java.security.GeneralSecurityException;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import javax.crypto.SecretKeyFactory;
import javax.crypto.spec.PBEKeySpec;

/** Hash e conferência de senhas. O formato guardado é: iterações$sal$hash (Base64). */
public final class Seguranca {

    private static final int ITERACOES = 65_536;
    private static final int TAMANHO_SAL_BYTES = 16;
    private static final int TAMANHO_HASH_BITS = 256;
    private static final String ALGORITMO = "PBKDF2WithHmacSHA256";
    private static final SecureRandom ALEATORIO = new SecureRandom();

    private Seguranca() {
    }

    /** Gera o hash de uma senha com sal aleatório. Duas chamadas com a mesma senha geram textos diferentes. */
    public static String gerarHash(String senha) {
        byte[] sal = new byte[TAMANHO_SAL_BYTES];
        ALEATORIO.nextBytes(sal);
        byte[] hash = derivar(senha.toCharArray(), sal, ITERACOES);
        Base64.Encoder base64 = Base64.getEncoder();
        return ITERACOES + "$" + base64.encodeToString(sal) + "$" + base64.encodeToString(hash);
    }

    /** Confere a senha digitada contra o hash guardado, em tempo constante. Nunca lança exceção. */
    public static boolean conferir(String senha, String hashArmazenado) {
        if (senha == null || hashArmazenado == null) {
            return false;
        }
        String[] partes = hashArmazenado.split("\\$");
        if (partes.length != 3) {
            return false;
        }
        try {
            int iteracoes = Integer.parseInt(partes[0]);
            byte[] sal = Base64.getDecoder().decode(partes[1]);
            byte[] esperado = Base64.getDecoder().decode(partes[2]);
            byte[] calculado = derivar(senha.toCharArray(), sal, iteracoes);
            return MessageDigest.isEqual(esperado, calculado);
        } catch (IllegalArgumentException e) {
            // Hash corrompido (número ou Base64 inválido): trata como senha incorreta.
            return false;
        }
    }

    private static byte[] derivar(char[] senha, byte[] sal, int iteracoes) {
        PBEKeySpec especificacao = new PBEKeySpec(senha, sal, iteracoes, TAMANHO_HASH_BITS);
        try {
            return SecretKeyFactory.getInstance(ALGORITMO).generateSecret(especificacao).getEncoded();
        } catch (GeneralSecurityException e) {
            throw new IllegalStateException("Algoritmo de hash indisponível: " + ALGORITMO, e);
        } finally {
            especificacao.clearPassword();
        }
    }
}
