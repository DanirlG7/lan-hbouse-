import { TILE_SIZE } from './constants';
import {
  CORES_CARRO,
  ESPEC,
  TipoVeiculo,
  capturarVeiculoParaEstacionamento,
  faixaOesteLivreParaSaida,
  injetarVeiculoDaPortaria,
} from './traffic';

const t = (v: number) => Math.round(v * TILE_SIZE);

export interface VagaEstacionamento {
  id: string;
  numero: number;
  xCentro: number;
  yCentro: number;
  ocupadaPorPlaca: string | null;
  reservadaPorPlaca: string | null;
}

export type FaseCarroEstac =
  | 'INBOUND_AVENUE'     // Subindo da faixa OESTE para a frente da cancela de entrada
  | 'AT_ENTRY_GATE'      // Aguardando leitura de ticket / abertura da cancela de entrada
  | 'DRIVE_TO_VAGA'      // Subindo pela pista Leste (↑) até a altura da vaga
  | 'MANEUVER_IN'        // Entrando horizontalmente na vaga V01..V08
  | 'PARKED'             // Estacionado na vaga (motor desligado)
  | 'MANEUVER_OUT'       // Recuando / saindo da vaga para a pista Oeste (↓)
  | 'DRIVE_TO_EXIT_GATE' // Descendo pela pista Oeste (↓) até a cancela da guarita
  | 'AT_EXIT_GATE'       // Validando pagamento/ticket na guarita
  | 'OUTBOUND_AVENUE';   // Descendo a rampa até a faixa OESTE da avenida

export interface VeiculoEstacionamento {
  id: number;
  placa: string;
  tipo: TipoVeiculo;
  modeloLabel: string;
  vagaId: string;
  fase: FaseCarroEstac;
  /** Orientação visual em radianos ou discreta: 0 = direita (vaga), PI = esquerda (vaga), -PI/2 = cima (Norte ↑), +PI/2 = baixo (Sul ↓) */
  orientacao: 'LEFT' | 'RIGHT' | 'UP' | 'DOWN';
  x: number;
  y: number;
  v: number;
  vDesejada: number;
  comp: number;
  alt: number;
  cor: string;
  corEscura: string;
  freando: boolean;
  timerFase: number;
  duracaoEstadia: number;
  pago: boolean;
}

export interface EstadoCancela {
  /** 0 = fechada (horizontal), 1 = totalmente aberta (levantada ~78°) */
  abertura: number;
  /** >0 enquanto comanda abertura manual ou automática */
  pulsoAberto: number;
  luzVerde: boolean;
}

export interface EventoTicketEstacionamento {
  placa: string;
  vagaId: string;
  modeloCarro: string;
}

export interface ResumoEstacionamento {
  totalVagas: number;
  vagasOcupadas: number;
  vagasLivres: number;
  lotado: boolean;
  vagas: VagaEstacionamento[];
  cancelaEntrada: EstadoCancela;
  cancelaSaida: EstadoCancela;
  veiculosNoPatio: VeiculoEstacionamento[];
  filaEntradaCount: number;
  filaSaidaCount: number;
}

export const PATIO_COORDS = {
  areaX0: t(84),
  areaY0: t(16),
  areaX1: t(94),
  areaY1: t(52),
  vagaMinX: t(84.4),
  vagaMaxX: t(88.2),
  vagaCentroX: t(86.3),
  pistaSaidaX: t(89.65),
  pistaEntradaX: t(92.25),
  cancelaEntradaY: t(49.0),
  cancelaSaidaY: t(49.6),
  guaritaFrenteX: t(87.2),
  guaritaFrenteY: t(48.6),
  ruaMergeY: Math.round(59.75 * TILE_SIZE),
};

