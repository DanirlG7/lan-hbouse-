# Lan House — Sistema de Gerenciamento (POO em Java)

Sistema de gerenciamento de lan house: clientes, computadores, sessões de uso com cobrança por
minuto, bomboniere com estoque, pagamentos (Pix, dinheiro, débito, crédito), relatório de
faturamento e controle de acesso por cargo. Inclui um **simulador de um dia inteiro** (a lan house
"joga sozinha") e uma **fachada** pronta para um front gráfico ler o que acontece.

Projeto da disciplina de Programação Orientada a Objetos. Os requisitos (RF01–RF12, RNF01–RNF07,
RN01–RN10) e o diagrama de classes UML do enunciado estão mapeados mais abaixo.

## Como rodar

Precisa de **JDK 17 ou mais novo** (`java -version` e `javac -version`). Nada mais: sem Maven, sem
bibliotecas externas, sem servidor.

| O que | Linux / Mac | Windows |
|---|---|---|
| Menu interativo | `./executar.sh` | `executar.bat` |
| Roteiro automático das regras | `./executar.sh --demo` | `executar.bat --demo` |
| Dia inteiro simulado | `./executar.sh --simular` | `executar.bat --simular` |
| Rodar os testes | `./testar.sh` | `testar.bat` |
| Só compilar | `./compilar.sh` | `compilar.bat` |

Opções da simulação: `--semente=N` (mesma semente = mesmo dia), `--verboso` (mostra cada
acontecimento), `--painel=N` (desenha o painel do mundo a cada N minutos simulados). Exemplo:

```
./executar.sh --simular --semente=7 --painel=120
```

**Login do menu interativo:** `carlos.lima` / `Lan@House2026` (Administrador). Todos os
funcionários iniciais usam essa mesma senha de demonstração; os logins estão em
`util/DadosIniciais.java` (por exemplo `fernanda.oliveira`, recepcionista).

> Os scripts do Windows (`.bat`) foram escritos mas **não foram executados** num Windows; tudo
> foi testado em Linux com JDK 17. Se o console mostrar acentos errados, rode `chcp 65001`.

## Estrutura

```
src/lanhouse/
├── Main.java, Contexto.java    ponto de entrada e montagem manual das dependências
├── model/        (22)  entidades e enums: Cliente, Computador, Sessao, Pagamento, Produto,
│                       ItemConsumacao, Relatorio, Funcionario e cargos, FormaPagamento, ...
├── service/      (7)   regras de negócio e permissões (Funcionario, Cliente, Computador,
│                       Produto, Sessao, Pagamento, Relatorio)
├── repository/   (8)   interfaces de armazenamento (uma por entidade) + Repositorios
│   └── memoria/  (8)   implementação em memória, com lock e inserção atômica
├── controller/   (10)  menus de console (uma classe por área)
├── evento/       (3)   eventos publicados pelos serviços (Observer)
├── tempo/        (3)   Relogio: real ou simulado
├── simulacao/    (11)  motor do dia simulado, retrato do mundo, resumo, painel em texto
├── fachada/      (2)   JogoLanHouse: a porta de entrada para o front
├── exception/    (11)  exceções de negócio com código estável
├── util/         (7)   Validador, Formatador, ConsoleIO, AppLog, Seguranca, DadosIniciais, ...
└── demo/         (1)   Demonstracao (roteiro do --demo)
teste/lanhouse/teste/   (9) testes sem framework; `testar.sh` roda todos
```

95 arquivos de código (~5.900 linhas) e 9 de teste (~1.300 linhas).

Fluxo de uma operação: `controller → service → model` (regras) `→ repository` (gravação) e o
serviço publica um **evento** no fim. O controller nunca fala com o repositório; o model nunca
fala com serviço nem repositório.

## Cargos e permissões

| Cargo | Pode |
|---|---|
| Administrador | tudo (inclusive estornar, relatórios, auditoria, cadastrar funcionários, PCs, tarifas e produtos) |
| Recepcionista | clientes, abrir/encerrar sessão, consumo, registrar e confirmar pagamento, histórico, ver equipe |
| Suporte Técnico | mandar/liberar PC de manutenção, histórico |
| Limpeza | mandar/liberar PC de manutenção/limpeza |
| Desenvolvedor / Front-end | consultar histórico e equipe |

Cada cargo é uma subclasse de `Funcionario` e declara as próprias permissões; o resto do sistema
só chama `Funcionario.autorizar(operador, permissao)`. Para criar um cargo novo basta uma classe.

## Requisitos do enunciado → onde estão

| Requisito | Onde |
|---|---|
| RF01/RF02 clientes (cadastro, consulta) | `ClienteService`, `ClienteController` |
| RF03 cadastro de computadores | `ComputadorService.cadastrar` |
| RF04 estado dos PCs (livre/ocupado/manutenção) | `Computador`, `StatusComputador` |
| RF05/RF06 iniciar e encerrar sessão | `SessaoService`, `Sessao` |
| RF07 cálculo do valor | `Sessao.getValorTempo` (minuto iniciado conta inteiro, mínimo 1 min) |
| RF08 pagamento | `PagamentoService`, `Pagamento`, `FormaPagamento` |
| RF09 histórico por cliente | `SessaoService.listarPorCliente` |
| RF10 relatório financeiro | `RelatorioService.gerar` |
| RF11/RF12 funcionários e acesso | `FuncionarioService`, `Funcionario`, `Permissao` |
| RN01/RN05 PC ocupado ou em manutenção | `Computador.ocupar` |
| RN03/RN04 horários e valor | `Sessao` |
| RN06/RN08 pagamento de sessão existente, sem duplicar | `PagamentoService.registrar`, `PagamentoRepository.inserirSeSemPagamentoAtivo` |
| RN07 sessão encerrada não encerra de novo | `Sessao.encerrar` |
| RN09 faturamento só com confirmados | `RelatorioService.gerar` |
| RN10 só autorizados alteram tarifa | `ComputadorService.alterarTarifa` (`GERENCIAR_COMPUTADOR`) |
| RNF02 segurança | senha com PBKDF2 + sal (`Seguranca`), permissões por cargo, mensagem de login genérica |
| RNF03 integridade | PC ocupa-se primeiro (`ocupar`), inserção atômica nos repositórios, estados validados no model |
| RNF05 manutenibilidade | camadas com uma responsabilidade cada |
| **RNF06 persistência** | **não atendido ainda**: os dados ficam em memória (ver "O que falta") |

