import { TILE_SIZE, WORLD_W } from './constants';

/**
 * TRÂNSITO DA AVENIDA (lógica pura, sem desenho)
 *
 * Rua = y 56..64 tiles (256 px), de cima para baixo:
 *   56.0–58.7  faixa de estacionamento (carros parados e o food truck)
 *   58.7–60.8  faixa OESTE (sentido ←, lado da calçada)
 *   60.8–61.2  divisor (faixa amarela dupla)
 *   61.2–63.3  faixa LESTE (sentido →)
 *   63.3–64.0  sarjeta
 * No Brasil se dirige pela direita: quem vai para leste usa a faixa de baixo.
 */
const t = (v: number) => Math.round(v * TILE_SIZE);

export type TipoVeiculo = 'HATCH' | 'SEDAN' | 'SUV' | 'PICKUP' | 'TAXI' | 'VAN' | 'ONIBUS' | 'MOTO' | 'ENTREGA';
export type IdFaixa = 'OESTE' | 'LESTE';
export type EstadoSemaforo = 'VERDE' | 'AMARELO' | 'VERMELHO';

export const AVENIDA = {
  y0: t(56),
  y1: t(64),
  estacionamentoY: t(57.35),
  divisorY: t(61),
  faixaPedestreX0: t(38.2),
  faixaPedestreX1: t(41.8),
  /** a frente do carro que vai para OESTE para antes de x = linhaParadaOeste */
  linhaParadaOeste: t(42.5),
  /** a frente do carro que vai para LESTE para antes de x = linhaParadaLeste */
  linhaParadaLeste: t(37.5),
  /** ônibus (sentido oeste) para com a frente nesta posição, em frente ao ponto da calçada */
  pontoOnibusFrenteX: t(27.5),
  semaforoOesteX: t(43.1),
  semaforoLesteX: t(36.9),
  semaforoY: t(55.45),
};

export interface Faixa {
  id: IdFaixa;
  dir: 1 | -1;
  yc: number;
  linhaParada: number;
}

export const FAIXAS: Faixa[] = [
  { id: 'OESTE', dir: -1, yc: Math.round(59.75 * TILE_SIZE), linhaParada: AVENIDA.linhaParadaOeste },
  { id: 'LESTE', dir: 1, yc: Math.round(62.25 * TILE_SIZE), linhaParada: AVENIDA.linhaParadaLeste },
];

export interface EspecVeiculo {
  comp: number;
  alt: number;
  vMin: number;
  vMax: number;
  peso: number;
}

/** px e px/s (1 tile = 32 px) */
export const ESPEC: Record<TipoVeiculo, EspecVeiculo> = {
  HATCH: { comp: 92, alt: 38, vMin: 150, vMax: 225, peso: 22 },
  SEDAN: { comp: 104, alt: 38, vMin: 155, vMax: 230, peso: 22 },
  SUV: { comp: 110, alt: 44, vMin: 145, vMax: 215, peso: 14 },
  PICKUP: { comp: 118, alt: 44, vMin: 140, vMax: 210, peso: 9 },
  TAXI: { comp: 104, alt: 38, vMin: 140, vMax: 200, peso: 8 },
  VAN: { comp: 130, alt: 50, vMin: 120, vMax: 180, peso: 6 },
  ONIBUS: { comp: 236, alt: 56, vMin: 105, vMax: 145, peso: 4 },
  MOTO: { comp: 58, alt: 36, vMin: 190, vMax: 285, peso: 9 },
  ENTREGA: { comp: 64, alt: 38, vMin: 200, vMax: 290, peso: 6 },
};

/** [cor principal, cor escura] */
export const CORES_CARRO: Array<[string, string]> = [
  ['#ef4444', '#991b1b'],
  ['#3b82f6', '#1e3a8a'],
  ['#e5e7eb', '#9ca3af'],
  ['#1f2937', '#0b1220'],
  ['#22c55e', '#166534'],
  ['#f59e0b', '#92400e'],
  ['#a855f7', '#581c87'],
  ['#94a3b8', '#475569'],
  ['#0ea5e9', '#0c4a6e'],
  ['#be123c', '#4c0519'],
];

export interface Veiculo {
  id: number;
  tipo: TipoVeiculo;
  faixa: IdFaixa;
  dir: 1 | -1;
  /** centro do veículo (px do mundo) */
  x: number;
  y: number;
  v: number;
  vDesejada: number;
  comp: number;
  alt: number;
  cor: string;
  corEscura: string;
  freando: boolean;
  /** segundos restantes parado no ponto (ônibus) */
  paradaRestante: number;
  jaParou: boolean;
}

const ACEL = 120; // px/s²
const FREIO = 280; // px/s²

/** Ciclo do semáforo (s): verde 12, amarelo 2, vermelho 8 */
const CICLO = { verde: 12, amarelo: 2, vermelho: 8 };
const DURACAO_CICLO = CICLO.verde + CICLO.amarelo + CICLO.vermelho;

