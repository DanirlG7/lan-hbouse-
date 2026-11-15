import { TILE_SIZE } from '../world/constants';
import { SLOTS_PC } from '../world/layout';
import { Loja, LOJAS, PROPS, Prop, TipoLoja } from '../world/decor';
import { DETALHES, Detalhe } from '../world/detalhes';

/**
 * Desenha (no cache estático de chão e de móveis) tudo o que enche o mapa:
 *  - tapetes neon e bancadas ligando as mesas de cada ilha de PCs
 *  - as 8 lojas do mini centro comercial gamer
 *  - props soltos (bebedouro, totem, pebolim, ponto de ônibus, banca...)
 */

const OUT = '#261d2e';
const SOMBRA = 'rgba(14, 10, 24, 0.32)';
const t = (v: number) => Math.round(v * TILE_SIZE);

function rect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cor: string) {
  ctx.fillStyle = cor;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

function caixa(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  borda = OUT,
  bp = 2
) {
  const rx = Math.round(x);
  const ry = Math.round(y);
  const rw = Math.max(2 * bp + 1, Math.round(w));
  const rh = Math.max(2 * bp + 1, Math.round(h));
  ctx.fillStyle = borda;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.fillStyle = fill;
  ctx.fillRect(rx + bp, ry + bp, rw - bp * 2, rh - bp * 2);
  // chanfro: luz no topo e sombra na base (translúcidos: não alteram a profundidade)
  if (rw - bp * 2 >= 6 && rh - bp * 2 >= 6) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.13)';
    ctx.fillRect(rx + bp, ry + bp, rw - bp * 2, 2);
    ctx.fillStyle = 'rgba(8, 4, 24, 0.22)';
    ctx.fillRect(rx + bp, ry + rh - bp - 2, rw - bp * 2, 2);
  }
}

/** '#rrggbb' + alpha -> rgba() (translúcido) */
function corAlfa(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

function placaNeon(ctx: CanvasRenderingContext2D, cx: number, y: number, larguraMax: number, texto: string, cor: string) {
  const tam = 11;
  ctx.font = `700 ${tam}px "Inter", -apple-system, system-ui, sans-serif`;
  const textoLargura = Math.round(ctx.measureText(texto).width);
  const w = Math.max(larguraMax, textoLargura + 20);
  const h = 22;
  const bx = Math.round(cx - w / 2);

  // halo neon suave
  rect(ctx, bx - 3, y - 3, w + 6, h + 6, corAlfa(cor, 0.10));
  rect(ctx, bx - 1, y - 1, w + 2, h + 2, corAlfa(cor, 0.20));
  caixa(ctx, bx, y, w, h, '#0d1527', cor, 1.5);
  rect(ctx, bx + 3, y + 2, w - 6, 2, 'rgba(255,255,255,0.18)');

  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = corAlfa(cor, 0.4);
  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => ctx.fillText(texto, cx + dx, y + h / 2 + dy));
  ctx.fillStyle = '#ffffff';
  ctx.fillText(texto, cx, y + h / 2);
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'start';
}

// ============================================================================
// ILHAS DE PC: tapetes (chão) e bancadas (móveis)
// ============================================================================
interface Ilha {
  y: number; // tile do assento
  xMin: number;
  xMax: number;
  tipo: 'COMUM' | 'DECK' | 'VIP';
}

function ilhasDePc(): Ilha[] {
  const mapa = new Map<string, Ilha>();
  SLOTS_PC.forEach((p) => {
    const prefixo = p.nodoAssento.split('_')[0];
    const chave = `${prefixo}:${p.y}`;
    const atual = mapa.get(chave);
    const tipo = prefixo === 'vip' ? 'VIP' : prefixo === 'deck' ? 'DECK' : 'COMUM';
    if (!atual) mapa.set(chave, { y: p.y, xMin: p.x, xMax: p.x, tipo });
    else {
      atual.xMin = Math.min(atual.xMin, p.x);
      atual.xMax = Math.max(atual.xMax, p.x);
    }
  });
  return Array.from(mapa.values());
}

