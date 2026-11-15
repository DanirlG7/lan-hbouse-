import { ANCORAS_LOJAS, SOLIDOS_DECOR } from './decor';
import { SOLIDOS_MOBILIARIO } from './mobiliario';

/**
 * LAYOUT DO MAPA EM DADOS (unidades em TILES de 32px; aceita metades, ex. 21.5)
 *
 *  y= 0  quintal / árvores
 *  y= 4  ┌ Estúdio │ ADM │ NOC │ Estoque │ WC cli │ WC func ┐   (fundos, 8 tiles)
 *  y=12  ├────────── corredor de serviço (3 tiles) ──────────┤
 *  y=15  │ Bomboniere │   SALÃO GAMER (12 + 6 PCs)  │ corr. │  VIP (6 PCs)  │ Zona de
 *  y=31  │ Lounge     │                              │ 3 til │ Arena/Console │ expansão
 *  y=45  │            │ Recepção / Caixa PIX / fila  │       │               │ (bloq.)
 *  y=52  └──────────── porta de entrada (2 tiles) ───────────┘
 *  y=52  calçada (4 tiles) · y=56 rua
 */

export type TipoSala =
  | 'ESTUDIO'
  | 'ADM'
  | 'NOC'
  | 'ESTOQUE'
  | 'BANHEIRO_CLIENTE'
  | 'BANHEIRO_FUNC'
  | 'SERVICO'
  | 'BOMBONIERE'
  | 'LOUNGE'
  | 'SALAO'
  | 'CORREDOR'
  | 'VIP'
  | 'ARENA'
  | 'RECEPCAO'
  | 'EXPANSAO';

export type TipoPiso = 'MADEIRA' | 'AZULEJO' | 'CARPETE' | 'CONCRETO';

export interface Sala {
  id: string;
  tipo: TipoSala;
  nome: string;
  x: number;
  y: number;
  w: number;
  h: number;
  piso: TipoPiso;
  /** cor do letreiro / neon da sala */
  cor: string;
  /** sala bloqueada para circulação (zona de expansão) */
  bloqueada?: boolean;
}

export interface Porta {
  id: string;
  orientacao: 'H' | 'V';
  /** posição do centro da porta (tiles) sobre a linha da parede */
  x: number;
  y: number;
  /** largura do vão em tiles */
  largura: number;
  etiqueta?: string;
}

export const SALAS: Sala[] = [
  { id: 'estudio', tipo: 'ESTUDIO', nome: 'ESTÚDIO LIVE', x: 4, y: 4, w: 16, h: 8, piso: 'AZULEJO', cor: '#f472b6' },
  { id: 'adm', tipo: 'ADM', nome: 'ADMINISTRAÇÃO', x: 20, y: 4, w: 16, h: 8, piso: 'CARPETE', cor: '#38bdf8' },
  { id: 'noc', tipo: 'NOC', nome: 'NOC SERVIDORES', x: 36, y: 4, w: 16, h: 8, piso: 'AZULEJO', cor: '#4ade80' },
  { id: 'estoque', tipo: 'ESTOQUE', nome: 'ESTOQUE', x: 52, y: 4, w: 16, h: 8, piso: 'CONCRETO', cor: '#fb923c' },
  { id: 'wc_cliente', tipo: 'BANHEIRO_CLIENTE', nome: 'WC CLIENTES', x: 68, y: 4, w: 8, h: 8, piso: 'AZULEJO', cor: '#67e8f9' },
  { id: 'wc_func', tipo: 'BANHEIRO_FUNC', nome: 'WC EQUIPE', x: 76, y: 4, w: 8, h: 8, piso: 'AZULEJO', cor: '#a5b4fc' },
  { id: 'servico', tipo: 'SERVICO', nome: 'CORREDOR DE SERVIÇO', x: 4, y: 12, w: 80, h: 3, piso: 'CONCRETO', cor: '#94a3b8' },
  { id: 'bomboniere', tipo: 'BOMBONIERE', nome: 'BOMBONIERE', x: 4, y: 15, w: 16, h: 16, piso: 'AZULEJO', cor: '#f472b6' },
  { id: 'lounge', tipo: 'LOUNGE', nome: 'GALERIA GAMER', x: 4, y: 31, w: 16, h: 21, piso: 'MADEIRA', cor: '#2dd4bf' },
  { id: 'salao', tipo: 'SALAO', nome: 'SALÃO GAMER', x: 20, y: 15, w: 40, h: 30, piso: 'CARPETE', cor: '#22d3ee' },
  { id: 'corredor', tipo: 'CORREDOR', nome: 'CORREDOR LESTE', x: 60, y: 15, w: 3, h: 37, piso: 'CONCRETO', cor: '#94a3b8' },
  { id: 'vip', tipo: 'VIP', nome: 'GAME ON VIP', x: 63, y: 15, w: 21, h: 18, piso: 'CARPETE', cor: '#c084fc' },
  { id: 'arena', tipo: 'ARENA', nome: 'CONSOLES & E-SPORTS', x: 63, y: 33, w: 21, h: 19, piso: 'AZULEJO', cor: '#facc15' },
  { id: 'recepcao', tipo: 'RECEPCAO', nome: 'RECEPÇÃO PIX', x: 20, y: 45, w: 40, h: 7, piso: 'MADEIRA', cor: '#38bdf8' },
  { id: 'expansao', tipo: 'EXPANSAO', nome: 'EXPANSÃO', x: 84, y: 4, w: 10, h: 48, piso: 'CONCRETO', cor: '#fbbf24', bloqueada: true },
];

