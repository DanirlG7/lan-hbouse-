import {
  AreaComputador,
  CargoFuncionario,
  Cliente,
  Computador,
  ConfiguracoesJogo,
  Conquista,
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
  RelatorioFinanceiro,
  Sessao,
  SetorMapa,
  Turno,
} from './types';

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

export const FABRICA_CARGOS: Record<CargoFuncionario, PerfilCargoPOO> = {
  ADMINISTRADOR: new CargoAdministrador(),
  RECEPCIONISTA: new CargoRecepcionista(),
  SUPORTE_TECNICO: new CargoSuporteTecnico(),
  LIMPEZA: new CargoLimpeza(),
  DESENVOLVEDOR: new CargoDesenvolvedor(),
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
  ];

  const computadores: Computador[] = [
    // Fileira 1 da Arena Principal (PC-01 a PC-04)
    { numero: 1, identificacao: 'PC-01', area: 'COMUM', categoria: 'PC Básico', especificacoes: 'i5 12400F • 16GB • GTX 1660', precoPorHora: 8.0, status: 'OCUPADO', sessaoAtivaId: 103, usuarioAtualNome: 'Gabriel Rocha', manutencaoMotivo: null, totalMinutosUso: 420 },
    { numero: 2, identificacao: 'PC-02', area: 'COMUM', categoria: 'PC Básico', especificacoes: 'i5 12400F • 16GB • GTX 1660', precoPorHora: 8.0, status: 'LIVRE', sessaoAtivaId: null, usuarioAtualNome: null, manutencaoMotivo: null, totalMinutosUso: 310 },
    { numero: 3, identificacao: 'PC-03', area: 'COMUM', categoria: 'PC Intermediário', especificacoes: 'Ryzen 5 5600X • 16GB • RTX 3060', precoPorHora: 10.0, status: 'MANUTENCAO', sessaoAtivaId: null, usuarioAtualNome: null, manutencaoMotivo: 'Troca de pasta térmica / limpeza', totalMinutosUso: 515 },
    { numero: 4, identificacao: 'PC-04', area: 'COMUM', categoria: 'PC Intermediário', especificacoes: 'Ryzen 5 5600X • 16GB • RTX 3060', precoPorHora: 10.0, status: 'OCUPADO', sessaoAtivaId: 104, usuarioAtualNome: 'Matheus Cardoso', manutencaoMotivo: null, totalMinutosUso: 390 },
    // Fileira 2 da Arena Principal (PC-05 a PC-08)
    { numero: 5, identificacao: 'PC-05', area: 'COMUM', categoria: 'PC Gaming', especificacoes: 'i7 13700K • 32GB • RTX 4060 Ti', precoPorHora: 12.0, status: 'LIVRE', sessaoAtivaId: null, usuarioAtualNome: null, manutencaoMotivo: null, totalMinutosUso: 640 },
    { numero: 6, identificacao: 'PC-06', area: 'COMUM', categoria: 'PC Gaming', especificacoes: 'i7 13700K • 32GB • RTX 4060 Ti', precoPorHora: 12.0, status: 'OCUPADO', sessaoAtivaId: 105, usuarioAtualNome: 'Camila Souza', manutencaoMotivo: null, totalMinutosUso: 480 },
    { numero: 7, identificacao: 'PC-07', area: 'COMUM', categoria: 'PC Intermediário', especificacoes: 'Ryzen 5 5600X • 16GB • RTX 3060', precoPorHora: 10.0, status: 'LIVRE', sessaoAtivaId: null, usuarioAtualNome: null, manutencaoMotivo: null, totalMinutosUso: 275 },
    { numero: 8, identificacao: 'PC-08', area: 'COMUM', categoria: 'PC Gaming', especificacoes: 'i7 13700K • 32GB • RTX 4060 Ti', precoPorHora: 12.0, status: 'OCUPADO', sessaoAtivaId: 108, usuarioAtualNome: 'Beatriz Duarte', manutencaoMotivo: null, totalMinutosUso: 410 },
    // Fileira 3 da Arena Principal (PC-09 a PC-12)
    { numero: 9, identificacao: 'PC-09', area: 'COMUM', categoria: 'PC Gaming', especificacoes: 'Ryzen 7 5700X • 32GB • RTX 4060', precoPorHora: 12.0, status: 'LIVRE', sessaoAtivaId: null, usuarioAtualNome: null, manutencaoMotivo: null, totalMinutosUso: 330 },
    { numero: 10, identificacao: 'PC-10', area: 'COMUM', categoria: 'PC Gaming', especificacoes: 'Ryzen 7 5700X • 32GB • RTX 4060', precoPorHora: 12.0, status: 'OCUPADO', sessaoAtivaId: 109, usuarioAtualNome: 'Gustavo Mendes', manutencaoMotivo: null, totalMinutosUso: 505 },
    { numero: 11, identificacao: 'PC-11', area: 'COMUM', categoria: 'PC Intermediário', especificacoes: 'Ryzen 5 5600X • 16GB • RTX 3060', precoPorHora: 10.0, status: 'OCUPADO', sessaoAtivaId: 110, usuarioAtualNome: 'Felipe Santana', manutencaoMotivo: null, totalMinutosUso: 290 },
    { numero: 12, identificacao: 'PC-12', area: 'COMUM', categoria: 'PC Básico', especificacoes: 'i5 12400F • 16GB • GTX 1660', precoPorHora: 8.0, status: 'LIVRE', sessaoAtivaId: null, usuarioAtualNome: null, manutencaoMotivo: null, totalMinutosUso: 245 },
    // Arena VIP Pro-Gaming Championship (VIP-13 a VIP-18)
    { numero: 13, identificacao: 'VIP-13', area: 'VIP', categoria: 'VIP Station', especificacoes: 'Ryzen 7 7800X3D • 32GB • RTX 4080 • 240Hz', precoPorHora: 18.0, status: 'OCUPADO', sessaoAtivaId: 106, usuarioAtualNome: 'Juliana Alves', manutencaoMotivo: null, totalMinutosUso: 590 },
    { numero: 14, identificacao: 'VIP-14', area: 'VIP', categoria: 'VIP Station', especificacoes: 'Ryzen 7 7800X3D • 32GB • RTX 4080 • 240Hz', precoPorHora: 18.0, status: 'LIVRE', sessaoAtivaId: null, usuarioAtualNome: null, manutencaoMotivo: null, totalMinutosUso: 465 },
    { numero: 15, identificacao: 'VIP-15', area: 'VIP', categoria: 'VIP Station', especificacoes: 'i9 14900K • 64GB • RTX 4090 • 360Hz', precoPorHora: 22.0, status: 'LIVRE', sessaoAtivaId: null, usuarioAtualNome: null, manutencaoMotivo: null, totalMinutosUso: 380 },
    { numero: 16, identificacao: 'VIP-16', area: 'VIP', categoria: 'VIP Station', especificacoes: 'i9 14900K • 64GB • RTX 4090 • 360Hz', precoPorHora: 22.0, status: 'OCUPADO', sessaoAtivaId: 107, usuarioAtualNome: 'Larissa Ferreira', manutencaoMotivo: null, totalMinutosUso: 530 },
    { numero: 17, identificacao: 'VIP-17', area: 'VIP', categoria: 'VIP Station', especificacoes: 'i9 14900K • 64GB • RTX 4090 • 360Hz', precoPorHora: 22.0, status: 'OCUPADO', sessaoAtivaId: 111, usuarioAtualNome: 'Amanda Ribeiro', manutencaoMotivo: null, totalMinutosUso: 615 },
    { numero: 18, identificacao: 'VIP-18', area: 'VIP', categoria: 'VIP Station', especificacoes: 'Ryzen 7 7800X3D • 32GB • RTX 4080 • 240Hz', precoPorHora: 18.0, status: 'LIVRE', sessaoAtivaId: null, usuarioAtualNome: null, manutencaoMotivo: null, totalMinutosUso: 350 },
  ];
  computadores.push(...criarPcsDeck());

  const produtos: Produto[] = [
    { id: 1, nome: 'Soda Neon Lata', categoria: 'BEBIDA', preco: 6.5, estoque: 42, vendidos: 128, icone: 'soda' },
    { id: 2, nome: 'Fatia Pizza Calabresa', categoria: 'LANCHE', preco: 12.0, estoque: 24, vendidos: 95, icone: 'pizza' },
    { id: 3, nome: 'Energético Turbo 473ml', categoria: 'BEBIDA', preco: 14.0, estoque: 30, vendidos: 84, icone: 'energy' },
    { id: 4, nome: 'Combo Burger Pixel', categoria: 'LANCHE', preco: 24.0, estoque: 18, vendidos: 52, icone: 'burger' },
    { id: 5, nome: 'Café Expresso Gamer', categoria: 'BEBIDA', preco: 5.0, estoque: 50, vendidos: 110, icone: 'coffee' },
    { id: 6, nome: 'Headset RGB Pro (Locação/Venda)', categoria: 'PERIFERICO', preco: 45.0, estoque: 12, vendidos: 19, icone: 'headset' },
    { id: 7, nome: 'Mousepad Speed XL', categoria: 'PERIFERICO', preco: 35.0, estoque: 15, vendidos: 23, icone: 'mouse' },
  ];

  // Sessões históricas encerradas + sessões ativas no momento (08:12)
  const sessoes: Sessao[] = [
    {
      id: 101,
      clienteId: 5,
      clienteNome: 'Pedro Henrique',
      computadorNumero: 5,
      areaComputador: 'COMUM',
      tarifaPorHoraCongelada: 12.0,
      inicio: '2026-04-21T06:30:00',
      fim: '2026-04-21T07:45:00',
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
      inicio: '2026-04-21T06:50:00',
      fim: '2026-04-21T07:50:00',
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
      inicio: '2026-04-21T07:20:00',
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
      inicio: '2026-04-21T07:35:00',
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
      inicio: '2026-04-21T07:42:00',
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
      inicio: '2026-04-21T07:12:00',
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
      inicio: '2026-04-21T07:52:00',
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
      inicio: '2026-04-21T07:40:00',
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
      inicio: '2026-04-21T07:30:00',
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
      inicio: '2026-04-21T07:48:00',
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
      inicio: '2026-04-21T07:25:00',
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
      dataHora: '2026-04-21T07:46:00',
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
      dataHora: '2026-04-21T07:51:00',
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
    { id: 'eq_pcs', nome: 'Bancadas Gamer RGB', grupo: 'EQUIPAMENTOS', nivel: 3, nivelMax: 5, custoProximo: 2600, ativo: true, icone: 'pc', beneficio: 'Aumenta conforto nas sessões longas' },
    { id: 'eq_print', nome: 'Central de Impressão Laser', grupo: 'EQUIPAMENTOS', nivel: 1, nivelMax: 3, custoProximo: 950, ativo: true, icone: 'printer', beneficio: 'Gera receita extra de impressões e xerox' },
    { id: 'eq_console', nome: 'Lounge de Consoles Next-Gen', grupo: 'EQUIPAMENTOS', nivel: 2, nivelMax: 4, custoProximo: 3200, ativo: true, icone: 'console', beneficio: 'Atrai grupos de amigos na sala inferior direita' },
    { id: 'eq_monitor', nome: 'Monitores 240Hz / 360Hz', grupo: 'EQUIPAMENTOS', nivel: 2, nivelMax: 5, custoProximo: 2400, ativo: true, icone: 'monitor', beneficio: 'Valoriza as estações VIP (+reputação)' },
    { id: 'srv_bar', nome: 'Bar / Lanchonete Express', grupo: 'SERVICOS', nivel: 1, nivelMax: 1, custoProximo: 0, ativo: true, icone: 'pc', beneficio: 'Entrega de sodas e pizzas direto na mesa do cliente' },
    { id: 'srv_suporte', nome: 'Suporte Técnico Premium', grupo: 'SERVICOS', nivel: 1, nivelMax: 1, custoProximo: 0, ativo: true, icone: 'pc', beneficio: 'Reduz tempo de manutenção preventiva dos PCs' },
    { id: 'srv_24h', nome: 'Modo Funcionamento 24h', grupo: 'SERVICOS', nivel: 1, nivelMax: 1, custoProximo: 0, ativo: true, icone: 'pc', beneficio: 'Mantém a LAN House operando nos 3 turnos' },
    { id: 'srv_eventos', nome: 'Corujão & Torneios eSports', grupo: 'SERVICOS', nivel: 1, nivelMax: 1, custoProximo: 0, ativo: true, icone: 'pc', beneficio: 'Aumenta fluxo de clientes nos fins de semana' },
  ];

  const estadoBase: EstadoCompletoLanHouse = {
    relogioIso: '2026-04-21T08:12:00',
    caixaSaldo: 38500.0,
    reputacao: 94,
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
        corRoupa: f.cargo === 'ADMINISTRADOR' ? '#f59e0b' : '#2563eb',
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
 */
export function calcularTempoEValorSessao(
  inicioIso: string,
  fimOuAgoraIso: string,
  tarifaPorHora: number
): { minutos: number; valorTempo: number } {
  const diffMs = Math.max(0, new Date(fimOuAgoraIso).getTime() - new Date(inicioIso).getTime());
  const minutosBrutos = Math.ceil(diffMs / 60000);
  const minutos = Math.max(1, minutosBrutos);
  const valorTempo = Number(((minutos / 60) * tarifaPorHora).toFixed(2));
  return { minutos, valorTempo };
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
          parsed.personagens = sincronizarPersonagensMapa(parsed);
          return parsed;
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

    const proximoNumero = Math.max(0, ...this.state.computadores.map((c) => c.numero)) + 1;
    const prefixo = area === 'VIP' ? 'VIP' : 'PC';
    const novo: Computador = {
      numero: proximoNumero,
      identificacao: `${prefixo}-${String(proximoNumero).padStart(2, '0')}`,
      area,
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

      // A cada ~17 min simulados, um cliente livre pode abrir sessão automática se houver PC livre
      if (min % 17 === 0) {
        const pcsLivres = this.state.computadores.filter((c) => c.status === 'LIVRE');
        const clientesOcupados = new Set(
          this.state.sessoes.filter((s) => s.status === 'ATIVA').map((s) => s.clienteId)
        );
        const clienteDisponivel = this.state.clientes.find((c) => !clientesOcupados.has(c.id));

        if (pcsLivres.length > 2 && clienteDisponivel) {
          const pcEscolhido = pcsLivres[min % pcsLivres.length];
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
          this.state.sessoes = [novaSessao, ...this.state.sessoes];
          this.registrarLog(
            'SESSAO',
            `[Simulação] ${clienteDisponivel.nome} iniciou Sessão #${novaSessao.id} no ${pcEscolhido.identificacao}`,
            'JogoLanHouse'
          );
        }
      }

      // A cada ~29 min simulados, uma sessão longa (>95 min) encerra e paga via Pix automaticamente
      if (min % 29 === 0) {
        const sessaoLonga = this.state.sessoes.find(
          (s) => s.status === 'ATIVA' && s.minutosUtilizados >= 95
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
            pc.totalMinutosUso += sessaoLonga.minutosUtilizados;
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
            ...this.state.pagamentos,
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
        titulo: 'Primeiro Milhão',
        descricao: 'Acumule R$ 60.000,00 em saldo de caixa na LAN House',
        categoria: 'FINANCEIRO',
        atual: Math.min(60000, Math.round(this.state.caixaSaldo)),
        meta: 60000,
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
