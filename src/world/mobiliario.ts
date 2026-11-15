/**
 * MOBILIÁRIO (ETAPA 2): sofás, mesas de refeição, arquibancada, bar, sala de reunião etc.
 * Dados puros (unidades em TILES de 32px). Não importa o layout (o layout é que importa este arquivo).
 *
 * `x, y, w, h` descrevem o retângulo VISUAL completo do item (incluindo cadeiras). Esse mesmo
 * retângulo vira colisão (quando `solido`), e é usado pelos testes que garantem que nenhum móvel
 * cai em cima de outro, de uma parede ou de uma rota de bot.
 */

export type TipoMovel =
  | 'MESA_REFEICAO'
  | 'SOFA_H'
  | 'SOFA_V'
  | 'ARQUIBANCADA'
  | 'MESA_REUNIAO'
  | 'MESA_SOM'
  | 'PALETE'
  | 'EMPILHADEIRA'
  | 'CANTEIRO'
  | 'BAR_VIP'
  | 'REVISTEIRO'
  | 'BANCO_ESPERA'
  | 'LIXEIRA_REC'
  | 'TOTEM_SENHA'
  | 'PLANTA_GRANDE'
  | 'BANCADA_NARRADORES'
  | 'BANNER'
  | 'LOCKERS'
  | 'MESA_TECNICA'
  | 'CAIXAS'
  | 'MESA_ALTA'
  | 'PUFE'
  | 'MESA_CENTRO';

/** Lado do encosto do sofá */
export type Encosto = 'N' | 'S' | 'E' | 'W';

export interface Movel {
  tipo: TipoMovel;
  sala: string;
  x: number;
  y: number;
  w: number;
  h: number;
  cor?: string;
  encosto?: Encosto;
  /** vira colisão? (padrão: sim) */
  solido: boolean;
}

/** Tamanho padrão (tiles) de cada tipo */
const TAM: Record<TipoMovel, [number, number]> = {
  MESA_REFEICAO: [3.2, 2.4],
  SOFA_H: [4.4, 1.3],
  SOFA_V: [1.4, 3.2],
  ARQUIBANCADA: [8, 3.4],
  MESA_REUNIAO: [4.8, 2.4],
  MESA_SOM: [3.6, 1.6],
  PALETE: [2, 1.6],
  EMPILHADEIRA: [2, 1.5],
  CANTEIRO: [3.2, 1],
  BAR_VIP: [3.4, 2.3],
  REVISTEIRO: [0.9, 1.4],
  BANCO_ESPERA: [3, 1],
  LIXEIRA_REC: [1.5, 1],
  TOTEM_SENHA: [0.9, 1.6],
  PLANTA_GRANDE: [1, 1.5],
  BANCADA_NARRADORES: [4.2, 1.8],
  BANNER: [0.9, 2.2],
  LOCKERS: [4, 1],
  MESA_TECNICA: [1.8, 2.6],
  CAIXAS: [1.6, 1.4],
  MESA_ALTA: [1.2, 1.4],
  PUFE: [1, 0.8],
  MESA_CENTRO: [3.2, 1.0],
};

interface Opcoes {
  w?: number;
  h?: number;
  cor?: string;
  encosto?: Encosto;
  solido?: boolean;
}

const mv = (tipo: TipoMovel, sala: string, x: number, y: number, op: Opcoes = {}): Movel => ({
  tipo,
  sala,
  x,
  y,
  w: op.w ?? TAM[tipo][0],
  h: op.h ?? TAM[tipo][1],
  cor: op.cor,
  encosto: op.encosto,
  solido: op.solido ?? true,
});

