import { Computador, Funcionario, Sessao } from './types';

export type DirecaoSprite = 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';

export type PoseBot =
  | 'WALK'
  | 'IDLE'
  | 'SITTING_PC'
  | 'CARRYING_BOX'
  | 'WORKING_TOOL'
  | 'CLEANING'
  | 'EATING'
  | 'CHATTING';

export type UniformeFuncionario =
  | 'GERENTE'
  | 'RECEPCAO'
  | 'TECNICO'
  | 'ESTOQUE'
  | 'LANCHONETE'
  | 'LIMPEZA'
  | 'DEV';

export type FerramentaTrabalho =
  | 'VASSOURA'
  | 'CHAVE_SOLDA'
  | 'CAIXA'
  | 'PRANCHETA'
  | 'BANDEJA_LANCHE'
  | 'TABLET_EXEC'
  | 'LAPTOP_DEV'
  | 'NONE';

export interface WaypointNode {
  id: string;
  x: number;
  y: number;
  vizinhos: string[];
  etiqueta?: string;
}

/**
 * GRAFO ARQUITETÔNICO EXPANDIDO (18 Computadores + 8 Cômodos Profundos + Calçada Viva)
 * Sincronizado pixel a pixel com LanHouseMapRenderer.ts.
 * - Nenhuma rota cruza bancadas, paredes ou balcões.
 * - Cada fileira de PCs (Fileiras 1, 2 e 3 da Arena e Fileiras 1, 2 e 3 do VIP) possui corredor traseiro exclusivo.
 */
