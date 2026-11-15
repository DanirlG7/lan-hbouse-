import { TILE_SIZE, WORLD_W } from '../world/constants';
import {
  EstadoCancela,
  PATIO_COORDS,
  ResumoEstacionamento,
  VeiculoEstacionamento,
} from '../world/parking';
import {
  AVENIDA,
  CORES_CARRO,
  ESPEC,
  ESTACIONADOS,
  FAIXAS,
  obterSemaforo,
  obterVeiculos,
  TipoVeiculo,
  Veiculo,
} from '../world/traffic';

type Vista = { x1: number; y1: number; x2: number; y2: number };

const OUT = '#261d2e';
const SOMBRA = 'rgba(14, 10, 24, 0.38)';
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

// ============================================================================
// MARCAÇÕES DA AVENIDA (cache de chão, estático)
// ============================================================================
export function desenharAvenidaChao(f: CanvasRenderingContext2D) {
  const yTopo = AVENIDA.y0;
  // meio-fio e sarjeta
  rect(f, 0, yTopo, WORLD_W, 4, '#64748b');
  rect(f, 0, yTopo + 4, WORLD_W, t(8) - 4, '#1a1829');
  rect(f, 0, t(63.45), WORLD_W, 4, '#3b3a52');

  // textura do asfalto (grãos e remendos determinísticos, sem alterar faixas nem posições)
  for (let gy = yTopo + 4; gy < t(63.45); gy += TILE_SIZE) {
    for (let gx = 0; gx < WORLD_W; gx += TILE_SIZE) {
      const h = (Math.imul(gx / TILE_SIZE + 1, 73856093) ^ Math.imul(gy / TILE_SIZE + 7, 19349663)) >>> 0;
      rect(f, gx + (h % 28), gy + ((h >>> 5) % 24), 2, 2, 'rgba(255, 255, 255, 0.07)');
      rect(f, gx + ((h >>> 11) % 28), gy + ((h >>> 16) % 24), 4, 2, 'rgba(0, 0, 0, 0.16)');
      if (h % 9 === 0) rect(f, gx + 4 + ((h >>> 3) % 16), gy + 8 + ((h >>> 9) % 12), 14, 2, 'rgba(0, 0, 0, 0.10)');
    }
  }
  // brilho do meio-fio sob a luz dos postes
  rect(f, 0, yTopo + 4, WORLD_W, 2, 'rgba(148, 163, 255, 0.14)');

  // limite da faixa de estacionamento (branca contínua) — vazada na faixa de pedestres
  const limiteEstac = Math.round(58.7 * TILE_SIZE);
  for (let x = 0; x < WORLD_W; x += 24) {
    if (x > AVENIDA.faixaPedestreX0 - 24 && x < AVENIDA.faixaPedestreX1 + 24) continue;
    rect(f, x, limiteEstac - 1, 16, 3, '#cbd5e1');
  }

  // divisor central: amarela dupla contínua, com vão na faixa de pedestres
  for (const dy of [-4, 2]) {
    rect(f, 0, AVENIDA.divisorY + dy, AVENIDA.faixaPedestreX0 - 20, 3, '#facc15');
    rect(f, AVENIDA.faixaPedestreX1 + 20, AVENIDA.divisorY + dy, WORLD_W, 3, '#facc15');
  }

  // faixa de pedestres (zebra) e linhas de retenção
  for (let cy = yTopo + 10; cy < t(64) - 10; cy += 22) {
    caixa(f, AVENIDA.faixaPedestreX0, cy, t(3.6), 10, '#f1f5f9', OUT, 2);
  }
  const alturaOeste = FAIXAS[0].yc;
  const alturaLeste = FAIXAS[1].yc;
  rect(f, AVENIDA.linhaParadaOeste - 6, alturaOeste - 30, 8, 60, '#f8fafc');
  rect(f, AVENIDA.linhaParadaLeste - 2, alturaLeste - 30, 8, 60, '#f8fafc');

  // setas pintadas no asfalto
  const seta = (x: number, y: number, dir: 1 | -1) => {
    rect(f, x - 14, y - 2, 28, 4, 'rgba(226,232,240,0.55)');
    for (let i = 0; i < 6; i++) rect(f, x + dir * (14 - i * 2), y - 6 + i, 2, 12 - i * 2, 'rgba(226,232,240,0.55)');
  };
  [8, 20, 52, 70, 86].forEach((tx) => seta(t(tx), alturaOeste, -1));
  [8, 26, 52, 66, 86].forEach((tx) => seta(t(tx), alturaLeste, 1));

  // baia do ponto de ônibus
  f.font = '700 9px "Inter", sans-serif';
  f.fillStyle = 'rgba(250, 204, 21, 0.75)';
  f.fillText('ÔNIBUS', t(30.4), alturaOeste + 3);
  rect(f, t(27.5), alturaOeste - 31, 3, 62, 'rgba(250, 204, 21, 0.55)');
}