export function estadoSemaforo(tempo: number): EstadoSemaforo {
  const c = ((tempo % DURACAO_CICLO) + DURACAO_CICLO) % DURACAO_CICLO;
  if (c < CICLO.verde) return 'VERDE';
  if (c < CICLO.verde + CICLO.amarelo) return 'AMARELO';
  return 'VERMELHO';
}

let veiculos: Veiculo[] = [];
let tempoSim = Math.random() * DURACAO_CICLO;
let proximoId = 1;
let aquecido = false;
const timerSpawn: Record<IdFaixa, number> = { OESTE: 0.5, LESTE: 1.5 };

const rand = (a: number, b: number) => a + Math.random() * (b - a);

function sortearTipo(): TipoVeiculo {
  const tipos = Object.keys(ESPEC) as TipoVeiculo[];
  const total = tipos.reduce((s, k) => s + ESPEC[k].peso, 0);
  let r = Math.random() * total;
  for (const k of tipos) {
    r -= ESPEC[k].peso;
    if (r <= 0) return k;
  }
  return 'HATCH';
}

function corPara(tipo: TipoVeiculo): [string, string] {
  if (tipo === 'TAXI') return ['#facc15', '#a16207'];
  if (tipo === 'ONIBUS') return ['#2563eb', '#1e3a8a'];
  if (tipo === 'VAN') return ['#f1f5f9', '#94a3b8'];
  if (tipo === 'ENTREGA') return ['#1f2937', '#0b1220'];
  return CORES_CARRO[Math.floor(Math.random() * CORES_CARRO.length)];
}

function tentarSpawn(f: Faixa) {
  const tipo = sortearTipo();
  const esp = ESPEC[tipo];
  const entrada = f.dir === 1 ? -esp.comp / 2 - 8 : WORLD_W + esp.comp / 2 + 8;
  const livre = veiculos.every(
    (o) => o.faixa !== f.id || Math.abs(o.x - entrada) > (o.comp + esp.comp) / 2 + 90
  );
  if (!livre) {
    timerSpawn[f.id] = 0.4;
    return;
  }
  const [cor, corEscura] = corPara(tipo);
  const vd = rand(esp.vMin, esp.vMax);
  veiculos.push({
    id: proximoId++,
    tipo,
    faixa: f.id,
    dir: f.dir,
    x: entrada,
    y: f.yc,
    v: vd,
    vDesejada: vd,
    comp: esp.comp,
    alt: esp.alt,
    cor,
    corEscura,
    freando: false,
    paradaRestante: 0,
    jaParou: false,
  });
  timerSpawn[f.id] = rand(1.3, 4.2);
}

function passo(dt: number) {
  tempoSim += dt;
  const luz = estadoSemaforo(tempoSim);

  FAIXAS.forEach((f) => {
    timerSpawn[f.id] -= dt;
    if (timerSpawn[f.id] <= 0) tentarSpawn(f);

    const d = f.dir;
    const fila = veiculos.filter((v) => v.faixa === f.id).sort((a, b) => d * (b.x - a.x)); // líder primeiro

    fila.forEach((v, i) => {
      const lider = i > 0 ? fila[i - 1] : null;
      const frente = v.x + (d * v.comp) / 2;
      let alvo = v.vDesejada;

      // 1) seguir o carro da frente
      if (lider) {
        const traseiraLider = lider.x - (d * lider.comp) / 2;
        const gap = d * (traseiraLider - frente);
        const seguro = 26 + v.v * 0.55;
        if (gap < seguro * 2.5) alvo = Math.min(alvo, Math.max(0, lider.v + (gap - seguro) * 1.4));
      }

      // 2) semáforo / faixa de pedestres
      if (luz !== 'VERDE') {
        const dist = d * (f.linhaParada - frente);
        if (dist >= -2) {
          const distParada = (v.v * v.v) / (2 * FREIO);
          if (dist >= distParada - 6) {
            alvo = dist <= 4 ? 0 : Math.min(alvo, Math.sqrt(2 * FREIO * 0.75 * (dist - 4)));
          }
        }
      }

      // 3) ponto de ônibus (só ônibus no sentido oeste)
      if (v.tipo === 'ONIBUS' && f.id === 'OESTE' && !v.jaParou) {
        const dist = d * (AVENIDA.pontoOnibusFrenteX - frente);
        if (v.paradaRestante > 0) {
          alvo = 0;
          v.paradaRestante -= dt;
          if (v.paradaRestante <= 0) {
            v.paradaRestante = 0;
            v.jaParou = true;
          }
        } else if (dist >= -2) {
          alvo = dist <= 3 ? 0 : Math.min(alvo, Math.sqrt(2 * FREIO * 0.7 * (dist - 3)));
          if (dist <= 6 && v.v < 3) v.paradaRestante = 3.6;
        }
      }

      const dv = alvo - v.v;
      v.v += Math.max(-FREIO * dt, Math.min(ACEL * dt, dv));
      if (alvo === 0 && v.v < 1) v.v = 0;
      v.v = Math.max(0, v.v);
      v.freando = alvo < v.v - 6 || (alvo === 0 && v.v < 25);
      v.x += d * v.v * dt;

      // segurança: nunca invadir o carro da frente
      if (lider) {
        const traseiraLider = lider.x - (d * lider.comp) / 2;
        const novoGap = d * (traseiraLider - (v.x + (d * v.comp) / 2));
        if (novoGap < 4) {
          v.x -= d * (4 - novoGap);
          v.v = Math.min(v.v, lider.v);
        }
      }
    });
  });

  veiculos = veiculos.filter((v) =>
    v.dir === 1 ? v.x - v.comp / 2 < WORLD_W + 40 : v.x + v.comp / 2 > -40
  );
}