export const WAYPOINT_NODES: Record<string, WaypointNode> = {
  // === 1. CALÇADA EXTERNA VIVA (Eixo Sul Ortogonal: y = 612) ===
  calcada_extremo_esq: {
    id: 'calcada_extremo_esq',
    x: 128,
    y: 612,
    vizinhos: ['calcada_banco_esq'],
    etiqueta: 'Esquina Oeste',
  },
  calcada_banco_esq: {
    id: 'calcada_banco_esq',
    x: 320,
    y: 612,
    vizinhos: ['calcada_extremo_esq', 'calcada_vitrine_esq'],
    etiqueta: 'Banco da Calçada',
  },
  calcada_vitrine_esq: {
    id: 'calcada_vitrine_esq',
    x: 448,
    y: 612,
    vizinhos: ['calcada_banco_esq', 'porta_principal_fora'],
    etiqueta: 'Vitrine Gamer',
  },
  porta_principal_fora: {
    id: 'porta_principal_fora',
    x: 544,
    y: 612,
    vizinhos: ['calcada_vitrine_esq', 'calcada_vitrine_dir', 'porta_principal'],
    etiqueta: 'Calçada Entrada',
  },
  porta_principal: {
    id: 'porta_principal',
    x: 544,
    y: 584,
    vizinhos: ['porta_principal_fora', 'porta_principal_dentro'],
    etiqueta: '🚪 Entrada Principal',
  },
  calcada_vitrine_dir: {
    id: 'calcada_vitrine_dir',
    x: 640,
    y: 612,
    vizinhos: ['porta_principal_fora', 'calcada_banco_dir'],
    etiqueta: 'Vitrine VIP',
  },
  calcada_banco_dir: {
    id: 'calcada_banco_dir',
    x: 768,
    y: 612,
    vizinhos: ['calcada_vitrine_dir', 'calcada_foodtruck'],
    etiqueta: 'Praça Leste',
  },
  calcada_foodtruck: {
    id: 'calcada_foodtruck',
    x: 928,
    y: 612,
    vizinhos: ['calcada_banco_dir', 'calcada_extremo_dir'],
    etiqueta: 'Food Truck ByteBurger',
  },
  calcada_extremo_dir: {
    id: 'calcada_extremo_dir',
    x: 1120,
    y: 612,
    vizinhos: ['calcada_foodtruck'],
    etiqueta: 'Esquina Leste',
  },

  // === 2. EIXO CENTRAL ORTOGONAL (x = 544) ===
  porta_principal_dentro: {
    id: 'porta_principal_dentro',
    x: 544,
    y: 560,
    vizinhos: ['porta_principal', 'corredor_central_3'],
  },
  corredor_central_3: {
    id: 'corredor_central_3',
    x: 544,
    y: 538,
    vizinhos: [
      'porta_principal_dentro',
      'corredor_central_2',
      'corredor_pcs_fila_3',
      'corredor_vip_3',
    ],
  },
  corredor_central_2: {
    id: 'corredor_central_2',
    x: 544,
    y: 452,
    vizinhos: [
      'corredor_central_3',
      'corredor_central_1',
      'corredor_pcs_fila_2',
      'corredor_vip_2',
    ],
  },
  corredor_central_1: {
    id: 'corredor_central_1',
    x: 544,
    y: 368,
    vizinhos: [
      'corredor_central_2',
      'corredor_central_norte',
      'corredor_pcs_fila_1',
      'corredor_vip_1',
    ],
  },
  corredor_central_norte: {
    id: 'corredor_central_norte',
    x: 544,
    y: 312,
    vizinhos: [
      'corredor_central_1',
      'corredor_norte_oeste',
      'corredor_norte_leste',
      'porta_recepcao',
    ],
    etiqueta: 'Hall Central',
  },

  // === 3. CÔMODO 1: ESCRITÓRIO & ESTÚDIO STREAMER (Porta em x = 336, y = 288) ===
  corredor_norte_oeste: {
    id: 'corredor_norte_oeste',
    x: 336,
    y: 312,
    vizinhos: ['corredor_central_norte', 'porta_escritorio', 'corredor_oeste_norte'],
  },
  corredor_oeste_norte: {
    id: 'corredor_oeste_norte',
    x: 224,
    y: 312,
    vizinhos: ['corredor_norte_oeste', 'corredor_oeste_1'],
  },
  porta_escritorio: {
    id: 'porta_escritorio',
    x: 336,
    y: 288,
    vizinhos: ['corredor_norte_oeste', 'lounge_gameon'],
    etiqueta: '🚪 Porta Escritório',
  },
  lounge_gameon: {
    id: 'lounge_gameon',
    x: 336,
    y: 240,
    vizinhos: ['porta_escritorio', 'escritorio_corredor', 'estudio_corredor'],
    etiqueta: 'Hall Estúdio',
  },
  escritorio_corredor: {
    id: 'escritorio_corredor',
    x: 256,
    y: 240,
    vizinhos: ['lounge_gameon', 'escritorio_mesa'],
  },
  escritorio_mesa: {
    id: 'escritorio_mesa',
    x: 256,
    y: 196,
    vizinhos: ['escritorio_corredor'],
    etiqueta: 'Mesa Diretoria',
  },
  estudio_corredor: {
    id: 'estudio_corredor',
    x: 368,
    y: 240,
    vizinhos: ['lounge_gameon', 'estudio_streamer'],
  },
  estudio_streamer: {
    id: 'estudio_streamer',
    x: 368,
    y: 196,
    vizinhos: ['estudio_corredor'],
    etiqueta: 'Estúdio Live',
  },

  // === 4. CÔMODO 2: RECEPÇÃO & CHECK-IN (Porta em x = 544, y = 288) ===
  porta_recepcao: {
    id: 'porta_recepcao',
    x: 544,
    y: 288,
    vizinhos: ['corredor_central_norte', 'recepcao_hall_interno'],
    etiqueta: '🚪 Porta Recepção',
  },
  recepcao_hall_interno: {
    id: 'recepcao_hall_interno',
    x: 544,
    y: 252,
    vizinhos: ['porta_recepcao', 'recepcao_fila_1', 'recepcao_fila_2'],
  },
  recepcao_fila_1: {
    id: 'recepcao_fila_1',
    x: 496,
    y: 252,
    vizinhos: ['recepcao_hall_interno', 'recepcao_porta_interna'],
    etiqueta: 'Fila Check-in',
  },
  recepcao_fila_2: {
    id: 'recepcao_fila_2',
    x: 592,
    y: 252,
    vizinhos: ['recepcao_hall_interno', 'recepcao_geladeira_sul'],
    etiqueta: 'Totem PIX',
  },
  recepcao_geladeira_sul: {
    id: 'recepcao_geladeira_sul',
    x: 648,
    y: 252,
    vizinhos: ['recepcao_fila_2', 'recepcao_geladeira'],
  },
  recepcao_geladeira: {
    id: 'recepcao_geladeira',
    x: 648,
    y: 204,
    vizinhos: ['recepcao_geladeira_sul'],
    etiqueta: 'Vending Machine',
  },
  recepcao_porta_interna: {
    id: 'recepcao_porta_interna',
    x: 460,
    y: 252,
    vizinhos: ['recepcao_fila_1', 'recepcao_acesso_balcao'],
  },
  recepcao_acesso_balcao: {
    id: 'recepcao_acesso_balcao',
    x: 460,
    y: 172,
    vizinhos: ['recepcao_porta_interna', 'recepcao_balcao_esq'],
  },
  recepcao_balcao_esq: {
    id: 'recepcao_balcao_esq',
    x: 512,
    y: 172,
    vizinhos: ['recepcao_acesso_balcao', 'recepcao_balcao_centro'],
  },
  recepcao_balcao_centro: {
    id: 'recepcao_balcao_centro',
    x: 548,
    y: 172,
    vizinhos: ['recepcao_balcao_esq', 'recepcao_balcao_dir'],
  },
  recepcao_balcao_dir: {
    id: 'recepcao_balcao_dir',
    x: 584,
    y: 172,
    vizinhos: ['recepcao_balcao_centro'],
  },

  // === 5. CÔMODO 3: SALA TÉCNICA NOC (Porta em x = 768, y = 288) ===
  corredor_norte_leste: {
    id: 'corredor_norte_leste',
    x: 768,
    y: 312,
    vizinhos: ['corredor_central_norte', 'porta_sala_tecnica', 'corredor_leste_quina'],
  },
  corredor_leste_quina: {
    id: 'corredor_leste_quina',
    x: 832,
    y: 312,
    vizinhos: ['corredor_norte_leste', 'corredor_leste_norte', 'corredor_leste_meio'],
  },
  porta_sala_tecnica: {
    id: 'porta_sala_tecnica',
    x: 768,
    y: 288,
    vizinhos: ['corredor_norte_leste', 'tecnica_hall'],
    etiqueta: '🚪 Porta Sala Técnica',
  },
  tecnica_hall: {
    id: 'tecnica_hall',
    x: 768,
    y: 236,
    vizinhos: ['porta_sala_tecnica', 'tecnica_rack_2', 'tecnica_hall_esq', 'tecnica_bancada'],
  },
  tecnica_hall_esq: {
    id: 'tecnica_hall_esq',
    x: 720,
    y: 236,
    vizinhos: ['tecnica_hall', 'tecnica_rack_1'],
  },
  tecnica_rack_1: {
    id: 'tecnica_rack_1',
    x: 720,
    y: 192,
    vizinhos: ['tecnica_hall_esq'],
  },
  tecnica_rack_2: {
    id: 'tecnica_rack_2',
    x: 768,
    y: 192,
    vizinhos: ['tecnica_hall'],
  },
  tecnica_bancada: {
    id: 'tecnica_bancada',
    x: 816,
    y: 236,
    vizinhos: ['tecnica_hall'],
  },

  // === 6. ARENA GAMER PRINCIPAL (Corredores Ortogonais por Coluna de PC!) ===
  corredor_oeste_1: {
    id: 'corredor_oeste_1',
    x: 224,
    y: 368,
    vizinhos: ['corredor_oeste_norte', 'porta_ala_oeste', 'aisle_pc_01', 'corredor_oeste_2'],
  },
  porta_ala_oeste: {
    id: 'porta_ala_oeste',
    x: 208,
    y: 368,
    vizinhos: ['corredor_oeste_1', 'ala_oeste_lounge'],
    etiqueta: '🚪 Porta Deck Oeste',
  },
  ala_oeste_lounge: {
    id: 'ala_oeste_lounge',
    x: 144,
    y: 368,
    vizinhos: ['porta_ala_oeste', 'deck_corredor_norte', 'deck_corredor_sul'],
    etiqueta: 'Deck Gamer',
  },
  // Corredor central do Deck Gamer (x = 144) com 6 estacoes extras (PC-19..PC-24)
  deck_corredor_norte: {
    id: 'deck_corredor_norte',
    x: 144,
    y: 330,
    vizinhos: ['ala_oeste_lounge', 'deck_corredor_norte_2', 'deck_21_seat', 'deck_22_seat'],
  },
  deck_corredor_norte_2: {
    id: 'deck_corredor_norte_2',
    x: 144,
    y: 250,
    vizinhos: ['deck_corredor_norte', 'deck_19_seat', 'deck_20_seat'],
  },
  deck_corredor_sul: {
    id: 'deck_corredor_sul',
    x: 144,
    y: 470,
    vizinhos: ['ala_oeste_lounge', 'deck_23_seat', 'deck_24_seat'],
  },
  deck_19_seat: { id: 'deck_19_seat', x: 112, y: 250, vizinhos: ['deck_corredor_norte_2'] },
  deck_20_seat: { id: 'deck_20_seat', x: 176, y: 250, vizinhos: ['deck_corredor_norte_2'] },
  deck_21_seat: { id: 'deck_21_seat', x: 112, y: 330, vizinhos: ['deck_corredor_norte'] },
  deck_22_seat: { id: 'deck_22_seat', x: 176, y: 330, vizinhos: ['deck_corredor_norte'] },
  deck_23_seat: { id: 'deck_23_seat', x: 112, y: 470, vizinhos: ['deck_corredor_sul'] },
  deck_24_seat: { id: 'deck_24_seat', x: 176, y: 470, vizinhos: ['deck_corredor_sul'] },  corredor_oeste_2: {
    id: 'corredor_oeste_2',
    x: 224,
    y: 452,
    vizinhos: ['corredor_oeste_1', 'aisle_pc_05', 'corredor_oeste_3'],
  },
  corredor_oeste_3: {
    id: 'corredor_oeste_3',
    x: 224,
    y: 538,
    vizinhos: ['corredor_oeste_2', 'aisle_pc_09'],
  },

  // Fileira 1 (y = 368) - Ortogonal atrás de PC-01 a PC-04
  aisle_pc_01: { id: 'aisle_pc_01', x: 258, y: 368, vizinhos: ['corredor_oeste_1', 'aisle_pc_02', 'pc_01_seat'] },
  aisle_pc_02: { id: 'aisle_pc_02', x: 326, y: 368, vizinhos: ['aisle_pc_01', 'corredor_pcs_fila_1', 'pc_02_seat'] },
  corredor_pcs_fila_1: { id: 'corredor_pcs_fila_1', x: 394, y: 368, vizinhos: ['aisle_pc_02', 'aisle_pc_04', 'pc_03_seat'] },
  aisle_pc_04: { id: 'aisle_pc_04', x: 462, y: 368, vizinhos: ['corredor_pcs_fila_1', 'corredor_central_1', 'pc_04_seat'] },

  // Fileira 2 (y = 452) - Ortogonal atrás de PC-05 a PC-08
  aisle_pc_05: { id: 'aisle_pc_05', x: 258, y: 452, vizinhos: ['corredor_oeste_2', 'aisle_pc_06', 'pc_05_seat'] },
  aisle_pc_06: { id: 'aisle_pc_06', x: 326, y: 452, vizinhos: ['aisle_pc_05', 'corredor_pcs_fila_2', 'pc_06_seat'] },
  corredor_pcs_fila_2: { id: 'corredor_pcs_fila_2', x: 394, y: 452, vizinhos: ['aisle_pc_06', 'aisle_pc_08', 'pc_07_seat'] },
  aisle_pc_08: { id: 'aisle_pc_08', x: 462, y: 452, vizinhos: ['corredor_pcs_fila_2', 'corredor_central_2', 'pc_08_seat'] },

  // Fileira 3 (y = 538) - Ortogonal atrás de PC-09 a PC-12
  aisle_pc_09: { id: 'aisle_pc_09', x: 258, y: 538, vizinhos: ['corredor_oeste_3', 'aisle_pc_10', 'pc_09_seat'] },
  aisle_pc_10: { id: 'aisle_pc_10', x: 326, y: 538, vizinhos: ['aisle_pc_09', 'corredor_pcs_fila_3', 'pc_10_seat'] },
  corredor_pcs_fila_3: { id: 'corredor_pcs_fila_3', x: 394, y: 538, vizinhos: ['aisle_pc_10', 'aisle_pc_12', 'pc_11_seat'] },
  aisle_pc_12: { id: 'aisle_pc_12', x: 462, y: 538, vizinhos: ['corredor_pcs_fila_3', 'corredor_central_3', 'pc_12_seat'] },

  // Assentos PC-01 a PC-12 (Entrada 100% vertical de 26px a partir do corredor!)
  pc_01_seat: { id: 'pc_01_seat', x: 258, y: 342, vizinhos: ['aisle_pc_01'] },
  pc_02_seat: { id: 'pc_02_seat', x: 326, y: 342, vizinhos: ['aisle_pc_02'] },
  pc_03_seat: { id: 'pc_03_seat', x: 394, y: 342, vizinhos: ['corredor_pcs_fila_1'] },
  pc_04_seat: { id: 'pc_04_seat', x: 462, y: 342, vizinhos: ['aisle_pc_04'] },

  pc_05_seat: { id: 'pc_05_seat', x: 258, y: 424, vizinhos: ['aisle_pc_05'] },
  pc_06_seat: { id: 'pc_06_seat', x: 326, y: 424, vizinhos: ['aisle_pc_06'] },
  pc_07_seat: { id: 'pc_07_seat', x: 394, y: 424, vizinhos: ['corredor_pcs_fila_2'] },
  pc_08_seat: { id: 'pc_08_seat', x: 462, y: 424, vizinhos: ['aisle_pc_08'] },

  pc_09_seat: { id: 'pc_09_seat', x: 258, y: 506, vizinhos: ['aisle_pc_09'] },
  pc_10_seat: { id: 'pc_10_seat', x: 326, y: 506, vizinhos: ['aisle_pc_10'] },
  pc_11_seat: { id: 'pc_11_seat', x: 394, y: 506, vizinhos: ['corredor_pcs_fila_3'] },
  pc_12_seat: { id: 'pc_12_seat', x: 462, y: 506, vizinhos: ['aisle_pc_12'] },

  // === 7. ARENA VIP PRO-GAMING (Corredores Ortogonais por Coluna VIP!) ===
  aisle_vip_13: { id: 'aisle_vip_13', x: 636, y: 368, vizinhos: ['corredor_central_1', 'corredor_vip_1', 'vip_13_seat'] },
  corredor_vip_1: { id: 'corredor_vip_1', x: 742, y: 368, vizinhos: ['aisle_vip_13', 'corredor_leste_meio', 'vip_14_seat'] },

  aisle_vip_15: { id: 'aisle_vip_15', x: 636, y: 452, vizinhos: ['corredor_central_2', 'corredor_vip_2', 'vip_15_seat'] },
  corredor_vip_2: { id: 'corredor_vip_2', x: 742, y: 452, vizinhos: ['aisle_vip_15', 'corredor_leste_sul_meio', 'vip_16_seat'] },

  aisle_vip_17: { id: 'aisle_vip_17', x: 636, y: 538, vizinhos: ['corredor_central_3', 'corredor_vip_3', 'vip_17_seat'] },
  corredor_vip_3: { id: 'corredor_vip_3', x: 742, y: 538, vizinhos: ['aisle_vip_17', 'corredor_leste_base', 'vip_18_seat'] },

  vip_13_seat: { id: 'vip_13_seat', x: 636, y: 342, vizinhos: ['aisle_vip_13'] },
  vip_14_seat: { id: 'vip_14_seat', x: 742, y: 342, vizinhos: ['corredor_vip_1'] },
  vip_15_seat: { id: 'vip_15_seat', x: 636, y: 424, vizinhos: ['aisle_vip_15'] },
  vip_16_seat: { id: 'vip_16_seat', x: 742, y: 424, vizinhos: ['corredor_vip_2'] },
  vip_17_seat: { id: 'vip_17_seat', x: 636, y: 506, vizinhos: ['aisle_vip_17'] },
  vip_18_seat: { id: 'vip_18_seat', x: 742, y: 506, vizinhos: ['corredor_vip_3'] },

  // === 8. CORREDOR VERTICAL DA ALA LESTE (x = 832 — 100% Reto!) ===
  corredor_leste_norte: {
    id: 'corredor_leste_norte',
    x: 832,
    y: 240,
    vizinhos: ['corredor_leste_quina', 'porta_cozinha'],
  },
  corredor_leste_meio: {
    id: 'corredor_leste_meio',
    x: 832,
    y: 368,
    vizinhos: ['corredor_leste_quina', 'corredor_vip_1', 'porta_estoque', 'corredor_leste_sul_meio'],
  },
  corredor_leste_sul_meio: {
    id: 'corredor_leste_sul_meio',
    x: 832,
    y: 452,
    vizinhos: ['corredor_leste_meio', 'corredor_vip_2', 'corredor_leste_sul'],
  },
  corredor_leste_sul: {
    id: 'corredor_leste_sul',
    x: 832,
    y: 512,
    vizinhos: ['corredor_leste_sul_meio', 'porta_sala_vip', 'corredor_leste_base'],
  },
  corredor_leste_base: {
    id: 'corredor_leste_base',
    x: 832,
    y: 538,
    vizinhos: ['corredor_leste_sul', 'corredor_vip_3'],
  },

  // === 9. CÔMODO 6: LANCHONETE & RAMEN BAR (Porta em x = 864, y = 240) ===
  porta_cozinha: {
    id: 'porta_cozinha',
    x: 864,
    y: 240,
    vizinhos: ['corredor_leste_norte', 'cozinha_hall'],
    etiqueta: '🚪 Porta Lanchonete',
  },
  cozinha_hall: {
    id: 'cozinha_hall',
    x: 912,
    y: 240,
    vizinhos: ['porta_cozinha', 'cozinha_mesa_1', 'cozinha_mesa_3'],
  },
  cozinha_mesa_1: {
    id: 'cozinha_mesa_1',
    x: 912,
    y: 204,
    vizinhos: ['cozinha_hall', 'cozinha_geladeira', 'cozinha_balcao'],
  },
  cozinha_geladeira: {
    id: 'cozinha_geladeira',
    x: 912,
    y: 174,
    vizinhos: ['cozinha_mesa_1', 'cozinha_balcao'],
  },
  cozinha_balcao: {
    id: 'cozinha_balcao',
    x: 976,
    y: 174,
    vizinhos: ['cozinha_geladeira', 'cozinha_mesa_1', 'cozinha_mesa_2'],
  },
  cozinha_mesa_2: {
    id: 'cozinha_mesa_2',
    x: 976,
    y: 204,
    vizinhos: ['cozinha_balcao', 'cozinha_mesa_3'],
  },
  cozinha_mesa_3: {
    id: 'cozinha_mesa_3',
    x: 976,
    y: 240,
    vizinhos: ['cozinha_hall', 'cozinha_mesa_2'],
  },

  // === 10. CÔMODO 7: ESTOQUE DE HARDWARE (Porta em x = 864, y = 368) ===
  porta_estoque: {
    id: 'porta_estoque',
    x: 864,
    y: 368,
    vizinhos: ['corredor_leste_meio', 'estoque_prateleira_1'],
    etiqueta: '🚪 Porta Estoque',
  },
  estoque_prateleira_1: {
    id: 'estoque_prateleira_1',
    x: 912,
    y: 368,
    vizinhos: ['porta_estoque', 'estoque_prateleira_2', 'estoque_caixas'],
  },
  estoque_prateleira_2: {
    id: 'estoque_prateleira_2',
    x: 984,
    y: 368,
    vizinhos: ['estoque_prateleira_1'],
  },
  estoque_caixas: {
    id: 'estoque_caixas',
    x: 912,
    y: 408,
    vizinhos: ['estoque_prateleira_1'],
  },

  // === 11. CÔMODO 8: LOUNGE CONSOLES & ARENA E-SPORTS (Porta em x = 864, y = 512) ===
  porta_sala_vip: {
    id: 'porta_sala_vip',
    x: 864,
    y: 512,
    vizinhos: ['corredor_leste_sul', 'sala_vip_arcade'],
    etiqueta: '🚪 Porta Consoles VIP',
  },
  sala_vip_arcade: {
    id: 'sala_vip_arcade',
    x: 912,
    y: 512,
    vizinhos: ['porta_sala_vip', 'sala_vip_sofa', 'sala_vip_tv'],
  },
  sala_vip_sofa: {
    id: 'sala_vip_sofa',
    x: 912,
    y: 548,
    vizinhos: ['sala_vip_arcade'],
  },
  sala_vip_tv: {
    id: 'sala_vip_tv',
    x: 992,
    y: 512,
    vizinhos: ['sala_vip_arcade', 'porta_arena_esports'],
  },
  porta_arena_esports: {
    id: 'porta_arena_esports',
    x: 1040,
    y: 512,
    vizinhos: ['sala_vip_tv', 'arena_esports_palco'],
    etiqueta: '🚪 Porta Arena E-Sports',
  },
  arena_esports_palco: {
    id: 'arena_esports_palco',
    x: 1104,
    y: 512,
    vizinhos: ['porta_arena_esports'],
    etiqueta: 'Arena E-Sports',
  },
};

