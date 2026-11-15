/**
 * DECORAÇÃO E LOJAS DO MAPA (dados puros, unidades em TILES de 32px)
 *
 * Mini centro comercial gamer: 4 lojas na faixa sul do salão (balcão voltado ao norte)
 * e 4 lojas na galeria oeste (balcão voltado ao corredor central do lounge).
 * Este arquivo NÃO importa o layout (o layout é que importa este) para evitar ciclo.
 */

export type TipoLoja =
  | 'HARDWARE'
  | 'ASSISTENCIA'
  | 'GAMES'
  | 'PERIFERICOS'
  | 'CELULAR'
  | 'CARDS'
  | 'ACAI'
  | 'MERCH';

/** Lado em que fica o balcão (de onde o cliente atende): N = norte, E = leste, W = oeste */
export type LadoBalcao = 'N' | 'E' | 'W';

/** Setor do jogo que o clique na loja abre (mesmos setores do LanHouseCanvas) */
export type SetorLoja = 'BOMBONIERE' | 'MANUTENCAO';

export interface Loja {
  id: string;
  nome: string;
  tipo: TipoLoja;
  x: number;
  y: number;
  w: number;
  h: number;
  lado: LadoBalcao;
  /** cor do neon / toldo */
  cor: string;
  setor: SetorLoja;
  /** nó de grafo em frente ao balcão, onde os clientes ficam olhando a vitrine */
  frente: { id: string; x: number; y: number };
}

const loja = (
  id: string,
  nome: string,
  tipo: TipoLoja,
  x: number,
  y: number,
  w: number,
  h: number,
  lado: LadoBalcao,
  cor: string,
  setor: SetorLoja,
  fx: number,
  fy: number
): Loja => ({ id, nome, tipo, x, y, w, h, lado, cor, setor, frente: { id: `loja_${id}_frente`, x: fx, y: fy } });

export const LOJAS: Loja[] = [
  // --- faixa sul do salão gamer (balcão voltado ao norte, onde ficam os PCs)
  loja('hardware', 'HARDWARE STORE', 'HARDWARE', 22.6, 38, 7.6, 6.6, 'N', '#22d3ee', 'BOMBONIERE', 27.5, 36.6),
  loja('assistencia', 'ASSISTÊNCIA PC', 'ASSISTENCIA', 30.8, 38, 7.2, 6.6, 'N', '#fb923c', 'MANUTENCAO', 33.5, 36.6),
  loja('games', 'GAME STORE', 'GAMES', 42.4, 38, 7.6, 6.6, 'N', '#a855f7', 'BOMBONIERE', 45.5, 36.6),
  loja('perifericos', 'PERIFÉRICOS', 'PERIFERICOS', 50.6, 38, 7.2, 6.6, 'N', '#f472b6', 'BOMBONIERE', 53.5, 36.6),
  // --- galeria gamer (antigo lounge): coluna oeste atende para leste, coluna leste para oeste
  loja('celular', 'CELL & ACESSÓRIOS', 'CELULAR', 4.6, 37.6, 5, 4.4, 'E', '#38bdf8', 'BOMBONIERE', 10.5, 40),
  loja('cards', 'CARDS & COLEÇÃO', 'CARDS', 4.6, 43, 5, 4.4, 'E', '#facc15', 'BOMBONIERE', 10.5, 45),
  loja('acai', 'AÇAÍ & SHAKES', 'ACAI', 14.4, 37.6, 5, 4.4, 'W', '#c084fc', 'BOMBONIERE', 13.5, 40),
  loja('merch', 'TEAM STORE', 'MERCH', 14.4, 43, 5, 4.4, 'W', '#4ade80', 'BOMBONIERE', 13.5, 45),
];

export interface AncoraLoja {
  id: string;
  x: number;
  y: number;
  etiqueta?: string;
}

/** Nós de grafo na frente de cada loja (o grafo liga cada um ao corredor mais próximo) */
export const ANCORAS_LOJAS: AncoraLoja[] = LOJAS.map((l) => ({
  id: l.frente.id,
  x: l.frente.x,
  y: l.frente.y,
  etiqueta: l.nome,
}));

// ---------------------------------------------------------------------------
// PROPS (decoração solta)
// ---------------------------------------------------------------------------
export type TipoProp =
  | 'AGUA'
  | 'TOTEM'
  | 'ALTO_FALANTE'
  | 'PUFE'
  | 'PEBOLIM'
  | 'SINUCA'
  | 'BANCA'
  | 'PONTO_ONIBUS'
  | 'BICICLETARIO'
  | 'LIXEIRA'
  | 'CAIXA_ELETRONICO';

export interface Prop {
  tipo: TipoProp;
  x: number;
  y: number;
  cor?: string;
}

export const PROPS: Prop[] = [
  // salão gamer
  { tipo: 'AGUA', x: 37.0, y: 30.6 },
  { tipo: 'AGUA', x: 42.6, y: 30.6 },
  { tipo: 'TOTEM', x: 36.8, y: 23.0, cor: '#22d3ee' },
  { tipo: 'TOTEM', x: 42.8, y: 23.0, cor: '#f472b6' },
  { tipo: 'ALTO_FALANTE', x: 20.8, y: 24.4 },
  { tipo: 'ALTO_FALANTE', x: 58.4, y: 24.4 },
  { tipo: 'ALTO_FALANTE', x: 20.8, y: 32.4 },
  { tipo: 'ALTO_FALANTE', x: 58.4, y: 32.4 },
  // VIP
  { tipo: 'PUFE', x: 64.0, y: 24.0, cor: '#7e22ce' },
  { tipo: 'PUFE', x: 64.0, y: 25.6, cor: '#be185d' },
  { tipo: 'SINUCA', x: 67.4, y: 30.2 },
  { tipo: 'SINUCA', x: 76.4, y: 30.2 },
  // galeria
  { tipo: 'CAIXA_ELETRONICO', x: 8.2, y: 31.6 },
  { tipo: 'PUFE', x: 10.6, y: 33.6, cor: '#0e7490' },
  { tipo: 'PUFE', x: 13.2, y: 33.6, cor: '#be185d' },
  // calçada
  { tipo: 'PONTO_ONIBUS', x: 28.0, y: 52.45 },
  { tipo: 'BICICLETARIO', x: 14.5, y: 52.9 },
  { tipo: 'BICICLETARIO', x: 48.4, y: 52.9 },
  { tipo: 'LIXEIRA', x: 18.6, y: 53.0 },
  { tipo: 'LIXEIRA', x: 62.4, y: 53.0 },
  { tipo: 'BANCA', x: 76.2, y: 52.3 },
];

/** Retângulos sólidos criados por esta decoração (lojas e pebolins), em tiles */
export const SOLIDOS_DECOR: Array<{ x: number; y: number; w: number; h: number }> = [
  ...LOJAS.map((l) => ({ x: l.x, y: l.y, w: l.w, h: l.h })),
  { x: 67.4, y: 30.2, w: 3.2, h: 1.3 },
  { x: 76.4, y: 30.2, w: 3.2, h: 1.3 },
];