const COR_ILHA = { COMUM: '#22d3ee', DECK: '#e879f9', VIP: '#facc15' } as const;

function tapeteIlha(f: CanvasRenderingContext2D, i: Ilha) {
  const x = t(i.xMin) - 62;
  const w = t(i.xMax) - t(i.xMin) + 124;
  const y = t(i.y) - 58;
  const h = 126;
  const base = i.tipo === 'VIP' ? '#2a1840' : i.tipo === 'DECK' ? '#2a1838' : '#1a2140';
  caixa(f, x, y, w, h, base, COR_ILHA[i.tipo], 2);
  for (let ly = y + 8; ly < y + h - 8; ly += 16) rect(f, x + 6, ly, w - 12, 2, 'rgba(255,255,255,0.05)');
  rect(f, x + 8, y + h - 12, w - 16, 3, COR_ILHA[i.tipo]);
}

function bancadaIlha(m: CanvasRenderingContext2D, i: Ilha) {
  const x = t(i.xMin) - 24;
  const w = t(i.xMax) - t(i.xMin) + 52;
  const y = t(i.y) - 30;
  const vip = i.tipo === 'VIP';
  rect(m, x + 2, y + 22, w, 5, SOMBRA);
  caixa(m, x, y, w, 22, vip ? '#2a1f45' : '#3a2f52', vip ? '#facc15' : OUT, 2);
  rect(m, x + 4, y + 4, w - 8, 10, vip ? '#3c2d63' : '#5a4a7a');
  // canaleta de cabos com LEDs
  for (let cx = x + 10; cx < x + w - 10; cx += 18) rect(m, cx, y + 16, 8, 2, (cx / 18) % 2 < 1 ? '#22d3ee' : '#a855f7');
  // divisórias de vidro entre as mesas
  for (let cx = x + 54; cx < x + w - 20; cx += 96) caixa(m, cx, y - 18, 4, 22, 'rgba(125, 211, 252, 0.35)', '#7dd3fc', 1);
}

export function desenharChaoDecor(f: CanvasRenderingContext2D) {
  ilhasDePc().forEach((i) => tapeteIlha(f, i));
  // tapete da praça da galeria
  caixa(f, t(10.2), t(31.6), t(3.6), t(2.8), '#3b1d4a', '#2dd4bf', 2);
  // piso das lojas
  LOJAS.forEach((l) => {
    caixa(f, t(l.x) - 4, t(l.y) - 4, t(l.w) + 8, t(l.h) + 8, '#201a36', l.cor, 2);
    rect(f, t(l.x), t(l.y), t(l.w), t(l.h), '#2e2650');
    for (let lx = t(l.x) + 8; lx < t(l.x) + t(l.w) - 4; lx += 16) rect(f, lx, t(l.y), 2, t(l.h), 'rgba(255,255,255,0.04)');
  });
}

// ============================================================================
// LOJAS
// ============================================================================
const PALETA: Record<TipoLoja, string[]> = {
  HARDWARE: ['#16a34a', '#dc2626', '#2563eb', '#e5e7eb', '#111827'],
  ASSISTENCIA: ['#64748b', '#475569', '#0f766e', '#b45309'],
  GAMES: ['#ef4444', '#3b82f6', '#22c55e', '#facc15', '#a855f7', '#f97316'],
  PERIFERICOS: ['#f472b6', '#38bdf8', '#e2e8f0', '#1e293b', '#a3e635'],
  CELULAR: ['#1e293b', '#64748b', '#38bdf8', '#f472b6'],
  CARDS: ['#facc15', '#ef4444', '#38bdf8', '#a855f7', '#4ade80'],
  ACAI: ['#7e22ce', '#be185d', '#16a34a', '#f59e0b'],
  MERCH: ['#2563eb', '#dc2626', '#16a34a', '#f8fafc', '#7c3aed'],
};