export function nodoAssentoDoPc(numeroPc: number): string {
  if (numeroPc >= 1 && numeroPc <= 12) {
    return `pc_${String(numeroPc).padStart(2, '0')}_seat`;
  }
  if (numeroPc >= 13 && numeroPc <= 18) {
    return `vip_${String(numeroPc).padStart(2, '0')}_seat`;
  }
  if (numeroPc >= 19 && numeroPc <= 24) {
    return `deck_${String(numeroPc).padStart(2, '0')}_seat`;
  }
  return 'pc_01_seat';
}

export function calcularCaminhoNoGrafo(origemId: string, destinoId: string): string[] {
  if (origemId === destinoId) return [];
  if (!WAYPOINT_NODES[origemId] || !WAYPOINT_NODES[destinoId]) return [destinoId];

  const fila: string[][] = [[origemId]];
  const visitados = new Set<string>([origemId]);

  while (fila.length > 0) {
    const caminho = fila.shift()!;
    const atual = caminho[caminho.length - 1];

    if (atual === destinoId) {
      return caminho.slice(1);
    }

    const nodo = WAYPOINT_NODES[atual];
    if (!nodo) continue;

    for (const viz of nodo.vizinhos) {
      if (!visitados.has(viz)) {
        visitados.add(viz);
        fila.push([...caminho, viz]);
      }
    }
  }

  return [destinoId];
}

