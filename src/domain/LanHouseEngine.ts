import {
  AreaComputador,
  CargoFuncionario,
  Cliente,
  Computador,
  ConfiguracoesJogo,
  Conquista,
  EstadoEstacionamento,
  FormaPagamento,
  Funcionario,
  HumorFuncionario,
  ItemConsumacao,
  LinhaHoraria,
  LogAuditoria,
  MelhoriaEstabelecimento,
  Pagamento,
  Permissao,
  PersonagemMapa,
  Produto,
  RegistroTicketEstacionamento,
  RelatorioFinanceiro,
  Sessao,
  SetorMapa,
  Turno,
} from './types';
import { SLOTS_PC } from '../world/layout';

/** Capacidade física exata desenhada no mapa (18 Comuns/Deck + 6 VIP = 24 estações). */
export const MAX_ESTACOES_MAPA = SLOTS_PC.length;

// ============================================================================
// PILARES DA POO APLICADOS NO MOTOR DO DOMÍNIO
// 1. Abstração & Herança: Hierarquia de Funcionários (Base abstrata -> Cargos)
// 2. Polimorfismo: Estratégias de Pagamento (Pix com 5% desconto, Dinheiro, Cartão)
// 3. Encapsulamento: Validação de transições de estado e regras RN01-RN10
// ============================================================================

export class RegraNegocioError extends Error {
  public readonly codigoRegra: string;
  constructor(codigoRegra: string, mensagem: string) {
    super(mensagem);
    this.name = 'RegraNegocioError';
    this.codigoRegra = codigoRegra;
  }
}

/**
 * HERANÇA & POLIMORFISMO: Classe abstrata de Perfil de Funcionário
 * Espelha lanhouse.model.Funcionario e suas subclasses no Java.
 */
export abstract class PerfilCargoPOO {
  abstract readonly cargo: CargoFuncionario;
  abstract readonly nomeExibicao: string;
  abstract readonly salarioBase: number;
  abstract obterPermissoes(): Permissao[];

  public possuiPermissao(p: Permissao): boolean {
    return this.obterPermissoes().includes(p);
  }
}

export class CargoAdministrador extends PerfilCargoPOO {
  readonly cargo: CargoFuncionario = 'ADMINISTRADOR';
  readonly nomeExibicao = 'Administrador';
  readonly salarioBase = 4200;
  obterPermissoes(): Permissao[] {
    return [
      'GERENCIAR_CLIENTE',
      'GERENCIAR_COMPUTADOR',
      'MANUTENCAO_COMPUTADOR',
      'OPERAR_SESSAO',
      'REGISTRAR_PAGAMENTO',
      'ESTORNAR_PAGAMENTO',
      'GERENCIAR_PRODUTO',
      'GERENCIAR_EQUIPE',
      'GERAR_RELATORIO',
      'CONSULTAR_HISTORICO',
      'CONSULTAR_AUDITORIA',
    ];
  }
}

export class CargoRecepcionista extends PerfilCargoPOO {
  readonly cargo: CargoFuncionario = 'RECEPCIONISTA';
  readonly nomeExibicao = 'Atendente / Recepção';
  readonly salarioBase = 2150;
  obterPermissoes(): Permissao[] {
    return [
      'GERENCIAR_CLIENTE',
      'OPERAR_SESSAO',
      'REGISTRAR_PAGAMENTO',
      'CONSULTAR_HISTORICO',
    ];
  }
}

export class CargoSuporteTecnico extends PerfilCargoPOO {
  readonly cargo: CargoFuncionario = 'SUPORTE_TECNICO';
  readonly nomeExibicao = 'Suporte Técnico';
  readonly salarioBase = 2650;
  obterPermissoes(): Permissao[] {
    return ['MANUTENCAO_COMPUTADOR', 'CONSULTAR_HISTORICO'];
  }
}

export class CargoLimpeza extends PerfilCargoPOO {
  readonly cargo: CargoFuncionario = 'LIMPEZA';
  readonly nomeExibicao = 'Limpeza';
  readonly salarioBase = 1850;
  obterPermissoes(): Permissao[] {
    return ['MANUTENCAO_COMPUTADOR'];
  }
}

export class CargoDesenvolvedor extends PerfilCargoPOO {
  readonly cargo: CargoFuncionario = 'DESENVOLVEDOR';
  readonly nomeExibicao = 'Desenvolvedor';
  readonly salarioBase = 3500;
  obterPermissoes(): Permissao[] {
    return ['CONSULTAR_HISTORICO'];
  }
}

export class CargoPorteiroEstacionamento extends PerfilCargoPOO {
  readonly cargo: CargoFuncionario = 'PORTEIRO_ESTACIONAMENTO';
  readonly nomeExibicao = 'Porteiro do Estac.';
  readonly salarioBase = 2050;
  obterPermissoes(): Permissao[] {
    return ['OPERAR_SESSAO', 'REGISTRAR_PAGAMENTO', 'CONSULTAR_HISTORICO'];
  }
}

export class CargoGuardaPatio extends PerfilCargoPOO {
  readonly cargo: CargoFuncionario = 'GUARDA_PATIO';
  readonly nomeExibicao = 'Guarda de Pátio';
  readonly salarioBase = 2200;
  obterPermissoes(): Permissao[] {
    return ['MANUTENCAO_COMPUTADOR', 'CONSULTAR_HISTORICO'];
  }
}

export const FABRICA_CARGOS: Record<CargoFuncionario, PerfilCargoPOO> = {
  ADMINISTRADOR: new CargoAdministrador(),
  RECEPCIONISTA: new CargoRecepcionista(),
  SUPORTE_TECNICO: new CargoSuporteTecnico(),
  LIMPEZA: new CargoLimpeza(),
  DESENVOLVEDOR: new CargoDesenvolvedor(),
  PORTEIRO_ESTACIONAMENTO: new CargoPorteiroEstacionamento(),
  GUARDA_PATIO: new CargoGuardaPatio(),
};

/**
 * POLIMORFISMO: Cálculo de pagamento conforme a forma escolhida.
 * No backend Java (FormaPagamento.PIX), o Pix concede 5% de desconto.
 */
export abstract class ProcessadorFormaPagamento {
  abstract readonly forma: FormaPagamento;
  abstract readonly descricao: string;
  abstract calcularTotal(valorBruto: number): { desconto: number; valorFinal: number };
}

export class PagamentoPix extends ProcessadorFormaPagamento {
  readonly forma: FormaPagamento = 'PIX';
  readonly descricao = 'Pix (5% OFF)';
  calcularTotal(valorBruto: number) {
    const desconto = Number((valorBruto * 0.05).toFixed(2));
    const valorFinal = Number((valorBruto - desconto).toFixed(2));
    return { desconto, valorFinal };
  }
}

export class PagamentoDinheiro extends ProcessadorFormaPagamento {
  readonly forma: FormaPagamento = 'DINHEIRO';
  readonly descricao = 'Dinheiro';
  calcularTotal(valorBruto: number) {
    return { desconto: 0, valorFinal: Number(valorBruto.toFixed(2)) };
  }
}

export class PagamentoCartaoDebito extends ProcessadorFormaPagamento {
  readonly forma: FormaPagamento = 'DEBITO';
  readonly descricao = 'Cartão Débito';
  calcularTotal(valorBruto: number) {
    return { desconto: 0, valorFinal: Number(valorBruto.toFixed(2)) };
  }
}

export class PagamentoCartaoCredito extends ProcessadorFormaPagamento {
  readonly forma: FormaPagamento = 'CREDITO';
  readonly descricao = 'Cartão Crédito';
  calcularTotal(valorBruto: number) {
    return { desconto: 0, valorFinal: Number(valorBruto.toFixed(2)) };
  }
}

export const PROCESSADORES_PAGAMENTO: Record<FormaPagamento, ProcessadorFormaPagamento> = {
  PIX: new PagamentoPix(),
  DINHEIRO: new PagamentoDinheiro(),
  DEBITO: new PagamentoCartaoDebito(),
  CREDITO: new PagamentoCartaoCredito(),
};