// ============================================================================
// DESENHO DE UM VEÍCULO (vista lateral, virado para a direita; espelha se dir = -1)
// ============================================================================
function rodas(ctx: CanvasRenderingContext2D, xs: number[], y: number, tick: number, r = 14) {
  xs.forEach((x, i) => {
    caixa(ctx, x - r / 2, y, r, r - 2, '#1e293b', OUT, 2);
    const g = Math.floor(tick / 3 + i) % 2;
    rect(ctx, x - 4, y + 3, 8, 6, '#475569'); // aro
    rect(ctx, x - 2 + g, y + 4, 4, 3, '#cbd5e1'); // cubo (gira)
  });
}

function carroBase(
  ctx: CanvasRenderingContext2D,
  L: number,
  H: number,
  cor: string,
  escuro: string,
  freando: boolean,
  tick: number,
  cabine: [number, number]
) {
  const x0 = -L / 2;
  const y0 = -H / 2;
  rect(ctx, x0 + 4, y0 + H - 4, L - 8, 5, SOMBRA);
  // cabine
  const cx = x0 + L * cabine[0];
  const cw = L * (cabine[1] - cabine[0]);
  caixa(ctx, cx, y0, cw, H * 0.5, cor, OUT, 2);
  rect(ctx, cx + 4, y0 + 4, cw * 0.44 - 4, H * 0.3, '#a5e3ff');
  rect(ctx, cx + cw * 0.5 + 2, y0 + 4, cw * 0.5 - 6, H * 0.3, '#a5e3ff');
  rect(ctx, cx + 4, y0 + 4, 3, H * 0.3, 'rgba(255,255,255,0.55)');
  rect(ctx, cx + 4, y0 + 4 + H * 0.3 - 3, cw - 8, 3, 'rgba(20, 50, 110, 0.30)'); // vidro: parte inferior mais escura
  rect(ctx, cx + cw * 0.5 - 1, y0 + 3, 2, H * 0.34, 'rgba(8, 4, 24, 0.55)'); // coluna central
  // carroceria
  caixa(ctx, x0, y0 + H * 0.38, L, H * 0.46, cor, OUT, 2);
  rect(ctx, x0 + 4, y0 + H * 0.58, L - 8, 3, escuro);
  rect(ctx, x0 + 4, y0 + H * 0.42, L - 8, 2, 'rgba(255,255,255,0.28)');
  // portas: friso, maçanetas e retrovisor
  rect(ctx, x0 + L * 0.5 - 1, y0 + H * 0.44, 2, H * 0.34, 'rgba(8, 4, 24, 0.30)');
  rect(ctx, x0 + L * 0.5 + 3, y0 + H * 0.5, 4, 2, 'rgba(255,255,255,0.45)');
  rect(ctx, x0 + L * 0.5 - 8, y0 + H * 0.5, 4, 2, 'rgba(255,255,255,0.45)');
  rect(ctx, cx + cw - 1, y0 + H * 0.36, 4, 3, 'rgba(14, 10, 30, 0.85)');
  // caixas de roda
  rect(ctx, x0 + L * 0.22 - 9, y0 + H * 0.78, 18, 3, 'rgba(8, 4, 24, 0.30)');
  rect(ctx, x0 + L * 0.78 - 9, y0 + H * 0.78, 18, 3, 'rgba(8, 4, 24, 0.30)');
  // faróis e lanternas
  rect(ctx, x0 + L - 7, y0 + H * 0.46, 6, 6, '#fef08a');
  rect(ctx, x0 + 1, y0 + H * 0.46, 5, 6, freando ? '#ff3b3b' : '#7f1d1d');
  rect(ctx, x0 + L - 3, y0 + H * 0.7, 3, 4, '#475569');
  rect(ctx, x0, y0 + H * 0.7, 3, 4, '#475569');
  rodas(ctx, [x0 + L * 0.22, x0 + L * 0.78], y0 + H - 13, tick);
}