/** Vãos de porta sobre as paredes entre salas (a parede é removida no vão) */
export const PORTAS: Porta[] = [
  { id: 'porta_principal', orientacao: 'H', x: 40, y: 52, largura: 2, etiqueta: 'ENTRADA' },
  { id: 'porta_recepcao', orientacao: 'H', x: 40, y: 45, largura: 2, etiqueta: 'SALÃO' },
  { id: 'porta_recepcao_leste', orientacao: 'V', x: 60, y: 47, largura: 2 },
  { id: 'porta_servico_salao', orientacao: 'H', x: 40, y: 15, largura: 2 },
  { id: 'porta_salao_leste', orientacao: 'V', x: 60, y: 28, largura: 2 },
  { id: 'porta_bomboniere', orientacao: 'V', x: 20, y: 21, largura: 2 },
  { id: 'porta_ala_oeste', orientacao: 'V', x: 20, y: 35, largura: 2, etiqueta: 'LOUNGE' },
  { id: 'porta_cozinha', orientacao: 'H', x: 12, y: 15, largura: 2, etiqueta: 'BOMBONIERE' },
  { id: 'porta_bomb_lounge', orientacao: 'H', x: 12, y: 31, largura: 2 },
  { id: 'porta_estudio', orientacao: 'H', x: 12, y: 12, largura: 2, etiqueta: 'ESTÚDIO' },
  { id: 'porta_escritorio', orientacao: 'H', x: 28, y: 12, largura: 2, etiqueta: 'ADM' },
  { id: 'porta_sala_tecnica', orientacao: 'H', x: 44.5, y: 12, largura: 2, etiqueta: 'NOC' },
  { id: 'porta_estoque', orientacao: 'H', x: 60, y: 12, largura: 2, etiqueta: 'ESTOQUE' },
  { id: 'porta_wc_cliente', orientacao: 'H', x: 72, y: 12, largura: 2 },
  { id: 'porta_wc_func', orientacao: 'H', x: 80, y: 12, largura: 2 },
  { id: 'porta_corredor_servico', orientacao: 'H', x: 61.5, y: 15, largura: 3 },
  { id: 'porta_vip', orientacao: 'V', x: 63, y: 21, largura: 2, etiqueta: 'VIP' },
  { id: 'porta_sala_vip', orientacao: 'H', x: 73.5, y: 33, largura: 2 },
  { id: 'porta_arena_esports', orientacao: 'V', x: 63, y: 41, largura: 2, etiqueta: 'ARENA' },
  { id: 'porta_estacionamento', orientacao: 'H', x: 91.0, y: 52, largura: 5.5, etiqueta: 'ESTACIONAMENTO' },
];