function estante(m: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, pal: string[], seed: number) {
  caixa(m, x, y, w, h, '#4a3a5e', OUT, 2);
  const linhas = Math.max(1, Math.floor((h - 6) / 14));
  const cols = Math.max(1, Math.floor((w - 6) / 11));
  for (let r = 0; r < linhas; r++) {
    const ry = y + 4 + r * 14;
    rect(m, x + 3, ry + 11, w - 6, 2, '#2a2038');
    for (let c = 0; c < cols; c++) {
      const cor = pal[(c * 7 + r * 3 + seed) % pal.length];
      const alt = 7 + ((c + r + seed) % 3);
      rect(m, x + 4 + c * 11, ry + 11 - alt, 8, alt, cor);
      rect(m, x + 4 + c * 11, ry + 11 - alt, 8, 2, 'rgba(255,255,255,0.35)');
    }
    rect(m, x + 3, ry + 1, w - 6, 2, 'rgba(180, 220, 255, 0.16)'); // fita de LED da prateleira
  }
  // reflexo de vidro na vitrine
  rect(m, x + 4, y + 4, 4, Math.max(2, h - 10), 'rgba(255,255,255,0.07)');
  rect(m, x + 10, y + 4, 2, Math.max(2, h - 10), 'rgba(255,255,255,0.05)');
}

function balcao(m: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cor: string) {
  rect(m, x + 2, y + h, w, 4, SOMBRA);
  caixa(m, x, y, w, h, '#8c5832', OUT, 2);
  rect(m, x + 3, y + 3, w - 6, h - 6, '#c08c58');
  // vitrine de vidro e caixa registradora
  const horiz = w >= h;
  if (horiz) {
    rect(m, x + 8, y + 5, w * 0.5, h - 10, 'rgba(125, 211, 252, 0.45)');
    caixa(m, x + w - 26, y + 3, 18, h - 6, '#334155', OUT, 2);
    rect(m, x + w - 22, y + 6, 10, 5, '#4ade80');
  } else {
    rect(m, x + 5, y + 8, w - 10, h * 0.5, 'rgba(125, 211, 252, 0.45)');
    caixa(m, x + 3, y + h - 26, w - 6, 18, '#334155', OUT, 2);
    rect(m, x + 6, y + h - 22, w - 12, 5, '#4ade80');
  }
  rect(m, x + 3, y + h - 4, w - 6, 2, cor);
  rect(m, x + 3, y + h, w - 6, 2, corAlfa(cor.startsWith('#') ? cor : '#38bdf8', 0.22)); // LED sob o balcão
}

function maquina(m: CanvasRenderingContext2D, x: number, y: number, rgb: string) {
  // gabinete gamer com vidro lateral e ventoinhas
  rect(m, x - 3, y + 3, 26, 34, corAlfa(rgb.startsWith('#') ? rgb : '#38bdf8', 0.10)); // brilho RGB
  caixa(m, x, y, 20, 34, '#1e293b', OUT, 2);
  rect(m, x + 4, y + 5, 12, 24, '#0b1220');
  rect(m, x + 6, y + 8, 8, 8, rgb);
  rect(m, x + 6, y + 19, 8, 8, '#e2e8f0');
  rect(m, x + 6, y + 31, 8, 2, rgb);
  rect(m, x + 8, y + 10, 4, 4, 'rgba(0,0,0,0.25)'); // miolo da ventoinha
  rect(m, x + 5, y + 6, 2, 22, 'rgba(255,255,255,0.12)'); // vidro lateral
}

function monitor(m: CanvasRenderingContext2D, x: number, y: number, tela: string) {
  rect(m, x - 4, y - 4, 34, 26, corAlfa(tela.startsWith('#') ? tela : '#38bdf8', 0.08)); // halo
  rect(m, x - 2, y - 2, 30, 22, corAlfa(tela.startsWith('#') ? tela : '#38bdf8', 0.12));
  caixa(m, x, y, 26, 18, '#334155', OUT, 2);
  rect(m, x + 4, y + 4, 18, 10, tela);
  rect(m, x + 4, y + 4, 6, 2, 'rgba(255,255,255,0.28)'); // reflexo da tela
  rect(m, x + 4, y + 10, 18, 2, 'rgba(0,0,0,0.14)');
  rect(m, x + 10, y + 18, 6, 4, '#475569');
  rect(m, x + 6, y + 22, 14, 2, '#64748b');
}