export const MOBILIARIO: Movel[] = [
  // ---------------- BOMBONIERE: praça de alimentação (grid alinhado 2×2) ----------------
  mv('SOFA_V', 'bomboniere', 4.4, 23.8, { cor: '#be185d', encosto: 'W' }),
  mv('MESA_REFEICAO', 'bomboniere', 6.6, 22.2),
  mv('MESA_REFEICAO', 'bomboniere', 14.2, 22.2),
  mv('MESA_REFEICAO', 'bomboniere', 6.6, 26.2),
  mv('MESA_REFEICAO', 'bomboniere', 14.2, 26.2),
  mv('LIXEIRA_REC', 'bomboniere', 4.4, 17.6),
  mv('PLANTA_GRANDE', 'bomboniere', 18.8, 15.5),

  // ---------------- GALERIA GAMER: cantinhos de descanso ----------------
  mv('SOFA_H', 'galeria', 4.6, 34.1, { w: 4.6, cor: '#0e7490', encosto: 'N' }),
  mv('SOFA_H', 'galeria', 14.8, 32.6, { w: 4.6, cor: '#be185d', encosto: 'N' }),

  // ---------------- RECEPÇÃO: sala de espera ----------------
  mv('SOFA_H', 'recepcao', 43.4, 47.6, { w: 4.6, cor: '#7e22ce', encosto: 'N' }),
  mv('REVISTEIRO', 'recepcao', 41.9, 47.0),
  mv('TOTEM_SENHA', 'recepcao', 38.0, 46.5),
  mv('BANCO_ESPERA', 'recepcao', 44.0, 50.8),
  mv('BANCO_ESPERA', 'recepcao', 50.6, 50.8),

  // ---------------- SALÃO: Área de Espera & Descanso PC (x=42..57, y=29.7..33.8) ----------------
  mv('PLANTA_GRANDE', 'salao', 36.4, 16.1),
  mv('PLANTA_GRANDE', 'salao', 42.6, 16.1),
  mv('REVISTEIRO', 'salao', 42.2, 29.8),
  mv('SOFA_H', 'salao', 43.4, 29.7, { w: 4.6, cor: '#0284c7', encosto: 'N' }),
  mv('MESA_CENTRO', 'salao', 44.1, 31.4, { w: 3.2, h: 1.0 }),
  mv('PUFE', 'salao', 44.0, 32.8, { cor: '#0e7490' }),
  mv('PUFE', 'salao', 46.4, 32.8, { cor: '#2563eb' }),
  mv('PLANTA_GRANDE', 'salao', 42.2, 32.1),
  mv('SOFA_H', 'salao', 51.4, 29.7, { w: 4.6, cor: '#7c3aed', encosto: 'N' }),
  mv('MESA_CENTRO', 'salao', 52.1, 31.4, { w: 3.2, h: 1.0 }),
  mv('PUFE', 'salao', 52.0, 32.8, { cor: '#9333ea' }),
  mv('PUFE', 'salao', 54.4, 32.8, { cor: '#ec4899' }),
  mv('TOTEM_SENHA', 'salao', 56.2, 29.8),
  mv('PLANTA_GRANDE', 'salao', 56.1, 32.1),

  // ---------------- VIP ----------------
  mv('BAR_VIP', 'vip', 80.2, 28.9),

  // ---------------- ARENA ----------------
  mv('ARQUIBANCADA', 'arena', 64.3, 36.5, { w: 8.2, h: 3.4 }),
  mv('BANCADA_NARRADORES', 'arena', 71.2, 47.2),
  mv('MESA_REFEICAO', 'arena', 76.2, 47.6),
  mv('MESA_REFEICAO', 'arena', 80.0, 47.6),
  mv('BANNER', 'arena', 74.0, 36.2),
  mv('BANNER', 'arena', 82.8, 34.2),
  mv('PUFE', 'arena', 64.1, 44.4, { cor: '#7e22ce' }),
  mv('PUFE', 'arena', 64.1, 45.5, { cor: '#0e7490' }),

  // ---------------- FUNDOS ----------------
  mv('MESA_SOM', 'estudio', 14.3, 8.6),
  mv('MESA_REUNIAO', 'adm', 29.8, 8.3),
  mv('SOFA_V', 'adm', 20.6, 7.4, { cor: '#0e7490', encosto: 'W' }),
  mv('MESA_TECNICA', 'noc', 36.7, 8.7),
  mv('CAIXAS', 'noc', 50.2, 9.4),
  mv('PALETE', 'estoque', 55.4, 6.9),
  // A empilhadeira é renderizada dinamicamente para operar no corredor [57.5..63.0]
  mv('EMPILHADEIRA', 'estoque', 58.6, 6.8, { solido: false }),

  // ---------------- CORREDOR DE SERVIÇO ----------------
  mv('LOCKERS', 'servico', 14.4, 12.25),
  mv('LOCKERS', 'servico', 48.0, 12.25),
  mv('BANCO_ESPERA', 'servico', 74.2, 12.35, { h: 0.9 }),

  // ---------------- CALÇADA ----------------
  mv('CANTEIRO', 'calcada', 8.4, 52.7),
  mv('CANTEIRO', 'calcada', 64.6, 52.7),
  mv('MESA_ALTA', 'calcada', 72.0, 52.4),
  mv('MESA_ALTA', 'calcada', 74.0, 52.4),

];

export interface AssentoRefeicao {
  id: string;
  sala: string;
  /** Coordenada (tiles) do assento da cadeira */
  x: number;
  y: number;
  /** Direção para olhar para a mesa */
  dir: 'DOWN' | 'UP';
  /** Nó de grafo mais próximo para se aproximar da cadeira sem atravessar o tampo */
  acesso: string;
}

const MESAS_BOMBONIERE_ACESSO: Array<{ norte: string; sul: string }> = [
  { norte: 'cozinha_mesa_1', sul: 'cozinha_entre_esq' },
  { norte: 'cozinha_mesa_2', sul: 'cozinha_entre_dir' },
  { norte: 'cozinha_entre_esq', sul: 'cozinha_sul_esq' },
  { norte: 'cozinha_entre_dir', sul: 'cozinha_sul_dir' },
];

