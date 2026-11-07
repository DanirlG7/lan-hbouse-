import { Computador, MelhoriaEstabelecimento } from '../domain/types';
import { nodoAssentoDoPc, WAYPOINT_NODES } from '../domain/WaypointGraph';

/**
 * RENDERIZADOR DE MAPA 32x32 SLIM & CLEAN (Estilo Internet Cafe Simulator / Esports Tycoon 2D)
 * - Malha Modular Oficial de 32x32 pixels (40x24 tiles = 1280x768)
 * - Divisórias de parede SLIM & CLEAN (6px com seções de divisória de vidro acústico 4px)
 * - 9 Portas Arquitetônicas 100% alinhadas com o Grafo Ortogonal de IA (WaypointGraph.ts)
 * - Adições inspiradas em Cyber Cafés modernos (Web): Totem Auto-Atendimento PIX/ATM,
 *   Estação Ramen / Cup Noodles & Micro-ondas, Cabines Acústicas VIP, Claw Machine e Palco E-Sports.
 */

export const TILE_SIZE = 32; // Malha oficial 32x32!

export interface PortaArquitetonica {
  id: string;
  orientacao: 'HORIZONTAL' | 'VERTICAL';
  x: number;
  y: number;
  largura: number;
  etiqueta: string;
}

export const PORTAS_ARQUITETONICAS: PortaArquitetonica[] = [
  {
    id: 'porta_principal',
    orientacao: 'HORIZONTAL',
    x: 544,
    y: 584,
    largura: 64,
    etiqueta: 'ENTRADA',
  },
  {
    id: 'porta_escritorio',
    orientacao: 'HORIZONTAL',
    x: 336,
    y: 288,
    largura: 44,
    etiqueta: 'ESTÚDIO',
  },
  {
    id: 'porta_recepcao',
    orientacao: 'HORIZONTAL',
    x: 544,
    y: 288,
    largura: 48,
    etiqueta: 'RECEPÇÃO',
  },
  {
    id: 'porta_sala_tecnica',
    orientacao: 'HORIZONTAL',
    x: 768,
    y: 288,
    largura: 44,
    etiqueta: 'NOC TI',
  },
  {
    id: 'porta_ala_oeste',
    orientacao: 'VERTICAL',
    x: 208,
    y: 368,
    largura: 44,
    etiqueta: 'DECK OESTE',
  },
  {
    id: 'porta_cozinha',
    orientacao: 'VERTICAL',
    x: 864,
    y: 240,
    largura: 40,
    etiqueta: 'CAFÉ',
  },
  {
    id: 'porta_estoque',
    orientacao: 'VERTICAL',
    x: 864,
    y: 368,
    largura: 40,
    etiqueta: 'ESTOQUE',
  },
  {
    id: 'porta_sala_vip',
    orientacao: 'VERTICAL',
    x: 864,
    y: 512,
    largura: 40,
    etiqueta: 'CONSOLES',
  },
  {
    id: 'porta_arena_esports',
    orientacao: 'VERTICAL',
    x: 1040,
    y: 512,
    largura: 44,
    etiqueta: 'E-SPORTS',
  },
];

export interface ParallaxOffsets2D {
  camX: number;
  camY: number;
}

const PX_OUTLINE = '#261d2e';
const PX_WALL_SLIM = '#f1f5f9';
const PX_GLASS_WALL = '#7dd3fc';
const PX_SHADOW = 'rgba(28, 20, 38, 0.20)';

function snap2(v: number): number {
  return Math.round(v / 2) * 2;
}

function pxRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string
) {
  ctx.fillStyle = fill;
  ctx.fillRect(snap2(x), snap2(y), Math.max(2, snap2(w)), Math.max(2, snap2(h)));
}

function pxBox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  outline = PX_OUTLINE,
  borderPx = 2
) {
  const rx = snap2(x);
  const ry = snap2(y);
  const rw = Math.max(4, snap2(w));
  const rh = Math.max(4, snap2(h));
  const bp = Math.max(2, snap2(borderPx));
  ctx.fillStyle = outline;
  ctx.fillRect(rx, ry, rw, rh);
  ctx.fillStyle = fill;
  ctx.fillRect(rx + bp, ry + bp, rw - bp * 2, rh - bp * 2);
}

// ============================================================================
// GERADORES DE PISO EM MALHA DE TILES 32x32 CLEAN
// ============================================================================
function fillCeramicTiles32x32(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  w: number,
  h: number,
  groutColor = '#b8c4d2',
  tileFace = '#d2dce8',
  tileHighlight = '#e2eaf3'
) {
  pxRect(ctx, x1, y1, w, h, groutColor);
  for (let ty = y1; ty < y1 + h; ty += TILE_SIZE) {
    for (let tx = x1; tx < x1 + w; tx += TILE_SIZE) {
      const tw = Math.min(TILE_SIZE - 2, x1 + w - tx - 2);
      const th = Math.min(TILE_SIZE - 2, y1 + h - ty - 2);
      if (tw > 2 && th > 2) {
        pxRect(ctx, tx + 2, ty + 2, tw, th, tileFace);
        pxRect(ctx, tx + 2, ty + 2, tw, 2, tileHighlight);
      }
    }
  }
}

function fillWoodTiles32x32(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  w: number,
  h: number,
  jointColor = '#7d5738',
  plankA = '#9c744f',
  plankB = '#a87f58',
  highlight = '#b88f67'
) {
  pxRect(ctx, x1, y1, w, h, jointColor);
  const plankH = TILE_SIZE / 2; // 16px altura por tábua, 32px largura
  for (let ty = y1; ty < y1 + h; ty += plankH) {
    const rowIdx = Math.floor((ty - y1) / plankH);
    const offset = (rowIdx % 2) * (TILE_SIZE / 2);
    for (let tx = x1 - offset; tx < x1 + w; tx += TILE_SIZE) {
      const drawX = Math.max(x1, tx);
      const drawW = Math.min(tx + TILE_SIZE - 2, x1 + w) - drawX;
      if (drawW > 2) {
        pxRect(
          ctx,
          drawX,
          ty,
          drawW,
          plankH - 2,
          (Math.floor(tx / TILE_SIZE) + rowIdx) % 2 === 0 ? plankA : plankB
        );
        pxRect(ctx, drawX, ty, drawW, 2, highlight);
      }
    }
  }
}

// ============================================================================
// OBJETOS MODULARES 32x32 CLEAN & FOCADOS
// ============================================================================

// Parede Frontal Interna Slim (16px de altura, limpa e elegante)
function drawCleanHeaderWall(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  upperColor: string,
  lowerColor: string
) {
  pxRect(ctx, x, y + 16, w, 4, PX_SHADOW);
  pxRect(ctx, x, y, w, 10, upperColor);
  pxRect(ctx, x, y + 10, w, 4, lowerColor);
  pxRect(ctx, x, y + 14, w, 2, PX_OUTLINE);
}