function pecaCentral(m: CanvasRenderingContext2D, l: Loja, mx: number, my: number, mw: number, mh: number) {
  const pal = PALETA[l.tipo];
  const cx = mx + mw / 2;
  const cy = my + mh / 2;
  switch (l.tipo) {
    case 'HARDWARE': {
      const rgbs = ['#22d3ee', '#f472b6', '#a855f7'];
      const n = Math.max(2, Math.floor(mw / 38));
      for (let i = 0; i < n; i++) {
        const px = mx + (mw - n * 38 + 18) / 2 + i * 38;
        rect(m, px - 2, my + mh - 8, 24, 8, SOMBRA);
        caixa(m, px - 2, my + mh - 12, 24, 10, '#475569', OUT, 2);
        maquina(m, px, my + mh - 46, rgbs[i % 3]);
      }
      monitor(m, cx - 13, my + 2, '#4f46e5');
      break;
    }
    case 'ASSISTENCIA': {
      caixa(m, mx + 2, cy - 6, mw - 4, 20, '#7c5a36', OUT, 2);
      rect(m, mx + 6, cy - 2, mw - 12, 10, '#a77a4b');
      caixa(m, mx + 12, cy - 12, 30, 14, '#0f172a', OUT, 2); // PC aberto
      rect(m, mx + 16, cy - 9, 22, 8, '#15803d');
      rect(m, mx + 20, cy - 7, 4, 4, '#facc15');
      rect(m, mx + 28, cy - 7, 6, 3, '#94a3b8');
      rect(m, mx + mw - 30, cy - 4, 14, 3, '#ef4444'); // ferro de solda
      monitor(m, mx + mw - 34, my - 2, '#dc2626');
      caixa(m, mx + 4, my + 2, 18, 12, '#475569', OUT, 2);
      caixa(m, mx + 6, my - 8, 18, 12, '#334155', OUT, 2);
      break;
    }
    case 'GAMES': {
      caixa(m, mx + 4, cy - 2, mw - 8, 16, '#3b2d54', '#a855f7', 2);
      const cores = ['#f8fafc', '#111827', '#2563eb'];
      for (let i = 0; i < 3; i++) {
        const px = mx + 14 + i * Math.floor((mw - 40) / 2);
        caixa(m, px, cy - 8, 22, 10, cores[i], OUT, 2);
        rect(m, px + 14, cy - 5, 4, 3, '#22d3ee');
      }
      caixa(m, mx + 2, my - 6, 20, 30, '#0ea5e9', OUT, 2); // totem de jogo
      rect(m, mx + 5, my - 3, 14, 12, '#f472b6');
      caixa(m, mx + mw - 22, my - 6, 20, 30, '#f97316', OUT, 2);
      rect(m, mx + mw - 19, my - 3, 14, 12, '#facc15');
      break;
    }
    case 'PERIFERICOS': {
      caixa(m, mx + 4, my - 2, mw - 8, 14, '#1e1b2e', '#f472b6', 2); // painel de ganchos
      for (let i = 0; i < Math.floor((mw - 16) / 12); i++) {
        rect(m, mx + 8 + i * 12, my + 2, 8, 8, pal[i % pal.length]);
      }
      caixa(m, mx + 8, cy, mw - 16, 14, '#475569', OUT, 2);
      for (let k = 0; k < Math.floor((mw - 28) / 6); k++) rect(m, mx + 13 + k * 6, cy + 4, 4, 5, k % 4 === 0 ? '#f472b6' : '#cbd5e1');
      rect(m, mx + mw - 20, cy + 16, 10, 6, '#38bdf8'); // mouse
      break;
    }
    case 'CELULAR': {
      caixa(m, mx + 2, my, mw - 4, 18, '#334155', OUT, 2);
      for (let i = 0; i < Math.floor((mw - 12) / 8); i++) rect(m, mx + 6 + i * 8, my + 4, 5, 10, pal[i % pal.length]);
      caixa(m, mx + 4, cy + 4, 14, 22, '#0ea5e9', OUT, 2);
      rect(m, mx + 7, cy + 7, 8, 10, '#e0f2fe');
      break;
    }
    case 'CARDS': {
      caixa(m, mx + 2, cy - 4, mw - 4, 18, '#166534', OUT, 2);
      for (let i = 0; i < 4; i++) rect(m, mx + 8 + i * 10, cy, 6, 8, pal[i % pal.length]);
      [mx + 4, mx + mw - 12].forEach((sx) => caixa(m, sx, cy + 18, 8, 8, '#7c3aed', OUT, 2));
      caixa(m, mx + mw / 2 - 12, my - 4, 24, 14, '#a5f3fc', '#38bdf8', 2);
      rect(m, mx + mw / 2 - 6, my, 4, 6, '#f43f5e');
      rect(m, mx + mw / 2 + 2, my, 4, 6, '#facc15');
      break;
    }
    case 'ACAI': {
      caixa(m, mx + 2, my - 4, 22, 28, '#e2e8f0', OUT, 2); // freezer
      rect(m, mx + 6, my, 14, 8, '#7dd3fc');
      rect(m, mx + 6, my + 12, 14, 8, '#c084fc');
      caixa(m, mx + mw - 26, my - 2, 24, 14, '#1e1b2e', '#c084fc', 2); // cardápio
      rect(m, mx + mw - 22, my + 2, 16, 2, '#f472b6');
      rect(m, mx + mw - 22, my + 6, 12, 2, '#facc15');
      [0, 1].forEach((i) => caixa(m, mx + 8 + i * 22, cy + 8, 12, 10, '#be185d', OUT, 2)); // banquinhos
      break;
    }
    case 'MERCH': {
      rect(m, mx + 4, my + 4, mw - 8, 3, '#94a3b8');
      for (let i = 0; i < 3; i++) {
        const px = mx + 8 + i * 14;
        rect(m, px, my + 7, 10, 14, pal[i % pal.length]);
        rect(m, px - 3, my + 7, 3, 6, pal[i % pal.length]);
        rect(m, px + 10, my + 7, 3, 6, pal[i % pal.length]);
      }
      caixa(m, mx + mw / 2 - 8, cy + 6, 16, 22, '#7c3aed', OUT, 2); // manequim com camisa
      rect(m, mx + mw / 2 - 4, cy + 2, 8, 6, '#fbd3b4');
      break;
    }
  }
}