const Y_VAGAS_TILES = [20.0, 23.3, 26.6, 29.9, 33.2, 36.5, 39.8, 43.1];
const LABELS_MODELO: Record<TipoVeiculo, string> = {
  HATCH: 'Hatch',
  SEDAN: 'Sedan',
  SUV: 'SUV',
  PICKUP: 'Pickup',
  TAXI: 'Táxi',
  VAN: 'Van',
  ONIBUS: 'Ônibus',
  MOTO: 'Moto',
  ENTREGA: 'Entrega',
};

const PREFIXOS_PLACA = ['LAN', 'GAM', 'RTX', 'PIX', 'VIP', 'RPG', 'FPS', 'NET'];

let nextEstacId = 1;
let placaSeq = 1042;
let cooldownCapturaRua = 1.6;

const vagas: VagaEstacionamento[] = Y_VAGAS_TILES.map((yt, i) => ({
  id: `V${String(i + 1).padStart(2, '0')}`,
  numero: i + 1,
  xCentro: PATIO_COORDS.vagaCentroX,
  yCentro: t(yt),
  ocupadaPorPlaca: null,
  reservadaPorPlaca: null,
}));

const veiculos: VeiculoEstacionamento[] = [];

const cancelaEntrada: EstadoCancela = { abertura: 0, pulsoAberto: 0, luzVerde: false };
const cancelaSaida: EstadoCancela = { abertura: 0, pulsoAberto: 0, luzVerde: false };

function gerarPlaca(): string {
  placaSeq += 17;
  const pref = PREFIXOS_PLACA[placaSeq % PREFIXOS_PLACA.length];
  const n1 = (placaSeq % 9) + 1;
  const ch = String.fromCharCode(65 + ((placaSeq * 3) % 24));
  const n2 = String(10 + (placaSeq % 89));
  return `${pref}-${n1}${ch}${n2}`;
}

let iniciado = false;
function inicializarPatio() {
  if (iniciado) return;
  iniciado = true;
  // Pré-popula 4 carros estacionados ordenadamente para o pátio já iniciar vivo
  const iniciais: Array<{ vagaIdx: number; tipo: TipoVeiculo; corIdx: number; tempo: number }> = [
    { vagaIdx: 0, tipo: 'SEDAN', corIdx: 1, tempo: 6.5 },
    { vagaIdx: 2, tipo: 'HATCH', corIdx: 0, tempo: 11.5 },
    { vagaIdx: 4, tipo: 'SUV', corIdx: 4, tempo: 16.0 },
    { vagaIdx: 6, tipo: 'PICKUP', corIdx: 5, tempo: 21.5 },
  ];
  for (const cfg of iniciais) {
    const vaga = vagas[cfg.vagaIdx];
    const esp = ESPEC[cfg.tipo];
    const [cor, corEscura] = CORES_CARRO[cfg.corIdx % CORES_CARRO.length];
    const placa = gerarPlaca();
    vaga.ocupadaPorPlaca = placa;
    veiculos.push({
      id: nextEstacId++,
      placa,
      tipo: cfg.tipo,
      modeloLabel: LABELS_MODELO[cfg.tipo],
      vagaId: vaga.id,
      fase: 'PARKED',
      orientacao: 'LEFT',
      x: vaga.xCentro,
      y: vaga.yCentro,
      v: 0,
      vDesejada: 108,
      comp: esp.comp,
      alt: esp.alt,
      cor,
      corEscura,
      freando: false,
      timerFase: cfg.tempo,
      duracaoEstadia: cfg.tempo,
      pago: false,
    });
  }
}

function encontrarVagaLivre(): VagaEstacionamento | undefined {
  return vagas.find((v) => !v.ocupadaPorPlaca && !v.reservadaPorPlaca);
}

function faixaVerticalOcupada(
  xCentro: number,
  yMin: number,
  yMax: number,
  ignorarId: number
): VeiculoEstacionamento | undefined {
  return veiculos.find((o) => {
    if (o.id === ignorarId) return false;
    if (o.fase === 'PARKED') return false;
    const dx = Math.abs(o.x - xCentro);
    if (dx > TILE_SIZE * 1.35) return false;
    const oHalf = o.orientacao === 'UP' || o.orientacao === 'DOWN' ? o.comp * 0.5 : o.alt * 0.5;
    return o.y + oHalf >= yMin && o.y - oHalf <= yMax;
  });
}