/** Trechos de parede em vidro acústico (slim) — x1,y1 → x2,y2 em tiles */
export const PAREDES_VIDRO: Array<{ x1: number; y1: number; x2: number; y2: number }> = [
  { x1: 60, y1: 15, x2: 60, y2: 52 },
  { x1: 63, y1: 15, x2: 63, y2: 33 },
  { x1: 63, y1: 33, x2: 63, y2: 52 },
  { x1: 20, y1: 45, x2: 60, y2: 45 },
  { x1: 20, y1: 15, x2: 20, y2: 31 },
  { x1: 4, y1: 12, x2: 84, y2: 12 },
];

/** Estações de PC: número, tile do assento (centro) e nó de corredor de acesso. */
export interface SlotPc {
  numero: number;
  /** id do nó-assento no grafo */
  nodoAssento: string;
  x: number;
  y: number;
  corredor: string;
}

const linha = (
  numeros: number[],
  prefixoAssento: string,
  xs: number[],
  y: number,
  corredores: string[]
): SlotPc[] =>
  numeros.map((n, i) => ({
    numero: n,
    nodoAssento: `${prefixoAssento}_${String(n).padStart(2, '0')}_seat`,
    x: xs[i],
    y,
    corredor: corredores[i],
  }));

export const SLOTS_PC: SlotPc[] = [
  // Salão: 3 ilhas de 4 PCs (comuns)
  ...linha([1, 2, 3, 4], 'pc', [24.5, 27.5, 30.5, 33.5], 19.5, ['aisle_pc_01', 'aisle_pc_02', 'corredor_pcs_fila_1', 'aisle_pc_04']),
  ...linha([5, 6, 7, 8], 'pc', [24.5, 27.5, 30.5, 33.5], 26.5, ['aisle_pc_05', 'aisle_pc_06', 'corredor_pcs_fila_2', 'aisle_pc_08']),
  ...linha([9, 10, 11, 12], 'pc', [24.5, 27.5, 30.5, 33.5], 33.5, ['aisle_pc_09', 'aisle_pc_10', 'corredor_pcs_fila_3', 'aisle_pc_12']),
  // VIP: 2 fileiras de 3
  ...linha([13, 14, 15], 'vip', [69.5, 73.5, 77.5], 19.5, ['aisle_vip_13', 'corredor_vip_1', 'aisle_vip_15']),
  ...linha([16, 17, 18], 'vip', [69.5, 73.5, 77.5], 26.5, ['aisle_vip_16', 'corredor_vip_2', 'aisle_vip_18']),
  // Deck gamer (lado leste do salão): 2 fileiras de 3
  ...linha([19, 20, 21], 'deck', [45.5, 49.5, 53.5], 19.5, ['deck_aisle_19', 'deck_aisle_20', 'deck_aisle_21']),
  ...linha([22, 23, 24], 'deck', [45.5, 49.5, 53.5], 26.5, ['deck_aisle_22', 'deck_aisle_23', 'deck_aisle_24']),
];

/** Âncoras do grafo de rotas (não-assentos). Arestas são geradas automaticamente. */
export interface Ancora {
  id: string;
  x: number;
  y: number;
  etiqueta?: string;
}

const A = (id: string, x: number, y: number, etiqueta?: string): Ancora => ({ id, x, y, etiqueta });