// Planta Ornamental Compacta 32x32
function drawCleanPlant(ctx: CanvasRenderingContext2D, x: number, y: number) {
  pxRect(ctx, x - 8, y + 4, 16, 4, PX_SHADOW);
  pxBox(ctx, x - 6, y - 2, 12, 8, '#c88a4b', PX_OUTLINE, 2);
  pxBox(ctx, x - 8, y - 12, 16, 10, '#24523b', PX_OUTLINE, 2);
  pxRect(ctx, x - 6, y - 10, 12, 6, '#388047');
  pxRect(ctx, x - 4, y - 10, 6, 4, '#63c74d');
}

// Totem Auto-Atendimento PIX / ATM Kiosk 32x32 (Sugestão Web Cyber Cafe!)
function drawPixSelfServiceKiosk(ctx: CanvasRenderingContext2D, x: number, y: number) {
  pxRect(ctx, x - 9, y + 12, 18, 4, PX_SHADOW);
  pxBox(ctx, x - 9, y - 14, 18, 28, '#1e293b', PX_OUTLINE, 2);
  pxBox(ctx, x - 7, y - 10, 14, 12, '#0284c7', PX_OUTLINE, 2);
  pxRect(ctx, x - 5, y - 8, 10, 8, '#38bdf8');
  pxRect(ctx, x - 3, y - 6, 6, 4, '#ffffff'); // QR Code PIX na tela
  pxRect(ctx, x - 5, y + 4, 10, 2, '#4ade80'); // Leitor de cartão/NFC
}

// Estação Ramen / Cup Noodles + Micro-ondas + Soda Dispenser (Sugestão Web Cyber Cafe!)
function drawRamenAndMicrowaveStation(ctx: CanvasRenderingContext2D, x: number, y: number) {
  pxRect(ctx, x, y + 22, 64, 4, PX_SHADOW);
  pxBox(ctx, x, y, 64, 24, '#c88a4b', PX_OUTLINE, 2);
  pxRect(ctx, x + 2, y + 2, 60, 8, '#e8c482');
  // Micro-ondas digital (esquerda)
  pxBox(ctx, x + 4, y - 8, 20, 12, '#e2e8f0', PX_OUTLINE, 2);
  pxRect(ctx, x + 6, y - 6, 10, 8, '#38bdf8');
  pxRect(ctx, x + 18, y - 6, 4, 8, '#475569');
  // Dispenser de Água Quente + Copos de Cup Noodles (centro)
  pxBox(ctx, x + 26, y - 10, 14, 14, '#cbd5e1', PX_OUTLINE, 2);
  pxBox(ctx, x + 42, y - 6, 8, 10, '#ef4444', PX_OUTLINE, 2); // Cup Noodle 1
  pxRect(ctx, x + 44, y - 4, 4, 2, '#fef08a');
  pxBox(ctx, x + 52, y - 6, 8, 10, '#f97316', PX_OUTLINE, 2); // Cup Noodle 2
}

// Máquina de Vendas Clean 32x32
function drawCleanVendingMachine(ctx: CanvasRenderingContext2D, x: number, y: number) {
  pxRect(ctx, x + 2, y + 28, 24, 4, PX_SHADOW);
  pxBox(ctx, x, y, 24, 30, '#475569', PX_OUTLINE, 2);
  pxBox(ctx, x + 4, y + 4, 16, 16, '#1e293b', PX_OUTLINE, 2);
  pxRect(ctx, x + 6, y + 6, 12, 4, '#38bdf8');
  pxRect(ctx, x + 6, y + 12, 12, 4, '#4ade80');
  pxRect(ctx, x + 4, y + 22, 16, 4, '#0f172a');
}

// Poltrona Clean 16x16
function drawCleanChair(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: 'RED' | 'BLUE'
) {
  const main = color === 'RED' ? '#c84b53' : '#3b66b0';
  pxRect(ctx, x - 7, y + 5, 14, 4, PX_SHADOW);
  pxBox(ctx, x - 7, y - 6, 14, 12, main, PX_OUTLINE, 2);
}

// Estante Metálica Clean (Estoque)
function drawCleanShelf(ctx: CanvasRenderingContext2D, x: number, y: number, w = 32) {
  pxRect(ctx, x + 2, y + 22, w, 4, PX_SHADOW);
  pxBox(ctx, x, y, w, 24, '#cbd5e1', PX_OUTLINE, 2);
  pxRect(ctx, x + 4, y + 4, w - 8, 6, '#d99b52');
  pxRect(ctx, x + 4, y + 12, w - 8, 6, '#38bdf8');
}

// ============================================================================
// ESTILO NEON CYBERPUNK-COZY: placas neon, vegetação, luminárias e evolução de equipamentos
// ============================================================================
export const TIER_PC: Record<string, number> = {
  'PC Básico': 0,
  'PC Intermediário': 1,
  'PC Gaming': 2,
  'VIP Station': 3,
};

// Onde a animação de Level-Up aparece para cada melhoria do estabelecimento
export const POSICAO_MELHORIA: Record<string, { x: number; y: number }> = {
  inf_eletrica: { x: 790, y: 150 },
  inf_seguranca: { x: 560, y: 130 },
  inf_ar: { x: 540, y: 330 },
  eq_pcs: { x: 400, y: 420 },
  eq_print: { x: 470, y: 232 },
  eq_console: { x: 940, y: 490 },
  eq_monitor: { x: 690, y: 420 },
};

const RGB_CICLO = ['#f43f5e', '#facc15', '#4ade80', '#22d3ee', '#a855f7'];

function nivelMelhoria(melhorias: MelhoriaEstabelecimento[], id: string): number {
  const m = melhorias.find((x) => x.id === id);
  return m && m.ativo !== false ? m.nivel : 0;
}

function drawNeonSign(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  w: number,
  texto: string,
  cor: string,
  fonte = 'bold 11px "Chakra Petch", monospace'
) {
  pxBox(ctx, cx - w / 2, y, w, 22, '#120d26', cor, 2);
  pxRect(ctx, cx - w / 2 + 4, y + 4, w - 8, 2, 'rgba(255,255,255,0.12)');
  ctx.font = fonte;
  ctx.textAlign = 'center';
  ctx.fillStyle = cor;
  ctx.fillText(texto, cx, y + 16);
  ctx.textAlign = 'start';
}

function drawLushBush(ctx: CanvasRenderingContext2D, x: number, y: number, seed: number) {
  const tons = ['#173a2c', '#1f5138', '#2a6a42', '#3d8a4f'];
  pxRect(ctx, x - 14, y + 8, 28, 4, 'rgba(10,6,20,0.35)');
  pxBox(ctx, x - 14, y - 6, 28, 16, tons[0], '#0c1a14', 2);
  pxRect(ctx, x - 10, y - 4, 20, 8, tons[1]);
  pxRect(ctx, x - 6, y - 4, 10, 4, tons[2 + (seed % 2)]);
  if (seed % 3 === 0) {
    pxRect(ctx, x + 6, y - 4, 4, 4, '#f472b6');
    pxRect(ctx, x - 8, y, 4, 4, '#fde047');
  }
}

