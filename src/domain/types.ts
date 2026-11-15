export type AreaComputador = 'COMUM' | 'VIP';

export type StatusComputador = 'LIVRE' | 'OCUPADO' | 'MANUTENCAO';

export type StatusSessao = 'ATIVA' | 'ENCERRADA';

export type StatusPagamento = 'PENDENTE' | 'CONFIRMADO' | 'ESTORNADO';

export type FormaPagamento = 'PIX' | 'DINHEIRO' | 'DEBITO' | 'CREDITO';

export type CargoFuncionario =
  | 'ADMINISTRADOR'
  | 'RECEPCIONISTA'
  | 'SUPORTE_TECNICO'
  | 'LIMPEZA'
  | 'DESENVOLVEDOR'
  | 'PORTEIRO_ESTACIONAMENTO'
  | 'GUARDA_PATIO';

export type Turno = 'MANHA' | 'TARDE' | 'NOITE';

export type HumorFuncionario = 'RADIANTE' | 'FELIZ' | 'NEUTRO' | 'ESTRESSADO';

export type Permissao =
  | 'GERENCIAR_CLIENTE'
  | 'GERENCIAR_COMPUTADOR'
  | 'MANUTENCAO_COMPUTADOR'
  | 'OPERAR_SESSAO'
  | 'REGISTRAR_PAGAMENTO'
  | 'ESTORNAR_PAGAMENTO'
  | 'GERENCIAR_PRODUTO'
  | 'GERENCIAR_EQUIPE'
  | 'GERAR_RELATORIO'
  | 'CONSULTAR_HISTORICO'
  | 'CONSULTAR_AUDITORIA';

export type SetorMapa =
  | 'RUA'
  | 'RECEPCAO'
  | 'AREA_COMUM'
  | 'AREA_VIP'
  | 'BOMBONIERE'
  | 'MANUTENCAO'
  | 'ESCRITORIO'
  | 'ESTACIONAMENTO';

export interface Cliente {
  id: number;
  nome: string;
  telefone: string;
  identificador: string; // CPF ou RG (RF01)
  criadoEm: string;
  fidelidadePontos: number;
  avatarSeed: number;
}

export interface Computador {
  numero: number;
  identificacao: string;
  area: AreaComputador;
  categoria: 'PC Básico' | 'PC Intermediário' | 'PC Gaming' | 'VIP Station';
  especificacoes: string;
  precoPorHora: number;
  status: StatusComputador;
  sessaoAtivaId: number | null;
  usuarioAtualNome: string | null;
  manutencaoMotivo: string | null;
  totalMinutosUso: number;
}

export interface ItemConsumacao {
  produtoId: number;
  nomeProduto: string;
  quantidade: number;
  precoUnitario: number;
  subtotal: number;
}

export interface Sessao {
  id: number;
  clienteId: number;
  clienteNome: string;
  computadorNumero: number;
  areaComputador: AreaComputador;
  tarifaPorHoraCongelada: number; // Encapsulamento: tarifa congelada na abertura
  inicio: string; // ISO no relógio do sistema
  fim: string | null;
  minutosUtilizados: number;
  valorTempo: number;
  itensConsumo: ItemConsumacao[];
  valorConsumo: number;
  valorTotal: number;
  status: StatusSessao;
  operadorAbertura: string;
  operadorEncerramento: string | null;
  estoqueDevolvido: boolean;
}

export interface Pagamento {
  id: number;
  sessaoId: number;
  clienteNome: string;
  computadorNumero: number;
  valorBruto: number;
  descontoAplicado: number;
  valorFinal: number; // Polimorfismo: PIX calcula 5% de desconto
  forma: FormaPagamento;
  status: StatusPagamento;
  dataHora: string;
  operadorRegistro: string;
  operadorConfirmacao: string | null;
}

export interface Produto {
  id: number;
  nome: string;
  categoria: 'BEBIDA' | 'LANCHE' | 'PERIFERICO';
  preco: number;
  estoque: number;
  vendidos: number;
  icone: 'soda' | 'pizza' | 'energy' | 'coffee' | 'headset' | 'mouse' | 'burger';
}