function desenharCorpo(ctx: CanvasRenderingContext2D, v: Pick<Veiculo, 'tipo' | 'cor' | 'corEscura' | 'freando' | 'comp' | 'alt'>, tick: number, dir: 1 | -1) {
  const L = v.comp;
  const H = v.alt;
  const x0 = -L / 2;
  const y0 = -H / 2;

  switch (v.tipo) {
    case 'HATCH':
    case 'SEDAN':
      carroBase(ctx, L, H, v.cor, v.corEscura, v.freando, tick, v.tipo === 'HATCH' ? [0.2, 0.8] : [0.24, 0.72]);
      break;
    case 'SUV':
      carroBase(ctx, L, H, v.cor, v.corEscura, v.freando, tick, [0.14, 0.78]);
      rect(ctx, x0 + L * 0.2, y0 - 2, L * 0.5, 3, '#334155');
      break;
    case 'TAXI':
      carroBase(ctx, L, H, v.cor, v.corEscura, v.freando, tick, [0.24, 0.72]);
      caixa(ctx, -8, y0 - 7, 16, 8, '#f8fafc', OUT, 2);
      rect(ctx, -5, y0 - 4, 10, 2, '#1e1b2e');
      for (let i = 0; i < L - 12; i += 8) rect(ctx, x0 + 6 + i, y0 + H * 0.6, 4, 3, i % 16 === 0 ? '#111827' : '#facc15');
      break;
    case 'PICKUP': {
      carroBase(ctx, L, H, v.cor, v.corEscura, v.freando, tick, [0.5, 0.88]);
      caixa(ctx, x0, y0 + H * 0.3, L * 0.44, H * 0.2, '#334155', OUT, 2); // caçamba aberta
      rect(ctx, x0 + 4, y0 + H * 0.34, L * 0.44 - 8, 4, '#64748b');
      break;
    }
    case 'VAN':
      rect(ctx, x0 + 4, y0 + H - 4, L - 8, 5, SOMBRA);
      caixa(ctx, x0, y0, L, H * 0.84, v.cor, OUT, 2);
      caixa(ctx, x0 + L * 0.72, y0 + 4, L * 0.24, H * 0.36, '#a5e3ff', OUT, 2);
      rect(ctx, x0 + 8, y0 + 10, L * 0.55, 6, '#16a34a');
      rect(ctx, x0 + 8, y0 + 20, L * 0.4, 4, '#fb923c');
      rect(ctx, x0 + L - 7, y0 + H * 0.56, 6, 6, '#fef08a');
      rect(ctx, x0 + 1, y0 + H * 0.56, 5, 6, v.freando ? '#ff3b3b' : '#7f1d1d');
      rodas(ctx, [x0 + L * 0.2, x0 + L * 0.8], y0 + H - 13, tick);
      break;
    case 'ONIBUS': {
      rect(ctx, x0 + 4, y0 + H - 4, L - 8, 5, SOMBRA);
      caixa(ctx, x0, y0, L, H * 0.86, '#f1f5f9', OUT, 2);
      rect(ctx, x0 + 3, y0 + H * 0.5, L - 6, 6, v.cor); // faixa da linha
      rect(ctx, x0 + 3, y0 + H * 0.62, L - 6, 3, v.corEscura);
      for (let i = 0; i < 7; i++) {
        caixa(ctx, x0 + 12 + i * 28, y0 + 6, 22, 16, '#7dd3fc', OUT, 2);
        rect(ctx, x0 + 15 + i * 28, y0 + 8, 3, 12, 'rgba(255,255,255,0.5)');
      }
      caixa(ctx, x0 + L - 38, y0 + 6, 18, H * 0.74, '#cbd5e1', OUT, 2); // porta
      caixa(ctx, x0 + L - 20, y0 + 4, 18, 20, '#7dd3fc', OUT, 2); // para-brisa
      rect(ctx, x0 + 40, y0 - 3, 42, 4, '#94a3b8'); // ar-condicionado
      rect(ctx, x0 + L - 7, y0 + H * 0.62, 6, 6, '#fef08a');
      rect(ctx, x0 + 1, y0 + H * 0.62, 5, 6, v.freando ? '#ff3b3b' : '#7f1d1d');
      rodas(ctx, [x0 + 34, x0 + 62, x0 + L - 38], y0 + H - 14, tick, 15);
      break;
    }
    case 'MOTO':
    case 'ENTREGA': {
      rect(ctx, x0 + 4, y0 + H - 4, L - 8, 4, SOMBRA);
      rodas(ctx, [x0 + 12, x0 + L - 12], y0 + H - 13, tick, 14);
      caixa(ctx, x0 + 14, y0 + H * 0.45, L - 28, 10, v.cor, OUT, 2);
      rect(ctx, x0 + L - 14, y0 + H * 0.35, 4, 8, '#94a3b8'); // guidão
      rect(ctx, x0 + L - 8, y0 + H * 0.48, 5, 4, '#fef08a');
      rect(ctx, x0 + 3, y0 + H * 0.5, 4, 4, v.freando ? '#ff3b3b' : '#7f1d1d');
      caixa(ctx, x0 + L * 0.42, y0 + 4, 12, 16, v.tipo === 'ENTREGA' ? '#ef4444' : '#2563eb', OUT, 2); // piloto
      caixa(ctx, x0 + L * 0.42 + 1, y0 - 4, 11, 10, '#e2e8f0', OUT, 2); // capacete
      rect(ctx, x0 + L * 0.42 + 6, y0 - 1, 5, 4, '#1e293b');
      if (v.tipo === 'ENTREGA') {
        caixa(ctx, x0 + 2, y0 + 6, 20, 20, '#dc2626', OUT, 2);
        rect(ctx, x0 + 5, y0 + 14, 14, 3, '#f8fafc');
      }
      break;
    }
  }

  // texto do ônibus (sem espelhar)
  if (v.tipo === 'ONIBUS') {
    ctx.save();
    ctx.font = '700 9px "Inter", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#0f172a';
    ctx.translate(x0 + L * 0.5, y0 + H * 0.5 + 6);
    ctx.scale(dir, 1);
    ctx.fillText('204 · CENTRO', 0, 0);
    ctx.restore();
  }
}

