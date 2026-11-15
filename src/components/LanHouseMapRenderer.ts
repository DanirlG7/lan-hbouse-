import { Computador, MelhoriaEstabelecimento } from '../domain/types';
import { EstadoPcHypeVisual, nodoAssentoDoPc, WAYPOINT_NODES } from '../domain/WaypointGraph';
import { TILE_SIZE, WORLD_H, WORLD_W } from '../world/constants';
import { PAREDES_VIDRO, PORTAS, SALAS, Sala } from '../world/layout';
import { segmentosDeParede } from '../world/collision';
import { desenharChaoDecor, desenharMoveisDecor } from './LanHouseDecorRenderer';
import { desenharChaoMobiliario, desenharMobiliario, desenharSofaPx } from './LanHouseMobiliarioRenderer';
import { MapaProfundidade, ObjetoProfundo } from './LanHouseDepth';
export type { ObjetoProfundo };
import { desenharAvenidaChao, desenharEstacionados } from './LanHouseTrafficRenderer';

/**
 * RENDERIZADOR DO MAPA 96x64 (tiles de 32px) — camadas: chão, móveis, PCs/melhorias,
 * paredes slim, iluminação. Chão/móveis/paredes são pré-renderizados em caches.
 */

export { TILE_SIZE };

const PX_OUTLINE = '#261d2e';
const PX_WALL_SLIM = '#262a4f'; // parede escura (azul-noite); o brilho neon vem do filete da sala
const PX_WALL_OUTLINE = '#0d0a1e';
const PX_GLASS_WALL = '#5eb8ea';
const PX_SHADOW = 'rgba(12, 8, 28, 0.38)';

/** Hash determinístico (mesma textura a cada reconstrução do cache, sem Math.random) */
function hash2(a: number, b: number): number {
  return (Math.imul(a + 1, 73856093) ^ Math.imul(b + 1, 19349663)) >>> 0;
}

/** '#rrggbb' + alpha -> 'rgba(...)' (translúcido: nunca grava profundidade) */
function rgbaHex(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
}

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
        const hs = hash2(tx / TILE_SIZE, ty / TILE_SIZE);
        pxRect(ctx, tx + 2, ty + 2, tw, th, tileFace);
        // variação sutil por placa (1 em cada 4 recebe um véu mais claro)
        if (hs % 4 === 0) pxRect(ctx, tx + 2, ty + 2, tw, th, 'rgba(255, 255, 255, 0.045)');
        pxRect(ctx, tx + 2, ty + 2, tw, 2, tileHighlight);
        // chanfro: sombra na borda inferior/direita
        pxRect(ctx, tx + 2, ty + 2 + th - 2, tw, 2, 'rgba(10, 8, 30, 0.22)');
        pxRect(ctx, tx + 2 + tw - 2, ty + 4, 2, th - 4, 'rgba(10, 8, 30, 0.14)');
        // brilho de verniz em placas alternadas
        if (hs % 7 === 0 && tw > 12) {
          pxRect(ctx, tx + 8, ty + 8, 6, 2, 'rgba(255, 255, 255, 0.10)');
          pxRect(ctx, tx + 8, ty + 10, 2, 4, 'rgba(255, 255, 255, 0.10)');
        }
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
        // veios da madeira + sombra da junta
        const hs = hash2(Math.floor(tx / 2), rowIdx + Math.floor(ty / 64));
        pxRect(ctx, drawX + 4 + (hs % 14), ty + 6, 6 + ((hs >>> 5) % 8), 2, 'rgba(60, 30, 20, 0.22)');
        if (hs % 3 === 0) pxRect(ctx, drawX + 8 + ((hs >>> 9) % 10), ty + 10, 4, 2, 'rgba(255, 220, 190, 0.08)');
        pxRect(ctx, drawX, ty + plankH - 4, drawW, 2, 'rgba(30, 14, 12, 0.20)');
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

// Estação Ramen / Cup Noodles + Balcão de Atendimento Lanchonete (Bomboniere)
function drawLanchoneteCounter(ctx: CanvasRenderingContext2D, xWall: number, yWall: number) {
  // 1. Bancada de parede traseira (micro-ondas, máquina de café expresso e cup noodles)
  pxRect(ctx, xWall, yWall + 14, 152, 4, PX_SHADOW);
  pxBox(ctx, xWall, yWall, 152, 16, '#475569', PX_OUTLINE, 2);
  pxRect(ctx, xWall + 3, yWall + 3, 146, 5, '#64748b');
  // Máquina de café expresso (esquerda)
  pxBox(ctx, xWall + 6, yWall - 10, 24, 16, '#1e293b', PX_OUTLINE, 2);
  pxRect(ctx, xWall + 9, yWall - 7, 18, 6, '#e2e8f0');
  pxRect(ctx, xWall + 12, yWall + 1, 4, 4, '#f59e0b');
  pxRect(ctx, xWall + 20, yWall + 1, 4, 4, '#38bdf8');
  // Micro-ondas digital (centro)
  pxBox(ctx, xWall + 38, yWall - 8, 28, 14, '#e2e8f0', PX_OUTLINE, 2);
  pxRect(ctx, xWall + 41, yWall - 5, 14, 8, '#38bdf8');
  pxRect(ctx, xWall + 57, yWall - 5, 6, 8, '#334155');
  // Cup Noodles + Bebidas (direita)
  pxBox(ctx, xWall + 74, yWall - 10, 22, 16, '#cbd5e1', PX_OUTLINE, 2);
  pxBox(ctx, xWall + 100, yWall - 6, 10, 10, '#ef4444', PX_OUTLINE, 2);
  pxRect(ctx, xWall + 102, yWall - 4, 6, 2, '#fef08a');
  pxBox(ctx, xWall + 114, yWall - 6, 10, 10, '#f97316', PX_OUTLINE, 2);
  pxBox(ctx, xWall + 128, yWall - 8, 18, 12, '#0284c7', PX_OUTLINE, 2);
  pxRect(ctx, xWall + 131, yWall - 5, 12, 5, '#bae6fd');

  // 2. Balcão frontal de atendimento (x: 13.8..18.8, y: 16.3..17.2) com vitrine de salgados e caixa PIX
  const bx = t(13.8);
  const by = t(16.3);
  const bw = t(5.0);
  const bh = t(0.9);
  pxRect(ctx, bx + 2, by + bh, bw - 2, 4, PX_SHADOW);
  pxBox(ctx, bx, by, bw, bh, '#8c5832', PX_OUTLINE, 2);
  pxRect(ctx, bx + 4, by + 3, bw - 8, bh - 9, '#c88a4b');
  pxRect(ctx, bx + 4, by + bh - 5, bw - 8, 3, '#f472b6'); // filete neon rosa do balcão
  // Caixa registradora & tela PIX na ponta esquerda (Slot 0 da fila)
  pxBox(ctx, bx + 10, by - 8, 28, 18, '#1e293b', PX_OUTLINE, 2);
  pxRect(ctx, bx + 13, by - 5, 22, 9, '#38bdf8');
  pxRect(ctx, bx + 16, by - 3, 8, 5, '#f8fafc');
  pxBox(ctx, bx + 42, by + 4, 16, 10, '#e2e8f0', OUT_FALLBACK, 2); // bandeja de retirada
  // Vitrine envidraçada de salgados, pizza e doces (direita)
  pxBox(ctx, bx + 66, by - 4, bw - 76, bh - 4, '#334155', '#7dd3fc', 2);
  pxRect(ctx, bx + 70, by, bw - 84, bh - 12, 'rgba(186, 230, 253, 0.32)');
  // Pizzas, coxinhas e bolos dentro da vitrine
  [0, 1, 2, 3].forEach((i) => {
    const sx = bx + 72 + i * 18;
    pxRect(ctx, sx, by + 4, 12, 8, i % 2 === 0 ? '#f59e0b' : '#ef4444');
    pxRect(ctx, sx + 2, by + 6, 8, 4, i % 2 === 0 ? '#fde047' : '#fca5a5');
  });
}

const OUT_FALLBACK = '#261d2e';

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
  inf_eletrica: { x: 37 * 32, y: 7 * 32 },
  inf_seguranca: { x: 40 * 32, y: 46 * 32 },
  inf_ar: { x: 40 * 32, y: 28 * 32 },
  eq_pcs: { x: 29 * 32, y: 26 * 32 },
  eq_print: { x: 45 * 32, y: 47 * 32 },
  eq_console: { x: 73.5 * 32, y: 42 * 32 },
  eq_monitor: { x: 73.5 * 32, y: 24 * 32 },
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
  fonte = '700 11px "Inter", sans-serif'
) {
  // halo neon em degraus (translúcido: não grava profundidade)
  [6, 3].forEach((o, i) => pxRect(ctx, cx - w / 2 - o, y - o, w + o * 2, 22 + o * 2, rgbaHex(cor, i === 0 ? 0.09 : 0.15)));
  pxBox(ctx, cx - w / 2, y, w, 22, '#120d26', cor, 2);
  pxRect(ctx, cx - w / 2 + 4, y + 4, w - 8, 2, 'rgba(255,255,255,0.12)');
  ctx.font = fonte;
  ctx.textAlign = 'center';
  // brilho do tubo + texto nítido
  ctx.fillStyle = rgbaHex(cor, 0.35);
  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => ctx.fillText(texto, cx + dx, y + 16 + dy));
  ctx.fillStyle = cor;
  ctx.fillText(texto, cx, y + 16);
  ctx.textAlign = 'start';
}

/** Letreiro neon com trechos de cores diferentes (halo e brilho por trecho) */
function drawNeonSignMulti(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  partes: Array<{ texto: string; cor: string }>,
  borda: string,
  fonte = '700 13px "Inter", sans-serif'
) {
  ctx.font = fonte;
  const gap = 6;
  const larguras = partes.map((p) => Math.round(ctx.measureText(p.texto).width));
  const total = larguras.reduce((a, b) => a + b, 0) + gap * (partes.length - 1);
  const w = total + 28;
  const x0 = Math.round(cx - w / 2);
  [6, 3].forEach((o, i) => pxRect(ctx, x0 - o, y - o, w + o * 2, 26 + o * 2, rgbaHex(borda, i === 0 ? 0.09 : 0.15)));
  pxBox(ctx, x0, y, w, 26, '#120d26', borda, 2);
  pxRect(ctx, x0 + 4, y + 4, w - 8, 2, 'rgba(255,255,255,0.12)');
  ctx.textAlign = 'left';
  let px = x0 + 14;
  partes.forEach((p, i) => {
    pxRect(ctx, px - 3, y + 4, larguras[i] + 6, 18, rgbaHex(p.cor, 0.10)); // brilho do trecho
    ctx.fillStyle = rgbaHex(p.cor, 0.35);
    [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dx, dy]) => ctx.fillText(p.texto, px + dx, y + 18 + dy));
    ctx.fillStyle = p.cor;
    ctx.fillText(p.texto, px, y + 18);
    px += larguras[i] + gap;
  });
}

/** Câmera de CFTV presa à fachada */
function drawCftv(ctx: CanvasRenderingContext2D, x: number, y: number, dir: 1 | -1) {
  pxRect(ctx, x, y + 8, 12, 2, 'rgba(8, 4, 24, 0.30)');
  pxBox(ctx, x, y, 12, 8, '#cbd5e1', PX_OUTLINE, 2);
  pxRect(ctx, dir === 1 ? x + 8 : x, y + 2, 4, 4, '#0b1220'); // lente
  pxRect(ctx, dir === 1 ? x + 2 : x + 8, y + 2, 2, 2, 'rgba(248, 113, 113, 0.9)'); // LED
}