export const ANCORAS: Ancora[] = [
  // --- calçada (trilho y = 54)
  A('calcada_extremo_esq', 8, 54, 'Esquina Oeste'),
  A('calcada_banco_esq', 22, 54, 'Banco da Calçada'),
  A('calcada_vitrine_esq', 34, 54, 'Vitrine Gamer'),
  A('porta_principal_fora', 40, 54),
  A('calcada_vitrine_dir', 46, 54),
  A('calcada_banco_dir', 56, 54),
  A('calcada_foodtruck', 70, 54, 'Food Truck'),
  A('calcada_extremo_dir', 82, 54),
  // --- recepção
  A('porta_principal', 40, 52),
  A('porta_principal_dentro', 40, 51),
  A('recepcao_hall_interno', 40, 49.5),
  A('recepcao_fila_1', 29, 49.5),
  A('recepcao_fila_2', 33, 49.5),
  A('recepcao_geladeira_sul', 57, 49.5),
  A('recepcao_geladeira', 57, 47),
  A('porta_recepcao_leste', 60, 47),
  A('porta_recepcao', 40, 45),
  A('recepcao_porta_interna', 40, 46),
  A('recepcao_acesso_balcao', 36, 46),
  A('recepcao_balcao_dir', 32, 46),
  A('recepcao_balcao_centro', 28, 46),
  A('recepcao_balcao_esq', 24, 46),
  // --- salão: espinha central (x = 40) e trilhos de ilha
  A('corredor_central_norte', 40, 17),
  A('porta_servico_salao', 40, 15),
  A('corredor_central_1', 40, 21),
  A('corredor_central_2', 40, 28),
  A('corredor_central_3', 40, 35),
  A('corredor_central_sul', 40, 43.5),
  A('corredor_oeste_1', 22, 21),
  A('corredor_oeste_2', 22, 28),
  A('corredor_oeste_3', 22, 35),
  A('aisle_pc_01', 24.5, 21),
  A('aisle_pc_02', 27.5, 21),
  A('corredor_pcs_fila_1', 30.5, 21),
  A('aisle_pc_04', 33.5, 21),
  A('aisle_pc_05', 24.5, 28),
  A('aisle_pc_06', 27.5, 28),
  A('corredor_pcs_fila_2', 30.5, 28),
  A('aisle_pc_08', 33.5, 28),
  A('aisle_pc_09', 24.5, 35),
  A('aisle_pc_10', 27.5, 35),
  A('corredor_pcs_fila_3', 30.5, 35),
  A('aisle_pc_12', 33.5, 35),
  A('deck_aisle_19', 45.5, 21),
  A('deck_aisle_20', 49.5, 21),
  A('deck_aisle_21', 53.5, 21),
  A('deck_aisle_22', 45.5, 28),
  A('deck_aisle_23', 49.5, 28),
  A('deck_aisle_24', 53.5, 28),
  A('salao_leste_1', 57.5, 21),
  A('salao_leste_2', 57.5, 28),
  A('salao_leste_3', 57.5, 35),
  A('espera_salao_oeste', 45.5, 34.4, 'Sala de Espera PCs'),
  A('espera_salao_meio', 49.5, 31.5),
  A('espera_salao_leste', 53.5, 34.4, 'Área de Descanso'),
  A('deck_aisle_35a', 45.5, 35),
  A('deck_aisle_35b', 49.5, 35),
  A('porta_salao_leste', 60, 28),
  // --- corredor leste (x = 61.5)
  A('corredor_leste_quina', 61.5, 13.5),
  A('porta_corredor_servico', 61.5, 15),
  A('corredor_leste_norte', 61.5, 17),
  A('corredor_leste_vip', 61.5, 21),
  A('corredor_leste_meio', 61.5, 28),
  A('corredor_leste_sul_meio', 61.5, 35),
  A('corredor_leste_sul', 61.5, 41),
  A('corredor_leste_base', 61.5, 47),
  // --- VIP
  A('porta_vip', 63, 21),
  A('vip_hall_1', 66, 21),
  A('vip_hall_2', 66, 28),
  A('aisle_vip_13', 69.5, 21),
  A('corredor_vip_1', 73.5, 21),
  A('aisle_vip_15', 77.5, 21),
  A('aisle_vip_16', 69.5, 28),
  A('corredor_vip_2', 73.5, 28),
  A('aisle_vip_18', 77.5, 28),
  A('vip_leste', 81, 21),
  A('vip_leste_2', 81, 28),
  A('porta_sala_vip', 73.5, 33),
  // --- arena / consoles
  A('sala_vip_arcade', 73.5, 36),
  A('sala_vip_tv', 73.5, 41),
  A('porta_arena_esports', 63, 41),
  A('arena_hall', 66, 41),
  A('sala_vip_sofa', 66, 46),
  A('arena_sofa_leste', 73.5, 46),
  A('arena_ringside_sul', 79.2, 46),
  A('arena_esports_palco', 74.4, 41, 'Arena de Lutas'),
  // --- serviço
  A('servico_estudio', 12, 13.5),
  A('servico_adm', 28, 13.5),
  A('servico_salao', 40, 13.5),
  A('servico_noc', 44.5, 13.5),
  A('servico_estoque', 60, 13.5),
  A('servico_wc_cliente', 72, 13.5),
  A('servico_wc_func', 80, 13.5),
  // --- estúdio
  A('porta_estudio', 12, 12),
  A('estudio_corredor', 12, 10.5),
  A('lounge_gameon', 8, 10.5),
  A('estudio_streamer', 12, 7.8),
  // --- adm
  A('porta_escritorio', 28, 12),
  A('escritorio_corredor', 28, 10.5),
  A('escritorio_mesa', 28, 8),
  // --- noc
  A('porta_sala_tecnica', 44.5, 12),
  A('tecnica_hall_esq', 40, 10),
  A('tecnica_hall', 44.5, 10),
  A('tecnica_hall_dir', 49, 10),
  A('tecnica_rack_1', 40, 8.2),
  A('tecnica_rack_2', 44.5, 8.2),
  A('tecnica_bancada', 49, 8.2),
  // --- estoque
  A('porta_estoque', 60, 12),
  A('estoque_caixas', 55, 10),
  A('estoque_prateleira_1', 60, 10),
  A('estoque_prateleira_2', 65, 10),
  // --- banheiros
  A('porta_wc_cliente', 72, 12),
  A('banheiro_cliente', 72, 9.5),
  A('porta_wc_func', 80, 12),
  A('banheiro_func', 80, 9.5),
  // --- bomboniere
  A('porta_cozinha', 12, 15),
  A('cozinha_hall', 12, 18),
  A('cozinha_geladeira', 8.2, 18),
  A('cozinha_balcao', 14.8, 18),
  A('cozinha_mesa_1', 8.2, 21),
  A('cozinha_corredor', 12, 21),
  A('cozinha_mesa_2', 15.8, 21),
  A('porta_bomboniere', 20, 21),
  A('cozinha_entre_esq', 8.2, 25.3),
  A('cozinha_mesa_3', 12, 25.3),
  A('cozinha_entre_dir', 15.8, 25.3),
  A('cozinha_sul_esq', 8.2, 29.4),
  A('cozinha_sul_centro', 12, 29.4),
  A('cozinha_sul_dir', 15.8, 29.4),
  A('porta_bomb_lounge', 12, 31),
  // --- lounge
  A('lounge_hall', 12, 33),
  A('ala_oeste_lounge', 12, 35),
  A('porta_ala_oeste', 20, 35),
  A('lounge_leste', 17, 35),
  A('lounge_sofa', 12, 40),
  A('lounge_arcade', 12, 45),
];