function drawStreetLamp(ctx: CanvasRenderingContext2D, x: number, y: number) {
  pxRect(ctx, x - 3, y + 10, 8, 4, 'rgba(10,6,20,0.4)');
  pxBox(ctx, x - 2, y - 20, 6, 32, '#2b2540', PX_OUTLINE, 2);
  pxBox(ctx, x - 6, y - 28, 14, 10, '#fbbf24', PX_OUTLINE, 2);
  pxRect(ctx, x - 2, y - 26, 6, 4, '#fff7c2');
}

// PC evolutivo por nível: Básico → Intermediário → Gaming → VIP Station
function drawPcStation(
  ctx: CanvasRenderingContext2D,
  mx: number,
  my: number,
  tick: number,
  pc: Computador,
  nivelPcs: number,
  nivelMonitor: number
) {
  const tier = TIER_PC[pc.categoria] ?? (pc.area === 'VIP' ? 3 : 0);
  const rgb = RGB_CICLO[(Math.floor(tick / 8) + pc.numero) % RGB_CICLO.length];
  const manut = pc.status === 'MANUTENCAO';

  const deskCor = ['#9b7048', '#6d5a82', '#3b2d54', '#2a1f45'][tier];
  const deskTop = ['#c08c58', '#8a77a3', '#4c3a6e', '#3c2d63'][tier];
  pxRect(ctx, mx - 18, my + 10, 40, 4, PX_SHADOW);
  pxBox(ctx, mx - 18, my - 8, 40, 20, deskCor, tier === 3 ? '#facc15' : PX_OUTLINE, 2);
  pxRect(ctx, mx - 14, my - 4, 32, 10, deskTop);

  // Faixa RGB sob a mesa (Gaming/VIP, ou melhoria Bancadas Gamer nível 4+)
  if (tier >= 2 || nivelPcs >= 4) {
    pxRect(ctx, mx - 16, my + 10, 36, 2, tier === 3 ? '#facc15' : rgb);
  }
  // Teclado e mouse
  pxRect(ctx, mx - 8, my + 2, 14, 3, tier >= 2 ? rgb : '#1e293b');
  pxRect(ctx, mx + 8, my + 2, 3, 3, tier >= 1 ? '#38bdf8' : '#334155');

  // Gabinete
  const towerCor = ['#1e293b', '#334155', '#475569', '#3b2d54'][tier];
  pxBox(ctx, mx + 12, my - 12, 8, 18, towerCor, tier === 3 ? '#facc15' : PX_OUTLINE, 2);
  if (manut) {
    pxRect(ctx, mx + 14, my - 8, 4, 6, tick % 14 < 7 ? '#ef4444' : '#7f1d1d');
  } else if (tier === 0) {
    pxRect(ctx, mx + 14, my - 6, 2, 2, '#22c55e');
  } else if (tier === 1) {
    pxRect(ctx, mx + 14, my - 8, 4, 4, '#22d3ee');
  } else {
    pxRect(ctx, mx + 14, my - 10, 4, 4, rgb);
    pxRect(ctx, mx + 14, my - 4, 4, 4, RGB_CICLO[(Math.floor(tick / 8) + pc.numero + 2) % 5]);
  }

  // Cores da tela por status
  let tela = '#22c55e';
  if (pc.status === 'OCUPADO') {
    tela = (tick + pc.numero * 5) % 24 < 12 ? '#0284c7' : '#4f46e5';
  } else if (manut) {
    tela = tick % 14 < 7 ? '#ea580c' : '#dc2626';
  }

  const bonus = nivelMonitor >= 3 ? 2 : 0;
  const rim = ['#475569', '#3b82f6', '#22d3ee', '#facc15'][tier];
  if (tier === 0) {
    pxBox(ctx, mx - 10, my - 12, 18 + bonus, 12, '#334155', PX_OUTLINE, 2);
    pxRect(ctx, mx - 6, my - 8, 10 + bonus, 6, tela);
  } else if (tier === 1) {
    pxBox(ctx, mx - 11, my - 14, 20 + bonus, 14, '#334155', rim, 2);
    pxRect(ctx, mx - 7, my - 10, 12 + bonus, 8, tela);
  } else if (tier === 2) {
    pxBox(ctx, mx - 12, my - 15, 22 + bonus, 14, '#1e293b', rim, 2);
    pxRect(ctx, mx - 8, my - 11, 14 + bonus, 8, tela);
    pxBox(ctx, mx - 20, my - 16, 8, 16, '#1e293b', rim, 2);
    pxRect(ctx, mx - 18, my - 12, 4, 8, pc.status === 'OCUPADO' ? rgb : '#334155');
  } else {
    pxBox(ctx, mx - 12, my - 16, 24 + bonus, 15, '#1e1b2e', rim, 2);
    pxRect(ctx, mx - 8, my - 12, 16 + bonus, 9, tela);
    pxBox(ctx, mx - 22, my - 14, 10, 13, '#1e1b2e', rim, 2);
    pxRect(ctx, mx - 20, my - 10, 6, 7, pc.status === 'OCUPADO' ? '#a855f7' : '#334155');
    pxBox(ctx, mx + 12, my - 14, 10, 4, '#1e1b2e', rim, 2);
  }
}

// ============================================================================
// CACHE DAS CAMADAS (PISO / MOBILIÁRIO / PAREDES) EM MALHA DE TILES 32x32
// ============================================================================
let floorParallaxCache: HTMLCanvasElement | null = null;
let furnitureParallaxCache: HTMLCanvasElement | null = null;
let wallCapParallaxCache: HTMLCanvasElement | null = null;
let cachedScale = 0;
const CACHE_VERSION = 50; // Geração 32x32 Slim & Clean + Portas Ortogonais
let builtVersion = 0;