function desenharLoja(m: CanvasRenderingContext2D, l: Loja) {
  const px = t(l.x);
  const py = t(l.y);
  const pw = t(l.w);
  const ph = t(l.h);
  const pal = PALETA[l.tipo];
  const seed = l.id.length;

  // toldo listrado + placa
  for (let i = 0; i < pw; i += 16) rect(m, px + i, py - 8, 16, 10, (i / 16) % 2 === 0 ? l.cor : '#f1f5f9');
  // franja em semicírculos de pixel e sombreado das listras
  for (let i = 0; i < pw; i += 16) {
    const fc = (i / 16) % 2 === 0 ? l.cor : '#f1f5f9';
    const lim = Math.max(0, Math.min(12, pw - (i + 2))); // franja nunca passa da borda da loja
    const lim2 = Math.max(0, Math.min(8, pw - (i + 4)));
    if (lim > 0) rect(m, px + i + 2, py + 2, lim, 2, fc);
    if (lim2 > 0) rect(m, px + i + 4, py + 4, lim2, 2, fc);
    rect(m, px + i, py - 8, 16, 2, 'rgba(255,255,255,0.22)');
    rect(m, px + i, py, 16, 2, 'rgba(0,0,0,0.14)');
  }
  rect(m, px, py + 6, pw, 3, 'rgba(0,0,0,0.3)');
  rect(m, px, py + 9, pw, 8, corAlfa(l.cor, 0.12)); // luz do toldo sobre a vitrine
  placaNeon(m, px + pw / 2, py - 30, pw, l.nome, l.cor);

  if (l.lado === 'N') {
    balcao(m, px + 10, py + 10, pw - 20, 26, l.cor);
    estante(m, px + 8, py + ph - 38, pw - 16, 34, pal, seed);
    pecaCentral(m, l, px + 12, py + 46, pw - 24, ph - 90);
  } else {
    const bx = l.lado === 'E' ? px + pw - 36 : px + 10;
    const ex = l.lado === 'E' ? px + 6 : px + pw - 40;
    const mx = l.lado === 'E' ? px + 46 : px + 46;
    balcao(m, bx, py + 10, 26, ph - 20, l.cor);
    estante(m, ex, py + 10, 34, ph - 20, pal, seed);
    pecaCentral(m, l, mx, py + 16, pw - 94, ph - 34);
  }
  // etiquetas de preço
  for (let i = 0; i < 3; i++) rect(m, px + 14 + i * 22, py + ph - 3, 8, 3, '#facc15');
}