function desenharVeiculo(ctx: CanvasRenderingContext2D, v: Veiculo, tick: number) {
  ctx.save();
  ctx.translate(Math.round(v.x), Math.round(v.y));
  if (v.dir === -1) ctx.scale(-1, 1);
  desenharCorpo(ctx, v, tick, v.dir);
  ctx.restore();
}

// ============================================================================
// CARROS ESTACIONADOS (cache de móveis, estático)
// ============================================================================
export function desenharEstacionados(m: CanvasRenderingContext2D) {
  ESTACIONADOS.forEach((e) => {
    const esp = ESPEC[e.tipo as TipoVeiculo];
    const par = CORES_CARRO[e.cor % CORES_CARRO.length];
    const cor = e.tipo === 'VAN' ? '#f1f5f9' : par[0];
    m.save();
    m.translate(t(e.x), AVENIDA.estacionamentoY);
    if (e.dir === -1) m.scale(-1, 1);
    desenharCorpo(
      m,
      { tipo: e.tipo, cor, corEscura: par[1], freando: false, comp: esp.comp, alt: esp.alt },
      0,
      e.dir
    );
    m.restore();
  });
}

// ============================================================================
// SEMÁFORO (dinâmico) E CAMADA DE VEÍCULOS
// ============================================================================
function desenharSemaforo(ctx: CanvasRenderingContext2D, x: number, y: number, estado: ReturnType<typeof obterSemaforo>) {
  rect(ctx, x - 2, y - 6, 4, 22, '#475569');
  caixa(ctx, x - 7, y - 40, 14, 36, '#161225', OUT, 2);
  const lamp = (ly: number, ativo: boolean, cor: string, apagada: string) => rect(ctx, x - 3, y - 37 + ly, 6, 6, ativo ? cor : apagada);
  lamp(0, estado === 'VERMELHO', '#ff4d4d', '#4c1414');
  lamp(10, estado === 'AMARELO', '#ffd23f', '#4a3a10');
  lamp(20, estado === 'VERDE', '#4ade80', '#123d25');
}

const noVista = (x: number, v: Vista, folga: number) => x > v.x1 - folga && x < v.x2 + folga;