/** Retângulos sólidos (tiles) além das mesas de PC: balcões, mesas executivas etc. */
export const SOLIDOS_FIXOS: Array<{ x: number; y: number; w: number; h: number }> = [
  { x: 22, y: 47, w: 15, h: 1.4 }, // balcão da recepção
  { x: 9.5, y: 5.6, w: 5, h: 1.1 }, // mesa do streamer
  { x: 26, y: 5.2, w: 5, h: 1.5 }, // mesa executiva ADM
  { x: 13.8, y: 16.3, w: 5.0, h: 0.9 }, // balcão da lanchonete (bomboniere)
  { x: 75.2, y: 36.6, w: 8.0, h: 8.8 }, // ringue de lutas (arena)
  { x: 67.6, y: 42.2, w: 5.0, h: 2.8 }, // tatame de treino e sacos de pancada (arena)
  { x: 84, y: 4, w: 10, h: 12 }, // cantinho VIP
  { x: 84.3, y: 46.6, w: 3.9, h: 4.1 }, // guarita do estacionamento
];

// Lojas do mini centro comercial: nós de grafo na frente de cada balcão e colisão dos blocos
ANCORAS.push(...ANCORAS_LOJAS);
SOLIDOS_FIXOS.push(...SOLIDOS_DECOR);
SOLIDOS_FIXOS.push(...SOLIDOS_MOBILIARIO);