// ============================================================================
// PROPS
// ============================================================================
function desenharProp(m: CanvasRenderingContext2D, p: Prop) {
  const x = t(p.x);
  const y = t(p.y);
  switch (p.tipo) {
    case 'AGUA':
      rect(m, x + 2, y + 32, 20, 4, SOMBRA);
      caixa(m, x, y + 8, 20, 26, '#cbd5e1', OUT, 2);
      caixa(m, x + 3, y - 6, 14, 16, '#7dd3fc', '#38bdf8', 2);
      rect(m, x + 6, y + 18, 4, 3, '#38bdf8');
      rect(m, x + 12, y + 18, 4, 3, '#f87171');
      break;
    case 'TOTEM':
      rect(m, x + 2, y + 44, 22, 4, SOMBRA);
      caixa(m, x, y, 22, 46, '#161225', p.cor ?? '#22d3ee', 2);
      rect(m, x + 4, y + 4, 14, 22, p.cor ?? '#22d3ee');
      rect(m, x + 6, y + 8, 10, 3, '#0b1220');
      rect(m, x + 6, y + 14, 8, 3, '#0b1220');
      rect(m, x + 8, y + 32, 6, 8, '#475569');
      break;
    case 'ALTO_FALANTE':
      caixa(m, x, y, 18, 40, '#111827', OUT, 2);
      rect(m, x + 4, y + 5, 10, 10, '#334155');
      rect(m, x + 6, y + 7, 6, 6, '#64748b');
      rect(m, x + 3, y + 20, 12, 12, '#334155');
      rect(m, x + 6, y + 23, 6, 6, '#64748b');
      break;
    case 'PUFE':
      rect(m, x + 2, y + 18, 28, 4, SOMBRA);
      caixa(m, x, y, 28, 20, p.cor ?? '#7e22ce', OUT, 2);
      rect(m, x + 4, y + 4, 20, 4, 'rgba(255,255,255,0.3)');
      break;
    case 'SINUCA':
    case 'PEBOLIM': {
      const wM = t(3.2);
      const hM = t(1.3);
      rect(m, x + 2, y + hM, wM, 4, SOMBRA);
      // Moldura de mogno da mesa de sinuca + filete dourado
      caixa(m, x, y, wM, hM, '#7c3a1c', OUT, 2);
      rect(m, x + 6, y + 6, wM - 12, hM - 12, '#15803d');
      rect(m, x + 7, y + 7, wM - 14, 2, '#14532d');
      // 6 caçapas (4 cantos + 2 centrais)
      const cxMeio = x + Math.round(wM / 2) - 3;
      [
        [x + 4, y + 4],
        [cxMeio, y + 3],
        [x + wM - 10, y + 4],
        [x + 4, y + hM - 10],
        [cxMeio, y + hM - 9],
        [x + wM - 10, y + hM - 10],
      ].forEach(([px, py]) => rect(m, px, py, 6, 6, '#090d16'));
      // Marcações diamante nas bordas + giz azul no canto
      for (let d = 16; d < wM - 16; d += 22) {
        rect(m, x + d, y + 2, 2, 2, '#facc15');
        rect(m, x + d, y + hM - 4, 2, 2, '#facc15');
      }
      // Linha branca do baulk
      rect(m, x + 26, y + 7, 1, hM - 14, 'rgba(248, 250, 252, 0.35)');
      rect(m, x + wM - 15, y + 1, 4, 4, '#38bdf8');
      break;
    }
    case 'CAIXA_ELETRONICO':
      rect(m, x + 2, y + 36, 24, 4, SOMBRA);
      caixa(m, x, y, 24, 38, '#1d4ed8', OUT, 2);
      rect(m, x + 4, y + 5, 16, 10, '#bfdbfe');
      rect(m, x + 5, y + 19, 14, 8, '#1e3a8a');
      rect(m, x + 5, y + 30, 14, 3, '#0b1220');
      break;
    case 'LIXEIRA':
      rect(m, x + 1, y + 16, 14, 3, SOMBRA);
      caixa(m, x, y, 14, 18, '#15803d', OUT, 2);
      rect(m, x + 3, y + 5, 8, 3, '#bbf7d0');
      break;
    case 'BICICLETARIO':
      for (let i = 0; i < 3; i++) {
        const bx = x + i * 24;
        rect(m, bx, y + 6, 2, 12, '#94a3b8');
        rect(m, bx + 14, y + 6, 2, 12, '#94a3b8');
        rect(m, bx, y + 6, 16, 2, '#94a3b8');
      }
      // duas bicicletas
      [x + 4, x + 52].forEach((bx) => {
        caixa(m, bx, y + 4, 12, 12, 'rgba(0,0,0,0)', '#0b1220', 2);
        caixa(m, bx + 16, y + 4, 12, 12, 'rgba(0,0,0,0)', '#0b1220', 2);
        rect(m, bx + 6, y, 18, 3, '#f97316');
      });
      break;
    case 'BANCA':
      rect(m, x + 2, y + 52, 120, 4, SOMBRA);
      caixa(m, x, y + 8, 118, 44, '#7c2d12', OUT, 2);
      for (let i = 0; i < 118; i += 14) rect(m, x + i, y - 6, 14, 14, (i / 14) % 2 === 0 ? '#ef4444' : '#f8fafc');
      for (let i = 0; i < 7; i++) rect(m, x + 8 + i * 15, y + 16, 11, 14, ['#facc15', '#38bdf8', '#f472b6', '#4ade80'][i % 4]);
      rect(m, x + 8, y + 36, 100, 6, '#c08c58');
      m.font = '700 8px "Inter", sans-serif';
      m.fillStyle = '#facc15';
      m.fillText('BANCA', x + 44, y + 12);
      break;
    case 'PONTO_ONIBUS':
      rect(m, x + 2, y + 42, 150, 4, SOMBRA);
      caixa(m, x, y, 152, 12, 'rgba(56, 189, 248, 0.55)', '#0ea5e9', 2); // cobertura de vidro
      [x + 6, x + 140].forEach((px) => rect(m, px, y + 12, 4, 30, '#64748b'));
      caixa(m, x + 20, y + 24, 80, 10, '#8c5832', OUT, 2); // banco
      caixa(m, x + 108, y - 24, 26, 22, '#1d4ed8', '#f8fafc', 2); // placa
      m.font = '700 8px "Inter", sans-serif';
      m.fillStyle = '#f8fafc';
      m.fillText('204', x + 114, y - 9);
      break;
  }
}