function aquecer() {
  if (aquecido) return;
  aquecido = true;
  for (let i = 0; i < 1200; i++) passo(0.05); // 60 s para a rua já começar com movimento
}

/** Avança o trânsito (dt em segundos, em tempo real) */
export function atualizarTrafego(dt: number) {
  aquecer();
  const total = Math.min(dt, 0.1);
  // passos pequenos mantêm a frenagem estável mesmo com quedas de FPS
  const n = Math.max(1, Math.ceil(total / 0.034));
  for (let i = 0; i < n; i++) passo(total / n);
}

export function obterVeiculos(): Veiculo[] {
  aquecer();
  return veiculos;
}

export function obterSemaforo(): EstadoSemaforo {
  return estadoSemaforo(tempoSim);
}

const TIPOS_ESTACIONAVEIS: ReadonlySet<TipoVeiculo> = new Set([
  'HATCH',
  'SEDAN',
  'SUV',
  'PICKUP',
  'TAXI',
]);

/** Captura um veículo da faixa OESTE na altura da entrada do estacionamento (retira da avenida sem duplicar). */
export function capturarVeiculoParaEstacionamento(xMin: number, xMax: number): Veiculo | null {
  aquecer();
  const idx = veiculos.findIndex(
    (v) =>
      v.faixa === 'OESTE' &&
      TIPOS_ESTACIONAVEIS.has(v.tipo) &&
      v.x >= xMin &&
      v.x <= xMax
  );
  if (idx === -1) return null;
  const [capturado] = veiculos.splice(idx, 1);
  return capturado;
}

/** Verifica se há vão seguro na faixa OESTE para o carro que sai da portaria entrar na avenida. */
export function faixaOesteLivreParaSaida(x: number, comp: number): boolean {
  const minX = x - comp / 2 - 90;
  const maxX = x + comp / 2 + 165;
  return veiculos.every(
    (v) => v.faixa !== 'OESTE' || v.x + v.comp / 2 < minX || v.x - v.comp / 2 > maxX
  );
}

/** Injeta veículo egresso do estacionamento diretamente na faixa OESTE da avenida. */
export function injetarVeiculoDaPortaria(dados: {
  tipo: TipoVeiculo;
  x: number;
  vDesejada: number;
  comp: number;
  alt: number;
  cor: string;
  corEscura: string;
}) {
  const faixaOeste = FAIXAS[0];
  veiculos.push({
    id: proximoId++,
    tipo: dados.tipo,
    faixa: 'OESTE',
    dir: -1,
    x: dados.x,
    y: faixaOeste.yc,
    v: Math.min(130, dados.vDesejada * 0.55),
    vDesejada: dados.vDesejada,
    comp: dados.comp,
    alt: dados.alt,
    cor: dados.cor,
    corEscura: dados.corEscura,
    freando: false,
    paradaRestante: 0,
    jaParou: true,
  });
}

/** Carros parados na faixa de estacionamento (desenhados no cache estático) */
export interface Estacionado {
  tipo: TipoVeiculo;
  x: number; // tiles
  dir: 1 | -1;
  cor: number;
}

export const ESTACIONADOS: Estacionado[] = [
  { tipo: 'HATCH', x: 6.5, dir: 1, cor: 1 },
  { tipo: 'MOTO', x: 12.5, dir: 1, cor: 0 },
  { tipo: 'SEDAN', x: 17.5, dir: -1, cor: 4 },
  { tipo: 'SUV', x: 22.5, dir: 1, cor: 3 },
  { tipo: 'MOTO', x: 49.0, dir: -1, cor: 5 },
  { tipo: 'PICKUP', x: 54.5, dir: 1, cor: 7 },
  { tipo: 'HATCH', x: 60.5, dir: -1, cor: 9 },
  { tipo: 'HATCH', x: 71.0, dir: 1, cor: 6 },
  { tipo: 'SEDAN', x: 76.5, dir: 1, cor: 2 },
  { tipo: 'VAN', x: 82.0, dir: -1, cor: 8 },
];