/** Totem de TV do torneio */
function drawTvTorneio(ctx: CanvasRenderingContext2D, x: number, y: number) {
  pxRect(ctx, x - 6, y - 6, 68, 48, 'rgba(34, 211, 238, 0.07)'); // halo da tela
  pxRect(ctx, x - 3, y - 3, 62, 42, 'rgba(34, 211, 238, 0.10)');
  pxRect(ctx, x + 2, y + 32, 56, 4, 'rgba(8, 4, 24, 0.32)');
  pxBox(ctx, x, y, 56, 30, '#161225', '#22d3ee', 2);
  pxRect(ctx, x + 4, y + 4, 48, 6, '#22d3ee');
  pxRect(ctx, x + 4, y + 12, 48, 12, '#0b1220');
  pxRect(ctx, x + 8, y + 14, 18, 2, '#f472b6');
  pxRect(ctx, x + 8, y + 18, 26, 2, '#facc15');
  pxRect(ctx, x + 8, y + 22, 14, 2, '#4ade80');
  pxRect(ctx, x + 4, y + 4, 48, 2, 'rgba(255,255,255,0.28)');
  pxRect(ctx, x + 10, y + 30, 6, 6, '#475569'); // pés
  pxRect(ctx, x + 40, y + 30, 6, 6, '#475569');
  ctx.font = '700 8px "Inter", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillStyle = '#0b1220';
  ctx.fillText('TORNEIO', x + 28, y + 10);
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

/** Reflexo e linhas de varredura sobre a tela (translúcidos) */
function brilhoTela(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, ligada: boolean) {
  pxRect(ctx, x, y, 4, 2, 'rgba(255, 255, 255, 0.30)');
  pxRect(ctx, x, y + 2, 2, 2, 'rgba(255, 255, 255, 0.18)');
  if (ligada) for (let k = 4; k < h; k += 4) pxRect(ctx, x, y + k, w, 2, 'rgba(255, 255, 255, 0.07)');
  // luz da tela projetada na mesa + halo em 2 degraus ao redor do monitor (translúcido)
  if (ligada) {
    pxRect(ctx, x - 2, y + h + 4, w + 4, 2, 'rgba(120, 190, 255, 0.22)');
    pxRect(ctx, x - 4, y - 4, w + 8, h + 8, 'rgba(96, 190, 255, 0.07)');
    pxRect(ctx, x - 2, y - 2, w + 4, h + 4, 'rgba(120, 210, 255, 0.12)');
  }
}

// PC evolutivo por nível: Básico → Intermediário → Gaming → VIP Station
function drawPcStation(
  ctx: CanvasRenderingContext2D,
  mx: number,
  my: number,
  tick: number,
  pc: Computador,
  nivelPcs: number,
  nivelMonitor: number,
  eventoPc?: EstadoPcHypeVisual
) {
  const tier = TIER_PC[pc.categoria] ?? (pc.area === 'VIP' ? 3 : 0);
  const flashRapido = eventoPc ? Math.floor(tick / 3) % 2 === 0 : false;
  const rgb = eventoPc
    ? eventoPc.tipo === 'LOUCURA'
      ? flashRapido
        ? '#ef4444'
        : '#facc15'
      : flashRapido
      ? '#facc15'
      : '#22d3ee'
    : RGB_CICLO[(Math.floor(tick / 8) + pc.numero) % RGB_CICLO.length];
  const manut = pc.status === 'MANUTENCAO';
  const shakeX =
    eventoPc && (eventoPc.tipo === 'LOUCURA' ? (Math.floor(tick / 2) + pc.numero) % 2 === 0 ? -1 : 1 : tick % 4 < 2 ? -1 : 0);
  const monX = mx + (shakeX || 0);

  const deskCor = ['#9b7048', '#6d5a82', '#3b2d54', '#2a1f45'][tier];
  const deskTop = ['#c08c58', '#8a77a3', '#4c3a6e', '#3c2d63'][tier];
  pxRect(ctx, mx - 18, my + 10, 40, 4, PX_SHADOW);
  pxBox(ctx, mx - 18, my - 8, 40, 20, deskCor, tier === 3 ? '#facc15' : PX_OUTLINE, 2);
  pxRect(ctx, mx - 14, my - 4, 32, 10, deskTop);
  pxRect(ctx, mx - 14, my - 4, 32, 2, 'rgba(255, 255, 255, 0.14)'); // reflexo do tampo
  pxRect(ctx, mx - 14, my + 4, 32, 2, 'rgba(8, 4, 24, 0.18)'); // borda frontal

  // Faixa RGB sob a mesa (Gaming/VIP, melhoria nível 4+, ou surto de kill-streak/loucura)
  if (tier >= 2 || nivelPcs >= 4 || eventoPc) {
    pxRect(ctx, mx - 16, my + 10, 36, 2, eventoPc ? rgb : tier === 3 ? '#facc15' : rgb);
  }
  // Teclado e mouse ativos durante partida / spam frenético em kill-streak
  const mouseJiggle =
    pc.status === 'OCUPADO'
      ? eventoPc
        ? (tick + pc.numero) % 4 < 2
          ? -1
          : 1
        : (tick + pc.numero * 7) % 16 < 8
        ? 0
        : 1
      : 0;
  pxRect(ctx, mx + 6, my, 8, 6, 'rgba(8, 4, 24, 0.28)'); // mousepad
  pxRect(ctx, mx - 8, my + 2, 14, 3, eventoPc ? rgb : tier >= 2 ? rgb : '#1e293b');
  for (let k = 0; k < 6; k++) {
    const keyFlash =
      pc.status === 'OCUPADO' && ((Math.floor(tick / (eventoPc ? 2 : 6)) + k + pc.numero) % 5 === 0);
    pxRect(
      ctx,
      mx - 7 + k * 2,
      my + 3,
      2,
      2,
      keyFlash ? (eventoPc ? '#fde047' : '#38bdf8') : 'rgba(255, 255, 255, 0.22)'
    );
  }
  pxRect(ctx, mx + 8 + mouseJiggle, my + 2, 3, 3, eventoPc ? '#facc15' : tier >= 1 ? '#38bdf8' : '#334155');

  // Gabinete
  const towerCor = ['#1e293b', '#334155', '#475569', '#3b2d54'][tier];
  pxBox(ctx, mx + 12, my - 12, 8, 18, towerCor, eventoPc ? rgb : tier === 3 ? '#facc15' : PX_OUTLINE, 2);
  if (manut) {
    pxRect(ctx, mx + 14, my - 8, 4, 6, tick % 14 < 7 ? '#ef4444' : '#7f1d1d');
  } else if (eventoPc) {
    pxRect(ctx, mx + 14, my - 10, 4, 4, rgb);
    pxRect(ctx, mx + 14, my - 4, 4, 4, flashRapido ? '#fde047' : '#ef4444');
  } else if (tier === 0) {
    pxRect(ctx, mx + 14, my - 6, 2, 2, '#22c55e');
  } else if (tier === 1) {
    pxRect(ctx, mx + 14, my - 8, 4, 4, '#22d3ee');
  } else {
    pxRect(ctx, mx + 14, my - 10, 4, 4, rgb);
    pxRect(ctx, mx + 14, my - 4, 4, 4, RGB_CICLO[(Math.floor(tick / 8) + pc.numero + 2) % 5]);
  }

  // Cores e conteúdo dinâmico da tela por status
  let tela = '#22c55e';
  if (pc.status === 'OCUPADO') {
    if (eventoPc) {
      tela =
        eventoPc.tipo === 'LOUCURA'
          ? flashRapido
            ? '#dc2626'
            : '#facc15'
          : flashRapido
          ? '#facc15'
          : '#06b6d4';
    } else {
      tela = (tick + pc.numero * 5) % 24 < 12 ? '#0284c7' : '#4f46e5';
    }
  } else if (manut) {
    tela = tick % 14 < 7 ? '#ea580c' : '#dc2626';
  }

  const desenharJogoTela = (sx: number, sy: number, sw: number, sh: number) => {
    pxRect(ctx, sx, sy, sw, sh, tela);
    if (pc.status !== 'OCUPADO') return;
    if (eventoPc) {
      // Clarão de kill-streak / explosão no monitor + barras de combo pixel art
      pxRect(ctx, sx + 2, sy + 1, Math.max(4, sw - 4), 2, '#ffffff');
      const cx = sx + Math.floor(sw / 2);
      const cy = sy + Math.floor(sh / 2);
      pxRect(ctx, cx - 2, cy - 1, 4, 3, flashRapido ? '#ffffff' : '#fde047');
      pxRect(ctx, sx + 1, sy + sh - 2, Math.max(4, sw - 2), 1, '#ef4444');
    } else {
      // Cena de jogo dinâmica: mira/personagem se mexendo e HUD colorido
      const alvoX = sx + 2 + ((Math.floor(tick / 7) + pc.numero * 3) % Math.max(2, sw - 5));
      const alvoY = sy + 2 + ((Math.floor(tick / 11) + pc.numero) % Math.max(2, sh - 4));
      pxRect(ctx, sx + 1, sy + 1, Math.max(3, Math.floor(sw * 0.4)), 1, '#4ade80');
      pxRect(ctx, alvoX, alvoY, 2, 2, (tick + pc.numero) % 10 < 3 ? '#facc15' : '#f8fafc');
    }
    brilhoTela(ctx, sx, sy, sw, sh, true);
  };

  const bonus = nivelMonitor >= 3 ? 2 : 0;
  const rim = eventoPc ? rgb : ['#475569', '#3b82f6', '#22d3ee', '#facc15'][tier];
  if (tier === 0) {
    pxBox(ctx, monX - 10, my - 12, 18 + bonus, 12, '#334155', eventoPc ? rim : PX_OUTLINE, 2);
    desenharJogoTela(monX - 6, my - 8, 10 + bonus, 6);
  } else if (tier === 1) {
    pxBox(ctx, monX - 11, my - 14, 20 + bonus, 14, '#334155', rim, 2);
    desenharJogoTela(monX - 7, my - 10, 12 + bonus, 8);
  } else if (tier === 2) {
    pxBox(ctx, monX - 12, my - 15, 22 + bonus, 14, '#1e293b', rim, 2);
    desenharJogoTela(monX - 8, my - 11, 14 + bonus, 8);
    pxBox(ctx, monX - 20, my - 16, 8, 16, '#1e293b', rim, 2);
    pxRect(ctx, monX - 18, my - 12, 4, 8, pc.status === 'OCUPADO' ? rgb : '#334155');
  } else {
    pxBox(ctx, monX - 12, my - 16, 24 + bonus, 15, '#1e1b2e', rim, 2);
    desenharJogoTela(monX - 8, my - 12, 16 + bonus, 9);
    pxBox(ctx, monX - 22, my - 14, 10, 13, '#1e1b2e', rim, 2);
    pxRect(ctx, monX - 20, my - 10, 6, 7, pc.status === 'OCUPADO' ? (eventoPc ? rgb : '#a855f7') : '#334155');
    pxBox(ctx, monX + 12, my - 14, 10, 4, '#1e1b2e', rim, 2);
  }
}



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

function drawPixelGamingChair(
  ctx: CanvasRenderingContext2D,
  sx: number,
  sy: number,
  ehVip: boolean,
  tick = 0,
  eventoPc?: EstadoPcHypeVisual
) {
  const jx = eventoPc
    ? (Math.floor(tick / 2) % 2 === 0 ? -2 : 2) * (eventoPc.tipo === 'LOUCURA' ? 1 : 0.5)
    : 0;
  const rx = snap2(sx + jx);
  const ry = snap2(sy);
  const main = ehVip ? '#7e22ce' : '#2563eb';
  const trim = eventoPc ? (Math.floor(tick / 4) % 2 === 0 ? '#facc15' : '#ef4444') : ehVip ? '#facc15' : '#38bdf8';
  pxRect(ctx, rx - 9, ry + 5, 18, 4, PX_SHADOW);
  pxBox(ctx, rx - 9, ry - 5, 18, 10, main, eventoPc ? trim : PX_OUTLINE, 2);
  pxRect(ctx, rx - 5, ry - 3, 2, 6, trim);
  pxRect(ctx, rx + 3, ry - 3, 2, 6, trim);
  pxRect(ctx, rx - 7, ry - 3, 14, 2, 'rgba(255, 255, 255, 0.22)'); // apoio de cabeça
  pxRect(ctx, rx - 11, ry - 1, 2, 6, '#1e1b2e'); // apoios de braço
  pxRect(ctx, rx + 9, ry - 1, 2, 6, '#1e1b2e');
  pxRect(ctx, rx - 7, ry + 5, 2, 2, '#0f172a'); // rodízios
  pxRect(ctx, rx + 5, ry + 5, 2, 2, '#0f172a');
}

function fillCarpet(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, base: string, spec: string) {
  pxRect(ctx, x, y, w, h, base);
  for (let ty = y; ty < y + h; ty += TILE_SIZE) {
    for (let tx = x; tx < x + w; tx += TILE_SIZE) {
      // placas de carpete modular: junta fina escura + fio de luz no topo
      const lw = Math.min(TILE_SIZE, x + w - tx);
      const lh = Math.min(TILE_SIZE, y + h - ty);
      pxRect(ctx, tx, ty, lw, 2, 'rgba(8, 6, 24, 0.30)');
      pxRect(ctx, tx, ty, 2, lh, 'rgba(8, 6, 24, 0.30)');
      pxRect(ctx, tx + 2, ty + 2, Math.max(2, lw - 2), 2, 'rgba(160, 140, 255, 0.05)');
      ctx.fillStyle = spec;
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
      const lw = Math.min(TILE_SIZE, x + w - tx);
      const lh = Math.min(TILE_SIZE, y + h - ty);
      const hs = hash2(tx / TILE_SIZE, ty / TILE_SIZE);
      pxRect(ctx, tx, ty, lw, 2, seam);
      pxRect(ctx, tx, ty, 2, lh, seam);
      pxRect(ctx, tx + 2, ty + 2, Math.max(2, lw - 2), 2, 'rgba(255, 255, 255, 0.035)');
      // manchas e grãos de concreto
      if (hs % 3 === 0) pxRect(ctx, tx + 4 + (hs % 18), ty + 6 + ((hs >>> 6) % 16), 8, 4, 'rgba(0, 0, 0, 0.09)');
      if (hs % 5 === 0) pxRect(ctx, tx + 10 + ((hs >>> 4) % 12), ty + 14 + ((hs >>> 9) % 10), 2, 2, 'rgba(255, 255, 255, 0.10)');
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

function drawSofa(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, cor: string) {
  // mesmo estilo dos sofás do mobiliário (encosto, almofadas, braços)
  desenharSofaPx(ctx, x, y, w, h, cor, w < h ? (x > WORLD_W / 2 ? 'E' : 'W') : 'N');
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
let mapaProf: MapaProfundidade | null = null;
let cacheParedes: HTMLCanvasElement | null = null;
const CACHE_VERSION = 81;
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

/** Luz ambiente do neon da sala: faixas escalonadas (estilo pixel art) junto às paredes, só no chão */
function luzDeBorda(f: CanvasRenderingContext2D, x: number, y: number, w: number, w2: number, cor: string) {
  const alphas = [0.16, 0.09, 0.045];
  alphas.forEach((a, k) => {
    const o = 6 + k * 6; // começa depois da meia-espessura da parede
    const c = rgbaHex(cor, a);
    pxRect(f, x + o, y + o, w - o * 2, 6, c);
    pxRect(f, x + o, y + w2 - o - 6, w - o * 2, 6, c);
    pxRect(f, x + o, y + o + 6, 6, w2 - o * 2 - 12, c);
    pxRect(f, x + w - o - 6, y + o + 6, 6, w2 - o * 2 - 12, c);
  });
}

/** Faixa de segurança amarela e preta em diagonal (degraus de 2 px), recortada em [x, x+w] */
function faixaHazard(f: CanvasRenderingContext2D, x: number, y: number, w: number, h = 8) {
  for (let r = 0; r < h; r += 2) {
    for (let i = -h; i < w + 16; i += 16) {
      const sx = x + i + r;
      const a = Math.max(x, sx);
      const b = Math.min(x + w, sx + 8);
      if (b > a) pxRect(f, a, y + r, b - a, 2, '#facc15');
      const c = Math.max(x, sx + 8);
      const d = Math.min(x + w, sx + 16);
      if (d > c) pxRect(f, c, y + r, d - c, 2, '#171717');
    }
  }
  pxRect(f, x, y, w, 2, 'rgba(255,255,255,0.18)');
  pxRect(f, x, y + h, w, 2, 'rgba(8, 4, 24, 0.35)');
}

/** Passadeira clara com placas, filetes e tracejado neon (contraste com personagens e móveis escuros) */
function passadeiraNeon(f: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  pxBox(f, x, y, w, h, '#4f5d82', '#38bdf8', 2);
  for (let ty = y + 4; ty < y + h - 4; ty += TILE_SIZE) {
    for (let tx = x + 4; tx < x + w - 4; tx += TILE_SIZE) {
      const alt = (Math.round((tx - x) / TILE_SIZE) + Math.round((ty - y) / TILE_SIZE)) % 2 === 0;
      const tw = Math.min(TILE_SIZE - 2, x + w - 4 - tx);
      const th = Math.min(TILE_SIZE - 2, y + h - 4 - ty);
      if (tw > 2 && th > 2) {
        pxRect(f, tx, ty, tw, th, alt ? '#6c7ca6' : '#62729b');
        pxRect(f, tx, ty, tw, 2, 'rgba(255,255,255,0.12)');
      }
    }
  }
  // filetes de borda e tracejado central em ciano
  pxRect(f, x + 4, y + 4, 2, h - 8, 'rgba(34, 211, 238, 0.55)');
  pxRect(f, x + w - 6, y + 4, 2, h - 8, 'rgba(34, 211, 238, 0.55)');
  for (let ty = y + 12; ty < y + h - 16; ty += TILE_SIZE) pxRect(f, x + Math.round(w / 2) - 1, ty, 2, 12, 'rgba(34, 211, 238, 0.6)');
}

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
  if (s.tipo !== 'EXPANSAO' && s.tipo !== 'CORREDOR' && s.tipo !== 'SERVICO') luzDeBorda(f, x, y, w, h, s.cor);
}

function construirChao() {
  const { c, x: f } = novoCanvas();

  // Quintal em xadrez
  pxRect(f, 0, 0, WORLD_W, WORLD_H, '#1c3a31');
  for (let ty = 0; ty < WORLD_H / TILE_SIZE; ty++) {
    for (let tx = 0; tx < WORLD_W / TILE_SIZE; tx++) {
      if ((tx + ty) % 2 === 0) pxRect(f, tx * TILE_SIZE, ty * TILE_SIZE, TILE_SIZE, TILE_SIZE, '#234537');
      // tufos de grama (escuros/claros), fora da área construída o suficiente para não competir com o mapa
      const hs = hash2(tx, ty);
      if (hs % 3 === 0) pxRect(f, tx * TILE_SIZE + (hs % 26), ty * TILE_SIZE + ((hs >>> 6) % 26), 2, 4, 'rgba(10, 40, 30, 0.45)');
      if (hs % 5 === 0) pxRect(f, tx * TILE_SIZE + ((hs >>> 3) % 26), ty * TILE_SIZE + ((hs >>> 9) % 26), 4, 2, 'rgba(120, 220, 140, 0.10)');
    }
  }

  // Calçada (y 52..56) e rua (y 56..64)
  fillCeramicTiles32x32(f, 0, t(52), WORLD_W, t(4), '#2f2945', '#443d63', '#544c78');
  desenharAvenidaChao(f); // meio-fio, faixas, zebra, setas e linhas de retenção

  // Halo neon da fachada sobre a calçada (faixas escalonadas, translúcidas)
  [0.12, 0.07, 0.035].forEach((al, k) => {
    pxRect(f, t(4), t(52) + 4 + k * 8, t(80), 8, `rgba(120, 200, 255, ${al})`);
  });
  pxRect(f, t(4), t(52) + 4, t(80), 2, 'rgba(180, 120, 255, 0.35)');

  // Sombra do complexo
  pxRect(f, t(4) - 6, t(4) - 6, t(80) + 12, t(48) + 12, 'rgba(20, 14, 28, 0.35)');

  SALAS.forEach((s) => pisoDaSala(f, s));

  // Passadeiras neon
  passadeiraNeon(f, t(39), t(15.3), t(2), t(29.4)); // espinha do salão
  passadeiraNeon(f, t(60.7), t(15.3), t(1.6), t(36.4)); // corredor leste
  pxBox(f, t(38.5), t(45.3), t(3), t(6.6), '#7a2f45', '#e09f87', 2); // recepção
  pxBox(f, t(5), t(13.4), t(78), 4, '#facc15', '#facc15', 2); // faixa amarela de serviço

  // Corredor de serviço: faixa de segurança junto à parede norte (com folga nas portas) e sinalização
  {
    const sv = SALAS.find((s) => s.id === 'servico');
    if (sv) {
      const y0 = t(sv.y) + 6;
      const vaos = PORTAS.filter((p) => p.orientacao === 'H' && Math.abs(p.y - sv.y) < 0.6)
        .map((p) => [t(p.x - p.largura / 2 - 0.7), t(p.x + p.largura / 2 + 0.7)] as [number, number])
        .sort((a, b) => a[0] - b[0]);
      let cur = t(sv.x) + 8;
      const fim = t(sv.x + sv.w) - 8;
      vaos.forEach(([a, b]) => {
        if (a > cur) faixaHazard(f, cur, y0, Math.min(a, fim) - cur);
        cur = Math.max(cur, b);
      });
      if (fim > cur) faixaHazard(f, cur, y0, fim - cur);
      // texto pintado no piso e setas de saída
      f.font = '700 8px "Inter", sans-serif';
      f.textAlign = 'center';
      f.fillStyle = 'rgba(248, 250, 252, 0.55)';
      const yTxt = t(sv.y + 1.97); // entre a faixa amarela e o tracejado, sem sobrepor nenhum dos dois
      [76].forEach((tx) => f.fillText('ÁREA RESTRITA · SOMENTE EQUIPE', t(tx), yTxt));
      f.fillStyle = 'rgba(250, 204, 21, 0.60)';
      [14, 40].forEach((tx) => f.fillText('› › ›  SAÍDA DE EMERGÊNCIA', t(tx), yTxt));
      f.textAlign = 'start';
    }
  }

  // Tapete da praça de alimentação (bomboniere), fila de pedidos, baia da empilhadeira e ringue da arena
  desenharChaoDecor(f);
  desenharChaoMobiliario(f); // tapetes

  // Praça de alimentação (tapete sutil delimitando o grid 2x2 alinhado)
  pxBox(f, t(6.1), t(21.8), t(11.8), t(7.3), 'rgba(244, 114, 182, 0.06)', 'rgba(244, 114, 182, 0.35)', 2);
  // Faixa de fila no balcão da lanchonete
  pxBox(f, t(14.3), t(17.55), t(4.6), t(1.1), '#2a1b36', '#f472b6', 2);
  [14.8, 16.0, 17.2, 18.4].forEach((fx, i) => {
    pxRect(f, t(fx) - 6, t(18.0) - 2, 12, 4, i === 0 ? 'rgba(74, 222, 128, 0.38)' : 'rgba(244, 114, 182, 0.25)');
  });
  f.font = '700 7px "Inter", sans-serif';
  f.textAlign = 'center';
  f.fillStyle = 'rgba(244, 114, 182, 0.85)';
  f.fillText('◄  FILA PEDIDOS', t(16.8), t(18.52));
  f.textAlign = 'start';

  // Baia de manobra da empilhadeira no Estoque
  pxBox(f, t(57.4), t(6.65), t(5.7), t(2.05), 'rgba(250, 204, 21, 0.07)', 'rgba(250, 204, 21, 0.45)', 2);
  f.font = '700 7px "Inter", sans-serif';
  f.textAlign = 'center';
  f.fillStyle = 'rgba(250, 204, 21, 0.70)';
  f.fillText('CARGA / DESCARGA', t(60.25), t(8.62));
  f.textAlign = 'start';

  // Zona de Treino (Tatame de Lutas) na Arena
  pxBox(f, t(67.6), t(42.2), t(5.0), t(2.8), '#3b1d2e', '#facc15', 2);
  for (let tx = 0; tx < 5; tx++) {
    for (let ty = 0; ty < 3; ty++) {
      const mCor = (tx + ty) % 2 === 0 ? '#7f1d1d' : '#1e293b';
      pxRect(f, t(67.7 + tx * 0.96), t(42.3 + ty * 0.86), 28, 24, mCor);
    }
  }

  // Ringue / Octógono Oficial de Lutas na Arena (75.2..83.2, y=36.6..45.4)
  pxBox(f, t(75.2), t(36.6), t(8.0), t(8.8), '#0f172a', '#facc15', 2); // borda/apron externo
  pxRect(f, t(75.4), t(36.8), t(7.6), t(8.4), '#1e293b'); // moldura do tatame
  pxBox(f, t(75.7), t(37.1), t(7.0), t(7.8), '#312e81', '#e2e8f0', 2); // lona azul-noite + linha branca
  // Cantoneiras Vermelha (Oeste) e Azul (Leste) no chão do ringue
  pxRect(f, t(75.7) + 4, t(37.1) + 4, 28, 28, 'rgba(220, 38, 38, 0.35)');
  pxRect(f, t(75.7) + 4, t(44.9) - 32, 28, 28, 'rgba(220, 38, 38, 0.35)');
  pxRect(f, t(82.7) - 32, t(37.1) + 4, 28, 28, 'rgba(37, 99, 235, 0.35)');
  pxRect(f, t(82.7) - 32, t(44.9) - 32, 28, 28, 'rgba(37, 99, 235, 0.35)');
  // Círculo central do ringue + emblema "ARENA"
  pxBox(f, t(78.0), t(39.8), t(2.4), t(2.4), '#1e1b4b', '#facc15', 2);
  pxRect(f, t(78.2), t(40.8), t(2.0), 4, 'rgba(250, 204, 21, 0.35)');
  f.font = '800 9px "Inter", sans-serif';
  f.textAlign = 'center';
  f.fillStyle = '#facc15';
  f.fillText('VS', t(79.2), t(41.1));
  f.textAlign = 'start';

  // Parede divisória entre Cantinho VIP (y=4..16) e Estacionamento Pago (y=16..52)
  pxBox(f, t(84), t(16) - 4, t(10), 8, '#3b3354', '#0f172a', 1.5);
  pxRect(f, t(84) + 2, t(16) - 1, t(10) - 4, 2, '#f43f5e');

  // ESTACIONAMENTO PAGO & PORTARIA (x=84..94, y=16..52) + Rampa sobre calçada (y=52..56)
  pxRect(f, t(84) + 2, t(16) + 4, t(10) - 4, t(36) - 4, '#1e2432');
  for (let py = t(16) + 8; py < t(52); py += 16) {
    for (let px = t(84) + 8; px < t(94) - 8; px += 16) {
      if ((Math.floor(px / 16) + Math.floor(py / 16)) % 2 === 0) {
        pxRect(f, px, py, 2, 2, 'rgba(255,255,255,0.03)');
      }
    }
  }
  // Rampa de acesso ligando a pista da rua (y=56) à entrada/saída do estacionamento (y=52)
  pxRect(f, t(88.35), t(52) - 4, t(5.4), t(4.25), '#1e2432');
  pxBox(f, t(88.22), t(52), 5, t(4.05), '#64748b', PX_OUTLINE, 1);
  pxBox(f, t(93.65), t(52), 5, t(4.05), '#64748b', PX_OUTLINE, 1);
  // Faixa de pedestre discreta na travessia da calçada
  for (let zx = t(88.6); zx < t(93.4); zx += 16) {
    pxRect(f, zx, t(52.35), 9, t(0.85), 'rgba(248, 250, 252, 0.36)');
  }

  // Corredor de patrulha do Guarda de Pátio (x=88.25)
  for (let py = t(19.0); py < t(45.5); py += 12) {
    pxRect(f, t(88.25), py, 3, 6, 'rgba(250, 204, 21, 0.55)');
  }

  // 8 Vagas numeradas (V01..V08) no lado Oeste (x=84.35..88.2)
  const yVagasTiles = [20.0, 23.3, 26.6, 29.9, 33.2, 36.5, 39.8, 43.1];
  yVagasTiles.forEach((yt, idx) => {
    const topY = t(yt - 1.45);
    const botY = t(yt + 1.45);
    pxRect(f, t(84.35), topY, t(3.85), 2, '#e2e8f0');
    pxRect(f, t(84.35), botY, t(3.85), 2, '#e2e8f0');
    pxRect(f, t(84.35), topY, 3, botY - topY + 2, '#94a3b8');
    f.font = '700 9px "Inter", sans-serif';
    f.textAlign = 'center';
    f.fillStyle = 'rgba(226, 232, 240, 0.42)';
    f.fillText(`V0${idx + 1}`, t(86.35), t(yt) + 3);
  });

  // Divisor central de fluxo duplo: pista Saída (x=89.65 ↓) | pista Entrada (x=92.25 ↑)
  for (let dy = t(19.2); dy < t(45.0); dy += 16) {
    pxRect(f, t(90.92), dy, 2, 9, 'rgba(248, 250, 252, 0.48)');
  }
  pxRect(f, t(90.88), t(46.2), 2, t(9.2), '#facc15');
  pxRect(f, t(91.02), t(46.2), 2, t(9.2), '#facc15');

  // Setas e demarcações de entrada (↑) e saída (↓)
  f.font = '700 11px "Inter", sans-serif';
  f.textAlign = 'center';
  f.fillStyle = 'rgba(74, 222, 128, 0.55)';
  [24, 34, 46, 53.5].forEach((ay) => f.fillText('↑', t(92.25), t(ay)));
  f.fillStyle = 'rgba(248, 113, 113, 0.55)';
  [24, 34, 46, 53.5].forEach((ay) => f.fillText('↓', t(89.65), t(ay)));
  f.font = '700 6.5px "Inter", sans-serif';
  f.fillStyle = 'rgba(226, 232, 240, 0.55)';
  f.fillText('ENTRADA', t(92.25), t(51.4));
  f.fillText('SAÍDA', t(89.65), t(51.4));
  f.textAlign = 'start';

  // Linhas de retenção das cancelas
  pxRect(f, t(91.15), t(50.7), t(2.2), 3, '#facc15');
  pxRect(f, t(88.5), t(47.9), t(2.2), 3, '#facc15');

  // Meio-fio de perímetro da Cantinho VIP (y=4..16) discreto
  for (let i = 0; i < t(10); i += 24) {
    pxRect(f, t(84) + i, t(4), 12, 4, '#f43f5e');
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

  // Porta principal: folhas de vidro com reflexo (translúcido, só chão)
  PORTAS.forEach((p) => {
    if (p.id !== 'porta_principal') return;
    const gx = t(p.x) - t(p.largura) / 2;
    const gy = t(p.y) - 8;
    const gw = t(p.largura);
    pxRect(f, gx, gy, gw / 2, 16, 'rgba(56, 189, 248, 0.38)');
    pxRect(f, gx + gw / 2, gy, gw / 2, 16, 'rgba(244, 114, 182, 0.32)');
    pxRect(f, gx, gy, gw, 2, 'rgba(255,255,255,0.55)');
    pxRect(f, gx, gy + 14, gw, 2, 'rgba(255,255,255,0.55)');
    pxRect(f, gx + gw / 2 - 1, gy, 2, 16, 'rgba(255,255,255,0.65)');
    [6, 40].forEach((dx) => {
      pxRect(f, gx + dx, gy + 4, 6, 2, 'rgba(255,255,255,0.28)');
      pxRect(f, gx + dx + 2, gy + 6, 6, 2, 'rgba(255,255,255,0.20)');
    });
  });
  // Poças de luz dos postes sobre a calçada (estáticas, em degraus)
  [8, 24, 48, 64, 85.2].forEach((tx) => {
    [[144, 40, 0.05], [96, 28, 0.06], [56, 16, 0.07]].forEach(([w, h, a]) => {
      pxRect(f, t(tx) - w / 2, t(55.4) - 22 - h / 2, w, h, `rgba(251, 191, 36, ${a})`);
    });
  });

  cacheChao = c;
}

function construirMoveis() {
  const { c, x: m } = novoCanvas();
  // Mapa de profundidade: cada retângulo opaco grava a sua linha de base (ver LanHouseDepth.ts)
  const prof = new MapaProfundidade(WORLD_W, WORLD_H);
  prof.anexar(m);

  // ---------------- EXTERIOR ----------------
  for (let bx = 24; bx < WORLD_W - 24; bx += 52) drawLushBush(m, bx, t(2.4), bx / 52);
  for (let by = t(5); by < t(51); by += 70) {
    drawLushBush(m, 24, by, by / 70);
    drawLushBush(m, WORLD_W - 28, by, by / 70 + 1);
  }
  [10, 30, 56, 80, 92].forEach((tx, i) => drawPixelExteriorTree(m, t(tx), t(2.6 + (i % 2) * 0.6)));
  [8, 24, 48, 64, 85.2].forEach((tx) => drawStreetLamp(m, t(tx), t(55.4)));
  drawBench(m, t(22) - 28, t(52.6));
  drawBench(m, t(56) - 28, t(52.6));
  drawCleanPlant(m, t(37.4), t(53.2));
  drawCleanPlant(m, t(42.6), t(53.2));
  drawFoodTruck(m, t(67), t(56.5));
  prof.plano(() =>
    drawNeonSignMulti(m, t(40), t(52.15) - 2, [
      { texto: 'L@N HOUSE', cor: '#4ade80' },
      { texto: '&', cor: '#f472b6' },
      { texto: 'ARENA', cor: '#22d3ee' },
    ], '#c084fc')
  );
  drawTvTorneio(m, t(33.4), t(52.7));
  drawCftv(m, t(20.3), t(52.45), 1);
  drawCftv(m, t(59.2), t(52.45), -1);

  // ---------------- ESTÚDIO LIVE (x4..20,y4..12) ----------------
  prof.plano(() => pxBox(m, t(5), t(5), t(14), t(3.4), '#6a5f8a', PX_OUTLINE, 2)); // palco = chão
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
  prof.plano(() => {
    for (let i = 0; i < 5; i++) {
      pxRect(m, t(37.5 + i * 2), t(7.55), 3, 26, i % 2 === 0 ? '#38bdf8' : '#a855f7'); // cabos no chão
    }
    pxRect(m, t(37.5), t(7.55) + 26, t(8.2), 3, '#475569');
  });

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
  prof.plano(() => {
    for (let i = 0; i < 18; i++) {
      pxRect(m, t(6) + i * 54, t(14.5) + (i % 2) * 4, 36, 2, i % 3 === 0 ? '#a855f7' : '#22d3ee');
    }
  });

  // ---------------- BOMBONIERE (x4..20,y15..31) ----------------
  drawCleanVendingMachine(m, t(5.0), t(15.35));
  drawCleanVendingMachine(m, t(6.6), t(15.35));
  drawTallShelf(m, t(8.4), t(15.4), t(2.2), 44);
  drawLanchoneteCounter(m, t(14.0), t(15.35));
  prof.plano(() => drawNeonSign(m, t(16.4), t(15.05), 140, '🍕 LANCHONETE · CAFÉ', '#f472b6', '700 9px "Inter", sans-serif'));
  drawCleanPlant(m, t(4.8), t(29.6));
  drawCleanPlant(m, t(19.0), t(29.6));

  // ---------------- LOUNGE (x4..20,y31..52) ----------------
  drawCleanVendingMachine(m, t(5.2), t(31.7));
  prof.plano(() => drawNeonSign(m, t(12), t(50.6), 100, 'FLIPERAMAS', '#2dd4bf', '700 10px "Inter", sans-serif'));

  // ---------------- SALÃO GAMER (x20..60,y15..45) ----------------
  [[22, 'f472b6'], [26, '38bdf8'], [30, 'facc15'], [34, 'a855f7']].forEach(([px, cor], i) => {
    prof.plano(() => drawPoster(m, t(px as number), t(15.3), i % 2 === 0 ? '#' + cor : '#1e293b', '#' + cor));
  });
  [46, 50, 54].forEach((px, i) => drawPoster(m, t(px), t(15.3), i % 2 ? '#22d3ee' : '#f43f5e', '#facc15'));
  prof.plano(() => {
    drawLedStrip(m, t(21), t(16.7), t(18), '#22d3ee');
    drawLedStrip(m, t(41.2), t(16.7), t(18), '#f472b6');
  });
  [[21.3, 16.8], [58.7, 16.8], [21.3, 43.6], [58.7, 43.6]].forEach(([px, py]) => drawCleanPlant(m, t(px), t(py)));
  drawCleanVendingMachine(m, t(55.6), t(15.5));
  prof.plano(() => drawNeonSign(m, t(32), t(15.15), 150, 'GAMING ARENA', '#22d3ee', '700 11px "Inter", sans-serif'));
  prof.plano(() => drawNeonSign(m, t(49.5), t(28.95), 178, 'ESPERA & DESCANSO', '#38bdf8', '700 9px "Inter", sans-serif'));

  // ---------------- CORREDOR LESTE (x60..63) ----------------
  drawExtinguisher(m, t(60.2), t(16));
  drawCleanPlant(m, t(62.5), t(43.8));
  drawCleanPlant(m, t(60.5), t(31.6));
  drawBench(m, t(62.05), t(24), 28);

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
    pxBox(m, t(px), t(50.2), 6, 22, '#facc15', PX_OUTLINE, 2);
  });
  pxRect(m, t(26.5) + 6, t(50.2) + 8, t(3.5) - 6, 3, '#ef4444');
  pxRect(m, t(30) + 6, t(50.2) + 8, t(3.5) - 6, 3, '#ef4444');
  drawCleanPlant(m, t(21.6), t(50.8));
  drawCleanPlant(m, t(58.6), t(50.8));
  prof.plano(() => drawNeonSign(m, t(32), t(45.35), 120, 'CAIXA PIX', '#38bdf8', '700 10px "Inter", sans-serif'));

  // ---------------- VIP (x63..84,y15..33) ----------------
  prof.plano(() => drawNeonSign(m, t(73), t(15.25), 190, 'GAME ON VIP', '#e879f9', '700 14px "Inter", sans-serif'));
  prof.plano(() => drawPoster(m, t(65), t(15.3), '#a855f7', '#facc15'));
  prof.plano(() => drawPoster(m, t(79.6), t(15.3), '#f43f5e', '#22d3ee'));
  drawSofa(m, t(82.3), t(22.6), t(1.5), t(3.8), '#7e22ce');
  pxBox(m, t(81.5), t(24), 14, 30, '#3b2d54', '#facc15', 2);
  drawCleanPlant(m, t(64.8), t(31.4));
  drawCleanPlant(m, t(82.7), t(31.4));
  drawCleanVendingMachine(m, t(64.1), t(29.4));
  prof.plano(() => drawLedStrip(m, t(64.2), t(16.9), t(19.5), '#c084fc'));

  // ---------------- ARENA: COMBATES, TREINOS & E-SPORTS (x63..84,y33..52) ----------------
  // Moldura do placar / telão de lutas na parede norte (conteúdo HP P1 vs P2 é dinâmico)
  pxBox(m, t(76.8), t(33.7), t(6.6), t(1.8), '#1e293b', PX_OUTLINE, 2);
  pxBox(m, t(75.5), t(34.2), 20, 28, '#facc15', PX_OUTLINE, 2); // troféu ao lado do telão
  pxRect(m, t(75.5) + 4, t(34.2) + 4, 12, 8, '#fde047');
  // Cantoneira TV 85" + Sofá
  pxBox(m, t(65.4), t(50.1), t(6.6), t(1.3), '#334155', PX_OUTLINE, 2); // TV 85"
  pxRect(m, t(65.4) + 6, t(50.1) + 6, t(6.6) - 12, t(1.3) - 12, '#2563eb');
  drawSofa(m, t(64.8), t(47.7), t(6), t(1.3), '#475569');
  drawCleanPlant(m, t(83), t(50.6));
  prof.plano(() => drawNeonSign(m, t(73.8), t(33.15), 186, 'ARENA COMBAT & E-SPORTS', '#facc15', '700 10px "Inter", sans-serif'));

  // ---------------- ZONA DE EXPANSÃO + SETOR ESCONDIDO ROMÂNTICO (topo y=4..16 ao lado do WC) ----------------
  // Piso reservado e tapete vinho aveludado (x=84.4..93.4, y=4.6..15.6)
  prof.plano(() => {
    pxBox(m, t(84.4), t(4.6), t(9.0), t(11.0), '#1f0d1c', '#9d174d', 2);
    pxBox(m, t(85.0), t(5.5), t(7.8), t(8.8), '#3b102d', '#f43f5e', 2);
    drawNeonSign(m, t(88.9), t(4.85), 134, '💕 CANTINHO VIP', '#f472b6', '700 9px "Inter", sans-serif');
    // Tapete vermelho na entrada restrita (Corredor de Serviço -> Porta Cantinho VIP)
    pxBox(m, t(81.8), t(12.65), t(2.3), t(1.7), '#7f1d1d', '#facc15', 2);
    pxRect(m, t(82.0), t(12.85), t(1.9), t(1.3), '#be123c');
    // Placa "RESTRITO VIP" acima da porta no muro
    pxBox(m, t(82.75), t(12.05), 40, 11, '#090d16', '#ef4444', 1.5);
    m.font = '800 6.5px "Inter", sans-serif';
    m.textAlign = 'center';
    m.fillStyle = '#fca5a5';
    m.fillText('🔒 VIP', t(82.75) + 20, t(12.05) + 8);
    m.textAlign = 'start';
    // Cortina divisória escondendo do corredor / zona inferior
    for (let cy = 0; cy < 6; cy++) {
      if (cy === 5) continue; // deixa vão para a folha da porta
      pxRect(m, t(84.5), t(5.2 + cy * 1.4), 6, 12, cy % 2 === 0 ? '#be123c' : '#881337');
    }
    for (let cx = 0; cx < 9; cx++) {
      pxRect(m, t(84.6 + cx * 0.95), t(15.2), 26, 8, cx % 2 === 0 ? '#9f1239' : '#be123c');
    }
  });
  // Pedestais dourados com cordão de veludo na porta VIP
  [12.45, 14.55].forEach((py) => {
    pxBox(m, t(82.1), t(py) - 8, 8, 12, '#facc15', PX_OUTLINE, 1.5);
    pxRect(m, t(82.1) + 2, t(py) - 6, 4, 4, '#fef08a');
  });
  // Porta dupla de madeira escura + vidro fosco carmesim fechando a sala restrita (x=83.85..84.35, y=12.6..14.45)
  pxBox(m, t(83.8), t(12.55), 16, t(1.9), '#4c0519', '#facc15', 2);
  pxRect(m, t(83.9) + 2, t(12.75), 10, t(1.5), '#881337');
  pxRect(m, t(83.95) + 4, t(12.95), 5, 14, '#f43f5e'); // visor fosco
  pxRect(m, t(83.9) + 3, t(13.65), 4, 4, '#fde047'); // maçaneta dourada
  // Sofá Loveseat Norte + Mesinha com velas & taças
  drawSofa(m, t(85.7), t(6.1), t(3.6), t(1.35), '#be123c');
  pxBox(m, t(89.6), t(6.2), t(1.6), t(1.1), '#4a1d2c', PX_OUTLINE, 2);
  pxRect(m, t(89.95), t(6.45), 6, 6, '#fef08a'); // vela acesa
  pxRect(m, t(90.55), t(6.55), 5, 5, '#f43f5e'); // taça vinho
  // Cantinho reservado com almofadões + cortina de dossel (Leste)
  pxBox(m, t(88.6), t(10.5), t(3.9), t(2.5), '#831843', PX_OUTLINE, 2);
  pxRect(m, t(88.9), t(10.8), t(3.3), t(1.9), '#be185d');
  pxRect(m, t(89.1), t(11.0), 16, 12, '#fbcfe8'); // travesseiro esquerdo
  pxRect(m, t(91.3), t(11.0), 16, 12, '#fbcfe8'); // travesseiro direito
  drawCleanPlant(m, t(85.2), t(13.6));
  drawCleanPlant(m, t(92.6), t(13.6));
  // Abajures rosas
  pxBox(m, t(85.0), t(6.2), 14, 18, '#f43f5e', PX_OUTLINE, 1);
  pxBox(m, t(92.4), t(6.2), 14, 18, '#f43f5e', PX_OUTLINE, 1);

  // ---------------- ESTACIONAMENTO PAGO & GUARITA (x=84..94, y=16..52) ----------------
  // Parede divisória sólida abaixo do Cantinho VIP
  pxBox(m, t(84), t(16) - 4, t(10), 8, '#332b4d', PX_OUTLINE, 2);
  pxRect(m, t(84) + 3, t(16) - 1, t(10) - 6, 2, '#f43f5e');

  // Batentes (wheel stops) amarelo/preto e postes de sensor nas 8 vagas
  [20.0, 23.3, 26.6, 29.9, 33.2, 36.5, 39.8, 43.1].forEach((yt) => {
    pxBox(m, t(84.48), t(yt) - 22, 8, 44, '#facc15', PX_OUTLINE, 1.5);
    pxRect(m, t(84.48) + 2, t(yt) - 12, 4, 8, '#171717');
    pxRect(m, t(84.48) + 2, t(yt) + 4, 4, 8, '#171717');
    pxBox(m, t(84.1), t(yt) - 6, 10, 12, '#1e293b', PX_OUTLINE, 1.5);
  });

  // Guarita / Portaria do Estacionamento (x=84.45..88.1, y=46.6..50.6)
  prof.plano(() => {
    pxBox(m, t(84.35), t(46.5), t(3.85), t(4.2), '#334155', PX_OUTLINE, 2);
  });
  pxBox(m, t(84.55), t(46.75), t(3.35), t(3.65), '#1e293b', PX_OUTLINE, 2);
  pxBox(m, t(84.7), t(46.95), t(3.05), t(1.35), '#38bdf8', PX_OUTLINE, 1.5); // telhado LED azul/ciano
  pxRect(m, t(84.85), t(47.2), t(2.75), 4, '#bae6fd');
  // Janela panorâmica de atendimento da guarita
  pxBox(m, t(85.0), t(48.35), t(2.5), t(1.55), '#0f172a', PX_OUTLINE, 1.5);
  pxBox(m, t(85.2), t(48.55), t(2.1), t(1.0), '#7dd3fc', PX_OUTLINE, 1);
  pxRect(m, t(85.4), t(48.65), 14, 4, 'rgba(255,255,255,0.45)');
  // Balcão de guichê virado para a pista de saída
  pxBox(m, t(87.6), t(48.35), 14, t(1.55), '#cbd5e1', PX_OUTLINE, 1.5);
  m.font = '700 7px "Inter", sans-serif';
  m.textAlign = 'center';
  m.fillStyle = '#0f172a';
  m.fillText('GUARITA', t(86.22), t(47.82));
  m.textAlign = 'start';

  // Totem automático de emissão de ticket na entrada (Leste) e coluna intermediária de saída
  pxBox(m, t(93.25), t(49.45), 14, 24, '#0284c7', PX_OUTLINE, 2);
  pxRect(m, t(93.25) + 3, t(49.45) + 4, 8, 8, '#bae6fd');
  pxBox(m, t(88.22), t(49.15), 10, 14, '#f59e0b', PX_OUTLINE, 1.5);
  pxBox(m, t(93.4), t(48.6), 10, 14, '#f59e0b', PX_OUTLINE, 1.5);
  // Balizadores amarelo/preto protegendo os cantos da rampa na calçada
  [[88.25, 55.65], [93.75, 55.65]].forEach(([bx, by]) => {
    pxBox(m, t(bx) - 4, t(by) - 10, 8, 16, '#facc15', PX_OUTLINE, 1.5);
    pxRect(m, t(bx) - 2, t(by) - 4, 4, 4, '#171717');
  });

  desenharMoveisDecor(m, (fn) => prof.plano(fn)); // bancadas, lojas e props
  desenharMobiliario(m); // sofás, mesas, arquibancada, bar, empilhadeira...
  desenharEstacionados(m); // carros e motos parados na avenida

  // Paredes entram no MESMO cache (e no mesmo mapa de profundidade) para ordenar com os personagens
  construirParedes(m, c);

  mapaProf = prof;
  cacheMoveis = c;
}

function construirParedes(w: CanvasRenderingContext2D, c: HTMLCanvasElement) {
  /** Filete neon (translúcido: não altera a profundidade) com a cor da sala vizinha ao segmento */
  const fileteNeon = (
    ctx: CanvasRenderingContext2D, fx: number, fy: number, fw: number, fh: number,
    o: 'H' | 'V', linha: number, ini: number, fim: number
  ) => {
    const meio = (ini + fim) / 4; // tiles
    const lt = linha / 2;
    const px = o === 'H' ? meio : lt + 0.5; // olha para o lado sul/leste da parede
    const py = o === 'H' ? lt + 0.5 : meio;
    const sala = SALAS.find((s) => !s.bloqueada && px >= s.x && px < s.x + s.w && py >= s.y && py < s.y + s.h);
    ctx.fillStyle = rgbaHex(sala?.cor ?? '#38bdf8', 0.85);
    ctx.fillRect(fx, fy, fw, fh);
  };

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
      pxRect(w, x1, y + esp / 2, ww, 4, PX_SHADOW);
      pxBox(w, x1, y - esp / 2, ww, esp, cor, vidro ? PX_OUTLINE : PX_WALL_OUTLINE, 1.5);
      if (!vidro) fileteNeon(w, x1 + 2, y - esp / 2 + 2, ww - 4, 2, seg.orientacao, seg.linha, seg.ini, seg.fim);
    } else {
      const x = eixoX(seg.linha);
      const y1 = eixoX(seg.ini);
      const hh = eixoX(seg.fim) - eixoX(seg.ini);
      pxRect(w, x + esp / 2, y1, 4, hh, PX_SHADOW);
      pxBox(w, x - esp / 2, y1, esp, hh, cor, vidro ? PX_OUTLINE : PX_WALL_OUTLINE, 1.5);
      if (!vidro) fileteNeon(w, x - esp / 2 + 2, y1 + 2, 2, hh - 4, seg.orientacao, seg.linha, seg.ini, seg.fim);
    }
  });

  // Placas de identificação dos cômodos (alinhadas à esquerda, longe das portas)
  w.font = '600 8.5px "Inter", sans-serif';
  w.textAlign = 'start';
  SALAS.forEach((s) => {
    if (s.tipo === 'EXPANSAO' || s.tipo === 'CORREDOR') return;
    const largTxt = snap2(w.measureText(s.nome).width + 12);
    const px = t(s.x) + 10;
    const py = t(s.y) + 8;
    pxBox(w, px, py, largTxt, 12, 'rgba(18, 13, 38, 0.85)', PX_OUTLINE, 1.5);
    pxRect(w, px + 2, py + 2, largTxt - 4, 1.5, s.cor);
    w.fillStyle = '#f8fafc';
    w.fillText(s.nome, px + 6, py + 9.5);
  });

  cacheParedes = c;
}

