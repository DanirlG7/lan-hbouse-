# 🎮 LAN HOUSE TYCOON — Front-end Web React Pixel Art (POO)

Interface gráfica Web em **React + TypeScript + HTML5 Canvas 2D** no estilo **Pixel Art Dark-Neon**, construída sob medida para o trabalho acadêmico da disciplina de **Programação Orientada a Objetos (POO)**.

## Como executar o Front-end

```powershell
cd C:\Users\danie\.gemini\antigravity\scratch\lanhouse-pixel-web
npm run dev
```

Acesse `http://localhost:5173` no navegador.

---

## Mapeamento Completo dos Requisitos Acadêmicos

| Código | Requisito / Regra | Onde testar na Interface |
|---|---|---|
| **RF01 / RF02** | Cadastrar e pesquisar clientes (`nome`, `telefone`, `identificador`) | Dock inferior → **Clientes & Caixa** |
| **RF03 / RF04** | Cadastrar PCs (`preço/hora`) e controlar status (`LIVRE`, `OCUPADO`, `MANUTENÇÃO`) | Clique direto nos PCs no mapa 2D ou Dock → **Computadores** |
| **RF05 / RF06 / RF07** | Iniciar sessão, encerrar sessão e calcular valor automático por tempo + tarifa congelada | Dock → **Computadores** (use o botão `+15min` no relógio superior direito para avançar o tempo na hora!) |
| **RF08 / Polimorfismo** | Registrar pagamento (`PIX` com 5% de desconto polimórfico, `Dinheiro`, `Cartão`) | Dock → **Clientes & Caixa** → Aba **Registrar Pagamento** |
| **RF09** | Consultar histórico de sessões de cada cliente | Dock → **Clientes & Caixa** → Clique em qualquer cliente |
| **RF10 / RN09** | Relatório financeiro por período considerando apenas pagamentos `CONFIRMADOS` | Dock → **Estatísticas** → Aba **Relatório Financeiro (RF10 / RN09)** |
| **RF11 / Herança** | Cadastrar e gerenciar funcionários (`Administrador`, `Recepcionista`, `Suporte`, `Limpeza`, `Desenvolvedor`) | Dock → **Equipe** (`[ Contratar Novo ]` e aba `Hierarquia & Permissões POO`) |
| **RF12 / RNF02 / RN10** | Controle de acesso por permissões e senha com hash PBKDF2 | Card superior esquerdo → **`[Trocar Login RF12]`** (senha padrão: `Lan@House2026`) |
| **RN01 / RN05 / RN07 / RN08** | Bloqueio de PC ocupado, PC em manutenção, duplo encerramento e pagamento duplicado | Validados automaticamente com alerta visual no topo indicando o código da regra (`RN01`, `RN05`, `RN07`, `RN08`, `RN10`) |
| **RNF06** | Persistência dos dados após fechar o sistema | Gravação automática em `localStorage` + Exportação/Importação `.JSON` em **Configurações → Dados e Salv.** |

---

## Conexão Opcional com o Backend Java (`JogoLanHouse`)

O arquivo `java-bridge/ServidorHttpLanHouse.java` usa apenas o `HttpServer` nativo do **JDK 17** (sem Maven e sem bibliotecas externas):

1. Copie `java-bridge/ServidorHttpLanHouse.java` para `lanhouse/src/lanhouse/web/ServidorHttpLanHouse.java` no seu projeto Java.
2. Compile o projeto com `compilar.bat` e inicie com `java -cp out lanhouse.web.ServidorHttpLanHouse`.
3. O indicador no topo direito mudará automaticamente para **`● API Java Online`**.