function ensureParallaxCachesBuilt(scale: number) {
  const WORLD_W = 1280;
  const WORLD_H = 768;

  if (
    floorParallaxCache &&
    furnitureParallaxCache &&
    wallCapParallaxCache &&
    cachedScale === scale &&
    builtVersion === CACHE_VERSION
  ) {
    return;
  }

  // --------------------------------------------------------------------------
  // CAMADA 1: PISOS EM MALHA DE TILES 32x32
  // --------------------------------------------------------------------------
  const floorCanvas = document.createElement('canvas');
  floorCanvas.width = Math.round(WORLD_W * scale);
  floorCanvas.height = Math.round(WORLD_H * scale);
  const fCtx = floorCanvas.getContext('2d')!;
  fCtx.save();
  fCtx.scale(scale, scale);
  fCtx.imageSmoothingEnabled = false;

  // Gramado externo em Tiles 32x32
  pxRect(fCtx, 0, 0, WORLD_W, WORLD_H, '#1c3a31');
  for (let ty = 64; ty < 592; ty += TILE_SIZE) {
    for (let tx = 0; tx < WORLD_W; tx += TILE_SIZE) {
      if ((tx / TILE_SIZE + ty / TILE_SIZE) % 2 === 0) {
        pxRect(fCtx, tx, ty, TILE_SIZE, TILE_SIZE, '#234537');
      }
    }
  }

  // Calçada 32x32 (y: 586..650) e Rua
  fillCeramicTiles32x32(fCtx, 0, 586, WORLD_W, 64, '#2f2945', '#443d63', '#544c78');
  pxRect(fCtx, 0, 650, WORLD_W, 4, '#64748b');
  pxRect(fCtx, 0, 654, WORLD_W, 114, '#1a1829');
  for (let cy = 662; cy < 746; cy += 14) {
    pxBox(fCtx, 512, cy, 64, 8, '#f1f5f9', PX_OUTLINE, 2);
  }
  for (let rx = 32; rx < WORLD_W; rx += 64) {
    if (rx > 480 && rx < 600) continue;
    pxRect(fCtx, rx, 704, 32, 4, '#facc15');
  }

  // Sombra externa sutil do complexo
  pxRect(fCtx, 76, 100, 1116, 490, 'rgba(20, 14, 28, 0.28)');

  // 1. ALA OESTE (x: 80..208, y: 104..584) - Deck Madeira 32x32
  fillWoodTiles32x32(fCtx, 80, 104, 128, 480, '#4a2b2f', '#6b3f3a', '#7c4a40', '#8e5848');

  // 2. ESCRITÓRIO & ESTÚDIO STREAMER (x: 208..430, y: 104..288) - Piso Estúdio 32x32
  fillCeramicTiles32x32(fCtx, 208, 104, 222, 184, '#322b4a', '#413860', '#51477a');
  // Palco elevado 32x32 do Estúdio Streamer (x: 304..420, y: 128..212)
  fillCeramicTiles32x32(fCtx, 304, 128, 116, 84, '#c4c6d0', '#dcdde4', '#f4f5fa');
  pxBox(fCtx, 304, 208, 116, 6, '#5c5e72', PX_OUTLINE, 2);

  // 3. RECEPÇÃO & CHECK-IN (x: 430..686, y: 104..288) - Madeira Quente 32x32
  fillWoodTiles32x32(fCtx, 430, 104, 256, 184, '#5e3530', '#83503f', '#95604b', '#a77058');
  // Tapete Central alinhado com porta_recepcao (x: 516..572, y: 204..282)
  pxBox(fCtx, 516, 204, 56, 78, '#8c4f4b', PX_OUTLINE, 2);
  pxBox(fCtx, 522, 210, 44, 66, '#a6605b', '#e09f87', 2);

  // 4. SALA TÉCNICA NOC (x: 686..864, y: 104..288) - Ladrilho Técnico 32x32
  fillCeramicTiles32x32(fCtx, 686, 104, 178, 184, '#262d4d', '#333c66', '#414b80');
  // Trincheira de vidro de fibra óptica (sem bloquear o hall)
  pxBox(fCtx, 704, 164, 96, 16, '#1e293b', PX_OUTLINE, 2);
  pxRect(fCtx, 708, 168, 88, 2, '#38bdf8');
  pxRect(fCtx, 708, 172, 88, 2, '#4ade80');

  // 5. LANCHONETE & RAMEN BAR (x: 864..1040, y: 104..288) - Xadrez 32x32 Clean
  pxRect(fCtx, 864, 104, 176, 184, '#3a2a40');
  for (let ty = 104; ty < 288; ty += TILE_SIZE) {
    for (let tx = 864; tx < 1040; tx += TILE_SIZE) {
      const isAlt = ((tx - 864) / TILE_SIZE + (ty - 104) / TILE_SIZE) % 2 === 0;
      pxRect(fCtx, tx + 2, ty + 2, TILE_SIZE - 4, TILE_SIZE - 4, isAlt ? '#7a4a4c' : '#613b4a');
    }
  }

  // 6. ARENA GAMER PRINCIPAL (x: 208..608, y: 288..584) - Madeira 32x32 + Corredor Central
  fillWoodTiles32x32(fCtx, 208, 288, 400, 296, '#4d2d44', '#693d56', '#7b4a66', '#8d5877');
  // Passadeira do Eixo Central Ortogonal (x: 528..560, y: 288..584)
  pxBox(fCtx, 528, 290, 32, 292, '#334155', PX_OUTLINE, 2);
  pxRect(fCtx, 532, 292, 2, 288, '#38bdf8');
  pxRect(fCtx, 554, 292, 2, 288, '#38bdf8');

  // 7. ARENA VIP PRO-GAMING (x: 608..864, y: 288..584) - Ladrilho Escuro 32x32
  fillCeramicTiles32x32(fCtx, 608, 288, 256, 296, '#231f33', '#34304a', '#464066');
  // Passadeira do Corredor Leste (x: 816..848, y: 224..556)
  pxBox(fCtx, 820, 228, 24, 324, '#2a2640', '#38bdf8', 2);

  // 8. ESTOQUE (x: 864..1040, y: 288..436) & 9. CONSOLES VIP (y: 436..584) em Tiles 32x32
  fillCeramicTiles32x32(fCtx, 864, 288, 176, 148, '#2d2b47', '#3d3a5e', '#4d4a74');
  fillCeramicTiles32x32(fCtx, 864, 436, 176, 148, '#2d2b47', '#403c63', '#504c78');

  // 10. ALA LESTE: ARENA TORNEIO E-SPORTS (x: 1040..1184, y: 104..584) - Tiles 32x32
  fillCeramicTiles32x32(fCtx, 1040, 104, 144, 480, '#27303f', '#334155', '#475569');
  fillCeramicTiles32x32(fCtx, 1056, 144, 112, 160, '#1e1b4b', '#312e81', '#4338ca');
  pxBox(fCtx, 1056, 300, 112, 6, '#facc15', PX_OUTLINE, 2);

  // Tapetes de Soleira nas 9 Portas Arquitetônicas (Destaca visualmente cada entrada!)
  PORTAS_ARQUITETONICAS.forEach((p) => {
    if (p.orientacao === 'HORIZONTAL') {
      pxBox(fCtx, p.x - p.largura / 2, p.y - 8, p.largura, 16, '#334155', '#38bdf8', 2);
    } else {
      pxBox(fCtx, p.x - 8, p.y - p.largura / 2, 16, p.largura, '#334155', '#38bdf8', 2);
    }
  });

  fCtx.restore();
  floorParallaxCache = floorCanvas;

  // --------------------------------------------------------------------------
  // CAMADA 2: MOBILIÁRIO MODULAR 32x32 SLIM & CLEAN (Foco no essencial!)
  // --------------------------------------------------------------------------
  const furnCanvas = document.createElement('canvas');
  furnCanvas.width = Math.round(WORLD_W * scale);
  furnCanvas.height = Math.round(WORLD_H * scale);
  const mCtx = furnCanvas.getContext('2d')!;
  mCtx.save();
  mCtx.scale(scale, scale);
  mCtx.imageSmoothingEnabled = false;

  // Painéis superiores enxutos (16px)
  drawCleanHeaderWall(mCtx, 82, 106, 124, '#ede4c8', '#73997a');
  drawCleanHeaderWall(mCtx, 210, 106, 218, '#d9d4c5', '#8c6747');
  drawCleanHeaderWall(mCtx, 432, 106, 252, '#e3d5b8', '#b5804c');
  drawCleanHeaderWall(mCtx, 688, 106, 174, '#ede4c8', '#73997a');
  drawCleanHeaderWall(mCtx, 866, 106, 172, '#ede4c8', '#73997a');
  drawCleanHeaderWall(mCtx, 1042, 106, 140, '#d9d4c5', '#475569');

  // 1. ALA OESTE: DECK GAMER (6 PCs extras em x = 112 / 176 + corredor central em x = 144)
  drawCleanVendingMachine(mCtx, 96, 124);
  drawCleanPlant(mCtx, 176, 166);
  drawCleanPlant(mCtx, 112, 548);
  drawCleanPlant(mCtx, 176, 548);
  // Tapete neon do corredor central do deck
  pxBox(mCtx, 134, 232, 20, 250, '#2a2640', '#a855f7', 2);

  // Vegetação densa e luminárias externas (estilo cyberpunk-cozy)
  for (let bx = 24; bx < 1260; bx += 52) {
    drawLushBush(mCtx, bx, 78, bx / 52);
  }
  [30, 1240].forEach((bx) => {
    for (let by = 130; by < 560; by += 70) drawLushBush(mCtx, bx, by, by / 70 + 1);
  });
  [150, 420, 700, 980, 1180].forEach((lx) => drawStreetLamp(mCtx, lx, 604));
  // Placa neon principal sobre a porta de entrada
  drawNeonSign(mCtx, 576, 590, 150, 'LAN HOUSE', '#c084fc', 'bold 13px "Chakra Petch", monospace');

  // 2. ESCRITÓRIO & ESTÚDIO STREAMER (x: 210..428, y: 108..288)
  // Mesa Executiva POO (x: 224..288, y: 152..176 — acima do waypoint 256, 196!)
  pxBox(mCtx, 224, 152, 64, 24, '#8c5832', PX_OUTLINE, 2);
  pxRect(mCtx, 228, 156, 56, 14, '#b87a4b');
  pxBox(mCtx, 248, 146, 16, 12, '#475569', PX_OUTLINE, 2);

  // Bancada Streamer no Palco (x: 320..408, y: 152..176 — acima do waypoint 368, 196!)
  pxBox(mCtx, 332, 110, 64, 18, '#334155', PX_OUTLINE, 2); // Telão Live
  pxRect(mCtx, 336, 114, 56, 10, '#38bdf8');
  pxBox(mCtx, 320, 152, 88, 22, '#cfd6e6', PX_OUTLINE, 2);
  pxRect(mCtx, 324, 154, 80, 10, '#f8fafc');
  pxBox(mCtx, 352, 166, 24, 6, '#38bdf8', PX_OUTLINE, 2);

  // 3. RECEPÇÃO & CHECK-IN (x: 432..684, y: 108..288)
  // Balcão em U Clean (x: 484..612, y: 144..196 — atendente fica em y = 172, fila em y = 252!)
  pxRect(mCtx, 486, 194, 126, 4, PX_SHADOW);
  pxBox(mCtx, 484, 148, 20, 46, '#e0b878', PX_OUTLINE, 2);
  pxBox(mCtx, 592, 148, 20, 46, '#e0b878', PX_OUTLINE, 2);
  pxBox(mCtx, 484, 174, 128, 22, '#c88a4b', PX_OUTLINE, 2);
  pxRect(mCtx, 488, 176, 120, 8, '#e8c482');
  [520, 572].forEach((mx) => {
    pxBox(mCtx, mx - 10, 166, 20, 14, '#475569', PX_OUTLINE, 2);
    pxRect(mCtx, mx - 2, 170, 4, 4, '#f8fafc');
  });
  // Totem Auto-Atendimento PIX/ATM (em 604, 224) + Vending Machine (em 644, 144)
  drawPixSelfServiceKiosk(mCtx, 608, 224);
  drawCleanVendingMachine(mCtx, 636, 144);
  drawCleanPlant(mCtx, 448, 144);

  // 4. SALA TÉCNICA NOC (x: 688..862, y: 108..288)
  // Bancada de Reparo (x: 804..852, y: 184..216 — acima do waypoint 816, 236!)
  pxBox(mCtx, 804, 184, 48, 24, '#cfd6e0', PX_OUTLINE, 2);
  pxBox(mCtx, 812, 188, 18, 12, '#15803d', PX_OUTLINE, 2);
  drawCleanShelf(mCtx, 816, 124, 36);

  // 5. LANCHONETE & RAMEN BAR (x: 864..1038, y: 108..288)
  // Estação Ramen / Cup Noodles & Micro-ondas no topo (x: 884..948, y: 128) + Cafeteira (x: 956..1028, y: 128)
  drawRamenAndMicrowaveStation(mCtx, 884, 128);
  pxBox(mCtx, 956, 128, 72, 24, '#c88a4b', PX_OUTLINE, 2);
  pxBox(mCtx, 962, 118, 22, 16, '#cbd5e1', PX_OUTLINE, 2); // Espresso
  pxRect(mCtx, 966, 122, 14, 4, '#ef4444');
  pxBox(mCtx, 990, 120, 32, 14, '#bae6fd', PX_OUTLINE, 2); // Vitrine

  // 2 Mesas Clean de Refeição (posicionadas à direita em x = 1008 para deixar os waypoints 912 e 976 livres!)
  [196, 248].forEach((ty, idx) => {
    drawCleanChair(mCtx, 996, ty, idx === 0 ? 'RED' : 'BLUE');
    pxBox(mCtx, 1004, ty - 10, 26, 20, '#57534e', PX_OUTLINE, 2);
    pxRect(mCtx, 1008, ty - 6, 18, 12, '#78716c');
  });

  // 6. ESTOQUE DE HARDWARE (x: 864..1038, y: 288..436)
  // Prateleiras no topo (y = 304) deixando o corredor y = 368 100% desimpedido!
  drawCleanShelf(mCtx, 888, 304, 40);
  drawCleanShelf(mCtx, 936, 304, 40);
  drawCleanShelf(mCtx, 984, 304, 40);
  // Caixas no canto sudeste (x: 968, y: 396)
  pxBox(mCtx, 968, 396, 28, 22, '#d99b52', PX_OUTLINE, 2);
  pxRect(mCtx, 978, 398, 6, 18, '#f8fafc');

  // 7. SALA DE CONSOLES VIP (x: 864..1038, y: 436..584)
  // Sofá e Mesa de Centro posicionados sem bloquear a reta y = 512 (porta_sala_vip -> porta_arena_esports)
  pxBox(mCtx, 944, 540, 64, 24, '#475569', PX_OUTLINE, 2);
  pxRect(mCtx, 948, 544, 56, 16, '#64748b');
  drawCleanChair(mCtx, 932, 552, 'BLUE');
  drawCleanChair(mCtx, 1020, 552, 'RED');

  // 8. ALA LESTE: PALCO TORNEIO E-SPORTS (x: 1040..1184, y: 104..584)
  pxBox(mCtx, 1068, 112, 88, 22, '#1e293b', PX_OUTLINE, 2);
  pxRect(mCtx, 1072, 116, 80, 14, '#0284c7');
  pxBox(mCtx, 1102, 118, 20, 10, '#facc15', PX_OUTLINE, 2);
  // Bancadas Time Azul vs Time Vermelho no palco
  pxBox(mCtx, 1064, 176, 42, 22, '#2563eb', PX_OUTLINE, 2);
  pxBox(mCtx, 1118, 176, 42, 22, '#dc2626', PX_OUTLINE, 2);
  pxBox(mCtx, 1064, 236, 42, 22, '#2563eb', PX_OUTLINE, 2);
  pxBox(mCtx, 1118, 236, 42, 22, '#dc2626', PX_OUTLINE, 2);
  // Cadeiras da plateia acima da rota y = 512 (em y = 360 e y = 416)
  [360, 416].forEach((ry, rIdx) => {
    drawCleanChair(mCtx, 1072, ry, rIdx === 0 ? 'BLUE' : 'RED');
    drawCleanChair(mCtx, 1112, ry, rIdx === 0 ? 'RED' : 'BLUE');
    drawCleanChair(mCtx, 1152, ry, rIdx === 0 ? 'BLUE' : 'RED');
  });

  mCtx.restore();
  furnitureParallaxCache = furnCanvas;

  // --------------------------------------------------------------------------
  // CAMADA 3: PAREDES CUTAWAY SLIM & CLEAN (6px espessura + Divisórias de Vidro 4px!)
  // --------------------------------------------------------------------------
  const wallCanvas = document.createElement('canvas');
  wallCanvas.width = Math.round(WORLD_W * scale);
  wallCanvas.height = Math.round(WORLD_H * scale);
  const wCtx = wallCanvas.getContext('2d')!;
  wCtx.save();
  wCtx.scale(scale, scale);
  wCtx.imageSmoothingEnabled = false;

  const drawSlimHWall = (x1: number, x2: number, y: number, thick = 6, isGlass = false) => {
    const w = x2 - x1;
    if (w <= 0) return;
    pxRect(wCtx, x1, y + thick / 2, w, 3, PX_SHADOW);
    pxBox(
      wCtx,
      x1,
      y - thick / 2,
      w,
      thick,
      isGlass ? PX_GLASS_WALL : PX_WALL_SLIM,
      PX_OUTLINE,
      1.5
    );
  };

  const drawSlimVWall = (x: number, y1: number, y2: number, thick = 6, isGlass = false) => {
    const h = y2 - y1;
    if (h <= 0) return;
    pxRect(wCtx, x + thick / 2, y1, 3, h, PX_SHADOW);
    pxBox(
      wCtx,
      x - thick / 2,
      y1,
      thick,
      h,
      isGlass ? PX_GLASS_WALL : PX_WALL_SLIM,
      PX_OUTLINE,
      1.5
    );
  };

  // Perímetro Externo Slim (8px) com abertura exata para porta_principal (x: 512..576, y = 584)
  drawSlimHWall(76, 1188, 104, 8);
  drawSlimHWall(76, 512, 584, 8);
  drawSlimHWall(576, 1188, 584, 8);
  drawSlimVWall(80, 100, 588, 8);
  drawSlimVWall(1184, 100, 588, 8);

  // Parede Horizontal Norte (y = 288) com as 3 Portas exatas:
  // - porta_escritorio (x: 314..358)
  // - porta_recepcao (x: 520..568)
  // - porta_sala_tecnica (x: 746..790)
  drawSlimHWall(208, 314, 288, 6);
  drawSlimHWall(358, 520, 288, 6, true); // Divisória de vidro acústico na frente da Recepção!
  drawSlimHWall(568, 746, 288, 6, true);
  drawSlimHWall(790, 1040, 288, 6);

  // Parede Horizontal entre Estoque e Consoles (y = 436)
  drawSlimHWall(864, 1040, 436, 6);

  // Parede Vertical da Ala Oeste (x = 208) com vão para porta_ala_oeste (y: 346..390)
  drawSlimVWall(208, 104, 346, 6);
  drawSlimVWall(208, 390, 584, 6);

  // Paredes Verticais entre Estúdio/Recepção (x = 430) e Recepção/NOC (x = 686)
  drawSlimVWall(430, 104, 288, 6);
  drawSlimVWall(686, 104, 288, 6);

  // Divisória de Vidro Acústico Slim entre Corredor Central e Arena VIP (x = 608)
  drawSlimVWall(608, 384, 436, 4, true);
  drawSlimVWall(608, 468, 520, 4, true);

  // Parede Vertical Leste (x = 864) com os 3 vãos exatos:
  // - porta_cozinha (y: 220..260)
  // - porta_estoque (y: 348..388)
  // - porta_sala_vip (y: 492..532)
  drawSlimVWall(864, 104, 220, 6);
  drawSlimVWall(864, 260, 348, 6);
  drawSlimVWall(864, 388, 492, 6);
  drawSlimVWall(864, 532, 584, 6);

  // Parede Vertical da Arena E-Sports (x = 1040) com vão para porta_arena_esports (y: 490..534)
  drawSlimVWall(1040, 104, 490, 6, true);
  drawSlimVWall(1040, 534, 584, 6);

  wCtx.restore();
  wallCapParallaxCache = wallCanvas;

  cachedScale = scale;
  builtVersion = CACHE_VERSION;
}