// ============================================================================
// DETALHES (Lote 1): cabos, caixas, placas, lixeiras e extintores
// Sólidos: preenchimento opaco; sombras translúcidas. Cabos são chão (plano).
// ============================================================================
function desenharCabo(m: CanvasRenderingContext2D, d: Detalhe) {
  const x = t(d.x);
  const y = t(d.y);
  const cor = d.cor ?? '#22d3ee';
  const horiz = d.tipo === 'CABO_H';
  const len = 96;
  const w = horiz ? len : 4;
  const h = horiz ? 4 : len;
  rect(m, x, y, w, h, '#0b1020');
  // capa colorida (metade da espessura) e braçadeiras a cada 16 px
  if (horiz) rect(m, x, y + 2, w, 2, cor);
  else rect(m, x + 2, y, 2, h, cor);
  for (let i = 8; i < len - 4; i += 16) {
    if (horiz) rect(m, x + i, y, 4, 4, '#334155');
    else rect(m, x, y + i, 4, 4, '#334155');
  }
  // conectores nas pontas
  rect(m, x - 2, y - 2, horiz ? 4 : 8, horiz ? 8 : 4, '#94a3b8');
  rect(m, horiz ? x + len - 2 : x - 2, horiz ? y - 2 : y + len - 2, horiz ? 4 : 8, horiz ? 8 : 4, '#94a3b8');
}