function garantirCaches() {
  if (cacheChao && cacheMoveis && cacheParedes && versaoConstruida === CACHE_VERSION) return;
  construirChao();
  construirMoveis(); // já inclui as paredes
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
// ============================================================================
// OBJETOS DINÂMICOS: entram na ordenação por profundidade junto com os personagens
// ============================================================================

/** Cache estático (móveis + paredes). Usado em testes de ocupação. */
export function obterCacheEstatico(): HTMLCanvasElement | null {
  garantirCaches();
  return cacheMoveis;
}

export function obterMapaProfundidade(): MapaProfundidade | null {
  garantirCaches();
  return mapaProf;
}

/**
 * Recoloca, por cima de quem acabou de ser desenhado, os pedaços de móveis/paredes que estão
 * NA FRENTE dele (linha de base mais ao sul que `chave`, normalmente o y dos pés).
 */
export function recolocarEstatico(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  chave: number
) {
  if (!mapaProf || !cacheMoveis) return;
  mapaProf.recolocar(ctx, cacheMoveis, x, y, w, h, chave);
}

/** Linhas neon no chão do lounge de consoles (planas: desenhar antes dos objetos) */
export function renderPlanosDinamicos(
  ctx: CanvasRenderingContext2D,
  tick: number,
  melhorias: MelhoriaEstabelecimento[]
) {
  const nCon = nivelMelhoria(melhorias, 'eq_console');
  if (nCon > 0) {
    const neon = RGB_CICLO[Math.floor(tick / 20) % RGB_CICLO.length];
    pxRect(ctx, t(64), t(33.5), t(19.5), 2, neon);
    pxRect(ctx, t(64), t(51.6), t(19.5), 2, neon);
  }
}

export interface EstadoArenaVisual {
  hpRed: number; // 0..1
  hpBlue: number; // 0..1
  bag1Hit: boolean;
  bag2Hit: boolean;
  koFlash: boolean;
}

export function coletarObjetosDinamicos(
  computadores: Computador[],
  tick: number,
  melhorias: MelhoriaEstabelecimento[],
  vista: VistaMundo,
  arenaEstado?: EstadoArenaVisual,
  eventosPc?: Map<number, EstadoPcHypeVisual>
): ObjetoProfundo[] {
  garantirCaches();
  const lista: ObjetoProfundo[] = [];
  const nPcs = nivelMelhoria(melhorias, 'eq_pcs');
  const nMon = nivelMelhoria(melhorias, 'eq_monitor');
  const nCon = nivelMelhoria(melhorias, 'eq_console');
  const nAr = nivelMelhoria(melhorias, 'inf_ar');
  const nSeg = nivelMelhoria(melhorias, 'inf_seguranca');
  const nEle = nivelMelhoria(melhorias, 'inf_eletrica');
  const nPrint = nivelMelhoria(melhorias, 'eq_print');

  const add = (
    base: number,
    x: number,
    y: number,
    w: number,
    h: number,
    desenhar: (c: CanvasRenderingContext2D) => void
  ) => {
    if (x + w < vista.x1 - 48 || x > vista.x2 + 48 || y + h < vista.y1 - 48 || y > vista.y2 + 48) return;
    lista.push({ base, x, y, w, h, desenhar });
  };

  // Racks do NOC
  [38.4, 40, 41.6, 44.5, 46.1].forEach((rx, i) => {
    add(t(5.1) + 74, t(rx) - 18, t(5.1), 36, 74, (c) => drawRack(c, t(rx), tick, i));
  });

  // Fliperamas
  ARCADES.forEach((a, i) => {
    if (a.nivelMin && nCon < a.nivelMin) return;
    add(t(a.y) + 40, t(a.x), t(a.y), 26, 42, (c) => drawArcadeCabinet(c, t(a.x), t(a.y), a.cor, tick, i));
  });

  // PCs: a mesa e a cadeira são objetos separados (quem senta fica entre as duas)
  computadores.slice(0, 24).forEach((pc) => {
    const seatNode = WAYPOINT_NODES[nodoAssentoDoPc(pc.numero)];
    if (!seatNode) return;
    const sx = snap2(seatNode.x);
    const sy = snap2(seatNode.y);
    const my = sy - 22;
    const ehVip = pc.area === 'VIP';
    const evPc = eventosPc?.get(pc.numero);
    add(my + 12, sx - 22, my - 24, 48, 42, (c) => drawPcStation(c, sx, my, tick, pc, nPcs, nMon, evPc));
    add(sy + 5, sx - 12, sy - 6, 24, 16, (c) => drawPixelGamingChair(c, sx, sy, ehVip, tick, evPc));
  });

  // ==== Melhorias do estabelecimento (níveis 1..5) ====
  AC_POS.slice(0, nAr).forEach((a, i) => {
    const ax = t(a.x);
    const ay = t(a.y);
    add(ay + 10, ax - 14, ay, 28, 36, (c) => {
      pxBox(c, ax - 14, ay, 28, 10, '#e2e8f0', PX_OUTLINE, 2);
      pxRect(c, ax - 10, ay + 6, 20, 2, '#38bdf8');
      for (let p = 0; p < 3; p++) {
        const py = ay + 12 + ((tick * 0.6 + p * 9 + i * 5) % 22);
        pxRect(c, ax - 8 + p * 8, py, 2, 2, 'rgba(186, 230, 253, 0.8)');
      }
    });
  });

  CFTV_POS.slice(0, nSeg).forEach((cam, i) => {
    const cx = t(cam.x);
    const cy = t(cam.y);
    add(cy + 4, cx - 6, cy - 4, 12, 8, (c) => {
      pxBox(c, cx - 4, cy - 4, 10, 8, '#1e293b', PX_OUTLINE, 2);
      pxRect(c, cx - 6, cy - 2, 4, 4, '#475569');
      pxRect(c, cx + 2, cy - 2, 2, 2, (Math.floor(tick / 15) + i) % 2 === 0 ? '#ef4444' : '#14532d');
    });
  });

  if (nEle > 0) {
    add(t(5.3) + 44, t(36.5), t(5.3), 22, 44, (c) => {
      pxBox(c, t(36.5), t(5.3), 22, 44, '#334155', PX_OUTLINE, 2);
      for (let l = 0; l < 5; l++) {
        pxRect(c, t(36.5) + 6, t(5.3) + 6 + l * 7, 10, 3, l < nEle ? '#facc15' : '#0f172a');
      }
    });
  }

  if (nPrint > 0) {
    const px0 = t(43.6);
    const py0 = t(45.7);
    add(py0 + 22, px0 - 22, py0 - 6, 90, 40, (c) => {
      pxRect(c, px0, py0 + 26, 34, 4, PX_SHADOW);
      pxBox(c, px0, py0, 32, 22, '#e2e8f0', PX_OUTLINE, 2);
      pxRect(c, px0 + 4, py0 + 4, 24, 6, '#94a3b8');
      pxRect(c, px0 + 8, py0 + 16, 16, 4, '#cbd5e1');
      if (Math.floor(tick / 30) % 2 === 0) pxRect(c, px0 + 10, py0 + 22 + (tick % 30 > 15 ? 4 : 2), 12, 6, '#ffffff');
      if (nPrint >= 2) {
        pxBox(c, px0 + 36, py0 - 4, 26, 26, '#cbd5e1', PX_OUTLINE, 2);
        pxRect(c, px0 + 40, py0, 18, 4, '#38bdf8');
      }
      if (nPrint >= 3) {
        pxRect(c, px0 + 2, py0 + 12, 4, 4, tick % 20 < 10 ? '#4ade80' : '#14532d');
        pxBox(c, px0 - 20, py0 + 4, 16, 18, '#475569', PX_OUTLINE, 2);
      }
    });
  }

  if (nCon >= 4) {
    add(t(46.6) + 26, t(81.6), t(46.6), 22, 26, (c) => {
      const neon = RGB_CICLO[Math.floor(tick / 20) % RGB_CICLO.length];
      pxBox(c, t(81.6), t(46.6), 22, 26, '#1e1b4b', '#a855f7', 2);
      pxRect(c, t(81.6) + 4, t(46.6) + 4, 14, 6, neon);
    });
  }

  // --- BOMBONIERE: Vapor de café / ramen & tela PIX animada no balcão ---
  add(t(17.2) + 2, t(14.0), t(15.0), t(4.6), t(2.3), (c) => {
    const f = Math.floor(tick / 10);
    // Vapor da máquina de café e estação ramen
    for (let i = 0; i < 3; i++) {
      const fase = (f + i * 3) % 9;
      const dy = fase * 1.5;
      const dx = Math.sin((tick + i * 25) * 0.08) * 2;
      c.fillStyle = `rgba(241, 245, 249, ${Math.max(0.1, 0.55 - fase * 0.055)})`;
      c.fillRect(Math.round(t(14.7) + dx), Math.round(t(15.2) - dy), 3, 2);
      c.fillRect(Math.round(t(17.6) - dx), Math.round(t(15.2) - dy), 3, 2);
    }
    // Monitor PIX do caixa piscando no balcão (x=14.3, y=16.4)
    const pixOn = Math.floor(tick / 24) % 2 === 0;
    c.fillStyle = pixOn ? '#22d3ee' : '#10b981';
    c.fillRect(t(14.22), t(16.46), 8, 5);
    c.fillStyle = '#fef08a';
    c.fillRect(t(18.02), t(16.52), 5, 4);
  });

  // --- ESTOQUE: Empilhadeira amarela animada em operação ---
  {
    const cyc = tick % 480;
    let xTile = 57.9;
    let dir: 1 | -1 = 1;
    let liftPx = 2;
    let moving = false;

    if (cyc < 60) {
      xTile = 57.9;
      dir = 1;
      liftPx = 2 + Math.round((cyc / 60) * 10);
    } else if (cyc < 205) {
      const p = (cyc - 60) / 145;
      xTile = 57.9 + p * 2.9;
      dir = 1;
      liftPx = 12;
      moving = true;
    } else if (cyc < 275) {
      const p = (cyc - 205) / 70;
      xTile = 60.8;
      dir = p < 0.5 ? 1 : -1;
      liftPx = p < 0.5 ? 12 + Math.round(p * 2 * 4) : 16 - Math.round((p - 0.5) * 2 * 10);
    } else if (cyc < 420) {
      const p = (cyc - 275) / 145;
      xTile = 60.8 - p * 2.9;
      dir = -1;
      liftPx = 6;
      moving = true;
    } else {
      const p = (cyc - 420) / 60;
      xTile = 57.9;
      dir = p < 0.6 ? -1 : 1;
      liftPx = 6 - Math.round(p * 4);
    }

    const fx = Math.round(t(xTile));
    const fy = Math.round(t(6.85));
    const bob = moving ? (Math.floor(tick / 6) % 2 === 0 ? -1 : 0) : 0;

    add(fy + 46, fx - 12, fy - 18, 84, 68, (c) => {
      // Sombra no piso
      c.fillStyle = 'rgba(0, 0, 0, 0.36)';
      c.fillRect(fx + 4, fy + 38, 52, 8);

      c.save();
      if (dir === -1) {
        c.translate(fx + 30, 0);
        c.scale(-1, 1);
        c.translate(-(fx + 30), 0);
      }

      const bx = fx + 8;
      const by = fy + bob;

      // Mastro hidráulico dianteiro (direita quando dir === 1)
      c.fillStyle = '#1e293b';
      c.fillRect(bx + 36, by + 2, 4, 34);
      c.fillStyle = '#475569';
      c.fillRect(bx + 37, by + 4, 2, 30);

      // Chassi amarelo principal
      pxBox(c, bx + 6, by + 16, 31, 17, '#facc15', '#261d2e', 2);
      // Listras de segurança preto/amarelo traseiras
      c.fillStyle = '#18181b';
      c.fillRect(bx + 8, by + 28, 12, 3);
      c.fillStyle = '#f97316';
      c.fillRect(bx + 6, by + 20, 4, 6);

      // Cabine & gaiola de proteção
      c.fillStyle = '#1e293b';
      c.fillRect(bx + 12, by + 4, 2, 12);
      c.fillRect(bx + 29, by + 4, 2, 12);
      c.fillRect(bx + 12, by + 4, 19, 3);

      // Operador na cabine (capacete amarelo + colete laranja)
      c.fillStyle = '#f97316';
      c.fillRect(bx + 17, by + 11, 8, 6);
      c.fillStyle = '#fed7aa';
      c.fillRect(bx + 18, by + 7, 6, 4);
      c.fillStyle = '#eab308';
      c.fillRect(bx + 17, by + 5, 8, 3);

      // Farol giratório âmbar no teto
      const giroOn = Math.floor(tick / 10) % 2 === 0;
      c.fillStyle = giroOn ? '#fbbf24' : '#78350f';
      c.fillRect(bx + 19, by + 1, 5, 3);
      if (giroOn) {
        c.fillStyle = 'rgba(251, 191, 36, 0.25)';
        c.fillRect(bx + 15, by - 3, 13, 8);
      }

      // Garfos e caixa de carga animada subindo/descendo
      const gy = by + 32 - liftPx;
      c.fillStyle = '#94a3b8';
      c.fillRect(bx + 39, gy, 18, 3);
      c.fillRect(bx + 38, gy - 8, 3, 11);

      // Pallet e caixa amarrada sobre o garfo
      c.fillStyle = '#78350f';
      c.fillRect(bx + 41, gy - 3, 15, 3);
      pxBox(c, bx + 42, gy - 17, 13, 14, '#d97706', '#261d2e', 1);
      c.fillStyle = '#fde68a';
      c.fillRect(bx + 47, gy - 16, 3, 12);

      // Rodas com raios girando
      const spoke = moving ? Math.floor(tick / 5) % 2 : 0;
      for (const wx of [bx + 10, bx + 28]) {
        c.fillStyle = '#0f172a';
        c.fillRect(wx, fy + 31, 9, 9);
        c.fillStyle = '#94a3b8';
        c.fillRect(wx + 3 + spoke, fy + 34, 2, 3);
      }

      // Fumaça do escapamento quando em movimento
      if (moving) {
        const puf = Math.floor(tick / 8) % 3;
        c.fillStyle = 'rgba(203, 213, 225, 0.45)';
        c.fillRect(bx + 1 - puf * 3, by + 11 - puf * 3, 4, 4);
      }

      c.restore();
    });
  }

  // --- ARENA: Jumbotron Placar Ao Vivo, Sacos de Pancada & Cordas do Ringue ---
  {
    const ar: EstadoArenaVisual = arenaEstado ?? {
      hpRed: 0.85,
      hpBlue: 0.82,
      bag1Hit: false,
      bag2Hit: false,
      koFlash: false,
    };

    // 1) Placar Jumbotron no topo da Arena (x=76.8..81.6, y=33.7..35.3)
    add(t(35.8), t(76.6), t(33.5), t(5.2), t(2.2), (c) => {
      const jx = Math.round(t(76.8));
      const jy = Math.round(t(33.7));
      const jw = Math.round(t(4.8));
      const jh = Math.round(t(1.65));

      pxBox(c, jx, jy, jw, jh, '#090d16', ar.koFlash ? '#facc15' : '#38bdf8', 2);
      c.fillStyle = '#1e293b';
      c.fillRect(jx + 4, jy + 4, jw - 8, jh - 8);

      // Barra P1 (Vermelho - esq) e P2 (Azul - dir)
      const barW = 54;
      c.fillStyle = '#111827';
      c.fillRect(jx + 8, jy + 10, barW, 8);
      c.fillRect(jx + jw - 8 - barW, jy + 10, barW, 8);

      const wRed = Math.max(2, Math.round(barW * Math.max(0.05, ar.hpRed)));
      const wBlue = Math.max(2, Math.round(barW * Math.max(0.05, ar.hpBlue)));
      c.fillStyle = '#ef4444';
      c.fillRect(jx + 8 + (barW - wRed), jy + 10, wRed, 8);
      c.fillStyle = '#3b82f6';
      c.fillRect(jx + jw - 8 - barW, jy + 10, wBlue, 8);

      // Texto central K.O. / VS / tempo
      c.fillStyle = ar.koFlash && Math.floor(tick / 6) % 2 === 0 ? '#facc15' : '#f8fafc';
      c.font = 'bold 9px monospace';
      c.textAlign = 'center';
      c.fillText(ar.koFlash ? 'K.O.!' : 'VS', jx + jw / 2, jy + 18);
      const sec = 99 - (Math.floor(tick / 20) % 99);
      c.fillStyle = '#22d3ee';
      c.font = 'bold 8px monospace';
      c.fillText(`R1 00:${sec < 10 ? '0' : ''}${sec}`, jx + jw / 2, jy + jh - 9);
      c.textAlign = 'left';
    });

    // 2) Sacos de Pancada animados no Tatame (x=68.15 e x=71.75, y=43.2)
    const sacos = [
      { bx: t(68.15), by: t(43.25), hit: ar.bag1Hit, phase: 0 },
      { bx: t(71.75), by: t(43.25), hit: ar.bag2Hit, phase: 2.1 },
    ];
    for (const s of sacos) {
      add(t(44.0), s.bx - 16, s.by - 48, 32, 60, (c) => {
        const swing = s.hit
          ? Math.round(Math.sin(tick * 0.75 + s.phase) * 5)
          : Math.round(Math.sin(tick * 0.08 + s.phase) * 1.4);
        // Base e haste metálica
        c.fillStyle = '#334155';
        c.fillRect(s.bx - 10, s.by + 2, 20, 5);
        c.fillStyle = '#64748b';
        c.fillRect(s.bx - 2, s.by - 38, 4, 42);
        c.fillRect(s.bx - 2, s.by - 38, 12, 3);
        // Corrente e saco vermelho oscilando
        c.fillStyle = '#cbd5e1';
        c.fillRect(s.bx + 7 + Math.round(swing * 0.4), s.by - 35, 2, 7);
        const sx = s.bx + 2 + swing;
        const sy = s.by - 28;
        pxBox(c, sx, sy, 12, 26, '#dc2626', '#261d2e', 1);
        c.fillStyle = '#f87171';
        c.fillRect(sx + 2, sy + 2, 3, 22);
        c.fillStyle = '#facc15';
        c.fillRect(sx + 1, sy + 10, 10, 4);
        // Faísca de impacto no saco
        if (s.hit) {
          c.fillStyle = '#fef08a';
          c.fillRect(sx - 4, sy + 9, 4, 4);
          c.fillRect(sx + 12, sy + 7, 4, 4);
        }
      });
    }

    // 3) Ringue de Luta — Cordas e corners de trás (base = t(36.7) atrás dos lutadores)
    const rx = t(75.35);
    const ryN = t(36.65);
    const rxR = t(83.05);
    const ryS = t(45.25);
    const rw = rxR - rx;

    add(t(36.7), rx - 8, ryN - 22, rw + 16, 36, (c) => {
      // Cordas horizontais norte (3 níveis)
      const coresCordas = ['#ef4444', '#f8fafc', '#3b82f6'];
      for (let i = 0; i < 3; i++) {
        c.fillStyle = coresCordas[i];
        c.fillRect(rx, ryN - 18 + i * 6, rw, 2);
      }
      // Posts traseiros (NW e NE)
      pxBox(c, rx - 5, ryN - 22, 10, 26, '#dc2626', '#0f172a', 1);
      pxBox(c, rxR - 5, ryN - 22, 10, 26, '#2563eb', '#0f172a', 1);
    });

    // 4) Ringue de Luta — Cordas laterais, cordas frontais e corners frontais (base = t(45.5) na frente dos lutadores)
    add(t(45.5), rx - 8, ryN - 20, rw + 16, ryS - ryN + 32, (c) => {
      const coresCordas = ['#ef4444', '#f8fafc', '#3b82f6'];
      const shake = ar.koFlash ? ((Math.floor(tick / 3) % 2) * 2 - 1) : 0;

      // Cordas laterais (Oeste e Leste)
      for (let i = 0; i < 3; i++) {
        c.fillStyle = coresCordas[i];
        const dy = -18 + i * 6;
        c.fillRect(rx - 1, ryN + dy, 3, ryS - ryN);
        c.fillRect(rxR - 2, ryN + dy, 3, ryS - ryN);
      }

      // Cordas frontais Sul (3 níveis)
      for (let i = 0; i < 3; i++) {
        c.fillStyle = coresCordas[i];
        c.fillRect(rx, ryS - 18 + i * 6 + shake, rw, 2);
      }

      // Posts frontais (SW Vermelho e SE Azul)
      pxBox(c, rx - 5, ryS - 22, 10, 26, '#dc2626', '#0f172a', 1);
      pxBox(c, rxR - 5, ryS - 22, 10, 26, '#2563eb', '#0f172a', 1);
    });
  }

  // --- SALÃO GAMER: Totem de Chamada de PCs animado na Área de Espera ---
  add(t(31.5), t(56.1), t(29.7), 32, 54, (c) => {
    const piscar = Math.floor(tick / 18) % 2 === 0;
    c.fillStyle = piscar ? '#22d3ee' : '#4ade80';
    c.fillRect(t(56.2) + 6, t(29.8) + 7, 16, 10);
    c.fillStyle = '#0f172a';
    c.fillRect(t(56.2) + 8, t(29.8) + 9, 12, 6);
    c.fillStyle = piscar ? '#facc15' : '#38bdf8';
    c.fillRect(t(56.2) + 9, t(29.8) + 11, 10, 2);
  });

  // --- VIP: Bolas rolando nas 2 mesas de Sinuca (67.4, 30.2 e 76.4, 30.2) ---
  [
    { x: 67.4, y: 30.2, fase: 0 },
    { x: 76.4, y: 30.2, fase: 45 },
  ].forEach((m) => {
    const mx = t(m.x);
    const my = t(m.y);
    const wM = t(3.2);
    const hM = t(1.3);
    add(my + hM + 2, mx, my, wM, hM, (c) => {
      const cyc = (tick + m.fase) % 90;
      const impacto = cyc >= 20 ? (cyc - 20) / 70 : 0;
      // Bola branca tacada da esquerda para o centro
      const wx = cyc < 20
        ? mx + 22
        : mx + 22 + Math.min(34, (cyc - 20) * 1.9);
      const wy = my + Math.round(hM / 2) - 2 + (cyc >= 32 ? Math.round(Math.sin(cyc * 0.25) * 4) : 0);
      c.fillStyle = '#f8fafc';
      c.fillRect(Math.round(wx), Math.round(wy), 4, 4);

      // Triângulo de bolas coloridas espalhando após a tacada
      const bolas = [
        { ox: 60, oy: 18, vx: 18, vy: -9, cor: '#facc15' },
        { ox: 65, oy: 15, vx: 22, vy: 8, cor: '#ef4444' },
        { ox: 65, oy: 21, vx: 12, vy: 11, cor: '#3b82f6' },
        { ox: 70, oy: 18, vx: 15, vy: -5, cor: '#0f172a' }, // Bola 8
        { ox: 70, oy: 13, vx: 8, vy: -11, cor: '#a855f7' },
        { ox: 70, oy: 23, vx: 20, vy: 6, cor: '#fb923c' },
      ];
      const scatter = impacto > 0.14 ? Math.min(1, (impacto - 0.14) * 1.4) : 0;
      bolas.forEach((b) => {
        const bx = Math.min(mx + wM - 12, Math.max(mx + 10, mx + b.ox + b.vx * scatter));
        const by = Math.min(my + hM - 11, Math.max(my + 8, my + b.oy + b.vy * scatter));
        c.fillStyle = b.cor;
        c.fillRect(Math.round(bx), Math.round(by), 4, 4);
      });
    });
  });

  // --- SETOR ESCONDIDO ROMÂNTICO (x=84.4..93.4, y=4.6..15.6): Velas, cobertor mexendo e corações ---
  add(t(14.5), t(84.4), t(4.6), t(9.0), t(11.0), (c) => {
    // Chama da vela na mesinha piscando
    const ch = Math.floor(tick / 10) % 2 === 0;
    c.fillStyle = ch ? '#fef08a' : '#fb923c';
    c.fillRect(t(89.95) + 1, t(6.45) - 2, 4, 4);

    // Manta fofa cobrindo o Casal 2 no cantinho reservado (balançando suavemente)
    const bounceY = Math.floor(tick / 14) % 2 === 0 ? -2 : 0;
    const bx = t(89.15);
    const by = t(11.25) + bounceY;
    pxBox(c, bx, by, 84, 34, '#f43f5e', '#881337', 2);
    c.fillStyle = '#fda4af';
    c.fillRect(bx + 6, by + 5, 72, 7);
    c.fillStyle = '#fecdd3';
    c.fillRect(bx + 14, by + 17, 18, 5);
    c.fillRect(bx + 52, by + 17, 18, 5);

    // Corações pixel-art flutuando sobre os dois casais
    const desenharCoracaoPx = (hx: number, hy: number, cor: string) => {
      c.fillStyle = cor;
      c.fillRect(hx + 1, hy, 2, 2);
      c.fillRect(hx + 5, hy, 2, 2);
      c.fillRect(hx, hy + 2, 8, 2);
      c.fillRect(hx + 1, hy + 4, 6, 2);
      c.fillRect(hx + 3, hy + 6, 2, 2);
    };
    const origens = [
      { x: t(87.45), y: t(6.35), fase: 0 },
      { x: t(90.45), y: t(10.8), fase: 28 },
    ];
    origens.forEach((o) => {
      for (let k = 0; k < 3; k++) {
        const prog = ((tick + o.fase + k * 24) % 72) / 72;
        const hx = Math.round(o.x - 4 + Math.sin(prog * 6 + k) * 9);
        const hy = Math.round(o.y - prog * 28);
        desenharCoracaoPx(hx, hy, k % 2 === 0 ? '#f43f5e' : '#f472b6');
      }
    });
  });

  // --- PORTA RESTRITA CANTINHO VIP: leitor biométrico piscando + faixa de segurança animada ---
  add(t(14.6), t(81.5), t(12.2), t(3.2), t(2.8), (c) => {
    const pisca = Math.floor(tick / 18) % 2 === 0;
    // Leitor biométrico na parede ao lado da porta (x=83.65, y=12.85)
    pxBox(c, t(83.62), t(12.85), 6, 10, '#0f172a', '#475569', 1);
    c.fillStyle = pisca ? '#ef4444' : '#991b1b';
    c.fillRect(t(83.62) + 2, t(12.85) + 2, 2, 3);
    c.fillStyle = '#facc15';
    c.fillRect(t(83.62) + 2, t(12.85) + 6, 2, 2);
  });

  return lista;
}

/** Etiquetas dos PCs (número, status) e destaque do mouse: sempre por cima de tudo */
export function renderEtiquetasPcs(
  ctx: CanvasRenderingContext2D,
  computadores: Computador[],
  hoveredPc: number | null,
  vista: VistaMundo
) {
  computadores.slice(0, 24).forEach((pc) => {
    const seatNode = WAYPOINT_NODES[nodoAssentoDoPc(pc.numero)];
    if (!seatNode || !dentroDaVista(vista, seatNode.x, seatNode.y)) return;
    const mx = snap2(seatNode.x);
    const my = snap2(seatNode.y) - 22;
    const ehVip = pc.area === 'VIP';
    const badgeBorder =
      pc.status === 'MANUTENCAO' ? '#fb923c' : pc.status === 'OCUPADO' ? (ehVip ? '#c084fc' : '#38bdf8') : '#4ade80';
    if (hoveredPc === pc.numero) {
      pxBox(ctx, mx - 22, my - 22, 48, 50, 'rgba(250, 204, 21, 0.16)', '#facc15', 2);
    }
    pxBox(ctx, mx - 16, my - 24, 32, 9, '#1e1b2e', badgeBorder, 1.5);
    ctx.fillStyle = '#f8fafc';
    ctx.font = '700 7px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(pc.identificacao, mx, my - 17.5);
    ctx.textAlign = 'start';
  });
}

/**
 * Compatibilidade: desenha todos os objetos dinâmicos já ordenados por profundidade
 * (sem personagens). O Canvas atual usa coletarObjetosDinamicos para misturar com os bots.
 */
export function renderPcsEMelhorias(
  ctx: CanvasRenderingContext2D,
  computadores: Computador[],
  hoveredPc: number | null,
  tick: number,
  melhorias: MelhoriaEstabelecimento[],
  vista: VistaMundo
) {
  ctx.imageSmoothingEnabled = false;
  renderPlanosDinamicos(ctx, tick, melhorias);
  coletarObjetosDinamicos(computadores, tick, melhorias, vista)
    .sort((a, b) => a.base - b.base)
    .forEach((o) => o.desenhar(ctx));
  renderEtiquetasPcs(ctx, computadores, hoveredPc, vista);
}

/** As paredes agora fazem parte do cache de móveis (renderChaoEMoveis) e ordenam por profundidade. Mantida por compatibilidade. */
export function renderParedes(_ctx: CanvasRenderingContext2D, _vista: VistaMundo) {
  garantirCaches();
}

// Mapa de luz estático: poças de luz colorida por sala (degraus de pixel), montado uma vez e somado
// em 'lighter' por cima de tudo (inclusive dos personagens, que assim recebem o tom da sala).
let cacheLuz: HTMLCanvasElement | null = null;
let versaoLuz = 0;

function construirLuz() {
  const { c, x: l } = novoCanvas();
  SALAS.forEach((s) => {
    if (s.bloqueada || s.tipo === 'CORREDOR' || s.tipo === 'SERVICO') return;
    const x = t(s.x);
    const y = t(s.y);
    const w = t(s.w);
    const h = t(s.h);
    const passo = Math.max(16, Math.round(Math.min(w, h) * 0.1));
    // 4 anéis concêntricos: do contorno da sala para o centro; cada um soma um pouco de luz
    for (let k = 0; k < 4; k++) {
      const o = 8 + k * passo;
      if (w - o * 2 <= 8 || h - o * 2 <= 8) break;
      pxRect(l, x + o, y + o, w - o * 2, h - o * 2, rgbaHex(s.cor, 0.03));
    }
  });
  cacheLuz = c;
  versaoLuz = CACHE_VERSION;
}

/** Camada 6: iluminação neon (tom noturno + brilho de telas, placas e lâmpadas) */
export function renderIluminacao(
  ctx: CanvasRenderingContext2D,
  tick: number,
  computadores: Computador[],
  vista: VistaMundo,
  eventosPc?: Map<number, EstadoPcHypeVisual>
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
  if (!cacheLuz || versaoLuz !== CACHE_VERSION) construirLuz();
  desenharCache(ctx, cacheLuz, vista);

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
    const evPc = eventosPc?.get(pc.numero);
    if (evPc) {
      const alt = Math.floor(tick / 4) % 2 === 0;
      const corHype =
        evPc.tipo === 'LOUCURA'
          ? alt
            ? 'rgba(239,68,68,0.46)'
            : 'rgba(250,204,21,0.44)'
          : alt
          ? 'rgba(250,204,21,0.46)'
          : 'rgba(34,211,238,0.40)';
      glow(seat.x, seat.y - 26, 78, corHype);
    } else {
      glow(seat.x, seat.y - 28, 48, pc.area === 'VIP' ? 'rgba(168,85,247,0.30)' : 'rgba(56,189,248,0.26)');
    }
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
  glow(t(49.5), t(31.5), 115, `rgba(56,189,248,${0.18 * pulso})`); // SALA DE ESPERA SALÃO
  glow(t(72), t(30.6), 95, `rgba(74,222,128,${0.17 * pulso})`); // MESAS DE SINUCA VIP
  glow(t(89.0), t(9.2), 115, `rgba(244,63,94,${0.28 * pulso})`); // CANTINHO SECRETO ROMÂNTICO
  ctx.restore();
}