function drawPixelExteriorTree(ctx: CanvasRenderingContext2D, x: number, y: number, swayPx = 0) {
  const rx = snap2(x);
  const ry = snap2(y);
  const sw = snap2(swayPx);

  pxRect(ctx, rx - 16, ry + 10, 32, 8, PX_SHADOW);
  pxBox(ctx, rx - 6, ry - 8, 12, 22, '#7a4829', PX_OUTLINE, 2);
  pxBox(ctx, rx - 20 + sw, ry - 30, 40, 22, '#24523b', PX_OUTLINE, 2);
  pxBox(ctx, rx - 16 + sw, ry - 40, 32, 16, '#388047', PX_OUTLINE, 2);
  pxRect(ctx, rx - 10 + sw, ry - 36, 12, 6, '#63c74d');
}

function drawPixelGamingChair(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  ehVip: boolean
) {
  const rx = snap2(sx);
  const ry = snap2(sy);
  const main = ehVip ? '#7e22ce' : '#2563eb';
  const trim = ehVip ? '#facc15' : '#38bdf8';

  pxRect(ctx, rx - 9, ry + 5, 18, 4, PX_SHADOW);
  pxBox(ctx, rx - 9, ry - 5, 18, 10, main, PX_OUTLINE, 2);
  pxRect(ctx, rx - 5, ry - 3, 2, 6, trim);
  pxRect(ctx, rx + 3, ry - 3, 2, 6, trim);
}