Acrescentado além do enunciado: bomboniere com estoque e estorno que devolve o estoque (uma vez
por sessão), áreas Comum/VIP com tarifas, turnos, auditoria, eventos, simulação e testes.

## Os quatro pilares da POO, onde aparecem

- **Abstração:** `Funcionario` (abstrata), interfaces de repositório, `Relogio`, `PublicadorEventos`.
- **Encapsulamento:** `Computador` não tem `setStatus` (só `ocupar`, `liberar`, ...); `Sessao`
  congela a tarifa na abertura; `Pagamento` congela os valores; eventos e retratos são imutáveis.
- **Herança:** `Funcionario` → `Administrador`, `Recepcionista`, `SuporteTecnico`, `Limpeza`,
  `Desenvolvedor` → `DesenvolvedorFrontEnd`.
- **Polimorfismo:** `FormaPagamento.calcularTotal` (o Pix sobrescreve com 5% de desconto);
  `Funcionario.getPermissoes()/getCargo()`; repositórios usados pela interface; `Relogio` real ou
  simulado; `Evento` selado com um tipo por fato.

## Simulação e front

`--simular` roda um dia inteiro (08h às 23h55, um minuto por passo). Clientes chegam conforme a
hora do dia, esperam na fila (e desistem), jogam, compram lanche, pagam e vão embora; a recepção
atende, a limpeza higieniza PCs, o suporte conserta, o administrador repõe estoque e estorna. **Tudo
passa pelos mesmos serviços do menu**, então valem as mesmas regras e permissões. O sorteio usa uma
semente: a mesma semente produz exatamente o mesmo dia.

Um front gráfico (por exemplo um jogo em pixel visto de cima) precisa só de `JogoLanHouse`:

```java
JogoLanHouse jogo = JogoLanHouse.novo(2026);   // mesma semente = mesmo dia
while (!jogo.terminou()) {
    jogo.avancar();                            // 1 minuto simulado; o front escolhe a velocidade
    EstadoDoMundo mundo = jogo.estado();       // quem está onde, fazendo o quê; estado dos PCs
    for (EventoRegistrado e : jogo.eventosApos(ultimaVista)) { ... }   // feed incremental
}
ResumoDoDia resumo = jogo.resumo();
```

`EstadoDoMundo` traz personagens com `setor` (Recepção, Área Comum, Área VIP, Bomboniere,
Manutenção, Escritório, Rua), `acao` (texto para o balão) e o PC que usam. É tudo cópia imutável,
seguro de ler de outra thread (`avancar` e a leitura são sincronizados). `RenderizadorTexto`
mostra um exemplo de como consumir esse retrato (`--painel=N`).

## Testes

`./testar.sh` roda 230 verificações em ~12 s: regras de negócio (RN01–RN10, arredondamento, estorno,
permissões), barramento de eventos (inclusive 8 threads), **gravação nos repositórios** (um espião
confere, a cada evento, se algum objeto mudou sem ser gravado), simulação (cinco sementes, um dia
sob estresse, repetibilidade, dinheiro e estoque que fecham, um PC por sessão) e fachada.

Os testes foram validados com defeitos plantados de propósito (estorno que não devolve estoque,
Pix com desconto errado, PC ocupado aceitando sessão, gravação esquecida, sorteio sem semente,
etc.): todos foram detectados.

## Onde mexer para...

| Quero... | Mexa em |
|---|---|
| mudar o desconto do Pix ou criar outra forma de pagamento | `model/FormaPagamento` |
| mudar a tarifa padrão de uma área | `model/AreaComputador` |
| criar um cargo ou mudar permissões | nova subclasse de `Funcionario`; `Permissao` |
| mudar a regra de cobrança por minuto | `Sessao.minutosCobrados` / `getValorTempo` |
| mudar quantos clientes chegam, falhas de PC, estornos | `simulacao/ConfiguracaoSimulacao` |
| mudar a carga inicial (equipe, clientes, PCs, produtos) | `util/DadosIniciais` |
| guardar os dados em banco | nova implementação das interfaces de `repository/`; escolha em `Contexto` |
| reagir a um acontecimento (tela, som, log) | `ctx.eventos().inscrever(...)` ou `JogoLanHouse.eventosApos` |

## O que falta

- **Persistência (RNF06).** Os repositórios estão prontos para trocar (interfaces, e os serviços já
  gravam depois de cada alteração), mas ainda não há banco: ao fechar o programa os dados somem.
  O caminho natural é SQLite via JDBC (sem servidor). Dois pontos a resolver nessa etapa:
  (1) reconstruir `Sessao`, `Pagamento` etc. a partir do banco, o que pede um método de
  restauração nessas classes, e (2) operações em várias etapas (iniciar sessão grava a sessão e o
  PC) pedem transação, senão uma falha no meio deixa os dados inconsistentes.
- **Front gráfico.** Só o texto (`RenderizadorTexto`). A fachada está pronta; a tela não existe.
- **Interface do enunciado (RNF01).** Hoje é console.
- **Pagamentos parciais** (citados na RN08 como exceção): não implementados.
