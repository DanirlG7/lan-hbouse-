import {
  COLLISION_CELL,
  COLLISION_COLS,
  COLLISION_ROWS,
  TILE_SIZE,
} from './constants';
import { PORTAS, SALAS, SLOTS_PC, SOLIDOS_FIXOS } from './layout';

/**
 * CAMADA DE COLISÃO (separada da arte)
 * Grade de 16px (meio tile). Paredes são geradas a partir das bordas das salas,
 * com os vãos das portas removidos. Mesas de PC, balcões e a zona de expansão são sólidos.
 */

export interface SegmentoParede {
  orientacao: 'H' | 'V';
  /** linha em células de 16px */
  linha: number;
  ini: number;
  fim: number;
}

function chave(o: 'H' | 'V', linha: number, idx: number): string {
  return `${o}:${linha}:${idx}`;
}

function construirParedes(): Set<string> {
  const paredes = new Set<string>();
  SALAS.forEach((s) => {
    const x1 = Math.round(s.x * 2);
    const x2 = Math.round((s.x + s.w) * 2);
    const y1 = Math.round(s.y * 2);
    const y2 = Math.round((s.y + s.h) * 2);
    for (let i = x1; i < x2; i++) {
      paredes.add(chave('H', y1, i));
      paredes.add(chave('H', y2, i));
    }
    for (let i = y1; i < y2; i++) {
      paredes.add(chave('V', x1, i));
      paredes.add(chave('V', x2, i));
    }
  });

  PORTAS.forEach((p) => {
    const meia = p.largura / 2;
    if (p.orientacao === 'H') {
      const linha = Math.round(p.y * 2);
      const a = Math.round((p.x - meia) * 2);
      const b = Math.round((p.x + meia) * 2);
      for (let i = a; i < b; i++) paredes.delete(chave('H', linha, i));
    } else {
      const linha = Math.round(p.x * 2);
      const a = Math.round((p.y - meia) * 2);
      const b = Math.round((p.y + meia) * 2);
      for (let i = a; i < b; i++) paredes.delete(chave('V', linha, i));
    }
  });
  return paredes;
}

const PAREDES = construirParedes();

/** Segmentos de parede já agrupados em trechos contíguos (para desenhar) */
export function segmentosDeParede(): SegmentoParede[] {
  const grupos = new Map<string, number[]>();
  PAREDES.forEach((k) => {
    const [o, linha, idx] = k.split(':');
    const g = `${o}:${linha}`;
    const lista = grupos.get(g) ?? [];
    lista.push(Number(idx));
    grupos.set(g, lista);
  });
  const resultado: SegmentoParede[] = [];
  grupos.forEach((lista, g) => {
    const [o, linha] = g.split(':');
    lista.sort((a, b) => a - b);
    let ini = lista[0];
    let prev = lista[0];
    for (let i = 1; i <= lista.length; i++) {
      const atual = lista[i];
      if (atual !== prev + 1) {
        resultado.push({ orientacao: o as 'H' | 'V', linha: Number(linha), ini, fim: prev + 1 });
        ini = atual;
      }
      prev = atual;
    }
  });
  return resultado;
}

function construirGrade(): Uint8Array {
  const grade = new Uint8Array(COLLISION_COLS * COLLISION_ROWS);
  const bloquear = (col: number, row: number) => {
    if (col < 0 || row < 0 || col >= COLLISION_COLS || row >= COLLISION_ROWS) return;
    grade[row * COLLISION_COLS + col] = 1;
  };

  PAREDES.forEach((k) => {
    const [o, linha, idx] = k.split(':');
    const l = Number(linha);
    const i = Number(idx);
    if (o === 'H') bloquear(i, l);
    else bloquear(l, i);
  });

  const sólido = (x: number, y: number, w: number, h: number) => {
    const c1 = Math.floor(x * 2);
    const c2 = Math.ceil((x + w) * 2);
    const r1 = Math.floor(y * 2);
    const r2 = Math.ceil((y + h) * 2);
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++) bloquear(c, r);
  };

  SOLIDOS_FIXOS.forEach((s) => sólido(s.x, s.y, s.w, s.h));
  // mesa + monitor de cada PC (a cadeira/assento fica livre)
  SLOTS_PC.forEach((p) => sólido(p.x - 0.6, p.y - 1.1, 1.3, 0.75));
  return grade;
}

export const COLISAO = construirGrade();

export function celulaBloqueada(col: number, row: number): boolean {
  if (col < 0 || row < 0 || col >= COLLISION_COLS || row >= COLLISION_ROWS) return true;
  return COLISAO[row * COLLISION_COLS + col] === 1;
}

/** Ponto em pixels do mundo é caminhável? */
export function ehCaminhavel(px: number, py: number): boolean {
  return !celulaBloqueada(Math.floor(px / COLLISION_CELL), Math.floor(py / COLLISION_CELL));
}

/** Linha reta livre de obstáculos entre dois pontos (pixels)? */
export function temLinhaDeVisao(x1: number, y1: number, x2: number, y2: number): boolean {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const passos = Math.max(1, Math.ceil(dist / (TILE_SIZE / 4)));
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    if (!ehCaminhavel(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
  }
  return true;
}
