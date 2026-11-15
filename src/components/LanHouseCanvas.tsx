import React, { useEffect, useRef, useState } from 'react';
import {
  Computador,
  ConfiguracoesJogo,
  Funcionario,
  MelhoriaEstabelecimento,
  PersonagemMapa,
  Sessao,
} from '../domain/types';
import {
  AgenteBot,
  EventoCompraVisual,
  nodoAssentoDoPc,
  simuladorBotsMapa,
  WAYPOINT_NODES,
} from '../domain/WaypointGraph';
import {
  POSICAO_MELHORIA,
  renderChaoEMoveis,
  renderGrade,
  renderIluminacao,
  coletarObjetosDinamicos,
  recolocarEstatico,
  renderEtiquetasPcs,
  renderPlanosDinamicos,
  TIER_PC,
  VistaMundo,
} from './LanHouseMapRenderer';
import { drawRpgPixelCharacter, RPG_OUTLINE } from './RpgPixelSpriteEngine';
import { ObjetoProfundo } from './LanHouseDepth';
import { TILE_SIZE, WORLD_H, WORLD_W, ZOOM_MAX, ZOOM_MIN } from '../world/constants';
import { SALAS, TipoSala } from '../world/layout';
import { LOJAS } from '../world/decor';
import { atualizarTrafego } from '../world/traffic';
import { atualizarEstacionamento, obterResumoEstacionamento } from '../world/parking';
import {
  renderEstacionamento,
  renderEstacionamentoLuzes,
  renderTrafego,
  renderTrafegoLuzes,
} from './LanHouseTrafficRenderer';

type Setor =
  | 'RECEPCAO'
  | 'BOMBONIERE'
  | 'ESCRITORIO'
  | 'MANUTENCAO'
  | 'ESTOQUE'
  | 'CONSOLES'
  | 'ESTACIONAMENTO';

interface Props {
  computadores: Computador[];
  sessoes: Sessao[];
  funcionarios: Funcionario[];
  /** mantido por compatibilidade com o App (os bots vêm do simulador) */
  personagens?: PersonagemMapa[];
  melhorias?: MelhoriaEstabelecimento[];
  configuracoes: ConfiguracoesJogo;
  tarifaEstacionamento?: number;
  estacionamentoAtivo?: boolean;
  hudOculto?: boolean;
  onRegistrarTicketEstacionamento?: (placa: string, vagaId: string, modeloCarro: string) => void;
  onSelectPc: (numeroPc: number) => void;
  onSelectSector: (sector: Setor) => void;
}

type ModoBaloes = 'COMPACTO' | 'ICONES' | 'OCULTO';
type ModoVisao = 'LOJA' | 'COMPLETO';

// ---------------------------------------------------------------------------
// AJUSTES (fáceis de mexer)
// ---------------------------------------------------------------------------
/** Máximo de balões de fala ao mesmo tempo na tela */
const MAX_BALOES = 7;
/** Folga (px de tela) que deixa o mapa sair de baixo dos painéis do HUD */
const FOLGA_BORDA_PX = 220;
/** Região mostrada no modo "Loja": salão, recepção, VIP, arena e corredor de serviço */
const AREA_LOJA = { x: 3 * TILE_SIZE, y: 10 * TILE_SIZE, w: 92 * TILE_SIZE, h: 46 * TILE_SIZE };
/** Velocidade de pan pelo teclado, em px de tela por segundo */
const VELOCIDADE_TECLADO = 720;
/** Sombra de contato sob os personagens em pé (translúcida, em degraus de pixel). Ponha false se o sprite já desenhar a sua */
const SOMBRA_PERSONAGEM = true;
/** Pixels de arrasto antes de o clique virar "arrastar o mapa" */
const LIMIAR_ARRASTO = 5;

/** Qual setor (modal do jogo) cada tipo de sala abre ao clicar. Salas fora da lista não são clicáveis. */
const SETOR_POR_SALA: Partial<Record<TipoSala, Setor>> = {
  RECEPCAO: 'RECEPCAO',
  BOMBONIERE: 'BOMBONIERE',
  LOUNGE: 'BOMBONIERE',
  ADM: 'ESCRITORIO',
  NOC: 'MANUTENCAO',
  ESTOQUE: 'ESTOQUE',
  ARENA: 'CONSOLES',
};

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));

interface Camera {
  /** centro da câmera em coordenadas do mundo (px) */
  x: number;
  y: number;
  zoom: number;
}

interface Retangulo {
  x: number;
  y: number;
  w: number;
  h: number;
}

const sobrepoe = (a: Retangulo, b: Retangulo) =>
  a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;

/** Retorna o setor clicável sob um ponto do mundo (px), ou null */
function detectarComodo(wx: number, wy: number): { setor: Setor | null; nome: string } | null {
  const tx = wx / TILE_SIZE;
  const ty = wy / TILE_SIZE;
  if (tx >= 84 && tx <= 94.2 && ty >= 16 && ty <= 55.6) {
    return { setor: 'ESTACIONAMENTO', nome: 'ESTACIONAMENTO & PORTARIA' };
  }
  if (tx >= 84 && tx <= 94.2 && ty >= 4 && ty < 16) {
    return { setor: null, nome: 'CANTINHO VIP (ACESSO RESTRITO)' };
  }
  // lojas do mini centro comercial (incluem a placa, ~0.9 tile acima do toldo)
  for (const l of LOJAS) {
    if (tx >= l.x && tx < l.x + l.w && ty >= l.y - 0.95 && ty < l.y + l.h) {
      return { setor: l.setor, nome: l.nome };
    }
  }
  for (const s of SALAS) {
    if (s.bloqueada) continue;
    if (tx >= s.x && tx < s.x + s.w && ty >= s.y && ty < s.y + s.h) {
      return { setor: SETOR_POR_SALA[s.tipo] ?? null, nome: s.nome };
    }
  }
  return null;
}

function posicaoEstacao(numeroPc: number) {
  const seat = WAYPOINT_NODES[nodoAssentoDoPc(numeroPc)];
  if (!seat) return null;
  return { x: seat.x, y: seat.y };
}

