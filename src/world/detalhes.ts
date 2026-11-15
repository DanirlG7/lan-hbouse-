/**
 * DETALHES DECORATIVOS (dados puros, unidades em TILES de 32px)
 *
 * Props de acabamento: cabos no chão, caixas, placas, lixeiras e extintores.
 * NÃO são sólidos (não entram em colisão nem no grafo): ficam encostados nas paredes,
 * em espaços que estavam vazios, longe de portas, âncoras e PCs.
 * Posições geradas por varredura do espaço livre (profundidade vazia + sólidos + portas + âncoras).
 * Este arquivo não importa o layout (evita ciclo).
 */

export type TipoDetalhe = 'CABO_H' | 'CABO_V' | 'CAIXAS' | 'PLACA' | 'LIXEIRA' | 'EXTINTOR';

export interface Detalhe {
  tipo: TipoDetalhe;
  x: number;
  y: number;
  /** cor do cabo */
  cor?: string;
}

export const DETALHES: Detalhe[] = [
  { tipo: 'CABO_H', x: 16.31, y: 11.31, cor: '#22d3ee' }, // estudio
  { tipo: 'EXTINTOR', x: 14.56, y: 10.81 }, // estudio
  { tipo: 'CAIXAS', x: 25.56, y: 10.06 }, // adm
  { tipo: 'LIXEIRA', x: 23.81, y: 10.81 }, // adm
  { tipo: 'EXTINTOR', x: 34.31, y: 6.56 }, // adm
  { tipo: 'CABO_H', x: 37.06, y: 7.31, cor: '#f472b6' }, // noc
  { tipo: 'CABO_H', x: 48.31, y: 11.06, cor: '#4ade80' }, // noc
  { tipo: 'CABO_V', x: 36.56, y: 5.31, cor: '#facc15' }, // noc
  { tipo: 'EXTINTOR', x: 51.06, y: 7.31 }, // noc
  { tipo: 'CAIXAS', x: 41.56, y: 10.56 }, // noc
  { tipo: 'CAIXAS', x: 63.31, y: 10.56 }, // estoque
  { tipo: 'CAIXAS', x: 57.56, y: 10.06 }, // estoque
  { tipo: 'PLACA', x: 66.56, y: 9.31 }, // estoque
  { tipo: 'EXTINTOR', x: 52.56, y: 10.56 }, // estoque
  { tipo: 'PLACA', x: 74.31, y: 8.56 }, // wc_cliente
  { tipo: 'LIXEIRA', x: 69.31, y: 7.31 }, // wc_cliente
  { tipo: 'PLACA', x: 82.31, y: 7.31 }, // wc_func
  { tipo: 'LIXEIRA', x: 83.06, y: 9.56 }, // wc_func
  { tipo: 'EXTINTOR', x: 53.31, y: 13.81 }, // servico
  { tipo: 'EXTINTOR', x: 34.56, y: 14.06 }, // servico
  { tipo: 'EXTINTOR', x: 30.31, y: 14.06 }, // servico
  { tipo: 'PLACA', x: 24.06, y: 13.81 }, // servico
  { tipo: 'CAIXAS', x: 67.81, y: 13.81 }, // servico
  { tipo: 'LIXEIRA', x: 5.0, y: 29.5 }, // bomboniere
  { tipo: 'CAIXAS', x: 5.31, y: 18.56 }, // bomboniere
  { tipo: 'EXTINTOR', x: 5.31, y: 16.56 }, // bomboniere
  { tipo: 'LIXEIRA', x: 11.81, y: 50.31 }, // lounge
  { tipo: 'EXTINTOR', x: 10.06, y: 50.81 }, // lounge
  { tipo: 'CABO_H', x: 5.31, y: 33.06, cor: '#22d3ee' }, // lounge
  { tipo: 'EXTINTOR', x: 58.31, y: 19.56 }, // salao
  { tipo: 'EXTINTOR', x: 58.31, y: 35.81 }, // salao
  { tipo: 'LIXEIRA', x: 58.81, y: 21.81 }, // salao
  { tipo: 'EXTINTOR', x: 68.81, y: 32.06 }, // vip
  { tipo: 'LIXEIRA', x: 82.31, y: 28.06 }, // vip
  { tipo: 'CAIXAS', x: 64.31, y: 16.31 }, // vip
  { tipo: 'EXTINTOR', x: 83.1, y: 48.2 }, // arena
  { tipo: 'LIXEIRA', x: 83.1, y: 46.6 }, // arena
  { tipo: 'CAIXAS', x: 63.81, y: 34.56 }, // arena
  { tipo: 'CABO_H', x: 79.81, y: 47.06, cor: '#4ade80' }, // arena
  { tipo: 'LIXEIRA', x: 37.06, y: 50.31 }, // recepcao
  { tipo: 'EXTINTOR', x: 22.56, y: 51.06 }, // recepcao
  { tipo: 'CAIXAS', x: 20.81, y: 46.31 }, // recepcao
];