export interface AgenteBot {
  id: string;
  nome: string;
  papel: string;
  ehCliente: boolean;
  x: number;
  y: number;
  nodoAtualId: string;
  filaRota: string[];
  direcao: DirecaoSprite;
  pose: PoseBot;
  acaoTexto: string; // Descrição completa (aparece no hover/inspeção)
  falaCurta: string; // Tag curta e super legível (máx ~15 chars)
  iconeCabeca?: string;
  mostrarBalao: boolean;
  timerEsperaFrames: number;
  timerConversaFrames: number;
  cooldownConversaFrames: number;
  etapaRotina: number;
  corRoupa: string;
  corCabelo: string;
  temFone: boolean;
  uniforme?: UniformeFuncionario;
  ferramenta?: FerramentaTrabalho;
}

const CORES_ROUPA_BOT = [
  '#2563eb',
  '#e11d48',
  '#059669',
  '#7c3aed',
  '#d97706',
  '#0284c7',
  '#db2777',
  '#4f46e5',
  '#0d9488',
  '#ea580c',
];
const CORES_CABELO_BOT = ['#7c2d12', '#1e293b', '#92400e', '#7f1d1d', '#3b0764', '#3f3f46'];

// Diálogos curtos e aleatórios quando 2 bots param para conversar na calçada ou nos corredores!
const DIALOGOS_CONVERSA_CURTOS: Array<[string, string]> = [
  ['"Bora CS2?"', '"Fechou, PC 8!"'],
  ['"Ping tá 1ms!"', '"Fibra braba!"'],
  ['"Viu o VIP?"', '"RTX 4090 lisa!"'],
  ['"Pede pizza?"', '"Com energético!"'],
  ['"Vai no camp?"', '"Time fechado!"'],
  ['"144Hz ou 360?"', '"360Hz no VIP!"'],
  ['"Bora FIFA?"', '"No PS5 agora!"'],
  ['"Combo Burger?"', '"Bora no Truck!"'],
];

export class SimuladorBotsMapa {
  private bots = new Map<string, AgenteBot>();
  private globalTick = 0;

  private criarOuAtualizarBot(
    id: string,
    nome: string,
    papel: string,
    ehCliente: boolean,
    nodoInicial: string,
    corRoupa: string,
    corCabelo: string,
    temFone = false
  ): AgenteBot {
    const existente = this.bots.get(id);
    if (existente) {
      existente.nome = nome;
      existente.papel = papel;
      return existente;
    }
    const coords = WAYPOINT_NODES[nodoInicial] || WAYPOINT_NODES.corredor_central_1;
    const novo: AgenteBot = {
      id,
      nome,
      papel,
      ehCliente,
      x: coords.x,
      y: coords.y,
      nodoAtualId: nodoInicial,
      filaRota: [],
      direcao: 'DOWN',
      pose: 'IDLE',
      acaoTexto: 'No local',
      falaCurta: '✨',
      mostrarBalao: false,
      timerEsperaFrames: 20,
      timerConversaFrames: 0,
      cooldownConversaFrames: 90,
      etapaRotina: 0,
      corRoupa,
      corCabelo,
      temFone,
    };
    this.bots.set(id, novo);
    return novo;
  }

  private enviarParaDestino(bot: AgenteBot, nodoDestinoId: string) {
    if (bot.nodoAtualId === nodoDestinoId && bot.filaRota.length === 0) return;
    bot.filaRota = calcularCaminhoNoGrafo(bot.nodoAtualId, nodoDestinoId);
  }

  private avancarMovimentoFisico(bot: AgenteBot, velocidade: number): boolean {
    // Se o bot parou para conversar com alguém, fica parado olhando para o colega!
    if (bot.timerConversaFrames > 0) {
      bot.timerConversaFrames--;
      bot.pose = 'CHATTING';
      bot.mostrarBalao = true;
      return false;
    }
    if (bot.cooldownConversaFrames > 0) {
      bot.cooldownConversaFrames--;
    }

    if (bot.filaRota.length === 0) {
      return true;
    }

    const proxId = bot.filaRota[0];
    const alvo = WAYPOINT_NODES[proxId];
    if (!alvo) {
      bot.filaRota.shift();
      return bot.filaRota.length === 0;
    }

    const dx = alvo.x - bot.x;
    const dy = alvo.y - bot.y;
    const dist = Math.hypot(dx, dy);

    if (Math.abs(dx) > Math.abs(dy)) {
      bot.direcao = dx >= 0 ? 'RIGHT' : 'LEFT';
    } else {
      bot.direcao = dy >= 0 ? 'DOWN' : 'UP';
    }

    if (bot.pose !== 'CARRYING_BOX') {
      bot.pose = 'WALK';
    }

    if (dist <= velocidade) {
      bot.x = alvo.x;
      bot.y = alvo.y;
      bot.nodoAtualId = proxId;
      bot.filaRota.shift();
      return bot.filaRota.length === 0;
    } else {
      bot.x += (dx / dist) * velocidade;
      bot.y += (dy / dist) * velocidade;
      return false;
    }
  }