export function renderLanHouseArchitecture(
  ctx: CanvasRenderingContext2D,
  computadores: Computador[],
  hoveredPc: number | null,
  tick: number,
  scale = 1,
  parallax: ParallaxOffsets2D = { camX: 0, camY: 0 },
  mostrarGrade32x32 = false,
  melhorias: MelhoriaEstabelecimento[] = []
) {
  ensureParallaxCachesBuilt(scale);
  ctx.imageSmoothingEnabled = false;

  const { camX, camY } = parallax;

  // LAYER 0 (PARALLAX 0.20x): HORIZONTE & NUVENS
  ctx.save();
  const skyShiftX = snap2(camX * 0.2);
  pxRect(ctx, 0, 0, 1280, 56, '#191d30');
  pxRect(ctx, 0, 56, 1280, 44, '#252b45');

  for (let i = 0; i < 24; i++) {
    const sx = snap2(((i * 97 + skyShiftX) % 1280 + 1280) % 1280);
    const sy = snap2(8 + ((i * 23) % 42));
    pxRect(ctx, sx, sy, 2, 2, (tick + i * 7) % 40 < 20 ? '#fef08a' : '#64748b');
  }

  const farShiftX = snap2(camX * 0.28);
  for (let bx = -64; bx < 1344; bx += 64) {
    const h = snap2(28 + ((Math.abs(bx) * 17) % 32));
    const drawX = snap2(bx + farShiftX);
    pxBox(ctx, drawX, 96 - h, 56, h, '#232942', '#121626', 2);
  }
  ctx.restore();

  // LAYER 1 (PARALLAX 0.55x): PISO EM TILES 32x32
  const floorShiftX = Math.round(snap2(camX * 0.55) * scale);
  const floorShiftY = Math.round(snap2(camY * 0.55) * scale);
  if (floorParallaxCache) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, floorShiftX, floorShiftY);
    ctx.drawImage(floorParallaxCache, 0, 0);
    ctx.restore();
  }

  // Opcional: Malha Visual 32x32
  if (mostrarGrade32x32) {
    ctx.save();
    ctx.translate(snap2(camX * 0.55), snap2(camY * 0.55));
    ctx.strokeStyle = 'rgba(56, 189, 248, 0.22)';
    ctx.lineWidth = 1;
    for (let gx = 0; gx <= 1280; gx += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, 768);
      ctx.stroke();
    }
    for (let gy = 0; gy <= 768; gy += TILE_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(1280, gy);
      ctx.stroke();
    }
    ctx.restore();
  }

  // LAYER 2 (PARALLAX 0.80x): MOBILIÁRIO 32x32 & 18 PCs
  const midShiftX = snap2(camX * 0.8);
  const midShiftY = snap2(camY * 0.8);
  if (furnitureParallaxCache) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, Math.round(midShiftX * scale), Math.round(midShiftY * scale));
    ctx.drawImage(furnitureParallaxCache, 0, 0);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(midShiftX, midShiftY);

  // Racks NOC (em y = 120..160, deixando y = 192 livre para o Técnico!)
  [704, 748].forEach((rx, rIdx) => {
    pxBox(ctx, rx, 120, 32, 42, '#334155', PX_OUTLINE, 2);
    for (let b = 0; b < 4; b++) {
      pxBox(ctx, rx + 4, 124 + b * 9, 24, 6, '#1e293b', PX_OUTLINE, 2);
      const ledOn = (Math.floor(tick / 6) + b * 2 + rIdx) % 3 !== 0;
      pxRect(ctx, rx + 6, 126 + b * 9, 4, 2, ledOn ? '#4ade80' : '#0f172a');
    }
  });

  // 3 Fliperamas e TV 85" na parede norte da Sala de Consoles (y = 442..474, deixando y = 512 livre!)
  [880, 904, 928].forEach((ax, i) => {
    const cabColor = i === 0 ? '#6d28d9' : i === 1 ? '#1d4ed8' : '#be185d';
    pxBox(ctx, ax, 442, 20, 32, cabColor, PX_OUTLINE, 2);
    pxRect(ctx, ax + 4, 448, 12, 8, (tick + i * 7) % 20 < 10 ? '#38bdf8' : '#f472b6');
  });
  pxBox(ctx, 956, 442, 64, 18, '#334155', PX_OUTLINE, 2);
  pxRect(ctx, 960, 446, 56, 10, tick % 40 < 20 ? '#2563eb' : '#10b981');

  // 18 Estações de Computadores Modulares (Clean & Focadas)
  computadores.slice(0, 24).forEach((pc) => {
    const seatNode = WAYPOINT_NODES[nodoAssentoDoPc(pc.numero)];
    if (!seatNode) return;

    const sx = snap2(seatNode.x);
    const sy = snap2(seatNode.y);
    const mx = sx;
    const my = sy - 22;
    const isHovered = hoveredPc === pc.numero;
    const ehVip = pc.area === 'VIP';

    const badgeBorder =
      pc.status === 'MANUTENCAO' ? '#fb923c' : pc.status === 'OCUPADO' ? (ehVip ? '#c084fc' : '#38bdf8') : '#4ade80';
    drawPcStation(ctx, mx, my, tick, pc, nivelMelhoria(melhorias, 'eq_pcs'), nivelMelhoria(melhorias, 'eq_monitor'));

    drawPixelGamingChair(ctx, sx, sy, ehVip);

    if (isHovered) {
      pxBox(ctx, mx - 20, my - 20, 44, 44, 'rgba(250, 204, 21, 0.16)', '#facc15', 2);
    }

    // Tag Slim do PC
    pxBox(ctx, mx - 16, my - 20, 32, 9, '#1e1b2e', badgeBorder, 1.5);
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 6px "Chakra Petch", monospace';
    ctx.textAlign = 'center';
    ctx.fillText(pc.identificacao, mx, my - 13.5);
    ctx.textAlign = 'start';
  });

  const swayPx = Math.sin(tick * 0.03) * 2;
  drawPixelExteriorTree(ctx, 38, 520, swayPx);
  drawPixelExteriorTree(ctx, 1232, 520, -swayPx);

  // ==========================================================================
  // EVOLUÇÃO VISUAL DAS MELHORIAS DO ESTABELECIMENTO (níveis 1..5)
  // ==========================================================================
  const nAr = nivelMelhoria(melhorias, 'inf_ar');
  const nSeg = nivelMelhoria(melhorias, 'inf_seguranca');
  const nEle = nivelMelhoria(melhorias, 'inf_eletrica');
  const nPrint = nivelMelhoria(melhorias, 'eq_print');
  const nCon = nivelMelhoria(melhorias, 'eq_console');

  // Ar-condicionado split: 1 unidade por nível, com ar frio animado
  [260, 490, 760, 380, 640].slice(0, nAr).forEach((ax, i) => {
    pxBox(ctx, ax - 14, 116, 28, 10, '#e2e8f0', PX_OUTLINE, 2);
    pxRect(ctx, ax - 10, 122, 20, 2, '#38bdf8');
    for (let p = 0; p < 3; p++) {
      const py = 128 + ((tick * 0.6 + p * 9 + i * 5) % 22);
      pxRect(ctx, ax - 8 + p * 8, py, 2, 2, 'rgba(186, 230, 253, 0.8)');
    }
  });

  // Câmeras CFTV: 1 por nível, com LED piscando
  [
    [436, 296],
    [682, 296],
    [212, 296],
    [860, 300],
  ].slice(0, nSeg).forEach(([cx, cy], i) => {
    pxBox(ctx, cx - 4, cy - 4, 10, 8, '#1e293b', PX_OUTLINE, 2);
    pxRect(ctx, cx - 6, cy - 2, 4, 4, '#475569');
    pxRect(ctx, cx + 2, cy - 2, 2, 2, (Math.floor(tick / 15) + i) % 2 === 0 ? '#ef4444' : '#14532d');
  });

  // Quadro elétrico trifásico: LEDs acesos conforme o nível
  if (nEle > 0) {
    pxBox(ctx, 782, 116, 22, 44, '#334155', PX_OUTLINE, 2);
    for (let l = 0; l < 5; l++) {
      pxRect(ctx, 788, 122 + l * 7, 10, 3, l < nEle ? '#facc15' : '#0f172a');
    }
  }

  // Central de Impressão Laser: 1 = impressora, 2 = + copiadora, 3 = multifuncional com 2 bandejas
  if (nPrint > 0) {
    pxRect(ctx, 458, 244, 34, 4, PX_SHADOW);
    pxBox(ctx, 458, 222, 32, 22, '#e2e8f0', PX_OUTLINE, 2);
    pxRect(ctx, 462, 226, 24, 6, '#94a3b8');
    pxRect(ctx, 466, 238, 16, 4, '#cbd5e1');
    const saindo = Math.floor(tick / 30) % 2 === 0;
    if (saindo) pxRect(ctx, 468, 244 + (tick % 30 > 15 ? 4 : 2), 12, 6, '#ffffff');
    if (nPrint >= 2) {
      pxBox(ctx, 494, 218, 26, 26, '#cbd5e1', PX_OUTLINE, 2);
      pxRect(ctx, 498, 222, 18, 4, '#38bdf8');
    }
    if (nPrint >= 3) {
      pxRect(ctx, 460, 230, 4, 4, tick % 20 < 10 ? '#4ade80' : '#14532d');
      pxBox(ctx, 440, 226, 16, 18, '#475569', PX_OUTLINE, 2);
    }
  }

  // Lounge de Consoles: moldura neon + fliperamas/VR extras por nível
  if (nCon > 0) {
    const neon = RGB_CICLO[Math.floor(tick / 20) % RGB_CICLO.length];
    pxRect(ctx, 870, 440, 164, 2, neon);
    pxRect(ctx, 870, 580, 164, 2, neon);
    if (nCon >= 2) {
      pxBox(ctx, 884, 548, 20, 32, '#0e7490', PX_OUTLINE, 2);
      pxRect(ctx, 888, 554, 12, 8, (tick + 4) % 20 < 10 ? '#fde047' : '#22d3ee');
    }
    if (nCon >= 3) {
      pxBox(ctx, 908, 548, 20, 32, '#9d174d', PX_OUTLINE, 2);
      pxRect(ctx, 912, 554, 12, 8, tick % 20 < 10 ? '#f472b6' : '#fde047');
    }
    if (nCon >= 4) {
      pxBox(ctx, 1012, 456, 22, 24, '#1e1b4b', '#a855f7', 2); // Cabine VR
      pxRect(ctx, 1016, 460, 14, 6, neon);
    }
  }

  // ==========================================================================
  // ILUMINAÇÃO NEON: tom noturno roxo + brilho de telas, placas e lâmpadas
  // ==========================================================================
  ctx.save();
  ctx.globalCompositeOperation = 'multiply';
  ctx.fillStyle = 'rgba(200, 180, 240, 0.42)';
  ctx.fillRect(0, 0, 1280, 768);
  ctx.globalCompositeOperation = 'lighter';
  const glow = (gx: number, gy: number, r: number, cor: string) => {
    const g = ctx.createRadialGradient(gx, gy, 2, gx, gy, r);
    g.addColorStop(0, cor);
    g.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = g;
    ctx.fillRect(gx - r, gy - r, r * 2, r * 2);
  };
  computadores.slice(0, 24).forEach((pc) => {
    if (pc.status === 'OCUPADO') {
      const seat = WAYPOINT_NODES[nodoAssentoDoPc(pc.numero)];
      if (!seat) return;
      glow(seat.x, seat.y - 28, 44, pc.area === 'VIP' ? 'rgba(168,85,247,0.30)' : 'rgba(56,189,248,0.26)');
    }
  });
  [150, 420, 700, 980, 1180].forEach((lx) => glow(lx, 590, 70, 'rgba(251,191,36,0.30)'));
  glow(576, 600, 110, 'rgba(192,132,252,0.36)');
  glow(1100, 160, 90, 'rgba(250,204,21,0.18)');
  glow(950, 480, 80, 'rgba(244,114,182,0.16)');
  ctx.restore();

  ctx.restore();
}

