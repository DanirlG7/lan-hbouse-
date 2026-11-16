# Mudanças em relação ao código recebido

Este arquivo lista tudo que foi alterado ou acrescentado sobre os 67 arquivos enviados (etapa 1,
etapa 2, demonstração), e por quê. Nada foi compilado antes disto; o primeiro `javac` apontou os
problemas da seção 1.

Resultado: **95 arquivos de código + 9 de teste**, compilando sem erros e sem avisos de código
(só o aviso `serial` das exceções) em JDK 17; `./testar.sh` passa as 230 verificações.

## 1. Correções para compilar e para respeitar as regras

Os nomes e assinaturas que as partes enviadas supunham não batiam com o que os models definem.
Corrigido sempre do lado do serviço/controller, sem mexer em regra do model, exceto onde indicado.

| Arquivo | Antes | Depois |
|---|---|---|
| `model/Permissao` | não tinha `GERENCIAR_EQUIPE` | constante acrescentada (cadastrar funcionários) |
| `model/Produto` | `preco` final, sem `atualizarPreco` | `atualizarPreco` criado (preço vale só para consumos futuros; `getPreco` sincronizado) |
| `service/FuncionarioService` | `verificarSenha`, `new AutenticacaoException("...")` | `senhaConfere`, construtor sem argumento |
| `service/ClienteService` | `cliente.atualizarDados` | `cliente.atualizar` |
| `service/ComputadorService` | `GERENCIAR_MANUTENCAO` | `MANUTENCAO_COMPUTADOR` |
| `service/ProdutoService` | `GERENCIAR_ESTOQUE` | `GERENCIAR_PRODUTO` |
| `service/SessaoService` | `new Sessao(...)` sem horário; `encerrar(operador)` | horário vindo do relógio; `encerrar(operador, momento)` |
| `service/PagamentoService` | `Pagamento.criar`, `confirmar()`, `estornar()` | `new Pagamento(...)`, `confirmar(operador, momento)`, `estornar(operador, momento)` |
| `service/PagamentoService` | estorno exigia `REGISTRAR_PAGAMENTO` | exige `ESTORNAR_PAGAMENTO` (só Administrador): a recepcionista conseguia estornar |
| `service/RelatorioService` | `new Relatorio(de, ate, lista)`; exigia `CONSULTAR_HISTORICO` | soma por forma e total para o record; exige `GERAR_RELATORIO`, e a auditoria `CONSULTAR_AUDITORIA` |
| `util/DadosIniciais` | funcionários com CPF/telefone; `new Computador(n, area)` | construtores reais; `Computador(n, area, null)` usa a tarifa padrão |
| `controller/FuncionarioController` | pedia CPF/telefone; construtores errados | construtores reais |
| `controller/RelatorioController`, `demo/Demonstracao` | `relatorio.toString()` (saída ilegível) | `Formatador.relatorio(...)` (novo): período, total por forma, total geral |
| `demo/Demonstracao` | a recepcionista estornava | o estorno é feito pelo Administrador |

## 2. Diferenças em relação à árvore desenhada

- Existe `AutenticacaoController` (são 10 classes em `controller/`, não 9) e `Contexto` na raiz.
- Pacotes novos: `tempo`, `evento`, `simulacao`, `fachada` e `repository/memoria`.
- `RepositorioMemoria` saiu de `repository/` e foi para `repository/memoria/`; em `repository/`
  agora há interfaces.

## 3. Blocos acrescentados

**Relógio injetável (`tempo`).** Nenhuma classe de negócio chama mais `LocalDateTime.now()`:
todas pedem a hora a um `Relogio`. `RelogioReal` no uso normal; `RelogioSimulado` (só avança,
nunca volta) na demonstração e na simulação. `Sessao` recebe o relógio e usa a hora dele como
início; `Pagamento.confirmar/estornar` recebem o momento; o `AppLog` carimba com o relógio do
`Contexto`. Sem isso a demo só conseguia cobrar o mínimo de 1 minuto.

**Eventos (`evento`).** Os serviços publicam um evento *depois* de a operação dar certo (12 tipos:
cliente cadastrado, sessão iniciada/encerrada, consumo, pagamento registrado/confirmado/estornado,
PC cadastrado/em manutenção/liberado, tarifa alterada, produto reabastecido). Os eventos são
registros imutáveis com cópias dos dados, nunca entidades. Operação recusada não publica nada.
Ouvinte que lança exceção não derruba a operação nem os outros ouvintes.

**Repositórios como interfaces.** Uma interface por entidade + `Repositorios` (o conjunto dos seis).
O `Contexto` recebe um `Repositorios`, e é o único lugar que escolhe onde os dados ficam. A carga
inicial só roda se o armazenamento estiver vazio.

**Gravação depois de cada alteração.** Descoberta ao preparar o banco: os serviços nunca chamavam
`salvar` depois de alterar um objeto, o que em memória funciona (mesma instância) mas num banco
perderia tudo. Agora todo ponto de alteração grava: atualizar cliente, manutenção, ocupar/liberar PC,
baixa e devolução de estoque, preço, confirmar/estornar, a marca "estoque devolvido" da sessão.
Quando um serviço mexe num objeto de outra área, ele busca a instância atual no repositório (em
memória é a mesma; num banco a guardada na sessão seria uma cópia). `ComputadorService.persistir` e
`ProdutoService.persistir` existem para isso. Um teste dedicado impede regressão.

**Simulação (`simulacao`) e fachada (`fachada`).** Dia inteiro, um minuto por passo, com sorteio
repetível por semente; tudo passa pelos serviços. `JogoLanHouse` é a porta para o front.

**Lacuna do enunciado fechada.** RF03 (cadastrar computador) e RN10 (alterar tarifa só com
permissão) não estavam expostos: `ComputadorService.cadastrar` e `alterarTarifa`, com menu,
eventos e testes.

## 4. Decisões que valem saber

- Os números de ID "pulam" quando uma inserção condicional é recusada (o ID é reservado antes). É
  inofensivo e vem da decisão original de gerar o ID antes de inserir.
- `AppLog` continua global (estático). Com dois `Contexto` no mesmo programa vale o relógio do
  último. A demo, a simulação e o menu usam um só.
- `GERENCIAR_COMPUTADOR` (antes sem uso) passou a proteger cadastro de PC e tarifa.
- A senha de demonstração (`Lan@House2026`) é a mesma de todos os funcionários iniciais. Troque
  em `DadosIniciais.SENHA_PADRAO` para qualquer uso fora de teste.

## 5. Limitações conhecidas

- Sem banco de dados (RNF06): os dados vivem em memória. Veja "O que falta" no `README.md`.
- Scripts `.bat` não foram executados em Windows.
- Interface só em console; o front gráfico não foi feito.
- Pagamento parcial (RN08, exceção) não implementado.