  // Detecta bots próximos na calçada ou nos corredores para pararem e baterem papo!
  private processarEncontrosSociais(listaBots: AgenteBot[]) {
    for (let i = 0; i < listaBots.length; i++) {
      const a = listaBots[i];
      if (
        a.pose === 'SITTING_PC' ||
        a.pose === 'WORKING_TOOL' ||
        a.pose === 'CARRYING_BOX' ||
        a.timerConversaFrames > 0 ||
        a.cooldownConversaFrames > 0 ||
        a.id === 'staff_recepcao'
      ) {
        continue;
      }

      for (let j = i + 1; j < listaBots.length; j++) {
        const b = listaBots[j];
        if (
          b.pose === 'SITTING_PC' ||
          b.pose === 'WORKING_TOOL' ||
          b.pose === 'CARRYING_BOX' ||
          b.timerConversaFrames > 0 ||
          b.cooldownConversaFrames > 0 ||
          b.id === 'staff_recepcao'
        ) {
          continue;
        }

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);

        // Se estiverem lado a lado na calçada ou corredor (entre 16px e 36px)
        if (dist >= 14 && dist <= 36 && Math.abs(dy) <= 18) {
          // 18% de chance de pararem para conversar
          if ((this.globalTick + i * 7 + j * 13) % 5 === 0) {
            const parDialogo =
              DIALOGOS_CONVERSA_CURTOS[
                (this.globalTick + i + j) % DIALOGOS_CONVERSA_CURTOS.length
              ];
            a.timerConversaFrames = 150;
            b.timerConversaFrames = 150;
            a.cooldownConversaFrames = 520;
            b.cooldownConversaFrames = 520;
            a.direcao = dx >= 0 ? 'RIGHT' : 'LEFT';
            b.direcao = dx >= 0 ? 'LEFT' : 'RIGHT';
            a.iconeCabeca = '💬';
            b.iconeCabeca = '💬';
            a.falaCurta = parDialogo[0];
            b.falaCurta = parDialogo[1];
            a.acaoTexto = `Conversando com ${b.nome}: ${parDialogo[0]}`;
            b.acaoTexto = `Respondendo ${a.nome}: ${parDialogo[1]}`;
            break;
          }
        }
      }
    }
  }

  public atualizarFrame(
    computadores: Computador[],
    sessoesAtivas: Sessao[],
    funcionarios: Funcionario[]
  ): AgenteBot[] {
    this.globalTick++;
    const idsAtivosNesteFrame = new Set<string>();

    // =========================================================================
    // 1. EQUIPE DE FUNCIONÁRIOS UNIFORMIZADOS E COM FERRAMENTAS DE TRABALHO (RF11)
    // =========================================================================
    const ativos = funcionarios.filter((f) => f.trabalhandoAgora);
    let contRecepcao = 0;

    ativos.forEach((func) => {
      const id = `staff_func_${func.id}`;
      idsAtivosNesteFrame.add(id);
      const primeiroNome = func.nome.split(' ')[0];

      // 1A. ADMINISTRADOR / GERENTE EXECUTIVO (Ex: Daniel)
      if (func.cargo === 'ADMINISTRADOR') {
        const bot = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          'Gerente Geral',
          false,
          'escritorio_mesa',
          '#1e293b',
          '#5c361b',
          false
        );
        bot.uniforme = 'GERENTE';
        const chegou = this.avancarMovimentoFisico(bot, 1.28);
        if (chegou && bot.timerConversaFrames === 0) {
          bot.pose = 'WORKING_TOOL';
          bot.ferramenta = 'TABLET_EXEC';
          bot.direcao = 'DOWN';
          bot.mostrarBalao = true;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
          } else {
            const rotaGerente = [
              { nodo: 'escritorio_mesa', curto: 'Gestão POO', txt: 'Auditando Caixa e Relatórios (RF10)', icone: '📊' },
              { nodo: 'estudio_streamer', curto: 'Live Game On', txt: 'Supervisionando Estúdio de Podcast', icone: '🎙️' },
              { nodo: 'recepcao_balcao_dir', curto: 'Checando PIX', txt: 'Conferindo Pagamentos no Balcão (RN09)', icone: '💼' },
              { nodo: 'corredor_vip_1', curto: 'Vistoria VIP', txt: 'Inspecionando Arena VIP Championship', icone: '⭐' },
              { nodo: 'arena_esports_palco', curto: 'Palco Torneio', txt: 'Organizando Campeonato no Palco E-Sports', icone: '🏆' },
            ];
            bot.etapaRotina = (bot.etapaRotina + 1) % rotaGerente.length;
            const p = rotaGerente[bot.etapaRotina];
            this.enviarParaDestino(bot, p.nodo);
            bot.falaCurta = p.curto;
            bot.acaoTexto = p.txt;
            bot.iconeCabeca = p.icone;
            bot.timerEsperaFrames = 190;
          }
        } else if (!chegou) {
          bot.ferramenta = 'TABLET_EXEC';
          bot.mostrarBalao = false;
        }
        return;
      }

      // 1B. DESENVOLVEDOR DE SISTEMAS (Ex: Diego)
      if (func.cargo === 'DESENVOLVEDOR') {
        const bot = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          'Dev Sistemas',
          false,
          'tecnica_rack_2',
          '#7e22ce',
          '#1e293b',
          true
        );
        bot.uniforme = 'DEV';
        const chegou = this.avancarMovimentoFisico(bot, 1.35);
        if (chegou && bot.timerConversaFrames === 0) {
          bot.pose = 'WORKING_TOOL';
          bot.ferramenta = 'LAPTOP_DEV';
          bot.direcao = 'UP';
          bot.mostrarBalao = true;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
          } else {
            const rotaDev = [
              { nodo: 'tecnica_rack_2', curto: 'Java Server', txt: 'Otimizando Backend Java POO no Rack', icone: '💻' },
              { nodo: 'escritorio_mesa', curto: 'Deploy API', txt: 'Compilando Atualização do Sistema', icone: '⚡' },
              { nodo: 'estudio_streamer', curto: 'OBS Stream', txt: 'Configurando Bitrate da Transmissão', icone: '📡' },
            ];
            bot.etapaRotina = (bot.etapaRotina + 1) % rotaDev.length;
            const p = rotaDev[bot.etapaRotina];
            this.enviarParaDestino(bot, p.nodo);
            bot.falaCurta = p.curto;
            bot.acaoTexto = p.txt;
            bot.iconeCabeca = p.icone;
            bot.timerEsperaFrames = 185;
          }
        } else if (!chegou) {
          bot.ferramenta = 'LAPTOP_DEV';
          bot.mostrarBalao = false;
        }
        return;
      }

      // 1C. SUPORTE TÉCNICO (Ex: Lucas Ribeiro, Bruno Costa)
      if (func.cargo === 'SUPORTE_TECNICO') {
        const bot = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          'Técnico TI',
          false,
          'tecnica_bancada',
          '#0284c7',
          '#1e293b',
          true
        );
        bot.uniforme = 'TECNICO';

        const pcEmManutencao = computadores.find((c) => c.status === 'MANUTENCAO');
        const chegou = this.avancarMovimentoFisico(bot, 1.6);

        if (pcEmManutencao) {
          const nodoPc = nodoAssentoDoPc(pcEmManutencao.numero);
          if (bot.nodoAtualId !== nodoPc && bot.filaRota.length === 0) {
            this.enviarParaDestino(bot, nodoPc);
            bot.ferramenta = 'CHAVE_SOLDA';
            bot.falaCurta = `Indo ${pcEmManutencao.identificacao}`;
            bot.acaoTexto = `Levando maleta de ferramentas ao ${pcEmManutencao.identificacao}`;
            bot.iconeCabeca = '🔧';
            bot.mostrarBalao = true;
          } else if (chegou && bot.nodoAtualId === nodoPc) {
            bot.pose = 'WORKING_TOOL';
            bot.ferramenta = 'CHAVE_SOLDA';
            bot.direcao = 'UP';
            bot.falaCurta = `Reparo ${pcEmManutencao.identificacao}`;
            bot.acaoTexto = `Soldando e trocando pasta térmica do ${pcEmManutencao.identificacao}`;
            bot.iconeCabeca = '🔧';
            bot.mostrarBalao = true;
          }
        } else if (chegou) {
          bot.mostrarBalao = true;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
            bot.pose = 'WORKING_TOOL';
            bot.ferramenta = bot.nodoAtualId === 'escritorio_mesa' ? 'PRANCHETA' : 'CHAVE_SOLDA';
            bot.direcao = 'UP';
          } else {
            bot.etapaRotina = (bot.etapaRotina + 1) % 4;
            if (bot.etapaRotina === 0) {
              this.enviarParaDestino(bot, 'tecnica_rack_1');
              bot.falaCurta = 'Ping 1ms OK';
              bot.acaoTexto = 'Crimpando cabos nos Racks Fibra Óptica';
              bot.iconeCabeca = '🖧';
              bot.timerEsperaFrames = 175;
            } else if (bot.etapaRotina === 1) {
              this.enviarParaDestino(bot, 'tecnica_bancada');
              bot.falaCurta = 'Soldando GPU';
              bot.acaoTexto = 'Testando Placa de Vídeo com Ferro de Solda';
              bot.iconeCabeca = '🔧';
              bot.timerEsperaFrames = 210;
            } else if (bot.etapaRotina === 2) {
              this.enviarParaDestino(bot, 'corredor_vip_2');
              bot.falaCurta = 'Coolers VIP';
              bot.acaoTexto = 'Calibrando WaterCooler da Arena VIP';
              bot.iconeCabeca = '❄️';
              bot.timerEsperaFrames = 145;
            } else {
              this.enviarParaDestino(bot, 'escritorio_mesa');
              bot.falaCurta = 'Laudo TI';
              bot.acaoTexto = 'Assinando Laudo Técnico no Escritório';
              bot.iconeCabeca = '📋';
              bot.timerEsperaFrames = 150;
            }
          }
        } else {
          bot.ferramenta = 'CHAVE_SOLDA';
          bot.mostrarBalao = false;
        }
        return;
      }

      // 1D. ZELADORIA / LIMPEZA (Ex: Carla Mendes)
      if (func.cargo === 'LIMPEZA') {
        const bot = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          'Zeladoria',
          false,
          'corredor_central_2',
          '#059669',
          '#7f1d1d',
          false
        );
        bot.uniforme = 'LIMPEZA';
        const chegou = this.avancarMovimentoFisico(bot, 1.35);
        if (chegou && bot.timerConversaFrames === 0) {
          bot.pose = 'CLEANING';
          bot.ferramenta = 'VASSOURA';
          bot.direcao = 'DOWN';
          bot.mostrarBalao = true;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
          } else {
            const pontosLimpeza = [
              { nodo: 'corredor_pcs_fila_3', curto: 'Varrendo Arena', txt: 'Varrendo Corredor da Arena Gamer' },
              { nodo: 'estudio_streamer', curto: 'Limpando Estúdio', txt: 'Higienizando Estúdio GAME ON' },
              { nodo: 'corredor_central_norte', curto: 'Polindo Hall', txt: 'Lustrando Piso da Recepção' },
              { nodo: 'ala_oeste_lounge', curto: 'Varrendo Deck', txt: 'Varrendo Deck Cyber Lounge Oeste' },
              { nodo: 'sala_vip_sofa', curto: 'Arrumando VIP', txt: 'Organizando Lounge de Consoles' },
            ];
            bot.etapaRotina = (bot.etapaRotina + 1) % pontosLimpeza.length;
            const alvo = pontosLimpeza[bot.etapaRotina];
            this.enviarParaDestino(bot, alvo.nodo);
            bot.falaCurta = alvo.curto;
            bot.acaoTexto = alvo.txt;
            bot.iconeCabeca = '🧹';
            bot.timerEsperaFrames = 185;
          }
        } else if (bot.timerConversaFrames === 0) {
          bot.ferramenta = 'VASSOURA';
          bot.mostrarBalao = false;
        }
        return;
      }

      // 1E. RECEPCIONISTAS DISTRIBUÍDOS POR FUNÇÃO (1º Balcão PIX, 2º Estoque/Logística, 3º Barista/Lanchonete)
      const slotRecep = contRecepcao++;
      if (slotRecep === 0) {
        // Recepcionista Titular no Balcão (Ex: Ana Silva)
        const bot = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          'Recepção',
          false,
          'recepcao_balcao_centro',
          '#2563eb',
          '#92400e',
          true
        );
        bot.uniforme = 'RECEPCAO';
        const chegou = this.avancarMovimentoFisico(bot, 1.15);
        if (chegou) {
          bot.pose = 'WORKING_TOOL';
          bot.ferramenta = 'PRANCHETA';
          bot.direcao = 'DOWN';
          bot.mostrarBalao = true;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
          } else {
            bot.etapaRotina = (bot.etapaRotina + 1) % 3;
            if (bot.etapaRotina === 0) {
              this.enviarParaDestino(bot, 'recepcao_balcao_esq');
              bot.falaCurta = 'Check-in';
              bot.acaoTexto = 'Cadastrando Check-in na Prancheta';
              bot.iconeCabeca = '📋';
              bot.timerEsperaFrames = 180;
            } else if (bot.etapaRotina === 1) {
              this.enviarParaDestino(bot, 'recepcao_balcao_centro');
              bot.falaCurta = 'Caixa PIX';
              bot.acaoTexto = 'Confirmando Pagamento PIX (RF08)';
              bot.iconeCabeca = '💸';
              bot.timerEsperaFrames = 210;
            } else {
              this.enviarParaDestino(bot, 'recepcao_balcao_dir');
              bot.falaCurta = 'Liberando PC';
              bot.acaoTexto = 'Liberando Sessão no Terminal';
              bot.iconeCabeca = '🖥️';
              bot.timerEsperaFrames = 170;
            }
          }
        } else {
          bot.ferramenta = 'PRANCHETA';
        }
      } else if (slotRecep === 1) {
        // Logística & Estoque (Ex: Fernanda Oliveira)
        const botEstoque = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          'Estoque',
          false,
          'estoque_prateleira_1',
          '#d97706',
          '#3f3f46',
          false
        );
        botEstoque.uniforme = 'ESTOQUE';
        const chegou = this.avancarMovimentoFisico(botEstoque, 1.45);
        botEstoque.mostrarBalao = botEstoque.pose === 'CARRYING_BOX' || chegou;
        if (chegou && botEstoque.timerConversaFrames === 0) {
          if (botEstoque.timerEsperaFrames > 0) {
            botEstoque.timerEsperaFrames--;
            if (
              botEstoque.nodoAtualId === 'estoque_caixas' ||
              botEstoque.nodoAtualId === 'cozinha_geladeira' ||
              botEstoque.nodoAtualId === 'recepcao_geladeira'
            ) {
              botEstoque.pose = 'CARRYING_BOX';
              botEstoque.ferramenta = 'CAIXA';
            } else {
              botEstoque.pose = 'WORKING_TOOL';
              botEstoque.ferramenta = 'PRANCHETA';
            }
          } else {
            botEstoque.etapaRotina = (botEstoque.etapaRotina + 1) % 4;
            if (botEstoque.etapaRotina === 0) {
              botEstoque.pose = 'WALK';
              botEstoque.ferramenta = 'PRANCHETA';
              this.enviarParaDestino(botEstoque, 'estoque_caixas');
              botEstoque.falaCurta = 'Separando';
              botEstoque.acaoTexto = 'Separando Caixas no Almoxarifado';
              botEstoque.iconeCabeca = '📋';
              botEstoque.timerEsperaFrames = 140;
            } else if (botEstoque.etapaRotina === 1) {
              botEstoque.pose = 'CARRYING_BOX';
              botEstoque.ferramenta = 'CAIXA';
              this.enviarParaDestino(botEstoque, 'cozinha_geladeira');
              botEstoque.falaCurta = 'Repondo Café';
              botEstoque.acaoTexto = 'Carregando Fardos para a Lanchonete';
              botEstoque.iconeCabeca = '📦';
              botEstoque.timerEsperaFrames = 160;
            } else if (botEstoque.etapaRotina === 2) {
              botEstoque.pose = 'CARRYING_BOX';
              botEstoque.ferramenta = 'CAIXA';
              this.enviarParaDestino(botEstoque, 'recepcao_geladeira');
              botEstoque.falaCurta = 'Repondo Refri';
              botEstoque.acaoTexto = 'Abastecendo Geladeiras da Recepção';
              botEstoque.iconeCabeca = '🧃';
              botEstoque.timerEsperaFrames = 150;
            } else {
              botEstoque.pose = 'WORKING_TOOL';
              botEstoque.ferramenta = 'PRANCHETA';
              this.enviarParaDestino(botEstoque, 'estoque_prateleira_2');
              botEstoque.falaCurta = 'Inventário';
              botEstoque.acaoTexto = 'Bipando Estoque de Hardware na Prancheta';
              botEstoque.iconeCabeca = '📦';
              botEstoque.timerEsperaFrames = 170;
            }
          }
        }
      } else {
        // Barista & Lanchonete (Ex: Mariana Lima ou novos contratados)
        const botCozinha = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          'Lanchonete',
          false,
          'cozinha_balcao',
          '#e11d48',
          '#7c2d12',
          false
        );
        botCozinha.uniforme = 'LANCHONETE';
        const chegou = this.avancarMovimentoFisico(botCozinha, 1.3);
        if (chegou && botCozinha.timerConversaFrames === 0) {
          botCozinha.pose = 'WORKING_TOOL';
          botCozinha.ferramenta = 'BANDEJA_LANCHE';
          botCozinha.direcao = 'DOWN';
          botCozinha.mostrarBalao = true;
          if (botCozinha.timerEsperaFrames > 0) {
            botCozinha.timerEsperaFrames--;
          } else {
            botCozinha.etapaRotina = (botCozinha.etapaRotina + 1) % 4;
            if (botCozinha.etapaRotina === 0) {
              this.enviarParaDestino(botCozinha, 'cozinha_balcao');
              botCozinha.falaCurta = 'Assando Pizza';
              botCozinha.acaoTexto = 'Preparando Pizza & Café Expresso na Bandeja';
              botCozinha.iconeCabeca = '🍕';
              botCozinha.timerEsperaFrames = 190;
            } else if (botCozinha.etapaRotina === 1) {
              this.enviarParaDestino(botCozinha, 'cozinha_geladeira');
              botCozinha.falaCurta = 'Cup Noodles';
              botCozinha.acaoTexto = 'Preparando Ramen Quente & Energéticos';
              botCozinha.iconeCabeca = '🍜';
              botCozinha.timerEsperaFrames = 150;
            } else if (botCozinha.etapaRotina === 2) {
              this.enviarParaDestino(botCozinha, 'cozinha_mesa_3');
              botCozinha.falaCurta = 'Servindo Mesa';
              botCozinha.acaoTexto = 'Servindo Bandeja com Lanche na Mesa';
              botCozinha.iconeCabeca = '☕';
              botCozinha.timerEsperaFrames = 145;
            } else {
              this.enviarParaDestino(botCozinha, 'ala_oeste_lounge');
              botCozinha.falaCurta = 'Entrega Deck';
              botCozinha.acaoTexto = 'Levando Bandeja de Café ao Cyber Deck';
              botCozinha.iconeCabeca = '🥤';
              botCozinha.timerEsperaFrames = 155;
            }
          }
        } else {
          botCozinha.ferramenta = 'BANDEJA_LANCHE';
          botCozinha.mostrarBalao = false;
        }
      }
    });

    // =========================================================================
    // 2. CLIENTES COM SESSÃO ATIVA NOS 18 PCS (RF05 / RF06)
    // =========================================================================
    const jogosCurto = ['CS2', 'Valorant', 'LoL', 'GTA RP', 'EA FC', 'Dota 2', 'Fortnite', 'Warzone', 'Apex'];
    const sessoesEmAndamento = sessoesAtivas.filter((s) => s.status === 'ATIVA');

    sessoesEmAndamento.forEach((sessao, idx) => {
      const id = `cliente_sessao_${sessao.clienteId}`;
      idsAtivosNesteFrame.add(id);
      const nodoAssento = nodoAssentoDoPc(sessao.computadorNumero);
      const primeiroNome = sessao.clienteNome.split(' ')[0];

      const bot = this.criarOuAtualizarBot(
        id,
        primeiroNome,
        'Cliente PC',
        true,
        'recepcao_fila_1',
        CORES_ROUPA_BOT[sessao.clienteId % CORES_ROUPA_BOT.length],
        CORES_CABELO_BOT[idx % CORES_CABELO_BOT.length],
        true
      );

      if (bot.nodoAtualId !== nodoAssento && bot.filaRota.length === 0) {
        this.enviarParaDestino(bot, nodoAssento);
        bot.falaCurta = `Indo PC-${String(sessao.computadorNumero).padStart(2, '0')}`;
        bot.acaoTexto = `Caminhando até o PC-${String(sessao.computadorNumero).padStart(2, '0')}`;
        bot.iconeCabeca = '🎮';
        bot.mostrarBalao = true;
      }

      const chegou = this.avancarMovimentoFisico(bot, 1.7);
      if (chegou && bot.nodoAtualId === nodoAssento) {
        bot.pose = 'SITTING_PC';
        bot.direcao = 'UP';
        const jogo = jogosCurto[sessao.computadorNumero % jogosCurto.length];
        bot.falaCurta = jogo;
        bot.acaoTexto = `Jogando ${jogo} no PC-${String(sessao.computadorNumero).padStart(2, '0')}`;
        bot.iconeCabeca = '🎧';
        // Alterna suavemente quais jogadores sentados mostram a tag acima da cabeça
        // para não poluir a tela com 10 balões colados!
        bot.mostrarBalao = (( Math.floor(this.globalTick / 120) + idx ) % 2) === 0;
      }
    });

    // =========================================================================
    // 3. PEDESTRES NA CALÇADA E VISITANTES INTERNOS (Com Rotinas + Conversas!)
    // =========================================================================
    const botsCirculantes = [
      {
        id: 'visitante_1',
        nome: 'Pedro',
        corRoupa: '#7c3aed',
        corCabelo: '#1e293b',
        roteiro: [
          { nodo: 'calcada_banco_esq', curto: 'Olhando Rua', acao: 'Descansando no banco da calçada', icone: '☀️', pose: 'IDLE' as PoseBot, dir: 'DOWN' as DirecaoSprite, tempo: 110 },
          { nodo: 'recepcao_fila_1', curto: 'Check-in', acao: 'Pedindo ficha na Recepção', icone: '💬', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 150 },
          { nodo: 'ala_oeste_lounge', curto: 'Cyber Deck', acao: 'Relaxando no Deck Cyber Lounge 32x32', icone: '🥤', pose: 'EATING' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 180 },
          { nodo: 'cozinha_mesa_1', curto: 'Cup Noodles', acao: 'Comendo Ramen & Pizza na Lanchonete', icone: '🍜', pose: 'EATING' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 220 },
          { nodo: 'sala_vip_sofa', curto: 'Jogando PS5', acao: 'Jogando FIFA no Lounge VIP', icone: '🎮', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 240 },
          { nodo: 'recepcao_fila_2', curto: 'Totem PIX', acao: 'Pagando no Totem Auto-Atendimento PIX', icone: '💸', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 140 },
          { nodo: 'calcada_foodtruck', curto: 'Byte Burger', acao: 'Comprando lanche no Food Truck', icone: '🍔', pose: 'EATING' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 160 },
        ],
      },
      {
        id: 'visitante_2',
        nome: 'Thiago',
        corRoupa: '#0d9488',
        corCabelo: '#7c2d12',
        roteiro: [
          { nodo: 'calcada_extremo_dir', curto: 'Passeando', acao: 'Caminhando pela calçada leste', icone: '🚶', pose: 'IDLE' as PoseBot, dir: 'LEFT' as DirecaoSprite, tempo: 60 },
          { nodo: 'calcada_vitrine_dir', curto: 'Vendo Vitrine', acao: 'Olhando os PCs VIP pela vitrine', icone: '👀', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 140 },
          { nodo: 'estudio_streamer', curto: 'Live Podcast', acao: 'Gravando participação no Estúdio GAME ON', icone: '🎙️', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 210 },
          { nodo: 'arena_esports_palco', curto: 'Final Torneio', acao: 'Assistindo Final no Palco E-Sports', icone: '🏆', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 210 },
          { nodo: 'sala_vip_arcade', curto: 'Street Fighter', acao: 'Jogando Fliperama Arcade', icone: '🕹️', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 220 },
          { nodo: 'cozinha_mesa_3', curto: 'Café Gamer', acao: 'Tomando Expresso na Lanchonete', icone: '☕', pose: 'EATING' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 180 },
          { nodo: 'calcada_extremo_esq', curto: 'Indo embora', acao: 'Indo pela calçada oeste', icone: '⭐', pose: 'IDLE' as PoseBot, dir: 'LEFT' as DirecaoSprite, tempo: 70 },
        ],
      },
      {
        id: 'pedestre_calcada_1',
        nome: 'Lucas',
        corRoupa: '#ea580c',
        corCabelo: '#1e293b',
        roteiro: [
          { nodo: 'calcada_extremo_esq', curto: 'Caminhando', acao: 'Andando pela calçada', icone: '🎧', pose: 'IDLE' as PoseBot, dir: 'RIGHT' as DirecaoSprite, tempo: 50 },
          { nodo: 'calcada_vitrine_esq', curto: '"Que Lan Top!"', acao: 'Admirando a fachada neon da Lan House', icone: '🤩', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 150 },
          { nodo: 'calcada_foodtruck', curto: 'Pedindo Burger', acao: 'Pedindo Smash Burger no Food Truck', icone: '🍔', pose: 'EATING' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 190 },
          { nodo: 'calcada_banco_dir', curto: 'Comendo', acao: 'Lanchando na praça leste', icone: '🍟', pose: 'EATING' as PoseBot, dir: 'DOWN' as DirecaoSprite, tempo: 160 },
          { nodo: 'calcada_extremo_dir', curto: 'Passeando', acao: 'Seguindo pela rua', icone: '🚶', pose: 'IDLE' as PoseBot, dir: 'LEFT' as DirecaoSprite, tempo: 60 },
        ],
      },
      {
        id: 'pedestre_calcada_2',
        nome: 'Bianca',
        corRoupa: '#db2777',
        corCabelo: '#3b0764',
        roteiro: [
          { nodo: 'calcada_extremo_dir', curto: 'Na Calçada', acao: 'Passeando à noite', icone: '✨', pose: 'IDLE' as PoseBot, dir: 'LEFT' as DirecaoSprite, tempo: 55 },
          { nodo: 'calcada_banco_dir', curto: 'Vendo Celular', acao: 'Mandando mensagem para o squad', icone: '📱', pose: 'IDLE' as PoseBot, dir: 'DOWN' as DirecaoSprite, tempo: 145 },
          { nodo: 'porta_principal_fora', curto: 'Entrando!', acao: 'Decidindo entrar na Lan House', icone: '🎮', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 100 },
          { nodo: 'recepcao_geladeira', curto: 'Monster Gelado', acao: 'Pegando Energético na Recepção', icone: '🥤', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 160 },
          { nodo: 'calcada_banco_esq', curto: 'Esperando Uber', acao: 'Aguardando na calçada oeste', icone: '🚗', pose: 'IDLE' as PoseBot, dir: 'DOWN' as DirecaoSprite, tempo: 140 },
        ],
      },
      {
        id: 'pedestre_calcada_3',
        nome: 'Rodrigo',
        corRoupa: '#4f46e5',
        corCabelo: '#92400e',
        roteiro: [
          { nodo: 'calcada_banco_esq', curto: 'No Banco', acao: 'Conversando na calçada', icone: '💬', pose: 'IDLE' as PoseBot, dir: 'RIGHT' as DirecaoSprite, tempo: 120 },
          { nodo: 'calcada_foodtruck', curto: 'Fila do Truck', acao: 'Comprando refrigerante no Truck', icone: '🥤', pose: 'EATING' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 170 },
          { nodo: 'calcada_vitrine_esq', curto: 'Vendo Jogos', acao: 'Olhando pôsteres de campeonato', icone: '🏆', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 130 },
          { nodo: 'calcada_extremo_dir', curto: 'Caminhando', acao: 'Andando pela calçada', icone: '🚶', pose: 'IDLE' as PoseBot, dir: 'LEFT' as DirecaoSprite, tempo: 60 },
        ],
      },
    ];

    botsCirculantes.forEach((v) => {
      idsAtivosNesteFrame.add(v.id);
      const bot = this.criarOuAtualizarBot(
        v.id,
        v.nome,
        'Visitante',
        true,
        v.roteiro[0].nodo,
        v.corRoupa,
        v.corCabelo,
        false
      );

      const chegou = this.avancarMovimentoFisico(bot, 1.38);
      const passoAtual = v.roteiro[bot.etapaRotina % v.roteiro.length];

      if (bot.timerConversaFrames > 0) {
        // Já está exibindo a fala curta da conversa!
        bot.mostrarBalao = true;
      } else if (chegou) {
        bot.pose = passoAtual.pose;
        bot.direcao = passoAtual.dir;
        bot.falaCurta = passoAtual.curto;
        bot.acaoTexto = passoAtual.acao;
        bot.iconeCabeca = passoAtual.icone;
        bot.mostrarBalao = true;

        if (bot.timerEsperaFrames > 0) {
          bot.timerEsperaFrames--;
        } else {
          // Escolhe o próximo ponto do roteiro (com pitada de aleatoriedade!)
          const pulo = (this.globalTick + v.id.length) % 3 === 0 ? 2 : 1;
          bot.etapaRotina = (bot.etapaRotina + pulo) % v.roteiro.length;
          const proxPasso = v.roteiro[bot.etapaRotina];
          this.enviarParaDestino(bot, proxPasso.nodo);
          bot.falaCurta = proxPasso.curto;
          bot.acaoTexto = proxPasso.acao;
          bot.iconeCabeca = proxPasso.icone;
          bot.timerEsperaFrames = proxPasso.tempo;
        }
      } else {
        // Enquanto está apenas caminhando entre dois pontos, oculta o balão para não poluir a tela!
        bot.mostrarBalao = false;
      }
    });

    // Remove bots antigos
    for (const key of Array.from(this.bots.keys())) {
      if (!idsAtivosNesteFrame.has(key)) {
        this.bots.delete(key);
      }
    }

    const todos = Array.from(this.bots.values());
    // Verifica encontros na calçada e nos corredores para pararem e conversar!
    this.processarEncontrosSociais(todos);

    return todos.sort((a, b) => a.y - b.y);
  }
}

export const simuladorBotsMapa = new SimuladorBotsMapa();