/**
 * Canvas do mapa 96x64 (tiles de 32px = 3072 x 2048 px).
 * - Câmera: arrastar com o mouse, WASD / setas, zoom na roda (0.5x–2x) e + / - / 0 no teclado
 * - Culling: cada camada só desenha o que está na vista
 * - Balões e tooltips são desenhados em espaço de tela (nunca ficam ilegíveis no zoom baixo)
 * - O loop de render roda uma única vez; props e hover vivem em refs (sem recriar o loop a cada mouse move)
 */
export const LanHouseCanvas: React.FC<Props> = ({
  computadores,
  sessoes,
  funcionarios,
  melhorias = [],
  configuracoes,
  tarifaEstacionamento = 10,
  estacionamentoAtivo = true,
  hudOculto = false,
  onRegistrarTicketEstacionamento,
  onSelectPc,
  onSelectSector,
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Estado da interface (só o que precisa re-renderizar os botões)
  const [mostrarRotasIA, setMostrarRotasIA] = useState(false);
  const [mostrarGrade, setMostrarGrade] = useState(false);
  const [modoBaloes, setModoBaloes] = useState<ModoBaloes>('COMPACTO');
  const [modoVisao, setModoVisao] = useState<ModoVisao>('LOJA');
  const [zoomExibido, setZoomExibido] = useState(1);

  // Espelho das props/estado para o loop de render (que roda uma vez só)
  const dados = useRef({
    computadores,
    sessoes,
    funcionarios,
    melhorias,
    configuracoes,
    tarifaEstacionamento,
    estacionamentoAtivo,
    onRegistrarTicketEstacionamento,
    mostrarRotasIA,
    mostrarGrade,
    modoBaloes,
    onSelectPc,
    onSelectSector,
  });
  dados.current = {
    computadores,
    sessoes,
    funcionarios,
    melhorias,
    configuracoes,
    tarifaEstacionamento,
    estacionamentoAtivo,
    onRegistrarTicketEstacionamento,
    mostrarRotasIA,
    mostrarGrade,
    modoBaloes,
    onSelectPc,
    onSelectSector,
  };

  // Câmera e interação (refs: mudam a 60fps sem disparar render do React)
  const tamanho = useRef({ w: 1280, h: 720, dpr: 1 });
  const cam = useRef<Camera>({ x: WORLD_W / 2, y: WORLD_H / 2, zoom: 0.7 });
  const alvo = useRef<Camera | null>(null); // animação suave ao trocar de modo
  const teclas = useRef<Set<string>>(new Set());
  const mouseTela = useRef({ x: 0, y: 0, dentro: false });
  const hoverPc = useRef<number | null>(null);
  const hoverBotId = useRef<string | null>(null);
  const hoverSala = useRef<{ setor: Setor | null; nome: string } | null>(null);
  const botsRef = useRef<AgenteBot[]>([]);
  const arrasto = useRef<{
    ativo: boolean;
    moveu: boolean;
    sx: number;
    sy: number;
    camX: number;
    camY: number;
  }>({ ativo: false, moveu: false, sx: 0, sy: 0, camX: 0, camY: 0 });
  const niveisAnteriores = useRef<Map<string, number> | null>(null);
  const bursts = useRef<{ x: number; y: number; inicio: number; texto: string }[]>([]);
  const zoomPublicado = useRef(0);
  const modoVisaoRef = useRef<ModoVisao>('LOJA');

  // ------------------------------------------------------------------------
  // Utilidades de câmera
  // ------------------------------------------------------------------------
  const zoomCompleto = () => {
    const { w, h } = tamanho.current;
    return Math.min(w / WORLD_W, h / WORLD_H);
  };
  const zoomMinimo = () => Math.min(ZOOM_MIN, zoomCompleto());

  const enquadrar = (area: Retangulo): Camera => {
    const { w, h } = tamanho.current;
    const z = clamp(Math.min(w / area.w, h / area.h), zoomMinimo(), ZOOM_MAX);
    return { x: area.x + area.w / 2, y: area.y + area.h / 2, zoom: z };
  };

  const limitarCamera = (c: Camera) => {
    const { w, h } = tamanho.current;
    c.zoom = clamp(c.zoom, zoomMinimo(), ZOOM_MAX);
    const vw = w / c.zoom;
    const vh = h / c.zoom;
    const folga = FOLGA_BORDA_PX / c.zoom;
    const minX = vw / 2 - folga;
    const maxX = WORLD_W - vw / 2 + folga;
    const minY = vh / 2 - folga;
    const maxY = WORLD_H - vh / 2 + folga;
    c.x = minX > maxX ? WORLD_W / 2 : clamp(c.x, minX, maxX);
    c.y = minY > maxY ? WORLD_H / 2 : clamp(c.y, minY, maxY);
  };

  const telaParaMundo = (sx: number, sy: number) => {
    const { w, h } = tamanho.current;
    const c = cam.current;
    return { wx: c.x + (sx - w / 2) / c.zoom, wy: c.y + (sy - h / 2) / c.zoom };
  };

  const mundoParaTela = (wx: number, wy: number) => {
    const { w, h } = tamanho.current;
    const c = cam.current;
    return { sx: (wx - c.x) * c.zoom + w / 2, sy: (wy - c.y) * c.zoom + h / 2 };
  };

  const irParaModo = (modo: ModoVisao, animar = true) => {
    const destino =
      modo === 'COMPLETO'
        ? { x: WORLD_W / 2, y: WORLD_H / 2, zoom: zoomCompleto() }
        : enquadrar(AREA_LOJA);
    limitarCamera(destino);
    modoVisaoRef.current = modo;
    setModoVisao(modo);
    if (animar) alvo.current = destino;
    else {
      cam.current = destino;
      alvo.current = null;
    }
  };

  // ------------------------------------------------------------------------
  // Hit-test (PC, bot, sala)
  // ------------------------------------------------------------------------
  const atualizarHover = () => {
    if (!mouseTela.current.dentro || arrasto.current.moveu) {
      hoverPc.current = null;
      hoverBotId.current = null;
      hoverSala.current = null;
      return;
    }
    const { wx, wy } = telaParaMundo(mouseTela.current.x, mouseTela.current.y);

    let bot: string | null = null;
    for (let i = botsRef.current.length - 1; i >= 0; i--) {
      const b = botsRef.current[i];
      if (Math.abs(wx - b.x) <= 14 && wy >= b.y - 34 && wy <= b.y + 12) {
        bot = b.id;
        break;
      }
    }
    hoverBotId.current = bot;

    let pc: number | null = null;
    if (!bot) {
      for (const c of dados.current.computadores.slice(0, 24)) {
        const p = posicaoEstacao(c.numero);
        if (!p) continue;
        if (Math.abs(wx - p.x) <= 26 && wy >= p.y - 46 && wy <= p.y + 10) {
          pc = c.numero;
          break;
        }
      }
    }
    hoverPc.current = pc;
    hoverSala.current = pc || bot ? null : detectarComodo(wx, wy);
  };

  const atualizarCursor = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (arrasto.current.ativo && arrasto.current.moveu) canvas.style.cursor = 'grabbing';
    else if (hoverPc.current !== null || hoverSala.current?.setor) canvas.style.cursor = 'pointer';
    else canvas.style.cursor = 'grab';
  };

  // ------------------------------------------------------------------------
  // Eventos do mouse / teclado / roda
  // ------------------------------------------------------------------------
  const aoPressionar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    arrasto.current = {
      ativo: true,
      moveu: false,
      sx: e.clientX,
      sy: e.clientY,
      camX: cam.current.x,
      camY: cam.current.y,
    };
  };

  const aoMover = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseTela.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, dentro: true };

    const a = arrasto.current;
    if (a.ativo) {
      const dx = e.clientX - a.sx;
      const dy = e.clientY - a.sy;
      if (!a.moveu && Math.hypot(dx, dy) > LIMIAR_ARRASTO) a.moveu = true;
      if (a.moveu) {
        alvo.current = null;
        cam.current.x = a.camX - dx / cam.current.zoom;
        cam.current.y = a.camY - dy / cam.current.zoom;
        limitarCamera(cam.current);
      }
    }
    atualizarHover();
    atualizarCursor();
  };

  const aoSoltar = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const a = arrasto.current;
    const foiClique = a.ativo && !a.moveu;
    arrasto.current = { ...a, ativo: false, moveu: false };
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
    if (foiClique) {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseTela.current = { x: e.clientX - rect.left, y: e.clientY - rect.top, dentro: true };
      atualizarHover();
      if (hoverPc.current !== null) dados.current.onSelectPc(hoverPc.current);
      else if (hoverSala.current?.setor) dados.current.onSelectSector(hoverSala.current.setor);
    }
    atualizarCursor();
  };

  const aoSairDoCanvas = () => {
    mouseTela.current.dentro = false;
    hoverPc.current = null;
    hoverBotId.current = null;
    hoverSala.current = null;
  };

  // Roda do mouse (precisa de listener não-passivo para impedir o scroll da página)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const aoRodar = (e: WheelEvent) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const sx = e.clientX - rect.left;
      const sy = e.clientY - rect.top;
      const antes = telaParaMundo(sx, sy);
      const c = cam.current;
      alvo.current = null;
      c.zoom = clamp(c.zoom * Math.exp(-e.deltaY * 0.0015), zoomMinimo(), ZOOM_MAX);
      // mantém o ponto sob o cursor parado
      const { w, h } = tamanho.current;
      c.x = antes.wx - (sx - w / 2) / c.zoom;
      c.y = antes.wy - (sy - h / 2) / c.zoom;
      limitarCamera(c);
      mouseTela.current = { x: sx, y: sy, dentro: true };
      atualizarHover();
    };
    canvas.addEventListener('wheel', aoRodar, { passive: false });
    return () => canvas.removeEventListener('wheel', aoRodar);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Teclado: WASD/setas movem, + / - dão zoom, 0 volta ao modo Loja
  useEffect(() => {
    const ignorar = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null;
      return (
        !!el &&
        (el.tagName === 'INPUT' ||
          el.tagName === 'TEXTAREA' ||
          el.tagName === 'SELECT' ||
          el.isContentEditable)
      );
    };
    const aoTeclar = (e: KeyboardEvent) => {
      if (ignorar(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) {
        teclas.current.add(k);
        alvo.current = null;
        if (k.startsWith('arrow')) e.preventDefault();
      } else if (k === '+' || k === '=' || k === '-' || k === '_') {
        const c = cam.current;
        alvo.current = null;
        c.zoom = clamp(c.zoom * (k === '+' || k === '=' ? 1.2 : 1 / 1.2), zoomMinimo(), ZOOM_MAX);
        limitarCamera(c);
      } else if (k === '0') {
        irParaModo('LOJA');
      }
    };
    const aoSoltarTecla = (e: KeyboardEvent) => {
      teclas.current.delete(e.key.toLowerCase());
    };
    const aoPerderFoco = () => teclas.current.clear();
    window.addEventListener('keydown', aoTeclar);
    window.addEventListener('keyup', aoSoltarTecla);
    window.addEventListener('blur', aoPerderFoco);
    return () => {
      window.removeEventListener('keydown', aoTeclar);
      window.removeEventListener('keyup', aoSoltarTecla);
      window.removeEventListener('blur', aoPerderFoco);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Tamanho do canvas acompanha o container (com devicePixelRatio)
  useEffect(() => {
    const el = containerRef.current;
    const canvas = canvasRef.current;
    if (!el || !canvas) return;
    let primeiraVez = true;
    const aplicar = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(320, el.clientWidth);
      const h = Math.max(240, el.clientHeight);
      tamanho.current = { w, h, dpr };
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      if (primeiraVez) {
        primeiraVez = false;
        irParaModo('LOJA', false);
      } else if (modoVisaoRef.current === 'COMPLETO') {
        irParaModo('COMPLETO', false);
      } else {
        limitarCamera(cam.current);
      }
    };
    aplicar();
    const ro = new ResizeObserver(aplicar);
    ro.observe(el);
    return () => ro.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------------
  // LOOP DE RENDER (uma vez só)
  // ------------------------------------------------------------------------
  useEffect(() => {
    let animId = 0;
    let tick = 0;
    let ultimo = performance.now();

    const desenharBalao = (
      ctx: CanvasRenderingContext2D,
      bot: AgenteBot,
      sx: number,
      sy: number,
      escala: number,
      ocupados: Retangulo[],
      cfg: ConfiguracoesJogo,
      modo: ModoBaloes,
      hover: boolean,
      larguraTela: number
    ): boolean => {
      ctx.save();
      ctx.font = '600 12px "Inter", system-ui, sans-serif';

      if (hover) {
        const titulo = `${bot.iconeCabeca || '👤'} ${bot.nome} (${bot.papel})`;
        const sub = bot.acaoTexto;
        ctx.font = '700 13px "Inter", system-ui, sans-serif';
        const tw = ctx.measureText(titulo).width;
        ctx.font = '500 12px "Inter", system-ui, sans-serif';
        const sw = ctx.measureText(sub).width;
        const w = Math.round(Math.max(tw, sw)) + 20;
        const h = 42;
        const bx = clamp(Math.round(sx - w / 2), 8, larguraTela - w - 8);
        const by = Math.round(sy - h - 12);
        ctx.fillStyle = RPG_OUTLINE;
        ctx.fillRect(bx - 2, by - 2, w + 4, h + 4);
        ctx.fillStyle = '#fbfbf2';
        ctx.fillRect(bx, by, w, h);
        ctx.fillStyle = '#e8e4d5';
        ctx.fillRect(bx, by, w, 3);
        ctx.fillStyle = '#1e1b2e';
        ctx.font = '700 13px "Inter", system-ui, sans-serif';
        ctx.fillText(titulo, bx + 10, by + 18);
        ctx.fillStyle = '#475569';
        ctx.font = '500 12px "Inter", system-ui, sans-serif';
        ctx.fillText(sub, bx + 10, by + 34);
        ctx.restore();
        return true;
      }

      if (!cfg.mostrarBaloesMapa || modo === 'OCULTO' || !bot.mostrarBalao) {
        ctx.restore();
        return false;
      }

      const texto =
        modo === 'ICONES'
          ? bot.iconeCabeca || '♪'
          : `${bot.iconeCabeca ? bot.iconeCabeca + ' ' : ''}${bot.falaCurta}`;
      const fonte = Math.max(12, Math.round(12 * escala));
      ctx.font = `600 ${fonte}px "Inter", system-ui, sans-serif`;
      const w = Math.max(24, Math.round(ctx.measureText(texto).width) + 16);
      const h = Math.round(20 * escala);
      const bx = Math.round(sx - w / 2);
      const by = Math.round(sy - h - 10);
      const caixa: Retangulo = { x: bx - 4, y: by - 4, w: w + 8, h: h + 14 };
      if (ocupados.some((r) => sobrepoe(r, caixa))) {
        ctx.restore();
        return false;
      }
      ocupados.push(caixa);

      const conversa = bot.pose === 'CHATTING';
      const indoAoPc =
        bot.id.startsWith('cliente_sessao_') &&
        (bot.pose === 'WALK' || bot.falaCurta.includes('PC-') || bot.falaCurta.includes('VIP-') || bot.falaCurta.includes('Sentei'));
      const ehPorteiro = bot.id.startsWith('porteiro_');
      const ehRomance = bot.id.startsWith('casal_');

      ctx.fillStyle = 'rgba(15, 23, 42, 0.28)';
      ctx.fillRect(bx + 1, by + 2, w, h);

      // Fundo e borda limpos e modernos com destaque especial por papel
      const bgBalao = indoAoPc
        ? '#0b1329'
        : ehPorteiro
          ? '#1c1917'
          : ehRomance
            ? '#fff1f2'
            : conversa
              ? '#f0fdf4'
              : '#ffffff';
      const bordaBalao = indoAoPc
        ? '#38bdf8'
        : ehPorteiro
          ? '#f59e0b'
          : ehRomance
            ? '#f43f5e'
            : conversa
              ? '#059669'
              : '#334155';
      ctx.fillStyle = bgBalao;
      ctx.strokeStyle = bordaBalao;
      ctx.lineWidth = indoAoPc || ehPorteiro || ehRomance ? 2 : 1.5;
      if (typeof (ctx as any).roundRect === 'function') {
        ctx.beginPath();
        (ctx as any).roundRect(bx, by, w, h, 4);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillRect(bx, by, w, h);
        ctx.strokeRect(bx + 0.5, by + 0.5, w - 1, h - 1);
      }

      // Ponta do balão
      ctx.fillStyle = bgBalao;
      ctx.beginPath();
      ctx.moveTo(Math.round(sx) - 4, by + h);
      ctx.lineTo(Math.round(sx), by + h + 4);
      ctx.lineTo(Math.round(sx) + 4, by + h);
      ctx.fill();

      ctx.textAlign = 'left';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = indoAoPc ? '#38bdf8' : ehPorteiro ? '#fbbf24' : ehRomance ? '#9f1239' : '#0f172a';
      ctx.fillText(texto, bx + 8, by + h / 2);
      ctx.restore();
      return true;
    };

    const render = (agora: number) => {
      animId = requestAnimationFrame(render);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      tick += 1;
      const dt = Math.min(0.05, (agora - ultimo) / 1000);
      ultimo = agora;

      const d = dados.current;
      const { w, h, dpr } = tamanho.current;
      const c = cam.current;

      // --- câmera: teclado + animação suave -------------------------------
      if (teclas.current.size > 0) {
        const v = (VELOCIDADE_TECLADO * dt) / c.zoom;
        const t = teclas.current;
        if (t.has('a') || t.has('arrowleft')) c.x -= v;
        if (t.has('d') || t.has('arrowright')) c.x += v;
        if (t.has('w') || t.has('arrowup')) c.y -= v;
        if (t.has('s') || t.has('arrowdown')) c.y += v;
        limitarCamera(c);
      }
      if (alvo.current) {
        const a = alvo.current;
        const k = 1 - Math.pow(0.0008, dt);
        c.x += (a.x - c.x) * k;
        c.y += (a.y - c.y) * k;
        c.zoom += (a.zoom - c.zoom) * k;
        if (Math.abs(a.x - c.x) < 0.5 && Math.abs(a.y - c.y) < 0.5 && Math.abs(a.zoom - c.zoom) < 0.002) {
          cam.current = { ...a };
          alvo.current = null;
        }
      }
      const zoomArredondado = Math.round(cam.current.zoom * 100) / 100;
      if (zoomArredondado !== zoomPublicado.current) {
        zoomPublicado.current = zoomArredondado;
        setZoomExibido(zoomArredondado);
      }
      const cc = cam.current;

      // --- vista visível no mundo (para culling) --------------------------
      const vista: VistaMundo = {
        x1: cc.x - w / 2 / cc.zoom,
        y1: cc.y - h / 2 / cc.zoom,
        x2: cc.x + w / 2 / cc.zoom,
        y2: cc.y + h / 2 / cc.zoom,
      };
      const emVista = (x: number, y: number, folga = 80) =>
        x >= vista.x1 - folga && x <= vista.x2 + folga && y >= vista.y1 - folga && y <= vista.y2 + folga;

      // --- fundo (espaço de tela) -----------------------------------------
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#0b0f1c';
      ctx.fillRect(0, 0, w, h);

      // --- mundo ----------------------------------------------------------
      ctx.setTransform(
        dpr * cc.zoom,
        0,
        0,
        dpr * cc.zoom,
        dpr * (w / 2 - cc.x * cc.zoom),
        dpr * (h / 2 - cc.y * cc.zoom)
      );
      ctx.imageSmoothingEnabled = false;

      // 1 + 2. chão e móveis estáticos (cache + culling)
      renderChaoEMoveis(ctx, vista);
      if (d.mostrarGrade) renderGrade(ctx, vista);

      // 3. Detalhes planos dinâmicos (neon no chão). PCs e personagens entram no passe ordenado mais abaixo
      renderPlanosDinamicos(ctx, tick, d.melhorias);

      // Detecta evolução de PC / melhoria e dispara o efeito de Level-Up
      {
        const atuais = new Map<string, number>();
        d.computadores.forEach((pc) => atuais.set(`pc_${pc.numero}`, TIER_PC[pc.categoria] ?? 0));
        d.melhorias.forEach((m) => atuais.set(`m_${m.id}`, m.nivel));
        const anteriores = niveisAnteriores.current;
        if (anteriores) {
          atuais.forEach((nivel, chave) => {
            const antigo = anteriores.get(chave);
            if (antigo === undefined || nivel <= antigo) return;
            if (chave.startsWith('pc_')) {
              const p = posicaoEstacao(Number(chave.slice(3)));
              if (p) bursts.current.push({ x: p.x, y: p.y - 32, inicio: tick, texto: 'UPGRADE!' });
            } else {
              const alvoMelhoria = POSICAO_MELHORIA[chave.slice(2)];
              if (alvoMelhoria) {
                bursts.current.push({ x: alvoMelhoria.x, y: alvoMelhoria.y, inicio: tick, texto: `LV.${nivel}!` });
              }
            }
          });
        }
        niveisAnteriores.current = atuais;
      }

      // Rotas da IA (debug)
      const nos = WAYPOINT_NODES;
      if (d.mostrarRotasIA) {
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = Math.max(2, 2 / cc.zoom);
        ctx.beginPath();
        Object.values(nos).forEach((n) => {
          if (!emVista(n.x, n.y, 400)) return;
          n.vizinhos.forEach((vid) => {
            const v = nos[vid];
            if (!v) return;
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(v.x, v.y);
          });
        });
        ctx.stroke();
        const lado = Math.max(6, 6 / cc.zoom);
        Object.values(nos).forEach((n) => {
          if (!emVista(n.x, n.y)) return;
          ctx.fillStyle = n.id.includes('porta') ? '#facc15' : '#38bdf8';
          ctx.fillRect(n.x - lado / 2, n.y - lado / 2, lado, lado);
        });
        ctx.restore();
      }

      // Avenida & Estacionamento Pago: carros, motos, ônibus, cancelas e vagas V01–V08
      atualizarTrafego(dt);
      atualizarEstacionamento(dt, (ev) => {
        simuladorBotsMapa.registrarPagamentoEstacionamentoVisual(
          d.estacionamentoAtivo ? d.tarifaEstacionamento : 0,
          ev.placa,
          tick
        );
        d.onRegistrarTicketEstacionamento?.(ev.placa, ev.vagaId, ev.modeloCarro);
      });
      const resumoEstac = obterResumoEstacionamento();
      renderTrafego(ctx, tick, vista);
      renderEstacionamento(
        ctx,
        tick,
        vista,
        resumoEstac,
        d.tarifaEstacionamento,
        d.estacionamentoAtivo
      );

      // 4. Personagens
      const bots = simuladorBotsMapa.atualizarFrame(d.computadores, d.sessoes, d.funcionarios);
      botsRef.current = bots;

      if (d.mostrarRotasIA) {
        ctx.save();
        ctx.setLineDash([8, 8]);
        ctx.lineWidth = Math.max(3, 3 / cc.zoom);
        bots.forEach((bot) => {
          if (bot.filaRota.length === 0 || !emVista(bot.x, bot.y, 600)) return;
          ctx.strokeStyle = bot.ehCliente ? '#38bdf8' : '#facc15';
          ctx.beginPath();
          ctx.moveTo(bot.x, bot.y);
          bot.filaRota.forEach((id: string) => {
            const n = nos[id];
            if (n) ctx.lineTo(n.x, n.y);
          });
          ctx.stroke();
        });
        ctx.restore();
      }

      // 4+5. PROFUNDIDADE (y-sort): PCs, cadeiras, racks, fliperamas e personagens são desenhados
      // do fundo para a frente. Depois de cada personagem, recolocamos os móveis e paredes do cache
      // estático que estão NA FRENTE dele, então ele fica atrás de mesas, estantes e paredes.
      const eventosPc = simuladorBotsMapa.obterEventosPcAtivos();
      const itens: ObjetoProfundo[] = coletarObjetosDinamicos(
        d.computadores,
        tick,
        d.melhorias,
        vista,
        simuladorBotsMapa.obterEstadoArena(),
        eventosPc
      );
      bots.forEach((bot, idx) => {
        if (!emVista(bot.x, bot.y, 64)) return;
        const sentadoPc = bot.pose === 'SITTING_PC' || bot.pose === 'PC_TRIPLE_KILL' || bot.pose === 'PC_LOUCURA';
        // quem está sentado fica entre a cadeira (atrás) e o teclado/mesa (na frente)
        const chave = bot.y + (bot.profundidadeOffset ?? (sentadoPc ? 12 : 0));
        const bx = bot.x - 26;
        const by = bot.y - 48;
        itens.push({
          base: chave,
          x: bx,
          y: by,
          w: 52,
          h: 66,
          desenhar: (c) => {
            if (
              SOMBRA_PERSONAGEM &&
              !sentadoPc &&
              bot.pose !== 'SITTING_EAT' &&
              bot.pose !== 'SITTING_REST' &&
              bot.pose !== 'ROMANCE_CUDDLE' &&
              bot.pose !== 'ROMANCE_KISS'
            ) {
              const sx = Math.round(bot.x);
              const sy = Math.round(bot.y);
              const ehCaminhoPc = bot.id.startsWith('cliente_sessao_') && bot.filaRota.length > 0;
              if (ehCaminhoPc) {
                // Pulso gamer sutil sob os pés indicando cliente a caminho do PC
                const pulse = Math.abs(Math.sin(tick * 0.25)) * 3;
                c.fillStyle = 'rgba(56, 189, 248, 0.40)';
                c.beginPath();
                c.ellipse(sx, sy, 8 + pulse, 3.5, 0, 0, Math.PI * 2);
                c.fill();
              }
              // elipse em 3 degraus de pixel, centrada nos pés (a cadeira/sofá já tem a própria sombra)
              c.fillStyle = 'rgba(8, 4, 24, 0.30)';
              c.fillRect(sx - 8, sy - 2, 16, 2);
              c.fillRect(sx - 10, sy, 20, 2);
              c.fillRect(sx - 8, sy + 2, 16, 2);
            }
            drawRpgPixelCharacter(c, bot, idx, tick);
            recolocarEstatico(c, bx, by, 52, 66, chave);
          },
        });
      });
      itens.sort((a, b) => a.base - b.base);
      itens.forEach((o) => o.desenhar(ctx));

      // Efeitos visuais de impacto de combate na Arena & Sacos de Pancada
      const arEstado = simuladorBotsMapa.obterEstadoArena();
      bots.forEach((bot) => {
        if (!bot.id.startsWith('arena_')) return;
        if (!emVista(bot.x, bot.y, 64)) return;
        if (bot.pose === 'PUNCH' || bot.pose === 'KICK') {
          const pulso = Math.floor(tick / 4) % 2 === 0;
          if (!pulso) return;
          const dirX = bot.direcao === 'LEFT' ? -16 : 16;
          const ix = Math.round(bot.x + dirX);
          const iy = Math.round(bot.y - 16);
          ctx.save();
          ctx.fillStyle = '#fef08a';
          ctx.strokeStyle = '#0f172a';
          ctx.lineWidth = 2.5;
          ctx.font = 'bold 9px monospace';
          ctx.textAlign = 'center';
          const tag = arEstado.koFlash ? 'K.O.!' : bot.pose === 'KICK' ? 'BAM!' : 'POW!';
          ctx.strokeText(tag, ix, iy);
          ctx.fillText(tag, ix, iy);
          ctx.restore();
        }
      });

      // Placas arcade de Triple Kill / Penta Kill / Incorporação acima dos jogadores nos PCs
      bots.forEach((bot, bIdx) => {
        if (!bot.eventoPcHype || !bot.eventoPcLabel) return;
        if (!emVista(bot.x, bot.y, 80)) return;
        const ehLoucura = bot.eventoPcHype === 'LOUCURA';
        const pulso = Math.floor(tick / 4) % 2 === 0;
        const tremeX = ehLoucura ? ((tick + bIdx) % 4 < 2 ? -1.5 : 1.5) : 0;
        const pulaY = Math.abs(Math.sin(tick * 0.25 + bIdx)) * (ehLoucura ? 5 : 3);
        const px = Math.round(bot.x + tremeX);
        const py = Math.round(bot.y - 48 - pulaY);
        const icone = ehLoucura ? '🔥' : '⚡';
        const texto = `${icone} ${bot.eventoPcLabel}`;

        ctx.save();
        ctx.font = '800 9.5px "Inter", system-ui, sans-serif';
        const tw = Math.round(ctx.measureText(texto).width) + 12;
        const th = 14;
        const rx = Math.round(px - tw / 2);
        const ry = Math.round(py - th / 2);

        // Fundo estilo banner arcade com brilho neon
        ctx.fillStyle = '#0f172a';
        ctx.fillRect(rx - 1, ry - 1, tw + 2, th + 2);
        ctx.fillStyle = ehLoucura ? (pulso ? '#dc2626' : '#991b1b') : pulso ? '#1e1b4b' : '#0f172a';
        ctx.fillRect(rx, ry, tw, th);
        ctx.strokeStyle = ehLoucura ? (pulso ? '#fde047' : '#fb923c') : pulso ? '#facc15' : '#22d3ee';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(rx + 0.5, ry + 0.5, tw - 1, th - 1);

        // Texto nítido
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = ehLoucura ? '#fef08a' : pulso ? '#fde047' : '#e0f2fe';
        ctx.fillText(texto, px, py + 0.5);

        // Faíscas laterais em cruz pixel art
        const sx1 = rx - 5;
        const sx2 = rx + tw + 3;
        ctx.fillStyle = pulso ? '#fde047' : '#38bdf8';
        ctx.fillRect(sx1, py - 2, 2, 4);
        ctx.fillRect(sx1 - 1, py - 1, 4, 2);
        ctx.fillRect(sx2, py - 2, 2, 4);
        ctx.fillRect(sx2 - 1, py - 1, 4, 2);
        ctx.restore();
      });

      renderEtiquetasPcs(ctx, d.computadores, hoverPc.current, vista);

      // 6. Iluminação neon
      renderIluminacao(ctx, tick, d.computadores, vista, eventosPc);
      renderTrafegoLuzes(ctx, tick, vista);
      renderEstacionamentoLuzes(ctx, tick, vista, resumoEstac);

      // Level-Up (anel + partículas) por cima da iluminação
      bursts.current = bursts.current.filter((b) => tick - b.inicio < 100);
      bursts.current.forEach((b) => {
        if (!emVista(b.x, b.y, 200)) return;
        const t = tick - b.inicio;
        const raio = 16 + t * 1.1;
        ctx.save();
        ctx.globalAlpha = Math.max(0, 1 - t / 100);
        ctx.strokeStyle = t % 8 < 4 ? '#facc15' : '#22d3ee';
        ctx.lineWidth = 4;
        ctx.strokeRect(Math.round(b.x - raio), Math.round(b.y - raio * 0.6), Math.round(raio * 2), Math.round(raio * 1.2));
        for (let i = 0; i < 10; i++) {
          const px = b.x + Math.round(Math.sin(i * 1.9 + b.inicio) * 44);
          const py = b.y - ((t * 1.8 + i * 22) % 120);
          ctx.fillStyle = i % 2 === 0 ? '#fde047' : '#67e8f9';
          ctx.fillRect(Math.round(px / 2) * 2, Math.round(py / 2) * 2, 6, 6);
        }
        ctx.font = '800 18px "Inter", system-ui, sans-serif';
        ctx.textAlign = 'center';
        const ty = Math.round(b.y - 60 - t * 0.8);
        ctx.fillStyle = '#261d2e';
        ctx.fillText(`⬆ ${b.texto}`, b.x + 2, ty + 2);
        ctx.fillStyle = '#fde047';
        ctx.fillText(`⬆ ${b.texto}`, b.x, ty);
        ctx.restore();
      });

      // Animações de compra nas lojas (moedas pixel art, brilho neon e texto de valor)
      const eventosCompra = simuladorBotsMapa.obterEventosCompra(tick);
      eventosCompra.forEach((ev) => {
        if (!emVista(ev.x, ev.y, 160)) return;
        const t = tick - ev.inicioTick;
        if (t < 0 || t >= 80) return;
        const progresso = t / 80;
        const alpha = Math.max(0, 1 - progresso * 1.05);

        ctx.save();
        ctx.globalAlpha = alpha;

        // 1. Pulso neon sutil sobre o balcão
        const raioLuz = 20 + t * 0.4;
        ctx.fillStyle = ev.corLoja ? `${ev.corLoja}33` : 'rgba(56, 189, 248, 0.25)';
        ctx.fillRect(Math.round(ev.x - raioLuz), Math.round(ev.y - raioLuz * 0.4), Math.round(raioLuz * 2), Math.round(raioLuz * 0.8));

        // 2. Moedas pixel art saltando (arcos de parábola)
        const moedas = [
          { dx: -16, h: 26 },
          { dx: -6, h: 36 },
          { dx: 6, h: 32 },
          { dx: 16, h: 22 },
        ];
        for (const m of moedas) {
          const mt = t / 45;
          if (mt <= 1.2) {
            const mx = ev.x + m.dx * mt;
            const my = ev.y - Math.sin(Math.min(1, mt) * Math.PI) * m.h + (mt > 0.8 ? (mt - 0.8) * 16 : 0);
            const px = Math.round(mx);
            const py = Math.round(my);

            ctx.fillStyle = '#1e1b2e';
            ctx.fillRect(px - 1, py - 1, 6, 6);
            ctx.fillStyle = '#facc15';
            ctx.fillRect(px, py, 4, 4);
            ctx.fillStyle = '#fef08a';
            ctx.fillRect(px + 1, py + 1, 2, 2);
          }
        }

        // 3. Estrelinhas pixel art piscando em cruz
        for (let s = 0; s < 4; s++) {
          const ang = s * (Math.PI / 2) + t * 0.12;
          const dist = 12 + t * 0.3;
          const sx = Math.round(ev.x + Math.cos(ang) * dist);
          const sy = Math.round(ev.y - 10 + Math.sin(ang) * (dist * 0.6));
          const corEstrela = (t + s * 4) % 8 < 4 ? '#38bdf8' : '#facc15';
          ctx.fillStyle = corEstrela;
          ctx.fillRect(sx, sy - 2, 2, 6);
          ctx.fillRect(sx - 2, sy, 6, 2);
        }

        // 4. Texto flutuante de valor (+R$ ...) subindo
        const subidaY = Math.round(ev.y - 18 - t * 0.85);
        ctx.font = '700 13px "Inter", system-ui, sans-serif';
        ctx.textAlign = 'center';

        ctx.fillStyle = '#1e1b2e';
        ctx.fillText(ev.textoValor, ev.x + 1, subidaY + 1);
        ctx.fillText(ev.textoValor, ev.x - 1, subidaY - 1);
        ctx.fillText(ev.textoValor, ev.x + 1, subidaY - 1);
        ctx.fillText(ev.textoValor, ev.x - 1, subidaY + 1);

        ctx.fillStyle = '#4ade80';
        ctx.fillText(ev.textoValor, ev.x, subidaY);

        ctx.font = '12px sans-serif';
        ctx.fillText(ev.icone, ev.x, subidaY - 14);

        ctx.restore();
      });

      // --- espaço de tela: balões, tooltip de sala -----------------------
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.imageSmoothingEnabled = false;

      const escalaBalao = clamp(cc.zoom, 1, 1.5);
      const ocupados: Retangulo[] = [];
      let desenhados = 0;
      const projetar = (bot: AgenteBot) => {
        const sx = (bot.x - cc.x) * cc.zoom + w / 2;
        const sy = (bot.y - 36 - cc.y) * cc.zoom + h / 2;
        return { sx, sy };
      };

      // o balão em foco (hover) é desenhado por último e tem prioridade de espaço
      const botHover = hoverBotId.current ? bots.find((b) => b.id === hoverBotId.current) : undefined;
      if (botHover) {
        const { sx, sy } = projetar(botHover);
        ocupados.push({ x: sx - 140, y: sy - 70, w: 280, h: 80 });
      }
      for (const bot of bots) {
        if (desenhados >= MAX_BALOES) break;
        if (botHover && bot.id === botHover.id) continue;
        if (bot.eventoPcHype) continue; // já exibe banner arcade próprio em mundo
        if (!emVista(bot.x, bot.y, 40)) continue;
        const { sx, sy } = projetar(bot);
        if (desenharBalao(ctx, bot, sx, sy, escalaBalao, ocupados, d.configuracoes, d.modoBaloes, false, w)) {
          desenhados += 1;
        }
      }
      if (botHover) {
        const { sx, sy } = projetar(botHover);
        desenharBalao(ctx, botHover, sx, sy, escalaBalao, [], d.configuracoes, d.modoBaloes, true, w);
      } else if (hoverSala.current && mouseTela.current.dentro && !arrasto.current.moveu) {
        // tooltip elegante da sala sob o mouse (legível e sem aspecto pixelado)
        const sala = hoverSala.current;
        const texto = sala.setor ? `${sala.nome}  ·  Clique para abrir` : sala.nome;
        ctx.font = '600 12.5px "Inter", -apple-system, system-ui, sans-serif';
        const tw = Math.round(ctx.measureText(texto).width) + 24;
        const th = 28;
        const tx = clamp(mouseTela.current.x + 16, 8, w - tw - 8);
        const ty = clamp(mouseTela.current.y + 18, 8, h - th - 8);

        // Fundo com borda sutil e cantos arredondados
        ctx.save();
        ctx.fillStyle = 'rgba(11, 18, 36, 0.96)';
        ctx.strokeStyle = sala.setor ? '#38bdf8' : '#475569';
        ctx.lineWidth = 1.5;
        if (typeof (ctx as any).roundRect === 'function') {
          ctx.beginPath();
          (ctx as any).roundRect(tx, ty, tw, th, 5);
          ctx.fill();
          ctx.stroke();
        } else {
          ctx.fillRect(tx, ty, tw, th);
          ctx.strokeRect(tx + 0.5, ty + 0.5, tw - 1, th - 1);
        }

        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#f8fafc';
        ctx.fillText(texto, tx + 12, ty + th / 2);
        ctx.restore();
      }
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ------------------------------------------------------------------------
  // Controles rápidos (serão movidos para o menu de desenvolvedor na etapa do HUD)
  // ------------------------------------------------------------------------
  const alternarModoBaloes = () =>
    setModoBaloes((atual) => (atual === 'COMPACTO' ? 'ICONES' : atual === 'ICONES' ? 'OCULTO' : 'COMPACTO'));

  const estiloBotao = (ativo: boolean, borda: string, cor: string): React.CSSProperties => ({
    fontSize: '0.82rem',
    fontWeight: 600,
    padding: '6px 12px',
    borderRadius: 6,
    background: ativo ? 'rgba(14, 116, 144, 0.94)' : 'rgba(15, 23, 42, 0.92)',
    borderColor: borda,
    color: cor,
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
  });

  const rotuloVisao = modoVisao === 'LOJA' ? 'Loja' : 'Mapa completo';

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <canvas
        ref={canvasRef}
        onPointerDown={aoPressionar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        onPointerLeave={aoSairDoCanvas}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          imageRendering: 'pixelated',
          cursor: 'grab',
          touchAction: 'none',
        }}
      />

      {/* TOOLBAR FLUTUANTE DE VISÃO & CÂMERA (HD GLASS) */}
      {!hudOculto && (
        <nav className="hud-camera-dock" aria-label="Controles de Câmera e Visualização">
          <button
            onClick={() => irParaModo(modoVisao === 'LOJA' ? 'COMPLETO' : 'LOJA')}
            className="hud-camera-btn"
            title="Alterna entre a visão da loja e o mapa completo 96x64 (atalho: 0)"
          >
            <span>🔍 Visão: <strong>{rotuloVisao}</strong> ({zoomExibido.toFixed(2)}×)</span>
          </button>

          <button
            onClick={() => setMostrarGrade((g) => !g)}
            className={`hud-camera-btn ${mostrarGrade ? 'active' : ''}`}
            title="Exibir/ocultar a grade de tiles 32x32"
          >
            <span>🧱 Grade: <strong>{mostrarGrade ? 'ON' : 'OFF'}</strong></span>
          </button>

          <button
            onClick={() => setMostrarRotasIA((r) => !r)}
            className={`hud-camera-btn ${mostrarRotasIA ? 'active' : ''}`}
            title="Visualizar o grafo de portas, corredores e as rotas dos bots"
          >
            <span>🗺️ Rotas IA: <strong>{mostrarRotasIA ? 'ON' : 'OFF'}</strong></span>
          </button>

          <button
            onClick={alternarModoBaloes}
            className="hud-camera-btn"
            title="Alternar balões de fala (Compacto / Apenas ícones / Oculto)"
          >
            <span>💬 Balões: <strong>{modoBaloes}</strong></span>
          </button>
        </nav>
      )}
    </div>
  );
};
