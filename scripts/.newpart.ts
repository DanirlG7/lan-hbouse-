
// ============================================================================
// ADEREÇOS ADICIONAIS (mapa 96x64)
// ============================================================================
const t = (v: number): number => Math.round(v * TILE_SIZE);

export interface VistaMundo {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

function dentroDaVista(v: VistaMundo, x: number, y: number, folga = 80): boolean {
  return x >= v.x1 - folga && x <= v.x2 + folga && y >= v.y1 - folga && y <= v.y2 + folga;
}

function drawPixelExteriorTree(ctx: CanvasRenderingContext2D, x: number, y: number) {
  const rx = snap2(x);
  const ry = snap2(y);
  pxRect(ctx, rx - 16, ry + 10, 32, 8, PX_SHADOW);
  pxBox(ctx, rx - 6, ry - 8, 12, 22, '#7a4829', PX_OUTLINE, 2);
  pxBox(ctx, rx - 20, ry - 30, 40, 22, '#24523b', PX_OUTLINE, 2);
  pxBox(ctx, rx - 16, ry - 40, 32, 16, '#388047', PX_OUTLINE, 2);
  pxRect(ctx, rx - 10, ry - 36, 12, 6, '#63c74d');
}

function drawPixelGamingChair(ctx: CanvasRenderingContext2D, sx: number, sy: number, ehVip: boolean) {
  const rx = snap2(sx);
  const ry = snap2(sy);
  const main = ehVip ? '#7e22ce' : '#2563eb';
  const trim = ehVip ? '#facc15' : '#38bdf8';
  pxRect(ctx, rx - 9, ry + 5, 18, 4, PX_SHADOW);
  pxBox(ctx, rx - 9, ry - 5, 18, 10, main, PX_OUTLINE, 2);
  pxRect(ctx, rx - 5, ry - 3, 2, 6, trim);
  pxRect(ctx, rx + 3, ry - 3, 2, 6, trim);
}

function fillCarpet(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, spec: string) {
  pxRect(ctx, x, y, w, h, base);
  ctx.fillStyle = spec;
  for (let ty = y; ty < y + h; ty += TILE_SIZE) {
    for (let tx = x; tx < x + w; tx += TILE_SIZE) {
      let s = (Math.imul(tx / TILE_SIZE + 1, 73856093) ^ Math.imul(ty / TILE_SIZE + 1, 19349663)) >>> 0;
      for (let i = 0; i < 6; i++) {
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        const ox = (s >>> 8) % 30;
        s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
        const oy = (s >>> 8) % 30;
        ctx.fillRect(tx + ox, ty + oy, 2, 2);
      }
    }
  }
}

function fillConcrete(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, seam: string) {
  pxRect(ctx, x, y, w, h, base);
  for (let ty = y; ty < y + h; ty += TILE_SIZE) {
    for (let tx = x; tx < x + w; tx += TILE_SIZE) {
      pxRect(ctx, tx, ty, Math.min(TILE_SIZE, x + w - tx), 2, seam);
      pxRect(ctx, tx, ty, 2, Math.min(TILE_SIZE, y + h - ty), seam);
    }
  }
}

function drawTallShelf(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h = 56) {
  pxRect(ctx, x + 2, y + h - 2, w, 4, PX_SHADOW);
  pxBox(ctx, x, y, w, h, '#cbd5e1', PX_OUTLINE, 2);
  const rows = 3;
  const rh = Math.floor((h - 8) / rows);
  const cores = ['#d99b52', '#38bdf8', '#f472b6', '#4ade80'];
  for (let r = 0; r < rows; r++) {
    const ry = y + 4 + r * rh;
    pxRect(ctx, x + 4, ry + rh - 2, w - 8, 2, '#64748b');
    for (let bx = x + 4; bx < x + w - 10; bx += 12) {
      pxBox(ctx, bx, ry + 2, 10, rh - 6, cores[Math.floor(bx / 12 + r) % 4], PX_OUTLINE, 2);
    }
  }
}

function drawSofa(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cor: string, encosto = '#1e1b4b') {
  pxRect(ctx, x + 2, y + h - 2, w, 4, PX_SHADOW);
  pxBox(ctx, x, y, w, h, encosto, PX_OUTLINE, 2);
  pxBox(ctx, x + 4, y + 6, w - 8, h - 10, cor, PX_OUTLINE, 2);
  pxRect(ctx, x + 8, y + 8, w - 16, 2, 'rgba(255,255,255,0.18)');
}

function drawRug(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cor: string, borda: string) {
  pxBox(ctx, x, y, w, h, cor, borda, 2);
  pxRect(ctx, x + 8, y + 8, w - 16, 2, borda);
  pxRect(ctx, x + 8, y + h - 10, w - 16, 2, borda);
}

function drawPoster(ctx: CanvasRenderingContext2D, x: number, y: number, c1: string, c2: string) {
  pxBox(ctx, x, y, 28, 36, '#120d26', PX_OUTLINE, 2);
  pxRect(ctx, x + 4, y + 4, 20, 14, c1);
  pxRect(ctx, x + 4, y + 20, 20, 4, c2);
  pxRect(ctx, x + 4, y + 26, 12, 2, '#f8fafc');
}

function drawLedStrip(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, cor: string) {
  pxRect(ctx, x, y, w, 2, cor);
}

function drawBench(ctx: CanvasRenderingContext2D, x: number, y: number, w = 56) {
  pxRect(ctx, x + 2, y + 12, w, 3, PX_SHADOW);
  pxBox(ctx, x, y, w, 10, '#7a4829', PX_OUTLINE, 2);
  pxRect(ctx, x + 4, y + 3, w - 8, 3, '#a8693a');
}

function drawExtinguisher(ctx: CanvasRenderingContext2D, x: number, y: number) {
  pxBox(ctx, x, y, 8, 16, '#dc2626', PX_OUTLINE, 2);
  pxRect(ctx, x + 2, y + 2, 4, 3, '#1e293b');
}

function drawWcStall(ctx: CanvasRenderingContext2D, x: number, y: number) {
  pxBox(ctx, x, y, 56, 76, '#5b6b86', PX_OUTLINE, 2);
  pxRect(ctx, x + 6, y + 8, 44, 4, '#8aa0c0');
  pxBox(ctx, x + 14, y + 30, 28, 40, '#7b8aa8', PX_OUTLINE, 2);
  pxRect(ctx, x + 38, y + 48, 3, 3, '#facc15');
}

function drawSink(ctx: CanvasRenderingContext2D, x: number, y: number) {
  pxRect(ctx, x + 2, y + 18, 56, 3, PX_SHADOW);
  pxBox(ctx, x, y, 56, 16, '#cfd6e6', PX_OUTLINE, 2);
  pxBox(ctx, x + 8, y + 4, 14, 8, '#7dd3fc', PX_OUTLINE, 2);
  pxBox(ctx, x + 34, y + 4, 14, 8, '#7dd3fc', PX_OUTLINE, 2);
  pxBox(ctx, x + 6, y - 22, 44, 18, '#bae6fd', PX_OUTLINE, 2); // espelho
}

function drawFoodTruck(ctx: CanvasRenderingContext2D, x: number, y: number) {
  pxRect(ctx, x + 4, y + 62, 150, 6, 'rgba(0,0,0,0.35)');
  pxBox(ctx, x, y, 150, 60, '#f97316', PX_OUTLINE, 2);
  pxBox(ctx, x + 104, y + 8, 40, 26, '#7dd3fc', PX_OUTLINE, 2);
  pxBox(ctx, x + 10, y + 10, 82, 26, '#1e1b2e', '#facc15', 2);
  pxRect(ctx, x + 14, y + 14, 74, 6, '#facc15');
  pxRect(ctx, x + 14, y + 24, 50, 4, '#f472b6');
  pxBox(ctx, x + 8, y + 38, 90, 8, '#dc2626', PX_OUTLINE, 2);
  [26, 112].forEach((wx) => pxBox(ctx, x + wx, y + 48, 22, 18, '#1e293b', PX_OUTLINE, 2));
}

function drawArcadeCabinet(ctx: CanvasRenderingContext2D, x: number, y: number, cor: string, tick: number, idx: number) {
  pxRect(ctx, x + 2, y + 38, 24, 4, PX_SHADOW);
  pxBox(ctx, x, y, 26, 40, cor, PX_OUTLINE, 2);
  pxRect(ctx, x + 4, y + 5, 18, 12, (tick + idx * 7) % 24 < 12 ? '#38bdf8' : '#f472b6');
  pxRect(ctx, x + 4, y + 22, 18, 3, '#1e1b2e');
  pxRect(ctx, x + 6, y + 27, 3, 3, '#ef4444');
  pxRect(ctx, x + 12, y + 27, 3, 3, '#facc15');
}

function drawRack(ctx: CanvasRenderingContext2D, cx: number, tick: number, idx: number) {
  const x = cx - 18;
  const y = t(5.1);
  pxBox(ctx, x, y, 36, 74, '#334155', PX_OUTLINE, 2);
  for (let b = 0; b < 5; b++) {
    pxBox(ctx, x + 4, y + 4 + b * 13, 28, 9, '#1e293b', PX_OUTLINE, 2);
    const ledOn = (Math.floor(tick / 6) + b * 2 + idx) % 3 !== 0;
    pxRect(ctx, x + 6, y + 7 + b * 13, 4, 3, ledOn ? '#4ade80' : '#0f172a');
    pxRect(ctx, x + 12, y + 7 + b * 13, 4, 3, (b + idx) % 2 === 0 ? '#38bdf8' : '#0f172a');
  }
}

// Posições das fliperamas (sempre animadas) e dos adereços evolutivos por nível
const ARCADES: Array<{ x: number; y: number; cor: string; nivelMin?: number }> = [
  // Lounge (sul)
  { x: 5.6, y: 48.4, cor: '#6d28d9' },
  { x: 8.2, y: 48.4, cor: '#1d4ed8' },
  { x: 14.8, y: 48.4, cor: '#be185d' },
  { x: 17.2, y: 48.4, cor: '#0e7490' },
  // Arena (consoles)
  { x: 65.2, y: 34.2, cor: '#6d28d9' },
  { x: 67.6, y: 34.2, cor: '#1d4ed8' },
  { x: 70, y: 34.2, cor: '#be185d' },
  // Extras liberados com a melhoria "Lounge de Consoles"
  { x: 75.2, y: 34.2, cor: '#0e7490', nivelMin: 2 },
  { x: 65.2, y: 49.4, cor: '#9d174d', nivelMin: 3 },
];

const AC_POS = [
  { x: 30, y: 15.25 },
  { x: 70, y: 15.25 },
  { x: 52, y: 15.25 },
  { x: 8, y: 15.25 },
  { x: 44, y: 46.1 },
];
const CFTV_POS = [
  { x: 21, y: 16 },
  { x: 59, y: 16 },
  { x: 21, y: 44 },
  { x: 59, y: 44 },
];

// ============================================================================
// CACHES ESTÁTICOS (chão / móveis / paredes) — pré-renderizados uma única vez
// ============================================================================
let cacheChao: HTMLCanvasElement | null = null;
let cacheMoveis: HTMLCanvasElement | null = null;
let cacheParedes: HTMLCanvasElement | null = null;
const CACHE_VERSION = 70;
let versaoConstruida = 0;

function novoCanvas(): { c: HTMLCanvasElement; x: CanvasRenderingContext2D } {
  const c = document.createElement('canvas');
  c.width = WORLD_W;
  c.height = WORLD_H;
  const x = c.getContext('2d')!;
  x.imageSmoothingEnabled = false;
  return { c, x };
}

const PALETAS: Record<string, string[]> = {
  estudio: ['#322b4a', '#413860', '#51477a'],
  adm: ['#2c2a4a', '#3a3760'],
  noc: ['#262d4d', '#333c66', '#414b80'],
  estoque: ['#3a3846', '#4a4760'],
  wc_cliente: ['#3d4a63', '#4d5c7a', '#5d6d8c'],
  wc_func: ['#3d4a63', '#4d5c7a', '#5d6d8c'],
  servico: ['#33303f', '#403c52'],
  bomboniere: ['#613b4a', '#7a4a4c'],
  lounge: ['#4a2b2f', '#6b3f3a', '#7c4a40', '#8e5848'],
  salao: ['#3d2a48', '#563a5c'],
  corredor: ['#2f2b45', '#3b3658'],
  vip: ['#201c33', '#34304a'],
  arena: ['#2d2b47', '#3d3a5e', '#4d4a74'],
  recepcao: ['#5e3530', '#83503f', '#95604b', '#a77058'],
  expansao: ['#2b2838', '#363248'],
};

function pisoDaSala(f: CanvasRenderingContext2D, s: Sala) {
  const p = PALETAS[s.id] ?? ['#333', '#444', '#555', '#666'];
  const x = t(s.x);
  const y = t(s.y);
  const w = t(s.w);
  const h = t(s.h);
  switch (s.piso) {
    case 'AZULEJO':
      if (s.id === 'bomboniere') {
        pxRect(f, x, y, w, h, '#3a2a40');
        for (let ty = y; ty < y + h; ty += TILE_SIZE) {
          for (let tx = x; tx < x + w; tx += TILE_SIZE) {
            const alt = ((tx - x) / TILE_SIZE + (ty - y) / TILE_SIZE) % 2 === 0;
            pxRect(f, tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4, alt ? p[1] : p[0]);
          }
        }
      } else {
        fillCeramicTiles32x32(f, x, y, w, h, p[0], p[1], p[2] ?? p[1]);
      }
      break;
    case 'MADEIRA':
      fillWoodTiles32x32(f, x, y, w, h, p[0], p[1], p[2] ?? p[1], p[3] ?? p[1]);
      break;
    case 'CARPETE':
      fillCarpet(f, x, y, w, h, p[0], p[1]);
      break;
    default:
      fillConcrete(f, x, y, w, h, p[0], p[1]);
  }
}

function construirChao() {
  const { c, x: f } = novoCanvas();

  // Quintal em xadrez
  pxRect(f, 0, 0, WORLD_W, WORLD_H, '#1c3a31');
  for (let ty = 0; ty < WORLD_H / TILE_SIZE; ty++) {
    for (let tx = 0; tx < WORLD_W / TILE_SIZE; tx++) {
      if ((tx + ty) % 2 === 0) pxRect(f, tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE, '#234537');
    }
  }

  // Calçada (y 52..56) e rua (y 56..64)
  fillCeramicTiles32x32(f, 0, t(52), WORLD_W, t(4), '#2f2945', '#443d63', '#544c78');
  pxRect(f, 0, t(56), WORLD_W, 4, '#64748b');
  pxRect(f, 0, t(56) + 4, WORLD_W, t(8) - 4, '#1a1829');
  for (let rx = 32; rx < WORLD_W; rx += 96) {
    if (rx > t(36) && rx < t(44)) continue;
    pxRect(f, rx, t(60), 48, 4, '#facc15');
  }
  for (let cy = t(56) + 10; cy < t(64) - 10; cy += 22) {
    pxBox(f, t(38.2), cy, t(3.6), 10, '#f1f5f9', PX_OUTLINE, 2);
  }

  // Sombra do complexo
  pxRect(f, t(4) - 6, t(4) - 6, t(80) + 12, t(48) + 12, 'rgba(20, 14, 28, 0.35)');

  SALAS.forEach((s) => pisoDaSala(f, s));

  // Passadeiras neon
  pxBox(f, t(39), t(15.3), t(2), t(29.4), '#2a2640', '#38bdf8', 2); // espinha do salão
  pxBox(f, t(60.7), t(15.3), t(1.6), t(36.4), '#2a2640', '#38bdf8', 2); // corredor leste
  pxBox(f, t(38.5), t(45.3), t(3), t(6.6), '#7a2f45', '#e09f87', 2); // recepção
  pxBox(f, t(5), t(13.4), t(78), 4, '#facc15', '#facc15', 2); // faixa amarela de serviço

  // Tapete do lounge e palco e-sports
  drawRug(f, t(8), t(38.4), t(8), t(4.4), '#4c1d5c', '#f472b6');
  pxBox(f, t(75.4), t(36.6), t(8.2), t(9.6), '#1e1b4b', '#facc15', 2);
  pxRect(f, t(75.4) + 6, t(36.6) + 6, t(8.2) - 12, t(9.6) - 12, '#312e81');

  // Zona de expansão (obras)
  const ex = t(84);
  const ey = t(4);
  for (let i = 0; i < t(10); i += 24) {
    pxRect(f, ex + i, ey, 12, 6, '#facc15');
    pxRect(f, ex + i, t(52) - 6, 12, 6, '#facc15');
  }
  for (let i = 0; i < t(48); i += 24) {
    pxRect(f, ex + t(10) - 6, ey + i, 6, 12, '#facc15');
  }

  // Tapetes de soleira nas portas
  PORTAS.forEach((p) => {
    const larg = t(p.largura);
    if (p.orientacao === 'H') {
      pxBox(f, t(p.x) - larg / 2, t(p.y) - 8, larg, 16, '#334155', '#38bdf8', 2);
    } else {
      pxBox(f, t(p.x) - 8, t(p.y) - larg / 2, 16, larg, '#334155', '#38bdf8', 2);
    }
  });

  cacheChao = c;
}

function construirMoveis() {
  const { c, x: m } = novoCanvas();

  // ---------------- EXTERIOR ----------------
  for (let bx = 24; bx < WORLD_W - 24; bx += 52) drawLushBush(m, bx, t(2.4), bx / 52);
  for (let by = t(5); by < t(51); by += 70) {
    drawLushBush(m, 24, by, by / 70);
    drawLushBush(m, WORLD_W - 28, by, by / 70 + 1);
  }
  [10, 30, 56, 80, 92].forEach((tx, i) => drawPixelExteriorTree(m, t(tx), t(2.6 + (i % 2) * 0.6)));
  [8, 24, 48, 64, 86].forEach((tx) => drawStreetLamp(m, t(tx), t(55.4)));
  drawBench(m, t(22) - 28, t(52.6));
  drawBench(m, t(56) - 28, t(52.6));
  drawCleanPlant(m, t(37.4), t(53.2));
  drawCleanPlant(m, t(42.6), t(53.2));
  drawFoodTruck(m, t(67), t(56.5));
  drawNeonSign(m, t(40), t(52.15), 160, 'LAN HOUSE', '#c084fc', 'bold 13px "Chakra Petch", monospace');

  // ---------------- ESTÚDIO LIVE (x4..20,y4..12) ----------------
  pxBox(m, t(5), t(5), t(14), t(3.4), '#6a5f8a', PX_OUTLINE, 2);
  pxBox(m, t(8), t(4.3), t(8), t(0.9), '#334155', PX_OUTLINE, 2);
  pxRect(m, t(8) + 6, t(4.3) + 6, t(8) - 12, t(0.9) - 12, '#38bdf8');
  pxBox(m, t(9.5), t(5.6), t(5), t(1.1), '#cfd6e6', PX_OUTLINE, 2);
  pxRect(m, t(9.5) + 4, t(5.6) + 4, t(5) - 8, 8, '#f8fafc');
  pxRect(m, t(10.2), t(6.3), t(3.6), 4, '#38bdf8');
  [5.6, 18.4].forEach((lx) => {
    pxBox(m, t(lx) - 6, t(9) - 20, 12, 30, '#475569', PX_OUTLINE, 2);
    pxBox(m, t(lx) - 10, t(9) - 30, 20, 12, '#fde68a', PX_OUTLINE, 2);
  });
  drawSofa(m, t(5.5), t(8.8), t(5), t(1), '#7c3aed');
  drawCleanPlant(m, t(18.4), t(10.8));
  drawCleanPlant(m, t(5.4), t(10.9));

  // ---------------- ADMINISTRAÇÃO (x20..36) ----------------
  pxBox(m, t(26), t(5.2), t(5), t(1.5), '#8c5832', PX_OUTLINE, 2);
  pxRect(m, t(26) + 4, t(5.2) + 4, t(5) - 8, 12, '#b87a4b');
  pxBox(m, t(27.4), t(4.6), 32, 18, '#475569', PX_OUTLINE, 2);
  pxRect(m, t(27.4) + 4, t(4.6) + 4, 24, 10, '#38bdf8');
  drawCleanChair(m, t(28.5), t(7.3), 'BLUE');
  drawTallShelf(m, t(21), t(4.4), t(3.4), 50);
  drawTallShelf(m, t(24.6), t(4.4), t(1.2), 50);
  pxBox(m, t(32), t(4.4), t(3), t(1.4), '#f8fafc', PX_OUTLINE, 2);
  pxRect(m, t(32) + 6, t(4.4) + 8, t(3) - 12, 3, '#ef4444');
  pxRect(m, t(32) + 6, t(4.4) + 16, t(3) - 20, 3, '#22c55e');
  drawCleanChair(m, t(22), t(10.4), 'RED');
  drawCleanChair(m, t(24), t(10.4), 'BLUE');
  drawCleanPlant(m, t(34.6), t(10.8));

  // ---------------- NOC (x36..52): racks são dinâmicos ----------------
  pxBox(m, t(48.2), t(5.4), t(3.4), t(1.5), '#cfd6e0', PX_OUTLINE, 2);
  pxBox(m, t(48.8), t(5.6), 40, 18, '#15803d', PX_OUTLINE, 2);
  for (let i = 0; i < 5; i++) {
    pxRect(m, t(37.5 + i * 2), t(7.55), 3, 26, i % 2 === 0 ? '#38bdf8' : '#a855f7'); // cabos
  }
  pxRect(m, t(37.5), t(7.55) + 26, t(8.2), 3, '#475569');

  // ---------------- ESTOQUE (x52..68) ----------------
  drawTallShelf(m, t(53), t(4.4), t(5), 62);
  drawTallShelf(m, t(62), t(4.4), t(5.4), 62);
  pxBox(m, t(53.2), t(8), 34, 28, '#d99b52', PX_OUTLINE, 2);
  pxBox(m, t(54.4), t(8.5), 30, 24, '#c4863f', PX_OUTLINE, 2);
  pxBox(m, t(63), t(8.1), t(4), 14, '#8c5832', PX_OUTLINE, 2); // palete
  pxBox(m, t(63.2), t(8.1) - 22, 30, 22, '#d99b52', PX_OUTLINE, 2);

  // ---------------- BANHEIROS ----------------
  drawWcStall(m, t(68.7), t(4.4));
  drawWcStall(m, t(73.3), t(4.4));
  drawSink(m, t(69), t(10.6));
  drawSink(m, t(73.2), t(10.6));
  drawWcStall(m, t(76.7), t(4.4));
  drawWcStall(m, t(81.3), t(4.4));
  drawSink(m, t(77), t(10.6));
  drawSink(m, t(81.2), t(10.6));

  // ---------------- CORREDOR DE SERVIÇO ----------------
  drawExtinguisher(m, t(5.5), t(12.2));
  drawExtinguisher(m, t(82.4), t(12.2));
  [18, 34, 52, 66, 76].forEach((px) => drawCleanPlant(m, t(px), t(14.3)));
  for (let i = 0; i < 18; i++) {
    pxRect(m, t(6) + i * 54, t(14.5) + (i % 2) * 4, 36, 2, i % 3 === 0 ? '#a855f7' : '#22d3ee');
  }

  // ---------------- BOMBONIERE (x4..20,y15..31) ----------------
  drawCleanVendingMachine(m, t(5.2), t(15.35));
  drawCleanVendingMachine(m, t(6.9), t(15.35));
  drawTallShelf(m, t(9), t(15.4), t(2.2), 44);
  drawRamenAndMicrowaveStation(m, t(14.2), t(16.3));
  [[5.4, 22.4], [15, 22.4], [10.6, 27.4]].forEach(([tx, ty]) => {
    drawCleanChair(m, t(tx) + 6, t(ty) - 10, 'RED');
    drawCleanChair(m, t(tx) + 84, t(ty) - 10, 'BLUE');
    pxBox(m, t(tx), t(ty), t(3), t(1.5), '#57534e', PX_OUTLINE, 2);
    pxRect(m, t(tx) + 4, t(ty) + 4, t(3) - 8, t(1.5) - 8, '#78716c');
    pxBox(m, t(tx) + 30, t(ty) + 14, 8, 10, '#ef4444', PX_OUTLINE, 2);
  });
  drawCleanPlant(m, t(5), t(29.6));
  drawCleanPlant(m, t(19), t(29.6));

  // ---------------- LOUNGE (x4..20,y31..52) ----------------
  drawCleanVendingMachine(m, t(5.2), t(31.7));
  drawSofa(m, t(5), t(36.6), t(4), t(1.4), '#0e7490');
  drawSofa(m, t(15), t(36.6), t(4), t(1.4), '#be185d');
  pxBox(m, t(10.4), t(43.2), t(3.2), t(1.3), '#8c5832', PX_OUTLINE, 2);
  drawCleanPlant(m, t(5.2), t(44.6));
  drawCleanPlant(m, t(18.8), t(44.6));
  drawNeonSign(m, t(12), t(50.6), 100, 'LOUNGE', '#2dd4bf', 'bold 10px "Chakra Petch", monospace');

  // ---------------- SALÃO GAMER (x20..60,y15..45) ----------------
  [[22, 'f472b6'], [26, '38bdf8'], [30, 'facc15'], [34, 'a855f7']].forEach(([px, cor], i) => {
    drawPoster(m, t(px as number), t(15.3), i % 2 === 0 ? '#' + cor : '#1e293b', '#' + cor);
  });
  [46, 50, 54].forEach((px, i) => drawPoster(m, t(px), t(15.3), i % 2 ? '#22d3ee' : '#f43f5e', '#facc15'));
  drawLedStrip(m, t(21), t(16.7), t(18), '#22d3ee');
  drawLedStrip(m, t(41.2), t(16.7), t(18), '#f472b6');
  [[21.3, 16.8], [58.7, 16.8], [21.3, 43.6], [58.7, 43.6]].forEach(([px, py]) => drawCleanPlant(m, t(px), t(py)));
  drawCleanVendingMachine(m, t(55.6), t(15.5));
  // zona de máquinas no canto sudeste
  pxBox(m, t(44.4), t(38.6), 30, 44, '#7e22ce', PX_OUTLINE, 2);
  pxRect(m, t(44.4) + 4, t(38.6) + 6, 22, 14, '#fde047');
  pxBox(m, t(47), t(38.6), 30, 44, '#0e7490', PX_OUTLINE, 2);
  pxRect(m, t(47) + 4, t(38.6) + 6, 22, 14, '#fbcfe8');
  drawCleanVendingMachine(m, t(52), t(38.4));
  drawBench(m, t(24), t(41.6), 96);
  drawBench(m, t(32), t(41.6), 96);
  drawNeonSign(m, t(32), t(15.15), 150, 'GAMING ARENA', '#22d3ee', 'bold 11px "Chakra Petch", monospace');

  // ---------------- CORREDOR LESTE (x60..63) ----------------
  drawExtinguisher(m, t(60.2), t(16));
  drawCleanPlant(m, t(61.5), t(43.8));
  drawCleanPlant(m, t(61.5), t(31.6));
  drawBench(m, t(60.5), t(24), 40);

  // ---------------- RECEPÇÃO (x20..60,y45..52) ----------------
  pxRect(m, t(22) + 2, t(48.4), t(15), 4, PX_SHADOW);
  pxBox(m, t(22), t(47), t(15), t(1.4), '#c88a4b', PX_OUTLINE, 2);
  pxRect(m, t(22) + 4, t(47) + 4, t(15) - 8, 14, '#e8c482');
  [25, 29.5, 34].forEach((mx) => {
    pxBox(m, t(mx), t(46.5), 26, 18, '#475569', PX_OUTLINE, 2);
    pxRect(m, t(mx) + 4, t(46.5) + 4, 18, 10, '#38bdf8');
  });
  pxBox(m, t(22), t(46), t(0.8), t(2.6), '#e0b878', PX_OUTLINE, 2);
  drawPixSelfServiceKiosk(m, t(50), t(47.6));
  drawCleanVendingMachine(m, t(52.6), t(45.6));
  drawCleanVendingMachine(m, t(54.6), t(45.6));
  [26.5, 30, 33.5].forEach((px) => {
    pxBox(m, t(px), t(49.1), 6, 22, '#facc15', PX_OUTLINE, 2);
  });
  pxRect(m, t(26.5) + 6, t(49.1) + 8, t(3.5) - 6, 3, '#ef4444');
  pxRect(m, t(30) + 6, t(49.1) + 8, t(3.5) - 6, 3, '#ef4444');
  drawCleanPlant(m, t(21.6), t(50.8));
  drawCleanPlant(m, t(58.6), t(50.8));
  drawNeonSign(m, t(32), t(45.35), 120, 'CAIXA PIX', '#38bdf8', 'bold 10px "Chakra Petch", monospace');

  // ---------------- VIP (x63..84,y15..33) ----------------
  drawNeonSign(m, t(73), t(15.25), 190, 'GAME ON VIP', '#e879f9', 'bold 14px "Chakra Petch", monospace');
  drawPoster(m, t(65), t(15.3), '#a855f7', '#facc15');
  drawPoster(m, t(79.6), t(15.3), '#f43f5e', '#22d3ee');
  drawSofa(m, t(82.3), t(22.6), t(1.5), t(3.8), '#7e22ce');
  pxBox(m, t(81.5), t(24), 14, 30, '#3b2d54', '#facc15', 2);
  drawCleanPlant(m, t(64.8), t(31.4));
  drawCleanPlant(m, t(82.7), t(31.4));
  drawCleanVendingMachine(m, t(64.1), t(29.4));
  drawLedStrip(m, t(64.2), t(16.9), t(19.5), '#c084fc');

  // ---------------- ARENA: CONSOLES & E-SPORTS (x63..84,y33..52) ----------------
  pxBox(m, t(77), t(33.7), t(6.6), t(1.8), '#1e293b', PX_OUTLINE, 2);
  pxRect(m, t(77) + 6, t(33.7) + 6, t(6.6) - 12, t(1.8) - 12, '#0284c7');
  pxBox(m, t(79.2), t(34.1), 40, 14, '#facc15', PX_OUTLINE, 2);
  pxBox(m, t(76.2), t(38.2), t(3.6), t(1.2), '#2563eb', PX_OUTLINE, 2);
  pxBox(m, t(80.2), t(38.2), t(3.6), t(1.2), '#dc2626', PX_OUTLINE, 2);
  pxBox(m, t(76.2), t(43.3), t(3.6), t(1.2), '#2563eb', PX_OUTLINE, 2);
  pxBox(m, t(80.2), t(43.3), t(3.6), t(1.2), '#dc2626', PX_OUTLINE, 2);
  pxBox(m, t(82.6), t(40.3), 20, 28, '#facc15', PX_OUTLINE, 2); // troféu
  pxBox(m, t(65.4), t(50.1), t(6.6), t(1.3), '#334155', PX_OUTLINE, 2); // TV 85"
  pxRect(m, t(65.4) + 6, t(50.1) + 6, t(6.6) - 12, t(1.3) - 12, '#2563eb');
  drawSofa(m, t(64.8), t(47.7), t(6), t(1.3), '#475569');
  [66.5, 69, 71.5].forEach((px, i) => drawCleanChair(m, t(px), t(43.8), i % 2 === 0 ? 'BLUE' : 'RED'));
  drawCleanPlant(m, t(83), t(50.6));
  drawNeonSign(m, t(74), t(33.15), 170, 'E-SPORTS ARENA', '#facc15', 'bold 11px "Chakra Petch", monospace');

  // ---------------- ZONA DE EXPANSÃO ----------------
  pxBox(m, t(85), t(24), t(8), t(4), '#1e1b2e', '#facc15', 2);
  m.font = 'bold 14px "Chakra Petch", monospace';
  m.textAlign = 'center';
  m.fillStyle = '#facc15';
  m.fillText('EM BREVE', t(89), t(25.5));
  m.font = 'bold 10px "Chakra Petch", monospace';
  m.fillStyle = '#f8fafc';
  m.fillText('ZONA DE EXPANSÃO', t(89), t(26.9));
  m.textAlign = 'start';
  [[86, 31], [92, 31], [86, 20], [92, 20]].forEach(([px, py]) => {
    pxBox(m, t(px), t(py), 14, 22, '#f97316', PX_OUTLINE, 2);
    pxRect(m, t(px) + 2, t(py) + 8, 10, 4, '#f8fafc');
  });

  cacheMoveis = c;
}

function construirParedes() {
  const { c, x: w } = novoCanvas();

  const eixoX = (cel: number) => cel * (TILE_SIZE / 2);
  const ehPerimetro = (o: 'H' | 'V', linha: number) => {
    const tl = linha / 2;
    return o === 'H' ? tl === 4 || tl === 52 : tl === 4 || tl === 84;
  };
  const ehVidro = (o: 'H' | 'V', linha: number, ini: number, fim: number) => {
    const tl = linha / 2;
    const centro = (ini + fim) / 4;
    return PAREDES_VIDRO.some((v) =>
      o === 'H'
        ? v.y1 === tl && v.y2 === tl && centro >= v.x1 && centro <= v.x2
        : v.x1 === tl && v.x2 === tl && centro >= v.y1 && centro <= v.y2
    );
  };

  segmentosDeParede().forEach((seg) => {
    const perim = ehPerimetro(seg.orientacao, seg.linha);
    const vidro = !perim && ehVidro(seg.orientacao, seg.linha, seg.ini, seg.fim);
    const esp = perim ? 8 : vidro ? 4 : 6;
    const cor = vidro ? PX_GLASS_WALL : PX_WALL_SLIM;
    if (seg.orientacao === 'H') {
      const y = eixoX(seg.linha);
      const x1 = eixoX(seg.ini) - esp / 2;
      const ww = eixoX(seg.fim) - eixoX(seg.ini) + esp;
      pxRect(w, x1, y + esp / 2, ww, 3, PX_SHADOW);
      pxBox(w, x1, y - esp / 2, ww, esp, cor, PX_OUTLINE, 1.5);
    } else {
      const x = eixoX(seg.linha);
      const y1 = eixoX(seg.ini);
      const hh = eixoX(seg.fim) - eixoX(seg.ini);
      pxRect(w, x + esp / 2, y1, 3, hh, PX_SHADOW);
      pxBox(w, x - esp / 2, y1, esp, hh, cor, PX_OUTLINE, 1.5);
    }
  });

  // Placas de identificação dos cômodos (alinhadas à esquerda, longe das portas)
  w.font = 'bold 7px "Chakra Petch", monospace';
  w.textAlign = 'start';
  SALAS.forEach((s) => {
    if (s.tipo === 'EXPANSAO' || s.tipo === 'CORREDOR') return;
    const largTxt = snap2(w.measureText(s.nome).width + 12);
    const px = t(s.x) + 10;
    const py = t(s.y) + 8;
    pxBox(w, px, py, largTxt, 12, 'rgba(18, 13, 38, 0.85)', PX_OUTLINE, 1.5);
    pxRect(w, px + 2, py + 2, largTxt - 4, 1.5, s.cor);
    w.fillStyle = '#f8fafc';
    w.fillText(s.nome, px + 6, py + 9);
  });

  cacheParedes = c;
}

function garantirCaches() {
  if (cacheChao && cacheMoveis && cacheParedes && versaoConstruida === CACHE_VERSION) return;
  construirChao();
  construirMoveis();
  construirParedes();
  versaoConstruida = CACHE_VERSION;
}

function desenharCache(ctx: CanvasRenderingContext2D, cache: HTMLCanvasElement | null, v: VistaMundo) {
  if (!cache) return;
  const sx = Math.max(0, Math.floor(v.x1));
  const sy = Math.max(0, Math.floor(v.y1));
  const ex = Math.min(WORLD_W, Math.ceil(v.x2));
  const ey = Math.min(WORLD_H, Math.ceil(v.y2));
  if (ex <= sx || ey <= sy) return;
  ctx.drawImage(cache, sx, sy, ex - sx, ey - sy, sx, sy, ex - sx, ey - sy);
}

// ============================================================================
// CAMADAS PÚBLICAS DE RENDER
// ============================================================================

/** Camada 1+2: chão e móveis estáticos (com culling pela vista da câmera) */
export function renderChaoEMoveis(ctx: CanvasRenderingContext2D, vista: VistaMundo) {
  garantirCaches();
  ctx.imageSmoothingEnabled = false;
  desenharCache(ctx, cacheChao, vista);
  desenharCache(ctx, cacheMoveis, vista);
}

export function renderGrade(ctx: CanvasRenderingContext2D, vista: VistaMundo) {
  ctx.save();
  ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
  ctx.lineWidth = 1;
  const x0 = Math.max(0, Math.floor(vista.x1 / TILE_SIZE) * TILE_SIZE);
  const y0 = Math.max(0, Math.floor(vista.y1 / TILE_SIZE) * TILE_SIZE);
  ctx.beginPath();
  for (let gx = x0; gx <= Math.min(WORLD_W, vista.x2); gx += TILE_SIZE) {
    ctx.moveTo(gx, y0);
    ctx.lineTo(gx, Math.min(WORLD_H, vista.y2));
  }
  for (let gy = y0; gy <= Math.min(WORLD_H, vista.y2); gy += TILE_SIZE) {
    ctx.moveTo(x0, gy);
    ctx.lineTo(Math.min(WORLD_W, vista.x2), gy);
  }
  ctx.stroke();
  ctx.restore();
}

/** Camada 3: PCs animados, racks, fliperamas e melhorias evolutivas */
export function renderPcsEMelhorias(
  ctx: CanvasRenderingContext2D,
  computadores: Computador[],
  hoveredPc: number | null,
  tick: number,
  melhorias: MelhoriaEstabelecimento[],
  vista: VistaMundo
) {
  ctx.imageSmoothingEnabled = false;
  const nPcs = nivelMelhoria(melhorias, 'eq_pcs');
  const nMon = nivelMelhoria(melhorias, 'eq_monitor');

  // Racks do NOC
  [38.4, 40, 41.6, 44.5, 46.1].forEach((rx, i) => {
    if (dentroDaVista(vista, t(rx), t(6))) drawRack(ctx, t(rx), tick, i);
  });

  // Fliperamas
  const nCon = nivelMelhoria(melhorias, 'eq_console');
  ARCADES.forEach((a, i) => {
    if (a.nivelMin && nCon < a.nivelMin) return;
    if (dentroDaVista(vista, t(a.x), t(a.y))) drawArcadeCabinet(ctx, t(a.x), t(a.y), a.cor, tick, i);
  });

  // PCs
  computadores.slice(0, 24).forEach((pc) => {
    const seatNode = WAYPOINT_NODES[nodoAssentoDoPc(pc.numero)];
    if (!seatNode) return;
    if (!dentroDaVista(vista, seatNode.x, seatNode.y)) return;

    const sx = snap2(seatNode.x);
    const sy = snap2(seatNode.y);
    const mx = sx;
    const my = sy - 22;
    const ehVip = pc.area === 'VIP';
    const isHovered = hoveredPc === pc.numero;

    drawPcStation(ctx, mx, my, tick, pc, nPcs, nMon);
    drawPixelGamingChair(ctx, sx, sy, ehVip);

    const badgeBorder =
      pc.status === 'MANUTENCAO' ? '#fb923c' : pc.status === 'OCUPADO' ? (ehVip ? '#c084fc' : '#38bdf8') : '#4ade80';

    if (isHovered) {
      pxBox(ctx, mx - 22, my - 22, 48, 50, 'rgba(250, 204, 21, 0.16)', '#facc15', 2);
    }

    pxBox(ctx, mx - 16, my - 24, 32, 9, '#1e1b2e', badgeBorder, 1.5);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 6px "Chakra Petch", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(pc.identificacao, mx, my - 17.5);
    ctx.textAlign = 'start';
  });

  // ==== Melhorias do estabelecimento (níveis 1..5) ====
  const nAr = nivelMelhoria(melhorias, 'inf_ar');
  const nSeg = nivelMelhoria(melhorias, 'inf_seguranca');
  const nEle = nivelMelhoria(melhorias, 'inf_eletrica');
  const nPrint = nivelMelhoria(melhorias, 'eq_print');

  AC_POS.slice(0, nAr).forEach((a, i) => {
    const ax = t(a.x);
    const ay = t(a.y);
    if (!dentroDaVista(vista, ax, ay)) return;
    pxBox(ctx, ax - 14, ay, 28, 10, '#e2e8f0', PX_OUTLINE, 2);
    pxRect(ctx, ax - 10, ay + 6, 20, 2, '#38bdf8');
    for (let p = 0; p < 3; p++) {
      const py = ay + 12 + ((tick * 0.6 + p * 9 + i * 5) % 22);
      pxRect(ctx, ax - 8 + p * 8, py, 2, 2, 'rgba(186, 230, 253, 0.8)');
    }
  });

  CFTV_POS.slice(0, nSeg).forEach((cam, i) => {
    const cx = t(cam.x);
    const cy = t(cam.y);
    if (!dentroDaVista(vista, cx, cy)) return;
    pxBox(ctx, cx - 4, cy - 4, 10, 8, '#1e293b', PX_OUTLINE, 2);
    pxRect(ctx, cx - 6, cy - 2, 4, 4, '#475569');
    pxRect(ctx, cx + 2, cy - 2, 2, 2, (Math.floor(tick / 15) + i) % 2 === 0 ? '#ef4444' : '#14532d');
  });

  if (nEle > 0 && dentroDaVista(vista, t(37), t(6))) {
    pxBox(ctx, t(36.5), t(5.3), 22, 44, '#334155', PX_OUTLINE, 2);
    for (let l = 0; l < 5; l++) {
      pxRect(ctx, t(36.5) + 6, t(5.3) + 6 + l * 7, 10, 3, l < nEle ? '#facc15' : '#0f172a');
    }
  }

  if (nPrint > 0 && dentroDaVista(vista, t(45), t(46.5))) {
    const px0 = t(43.6);
    const py0 = t(45.7);
    pxRect(ctx, px0, py0 + 26, 34, 4, PX_SHADOW);
    pxBox(ctx, px0, py0, 32, 22, '#e2e8f0', PX_OUTLINE, 2);
    pxRect(ctx, px0 + 4, py0 + 4, 24, 6, '#94a3b8');
    pxRect(ctx, px0 + 8, py0 + 16, 16, 4, '#cbd5e1');
    if (Math.floor(tick / 30) % 2 === 0) pxRect(ctx, px0 + 10, py0 + 22 + (tick % 30 > 15 ? 4 : 2), 12, 6, '#ffffff');
    if (nPrint >= 2) {
      pxBox(ctx, px0 + 36, py0 - 4, 26, 26, '#cbd5e1', PX_OUTLINE, 2);
      pxRect(ctx, px0 + 40, py0, 18, 4, '#38bdf8');
    }
    if (nPrint >= 3) {
      pxRect(ctx, px0 + 2, py0 + 12, 4, 4, tick % 20 < 10 ? '#4ade80' : '#14532d');
      pxBox(ctx, px0 - 20, py0 + 4, 16, 18, '#475569', PX_OUTLINE, 2);
    }
  }

  // Moldura neon do lounge de consoles
  if (nCon > 0) {
    const neon = RGB_CICLO[Math.floor(tick / 20) % RGB_CICLO.length];
    pxRect(ctx, t(64), t(33.5), t(19.5), 2, neon);
    pxRect(ctx, t(64), t(51.6), t(19.5), 2, neon);
    if (nCon >= 4 && dentroDaVista(vista, t(82), t(47))) {
      pxBox(ctx, t(81.6), t(46.6), 22, 26, '#1e1b4b', '#a855f7', 2);
      pxRect(ctx, t(81.6) + 4, t(46.6) + 4, 14, 6, neon);
    }
  }
}

/** Camada 5 (primeiro plano): paredes finas + placas dos cômodos */
export function renderParedes(ctx: CanvasRenderingContext2D, vista: VistaMundo) {
  garantirCaches();
  desenharCache(ctx, cacheParedes, vista);
}

/** Camada 6: iluminação neon (tom noturno + brilho de telas, placas e lâmpadas) */
export function renderIluminacao(
  ctx: CanvasRenderingContext2D,
  tick: number,
  computadores: Computador[],
  vista: VistaMundo
) {
  const x1 = Math.max(0, vista.x1);
  const y1 = Math.max(0, vista.y1);
  const x2 = Math.min(WORLD_W, vista.x2);
  const y2 = Math.min(WORLD_H, vista.y2);
  if (x2 <= x1 || y2 <= y1) return;

  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(200, 180, 240, 0.42)';
  ctx.fillRect(x1, y1, x2 - x1, y2 - y1);
  ctx.globalCompositeOperation = 'lighter';

  const glow = (gx: number, gy: number, r: number, cor: string) => {
    if (gx + r < x1 || gx - r > x2 || gy + r < y1 || gy - r > y2) return;
    const g = ctx.createRadialGradient(gx, gy, 2, gx, gy, r);
    g.addColorStop(0, cor);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
  };

  computadores.slice(0, 24).forEach((pc) => {
    if (pc.status !== 'OCUPADO') return;
    const seat = WAYPOINT_NODES[nodoAssentoDoPc(pc.numero)];
    if (!seat) return;
    glow(seat.x, seat.y - 28, 48, pc.area === 'VIP' ? 'rgba(168,85,247,0.30)' : 'rgba(56,189,248,0.26)');
  });

  const pulso = 0.8 + Math.sin(tick * 0.05) * 0.2;
  [8, 24, 48, 64, 86].forEach((lx) => glow(t(lx), t(55.1), 80, `rgba(251,191,36,${0.3 * pulso})`));
  glow(t(40), t(53), 130, `rgba(192,132,252,${0.38 * pulso})`); // LAN HOUSE
  glow(t(73), t(16), 120, `rgba(232,121,249,${0.3 * pulso})`); // GAME ON VIP
  glow(t(32), t(16), 110, `rgba(34,211,238,${0.22 * pulso})`); // GAMING ARENA
  glow(t(74), t(34), 110, `rgba(250,204,21,${0.2 * pulso})`); // E-SPORTS
  glow(t(32), t(46), 100, `rgba(56,189,248,${0.2 * pulso})`); // CAIXA PIX
  glow(t(12), t(51), 70, `rgba(45,212,191,${0.2 * pulso})`); // LOUNGE
  glow(t(12), t(16.5), 80, `rgba(244,114,182,${0.18 * pulso})`); // BOMBONIERE
  glow(t(42), t(6), 100, `rgba(74,222,128,${0.14 * pulso})`); // NOC
  ctx.restore();
}