// Simulação simples de Hash seguro estilo PBKDF2 (RNF02)
export function gerarHashSenha(senha: string): string {
  let hash = 2166136261;
  const tempero = `LANHOUSE_SALT_2026::${senha}`;
  for (let i = 0; i < tempero.length; i++) {
    hash ^= tempero.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `pbkdf2$sha256$${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

export interface EstadoCompletoLanHouse {
  relogioIso: string;
  caixaSaldo: number;
  reputacao: number;
  nivelGerente: number;
  xpAtual: number;
  xpProximoNivel: number;
  operadorLogadoId: number;
  clientes: Cliente[];
  computadores: Computador[];
  sessoes: Sessao[];
  pagamentos: Pagamento[];
  produtos: Produto[];
  funcionarios: Funcionario[];
  auditoria: LogAuditoria[];
  personagens: PersonagemMapa[];
  melhorias: MelhoriaEstabelecimento[];
  conquistasResgatadas: string[];
  historicoHorario: LinhaHoraria[];
  configuracoes: ConfiguracoesJogo;
  estacionamento: EstadoEstacionamento;
}

const STORAGE_KEY = 'lanhouse_poo_pixel_save_v3';

// Coordenadas exatas alinhadas às bancadas de PCs da arte HD-2D (Imagem 11 - 1280x760)
/** 6 novas estações do Deck Gamer (Ala Oeste): PC-19 a PC-24 */
function criarPcsDeck(): Computador[] {
  const base = (
    numero: number,
    categoria: Computador['categoria'],
    especificacoes: string,
    preco: number
  ): Computador => ({
    numero,
    identificacao: `PC-${String(numero).padStart(2, '0')}`,
    area: 'COMUM',
    categoria,
    especificacoes,
    precoPorHora: preco,
    status: 'LIVRE',
    sessaoAtivaId: null,
    usuarioAtualNome: null,
    manutencaoMotivo: null,
    totalMinutosUso: 0,
  });
  return [
    base(19, 'PC Gaming', 'i7 13700K • 32GB • RTX 4060 Ti', 12.0),
    base(20, 'PC Gaming', 'i7 13700K • 32GB • RTX 4060 Ti', 12.0),
    base(21, 'PC Intermediário', 'Ryzen 5 5600X • 16GB • RTX 3060', 10.0),
    base(22, 'PC Intermediário', 'Ryzen 5 5600X • 16GB • RTX 3060', 10.0),
    base(23, 'PC Básico', 'i5 12400F • 16GB • GTX 1660', 8.0),
    base(24, 'PC Básico', 'i5 12400F • 16GB • GTX 1660', 8.0),
  ];
}

export function coordenadasDoPc(numeroPc: number): { x: number; y: number } {
  if (numeroPc <= 8) {
    // Ilha Principal Esquerda: 2 fileiras de 4 bancadas
    const idx = numeroPc - 1;
    const col = idx % 4;
    const row = Math.floor(idx / 4);
    return { x: 392 + col * 58, y: 432 + row * 72 };
  } else {
    // Ilha Direita (Arena / VIP): 2 colunas de bancadas
    const idx = (numeroPc - 9) % 4;
    const col = Math.floor(idx / 2);
    const row = idx % 2;
    return { x: 702 + col * 158, y: 405 + row * 78 };
  }
}

export function coordenadasDoSetor(setor: SetorMapa, indice = 0): { x: number; y: number } {
  switch (setor) {
    case 'RECEPCAO':
      return { x: 585 + (indice % 3) * 32, y: 245 + (indice % 2) * 24 };
    case 'BOMBONIERE':
      return { x: 1035 + (indice % 2) * 44, y: 235 + (indice % 2) * 26 };
    case 'MANUTENCAO':
      return { x: 865 + (indice % 2) * 38, y: 225 + (indice % 2) * 24 };
    case 'ESCRITORIO':
      return { x: 365 + (indice % 2) * 36, y: 235 };
    case 'AREA_VIP':
      return { x: 1035 + (indice % 2) * 38, y: 545 };
    case 'AREA_COMUM':
      return { x: 520 + (indice % 3) * 55, y: 400 };
    case 'ESTACIONAMENTO':
      return { x: 87.2 * 32, y: (48.6 - (indice % 2) * 6) * 32 };
    case 'RUA':
    default:
      return { x: 580 + ((indice * 95) % 240), y: 665 + (indice % 2) * 22 };
  }
}

export function criarDadosIniciais(): EstadoCompletoLanHouse {
  const senhaPadraoHash = gerarHashSenha('Lan@House2026');

  const funcionarios: Funcionario[] = [
    {
      id: 1,
      nome: 'Daniel (Admin)',
      login: 'carlos.lima',
      senhaHash: senhaPadraoHash,
      cargo: 'ADMINISTRADOR',
      turno: 'MANHA',
      humor: 'RADIANTE',
      trabalhandoAgora: true,
      salario: 4200,
      atendimentosRealizados: 48,
      avatarSeed: 1,
      permissoes: FABRICA_CARGOS.ADMINISTRADOR.obterPermissoes(),
    },
    {
      id: 2,
      nome: 'Ana Silva',
      login: 'ana.silva',
      senhaHash: senhaPadraoHash,
      cargo: 'RECEPCIONISTA',
      turno: 'TARDE',
      humor: 'FELIZ',
      trabalhandoAgora: true,
      salario: 2150,
      atendimentosRealizados: 92,
      avatarSeed: 2,
      permissoes: FABRICA_CARGOS.RECEPCIONISTA.obterPermissoes(),
    },
    {
      id: 3,
      nome: 'Fernanda Oliveira',
      login: 'fernanda.oliveira',
      senhaHash: senhaPadraoHash,
      cargo: 'RECEPCIONISTA',
      turno: 'MANHA',
      humor: 'FELIZ',
      trabalhandoAgora: true,
      salario: 2150,
      atendimentosRealizados: 76,
      avatarSeed: 6,
      permissoes: FABRICA_CARGOS.RECEPCIONISTA.obterPermissoes(),
    },
    {
      id: 4,
      nome: 'Lucas Ribeiro',
      login: 'lucas.ribeiro',
      senhaHash: senhaPadraoHash,
      cargo: 'SUPORTE_TECNICO',
      turno: 'TARDE',
      humor: 'RADIANTE',
      trabalhandoAgora: true,
      salario: 2650,
      atendimentosRealizados: 34,
      avatarSeed: 4,
      permissoes: FABRICA_CARGOS.SUPORTE_TECNICO.obterPermissoes(),
    },
    {
      id: 5,
      nome: 'Bruno Costa',
      login: 'bruno.costa',
      senhaHash: senhaPadraoHash,
      cargo: 'SUPORTE_TECNICO',
      turno: 'NOITE',
      humor: 'NEUTRO',
      trabalhandoAgora: false,
      salario: 2650,
      atendimentosRealizados: 29,
      avatarSeed: 3,
      permissoes: FABRICA_CARGOS.SUPORTE_TECNICO.obterPermissoes(),
    },
    {
      id: 6,
      nome: 'Carla Mendes',
      login: 'carla.mendes',
      senhaHash: senhaPadraoHash,
      cargo: 'LIMPEZA',
      turno: 'MANHA',
      humor: 'ESTRESSADO',
      trabalhandoAgora: true,
      salario: 1850,
      atendimentosRealizados: 41,
      avatarSeed: 5,
      permissoes: FABRICA_CARGOS.LIMPEZA.obterPermissoes(),
    },
    {
      id: 7,
      nome: 'Mariana Lima',
      login: 'mariana.lima',
      senhaHash: senhaPadraoHash,
      cargo: 'RECEPCIONISTA',
      turno: 'MANHA',
      humor: 'FELIZ',
      trabalhandoAgora: true,
      salario: 2250,
      atendimentosRealizados: 110,
      avatarSeed: 7,
      permissoes: FABRICA_CARGOS.RECEPCIONISTA.obterPermissoes(),
    },
    {
      id: 8,
      nome: 'Diego Martins',
      login: 'diego.martins',
      senhaHash: senhaPadraoHash,
      cargo: 'DESENVOLVEDOR',
      turno: 'NOITE',
      humor: 'FELIZ',
      trabalhandoAgora: false,
      salario: 3500,
      atendimentosRealizados: 15,
      avatarSeed: 8,
      permissoes: FABRICA_CARGOS.DESENVOLVEDOR.obterPermissoes(),
    },
    {
      id: 9,
      nome: 'Roberto Porteiro',
      login: 'roberto.portaria',
      senhaHash: senhaPadraoHash,
      cargo: 'PORTEIRO_ESTACIONAMENTO',
      turno: 'MANHA',
      humor: 'FELIZ',
      trabalhandoAgora: true,
      salario: 2050,
      atendimentosRealizados: 24,
      avatarSeed: 9,
      permissoes: FABRICA_CARGOS.PORTEIRO_ESTACIONAMENTO.obterPermissoes(),
    },
    {
      id: 10,
      nome: 'Cabo Henrique',
      login: 'henrique.patio',
      senhaHash: senhaPadraoHash,
      cargo: 'GUARDA_PATIO',
      turno: 'TARDE',
      humor: 'FELIZ',
      trabalhandoAgora: true,
      salario: 2200,
      atendimentosRealizados: 19,
      avatarSeed: 10,
      permissoes: FABRICA_CARGOS.GUARDA_PATIO.obterPermissoes(),
    },
  ];

  const clientes: Cliente[] = [
    { id: 1, nome: 'Gabriel Rocha', telefone: '(11) 99812-3401', identificador: '412.889.102-44', criadoEm: '2026-04-18T10:00:00', fidelidadePontos: 140, avatarSeed: 11 },
    { id: 2, nome: 'Juliana Alves', telefone: '(11) 98745-1190', identificador: '389.204.551-19', criadoEm: '2026-04-18T14:20:00', fidelidadePontos: 220, avatarSeed: 12 },
    { id: 3, nome: 'Matheus Cardoso', telefone: '(11) 99123-7788', identificador: '501.334.890-02', criadoEm: '2026-04-19T09:15:00', fidelidadePontos: 85, avatarSeed: 13 },
    { id: 4, nome: 'Larissa Ferreira', telefone: '(11) 99654-2091', identificador: '298.761.430-80', criadoEm: '2026-04-19T16:40:00', fidelidadePontos: 310, avatarSeed: 14 },
    { id: 5, nome: 'Pedro Henrique', telefone: '(11) 98441-9032', identificador: '477.112.908-65', criadoEm: '2026-04-20T11:10:00', fidelidadePontos: 60, avatarSeed: 15 },
    { id: 6, nome: 'Camila Souza', telefone: '(11) 99310-6543', identificador: '355.908.221-37', criadoEm: '2026-04-20T18:05:00', fidelidadePontos: 195, avatarSeed: 16 },
    { id: 7, nome: 'Thiago Nascimento', telefone: '(11) 98229-4410', identificador: '419.650.773-91', criadoEm: '2026-04-21T07:50:00', fidelidadePontos: 50, avatarSeed: 17 },
    { id: 8, nome: 'Beatriz Duarte', telefone: '(11) 99410-8821', identificador: '522.104.889-12', criadoEm: '2026-04-21T07:55:00', fidelidadePontos: 175, avatarSeed: 18 },
    { id: 9, nome: 'Gustavo Mendes', telefone: '(11) 98119-3302', identificador: '618.402.119-05', criadoEm: '2026-04-21T08:00:00', fidelidadePontos: 120, avatarSeed: 19 },
    { id: 10, nome: 'Amanda Ribeiro', telefone: '(11) 99772-5510', identificador: '309.882.441-77', criadoEm: '2026-04-21T08:02:00', fidelidadePontos: 260, avatarSeed: 20 },
    { id: 11, nome: 'Felipe Santana', telefone: '(11) 98554-1029', identificador: '445.990.312-60', criadoEm: '2026-04-21T08:05:00', fidelidadePontos: 95, avatarSeed: 21 },
    { id: 12, nome: 'Rafael Oliveira', telefone: '(11) 99241-1804', identificador: '371.428.905-11', criadoEm: '2026-04-21T08:10:00', fidelidadePontos: 155, avatarSeed: 22 },
    { id: 13, nome: 'Isabela Costa', telefone: '(11) 98613-7740', identificador: '519.204.338-27', criadoEm: '2026-04-21T08:15:00', fidelidadePontos: 210, avatarSeed: 23 },
    { id: 14, nome: 'Vinícius Araujo', telefone: '(11) 99180-6623', identificador: '604.778.120-93', criadoEm: '2026-04-21T08:20:00', fidelidadePontos: 130, avatarSeed: 24 },
    { id: 15, nome: 'Mariana Tavares', telefone: '(11) 98377-4920', identificador: '288.519.740-08', criadoEm: '2026-04-21T08:25:00', fidelidadePontos: 185, avatarSeed: 25 },
    { id: 16, nome: 'Caio Henrique', telefone: '(11) 99502-8145', identificador: '490.312.665-54', criadoEm: '2026-04-21T08:30:00', fidelidadePontos: 240, avatarSeed: 26 },
    { id: 17, nome: 'Letícia Barbosa', telefone: '(11) 98891-3319', identificador: '335.640.812-71', criadoEm: '2026-04-21T08:35:00', fidelidadePontos: 165, avatarSeed: 27 },
    { id: 18, nome: 'Igor Nogueira', telefone: '(11) 99467-2055', identificador: '572.901.448-39', criadoEm: '2026-04-21T08:40:00', fidelidadePontos: 290, avatarSeed: 28 },
    { id: 19, nome: 'Bianca Azevedo', telefone: '(11) 98144-9072', identificador: '403.719.225-62', criadoEm: '2026-04-21T08:45:00', fidelidadePontos: 115, avatarSeed: 29 },
    { id: 20, nome: 'Henrique Pires', telefone: '(11) 99708-5130', identificador: '629.184.507-84', criadoEm: '2026-04-21T08:50:00', fidelidadePontos: 205, avatarSeed: 30 },
    { id: 21, nome: 'Natália Gomes', telefone: '(11) 98490-6218', identificador: '362.805.914-15', criadoEm: '2026-04-21T08:55:00', fidelidadePontos: 90, avatarSeed: 31 },
    { id: 22, nome: 'Eduardo Farias', telefone: '(11) 99611-4807', identificador: '481.290.633-46', criadoEm: '2026-04-21T09:00:00', fidelidadePontos: 145, avatarSeed: 32 },
    { id: 23, nome: 'Otávio Rocha', telefone: '(11) 99210-4418', identificador: '509.418.220-70', criadoEm: '2026-04-21T09:05:00', fidelidadePontos: 170, avatarSeed: 33 },
    { id: 24, nome: 'Sabrina Lima', telefone: '(11) 98732-1940', identificador: '614.205.778-31', criadoEm: '2026-04-21T09:10:00', fidelidadePontos: 215, avatarSeed: 34 },
    { id: 25, nome: 'Murilo Costa', telefone: '(11) 99388-5501', identificador: '390.617.842-99', criadoEm: '2026-04-21T09:15:00', fidelidadePontos: 125, avatarSeed: 35 },
    { id: 26, nome: 'Evelyn Dias', telefone: '(11) 98109-7734', identificador: '471.930.125-68', criadoEm: '2026-04-21T09:20:00', fidelidadePontos: 160, avatarSeed: 36 },
    { id: 27, nome: 'Luana Martins', telefone: '(11) 98711-2045', identificador: '312.459.881-04', criadoEm: '2026-04-21T09:25:00', fidelidadePontos: 195, avatarSeed: 37 },
    { id: 28, nome: 'Lucas Silveira', telefone: '(11) 99342-8871', identificador: '489.102.347-19', criadoEm: '2026-04-21T09:30:00', fidelidadePontos: 140, avatarSeed: 38 },
    { id: 29, nome: 'Thiago Ribeiro', telefone: '(11) 98219-4509', identificador: '521.803.964-55', criadoEm: '2026-04-21T09:35:00', fidelidadePontos: 220, avatarSeed: 39 },
    { id: 30, nome: 'Paula Mendes', telefone: '(11) 99650-1123', identificador: '367.914.502-83', criadoEm: '2026-04-21T09:40:00', fidelidadePontos: 175, avatarSeed: 40 },
    { id: 31, nome: 'Bruno Castro', telefone: '(11) 98904-7732', identificador: '440.671.298-61', criadoEm: '2026-04-21T09:45:00', fidelidadePontos: 130, avatarSeed: 41 },
    { id: 32, nome: 'Gabriela Souza', telefone: '(11) 99175-3380', identificador: '583.210.479-72', criadoEm: '2026-04-21T09:50:00', fidelidadePontos: 260, avatarSeed: 42 },
    { id: 33, nome: 'Rodrigo Lima', telefone: '(11) 98433-6617', identificador: '418.590.312-90', criadoEm: '2026-04-21T09:55:00', fidelidadePontos: 110, avatarSeed: 43 },
    { id: 34, nome: 'Yasmin Duarte', telefone: '(11) 99781-9940', identificador: '602.748.193-44', criadoEm: '2026-04-21T10:00:00', fidelidadePontos: 205, avatarSeed: 44 },
    { id: 35, nome: 'Marcelo Vieira', telefone: '(11) 98320-5561', identificador: '375.829.401-26', criadoEm: '2026-04-21T10:05:00', fidelidadePontos: 150, avatarSeed: 45 },
    { id: 36, nome: 'Clara Nogueira', telefone: '(11) 99564-2208', identificador: '496.137.850-38', criadoEm: '2026-04-21T10:10:00', fidelidadePontos: 185, avatarSeed: 46 },
  ];

  const computadores: Computador[] = [
    // Fileira 1 da Arena Principal (PC-01 a PC-04)
    { numero: 1, identificacao: 'PC-01', area: 'COMUM', categoria: 'PC Básico', especificacoes: 'i5 12400F • 16GB • GTX 1660', precoPorHora: 8.0, status: 'OCUPADO', sessaoAtivaId: 103, usuarioAtualNome: 'Gabriel Rocha', manutencaoMotivo: null, totalMinutosUso: 420 },
    { numero: 2, identificacao: 'PC-02', area: 'COMUM', categoria: 'PC Básico', especificacoes: 'i5 12400F • 16GB • GTX 1660', precoPorHora: 8.0, status: 'OCUPADO', sessaoAtivaId: 112, usuarioAtualNome: 'Rafael Oliveira', manutencaoMotivo: null, totalMinutosUso: 345 },
    { numero: 3, identificacao: 'PC-03', area: 'COMUM', categoria: 'PC Intermediário', especificacoes: 'Ryzen 5 5600X • 16GB • RTX 3060', precoPorHora: 10.0, status: 'MANUTENCAO', sessaoAtivaId: null, usuarioAtualNome: null, manutencaoMotivo: 'Troca de pasta térmica / limpeza', totalMinutosUso: 515 },
    { numero: 4, identificacao: 'PC-04', area: 'COMUM', categoria: 'PC Intermediário', especificacoes: 'Ryzen 5 5600X • 16GB • RTX 3060', precoPorHora: 10.0, status: 'OCUPADO', sessaoAtivaId: 104, usuarioAtualNome: 'Matheus Cardoso', manutencaoMotivo: null, totalMinutosUso: 390 },
    // Fileira 2 da Arena Principal (PC-05 a PC-08)
    { numero: 5, identificacao: 'PC-05', area: 'COMUM', categoria: 'PC Gaming', especificacoes: 'i7 13700K • 32GB • RTX 4060 Ti', precoPorHora: 12.0, status: 'OCUPADO', sessaoAtivaId: 121, usuarioAtualNome: 'Natália Gomes', manutencaoMotivo: null, totalMinutosUso: 640 },
    { numero: 6, identificacao: 'PC-06', area: 'COMUM', categoria: 'PC Gaming', especificacoes: 'i7 13700K • 32GB • RTX 4060 Ti', precoPorHora: 12.0, status: 'OCUPADO', sessaoAtivaId: 105, usuarioAtualNome: 'Camila Souza', manutencaoMotivo: null, totalMinutosUso: 480 },
    { numero: 7, identificacao: 'PC-07', area: 'COMUM', categoria: 'PC Intermediário', especificacoes: 'Ryzen 5 5600X • 16GB • RTX 3060', precoPorHora: 10.0, status: 'OCUPADO', sessaoAtivaId: 113, usuarioAtualNome: 'Isabela Costa', manutencaoMotivo: null, totalMinutosUso: 305 },
    { numero: 8, identificacao: 'PC-08', area: 'COMUM', categoria: 'PC Gaming', especificacoes: 'i7 13700K • 32GB • RTX 4060 Ti', precoPorHora: 12.0, status: 'OCUPADO', sessaoAtivaId: 108, usuarioAtualNome: 'Beatriz Duarte', manutencaoMotivo: null, totalMinutosUso: 410 },
    // Fileira 3 da Arena Principal (PC-09 a PC-12)
    { numero: 9, identificacao: 'PC-09', area: 'COMUM', categoria: 'PC Gaming', especificacoes: 'Ryzen 7 5700X • 32GB • RTX 4060', precoPorHora: 12.0, status: 'OCUPADO', sessaoAtivaId: 122, usuarioAtualNome: 'Eduardo Farias', manutencaoMotivo: null, totalMinutosUso: 350 },
    { numero: 10, identificacao: 'PC-10', area: 'COMUM', categoria: 'PC Gaming', especificacoes: 'Ryzen 7 5700X • 32GB • RTX 4060', precoPorHora: 12.0, status: 'OCUPADO', sessaoAtivaId: 109, usuarioAtualNome: 'Gustavo Mendes', manutencaoMotivo: null, totalMinutosUso: 505 },
    { numero: 11, identificacao: 'PC-11', area: 'COMUM', categoria: 'PC Intermediário', especificacoes: 'Ryzen 5 5600X • 16GB • RTX 3060', precoPorHora: 10.0, status: 'OCUPADO', sessaoAtivaId: 110, usuarioAtualNome: 'Felipe Santana', manutencaoMotivo: null, totalMinutosUso: 290 },
    { numero: 12, identificacao: 'PC-12', area: 'COMUM', categoria: 'PC Básico', especificacoes: 'i5 12400F • 16GB • GTX 1660', precoPorHora: 8.0, status: 'OCUPADO', sessaoAtivaId: 114, usuarioAtualNome: 'Vinícius Araujo', manutencaoMotivo: null, totalMinutosUso: 280 },
    // Arena VIP Pro-Gaming Championship (VIP-13 a VIP-18)
    { numero: 13, identificacao: 'VIP-13', area: 'VIP', categoria: 'VIP Station', especificacoes: 'Ryzen 7 7800X3D • 32GB • RTX 4080 • 240Hz', precoPorHora: 18.0, status: 'OCUPADO', sessaoAtivaId: 106, usuarioAtualNome: 'Juliana Alves', manutencaoMotivo: null, totalMinutosUso: 590 },
    { numero: 14, identificacao: 'VIP-14', area: 'VIP', categoria: 'VIP Station', especificacoes: 'Ryzen 7 7800X3D • 32GB • RTX 4080 • 240Hz', precoPorHora: 18.0, status: 'OCUPADO', sessaoAtivaId: 115, usuarioAtualNome: 'Mariana Tavares', manutencaoMotivo: null, totalMinutosUso: 495 },
    { numero: 15, identificacao: 'VIP-15', area: 'VIP', categoria: 'VIP Station', especificacoes: 'i9 14900K • 64GB • RTX 4090 • 360Hz', precoPorHora: 22.0, status: 'OCUPADO', sessaoAtivaId: 123, usuarioAtualNome: 'Otávio Rocha', manutencaoMotivo: null, totalMinutosUso: 410 },
    { numero: 16, identificacao: 'VIP-16', area: 'VIP', categoria: 'VIP Station', especificacoes: 'i9 14900K • 64GB • RTX 4090 • 360Hz', precoPorHora: 22.0, status: 'OCUPADO', sessaoAtivaId: 107, usuarioAtualNome: 'Larissa Ferreira', manutencaoMotivo: null, totalMinutosUso: 530 },
    { numero: 17, identificacao: 'VIP-17', area: 'VIP', categoria: 'VIP Station', especificacoes: 'i9 14900K • 64GB • RTX 4090 • 360Hz', precoPorHora: 22.0, status: 'OCUPADO', sessaoAtivaId: 111, usuarioAtualNome: 'Amanda Ribeiro', manutencaoMotivo: null, totalMinutosUso: 615 },
    { numero: 18, identificacao: 'VIP-18', area: 'VIP', categoria: 'VIP Station', especificacoes: 'Ryzen 7 7800X3D • 32GB • RTX 4080 • 240Hz', precoPorHora: 18.0, status: 'OCUPADO', sessaoAtivaId: 116, usuarioAtualNome: 'Caio Henrique', manutencaoMotivo: null, totalMinutosUso: 390 },
  ];
  const pcsDeck = criarPcsDeck();
  const ocupadosDeck: Record<number, { sessaoId: number; nome: string; mins: number }> = {
    19: { sessaoId: 117, nome: 'Letícia Barbosa', mins: 260 },
    20: { sessaoId: 118, nome: 'Igor Nogueira', mins: 310 },
    21: { sessaoId: 124, nome: 'Sabrina Lima', mins: 240 },
    22: { sessaoId: 119, nome: 'Bianca Azevedo', mins: 215 },
    24: { sessaoId: 120, nome: 'Henrique Pires', mins: 180 },
  };
  pcsDeck.forEach((pc) => {
    const info = ocupadosDeck[pc.numero];
    if (info) {
      pc.status = 'OCUPADO';
      pc.sessaoAtivaId = info.sessaoId;
      pc.usuarioAtualNome = info.nome;
      pc.totalMinutosUso = info.mins;
    }
  });
  computadores.push(...pcsDeck);

  const produtos: Produto[] = [
    { id: 1, nome: 'Soda Neon Lata', categoria: 'BEBIDA', preco: 6.5, estoque: 42, vendidos: 128, icone: 'soda' },
    { id: 2, nome: 'Fatia Pizza Calabresa', categoria: 'LANCHE', preco: 12.0, estoque: 24, vendidos: 95, icone: 'pizza' },
    { id: 3, nome: 'Energético Turbo 473ml', categoria: 'BEBIDA', preco: 14.0, estoque: 30, vendidos: 84, icone: 'energy' },
    { id: 4, nome: 'Combo Burger Pixel', categoria: 'LANCHE', preco: 24.0, estoque: 18, vendidos: 52, icone: 'burger' },
    { id: 5, nome: 'Café Expresso Gamer', categoria: 'BEBIDA', preco: 5.0, estoque: 50, vendidos: 110, icone: 'coffee' },
    { id: 6, nome: 'Headset RGB Pro (Locação/Venda)', categoria: 'PERIFERICO', preco: 45.0, estoque: 12, vendidos: 19, icone: 'headset' },
    { id: 7, nome: 'Mousepad Speed XL', categoria: 'PERIFERICO', preco: 35.0, estoque: 15, vendidos: 23, icone: 'mouse' },
  ];

  // Sessões históricas encerradas + sessões ativas no momento (15:30)
  const sessoes: Sessao[] = [
    {
      id: 101,
      clienteId: 5,
      clienteNome: 'Pedro Henrique',
      computadorNumero: 5,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 12.0,
      inicio: '2026-04-21T13:45:00',
      fim: '2026-04-21T15:00:00',
      minutosUtilizados: 75,
      valorTempo: 15.0,
      itensConsumo: [{ produtoId: 1, nomeProduto: 'Soda Neon Lata', quantidade: 2, precoUnitario: 6.5, subtotal: 13.0 }],
      valorConsumo: 13.0,
      valorTotal: 28.0,
      status: 'ENCERRADA',
      operadorAbertura: 'Fernanda Oliveira',
      operadorEncerramento: 'Fernanda Oliveira',
      estoqueDevolvido: false,
    },
    {
      id: 102,
      clienteId: 7,
      clienteNome: 'Thiago Nascimento',
      computadorNumero: 10,
      areaComputador: 'VIP',
      tarifaPorHoraCongelada: 18.0,
      inicio: '2026-04-21T14:10:00',
      fim: '2026-04-21T15:10:00',
      minutosUtilizados: 60,
      valorTempo: 18.0,
      itensConsumo: [{ produtoId: 2, nomeProduto: 'Fatia Pizza Calabresa', quantidade: 1, precoUnitario: 12.0, subtotal: 12.0 }],
      valorConsumo: 12.0,
      valorTotal: 30.0,
      status: 'ENCERRADA',
      operadorAbertura: 'Mariana Lima',
      operadorEncerramento: 'Mariana Lima',
      estoqueDevolvido: false,
    },
    {
      id: 103,
      clienteId: 1,
      clienteNome: 'Gabriel Rocha',
      computadorNumero: 1,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 8.0,
      inicio: '2026-04-21T14:38:00',
      fim: null,
      minutosUtilizados: 52,
      valorTempo: 6.93,
      itensConsumo: [{ produtoId: 1, nomeProduto: 'Soda Neon Lata', quantidade: 1, precoUnitario: 6.5, subtotal: 6.5 }],
      valorConsumo: 6.5,
      valorTotal: 13.43,
      status: 'ATIVA',
      operadorAbertura: 'Ana Silva',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 104,
      clienteId: 3,
      clienteNome: 'Matheus Cardoso',
      computadorNumero: 4,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 10.0,
      inicio: '2026-04-21T14:53:00',
      fim: null,
      minutosUtilizados: 37,
      valorTempo: 6.17,
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: 6.17,
      status: 'ATIVA',
      operadorAbertura: 'Ana Silva',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 105,
      clienteId: 6,
      clienteNome: 'Camila Souza',
      computadorNumero: 6,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 12.0,
      inicio: '2026-04-21T15:00:00',
      fim: null,
      minutosUtilizados: 30,
      valorTempo: 6.0,
      itensConsumo: [{ produtoId: 3, nomeProduto: 'Energético Turbo 473ml', quantidade: 1, precoUnitario: 14.0, subtotal: 14.0 }],
      valorConsumo: 14.0,
      valorTotal: 20.0,
      status: 'ATIVA',
      operadorAbertura: 'Mariana Lima',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 106,
      clienteId: 2,
      clienteNome: 'Juliana Alves',
      computadorNumero: 13,
      areaComputador: 'VIP',
      tarifaPorHoraCongelada: 18.0,
      inicio: '2026-04-21T14:30:00',
      fim: null,
      minutosUtilizados: 60,
      valorTempo: 18.0,
      itensConsumo: [{ produtoId: 2, nomeProduto: 'Fatia Pizza Calabresa', quantidade: 1, precoUnitario: 12.0, subtotal: 12.0 }],
      valorConsumo: 12.0,
      valorTotal: 30.0,
      status: 'ATIVA',
      operadorAbertura: 'Daniel (Admin)',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 107,
      clienteId: 4,
      clienteNome: 'Larissa Ferreira',
      computadorNumero: 16,
      areaComputador: 'VIP',
      tarifaPorHoraCongelada: 22.0,
      inicio: '2026-04-21T15:10:00',
      fim: null,
      minutosUtilizados: 20,
      valorTempo: 7.33,
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: 7.33,
      status: 'ATIVA',
      operadorAbertura: 'Ana Silva',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 108,
      clienteId: 8,
      clienteNome: 'Beatriz Duarte',
      computadorNumero: 8,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 12.0,
      inicio: '2026-04-21T14:58:00',
      fim: null,
      minutosUtilizados: 32,
      valorTempo: 6.4,
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: 6.4,
      status: 'ATIVA',
      operadorAbertura: 'Ana Silva',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 109,
      clienteId: 9,
      clienteNome: 'Gustavo Mendes',
      computadorNumero: 10,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 12.0,
      inicio: '2026-04-21T14:48:00',
      fim: null,
      minutosUtilizados: 42,
      valorTempo: 8.4,
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: 8.4,
      status: 'ATIVA',
      operadorAbertura: 'Mariana Lima',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 110,
      clienteId: 11,
      clienteNome: 'Felipe Santana',
      computadorNumero: 11,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 10.0,
      inicio: '2026-04-21T15:06:00',
      fim: null,
      minutosUtilizados: 24,
      valorTempo: 4.0,
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: 4.0,
      status: 'ATIVA',
      operadorAbertura: 'Ana Silva',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 111,
      clienteId: 10,
      clienteNome: 'Amanda Ribeiro',
      computadorNumero: 17,
      areaComputador: 'VIP',
      tarifaPorHoraCongelada: 22.0,
      inicio: '2026-04-21T14:43:00',
      fim: null,
      minutosUtilizados: 47,
      valorTempo: 17.23,
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: 17.23,
      status: 'ATIVA',
      operadorAbertura: 'Daniel (Admin)',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 112,
      clienteId: 12,
      clienteNome: 'Rafael Oliveira',
      computadorNumero: 2,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 8.0,
      inicio: '2026-04-21T15:02:00',
      fim: null,
      minutosUtilizados: 28,
      valorTempo: 3.73,
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: 3.73,
      status: 'ATIVA',
      operadorAbertura: 'Ana Silva',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 113,
      clienteId: 13,
      clienteNome: 'Isabela Costa',
      computadorNumero: 7,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 10.0,
      inicio: '2026-04-21T14:55:00',
      fim: null,
      minutosUtilizados: 35,
      valorTempo: 5.83,
      itensConsumo: [{ produtoId: 1, nomeProduto: 'Soda Neon Lata', quantidade: 1, precoUnitario: 6.5, subtotal: 6.5 }],
      valorConsumo: 6.5,
      valorTotal: 12.33,
      status: 'ATIVA',
      operadorAbertura: 'Mariana Lima',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 114,
      clienteId: 14,
      clienteNome: 'Vinícius Araujo',
      computadorNumero: 12,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 8.0,
      inicio: '2026-04-21T15:12:00',
      fim: null,
      minutosUtilizados: 18,
      valorTempo: 2.4,
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: 2.4,
      status: 'ATIVA',
      operadorAbertura: 'Ana Silva',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 115,
      clienteId: 15,
      clienteNome: 'Mariana Tavares',
      computadorNumero: 14,
      areaComputador: 'VIP',
      tarifaPorHoraCongelada: 18.0,
      inicio: '2026-04-21T14:48:00',
      fim: null,
      minutosUtilizados: 42,
      valorTempo: 12.6,
      itensConsumo: [{ produtoId: 3, nomeProduto: 'Energético Turbo 473ml', quantidade: 1, precoUnitario: 14.0, subtotal: 14.0 }],
      valorConsumo: 14.0,
      valorTotal: 26.6,
      status: 'ATIVA',
      operadorAbertura: 'Daniel (Admin)',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 116,
      clienteId: 16,
      clienteNome: 'Caio Henrique',
      computadorNumero: 18,
      areaComputador: 'VIP',
      tarifaPorHoraCongelada: 18.0,
      inicio: '2026-04-21T15:05:00',
      fim: null,
      minutosUtilizados: 25,
      valorTempo: 7.5,
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: 7.5,
      status: 'ATIVA',
      operadorAbertura: 'Daniel (Admin)',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 117,
      clienteId: 17,
      clienteNome: 'Letícia Barbosa',
      computadorNumero: 19,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 12.0,
      inicio: '2026-04-21T14:52:00',
      fim: null,
      minutosUtilizados: 38,
      valorTempo: 7.6,
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: 7.6,
      status: 'ATIVA',
      operadorAbertura: 'Ana Silva',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 118,
      clienteId: 18,
      clienteNome: 'Igor Nogueira',
      computadorNumero: 20,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 12.0,
      inicio: '2026-04-21T14:40:00',
      fim: null,
      minutosUtilizados: 50,
      valorTempo: 10.0,
      itensConsumo: [{ produtoId: 5, nomeProduto: 'Café Expresso Gamer', quantidade: 1, precoUnitario: 5.0, subtotal: 5.0 }],
      valorConsumo: 5.0,
      valorTotal: 15.0,
      status: 'ATIVA',
      operadorAbertura: 'Mariana Lima',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 119,
      clienteId: 19,
      clienteNome: 'Bianca Azevedo',
      computadorNumero: 22,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 10.0,
      inicio: '2026-04-21T15:14:00',
      fim: null,
      minutosUtilizados: 16,
      valorTempo: 2.67,
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: 2.67,
      status: 'ATIVA',
      operadorAbertura: 'Ana Silva',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 120,
      clienteId: 20,
      clienteNome: 'Henrique Pires',
      computadorNumero: 24,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 8.0,
      inicio: '2026-04-21T15:08:00',
      fim: null,
      minutosUtilizados: 22,
      valorTempo: 2.93,
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: 2.93,
      status: 'ATIVA',
      operadorAbertura: 'Mariana Lima',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 121,
      clienteId: 21,
      clienteNome: 'Natália Gomes',
      computadorNumero: 5,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 12.0,
      inicio: '2026-04-21T15:00:00',
      fim: null,
      minutosUtilizados: 30,
      valorTempo: 6.0,
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: 6.0,
      status: 'ATIVA',
      operadorAbertura: 'Ana Silva',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 122,
      clienteId: 22,
      clienteNome: 'Eduardo Farias',
      computadorNumero: 9,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 12.0,
      inicio: '2026-04-21T15:10:00',
      fim: null,
      minutosUtilizados: 20,
      valorTempo: 4.0,
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: 4.0,
      status: 'ATIVA',
      operadorAbertura: 'Ana Silva',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 123,
      clienteId: 23,
      clienteNome: 'Otávio Rocha',
      computadorNumero: 15,
      areaComputador: 'VIP',
      tarifaPorHoraCongelada: 22.0,
      inicio: '2026-04-21T14:55:00',
      fim: null,
      minutosUtilizados: 35,
      valorTempo: 12.83,
      itensConsumo: [{ produtoId: 1, nomeProduto: 'Soda Neon Lata', quantidade: 1, precoUnitario: 6.5, subtotal: 6.5 }],
      valorConsumo: 6.5,
      valorTotal: 19.33,
      status: 'ATIVA',
      operadorAbertura: 'Daniel (Admin)',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
    {
      id: 124,
      clienteId: 24,
      clienteNome: 'Sabrina Lima',
      computadorNumero: 21,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 10.0,
      inicio: '2026-04-21T15:04:00',
      fim: null,
      minutosUtilizados: 26,
      valorTempo: 4.33,
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: 4.33,
      status: 'ATIVA',
      operadorAbertura: 'Mariana Lima',
      operadorEncerramento: null,
      estoqueDevolvido: false,
    },
  ];

  const pagamentos: Pagamento[] = [
    {
      id: 501,
      sessaoId: 101,
      clienteNome: 'Pedro Henrique',
      computadorNumero: 5,
      valorBruto: 28.0,
      descontoAplicado: 1.4,
      valorFinal: 26.6,
      forma: 'PIX',
      status: 'CONFIRMADO',
      dataHora: '2026-04-21T15:01:00',
      operadorRegistro: 'Fernanda Oliveira',
      operadorConfirmacao: 'Fernanda Oliveira',
    },
    {
      id: 502,
      sessaoId: 102,
      clienteNome: 'Thiago Nascimento',
      computadorNumero: 10,
      valorBruto: 30.0,
      descontoAplicado: 0,
      valorFinal: 30.0,
      forma: 'CREDITO',
      status: 'PENDENTE', // Pronto para demonstrar confirmação na aula!
      dataHora: '2026-04-21T15:11:00',
      operadorRegistro: 'Mariana Lima',
      operadorConfirmacao: null,
    },
  ];

  const historicoHorario: LinhaHoraria[] = [
    { hora: 'Seg', chegadas: 58, ocupacaoPercentual: 52, faturamento: 680, cpusUso: 65, gpusUso: 58 },
    { hora: 'Ter', chegadas: 142, ocupacaoPercentual: 78, faturamento: 1290, cpusUso: 88, gpusUso: 82 },
    { hora: 'Qua', chegadas: 118, ocupacaoPercentual: 64, faturamento: 980, cpusUso: 72, gpusUso: 68 },
    { hora: 'Qui', chegadas: 104, ocupacaoPercentual: 70, faturamento: 1120, cpusUso: 79, gpusUso: 75 },
    { hora: 'Sex', chegadas: 175, ocupacaoPercentual: 92, faturamento: 1840, cpusUso: 95, gpusUso: 91 },
    { hora: 'Sáb', chegadas: 160, ocupacaoPercentual: 88, faturamento: 1620, cpusUso: 91, gpusUso: 89 },
    { hora: 'Dom', chegadas: 82, ocupacaoPercentual: 58, faturamento: 740, cpusUso: 62, gpusUso: 60 },
  ];

  const auditoria: LogAuditoria[] = [
    { id: 1, momento: '2026-04-21T06:30:00', tipo: 'SESSAO', operador: 'Fernanda Oliveira', descricao: 'Sessão #101 iniciada para Pedro Henrique no PC-05', regraRelacionada: 'RF05 / RN02' },
    { id: 2, momento: '2026-04-21T07:05:00', tipo: 'COMPUTADOR', operador: 'Lucas Ribeiro', descricao: 'PC-03 colocado em MANUTENÇÃO (Troca de pasta térmica)', regraRelacionada: 'RF04 / RN05' },
    { id: 3, momento: '2026-04-21T07:46:00', tipo: 'PAGAMENTO', operador: 'Fernanda Oliveira', descricao: 'Pagamento #501 CONFIRMADO via PIX (5% desconto polimórfico): R$ 26,60', regraRelacionada: 'RF08 / RN09' },
    { id: 4, momento: '2026-04-21T07:51:00', tipo: 'PAGAMENTO', operador: 'Mariana Lima', descricao: 'Pagamento #502 REGISTRADO (PENDENTE) p/ Sessão #102: R$ 30,00', regraRelacionada: 'RF08 / RN06' },
  ];

  const melhorias: MelhoriaEstabelecimento[] = [
    { id: 'inf_eletrica', nome: 'Quadro Elétrico Trifásico', grupo: 'INFRAESTRUTURA', nivel: 2, nivelMax: 5, custoProximo: 1800, ativo: true, icone: 'electrical', beneficio: '-15% na conta de energia e proteção contra quedas' },
    { id: 'inf_seguranca', nome: 'Sistema de Segurança CFTV', grupo: 'INFRAESTRUTURA', nivel: 1, nivelMax: 4, custoProximo: 1400, ativo: true, icone: 'cctv', beneficio: '+4% Reputação e monitoramento 24h das salas' },
    { id: 'inf_ar', nome: 'Ar-Condicionado Climatizado', grupo: 'INFRAESTRUTURA', nivel: 2, nivelMax: 5, custoProximo: 2100, ativo: true, icone: 'ac', beneficio: 'Mantém PCs frios (98% saúde) e clientes felizes' },
    { id: 'eq_pcs', nome: 'Bancadas Gamer RGB (24 Estações)', grupo: 'EQUIPAMENTOS', nivel: 3, nivelMax: 5, custoProximo: 2600, ativo: true, icone: 'pc', beneficio: 'Evolui conforto e placa nas 24 estações do mapa (PC-01..24)' },
    { id: 'eq_print', nome: 'Central de Impressão Laser', grupo: 'EQUIPAMENTOS', nivel: 1, nivelMax: 3, custoProximo: 950, ativo: true, icone: 'printer', beneficio: 'Gera receita extra de impressões e xerox' },
    { id: 'eq_console', nome: 'Lounge de Consoles Next-Gen', grupo: 'EQUIPAMENTOS', nivel: 2, nivelMax: 4, custoProximo: 3200, ativo: true, icone: 'console', beneficio: 'Atrai grupos de amigos na sala inferior direita' },
    { id: 'eq_monitor', nome: 'Monitores 240Hz / 360Hz (6 VIPs)', grupo: 'EQUIPAMENTOS', nivel: 2, nivelMax: 5, custoProximo: 2400, ativo: true, icone: 'monitor', beneficio: 'Valoriza as 6 estações VIP do mapa (+reputação)' },
    { id: 'srv_bar', nome: 'Bar / Lanchonete Express', grupo: 'SERVICOS', nivel: 1, nivelMax: 1, custoProximo: 0, ativo: true, icone: 'pc', beneficio: 'Entrega de sodas e pizzas direto na mesa do cliente' },
    { id: 'srv_suporte', nome: 'Suporte Técnico Premium', grupo: 'SERVICOS', nivel: 1, nivelMax: 1, custoProximo: 0, ativo: true, icone: 'pc', beneficio: 'Reduz tempo de manutenção preventiva dos PCs' },
    { id: 'srv_24h', nome: 'Modo Funcionamento 24h', grupo: 'SERVICOS', nivel: 1, nivelMax: 1, custoProximo: 0, ativo: true, icone: 'pc', beneficio: 'Mantém a LAN House operando nos 3 turnos' },
    { id: 'srv_eventos', nome: 'Corujão & Torneios eSports', grupo: 'SERVICOS', nivel: 1, nivelMax: 1, custoProximo: 0, ativo: true, icone: 'pc', beneficio: 'Aumenta fluxo de clientes nos fins de semana' },
    { id: 'srv_estacionamento', nome: 'Estacionamento Pago & Cancelas', grupo: 'SERVICOS', nivel: 1, nivelMax: 1, custoProximo: 0, ativo: true, icone: 'parking', beneficio: '8 vagas com leitura automática, guarita e cancelas de fluxo' },
  ];

  const estadoBase: EstadoCompletoLanHouse = {
    relogioIso: '2026-04-21T15:30:00',
    caixaSaldo: 6850.0,
    reputacao: 96,
    nivelGerente: 12,
    xpAtual: 1380,
    xpProximoNivel: 2000,
    operadorLogadoId: 1,
    clientes,
    computadores,
    sessoes,
    pagamentos,
    produtos,
    funcionarios,
    auditoria,
    personagens: [],
    melhorias,
    conquistasResgatadas: ['ach_hardware'],
    historicoHorario,
    configuracoes: {
      volumePrincipal: 75,
      volumeEfeitos: 60,
      volumeMusica: 80,
      ativarVozes: true,
      saidaAudio: 'Padrão do Sistema',
      velocidadeSimulacao: 1,
      simulacaoAutomatica: true,
      mostrarBaloesMapa: true,
      mostrarGradePixel: false,
      modo24Horas: true,
      urlBackendJava: 'http://localhost:8080',
    },
    estacionamento: {
      tarifaBase: 10.0,
      vagasTotais: 8,
      totalVeiculosAtendidos: 14,
      receitaEstacionamento: 140.0,
      ultimosTickets: [
        { id: 'TK-1014', placa: 'LAN-8G42', vagaId: 'V02', modeloCarro: 'Hatch', valor: 10.0, horario: '15:18' },
        { id: 'TK-1013', placa: 'PIX-4090', vagaId: 'V05', modeloCarro: 'Sedan', valor: 10.0, horario: '14:52' },
      ],
    },
  };

  estadoBase.personagens = sincronizarPersonagensMapa(estadoBase);
  return estadoBase;
}

const CORES_ROUPA = ['#38bdf8', '#f43f5e', '#10b981', '#a855f7', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'];
const CORES_CABELO = ['#78350f', '#1e293b', '#b45309', '#991b1b', '#d97706', '#4c1d95', '#3f3f46'];

export function sincronizarPersonagensMapa(estado: EstadoCompletoLanHouse): PersonagemMapa[] {
  const anteriores = new Map(estado.personagens.map((p) => [p.id, p]));
  const resultado: PersonagemMapa[] = [];

  // 1. Funcionários trabalhando agora
  estado.funcionarios
    .filter((f) => f.trabalhandoAgora)
    .forEach((f, idx) => {
      let setor: SetorMapa = 'RECEPCAO';
      let acao = 'Atendendo balcão';
      let pcNum: number | null = null;

      if (f.cargo === 'ADMINISTRADOR') {
        setor = 'ESCRITORIO';
        acao = 'Supervisionando caixa';
      } else if (f.cargo === 'SUPORTE_TECNICO') {
        const pcManut = estado.computadores.find((c) => c.status === 'MANUTENCAO');
        if (pcManut) {
          setor = pcManut.area === 'VIP' ? 'AREA_VIP' : 'AREA_COMUM';
          acao = `Reparando ${pcManut.identificacao}`;
          pcNum = pcManut.numero;
        } else {
          setor = 'MANUTENCAO';
          acao = 'Monitorando rede';
        }
      } else if (f.cargo === 'LIMPEZA') {
        setor = idx % 2 === 0 ? 'BOMBONIERE' : 'AREA_COMUM';
        acao = 'Higienizando setor';
      } else if (f.cargo === 'RECEPCIONISTA') {
        setor = idx === 0 ? 'RECEPCAO' : 'BOMBONIERE';
        acao = idx === 0 ? 'Check-in de clientes' : 'Servindo lanches';
      } else if (f.cargo === 'PORTEIRO_ESTACIONAMENTO') {
        setor = 'ESTACIONAMENTO';
        acao = 'Controlando cancela e guarita';
      } else if (f.cargo === 'GUARDA_PATIO') {
        setor = 'ESTACIONAMENTO';
        acao = 'Patrulhando vagas (V01–V08)';
      }

      const alvo = pcNum ? coordenadasDoPc(pcNum) : coordenadasDoSetor(setor, idx);
      const prev = anteriores.get(`func-${f.id}`);
      resultado.push({
        id: `func-${f.id}`,
        nome: f.nome.split(' ')[0],
        papel: FABRICA_CARGOS[f.cargo].nomeExibicao,
        ehCliente: false,
        setor,
        x: prev ? prev.x : alvo.x,
        y: prev ? prev.y : alvo.y + (pcNum ? 24 : 0),
        targetX: alvo.x,
        targetY: alvo.y + (pcNum ? 24 : 0),
        acao,
        computadorNumero: pcNum,
        avatarSeed: f.avatarSeed,
        corRoupa:
          f.cargo === 'ADMINISTRADOR'
            ? '#f59e0b'
            : f.cargo === 'PORTEIRO_ESTACIONAMENTO' || f.cargo === 'GUARDA_PATIO'
              ? '#0f172a'
              : '#2563eb',
        corCabelo: CORES_CABELO[f.avatarSeed % CORES_CABELO.length],
      });
    });

  // 2. Clientes em sessão ativa sentados nos PCs
  estado.sessoes
    .filter((s) => s.status === 'ATIVA')
    .forEach((s) => {
      const alvo = coordenadasDoPc(s.computadorNumero);
      const id = `cli-${s.clienteId}`;
      const prev = anteriores.get(id);
      const jogos = ['Jogando Valorant', 'Partida CS2', 'Rankeada LoL', 'Codando Java POO', 'GTA RP'];
      resultado.push({
        id,
        nome: s.clienteNome.split(' ')[0],
        papel: 'Cliente',
        ehCliente: true,
        setor: s.areaComputador === 'VIP' ? 'AREA_VIP' : 'AREA_COMUM',
        x: prev ? prev.x : alvo.x,
        y: prev ? prev.y : alvo.y + 18,
        targetX: alvo.x,
        targetY: alvo.y + 18,
        acao: s.itensConsumo.length > 0 ? `Jogando + ${s.itensConsumo[0].nomeProduto.split(' ')[0]}` : jogos[s.id % jogos.length],
        computadorNumero: s.computadorNumero,
        avatarSeed: s.clienteId + 10,
        corRoupa: CORES_ROUPA[s.clienteId % CORES_ROUPA.length],
        corCabelo: CORES_CABELO[s.clienteId % CORES_CABELO.length],
      });
    });

  // 3. Clientes passeando na Rua ou Bomboniere (ambientação viva)
  const clientesEmSessao = new Set(
    estado.sessoes.filter((s) => s.status === 'ATIVA').map((s) => s.clienteId)
  );
  estado.clientes
    .filter((c) => !clientesEmSessao.has(c.id))
    .slice(0, 3)
    .forEach((c, idx) => {
      const id = `cli-${c.id}`;
      const prev = anteriores.get(id);
      const minutoAtual = new Date(estado.relogioIso).getMinutes();
      const setor: SetorMapa = (minutoAtual + idx) % 3 === 0 ? 'BOMBONIERE' : idx === 0 ? 'RECEPCAO' : 'RUA';
      const alvo = coordenadasDoSetor(setor, idx + 1);
      resultado.push({
        id,
        nome: c.nome.split(' ')[0],
        papel: 'Visitante',
        ehCliente: true,
        setor,
        x: prev ? prev.x : alvo.x,
        y: prev ? prev.y : alvo.y,
        targetX: alvo.x,
        targetY: alvo.y,
        acao: setor === 'BOMBONIERE' ? 'Olhando cardápio' : setor === 'RECEPCAO' ? 'Aguardando PC' : 'Chegando na LAN',
        computadorNumero: null,
        avatarSeed: c.avatarSeed,
        corRoupa: CORES_ROUPA[c.id % CORES_ROUPA.length],
        corCabelo: CORES_CABELO[c.id % CORES_CABELO.length],
      });
    });

  return resultado;
}

/**
 * Cálculo oficial de valor por tempo (RF07 / RN04):
 * Minuto iniciado conta inteiro, mínimo de 1 minuto cobrado, igual a Sessao.java!
 * Incorpora teto operacional realista de 360 min (6 horas / corujão) para evitar glitches de tempo infinito.
 */
export function calcularTempoEValorSessao(
  inicioIso: string,
  fimOuAgoraIso: string,
  tarifaPorHora: number
): { minutos: number; valorTempo: number } {
  const tInicio = new Date(inicioIso).getTime();
  const tFim = new Date(fimOuAgoraIso).getTime();
  const diffMs = Math.max(0, isNaN(tFim - tInicio) ? 60000 : tFim - tInicio);
  const minutosBrutos = Math.ceil(diffMs / 60000);
  // Limite operacional da LAN House: sessões contínuas têm teto realista de 360 min (6 horas / limite corujão)
  const minutos = Math.min(360, Math.max(1, minutosBrutos));
  const valorTempo = Number(((minutos / 60) * tarifaPorHora).toFixed(2));
  return { minutos, valorTempo };
}

/**
 * Sanitiza e calibra estados e saves persistidos para garantir números e métricas 100% realistas:
 * - Duração de computadores entre 25 e 110 min (nunca milhões de minutos)
 * - Saldo de caixa entre R$ 4.500 e R$ 12.000 (nunca milhões)
 * - Gastos por usuário compatíveis com a realidade (R$ 8 a R$ 45)
 */
export function sanitizarEstadoParaMetricasReais(
  estado: EstadoCompletoLanHouse
): EstadoCompletoLanHouse {
  // 1. Normaliza relógio: se avançou anos para o futuro ou timestamp inválido, alinha com horário de pico realista
  const anoRelogio = new Date(estado.relogioIso).getFullYear();
  if (anoRelogio > 2026 || isNaN(anoRelogio)) {
    estado.relogioIso = '2026-04-21T15:30:00';
  }
  const agoraMs = new Date(estado.relogioIso).getTime();

  // 2. Normaliza saldo de caixa para reserva operacional de LAN House (~R$ 6.850,00)
  if (estado.caixaSaldo > 30000 || estado.caixaSaldo < 500) {
    estado.caixaSaldo = 6850.0;
  }

  // 3. Reconcilia computadores 1:1 com o mapa físico (SLOTS_PC = exatamente 24 estações: 1..12 + VIP 13..18 + Deck 19..24)
  const numerosValidosMapa = new Set(SLOTS_PC.map((s) => s.numero));
  const vistos = new Set<number>();
  const pcsReconciliados: Computador[] = [];
  for (const pc of estado.computadores) {
    if (!numerosValidosMapa.has(pc.numero) || vistos.has(pc.numero)) continue;
    vistos.add(pc.numero);
    const ehVip = pc.numero >= 13 && pc.numero <= 18;
    const areaCanonica: AreaComputador = ehVip ? 'VIP' : 'COMUM';
    pcsReconciliados.push({
      ...pc,
      area: areaCanonica,
      identificacao: `${ehVip ? 'VIP' : 'PC'}-${String(pc.numero).padStart(2, '0')}`,
      totalMinutosUso:
        pc.totalMinutosUso > 1800 || pc.totalMinutosUso < 0
          ? 160 + ((pc.numero * 23) % 360)
          : pc.totalMinutosUso,
    });
  }
  for (const slot of SLOTS_PC) {
    if (!vistos.has(slot.numero)) {
      const ehVip = slot.numero >= 13 && slot.numero <= 18;
      pcsReconciliados.push({
        numero: slot.numero,
        identificacao: `${ehVip ? 'VIP' : 'PC'}-${String(slot.numero).padStart(2, '0')}`,
        area: ehVip ? 'VIP' : 'COMUM',
        categoria: ehVip ? 'VIP Station' : 'PC Gaming',
        especificacoes: ehVip
          ? 'Ryzen 7 7800X3D • 32GB • RTX 4080 • 240Hz'
          : 'Ryzen 5 5600X • 16GB • RTX 3060',
        precoPorHora: ehVip ? 18.0 : 12.0,
        status: 'LIVRE',
        sessaoAtivaId: null,
        usuarioAtualNome: null,
        manutencaoMotivo: null,
        totalMinutosUso: 180 + ((slot.numero * 19) % 240),
      });
    }
  }
  pcsReconciliados.sort((a, b) => a.numero - b.numero);
  estado.computadores = pcsReconciliados;

  // 3b. Auto-migração: estacionamento pago, serviço nas melhorias e equipe de pátio/portaria
  if (!estado.estacionamento) {
    estado.estacionamento = {
      tarifaBase: 10.0,
      vagasTotais: 8,
      totalVeiculosAtendidos: 14,
      receitaEstacionamento: 140.0,
      ultimosTickets: [
        { id: 'TK-1014', placa: 'LAN-8G42', vagaId: 'V02', modeloCarro: 'Hatch', valor: 10.0, horario: '15:18' },
        { id: 'TK-1013', placa: 'PIX-4090', vagaId: 'V05', modeloCarro: 'Sedan', valor: 10.0, horario: '14:52' },
      ],
    };
  } else {
    estado.estacionamento.vagasTotais = 8;
    if (!Array.isArray(estado.estacionamento.ultimosTickets)) {
      estado.estacionamento.ultimosTickets = [];
    }
  }

  if (Array.isArray(estado.melhorias)) {
    const mPcs = estado.melhorias.find((m) => m.id === 'eq_pcs');
    if (mPcs) {
      mPcs.nome = 'Bancadas Gamer RGB (24 Estações)';
      mPcs.beneficio = 'Evolui conforto e placa nas 24 estações do mapa (PC-01..24)';
    }
    const mMon = estado.melhorias.find((m) => m.id === 'eq_monitor');
    if (mMon) {
      mMon.nome = 'Monitores 240Hz / 360Hz (6 VIPs)';
      mMon.beneficio = 'Valoriza as 6 estações VIP do mapa (+reputação)';
    }
    if (!estado.melhorias.some((m) => m.id === 'srv_estacionamento')) {
      estado.melhorias.push({
        id: 'srv_estacionamento',
        nome: 'Estacionamento Pago & Cancelas',
        grupo: 'SERVICOS',
        nivel: 1,
        nivelMax: 1,
        custoProximo: 0,
        ativo: true,
        icone: 'parking',
        beneficio: '8 vagas com leitura automática, guarita e cancelas de fluxo',
      });
    }
  }

  const hashPadraoMigracao = gerarHashSenha('Lan@House2026');
  const cargosPresentes = new Set(estado.funcionarios.map((f) => f.cargo));
  if (!cargosPresentes.has('PORTEIRO_ESTACIONAMENTO')) {
    const proxId = Math.max(0, ...estado.funcionarios.map((f) => f.id)) + 1;
    estado.funcionarios.push({
      id: proxId,
      nome: 'Roberto Porteiro',
      login: 'roberto.portaria',
      senhaHash: hashPadraoMigracao,
      cargo: 'PORTEIRO_ESTACIONAMENTO',
      turno: 'MANHA',
      humor: 'FELIZ',
      trabalhandoAgora: true,
      salario: 2050,
      atendimentosRealizados: 24,
      avatarSeed: 9,
      permissoes: FABRICA_CARGOS.PORTEIRO_ESTACIONAMENTO.obterPermissoes(),
    });
  }
  if (!cargosPresentes.has('GUARDA_PATIO')) {
    const proxId = Math.max(0, ...estado.funcionarios.map((f) => f.id)) + 1;
    estado.funcionarios.push({
      id: proxId,
      nome: 'Cabo Henrique',
      login: 'henrique.patio',
      senhaHash: hashPadraoMigracao,
      cargo: 'GUARDA_PATIO',
      turno: 'TARDE',
      humor: 'FELIZ',
      trabalhandoAgora: true,
      salario: 2200,
      atendimentosRealizados: 19,
      avatarSeed: 10,
      permissoes: FABRICA_CARGOS.GUARDA_PATIO.obterPermissoes(),
    });
  }

  // 4. Normaliza sessões ativas e encerradas (teto operacional de 360 min)
  estado.sessoes.forEach((s) => {
    if (s.minutosUtilizados > 360 || s.valorTotal > 150) {
      const minutosRealistas = 25 + ((s.id * 17) % 65); // 25 a 90 min
      s.minutosUtilizados = minutosRealistas;
      s.valorTempo = Number(((minutosRealistas / 60) * s.tarifaPorHoraCongelada).toFixed(2));

      if (s.itensConsumo.length > 2 || s.valorConsumo > 50) {
        s.itensConsumo = s.itensConsumo.slice(0, 1);
        if (s.itensConsumo[0]) {
          s.itensConsumo[0].quantidade = 1;
          s.itensConsumo[0].subtotal = s.itensConsumo[0].precoUnitario;
        }
      }
      s.valorConsumo = Number(
        s.itensConsumo.reduce((acc, it) => acc + it.subtotal, 0).toFixed(2)
      );
      s.valorTotal = Number((s.valorTempo + s.valorConsumo).toFixed(2));

      const tFim = s.fim ? new Date(s.fim).getTime() : agoraMs;
      s.inicio = new Date(tFim - minutosRealistas * 60000).toISOString().slice(0, 19);
      if (s.fim) {
        s.fim = new Date(agoraMs).toISOString().slice(0, 19);
      }
    }
  });

  // 5. Normaliza pagamentos para manter métricas reais de faturamento
  if (estado.pagamentos.length > 30 || estado.pagamentos.some((p) => p.valorFinal > 120)) {
    const sessoesEncerradas = estado.sessoes.filter((s) => s.status === 'ENCERRADA');
    const novas: Pagamento[] = [];
    sessoesEncerradas.slice(0, 20).forEach((s, idx) => {
      const forma: FormaPagamento = idx % 2 === 0 ? 'PIX' : idx % 3 === 0 ? 'DEBITO' : 'DINHEIRO';
      const proc = PROCESSADORES_PAGAMENTO[forma];
      const { desconto, valorFinal } = proc.calcularTotal(s.valorTotal);
      novas.push({
        id: 500 + idx + 1,
        sessaoId: s.id,
        clienteNome: s.clienteNome,
        computadorNumero: s.computadorNumero,
        valorBruto: s.valorTotal,
        descontoAplicado: desconto,
        valorFinal,
        forma,
        status: idx === 1 ? 'PENDENTE' : 'CONFIRMADO',
        dataHora: s.fim || estado.relogioIso,
        operadorRegistro: s.operadorAbertura || 'Ana Silva',
        operadorConfirmacao: idx === 1 ? null : (s.operadorEncerramento || 'Ana Silva'),
      });
    });
    estado.pagamentos = novas;
  }

  // 6. Normaliza fidelidade dos clientes
  estado.clientes.forEach((c) => {
    if (c.fidelidadePontos > 600) {
      c.fidelidadePontos = 50 + ((c.id * 31) % 180);
    }
  });

  // 7. Reconcilia PCs <-> Sessões Ativas (elimina PCs presos em OCUPADO sem sessão correspondente)
  const ativasMapPorPc = new Map<number, Sessao>();
  const clientesAtivosSet = new Set<number>();
  estado.sessoes = estado.sessoes.map((s) => {
    if (s.status === 'ATIVA') {
      if (
        s.computadorNumero >= 1 &&
        s.computadorNumero <= 24 &&
        !ativasMapPorPc.has(s.computadorNumero) &&
        !clientesAtivosSet.has(s.clienteId)
      ) {
        ativasMapPorPc.set(s.computadorNumero, s);
        clientesAtivosSet.add(s.clienteId);
        return s;
      }
      return { ...s, status: 'ENCERRADA' as const, fim: s.fim || estado.relogioIso };
    }
    return s;
  });
  estado.computadores.forEach((c) => {
    const sessaoPc = ativasMapPorPc.get(c.numero);
    if (sessaoPc) {
      c.status = 'OCUPADO';
      c.sessaoAtivaId = sessaoPc.id;
      c.usuarioAtualNome = sessaoPc.clienteNome;
    } else if (c.status === 'OCUPADO') {
      c.status = 'LIVRE';
      c.sessaoAtivaId = null;
      c.usuarioAtualNome = null;
    }
  });

  // Garante que o Salão Gamer e a Arena nunca fiquem desertos: sempre mantém alta ocupação (~22 PCs ativos)
  const ativas = estado.sessoes.filter((s) => s.status === 'ATIVA');
  if (ativas.length < 21) {
    const clientesEmUso = new Set(ativas.map((s) => s.clienteId));
    const pcsCandidatos = estado.computadores.filter(
      (c) => c.status === 'LIVRE' && c.numero !== 3 && c.numero <= 24
    );
    for (const pc of pcsCandidatos) {
      if (estado.sessoes.filter((s) => s.status === 'ATIVA').length >= 22) break;
      const clienteLivre = estado.clientes.find((cl) => !clientesEmUso.has(cl.id));
      if (!clienteLivre) break;
      clientesEmUso.add(clienteLivre.id);

      const novoId = Math.max(100, ...estado.sessoes.map((s) => s.id)) + 1;
      const minsIniciais = 20 + ((pc.numero * 11) % 55);
      const nova: Sessao = {
        id: novoId,
        clienteId: clienteLivre.id,
        clienteNome: clienteLivre.nome,
        computadorNumero: pc.numero,
        areaComputador: pc.area,
        tarifaPorHoraCongelada: pc.precoPorHora,
        inicio: estado.relogioIso || '2026-04-21T15:30:00',
        fim: null,
        minutosUtilizados: minsIniciais,
        valorTempo: Number(((minsIniciais / 60) * pc.precoPorHora).toFixed(2)),
        itensConsumo: [],
        valorConsumo: 0,
        valorTotal: Number(((minsIniciais / 60) * pc.precoPorHora).toFixed(2)),
        status: 'ATIVA',
        operadorAbertura: 'Ana Silva',
        operadorEncerramento: null,
        estoqueDevolvido: false,
      };
      pc.status = 'OCUPADO';
      pc.sessaoAtivaId = nova.id;
      pc.usuarioAtualNome = clienteLivre.nome;
      estado.sessoes.unshift(nova);
    }
  }

  return estado;
}

export class LanHouseStore {
  private state: EstadoCompletoLanHouse;
  private listeners = new Set<() => void>();

  constructor() {
    this.state = this.carregarDoStorage();
  }

  private carregarDoStorage(): EstadoCompletoLanHouse {
    try {
      const salvo = localStorage.getItem(STORAGE_KEY);
      if (salvo) {
        const parsed = JSON.parse(salvo) as EstadoCompletoLanHouse;
        if (parsed && Array.isArray(parsed.computadores) && Array.isArray(parsed.funcionarios)) {
          // Migração: saves antigos (18 PCs) ganham as 6 estações do Deck Gamer
          if (!parsed.computadores.some((c) => c.numero === 19)) {
            parsed.computadores = [...parsed.computadores, ...criarPcsDeck()];
          }
          // Migração única: saves com poucos clientes (<36) recebem elenco expandido e ocupação inicial nos PCs livres
          if (!Array.isArray(parsed.clientes) || parsed.clientes.length < 36) {
            const base = criarDadosIniciais();
            const clientesExistentes = new Set((parsed.clientes ?? []).map((c) => c.id));
            parsed.clientes = [
              ...(parsed.clientes ?? []),
              ...base.clientes.filter((c) => !clientesExistentes.has(c.id)),
            ];
            const ocupadosSet = new Set(
              parsed.sessoes.filter((s) => s.status === 'ATIVA').map((s) => s.clienteId)
            );
            base.sessoes
              .filter((s) => s.status === 'ATIVA' && !ocupadosSet.has(s.clienteId))
              .forEach((sessaoPadrao) => {
                const pc = parsed.computadores.find((c) => c.numero === sessaoPadrao.computadorNumero);
                if (pc && pc.status === 'LIVRE') {
                  const nextId = Math.max(100, ...parsed.sessoes.map((s) => s.id)) + 1;
                  const nova = { ...sessaoPadrao, id: nextId, inicio: parsed.relogioIso || sessaoPadrao.inicio };
                  pc.status = 'OCUPADO';
                  pc.sessaoAtivaId = nova.id;
                  pc.usuarioAtualNome = nova.clienteNome;
                  parsed.sessoes = [nova, ...parsed.sessoes];
                  ocupadosSet.add(nova.clienteId);
                }
              });
          }
          // Sanitização ativa de números inflados e tempos absurdos
          const sanitizado = sanitizarEstadoParaMetricasReais(parsed);
          sanitizado.personagens = sincronizarPersonagensMapa(sanitizado);
          try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizado));
          } catch {}
          return sanitizado;
        }
      }
    } catch {
      // Ignora erro de parse e recria estado inicial
    }
    return criarDadosIniciais();
  }

  private salvarEEmitir() {
    this.state.personagens = sincronizarPersonagensMapa(this.state);
    try {
      // RNF06: Persistência automática após cada operação!
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch {
      // Storage cheio ou indisponível
    }
    this.listeners.forEach((l) => l());
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  public getState(): EstadoCompletoLanHouse {
    return this.state;
  }

  public getOperadorLogado(): Funcionario {
    return (
      this.state.funcionarios.find((f) => f.id === this.state.operadorLogadoId) ||
      this.state.funcionarios[0]
    );
  }

  private exigirPermissao(permissao: Permissao, regraCodigo = 'RF12 / RN10') {
    const operador = this.getOperadorLogado();
    const perfil = FABRICA_CARGOS[operador.cargo];
    if (!perfil.possuiPermissao(permissao)) {
      this.registrarLog(
        'SEGURANCA',
        `Acesso negado para ${operador.nome} (${perfil.nomeExibicao}): requer ${permissao}`,
        regraCodigo
      );
      this.salvarEEmitir();
      throw new RegraNegocioError(
        regraCodigo,
        `Permissão negada! O cargo "${perfil.nomeExibicao}" não possui a permissão [${permissao}]. Troque para um Administrador no canto superior esquerdo.`
      );
    }
  }

  private registrarLog(
    tipo: LogAuditoria['tipo'],
    descricao: string,
    regraRelacionada?: string
  ) {
    const operador = this.getOperadorLogado();
    const novoId = (this.state.auditoria[0]?.id || 0) + 1;
    this.state.auditoria = [
      {
        id: novoId,
        momento: this.state.relogioIso,
        tipo,
        operador: operador.nome,
        descricao,
        regraRelacionada,
      },
      ...this.state.auditoria.slice(0, 149),
    ];
  }

  private adicionarXp(pontos: number) {
    this.state.xpAtual += pontos;
    while (this.state.xpAtual >= this.state.xpProximoNivel) {
      this.state.xpAtual -= this.state.xpProximoNivel;
      this.state.nivelGerente += 1;
      this.state.xpProximoNivel = Math.round(this.state.xpProximoNivel * 1.18);
    }
  }

  // ==========================================================================
  // RF12 & RNF02: Autenticação por Login/Senha Hash ou Troca Rápida Acadêmica
  // ==========================================================================
  public autenticar(login: string, senha: string): Funcionario {
    const func = this.state.funcionarios.find(
      (f) => f.login.toLowerCase() === login.trim().toLowerCase()
    );
    const hash = gerarHashSenha(senha);
    if (!func || func.senhaHash !== hash) {
      throw new RegraNegocioError(
        'RNF02 / RF12',
        'Credenciais inválidas! Dica de demonstração: senha padrão é Lan@House2026'
      );
    }
    this.state.operadorLogadoId = func.id;
    this.registrarLog('SEGURANCA', `Login autenticado: ${func.nome} (${func.cargo})`, 'RF12 / RNF02');
    this.salvarEEmitir();
    return func;
  }

  public trocarOperadorRapido(funcionarioId: number) {
    const func = this.state.funcionarios.find((f) => f.id === funcionarioId);
    if (!func) return;
    this.state.operadorLogadoId = func.id;
    this.registrarLog('SEGURANCA', `Operador ativo alterado para ${func.nome} (${func.cargo})`, 'RF12');
    this.salvarEEmitir();
  }

  // ==========================================================================
  // RF01 & RF02: Cadastro e Atualização de Clientes
  // ==========================================================================
  public cadastrarCliente(nome: string, telefone: string, identificador: string): Cliente {
    this.exigirPermissao('GERENCIAR_CLIENTE', 'RF12');
    const nomeLimpo = nome.trim();
    const docLimpo = identificador.trim();
    const telLimpo = telefone.trim();

    if (nomeLimpo.length < 3) {
      throw new RegraNegocioError('RF01', 'Informe o nome completo do cliente (mínimo 3 caracteres).');
    }
    if (docLimpo.length < 5) {
      throw new RegraNegocioError('RF01', 'Informe um CPF ou identificador válido.');
    }
    if (this.state.clientes.some((c) => c.identificador === docLimpo)) {
      throw new RegraNegocioError('RNF03', 'Já existe um cliente cadastrado com este CPF/identificador!');
    }

    const novoId = Math.max(0, ...this.state.clientes.map((c) => c.id)) + 1;
    const novo: Cliente = {
      id: novoId,
      nome: nomeLimpo,
      telefone: telLimpo || '(11) 90000-0000',
      identificador: docLimpo,
      criadoEm: this.state.relogioIso,
      fidelidadePontos: 10,
      avatarSeed: novoId + 10,
    };

    this.state.clientes = [...this.state.clientes, novo];
    this.adicionarXp(35);
    this.registrarLog('CLIENTE', `Cliente cadastrado: ${novo.nome} (Doc: ${novo.identificador})`, 'RF01');
    this.salvarEEmitir();
    return novo;
  }

  // ==========================================================================
  // RF03, RF04, RN01, RN05, RN10: Computadores, Tarifas e Manutenção
  // ==========================================================================
  public cadastrarComputador(
    area: AreaComputador,
    categoria: Computador['categoria'],
    especificacoes: string,
    precoPorHora: number
  ): Computador {
    this.exigirPermissao('GERENCIAR_COMPUTADOR', 'RF03 / RN10');
    if (precoPorHora <= 0) {
      throw new RegraNegocioError('RF03', 'O preço por hora deve ser maior que zero.');
    }

    if (this.state.computadores.length >= MAX_ESTACOES_MAPA) {
      throw new RegraNegocioError(
        'RF03',
        `Capacidade física máxima do mapa atingida (${MAX_ESTACOES_MAPA}/${MAX_ESTACOES_MAPA} estações: PC-01..24). Utilize "Upgrade Hardware" para evoluir as máquinas existentes.`
      );
    }

    const ocupados = new Set(this.state.computadores.map((c) => c.numero));
    const slotLivre = SLOTS_PC.find((s) => !ocupados.has(s.numero));
    const proximoNumero = slotLivre
      ? slotLivre.numero
      : Math.max(0, ...this.state.computadores.map((c) => c.numero)) + 1;
    const ehVip = proximoNumero >= 13 && proximoNumero <= 18;
    const areaReal: AreaComputador = ehVip ? 'VIP' : 'COMUM';
    const prefixo = areaReal === 'VIP' ? 'VIP' : 'PC';
    const novo: Computador = {
      numero: proximoNumero,
      identificacao: `${prefixo}-${String(proximoNumero).padStart(2, '0')}`,
      area: areaReal,
      categoria,
      especificacoes: especificacoes.trim() || 'Ryzen 5 • 16GB RAM • RTX 4060',
      precoPorHora: Number(precoPorHora.toFixed(2)),
      status: 'LIVRE',
      sessaoAtivaId: null,
      usuarioAtualNome: null,
      manutencaoMotivo: null,
      totalMinutosUso: 0,
    };

    this.state.computadores = [...this.state.computadores, novo];
    this.adicionarXp(60);
    this.registrarLog(
      'COMPUTADOR',
      `Computador ${novo.identificacao} (${novo.area}) cadastrado por R$ ${novo.precoPorHora.toFixed(2)}/h`,
      'RF03 / RN10'
    );
    this.salvarEEmitir();
    return novo;
  }

  public alterarTarifaComputador(numeroPc: number, novoPrecoHora: number) {
    this.exigirPermissao('GERENCIAR_COMPUTADOR', 'RN10');
    if (novoPrecoHora <= 0) {
      throw new RegraNegocioError('RN04', 'A tarifa por hora deve ser positiva.');
    }
    const pc = this.state.computadores.find((c) => c.numero === numeroPc);
    if (!pc) throw new RegraNegocioError('RF04', 'Computador não encontrado.');

    const antiga = pc.precoPorHora;
    pc.precoPorHora = Number(novoPrecoHora.toFixed(2));
    this.registrarLog(
      'COMPUTADOR',
      `Tarifa do ${pc.identificacao} alterada de R$ ${antiga.toFixed(2)}/h para R$ ${pc.precoPorHora.toFixed(2)}/h (sessões ativas mantêm tarifa congelada)`,
      'RN10'
    );
    this.salvarEEmitir();
  }

  public upgradeHardwareComputador(numeroPc: number) {
    this.exigirPermissao('GERENCIAR_COMPUTADOR', 'RN10');
    const pc = this.state.computadores.find((c) => c.numero === numeroPc);
    if (!pc) throw new RegraNegocioError('RF04', 'Computador não encontrado.');
    const custo = pc.area === 'VIP' ? 1400 : 850;
    if (this.state.caixaSaldo < custo) {
      throw new RegraNegocioError('RNF03', `Saldo insuficiente para upgrade (${custo}).`);
    }
    this.state.caixaSaldo = Number((this.state.caixaSaldo - custo).toFixed(2));
    pc.precoPorHora = Number((pc.precoPorHora + 2.0).toFixed(2));
    if (pc.categoria === 'PC Básico') {
      pc.categoria = 'PC Intermediário';
      pc.especificacoes = 'Ryzen 5 5600X (Lv.2) • 16GB RAM • RTX 3060 • 512GB SSD';
    } else if (pc.categoria === 'PC Intermediário') {
      pc.categoria = 'PC Gaming';
      pc.especificacoes = 'Ryzen 7 7700X (Lv.3) • 32GB RAM • RTX 4070 • 1TB SSD';
    } else {
      pc.categoria = 'VIP Station';
      pc.especificacoes = 'Ryzen 7 7800X3D (Lv.4) • 64GB RAM • RTX 4080 • 2TB SSD';
    }
    this.adicionarXp(55);
    this.registrarLog(
      'COMPUTADOR',
      `Upgrade de Hardware no ${pc.identificacao} (-R$ ${custo.toFixed(2)}) → Nova tarifa: R$ ${pc.precoPorHora.toFixed(2)}/h`,
      'Melhoria / RN10'
    );
    this.salvarEEmitir();
  }

  public evoluirMelhoriaEstabelecimento(id: string) {
    this.exigirPermissao('GERENCIAR_COMPUTADOR', 'RN10');
    const m = this.state.melhorias.find((item) => item.id === id);
    if (!m) return;
    if (m.grupo === 'SERVICOS') {
      m.ativo = !m.ativo;
      this.registrarLog('SISTEMA', `Serviço "${m.nome}" ${m.ativo ? 'ATIVADO' : 'DESATIVADO'}`, 'RN10');
      this.salvarEEmitir();
      return;
    }
    if (m.nivel >= m.nivelMax) {
      throw new RegraNegocioError('Melhoria', `"${m.nome}" já atingiu o nível máximo!`);
    }
    if (this.state.caixaSaldo < m.custoProximo) {
      throw new RegraNegocioError('RNF03', 'Saldo insuficiente em caixa para esta melhoria.');
    }
    this.state.caixaSaldo = Number((this.state.caixaSaldo - m.custoProximo).toFixed(2));
    m.nivel += 1;
    m.custoProximo = Math.round(m.custoProximo * 1.45);
    this.state.reputacao = Math.min(100, this.state.reputacao + 1);
    this.adicionarXp(80);
    this.registrarLog('SISTEMA', `Melhoria "${m.nome}" evoluída para Nível ${m.nivel}!`, 'Infraestrutura');
    this.salvarEEmitir();
  }

  public registrarTicketEstacionamento(
    placa: string,
    vagaId: string,
    modeloCarro: string,
    valorPago?: number
  ): RegistroTicketEstacionamento {
    const srv = this.state.melhorias.find((m) => m.id === 'srv_estacionamento');
    const tarifa = valorPago !== undefined ? valorPago : srv && !srv.ativo ? 0 : this.state.estacionamento.tarifaBase;
    const valorFinal = Number(Math.max(0, tarifa).toFixed(2));
    const seq = 1001 + this.state.estacionamento.totalVeiculosAtendidos;
    const dt = new Date(this.state.relogioIso || Date.now());
    const horario = Number.isNaN(dt.getTime())
      ? '15:30'
      : dt.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const ticket: RegistroTicketEstacionamento = {
      id: `TK-${seq}`,
      placa,
      vagaId,
      modeloCarro,
      valor: valorFinal,
      horario,
    };

    this.state.estacionamento.totalVeiculosAtendidos += 1;
    this.state.estacionamento.receitaEstacionamento = Number(
      (this.state.estacionamento.receitaEstacionamento + valorFinal).toFixed(2)
    );
    this.state.estacionamento.ultimosTickets = [
      ticket,
      ...this.state.estacionamento.ultimosTickets.slice(0, 19),
    ];
    if (valorFinal > 0) {
      this.state.caixaSaldo = Number((this.state.caixaSaldo + valorFinal).toFixed(2));
      this.adicionarXp(8);
    }

    const porteiro = this.state.funcionarios.find(
      (f) => f.trabalhandoAgora && (f.cargo === 'PORTEIRO_ESTACIONAMENTO' || f.cargo === 'GUARDA_PATIO')
    );
    if (porteiro) {
      porteiro.atendimentosRealizados += 1;
    }

    this.registrarLog(
      'PAGAMENTO',
      `[Estacionamento] Ticket ${ticket.id} • ${placa} (${vagaId}) — Cancela liberada (+R$ ${valorFinal.toFixed(2)})`,
      'Portaria'
    );
    this.salvarEEmitir();
    return ticket;
  }

  public alterarTarifaEstacionamento(novaTarifa: number) {
    this.exigirPermissao('GERENCIAR_COMPUTADOR', 'RN10');
    const clamped = Number(Math.max(0, Math.min(50, novaTarifa)).toFixed(2));
    this.state.estacionamento.tarifaBase = clamped;
    this.registrarLog('SISTEMA', `Tarifa única do estacionamento ajustada para R$ ${clamped.toFixed(2)}`, 'Portaria');
    this.salvarEEmitir();
  }

  public colocarEmManutencao(numeroPc: number, motivo: string) {
    this.exigirPermissao('MANUTENCAO_COMPUTADOR', 'RF04 / RN05');
    const pc = this.state.computadores.find((c) => c.numero === numeroPc);
    if (!pc) throw new RegraNegocioError('RF04', 'Computador não encontrado.');
    if (pc.status === 'OCUPADO') {
      throw new RegraNegocioError(
        'RN01 / RNF03',
        `O ${pc.identificacao} está OCUPADO com uma sessão ativa! Encerre a sessão antes de enviá-lo para manutenção.`
      );
    }
    pc.status = 'MANUTENCAO';
    pc.manutencaoMotivo = motivo.trim() || 'Manutenção preventiva / Limpeza';
    this.registrarLog('COMPUTADOR', `${pc.identificacao} enviado para MANUTENÇÃO: ${pc.manutencaoMotivo}`, 'RF04 / RN05');
    this.salvarEEmitir();
  }

  public liberarManutencao(numeroPc: number) {
    this.exigirPermissao('MANUTENCAO_COMPUTADOR', 'RF04');
    const pc = this.state.computadores.find((c) => c.numero === numeroPc);
    if (!pc) throw new RegraNegocioError('RF04', 'Computador não encontrado.');
    if (pc.status !== 'MANUTENCAO') {
      throw new RegraNegocioError('RF04', `O ${pc.identificacao} não está em manutenção.`);
    }
    pc.status = 'LIVRE';
    pc.manutencaoMotivo = null;
    this.adicionarXp(25);
    this.registrarLog('COMPUTADOR', `${pc.identificacao} liberado da manutenção e disponível (LIVRE)`, 'RF04');
    this.salvarEEmitir();
  }

  // ==========================================================================
  // RF05, RF06, RF07, RN01–RN05, RN07: Sessões de Uso e Consumo
  // ==========================================================================
  public iniciarSessao(clienteId: number, numeroPc: number): Sessao {
    this.exigirPermissao('OPERAR_SESSAO', 'RF05 / RF12');

    const cliente = this.state.clientes.find((c) => c.id === clienteId);
    if (!cliente) {
      throw new RegraNegocioError('RF05', 'Selecione um cliente cadastrado válido.');
    }

    const pc = this.state.computadores.find((c) => c.numero === numeroPc);
    if (!pc) {
      throw new RegraNegocioError('RN02', 'Uma sessão deve estar associada a um computador existente.');
    }

    // RN01: Computador ocupado não recebe nova sessão
    if (pc.status === 'OCUPADO') {
      throw new RegraNegocioError(
        'RN01',
        `Bloqueado pela RN01: O ${pc.identificacao} já está OCUPADO por ${pc.usuarioAtualNome}!`
      );
    }

    // RN05: Computador em manutenção não pode ser utilizado
    if (pc.status === 'MANUTENCAO') {
      throw new RegraNegocioError(
        'RN05',
        `Bloqueado pela RN05: O ${pc.identificacao} está em MANUTENÇÃO (${pc.manutencaoMotivo || 'indisponível'})!`
      );
    }

    // RNF03: Evita que o mesmo cliente abra duas sessões simultâneas
    const sessaoJaAtivaCliente = this.state.sessoes.find(
      (s) => s.clienteId === clienteId && s.status === 'ATIVA'
    );
    if (sessaoJaAtivaCliente) {
      throw new RegraNegocioError(
        'RNF03',
        `${cliente.nome} já possui a Sessão #${sessaoJaAtivaCliente.id} ativa no PC-${String(sessaoJaAtivaCliente.computadorNumero).padStart(2, '0')}!`
      );
    }

    const novoId = Math.max(100, ...this.state.sessoes.map((s) => s.id)) + 1;
    const operador = this.getOperadorLogado();

    const novaSessao: Sessao = {
      id: novoId,
      clienteId: cliente.id,
      clienteNome: cliente.nome,
      computadorNumero: pc.numero,
      areaComputador: pc.area,
      tarifaPorHoraCongelada: pc.precoPorHora, // Encapsulamento: congela tarifa na abertura
      inicio: this.state.relogioIso,
      fim: null,
      minutosUtilizados: 1,
      valorTempo: Number((pc.precoPorHora / 60).toFixed(2)),
      itensConsumo: [],
      valorConsumo: 0,
      valorTotal: Number((pc.precoPorHora / 60).toFixed(2)),
      status: 'ATIVA',
      operadorAbertura: operador.nome,
      operadorEncerramento: null,
      estoqueDevolvido: false,
    };

    // Ocupa PC atomicamente (RNF03)
    pc.status = 'OCUPADO';
    pc.sessaoAtivaId = novaSessao.id;
    pc.usuarioAtualNome = cliente.nome;
    operador.atendimentosRealizados += 1;

    this.state.sessoes = [novaSessao, ...this.state.sessoes];
    this.adicionarXp(30);
    this.registrarLog(
      'SESSAO',
      `Sessão #${novaSessao.id} iniciada: ${cliente.nome} no ${pc.identificacao} (R$ ${pc.precoPorHora.toFixed(2)}/h)`,
      'RF05 / RN01–RN03'
    );
    this.salvarEEmitir();
    return novaSessao;
  }

  public adicionarConsumoSessao(sessaoId: number, produtoId: number, quantidade: number) {
    this.exigirPermissao('OPERAR_SESSAO', 'RF12');
    if (quantidade <= 0) return;

    const sessao = this.state.sessoes.find((s) => s.id === sessaoId);
    if (!sessao || sessao.status !== 'ATIVA') {
      throw new RegraNegocioError('RN07', 'Só é possível adicionar consumo a uma sessão ATIVA.');
    }

    const produto = this.state.produtos.find((p) => p.id === produtoId);
    if (!produto) throw new RegraNegocioError('RNF03', 'Produto não encontrado.');
    if (produto.estoque < quantidade) {
      throw new RegraNegocioError(
        'RNF03',
        `Estoque insuficiente de ${produto.nome}! Disponível: ${produto.estoque} un.`
      );
    }

    produto.estoque -= quantidade;
    produto.vendidos += quantidade;

    const itemExistente = sessao.itensConsumo.find((i) => i.produtoId === produto.id);
    if (itemExistente) {
      itemExistente.quantidade += quantidade;
      itemExistente.subtotal = Number((itemExistente.quantidade * itemExistente.precoUnitario).toFixed(2));
    } else {
      sessao.itensConsumo.push({
        produtoId: produto.id,
        nomeProduto: produto.nome,
        quantidade,
        precoUnitario: produto.preco,
        subtotal: Number((quantidade * produto.preco).toFixed(2)),
      });
    }

    this.recalcularSessao(sessao);
    this.adicionarXp(15);
    this.registrarLog(
      'ESTOQUE',
      `+${quantidade}x ${produto.nome} lançado na Sessão #${sessao.id} (${sessao.clienteNome})`,
      'Bomboniere'
    );
    this.salvarEEmitir();
  }

  private recalcularSessao(sessao: Sessao) {
    const refFim = sessao.fim || this.state.relogioIso;
    const { minutos, valorTempo } = calcularTempoEValorSessao(
      sessao.inicio,
      refFim,
      sessao.tarifaPorHoraCongelada
    );
    sessao.minutosUtilizados = minutos;
    sessao.valorTempo = valorTempo;
    sessao.valorConsumo = Number(
      sessao.itensConsumo.reduce((acc, item) => acc + item.subtotal, 0).toFixed(2)
    );
    sessao.valorTotal = Number((sessao.valorTempo + sessao.valorConsumo).toFixed(2));
  }

  public encerrarSessao(sessaoId: number): Sessao {
    this.exigirPermissao('OPERAR_SESSAO', 'RF06 / RF12');

    const sessao = this.state.sessoes.find((s) => s.id === sessaoId);
    if (!sessao) {
      throw new RegraNegocioError('RN06', 'Sessão não encontrada.');
    }

    // RN07: Sessão encerrada não pode ser encerrada novamente
    if (sessao.status === 'ENCERRADA') {
      throw new RegraNegocioError(
        'RN07',
        `Bloqueado pela RN07: A Sessão #${sessao.id} já foi encerrada em ${new Date(sessao.fim!).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}!`
      );
    }

    const operador = this.getOperadorLogado();
    sessao.fim = this.state.relogioIso;
    sessao.status = 'ENCERRADA';
    sessao.operadorEncerramento = operador.nome;
    this.recalcularSessao(sessao);

    const pc = this.state.computadores.find((c) => c.numero === sessao.computadorNumero);
    if (pc) {
      pc.status = 'LIVRE';
      pc.sessaoAtivaId = null;
      pc.usuarioAtualNome = null;
      pc.totalMinutosUso += sessao.minutosUtilizados;
    }

    const cliente = this.state.clientes.find((c) => c.id === sessao.clienteId);
    if (cliente) {
      cliente.fidelidadePontos += Math.max(5, Math.round(sessao.valorTotal));
    }

    this.adicionarXp(40);
    this.registrarLog(
      'SESSAO',
      `Sessão #${sessao.id} encerrada (${sessao.minutosUtilizados} min) — Valor calculado: R$ ${sessao.valorTotal.toFixed(2)}`,
      'RF06 / RF07 / RN03–RN04'
    );
    this.salvarEEmitir();
    return sessao;
  }

  // ==========================================================================
  // RF08, RN06, RN08, RN09: Registro, Confirmação e Estorno de Pagamento
  // ==========================================================================
  public registrarPagamento(
    sessaoId: number,
    forma: FormaPagamento,
    confirmarImediatamente = true
  ): Pagamento {
    this.exigirPermissao('REGISTRAR_PAGAMENTO', 'RF08 / RF12');

    // RN06: Pagamento deve estar associado a uma sessão existente
    const sessao = this.state.sessoes.find((s) => s.id === sessaoId);
    if (!sessao) {
      throw new RegraNegocioError('RN06', 'Bloqueado pela RN06: Sessão inexistente para pagamento.');
    }
    if (sessao.status !== 'ENCERRADA') {
      throw new RegraNegocioError(
        'RN03 / RN06',
        `Encerre a Sessão #${sessao.id} antes de registrar o pagamento para calcular o horário final!`
      );
    }

    // RN08: Impedir duplicidade de pagamento ativo (PENDENTE ou CONFIRMADO) para a mesma sessão
    const pagamentoExistente = this.state.pagamentos.find(
      (p) => p.sessaoId === sessaoId && p.status !== 'ESTORNADO'
    );
    if (pagamentoExistente) {
      throw new RegraNegocioError(
        'RN08',
        `Bloqueado pela RN08: Já existe o Pagamento #${pagamentoExistente.id} (${pagamentoExistente.status}) para a Sessão #${sessaoId}!`
      );
    }

    // POLIMORFISMO: Calcula valor conforme a forma de pagamento (PIX dá 5% OFF)
    const processador = PROCESSADORES_PAGAMENTO[forma];
    const { desconto, valorFinal } = processador.calcularTotal(sessao.valorTotal);
    const operador = this.getOperadorLogado();
    const novoId = Math.max(500, ...this.state.pagamentos.map((p) => p.id)) + 1;

    const novoPag: Pagamento = {
      id: novoId,
      sessaoId: sessao.id,
      clienteNome: sessao.clienteNome,
      computadorNumero: sessao.computadorNumero,
      valorBruto: sessao.valorTotal,
      descontoAplicado: desconto,
      valorFinal,
      forma,
      status: confirmarImediatamente ? 'CONFIRMADO' : 'PENDENTE',
      dataHora: this.state.relogioIso,
      operadorRegistro: operador.nome,
      operadorConfirmacao: confirmarImediatamente ? operador.nome : null,
    };

    if (confirmarImediatamente) {
      this.state.caixaSaldo = Number((this.state.caixaSaldo + valorFinal).toFixed(2));
      this.adicionarXp(50);
    }

    this.state.pagamentos = [novoPag, ...this.state.pagamentos];
    this.registrarLog(
      'PAGAMENTO',
      `Pagamento #${novoPag.id} (${processador.descricao}) ${novoPag.status} p/ Sessão #${sessao.id}: R$ ${valorFinal.toFixed(2)}`,
      'RF08 / RN06 / RN08 / RN09'
    );
    this.salvarEEmitir();
    return novoPag;
  }

  public confirmarPagamentoPendente(pagamentoId: number) {
    this.exigirPermissao('REGISTRAR_PAGAMENTO', 'RF08');
    const pag = this.state.pagamentos.find((p) => p.id === pagamentoId);
    if (!pag) throw new RegraNegocioError('RN06', 'Pagamento não encontrado.');
    if (pag.status === 'CONFIRMADO') {
      throw new RegraNegocioError('RN08', 'Este pagamento já está CONFIRMADO!');
    }
    if (pag.status === 'ESTORNADO') {
      throw new RegraNegocioError('RNF03', 'Pagamento estornado não pode ser confirmado.');
    }

    pag.status = 'CONFIRMADO';
    pag.operadorConfirmacao = this.getOperadorLogado().nome;
    this.state.caixaSaldo = Number((this.state.caixaSaldo + pag.valorFinal).toFixed(2));
    this.adicionarXp(45);
    this.registrarLog(
      'PAGAMENTO',
      `Pagamento #${pag.id} CONFIRMADO — +R$ ${pag.valorFinal.toFixed(2)} contabilizado no faturamento`,
      'RN09'
    );
    this.salvarEEmitir();
  }

  public estornarPagamento(pagamentoId: number) {
    // Igual ao Java (MUDANCAS.md): somente Administrador possui ESTORNAR_PAGAMENTO!
    this.exigirPermissao('ESTORNAR_PAGAMENTO', 'RN10');
    const pag = this.state.pagamentos.find((p) => p.id === pagamentoId);
    if (!pag) throw new RegraNegocioError('RN06', 'Pagamento não encontrado.');
    if (pag.status !== 'CONFIRMADO') {
      throw new RegraNegocioError('RNF03', 'Apenas pagamentos CONFIRMADOS podem ser estornados.');
    }

    pag.status = 'ESTORNADO';
    this.state.caixaSaldo = Number((this.state.caixaSaldo - pag.valorFinal).toFixed(2));

    // Devolve estoque dos itens da sessão uma única vez (igual à regra do backend Java!)
    const sessao = this.state.sessoes.find((s) => s.id === pag.sessaoId);
    if (sessao && !sessao.estoqueDevolvido) {
      sessao.itensConsumo.forEach((item) => {
        const prod = this.state.produtos.find((p) => p.id === item.produtoId);
        if (prod) {
          prod.estoque += item.quantidade;
          prod.vendidos = Math.max(0, prod.vendidos - item.quantidade);
        }
      });
      sessao.estoqueDevolvido = true;
    }

    this.registrarLog(
      'PAGAMENTO',
      `Pagamento #${pag.id} ESTORNADO pelo Administrador (-R$ ${pag.valorFinal.toFixed(2)}) e estoque devolvido`,
      'RN09 / RN10'
    );
    this.salvarEEmitir();
  }

  // ==========================================================================
  // Bomboniere / Estoque (ProdutoService)
  // ==========================================================================
  public reporEstoqueProduto(produtoId: number, quantidade: number) {
    this.exigirPermissao('GERENCIAR_PRODUTO', 'RN10');
    if (quantidade <= 0) return;
    const prod = this.state.produtos.find((p) => p.id === produtoId);
    if (!prod) return;
    const custoReposicao = Number((prod.preco * 0.45 * quantidade).toFixed(2));
    prod.estoque += quantidade;
    this.state.caixaSaldo = Number((this.state.caixaSaldo - custoReposicao).toFixed(2));
    this.registrarLog(
      'ESTOQUE',
      `Reposição de +${quantidade} un. de ${prod.nome} (Custo: R$ ${custoReposicao.toFixed(2)})`,
      'Estoque'
    );
    this.salvarEEmitir();
  }

  public atualizarPrecoProduto(produtoId: number, novoPreco: number) {
    this.exigirPermissao('GERENCIAR_PRODUTO', 'RN10');
    if (novoPreco <= 0) throw new RegraNegocioError('RNF03', 'Preço inválido.');
    const prod = this.state.produtos.find((p) => p.id === produtoId);
    if (!prod) return;
    prod.preco = Number(novoPreco.toFixed(2));
    this.registrarLog('ESTOQUE', `Preço de ${prod.nome} atualizado para R$ ${prod.preco.toFixed(2)}`, 'RN10');
    this.salvarEEmitir();
  }

  // ==========================================================================
  // RF11: Gerenciar Funcionários (Contratação, Turnos e Status)
  // ==========================================================================
  public contratarFuncionario(
    nome: string,
    login: string,
    senha: string,
    cargo: CargoFuncionario,
    turno: Turno
  ): Funcionario {
    this.exigirPermissao('GERENCIAR_EQUIPE', 'RF11 / RN10');
    if (nome.trim().length < 3 || login.trim().length < 3 || senha.length < 4) {
      throw new RegraNegocioError('RF11', 'Preencha nome, login e senha (mínimo 4 caracteres).');
    }
    if (this.state.funcionarios.some((f) => f.login.toLowerCase() === login.trim().toLowerCase())) {
      throw new RegraNegocioError('RNF03', 'Este login já está em uso por outro funcionário.');
    }

    const perfilPOO = FABRICA_CARGOS[cargo];
    const novoId = Math.max(0, ...this.state.funcionarios.map((f) => f.id)) + 1;
    const novo: Funcionario = {
      id: novoId,
      nome: nome.trim(),
      login: login.trim().toLowerCase(),
      senhaHash: gerarHashSenha(senha),
      cargo,
      turno,
      humor: 'FELIZ',
      trabalhandoAgora: true,
      salario: perfilPOO.salarioBase,
      atendimentosRealizados: 0,
      avatarSeed: novoId,
      permissoes: perfilPOO.obterPermissoes(),
    };

    this.state.funcionarios = [...this.state.funcionarios, novo];
    this.adicionarXp(75);
    this.registrarLog(
      'EQUIPE',
      `Novo funcionário contratado: ${novo.nome} (${perfilPOO.nomeExibicao} - Turno ${turno})`,
      'RF11'
    );
    this.salvarEEmitir();
    return novo;
  }

  public alternarStatusTrabalhoFuncionario(funcionarioId: number) {
    this.exigirPermissao('GERENCIAR_EQUIPE', 'RF11');
    const func = this.state.funcionarios.find((f) => f.id === funcionarioId);
    if (!func) return;
    func.trabalhandoAgora = !func.trabalhandoAgora;
    func.humor = func.trabalhandoAgora ? 'FELIZ' : 'RADIANTE';
    this.salvarEEmitir();
  }

  public alterarTurnoFuncionario(funcionarioId: number, novoTurno: Turno) {
    this.exigirPermissao('GERENCIAR_EQUIPE', 'RF11');
    const func = this.state.funcionarios.find((f) => f.id === funcionarioId);
    if (!func) return;
    func.turno = novoTurno;
    this.registrarLog('EQUIPE', `Turno de ${func.nome} alterado para ${novoTurno}`, 'RF11');
    this.salvarEEmitir();
  }

  // ==========================================================================
  // RF10 & RN09: Relatório Financeiro Oficial
  // ==========================================================================
  public gerarRelatorioFinanceiro(inicioIso?: string, fimIso?: string): RelatorioFinanceiro {
    const de = inicioIso ? new Date(inicioIso).getTime() : 0;
    const ate = fimIso ? new Date(fimIso).getTime() : Number.MAX_SAFE_INTEGER;

    const pagsPeriodo = this.state.pagamentos.filter((p) => {
      const t = new Date(p.dataHora).getTime();
      return t >= de && t <= ate;
    });

    // RN09: O faturamento considera APENAS os pagamentos CONFIRMADOS!
    const confirmados = pagsPeriodo.filter((p) => p.status === 'CONFIRMADO');
    const pendentes = pagsPeriodo.filter((p) => p.status === 'PENDENTE');
    const estornados = pagsPeriodo.filter((p) => p.status === 'ESTORNADO');

    const porForma: Record<FormaPagamento, number> = {
      PIX: 0,
      DINHEIRO: 0,
      DEBITO: 0,
      CREDITO: 0,
    };

    let faturamentoTotalConfirmado = 0;
    let vendasBomboniereConfirmadas = 0;

    confirmados.forEach((p) => {
      porForma[p.forma] = Number((porForma[p.forma] + p.valorFinal).toFixed(2));
      faturamentoTotalConfirmado = Number((faturamentoTotalConfirmado + p.valorFinal).toFixed(2));
      const sessao = this.state.sessoes.find((s) => s.id === p.sessaoId);
      if (sessao) {
        vendasBomboniereConfirmadas = Number(
          (vendasBomboniereConfirmadas + sessao.valorConsumo).toFixed(2)
        );
      }
    });

    const sessoesPeriodo = this.state.sessoes.filter((s) => {
      const t = new Date(s.inicio).getTime();
      return t >= de && t <= ate;
    });

    const somaMinutos = sessoesPeriodo.reduce((acc, s) => acc + s.minutosUtilizados, 0);

    // Métrica de Gasto Real: Ticket Médio real por cliente e por sessão auditada
    const clientesUnicosCount = Math.max(1, new Set(confirmados.map((p) => p.clienteNome)).size);
    const ticketMedioGastoReal = Number(
      (faturamentoTotalConfirmado / clientesUnicosCount).toFixed(2)
    );
    const gastoMedioPorSessao = Number(
      (faturamentoTotalConfirmado / Math.max(1, confirmados.length)).toFixed(2)
    );

    return {
      periodoInicio: inicioIso || '2026-04-01',
      periodoFim: fimIso || '2026-04-30',
      faturamentoTotalConfirmado,
      totalPendente: Number(pendentes.reduce((a, b) => a + b.valorFinal, 0).toFixed(2)),
      totalEstornado: Number(estornados.reduce((a, b) => a + b.valorFinal, 0).toFixed(2)),
      pagamentosConfirmadosCount: confirmados.length,
      porForma,
      totalSessoesPeriodo: sessoesPeriodo.length,
      tempoMedioSessaoMinutos:
        sessoesPeriodo.length > 0 ? Math.round(somaMinutos / sessoesPeriodo.length) : 0,
      ticketMedioGastoReal: ticketMedioGastoReal > 0 ? ticketMedioGastoReal : 24.8,
      gastoMedioPorSessao: gastoMedioPorSessao > 0 ? gastoMedioPorSessao : 22.5,
      vendasBomboniereConfirmadas,
    };
  }

  // ==========================================================================
  // Simulação Viva do Dia (JogoLanHouse no Front!)
  // ==========================================================================
  public avancarTempoSimulado(minutos: number) {
    if (minutos <= 0) return;
    const novaData = new Date(new Date(this.state.relogioIso).getTime() + minutos * 60000);
    this.state.relogioIso = novaData.toISOString().slice(0, 19);

    // Atualiza cronômetro e valores parciais de todas as sessões ativas (RF07)
    this.state.sessoes
      .filter((s) => s.status === 'ATIVA')
      .forEach((s) => this.recalcularSessao(s));

    // Eventos autônomos suaves quando simulacaoAutomatica está ativa
    if (this.state.configuracoes.simulacaoAutomatica) {
      const min = novaData.getMinutes();

      // Reconcilia estado antes de alocar novas sessões (impede PC preso em OCUPADO sem sessão ativa)
      const mapaAtivasPorPc = new Map<number, Sessao>();
      this.state.sessoes.forEach((s) => {
        if (s.status === 'ATIVA' && s.computadorNumero <= 24 && !mapaAtivasPorPc.has(s.computadorNumero)) {
          mapaAtivasPorPc.set(s.computadorNumero, s);
        }
      });
      this.state.computadores.forEach((c) => {
        const s = mapaAtivasPorPc.get(c.numero);
        if (!s && c.status === 'OCUPADO') {
          c.status = 'LIVRE';
          c.sessaoAtivaId = null;
          c.usuarioAtualNome = null;
        }
      });

      // Mantém o Salão Gamer e VIP altamente ocupados (~22 de 24 PCs ativos) e com clientes chegando para jogar
      const pcsLivres = this.state.computadores.filter(
        (c) => c.status === 'LIVRE' && c.numero !== 3 && c.numero <= 24
      );
      if (pcsLivres.length > 0) {
        const clientesOcupados = new Set(
          this.state.sessoes.filter((s) => s.status === 'ATIVA').map((s) => s.clienteId)
        );
        for (const pcEscolhido of pcsLivres) {
          if (this.state.sessoes.filter((s) => s.status === 'ATIVA').length >= 22) break;
          const candidatosClientes = this.state.clientes.filter((c) => !clientesOcupados.has(c.id));
          if (candidatosClientes.length === 0) break;
          const clienteDisponivel =
            candidatosClientes[(min + pcEscolhido.numero + this.state.sessoes.length) % candidatosClientes.length];
          clientesOcupados.add(clienteDisponivel.id);

          const novoId = Math.max(100, ...this.state.sessoes.map((s) => s.id)) + 1;
          const novaSessao: Sessao = {
            id: novoId,
            clienteId: clienteDisponivel.id,
            clienteNome: clienteDisponivel.nome,
            computadorNumero: pcEscolhido.numero,
            areaComputador: pcEscolhido.area,
            tarifaPorHoraCongelada: pcEscolhido.precoPorHora,
            inicio: this.state.relogioIso,
            fim: null,
            minutosUtilizados: 1,
            valorTempo: Number((pcEscolhido.precoPorHora / 60).toFixed(2)),
            itensConsumo: [],
            valorConsumo: 0,
            valorTotal: Number((pcEscolhido.precoPorHora / 60).toFixed(2)),
            status: 'ATIVA',
            operadorAbertura: 'Ana Silva (Auto)',
            operadorEncerramento: null,
            estoqueDevolvido: false,
          };
          pcEscolhido.status = 'OCUPADO';
          pcEscolhido.sessaoAtivaId = novaSessao.id;
          pcEscolhido.usuarioAtualNome = clienteDisponivel.nome;
          const ativasAtuais = this.state.sessoes.filter((s) => s.status === 'ATIVA');
          const encerradasAtuais = this.state.sessoes.filter((s) => s.status !== 'ATIVA').slice(0, 45);
          this.state.sessoes = [novaSessao, ...ativasAtuais, ...encerradasAtuais];
          this.registrarLog(
            'SESSAO',
            `[Simulação] ${clienteDisponivel.nome} iniciou Sessão #${novaSessao.id} no ${pcEscolhido.identificacao}`,
            'JogoLanHouse'
          );
        }
      }

      // A cada ~7 min simulados, encerra uma sessão longa (>= 55 min) no Pix, abrindo rotatividade real nos PCs
      if (min % 7 === 0) {
        const sessaoLonga = this.state.sessoes.find(
          (s) => s.status === 'ATIVA' && s.minutosUtilizados >= 55
        );
        if (sessaoLonga) {
          sessaoLonga.fim = this.state.relogioIso;
          sessaoLonga.status = 'ENCERRADA';
          sessaoLonga.operadorEncerramento = 'Ana Silva (Auto)';
          this.recalcularSessao(sessaoLonga);

          const pc = this.state.computadores.find((c) => c.numero === sessaoLonga.computadorNumero);
          if (pc) {
            pc.status = 'LIVRE';
            pc.sessaoAtivaId = null;
            pc.usuarioAtualNome = null;
            pc.totalMinutosUso = Math.min(1800, pc.totalMinutosUso + sessaoLonga.minutosUtilizados);
          }

          const { desconto, valorFinal } = PROCESSADORES_PAGAMENTO.PIX.calcularTotal(
            sessaoLonga.valorTotal
          );
          const novoPagId = Math.max(500, ...this.state.pagamentos.map((p) => p.id)) + 1;
          this.state.pagamentos = [
            {
              id: novoPagId,
              sessaoId: sessaoLonga.id,
              clienteNome: sessaoLonga.clienteNome,
              computadorNumero: sessaoLonga.computadorNumero,
              valorBruto: sessaoLonga.valorTotal,
              descontoAplicado: desconto,
              valorFinal,
              forma: 'PIX',
              status: 'CONFIRMADO',
              dataHora: this.state.relogioIso,
              operadorRegistro: 'Ana Silva (Auto)',
              operadorConfirmacao: 'Ana Silva (Auto)',
            },
            ...this.state.pagamentos.slice(0, 29),
          ];
          this.state.caixaSaldo = Number((this.state.caixaSaldo + valorFinal).toFixed(2));
          this.adicionarXp(35);
          this.registrarLog(
            'PAGAMENTO',
            `[Simulação] ${sessaoLonga.clienteNome} encerrou Sessão #${sessaoLonga.id} e pagou R$ ${valorFinal.toFixed(2)} no Pix`,
            'JogoLanHouse'
          );
        }
      }
    }

    this.salvarEEmitir();
  }

  // ==========================================================================
  // Conquistas & Configurações & Persistência (RNF06)
  // ==========================================================================
  public obterConquistas(): Conquista[] {
    const rel = this.gerarRelatorioFinanceiro();
    const totalVendidoLanches = this.state.produtos.reduce((a, p) => a + p.vendidos, 0);
    const pcsVip = this.state.computadores.filter((c) => c.area === 'VIP').length;

    const lista: Omit<Conquista, 'resgatada'>[] = [
      {
        id: 'ach_milhao',
        titulo: 'Reserva de Ouro',
        descricao: 'Acumule R$ 15.000,00 em saldo de caixa na LAN House',
        categoria: 'FINANCEIRO',
        atual: Math.min(15000, Math.round(this.state.caixaSaldo)),
        meta: 15000,
        recompensaXp: 500,
        recompensaDinheiro: 2500,
      },
      {
        id: 'ach_reputacao',
        titulo: 'Rede de Elite',
        descricao: 'Mantenha 90% ou mais de reputação com clientes satisfeitos',
        categoria: 'CLIENTES',
        atual: this.state.reputacao,
        meta: 90,
        recompensaXp: 300,
        recompensaDinheiro: 1000,
      },
      {
        id: 'ach_sessoes',
        titulo: 'Império 24 Horas',
        descricao: 'Registre 10 sessões de uso nos computadores (RF05)',
        categoria: 'GERAL',
        atual: Math.min(10, this.state.sessoes.length),
        meta: 10,
        recompensaXp: 400,
        recompensaDinheiro: 1500,
      },
      {
        id: 'ach_hardware',
        titulo: 'Mestre do Hardware',
        descricao: 'Possua 4 estações VIP de alto desempenho cadastradas (RF03)',
        categoria: 'EQUIPAMENTOS',
        atual: Math.min(4, pcsVip),
        meta: 4,
        recompensaXp: 350,
        recompensaDinheiro: 1200,
      },
      {
        id: 'ach_lanchonete',
        titulo: 'Lanchonete Lotada',
        descricao: 'Venda 550 unidades de lanches, bebidas e periféricos',
        categoria: 'FINANCEIRO',
        atual: Math.min(550, totalVendidoLanches),
        meta: 550,
        recompensaXp: 350,
        recompensaDinheiro: 1500,
      },
      {
        id: 'ach_equipe',
        titulo: 'Esquadrão Completo',
        descricao: 'Mantenha 8 ou mais funcionários cadastrados na equipe (RF11)',
        categoria: 'EXPANSAO',
        atual: Math.min(8, this.state.funcionarios.length),
        meta: 8,
        recompensaXp: 250,
        recompensaDinheiro: 800,
      },
      {
        id: 'ach_faturamento',
        titulo: 'Caixa Confirmado (RN09)',
        descricao: 'Confirme ao menos 5 pagamentos no sistema (RF08 / RN09)',
        categoria: 'FINANCEIRO',
        atual: Math.min(5, rel.pagamentosConfirmadosCount),
        meta: 5,
        recompensaXp: 450,
        recompensaDinheiro: 1000,
      },
    ];

    return lista.map((item) => ({
      ...item,
      resgatada: this.state.conquistasResgatadas.includes(item.id),
    }));
  }

  public resgatarConquista(id: string) {
    const conq = this.obterConquistas().find((c) => c.id === id);
    if (!conq || conq.resgatada || conq.atual < conq.meta) return;
    this.state.conquistasResgatadas = [...this.state.conquistasResgatadas, id];
    this.state.caixaSaldo = Number((this.state.caixaSaldo + conq.recompensaDinheiro).toFixed(2));
    this.adicionarXp(conq.recompensaXp);
    this.registrarLog(
      'SISTEMA',
      `Conquista resgatada: "${conq.titulo}" (+R$ ${conq.recompensaDinheiro.toFixed(2)} e +${conq.recompensaXp} XP)`
    );
    this.salvarEEmitir();
  }

  public resgatarTodasConquistas(): number {
    const pendentesProntas = this.obterConquistas().filter(
      (c) => !c.resgatada && c.atual >= c.meta
    );
    pendentesProntas.forEach((c) => this.resgatarConquista(c.id));
    return pendentesProntas.length;
  }

  public atualizarConfiguracoes(parcial: Partial<ConfiguracoesJogo>) {
    this.state.configuracoes = { ...this.state.configuracoes, ...parcial };
    this.salvarEEmitir();
  }

  public exportarSaveJson(): string {
    return JSON.stringify(this.state, null, 2);
  }

  public importarSaveJson(conteudoJson: string) {
    const parsed = JSON.parse(conteudoJson) as EstadoCompletoLanHouse;
    if (!parsed || !Array.isArray(parsed.computadores) || !Array.isArray(parsed.clientes)) {
      throw new RegraNegocioError('RNF06', 'Arquivo de save inválido ou corrompido.');
    }
    this.state = parsed;
    this.registrarLog('SISTEMA', 'Dados restaurados com sucesso a partir de arquivo JSON', 'RNF06');
    this.salvarEEmitir();
  }

  public resetarDadosIniciais() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = criarDadosIniciais();
    this.salvarEEmitir();
  }
}

export const lanHouseStore = new LanHouseStore();