function desenharDetalhe(m: CanvasRenderingContext2D, d: Detalhe) {
  const x = t(d.x);
  const y = t(d.y);
  switch (d.tipo) {
    case 'EXTINTOR':
      rect(m, x + 1, y + 14, 10, 3, SOMBRA);
      caixa(m, x + 1, y + 4, 8, 12, '#dc2626', OUT, 2);
      rect(m, x + 3, y, 4, 5, '#1f2937'); // válvula
      rect(m, x + 6, y + 1, 4, 2, '#9ca3af'); // gatilho
      rect(m, x + 3, y + 8, 4, 4, '#f8fafc'); // etiqueta
      break;
    case 'CAIXAS':
      rect(m, x + 2, y + 18, 24, 3, SOMBRA);
      caixa(m, x, y + 8, 16, 12, '#a16207', OUT, 2);
      rect(m, x + 6, y + 8, 4, 12, '#fde68a'); // fita
      caixa(m, x + 12, y + 4, 14, 16, '#b45309', OUT, 2);
      rect(m, x + 17, y + 4, 4, 16, '#fcd34d');
      caixa(m, x + 3, y, 10, 8, '#ca8a04', OUT, 2);
      break;
    case 'PLACA':
      rect(m, x + 1, y + 18, 14, 3, SOMBRA);
      rect(m, x + 3, y, 8, 3, '#f59e0b');
      caixa(m, x + 1, y + 2, 12, 16, '#facc15', '#92400e', 2);
      rect(m, x + 6, y + 6, 2, 6, '#1f2937'); // "!"
      rect(m, x + 6, y + 14, 2, 2, '#1f2937');
      break;
    case 'LIXEIRA':
      rect(m, x + 1, y + 16, 14, 3, SOMBRA);
      caixa(m, x, y, 14, 18, '#334155', OUT, 2);
      rect(m, x, y, 14, 4, '#64748b'); // tampa
      rect(m, x + 4, y + 8, 6, 4, '#4ade80'); // selo de reciclagem
      break;
    default:
      break;
  }
}

export function desenharMoveisDecor(m: CanvasRenderingContext2D, plano: (fn: () => void) => void = (fn) => fn()) {
  // as bancadas ficam atrás das mesas e dos jogadores: são "chão" para a profundidade
  plano(() => ilhasDePc().forEach((i) => bancadaIlha(m, i)));
  LOJAS.forEach((l) => desenharLoja(m, l));
  PROPS.forEach((p) => desenharProp(m, p));
  plano(() => DETALHES.filter((d) => d.tipo === 'CABO_H' || d.tipo === 'CABO_V').forEach((d) => desenharCabo(m, d)));
  DETALHES.forEach((d) => desenharDetalhe(m, d));
}