export const ASSENTOS_REFEICAO: AssentoRefeicao[] = MOBILIARIO.filter(
  (m) => m.tipo === 'MESA_REFEICAO' && m.sala === 'bomboniere'
).flatMap((m, idx) => {
  const ac = MESAS_BOMBONIERE_ACESSO[idx] ?? { norte: 'cozinha_corredor', sul: 'cozinha_corredor' };
  const xEsq = Number((m.x + 17 / 32).toFixed(2));
  const xDir = Number((m.x + m.w - 17 / 32).toFixed(2));
  return [
    { id: `mesa_${idx}_n1`, sala: m.sala, x: xEsq, y: Number((m.y + 0.44).toFixed(2)), dir: 'DOWN' as const, acesso: ac.norte },
    { id: `mesa_${idx}_n2`, sala: m.sala, x: xDir, y: Number((m.y + 0.44).toFixed(2)), dir: 'DOWN' as const, acesso: ac.norte },
    { id: `mesa_${idx}_s1`, sala: m.sala, x: xEsq, y: Number((m.y + 2.22).toFixed(2)), dir: 'UP' as const, acesso: ac.sul },
    { id: `mesa_${idx}_s2`, sala: m.sala, x: xDir, y: Number((m.y + 2.22).toFixed(2)), dir: 'UP' as const, acesso: ac.sul },
  ];
});

/** Retângulos de colisão gerados pelo mobiliário (tiles) */
export const SOLIDOS_MOBILIARIO: Array<{ x: number; y: number; w: number; h: number }> = [
  ...MOBILIARIO.filter((m) => m.solido).map((m) =>
    // Nas mesas de refeição, apenas o tampo é sólido para permitir que os clientes sentem nas cadeiras
    m.tipo === 'MESA_REFEICAO'
      ? { x: m.x + 0.1, y: m.y + 0.5, w: m.w - 0.2, h: 1.45 }
      : { x: m.x, y: m.y, w: m.w, h: m.h }
  ),
  // Área de manobra segura da empilhadeira animada no Estoque
  { x: 57.5, y: 6.7, w: 5.5, h: 1.8 },
];

/** Tapetes (chão, nunca cobrem ninguém): x, y, w, h em tiles, cor de fundo e de borda */
export interface Tapete {
  x: number;
  y: number;
  w: number;
  h: number;
  fundo: string;
  borda: string;
}

export interface AssentoEspera {
  id: string;
  x: number;
  y: number;
  dir: 'DOWN' | 'UP';
  acesso: string;
}

export const ASSENTOS_ESPERA: AssentoEspera[] = [
  { id: 'espera_sofa1_esq', x: 44.7, y: 30.45, dir: 'DOWN', acesso: 'deck_aisle_22' },
  { id: 'espera_sofa1_dir', x: 46.7, y: 30.45, dir: 'DOWN', acesso: 'deck_aisle_23' },
  { id: 'espera_sofa2_esq', x: 52.7, y: 30.45, dir: 'DOWN', acesso: 'deck_aisle_23' },
  { id: 'espera_sofa2_dir', x: 54.7, y: 30.45, dir: 'DOWN', acesso: 'deck_aisle_24' },
  { id: 'espera_pufe_1', x: 44.5, y: 33.1, dir: 'UP', acesso: 'espera_salao_oeste' },
  { id: 'espera_pufe_2', x: 46.9, y: 33.1, dir: 'UP', acesso: 'espera_salao_oeste' },
  { id: 'espera_pufe_3', x: 52.5, y: 33.1, dir: 'UP', acesso: 'espera_salao_leste' },
  { id: 'espera_pufe_4', x: 54.9, y: 33.1, dir: 'UP', acesso: 'espera_salao_leste' },
];

export const TAPETES: Tapete[] = [
  { x: 79.6, y: 21.4, w: 4.0, h: 5.8, fundo: '#2a1840', borda: '#facc15' }, // VIP, sob o sofá
  { x: 42.6, y: 46.8, w: 5.6, h: 2.4, fundo: '#2e1b45', borda: '#a855f7' }, // sala de espera
  { x: 43.0, y: 29.4, w: 5.4, h: 4.5, fundo: '#132a42', borda: '#38bdf8' }, // sala de espera PCs oeste
  { x: 51.0, y: 29.4, w: 5.4, h: 4.5, fundo: '#281742', borda: '#c084fc' }, // sala de espera PCs leste
  { x: 28.9, y: 7.9, w: 6.2, h: 3.3, fundo: '#1c2a4c', borda: '#38bdf8' }, // reunião ADM
  { x: 14.2, y: 7.8, w: 4.6, h: 2.5, fundo: '#3b1d4a', borda: '#f472b6' }, // estúdio
  { x: 4.3, y: 33.7, w: 5.2, h: 2.1, fundo: '#0e3a4a', borda: '#2dd4bf' }, // galeria oeste
  { x: 14.5, y: 32.2, w: 5.2, h: 2.1, fundo: '#3a1030', borda: '#f472b6' }, // galeria leste
];