export function renderDoorwayLintelsAndLabels(
  ctx: CanvasRenderingContext2D,
  tick = 0,
  scale = 1,
  parallax: ParallaxOffsets2D = { camX: 0, camY: 0 }
) {
  ensureParallaxCachesBuilt(scale);
  ctx.imageSmoothingEnabled = false;

  const { camX, camY } = parallax;
  const capShiftX = snap2(camX * 1.02);
  const capShiftY = snap2(camY * 1.02);

  if (wallCapParallaxCache) {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, Math.round(capShiftX * scale), Math.round(capShiftY * scale));
    ctx.drawImage(wallCapParallaxCache, 0, 0);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(capShiftX, capShiftY);

  // Etiquetas Minimalistas & Clean no topo de cada setor (sem tapar paredes ou portas!)
  const placasClean = [
    { x: 144, y: 94, txt: 'DECK GAMER', cor: '#2dd4bf' },
    { x: 320, y: 94, txt: 'ESTÚDIO & ADM', cor: '#f472b6' },
    { x: 556, y: 94, txt: 'RECEPÇÃO PIX', cor: '#38bdf8' },
    { x: 774, y: 94, txt: 'NOC SERVIDORES', cor: '#4ade80' },
    { x: 952, y: 94, txt: 'BOMBONIERE', cor: '#f472b6' },
    { x: 1112, y: 94, txt: 'PALCO E-SPORTS', cor: '#fde047' },
  ];

  ctx.font = 'bold 7px "Chakra Petch", monospace';
  ctx.textAlign = 'center';
  placasClean.forEach((pl) => {
    const w = snap2(ctx.measureText(pl.txt).width + 12);
    pxBox(ctx, pl.x - w / 2, pl.y - 8, w, 12, '#1e1b2e', PX_OUTLINE, 1.5);
    pxRect(ctx, pl.x - w / 2 + 2, pl.y - 6, w - 4, 1.5, pl.cor);
    ctx.fillStyle = '#f8fafc';
    ctx.fillText(pl.txt, pl.x, pl.y + 1);
  });
  ctx.textAlign = 'start';
  ctx.restore();
}
