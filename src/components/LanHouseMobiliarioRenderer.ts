import { TILE_SIZE } from '../world/constants';
import { Movel, MOBILIARIO, TAPETES } from '../world/mobiliario';

/**
 * Desenho do mobiliário da etapa 2 (cache estático). Cada móvel é desenhado dentro do seu
 * retângulo visual (x, y, w, h), que é o mesmo usado na colisão e nos testes.
 */

const OUT = '#261d2e';
const SOMBRA = 'rgba(14, 10, 24, 0.32)';
const t = (v: number) => Math.round(v * TILE_SIZE);

type Ctx = CanvasRenderingContext2D;

function rect(ctx: Ctx, x: number, y: number, w: number, h: number, cor: string) {
  ctx.fillStyle = cor;
  ctx.fillRect(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h)));
}

function caixa(ctx: Ctx, x: number, y: number, w: number, h: number, fill: string, borda = OUT, bp = 2) {
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

/** Escurece (f < 0) ou clareia (f > 0) uma cor #rrggbb */
function tom(hex: string, f: number): string {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.max(0, Math.min(255, Math.round(f >= 0 ? v + (255 - v) * f : v * (1 + f))));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}

function cadeira(ctx: Ctx, x: number, y: number, cor = '#2563eb') {
  caixa(ctx, x, y, 14, 12, cor, OUT, 2);
  rect(ctx, x + 3, y + 3, 8, 3, tom(cor, 0.45));
  rect(ctx, x + 2, y + 8, 2, 2, 'rgba(8, 4, 24, 0.35)'); // rodízios
  rect(ctx, x + 10, y + 8, 2, 2, 'rgba(8, 4, 24, 0.35)');
}

// ---------------------------------------------------------------------------
// SOFÁ (horizontal; o vertical é o mesmo desenho girado 90°)
// ---------------------------------------------------------------------------
function sofaBase(ctx: Ctx, W: number, H: number, cor: string, encostoNorte: boolean) {
  const back = Math.round(H * 0.5);
  const escuro = tom(cor, -0.35);
  const claro = tom(cor, 0.35);
  rect(ctx, 2, H, W - 2, 3, SOMBRA);
  const by = encostoNorte ? 0 : H - back;
  const sy = encostoNorte ? back - 4 : 0;
  caixa(ctx, 0, by, W, back, escuro, OUT, 2);
  rect(ctx, 5, by + 4, W - 10, 3, tom(escuro, 0.25));
  caixa(ctx, 9, sy, W - 18, H - back + 4, cor, OUT, 2);
  rect(ctx, 13, sy + 4, W - 26, 3, claro);
  const ay = encostoNorte ? 6 : 0;
  caixa(ctx, 0, ay, 11, H - 6, escuro, OUT, 2);
  caixa(ctx, W - 11, ay, 11, H - 6, escuro, OUT, 2);
  // almofadas
  rect(ctx, 16, sy + 8, 10, 8, claro);
  rect(ctx, W - 28, sy + 8, 10, 8, tom(cor, 0.6));
  // costura entre os assentos e vincos do encosto
  rect(ctx, Math.round(W / 2) - 1, sy + 4, 2, Math.max(2, H - back - 2), 'rgba(8, 4, 24, 0.28)');
  for (let k = 14; k < W - 14; k += 12) rect(ctx, k, by + 8, 2, 2, 'rgba(255, 255, 255, 0.10)');
  rect(ctx, 11, ay + 2, 2, H - 10, 'rgba(255, 255, 255, 0.08)');
}

function desenharSofa(ctx: Ctx, m: Movel, vertical: boolean) {
  const X = t(m.x);
  const Y = t(m.y);
  const W = t(m.w);
  const H = t(m.h);
  const cor = m.cor ?? '#7e22ce';
  ctx.save();
  if (!vertical) {
    ctx.translate(X, Y);
    sofaBase(ctx, W, H, cor, m.encosto !== 'S');
  } else {
    // girado 90° horizontal: o "norte" do desenho vira o lado leste
    ctx.translate(X + W, Y);
    ctx.rotate(Math.PI / 2);
    sofaBase(ctx, H, W, cor, m.encosto === 'E');
  }
  ctx.restore();
}

// ---------------------------------------------------------------------------
// MESAS
// ---------------------------------------------------------------------------
function mesaRefeicao(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  const W = t(m.w);
  // Cadeiras traseiras (norte) alinhadas
  cadeira(ctx, X + 10, Y, '#dc2626');
  cadeira(ctx, X + W - 24, Y, '#2563eb');
  rect(ctx, X + 4, Y + 62, W - 6, 4, SOMBRA);
  caixa(ctx, X + 3, Y + 16, W - 6, 46, '#8c5832', OUT, 2);
  rect(ctx, X + 7, Y + 20, W - 14, 34, '#c08c58');
  // Trilho de mesa central + porta-guardanapos/ketchup organizado
  rect(ctx, X + 10, Y + 35, W - 20, 4, '#a67442');
  rect(ctx, X + W / 2 - 5, Y + 33, 10, 8, '#f8fafc');
  rect(ctx, X + W / 2 - 3, Y + 35, 2, 4, '#ef4444');
  rect(ctx, X + W / 2 + 1, Y + 35, 2, 4, '#facc15');
  // Jogos americanos alinhados em frente a cada cadeira (2 norte, 2 sul)
  [X + 12, X + W - 24].forEach((px) => {
    rect(ctx, px, Y + 23, 12, 8, '#e2e8f0');
    rect(ctx, px + 3, Y + 25, 6, 4, '#94a3b8');
    rect(ctx, px, Y + 43, 12, 8, '#e2e8f0');
    rect(ctx, px + 3, Y + 45, 6, 4, '#94a3b8');
  });
  // Cadeiras frontais (sul) alinhadas
  cadeira(ctx, X + 10, Y + 65, '#2563eb');
  cadeira(ctx, X + W - 24, Y + 65, '#dc2626');
}

function mesaReuniao(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  const W = t(m.w);
  const L = Math.floor((W - 30) / 3);
  [0, 1, 2].forEach((i) => cadeira(ctx, X + 12 + i * (L + 3), Y + 2, '#334155'));
  rect(ctx, X + 12, Y + 56, W - 20, 4, SOMBRA);
  caixa(ctx, X + 8, Y + 15, W - 16, 40, '#e2e8f0', OUT, 2);
  rect(ctx, X + 12, Y + 19, W - 24, 28, '#f8fafc');
  rect(ctx, X + 20, Y + 24, 16, 10, '#38bdf8'); // notebook
  rect(ctx, X + 20, Y + 34, 16, 2, '#64748b');
  rect(ctx, X + W / 2 - 4, Y + 28, 10, 8, '#f59e0b'); // pasta
  rect(ctx, X + W - 40, Y + 26, 14, 10, '#fef3c7'); // papéis
  [0, 1, 2].forEach((i) => cadeira(ctx, X + 12 + i * (L + 3), Y + 57, '#334155'));
}

function mesaSom(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  const W = t(m.w);
  rect(ctx, X + 4, Y + 34, W - 6, 4, SOMBRA);
  caixa(ctx, X + 2, Y + 8, W - 4, 28, '#1e1b2e', '#f472b6', 2);
  rect(ctx, X + 8, Y + 14, W - 16, 16, '#334155');
  for (let i = 0; i < Math.floor((W - 24) / 8); i++) {
    rect(ctx, X + 12 + i * 8, Y + 17 + (i % 3) * 3, 3, 8, i % 2 ? '#22d3ee' : '#f472b6');
  }
  caixa(ctx, X + 6, Y - 6, 24, 16, '#0f172a', OUT, 2); // monitor
  rect(ctx, X + 9, Y - 3, 18, 8, '#4f46e5');
  caixa(ctx, X + W - 30, Y - 6, 24, 16, '#0f172a', OUT, 2);
  rect(ctx, X + W - 27, Y - 3, 18, 8, '#0ea5e9');
  cadeira(ctx, X + W / 2 - 7, Y + 38, '#7e22ce');
}

function bancadaNarradores(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  const W = t(m.w);
  rect(ctx, X + 4, Y + 34, W - 6, 4, SOMBRA);
  caixa(ctx, X + 2, Y + 10, W - 4, 26, '#1e293b', '#facc15', 2);
  rect(ctx, X + 8, Y + 15, W - 16, 14, '#334155');
  [X + 14, X + W - 48].forEach((mx) => {
    caixa(ctx, mx, Y - 4, 34, 18, '#0f172a', OUT, 2);
    rect(ctx, mx + 3, Y - 1, 28, 10, '#0284c7');
    rect(ctx, mx + 8, Y + 14, 4, 6, '#94a3b8'); // microfone
    rect(ctx, mx + 22, Y + 20, 8, 5, '#f472b6'); // headset
  });
  cadeira(ctx, X + 28, Y + 38, '#dc2626');
  cadeira(ctx, X + W - 44, Y + 38, '#2563eb');
}

function mesaTecnica(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  const W = t(m.w);
  const H = t(m.h);
  rect(ctx, X + 3, Y + H - 4, W - 4, 4, SOMBRA);
  caixa(ctx, X, Y + 14, W, H - 18, '#475569', OUT, 2);
  rect(ctx, X + 4, Y + 18, W - 8, H - 26, '#64748b');
  caixa(ctx, X + 8, Y + 24, 40, 26, '#0f172a', OUT, 2); // PC aberto
  rect(ctx, X + 12, Y + 28, 32, 18, '#15803d');
  rect(ctx, X + 16, Y + 32, 6, 6, '#facc15');
  rect(ctx, X + 28, Y + 34, 10, 4, '#94a3b8');
  caixa(ctx, X + 10, Y + 56, 22, 12, '#ef4444', OUT, 2); // caixa de ferramentas
  rect(ctx, X + 14, Y + 54, 14, 3, '#fca5a5');
  caixa(ctx, X + 14, Y - 4, 28, 18, '#0f172a', OUT, 2);
  rect(ctx, X + 17, Y - 1, 22, 10, '#dc2626');
}

// ---------------------------------------------------------------------------
// ARENA, VIP, ESTOQUE, SERVIÇO
// ---------------------------------------------------------------------------
function arquibancada(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  const W = t(m.w);
  const H = t(m.h);
  const tiers = 3;
  const th = Math.floor(H / tiers);
  rect(ctx, X + 2, Y + H, W, 4, SOMBRA);
  for (let i = 0; i < tiers; i++) {
    const ty = Y + i * th;
    // degrau: parte de cima (onde ficam as cadeiras) e a face vertical mais escura
    caixa(ctx, X, ty, W, th, '#334155', OUT, 2);
    rect(ctx, X + 2, ty + 2, W - 4, Math.floor(th * 0.58), tom('#64748b', 0.06 * i));
    const colunas = Math.floor((W - 20) / 13);
    for (let s = 0; s < colunas; s++) {
      if (s === Math.floor(colunas / 2)) continue; // corredor central
      const azul = s < colunas / 2;
      const cor = azul ? '#2563eb' : '#dc2626';
      const sx = X + 10 + s * 13;
      caixa(ctx, sx, ty + 3, 10, Math.floor(th * 0.52), cor, OUT, 1);
      rect(ctx, sx + 2, ty + 5, 6, 3, tom(cor, 0.4));
    }
  }
  rect(ctx, X + Math.floor(W / 2) - 3, Y + 2, 6, H - 4, '#475569'); // escada do corredor central
  rect(ctx, X, Y - 5, W, 3, '#cbd5e1'); // corrimão
  rect(ctx, X, Y - 5, 3, 8, '#94a3b8');
  rect(ctx, X + W - 3, Y - 5, 3, 8, '#94a3b8');
}

function barVip(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  const W = t(m.w);
  caixa(ctx, X + 4, Y, W - 8, 20, '#1e1b2e', '#facc15', 2); // prateleira de garrafas
  for (let i = 0; i < Math.floor((W - 24) / 9); i++) {
    const cores = ['#16a34a', '#dc2626', '#f59e0b', '#a855f7', '#38bdf8'];
    rect(ctx, X + 12 + i * 9, Y + 5, 5, 11, cores[i % cores.length]);
  }
  rect(ctx, X + 6, Y + 40, W - 8, 4, SOMBRA);
  caixa(ctx, X + 2, Y + 22, W - 4, 20, '#3b2d54', '#facc15', 2); // balcão
  rect(ctx, X + 6, Y + 25, W - 12, 6, '#5b4a7e');
  caixa(ctx, X + W - 26, Y + 8, 20, 26, '#e2e8f0', OUT, 2); // frigobar
  rect(ctx, X + W - 22, Y + 12, 12, 8, '#7dd3fc');
  [0, 1, 2].forEach((i) => {
    const sx = X + 12 + i * 28;
    caixa(ctx, sx, Y + 52, 14, 12, '#7e22ce', OUT, 2);
    rect(ctx, sx + 5, Y + 64, 4, 6, '#94a3b8');
  });
}

function palete(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  const W = t(m.w);
  rect(ctx, X + 2, Y + 48, W, 3, SOMBRA);
  caixa(ctx, X, Y + 38, W, 12, '#8c5832', OUT, 2);
  [0, 1].forEach((i) => {
    const bx = X + 4 + i * 29;
    caixa(ctx, bx, Y + 14, 27, 24, '#d99b52', OUT, 2);
    rect(ctx, bx + 11, Y + 14, 5, 24, '#f5d18c');
    caixa(ctx, bx + 2, Y - 8, 23, 22, '#c4863f', OUT, 2);
    rect(ctx, bx + 10, Y - 8, 5, 22, '#f5d18c');
  });
}

function empilhadeira(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  rect(ctx, X + 6, Y + 44, 56, 3, SOMBRA);
  caixa(ctx, X, Y + 2, 6, 40, '#334155', OUT, 2); // mastro
  rect(ctx, X - 2, Y + 36, 16, 4, '#94a3b8'); // garfo
  caixa(ctx, X + 12, Y + 18, 50, 20, '#facc15', OUT, 2);
  rect(ctx, X + 16, Y + 22, 18, 6, '#fde68a');
  caixa(ctx, X + 34, Y + 2, 24, 18, '#fde047', OUT, 2); // cabine
  rect(ctx, X + 38, Y + 5, 16, 8, '#7dd3fc');
  [X + 18, X + 46].forEach((wx) => {
    caixa(ctx, wx, Y + 32, 12, 12, '#1e293b', OUT, 2);
    rect(ctx, wx + 4, Y + 36, 4, 4, '#94a3b8');
  });
  rect(ctx, X + 58, Y + 22, 4, 4, '#ef4444');
}

function lockers(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  const W = t(m.w);
  const n = Math.floor(W / 16);
  rect(ctx, X + 2, Y + 30, W, 2, SOMBRA);
  for (let i = 0; i < n; i++) {
    const cor = i % 2 ? '#1d4ed8' : '#3b82f6';
    caixa(ctx, X + i * 16, Y, 16, 31, cor, OUT, 2);
    rect(ctx, X + i * 16 + 4, Y + 5, 8, 2, tom(cor, -0.4));
    rect(ctx, X + i * 16 + 4, Y + 9, 8, 2, tom(cor, -0.4));
    rect(ctx, X + i * 16 + 11, Y + 17, 2, 4, '#facc15');
  }
}

function bancoEspera(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  const W = t(m.w);
  const H = t(m.h);
  rect(ctx, X + 2, Y + H - 2, W - 2, 3, SOMBRA);
  caixa(ctx, X, Y + 2, W, Math.round(H * 0.45), '#6d4f31', OUT, 2); // encosto
  caixa(ctx, X + 2, Y + Math.round(H * 0.4), W - 4, Math.round(H * 0.4), '#8c5832', OUT, 2); // assento
  rect(ctx, X + 6, Y + H - 6, 4, 6, '#334155');
  rect(ctx, X + W - 10, Y + H - 6, 4, 6, '#334155');
}

// ---------------------------------------------------------------------------
// PEQUENOS
// ---------------------------------------------------------------------------
function revisteiro(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  rect(ctx, X + 2, Y + 42, 26, 3, SOMBRA);
  caixa(ctx, X, Y, 29, 44, '#6d4f31', OUT, 2);
  [0, 1, 2].forEach((r) => {
    ['#f472b6', '#38bdf8', '#facc15'].forEach((c, i) => rect(ctx, X + 4 + i * 8, Y + 4 + r * 13, 6, 10, c));
  });
}

function lixeiraRec(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  rect(ctx, X + 2, Y + 28, 44, 3, SOMBRA);
  ['#2563eb', '#facc15', '#16a34a'].forEach((c, i) => {
    caixa(ctx, X + i * 16, Y + 4, 14, 26, c, OUT, 2);
    rect(ctx, X + i * 16 + 3, Y + 8, 8, 3, 'rgba(255,255,255,0.35)');
  });
}

function totemSenha(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  rect(ctx, X + 2, Y + 48, 26, 3, SOMBRA);
  caixa(ctx, X, Y, 28, 40, '#1e293b', '#38bdf8', 2);
  rect(ctx, X + 4, Y + 5, 20, 14, '#0ea5e9');
  rect(ctx, X + 8, Y + 8, 12, 4, '#f8fafc');
  rect(ctx, X + 6, Y + 24, 16, 6, '#e2e8f0'); // saída de senha
  rect(ctx, X + 10, Y + 40, 8, 8, '#475569');
}

function plantaGrande(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  rect(ctx, X + 4, Y + 44, 26, 3, SOMBRA);
  caixa(ctx, X + 6, Y + 28, 20, 18, '#b45309', OUT, 2);
  rect(ctx, X + 8, Y + 30, 16, 3, '#fbbf24');
  const folhas: Array<[number, number, number, number, string]> = [
    [8, 8, 10, 22, '#15803d'],
    [14, 0, 10, 24, '#16a34a'],
    [2, 14, 10, 16, '#166534'],
    [20, 12, 10, 18, '#22c55e'],
  ];
  folhas.forEach(([dx, dy, w, h, c]) => caixa(ctx, X + dx, Y + dy, w, h, c, OUT, 2));
}

function banner(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  const cor = m.cor ?? '#dc2626';
  rect(ctx, X + 4, Y + 66, 22, 3, SOMBRA);
  rect(ctx, X + 13, Y, 3, 68, '#94a3b8');
  caixa(ctx, X + 2, Y + 4, 26, 46, cor, OUT, 2);
  rect(ctx, X + 6, Y + 10, 18, 4, '#f8fafc');
  rect(ctx, X + 8, Y + 20, 14, 14, '#facc15');
  rect(ctx, X + 6, Y + 40, 18, 3, tom(cor, 0.4));
  rect(ctx, X + 6, Y + 66, 18, 3, '#475569');
}

function canteiro(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  const W = t(m.w);
  rect(ctx, X + 2, Y + 29, W - 2, 3, SOMBRA);
  caixa(ctx, X, Y + 12, W, 18, '#6b7280', OUT, 2);
  rect(ctx, X + 4, Y + 15, W - 8, 4, '#9ca3af');
  for (let i = 0; i < Math.floor(W / 16); i++) {
    const bx = X + 3 + i * 16;
    caixa(ctx, bx, Y + 2 + (i % 2) * 2, 14, 14, i % 2 ? '#16a34a' : '#22c55e', OUT, 2);
    rect(ctx, bx + 4, Y + 5 + (i % 2) * 2, 3, 3, ['#f472b6', '#facc15', '#f8fafc'][i % 3]);
  }
}

function mesaAlta(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  rect(ctx, X + 4, Y + 40, 30, 3, SOMBRA);
  caixa(ctx, X + 4, Y + 4, 30, 14, '#8c5832', OUT, 2);
  rect(ctx, X + 8, Y + 7, 22, 6, '#c08c58');
  rect(ctx, X + 17, Y + 18, 4, 20, '#475569');
  caixa(ctx, X, Y + 30, 12, 10, '#dc2626', OUT, 2);
  caixa(ctx, X + 26, Y + 30, 12, 10, '#2563eb', OUT, 2);
}

function pufe(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  const cor = m.cor ?? '#7e22ce';
  rect(ctx, X + 2, Y + 22, 28, 3, SOMBRA);
  caixa(ctx, X, Y + 2, 30, 22, cor, OUT, 2);
  rect(ctx, X + 5, Y + 6, 20, 4, tom(cor, 0.4));
}

function caixas(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  rect(ctx, X + 2, Y + 42, 48, 3, SOMBRA);
  caixa(ctx, X, Y + 22, 24, 22, '#d99b52', OUT, 2);
  rect(ctx, X + 9, Y + 22, 5, 22, '#f5d18c');
  caixa(ctx, X + 26, Y + 26, 24, 18, '#c4863f', OUT, 2);
  caixa(ctx, X + 8, Y + 4, 24, 20, '#e2a85f', OUT, 2);
  rect(ctx, X + 17, Y + 4, 5, 20, '#f5d18c');
}

function mesaCentro(ctx: Ctx, m: Movel) {
  const X = t(m.x);
  const Y = t(m.y);
  const W = t(m.w);
  const H = t(m.h);
  rect(ctx, X + 3, Y + H, W - 4, 3, SOMBRA);
  caixa(ctx, X, Y + 2, W, H - 3, '#1e293b', '#38bdf8', 2);
  rect(ctx, X + 5, Y + 6, W - 10, H - 11, '#0f172a');
  rect(ctx, X + 6, Y + 7, W - 12, 4, 'rgba(56, 189, 248, 0.25)');
  // Controles gamer, revista e latinhas sobre a mesinha
  caixa(ctx, X + 12, Y + 10, 14, 9, '#334155', OUT, 1);
  rect(ctx, X + 14, Y + 12, 3, 3, '#22d3ee');
  rect(ctx, X + 21, Y + 12, 3, 3, '#f472b6');
  rect(ctx, X + Math.round(W / 2) - 8, Y + 9, 16, 12, '#f8fafc');
  rect(ctx, X + Math.round(W / 2) - 6, Y + 11, 12, 4, '#ef4444');
  rect(ctx, X + W - 26, Y + 11, 6, 8, '#10b981');
  rect(ctx, X + W - 17, Y + 12, 6, 8, '#f59e0b');
}

const DESENHO: Record<Movel['tipo'], (ctx: Ctx, m: Movel) => void> = {
  MESA_REFEICAO: mesaRefeicao,
  SOFA_H: (c, m) => desenharSofa(c, m, false),
  SOFA_V: (c, m) => desenharSofa(c, m, true),
  ARQUIBANCADA: arquibancada,
  MESA_REUNIAO: mesaReuniao,
  MESA_SOM: mesaSom,
  PALETE: palete,
  // A empilhadeira é desenhada dinamicamente em LanHouseMapRenderer para animar
  EMPILHADEIRA: () => {},
  CANTEIRO: canteiro,
  BAR_VIP: barVip,
  REVISTEIRO: revisteiro,
  BANCO_ESPERA: bancoEspera,
  LIXEIRA_REC: lixeiraRec,
  TOTEM_SENHA: totemSenha,
  PLANTA_GRANDE: plantaGrande,
  BANCADA_NARRADORES: bancadaNarradores,
  BANNER: banner,
  LOCKERS: lockers,
  MESA_TECNICA: mesaTecnica,
  CAIXAS: caixas,
  MESA_ALTA: mesaAlta,
  PUFE: pufe,
  MESA_CENTRO: mesaCentro,
};

/** Sofá em coordenadas de pixel (usado também pelos sofás antigos do renderer principal) */
export function desenharSofaPx(ctx: Ctx, x: number, y: number, w: number, h: number, cor: string, encosto: 'N' | 'S' | 'E' | 'W') {
  desenharSofa(
    ctx,
    { tipo: vertical(w, h) ? 'SOFA_V' : 'SOFA_H', sala: '', x: x / TILE_SIZE, y: y / TILE_SIZE, w: w / TILE_SIZE, h: h / TILE_SIZE, cor, encosto, solido: false },
    vertical(w, h)
  );
}
const vertical = (w: number, h: number) => w < h;

/** Tapetes: chão, desenhados antes dos móveis */
export function desenharChaoMobiliario(f: Ctx) {
  TAPETES.forEach((p) => {
    const x = t(p.x);
    const y = t(p.y);
    const w = t(p.w);
    const h = t(p.h);
    caixa(f, x, y, w, h, p.fundo, p.borda, 2);
    for (let ly = y + 8; ly < y + h - 6; ly += 14) rect(f, x + 6, ly, w - 12, 2, 'rgba(255,255,255,0.06)');
    rect(f, x + 6, y + h - 8, w - 12, 2, p.borda);
  });
}

/** Móveis: cache estático (entram no mapa de profundidade) */
export function desenharMobiliario(m: Ctx) {
  MOBILIARIO.forEach((mv) => DESENHO[mv.tipo](m, mv));
}