function zonaManobraOcupada(yCentro: number, ignorarId: number): boolean {
  return veiculos.some((o) => {
    if (o.id === ignorarId || o.fase === 'PARKED') return false;
    if (o.fase === 'MANEUVER_IN' || o.fase === 'MANEUVER_OUT') {
      return Math.abs(o.y - yCentro) < TILE_SIZE * 3.8;
    }
    if (o.x < PATIO_COORDS.pistaEntradaX - TILE_SIZE * 0.9 && Math.abs(o.y - yCentro) < TILE_SIZE * 3.0) {
      return true;
    }
    return false;
  });
}

/** Aciona manualmente uma das cancelas a partir do painel da portaria */
export function acionarCancelaManual(qual: 'ENTRADA' | 'SAIDA') {
  inicializarPatio();
  const c = qual === 'ENTRADA' ? cancelaEntrada : cancelaSaida;
  c.pulsoAberto = Math.max(c.pulsoAberto, 3.0);
}

/** Avança a simulação do estacionamento, cancelas e fluxo coordenado com a rua */
export function atualizarEstacionamento(
  dt: number,
  onTicketPago?: (ev: EventoTicketEstacionamento) => void
) {
  inicializarPatio();
  const stepDt = Math.min(dt, 0.08);
  cooldownCapturaRua -= stepDt;

  // 1) Captura veículos livres da rua quando há vaga e fila de entrada desimpedida
  const vagaLivre = encontrarVagaLivre();
  const filaEntradaAtiva = veiculos.filter(
    (v) => v.fase === 'INBOUND_AVENUE' || v.fase === 'AT_ENTRY_GATE'
  );
  const entradaRampaLivre = !faixaVerticalOcupada(
    PATIO_COORDS.pistaEntradaX,
    t(48.0),
    t(61.0),
    -1
  );

  if (vagaLivre && filaEntradaAtiva.length === 0 && entradaRampaLivre && cooldownCapturaRua <= 0) {
    const capturado = capturarVeiculoParaEstacionamento(t(91.5), t(93.15));
    if (capturado) {
      const placa = gerarPlaca();
      vagaLivre.reservadaPorPlaca = placa;
      veiculos.push({
        id: nextEstacId++,
        placa,
        tipo: capturado.tipo,
        modeloLabel: LABELS_MODELO[capturado.tipo],
        vagaId: vagaLivre.id,
        fase: 'INBOUND_AVENUE',
        orientacao: 'UP',
        x: PATIO_COORDS.pistaEntradaX,
        y: PATIO_COORDS.ruaMergeY,
        v: 86,
        vDesejada: 112,
        comp: capturado.comp,
        alt: capturado.alt,
        cor: capturado.cor,
        corEscura: capturado.corEscura,
        freando: false,
        timerFase: 0,
        duracaoEstadia: 11 + Math.random() * 14,
        pago: false,
      });
      cooldownCapturaRua = 3.2;
    }
  }

  // Fallback suave caso a avenida fique travada no semáforo: gera visitante esporádico se pátio quase vazio
  const ocupadasOuEmCurso = veiculos.length;
  if (vagaLivre && ocupadasOuEmCurso < 3 && filaEntradaAtiva.length === 0 && entradaRampaLivre && cooldownCapturaRua <= -4.5) {
    const tipos: TipoVeiculo[] = ['HATCH', 'SEDAN', 'SUV'];
    const tipo = tipos[nextEstacId % tipos.length];
    const esp = ESPEC[tipo];
    const [cor, corEscura] = CORES_CARRO[nextEstacId % CORES_CARRO.length];
    const placa = gerarPlaca();
    vagaLivre.reservadaPorPlaca = placa;
    veiculos.push({
      id: nextEstacId++,
      placa,
      tipo,
      modeloLabel: LABELS_MODELO[tipo],
      vagaId: vagaLivre.id,
      fase: 'INBOUND_AVENUE',
      orientacao: 'UP',
      x: PATIO_COORDS.pistaEntradaX,
      y: PATIO_COORDS.ruaMergeY,
      v: 82,
      vDesejada: 110,
      comp: esp.comp,
      alt: esp.alt,
      cor,
      corEscura,
      freando: false,
      timerFase: 0,
      duracaoEstadia: 12 + Math.random() * 12,
      pago: false,
    });
    cooldownCapturaRua = 4.0;
  }

  // Determina demanda de abertura automática das cancelas
  let manterEntradaAberta = false;
  let manterSaidaAberta = false;

  const removidos = new Set<number>();

  // Ordena veículos para consistência
  for (const v of veiculos) {
    const vaga = vagas.find((vg) => vg.id === v.vagaId)!;

    switch (v.fase) {
      case 'INBOUND_AVENUE': {
        v.orientacao = 'UP';
        const stopY = PATIO_COORDS.cancelaEntradaY + TILE_SIZE * 1.45 + v.comp * 0.5;
        // Verificar veículo à frente na pista de entrada
        const frenteBloq = faixaVerticalOcupada(
          PATIO_COORDS.pistaEntradaX,
          v.y - v.comp * 0.5 - 42,
          v.y - v.comp * 0.5 + 4,
          v.id
        );
        const distAlvo = v.y - stopY;
        if (frenteBloq) {
          v.v = Math.max(0, v.v - 220 * stepDt);
          v.freando = true;
        } else if (distAlvo <= 3) {
          v.y = stopY;
          v.v = 0;
          v.freando = true;
          v.fase = 'AT_ENTRY_GATE';
          v.timerFase = 0.65;
        } else {
          const velMax = distAlvo < 70 ? Math.max(36, distAlvo * 1.35) : v.vDesejada;
          v.v += Math.min(120 * stepDt, velMax - v.v);
          v.freando = velMax < v.vDesejada * 0.7;
          v.y -= v.v * stepDt;
        }
        break;
      }

      case 'AT_ENTRY_GATE': {
        v.orientacao = 'UP';
        v.v = 0;
        v.freando = true;
        v.timerFase = Math.max(0, v.timerFase - stepDt);
        manterEntradaAberta = true;
        const pistaAcimaLivre = !faixaVerticalOcupada(
          PATIO_COORDS.pistaEntradaX,
          PATIO_COORDS.cancelaEntradaY - TILE_SIZE * 4.5,
          PATIO_COORDS.cancelaEntradaY + 6,
          v.id
        );
        if (v.timerFase <= 0 && cancelaEntrada.abertura >= 0.85 && pistaAcimaLivre) {
          v.fase = 'DRIVE_TO_VAGA';
          v.freando = false;
        }
        break;
      }

      case 'DRIVE_TO_VAGA': {
        v.orientacao = 'UP';
        if (v.y > PATIO_COORDS.cancelaEntradaY - v.comp * 0.65) {
          manterEntradaAberta = true;
        }
        const lidarComFrente = faixaVerticalOcupada(
          PATIO_COORDS.pistaEntradaX,
          v.y - v.comp * 0.5 - 52,
          v.y - v.comp * 0.5 - 2,
          v.id
        );
        const distVaga = v.y - vaga.yCentro;
        if (lidarComFrente) {
          v.v = Math.max(0, v.v - 240 * stepDt);
          v.freando = true;
        } else if (distVaga <= 3) {
          // Antes de cruzar para a esquerda (pista de saída), checar se a manobra está livre
          const manobraLivre = !zonaManobraOcupada(vaga.yCentro, v.id);
          if (manobraLivre) {
            v.y = vaga.yCentro;
            v.v = 0;
            v.fase = 'MANEUVER_IN';
            v.orientacao = 'LEFT';
          } else {
            v.y = vaga.yCentro;
            v.v = 0;
            v.freando = true;
          }
        } else {
          const velAlvo = distVaga < 65 ? Math.max(38, distVaga * 1.45) : v.vDesejada;
          v.v += Math.min(130 * stepDt, velAlvo - v.v);
          v.freando = velAlvo < v.vDesejada * 0.7;
          v.y -= v.v * stepDt;
        }
        break;
      }

      case 'MANEUVER_IN': {
        v.orientacao = 'LEFT';
        const distX = v.x - vaga.xCentro;
        if (distX <= 2) {
          v.x = vaga.xCentro;
          v.y = vaga.yCentro;
          v.v = 0;
          v.freando = false;
          v.fase = 'PARKED';
          v.timerFase = v.duracaoEstadia;
          vaga.reservadaPorPlaca = null;
          vaga.ocupadaPorPlaca = v.placa;
        } else {
          v.v = distX < 38 ? 44 : 74;
          v.x -= v.v * stepDt;
          v.freando = distX < 28;
        }
        break;
      }

      case 'PARKED': {
        v.orientacao = 'LEFT';
        v.v = 0;
        v.freando = false;
        v.timerFase -= stepDt;
        if (v.timerFase <= 0) {
          // Verifica se a pista de saída e região de manobra estão livres para sair em segurança
          const exitBloq = faixaVerticalOcupada(
            PATIO_COORDS.pistaSaidaX,
            vaga.yCentro - TILE_SIZE * 4.0,
            vaga.yCentro + TILE_SIZE * 4.5,
            v.id
          );
          const faixaCruzLivre = !zonaManobraOcupada(vaga.yCentro, v.id);
          if (!exitBloq && faixaCruzLivre) {
            vaga.ocupadaPorPlaca = null;
            v.fase = 'MANEUVER_OUT';
            v.orientacao = 'RIGHT';
          }
        }
        break;
      }

      case 'MANEUVER_OUT': {
        v.orientacao = 'RIGHT';
        const distX = PATIO_COORDS.pistaSaidaX - v.x;
        if (distX <= 2) {
          v.x = PATIO_COORDS.pistaSaidaX;
          v.v = 0;
          v.orientacao = 'DOWN';
          v.fase = 'DRIVE_TO_EXIT_GATE';
        } else {
          v.v = distX < 34 ? 46 : 72;
          v.x += v.v * stepDt;
          v.freando = false;
        }
        break;
      }

      case 'DRIVE_TO_EXIT_GATE': {
        v.orientacao = 'DOWN';
        const stopY = PATIO_COORDS.cancelaSaidaY - TILE_SIZE * 1.45 - v.comp * 0.5;
        const frenteBloq = faixaVerticalOcupada(
          PATIO_COORDS.pistaSaidaX,
          v.y + v.comp * 0.5 + 2,
          v.y + v.comp * 0.5 + 48,
          v.id
        );
        const distAlvo = stopY - v.y;
        if (frenteBloq) {
          v.v = Math.max(0, v.v - 240 * stepDt);
          v.freando = true;
        } else if (distAlvo <= 3) {
          v.y = stopY;
          v.v = 0;
          v.freando = true;
          v.fase = 'AT_EXIT_GATE';
          v.timerFase = 0.75;
        } else {
          const velMax = distAlvo < 70 ? Math.max(38, distAlvo * 1.4) : v.vDesejada;
          v.v += Math.min(130 * stepDt, velMax - v.v);
          v.freando = velMax < v.vDesejada * 0.7;
          v.y += v.v * stepDt;
        }
        break;
      }

      case 'AT_EXIT_GATE': {
        v.orientacao = 'DOWN';
        v.v = 0;
        v.freando = true;
        v.timerFase = Math.max(0, v.timerFase - stepDt);
        if (!v.pago && v.timerFase <= 0.2) {
          v.pago = true;
          onTicketPago?.({
            placa: v.placa,
            vagaId: v.vagaId,
            modeloCarro: v.modeloLabel,
          });
        }
        manterSaidaAberta = true;
        const rampaLivre = !faixaVerticalOcupada(
          PATIO_COORDS.pistaSaidaX,
          PATIO_COORDS.cancelaSaidaY + 6,
          PATIO_COORDS.ruaMergeY + 24,
          v.id
        );
        const ruaLivre = faixaOesteLivreParaSaida(PATIO_COORDS.pistaSaidaX, v.comp);
        if (v.timerFase <= 0 && cancelaSaida.abertura >= 0.85 && rampaLivre && ruaLivre) {
          v.fase = 'OUTBOUND_AVENUE';
          v.freando = false;
        }
        break;
      }

      case 'OUTBOUND_AVENUE': {
        v.orientacao = 'DOWN';
        if (v.y < PATIO_COORDS.cancelaSaidaY + v.comp * 0.65) {
          manterSaidaAberta = true;
        }
        const distRua = PATIO_COORDS.ruaMergeY - v.y;
        if (distRua <= 3) {
          injetarVeiculoDaPortaria({
            tipo: v.tipo,
            x: PATIO_COORDS.pistaSaidaX,
            vDesejada: 165,
            comp: v.comp,
            alt: v.alt,
            cor: v.cor,
            corEscura: v.corEscura,
          });
          removidos.add(v.id);
        } else {
          v.v = Math.min(115, v.v + 160 * stepDt);
          v.y += v.v * stepDt;
          v.freando = false;
        }
        break;
      }
    }
  }

  if (removidos.size > 0) {
    for (let i = veiculos.length - 1; i >= 0; i--) {
      if (removidos.has(veiculos[i].id)) veiculos.splice(i, 1);
    }
  }

  // Atualiza animação suave das cancelas
  cancelaEntrada.pulsoAberto = Math.max(0, cancelaEntrada.pulsoAberto - stepDt);
  cancelaSaida.pulsoAberto = Math.max(0, cancelaSaida.pulsoAberto - stepDt);

  const abrirEnt = manterEntradaAberta || cancelaEntrada.pulsoAberto > 0;
  const abrirSai = manterSaidaAberta || cancelaSaida.pulsoAberto > 0;

  cancelaEntrada.luzVerde = abrirEnt;
  cancelaSaida.luzVerde = abrirSai;

  const velCancela = 2.6;
  cancelaEntrada.abertura = abrirEnt
    ? Math.min(1, cancelaEntrada.abertura + velCancela * stepDt)
    : Math.max(0, cancelaEntrada.abertura - velCancela * stepDt);
  cancelaSaida.abertura = abrirSai
    ? Math.min(1, cancelaSaida.abertura + velCancela * stepDt)
    : Math.max(0, cancelaSaida.abertura - velCancela * stepDt);
}

export function obterResumoEstacionamento(): ResumoEstacionamento {
  inicializarPatio();
  const ocupadas = vagas.filter((v) => v.ocupadaPorPlaca || v.reservadaPorPlaca).length;
  return {
    totalVagas: vagas.length,
    vagasOcupadas: ocupadas,
    vagasLivres: vagas.length - ocupadas,
    lotado: ocupadas >= vagas.length,
    vagas: vagas.map((v) => ({ ...v })),
    cancelaEntrada: { ...cancelaEntrada },
    cancelaSaida: { ...cancelaSaida },
    veiculosNoPatio: veiculos.map((v) => ({ ...v })),
    filaEntradaCount: veiculos.filter((v) => v.fase === 'INBOUND_AVENUE' || v.fase === 'AT_ENTRY_GATE').length,
    filaSaidaCount: veiculos.filter((v) => v.fase === 'DRIVE_TO_EXIT_GATE' || v.fase === 'AT_EXIT_GATE').length,
  };
}