export interface Funcionario {
  id: number;
  nome: string;
  login: string;
  senhaHash: string; // RNF02: nunca texto puro
  cargo: CargoFuncionario;
  turno: Turno;
  humor: HumorFuncionario;
  trabalhandoAgora: boolean;
  salario: number;
  atendimentosRealizados: number;
  avatarSeed: number;
  permissoes: Permissao[];
}

export interface LogAuditoria {
  id: number;
  momento: string;
  tipo:
    | 'CLIENTE'
    | 'SESSAO'
    | 'PAGAMENTO'
    | 'COMPUTADOR'
    | 'ESTOQUE'
    | 'EQUIPE'
    | 'SEGURANCA'
    | 'SISTEMA';
  operador: string;
  descricao: string;
  regraRelacionada?: string;
}

export interface PersonagemMapa {
  id: string;
  nome: string;
  papel: string;
  ehCliente: boolean;
  setor: SetorMapa;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  acao: string;
  computadorNumero: number | null;
  avatarSeed: number;
  corRoupa: string;
  corCabelo: string;
}

export interface Conquista {
  id: string;
  titulo: string;
  descricao: string;
  categoria: 'GERAL' | 'EXPANSAO' | 'FINANCEIRO' | 'CLIENTES' | 'EQUIPAMENTOS';
  atual: number;
  meta: number;
  recompensaXp: number;
  recompensaDinheiro: number;
  resgatada: boolean;
}

export interface ConfiguracoesJogo {
  volumePrincipal: number;
  volumeEfeitos: number;
  volumeMusica: number;
  ativarVozes: boolean;
  saidaAudio: string;
  velocidadeSimulacao: 0 | 1 | 3 | 8;
  simulacaoAutomatica: boolean;
  mostrarBaloesMapa: boolean;
  mostrarGradePixel: boolean;
  modo24Horas: boolean;
  urlBackendJava: string;
}

export interface LinhaHoraria {
  hora: string;
  chegadas: number;
  ocupacaoPercentual: number;
  faturamento: number;
  cpusUso: number;
  gpusUso: number;
}

export interface RelatorioFinanceiro {
  periodoInicio: string;
  periodoFim: string;
  faturamentoTotalConfirmado: number; // RN09: apenas CONFIRMADOS
  totalPendente: number;
  totalEstornado: number;
  pagamentosConfirmadosCount: number;
  porForma: Record<FormaPagamento, number>;
  totalSessoesPeriodo: number;
  tempoMedioSessaoMinutos: number;
  ticketMedioGastoReal: number; // Média real de gasto por cliente atendido (Ticket Médio)
  gastoMedioPorSessao: number; // Média de gasto real por sessão
  vendasBomboniereConfirmadas: number;
}

export interface MelhoriaEstabelecimento {
  id: string;
  nome: string;
  grupo: 'INFRAESTRUTURA' | 'EQUIPAMENTOS' | 'SERVICOS';
  nivel: number;
  nivelMax: number;
  custoProximo: number;
  ativo: boolean;
  icone: 'electrical' | 'cctv' | 'ac' | 'pc' | 'printer' | 'console' | 'monitor' | 'parking';
  beneficio: string;
}

export type ModalAtivo =
  | null
  | 'COMPUTADORES'
  | 'CLIENTES'
  | 'LOJA'
  | 'MELHORIAS'
  | 'FUNCIONARIOS'
  | 'ESTATISTICAS'
  | 'CONQUISTAS'
  | 'CONFIGURACOES'
  | 'LOGIN'
  | 'ESTACIONAMENTO';

export interface RegistroTicketEstacionamento {
  id: string;
  placa: string;
  vagaId: string;
  modeloCarro: string;
  valor: number;
  horario: string;
}

export interface EstadoEstacionamento {
  tarifaBase: number;
  vagasTotais: number;
  totalVeiculosAtendidos: number;
  receitaEstacionamento: number;
  ultimosTickets: RegistroTicketEstacionamento[];
}