export function renderTrafego(ctx: CanvasRenderingContext2D, tick: number, vista: Vista) {
  if (vista.y2 < AVENIDA.y0 - 80) return;
  const estado = obterSemaforo();
  const lista = obterVeiculos();

  // só o pedaço da avenida dentro do mundo (os carros "nascem" nas bordas do mapa)
  ctx.save();
  ctx.beginPath();
  ctx.rect(0, AVENIDA.y0, WORLD_W, AVENIDA.y1 - AVENIDA.y0);
  ctx.clip();
  FAIXAS.forEach((f) => {
    lista
      .filter((v) => v.faixa === f.id && noVista(v.x, vista, v.comp))
      .forEach((v) => desenharVeiculo(ctx, v, tick));
  });
  ctx.restore();

  desenharSemaforo(ctx, AVENIDA.semaforoLesteX, AVENIDA.semaforoY, estado);
  desenharSemaforo(ctx, AVENIDA.semaforoOesteX, AVENIDA.semaforoY, estado);
}

/** Faróis, lanternas de freio e luz do semáforo (somados à cena, depois da iluminação) */
export function renderTrafegoLuzes(ctx: CanvasRenderingContext2D, tick: number, vista: Vista) {
  if (vista.y2 < AVENIDA.y0 - 80) return;
  const estado = obterSemaforo();
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  obterVeiculos().forEach((v) => {
    if (!noVista(v.x, vista, v.comp + 120)) return;
    const frente = v.x + (v.dir * v.comp) / 2;
    const g = ctx.createRadialGradient(frente + v.dir * 26, v.y + 3, 2, frente + v.dir * 26, v.y + 3, 62);
    g.addColorStop(0, 'rgba(254, 240, 138, 0.2)');
    g.addColorStop(1, 'rgba(254, 240, 138, 0)');
    ctx.fillStyle = g;
    ctx.fillRect(frente + v.dir * 26 - 62, v.y + 3 - 62, 124, 124);
    if (v.freando) {
      const tr = v.x - (v.dir * v.comp) / 2;
      const r = ctx.createRadialGradient(tr, v.y + 2, 1, tr, v.y + 2, 30);
      r.addColorStop(0, 'rgba(255, 60, 60, 0.5)');
      r.addColorStop(1, 'rgba(255, 60, 60, 0)');
      ctx.fillStyle = r;
      ctx.fillRect(tr - 32, v.y - 30, 64, 60);
    }
  });

  const cor = estado === 'VERDE' ? '74, 222, 128' : estado === 'AMARELO' ? '255, 210, 63' : '255, 77, 77';
  const yL = AVENIDA.semaforoY - 37 + (estado === 'VERMELHO' ? 3 : estado === 'AMARELO' ? 13 : 23);
  [AVENIDA.semaforoLesteX, AVENIDA.semaforoOesteX].forEach((sx) => {
    const g = ctx.createRadialGradient(sx, yL, 1, sx, yL, 34);
    g.addColorStop(0, `rgba(${cor}, 0.6)`);
    g.addColorStop(1, `rgba(${cor}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(sx - 36, yL - 36, 72, 72);
  });
  ctx.restore();
  void tick;
}

// ============================================================================
// ESTACIONAMENTO PAGO: CARROS VERTICAIS (TOP-DOWN), CANCELAS E PAINEL LED
// ============================================================================

/** Desenho pixel-art top-down vertical dedicado (nunca rotaciona carro de perfil lateral). */
function desenharVeiculoVertical(
  ctx: CanvasRenderingContext2D,
  v: VeiculoEstacionamento,
  tick: number
) {
  const dirY = v.orientacao === 'DOWN' ? 1 : -1;
  const W = Math.round(v.alt * 0.96); // ~36..42 px de largura
  const L = Math.round(v.comp * 0.94); // ~86..110 px de comprimento vertical
  const x0 = Math.round(-W / 2);
  const y0 = Math.round(-L / 2);

  ctx.save();
  ctx.translate(Math.round(v.x), Math.round(v.y));

  // Sombra sob o chassi
  rect(ctx, x0 + 3, y0 + 4, W - 2, L - 2, SOMBRA);

  // Rodas nos 4 cantos (salientes 2px para fora)
  const rodaY1 = y0 + Math.round(L * 0.16);
  const rodaY2 = y0 + Math.round(L * 0.72);
  const rodaH = Math.max(12, Math.round(L * 0.13));
  rect(ctx, x0 - 2, rodaY1, 3, rodaH, '#0f172a');
  rect(ctx, x0 + W - 1, rodaY1, 3, rodaH, '#0f172a');
  rect(ctx, x0 - 2, rodaY2, 3, rodaH, '#0f172a');
  rect(ctx, x0 + W - 1, rodaY2, 3, rodaH, '#0f172a');

  // Carroceria principal
  caixa(ctx, x0, y0, W, L, v.cor, OUT, 2);
  // Realce lateral esquerda e sombreamento direito 3/4
  rect(ctx, x0 + 2, y0 + 2, 4, L - 4, 'rgba(255,255,255,0.16)');
  rect(ctx, x0 + W - 6, y0 + 2, 4, L - 4, v.corEscura);

  if (dirY === -1) {
    // Subindo ↑: frente em cima (-L/2), traseira embaixo (+L/2)
    // Vincos do capô
    rect(ctx, x0 + 7, y0 + 5, 2, Math.round(L * 0.2), v.corEscura);
    rect(ctx, x0 + W - 9, y0 + 5, 2, Math.round(L * 0.2), v.corEscura);
    // Para-brisa dianteiro
    const wsY = y0 + Math.round(L * 0.27);
    const wsH = Math.round(L * 0.15);
    caixa(ctx, x0 + 5, wsY, W - 10, wsH, '#7dd3fc', OUT, 1.5);
    rect(ctx, x0 + 7, wsY + 2, 5, wsH - 4, 'rgba(255,255,255,0.45)');
    // Retrovisores
    rect(ctx, x0 - 3, wsY + 3, 4, 4, v.corEscura);
    rect(ctx, x0 + W - 1, wsY + 3, 4, 4, v.corEscura);

    if (v.tipo === 'PICKUP') {
      // Caçamba traseira escura
      caixa(ctx, x0 + 5, y0 + Math.round(L * 0.56), W - 10, Math.round(L * 0.37), '#1e293b', OUT, 1.5);
    } else {
      // Teto e vidro traseiro
      const tetoY = wsY + wsH + 2;
      const tetoH = Math.round(L * 0.26);
      caixa(ctx, x0 + 5, tetoY, W - 10, tetoH, v.cor, OUT, 1.5);
      rect(ctx, x0 + 6, tetoY + 2, 4, tetoH - 4, 'rgba(255,255,255,0.22)');
      caixa(ctx, x0 + 6, tetoY + tetoH + 2, W - 12, Math.round(L * 0.11), '#38bdf8', OUT, 1.5);
    }

    // Faróis (topo) e lanternas/freio (base)
    rect(ctx, x0 + 4, y0 + 1, 7, 3, '#fef08a');
    rect(ctx, x0 + W - 11, y0 + 1, 7, 3, '#fef08a');
    const tailCor = v.freando ? '#ff3b3b' : '#b91c1c';
    rect(ctx, x0 + 4, y0 + L - 4, 7, 3, tailCor);
    rect(ctx, x0 + W - 11, y0 + L - 4, 7, 3, tailCor);
  } else {
    // Descendo ↓: traseira em cima (-L/2), frente embaixo (+L/2)
    if (v.tipo === 'PICKUP') {
      caixa(ctx, x0 + 5, y0 + Math.round(L * 0.08), W - 10, Math.round(L * 0.36), '#1e293b', OUT, 1.5);
    } else {
      const rwY = y0 + Math.round(L * 0.13);
      caixa(ctx, x0 + 6, rwY, W - 12, Math.round(L * 0.11), '#38bdf8', OUT, 1.5);
      const tetoY = rwY + Math.round(L * 0.12);
      const tetoH = Math.round(L * 0.26);
      caixa(ctx, x0 + 5, tetoY, W - 10, tetoH, v.cor, OUT, 1.5);
      rect(ctx, x0 + 6, tetoY + 2, 4, tetoH - 4, 'rgba(255,255,255,0.22)');
    }

    // Para-brisa dianteiro (parte inferior voltada ↓)
    const wsY = y0 + Math.round(L * 0.56);
    const wsH = Math.round(L * 0.15);
    caixa(ctx, x0 + 5, wsY, W - 10, wsH, '#7dd3fc', OUT, 1.5);
    rect(ctx, x0 + 7, wsY + 2, 5, wsH - 4, 'rgba(255,255,255,0.45)');
    // Retrovisores
    rect(ctx, x0 - 3, wsY + 2, 4, 4, v.corEscura);
    rect(ctx, x0 + W - 1, wsY + 2, 4, 4, v.corEscura);
    // Vincos do capô
    rect(ctx, x0 + 7, y0 + L - Math.round(L * 0.24), 2, Math.round(L * 0.18), v.corEscura);
    rect(ctx, x0 + W - 9, y0 + L - Math.round(L * 0.24), 2, Math.round(L * 0.18), v.corEscura);

    // Lanternas traseiras (topo) e faróis dianteiros (base)
    const tailCor = v.freando ? '#ff3b3b' : '#b91c1c';
    rect(ctx, x0 + 4, y0 + 1, 7, 3, tailCor);
    rect(ctx, x0 + W - 11, y0 + 1, 7, 3, tailCor);
    rect(ctx, x0 + 4, y0 + L - 4, 7, 3, '#fef08a');
    rect(ctx, x0 + W - 11, y0 + L - 4, 7, 3, '#fef08a');
  }

  if (v.tipo === 'TAXI') {
    caixa(ctx, -7, -6, 14, 7, '#facc15', OUT, 1.5);
  } else if (v.tipo === 'SUV') {
    rect(ctx, x0 + 7, -Math.round(L * 0.12), 2, Math.round(L * 0.24), '#94a3b8');
    rect(ctx, x0 + W - 9, -Math.round(L * 0.12), 2, Math.round(L * 0.24), '#94a3b8');
  }

  ctx.restore();
  void tick;
}

function desenharCancela(
  ctx: CanvasRenderingContext2D,
  pivotX: number,
  pivotY: number,
  apontaParaDireita: boolean,
  comprimento: number,
  cancela: EstadoCancela
) {
  // Base / motor da cancela
  caixa(ctx, pivotX - 7, pivotY - 12, 14, 18, '#f59e0b', OUT, 2);
  rect(ctx, pivotX - 5, pivotY - 10, 10, 5, '#1e293b');
  // Sinaleiro LED no topo do totem
  rect(ctx, pivotX - 3, pivotY - 15, 6, 4, cancela.luzVerde ? '#22c55e' : '#ef4444');

  // Sombra no chão quando a barra está abaixada
  const dirX = apontaParaDireita ? 1 : -1;
  if (cancela.abertura < 0.85) {
    ctx.save();
    ctx.globalAlpha = (1 - cancela.abertura) * 0.35;
    rect(
      ctx,
      apontaParaDireita ? pivotX : pivotX - comprimento,
      pivotY + 2,
      comprimento,
      4,
      '#020617'
    );
    ctx.restore();
  }

  // Barra listrada vermelho/branco que rotaciona levantando/abaixando
  ctx.save();
  ctx.translate(pivotX, pivotY - 6);
  const angulo = apontaParaDireita ? -cancela.abertura * 1.28 : cancela.abertura * 1.28;
  ctx.rotate(angulo);

  const gomo = 10;
  const passos = Math.ceil(comprimento / gomo);
  for (let i = 0; i < passos; i++) {
    const segW = Math.min(gomo, comprimento - i * gomo);
    const sx = dirX === 1 ? i * gomo : -((i + 1) * gomo);
    const cor = i % 2 === 0 ? '#ef4444' : '#f8fafc';
    caixa(ctx, sx, -3, segW, 6, cor, OUT, 1);
  }
  // Contrapeso traseiro
  caixa(ctx, dirX === 1 ? -10 : 0, -4, 10, 8, '#334155', OUT, 1.5);
  ctx.restore();
}

export function renderEstacionamento(
  ctx: CanvasRenderingContext2D,
  tick: number,
  vista: Vista,
  resumo: ResumoEstacionamento,
  tarifaBase: number,
  sistemaAtivo: boolean
) {
  if (vista.x2 < PATIO_COORDS.areaX0 - 80 || vista.x1 > PATIO_COORDS.areaX1 + 80) return;

  // 1) Painel Digital LED no topo do pátio (y=16.5..18.2)
  const signX = t(84.45);
  const signY = t(16.45);
  const signW = t(9.1);
  const signH = 52;
  caixa(ctx, signX, signY, signW, signH, '#0f172a', OUT, 2);
  rect(ctx, signX + 4, signY + 4, signW - 8, signH - 8, '#020617');
  const temVaga = resumo.vagasLivres > 0;
  const corLed = temVaga ? '#4ade80' : '#f87171';
  rect(ctx, signX + 6, signY + 6, signW - 12, 2, corLed);

  ctx.save();
  ctx.textAlign = 'center';
  ctx.font = '800 11px "Inter", sans-serif';
  ctx.fillStyle = corLed;
  const tituloPlaca = temVaga
    ? `VAGAS: ${resumo.vagasLivres}/${resumo.totalVagas} LIVRES`
    : `LOTADO: ${resumo.totalVagas}/${resumo.totalVagas} OCUP.`;
  ctx.fillText(tituloPlaca, signX + signW / 2, signY + 23);

  ctx.font = '700 8.5px "Inter", sans-serif';
  ctx.fillStyle = '#bae6fd';
  ctx.fillText(
    `OCUP: ${resumo.vagasOcupadas} • ${sistemaAtivo ? `R$ ${tarifaBase.toFixed(0)} PAGO` : 'ACESSO LIVRE'}`,
    signX + signW / 2,
    signY + 39
  );
  ctx.restore();

  // 2) Sensores individuais das 8 vagas (LED verde/vermelho/âmbar)
  resumo.vagas.forEach((vg) => {
    const cor = vg.ocupadaPorPlaca
      ? '#ef4444'
      : vg.reservadaPorPlaca
        ? '#f59e0b'
        : '#22c55e';
    rect(ctx, t(84.17), vg.yCentro - 3, 6, 6, cor);
  });

  // 3) Veículos dentro do pátio e rampa (ordenados por Y)
  const ordenados = [...resumo.veiculosNoPatio].sort((a, b) => a.y - b.y);
  for (const v of ordenados) {
    if (v.orientacao === 'UP' || v.orientacao === 'DOWN') {
      desenharVeiculoVertical(ctx, v, tick);
    } else {
      const dir = v.orientacao === 'RIGHT' ? 1 : -1;
      ctx.save();
      ctx.translate(Math.round(v.x), Math.round(v.y));
      if (dir === -1) ctx.scale(-1, 1);
      desenharCorpo(
        ctx,
        {
          tipo: v.tipo,
          cor: v.cor,
          corEscura: v.corEscura,
          freando: v.freando,
          comp: v.comp,
          alt: v.alt,
        },
        tick,
        dir
      );
      ctx.restore();
    }
  }

  // 4) Cancelas animadas de Entrada e Saída na Portaria
  desenharCancela(
    ctx,
    t(88.4),
    PATIO_COORDS.cancelaSaidaY,
    true,
    t(2.4),
    resumo.cancelaSaida
  );
  desenharCancela(
    ctx,
    t(93.45),
    PATIO_COORDS.cancelaEntradaY,
    false,
    t(2.45),
    resumo.cancelaEntrada
  );
}

export function renderEstacionamentoLuzes(
  ctx: CanvasRenderingContext2D,
  _tick: number,
  vista: Vista,
  resumo: ResumoEstacionamento
) {
  if (vista.x2 < PATIO_COORDS.areaX0 - 80 || vista.x1 > PATIO_COORDS.areaX1 + 80) return;

  ctx.save();
  ctx.globalCompositeOperation = 'lighter';

  // Halos das cancelas
  [
    { x: t(88.4), y: PATIO_COORDS.cancelaSaidaY - 14, verde: resumo.cancelaSaida.luzVerde },
    { x: t(93.45), y: PATIO_COORDS.cancelaEntradaY - 14, verde: resumo.cancelaEntrada.luzVerde },
  ].forEach((b) => {
    const g = ctx.createRadialGradient(b.x, b.y, 1, b.x, b.y, 26);
    const rgb = b.verde ? '74, 222, 128' : '248, 113, 113';
    g.addColorStop(0, `rgba(${rgb}, 0.55)`);
    g.addColorStop(1, `rgba(${rgb}, 0)`);
    ctx.fillStyle = g;
    ctx.fillRect(b.x - 28, b.y - 28, 56, 56);
  });

  // Faróis de carros em movimento no estacionamento
  resumo.veiculosNoPatio.forEach((v) => {
    if (v.fase === 'PARKED') return;
    if (v.orientacao === 'UP' || v.orientacao === 'DOWN') {
      const dy = v.orientacao === 'DOWN' ? 1 : -1;
      const ly = v.y + (dy * v.comp) / 2 + dy * 14;
      const g = ctx.createRadialGradient(v.x, ly, 2, v.x, ly, 44);
      g.addColorStop(0, 'rgba(254, 240, 138, 0.18)');
      g.addColorStop(1, 'rgba(254, 240, 138, 0)');
      ctx.fillStyle = g;
      ctx.fillRect(v.x - 46, ly - 46, 92, 92);
    }
  });

  ctx.restore();
}
