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
  nodoAssentoDoPc,
  simuladorBotsMapa,
  WAYPOINT_NODES,
} from '../domain/WaypointGraph';
import {
  ParallaxOffsets2D,
  POSICAO_MELHORIA,
  renderDoorwayLintelsAndLabels,
  renderLanHouseArchitecture,
  TIER_PC,
} from './LanHouseMapRenderer';
import { drawRpgPixelCharacter, RPG_OUTLINE } from './RpgPixelSpriteEngine';

interface Props {
  computadores: Computador[];
  sessoes: Sessao[];
  funcionarios: Funcionario[];
  personagens: PersonagemMapa[];
  melhorias?: MelhoriaEstabelecimento[];
  configuracoes: ConfiguracoesJogo;
  onSelectPc: (numeroPc: number) => void;
  onSelectSector: (
    sector: 'RECEPCAO' | 'BOMBONIERE' | 'ESCRITORIO' | 'MANUTENCAO' | 'ESTOQUE' | 'CONSOLES'
  ) => void;
}

type ModoBaloes = 'COMPACTO' | 'ICONES' | 'OCULTO';
type ModoParallax = 'DINAMICO' | 'INTENSO' | 'OFF';
type EscalaMapa16x16 = 1 | 1.15 | 1.3;

/**
 * Renderizador de Mapa em Grade de Tiles 16x16 (LimeZu "Modern Interiors" + @ErisEsra)
 * - Paletas de cores originais e vibrantes restauradas
 * - Mapa expandido de 80x48 Tiles 16x16 (com Ala Oeste Deck Gamer e Ala Leste Palco E-Sports)
 * - Personagens em Matriz de Sprites 16x24 pixel a pixel + Câmera Parallax 2D
 */
export const LanHouseCanvas: React.FC<Props> = ({
  computadores,
  sessoes,
  funcionarios,
  melhorias = [],
  configuracoes,
  onSelectPc,
  onSelectSector,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [mostrarRotasIA, setMostrarRotasIA] = useState(false);
  const [mostrarGrade16x16, setMostrarGrade16x16] = useState(false);
  const [modoBaloes, setModoBaloes] = useState<ModoBaloes>('COMPACTO');
  const modoParallax: ModoParallax = 'OFF'; // Parallax removido
  const [zoomMapa, setZoomMapa] = useState<EscalaMapa16x16>(1.15);
  const [hoveredPc, setHoveredPc] = useState<number | null>(null);
  const [hoveredRoom, setHoveredRoom] = useState<string | null>(null);
  const [mouseWorld, setMouseWorld] = useState<{ wx: number; wy: number }>({ wx: 640, wy: 380 });

  const parallaxTargetRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const parallaxCurrentRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Rastreia níveis anteriores para disparar a animação de Level-Up ao evoluir equipamentos
  const niveisAnterioresRef = useRef<Map<string, number> | null>(null);
  const burstsRef = useRef<{ x: number; y: number; inicio: number; texto: string }[]>([]);

  const WORLD_W = 1280; // 80 Tiles de 16x16
  const WORLD_H = 768; // 48 Tiles de 16x16

  const obterPosicaoEstacao = (numeroPc: number) => {
    const seatNode = WAYPOINT_NODES[nodoAssentoDoPc(numeroPc)];
    if (!seatNode) return { x: 400, y: 340, seatX: 400, seatY: 364 };
    return {
      x: seatNode.x,
      y: seatNode.y - 24,
      seatX: seatNode.x,
      seatY: seatNode.y,
    };
  };

  const telaParaMundo = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { wx: 0, wy: 0, normX: 0, normY: 0 };
    const rect = canvas.getBoundingClientRect();
    const screenWx = ((clientX - rect.left) * WORLD_W) / rect.width;
    const screenWy = ((clientY - rect.top) * WORLD_H) / rect.height;
    const normX = ((clientX - rect.left) / rect.width - 0.5) * 2;
    const normY = ((clientY - rect.top) / rect.height - 0.5) * 2;

    // Desfaz a transformação de Zoom centralizado + Parallax Midground (0.80x)
    const cx = WORLD_W / 2;
    const cy = WORLD_H / 2 - 16;
    const unzoomedX = (screenWx - cx) / zoomMapa + cx;
    const unzoomedY = (screenWy - cy) / zoomMapa + cy;

    const midShiftX = parallaxCurrentRef.current.x * 0.8;
    const midShiftY = parallaxCurrentRef.current.y * 0.8;
    return {
      wx: unzoomedX - midShiftX,
      wy: unzoomedY - midShiftY,
      normX,
      normY,
    };
  };

  const detectarComodo = (
    wx: number,
    wy: number
  ): 'RECEPCAO' | 'BOMBONIERE' | 'ESCRITORIO' | 'MANUTENCAO' | 'ESTOQUE' | 'CONSOLES' | null => {
    if (wx >= 80 && wx <= 208 && wy >= 108 && wy <= 580) return 'BOMBONIERE';
    if (wx >= 210 && wx <= 428 && wy >= 108 && wy <= 288) return 'ESCRITORIO';
    if (wx >= 432 && wx <= 684 && wy >= 108 && wy <= 288) return 'RECEPCAO';
    if (wx >= 688 && wx <= 856 && wy >= 108 && wy <= 288) return 'MANUTENCAO';
    if (wx >= 860 && wx <= 1038 && wy >= 108 && wy <= 288) return 'BOMBONIERE';
    if (wx >= 860 && wx <= 1038 && wy >= 292 && wy <= 434) return 'ESTOQUE';
    if (wx >= 860 && wx <= 1184 && wy >= 108 && wy <= 580) return 'CONSOLES';
    return null;
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { wx, wy, normX, normY } = telaParaMundo(e.clientX, e.clientY);
    setMouseWorld({ wx, wy });

    const maxAmp = 0; // Parallax desativado
    parallaxTargetRef.current = {
      x: -normX * maxAmp,
      y: -normY * (maxAmp * 0.65),
    };

    let encontrado: number | null = null;
    for (const pc of computadores.slice(0, 24)) {
      const pos = obterPosicaoEstacao(pc.numero);
      if (Math.abs(wx - pos.x) <= 22 && Math.abs(wy - (pos.y + 10)) <= 24) {
        encontrado = pc.numero;
        break;
      }
    }
    setHoveredPc(encontrado);
    setHoveredRoom(encontrado ? null : detectarComodo(wx, wy));
  };

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const { wx, wy } = telaParaMundo(e.clientX, e.clientY);

    for (const pc of computadores.slice(0, 24)) {
      const pos = obterPosicaoEstacao(pc.numero);
      if (Math.abs(wx - pos.x) <= 24 && Math.abs(wy - (pos.y + 10)) <= 26) {
        onSelectPc(pc.numero);
        return;
      }
    }

    const comodo = detectarComodo(wx, wy);
    if (comodo) {
      onSelectSector(comodo);
    }
  };

  useEffect(() => {
    let animId = 0;
    let tick = 0;

    /**
     * BALÃO DE DIÁLOGO PIXEL ART CLÁSSICO RESTAURADO (Estilo Imagens 2 e 4: Creme #fbfbf2 + Borda #261d2e)
     */
    const drawClassicRpgSpeechBubble = (
      ctx: CanvasRenderingContext2D,
      bot: AgenteBot,
      isHoveredBot: boolean
    ) => {
      const px = Math.round(bot.x / 2) * 2;
      const py = Math.round(bot.y / 2) * 2;

      if (isHoveredBot) {
        ctx.font = '700 10.5px "Chakra Petch", sans-serif';
        const titulo = `${bot.iconeCabeca || '👤'} ${bot.nome} (${bot.papel})`;
        ctx.font = '600 9.5px "Chakra Petch", sans-serif';
        const sub = bot.acaoTexto;
        const w =
          Math.round(Math.max(ctx.measureText(titulo).width, ctx.measureText(sub).width) / 2) * 2 +
          18;
        const h = 32;
        const bx = Math.max(100, Math.min(WORLD_W - w - 20, px - w / 2));
        const by = py - 62;

        ctx.fillStyle = RPG_OUTLINE;
        ctx.fillRect(bx - 2, by - 2, w + 4, h + 4);
        ctx.fillStyle = '#fbfbf2';
        ctx.fillRect(bx, by, w, h);
        ctx.fillStyle = '#e8e4d5';
        ctx.fillRect(bx, by, w, 3);

        ctx.fillStyle = '#1e1b2e';
        ctx.font = '700 10px "Chakra Petch", sans-serif';
        ctx.fillText(titulo, bx + 8, by + 13);

        ctx.fillStyle = '#475569';
        ctx.font = '600 9px "Chakra Petch", sans-serif';
        ctx.fillText(sub, bx + 8, by + 25);
        return;
      }

      if (!configuracoes.mostrarBaloesMapa || modoBaloes === 'OCULTO') return;
      if (!bot.mostrarBalao) return;

      const textoExibido =
        modoBaloes === 'ICONES'
          ? bot.iconeCabeca || '♪'
          : `${bot.iconeCabeca ? bot.iconeCabeca + ' ' : ''}${bot.falaCurta}`;

      ctx.font = '700 9.5px "Chakra Petch", sans-serif';
      const textW = Math.round(ctx.measureText(textoExibido).width / 2) * 2;
      const pillW = Math.max(20, textW + 12);
      const pillH = 16;
      const bx = Math.round((px - pillW / 2) / 2) * 2;
      const by = py - 44;

      ctx.fillStyle = 'rgba(26, 20, 35, 0.25)';
      ctx.fillRect(bx + 2, by + 2, pillW, pillH);

      ctx.fillStyle = RPG_OUTLINE;
      ctx.fillRect(bx - 2, by - 2, pillW + 4, pillH + 4);

      ctx.fillStyle = bot.pose === 'CHATTING' ? '#eefbf3' : '#fbfbf2';
      ctx.fillRect(bx, by, pillW, pillH);

      ctx.fillStyle = bot.pose === 'CHATTING' ? '#86efac' : '#d6d3c4';
      ctx.fillRect(bx, by, pillW, 2);

      ctx.fillStyle = RPG_OUTLINE;
      ctx.fillRect(px - 4, by + pillH, 8, 2);
      ctx.fillRect(px - 2, by + pillH + 2, 4, 2);
      ctx.fillStyle = bot.pose === 'CHATTING' ? '#eefbf3' : '#fbfbf2';
      ctx.fillRect(px - 2, by + pillH - 2, 4, 4);

      ctx.fillStyle = RPG_OUTLINE;
      ctx.fillText(textoExibido, bx + 6, by + 12);
    };

    const render = () => {
      tick += 1;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const autoDriftX =
        modoParallax === 'OFF'
          ? 0
          : Math.sin(tick * 0.018) * (modoParallax === 'INTENSO' ? 10 : 5);
      const autoDriftY =
        modoParallax === 'OFF'
          ? 0
          : Math.cos(tick * 0.014) * (modoParallax === 'INTENSO' ? 6 : 3);

      const targetX = (modoParallax === 'OFF' ? 0 : parallaxTargetRef.current.x) + autoDriftX;
      const targetY = (modoParallax === 'OFF' ? 0 : parallaxTargetRef.current.y) + autoDriftY;

      parallaxCurrentRef.current.x += (targetX - parallaxCurrentRef.current.x) * 0.09;
      parallaxCurrentRef.current.y += (targetY - parallaxCurrentRef.current.y) * 0.09;

      const parallax: ParallaxOffsets2D = {
        camX: parallaxCurrentRef.current.x,
        camY: parallaxCurrentRef.current.y,
      };

      ctx.save();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = '#191d30';
      ctx.fillRect(0, 0, WORLD_W, WORLD_H);

      // Aplica Zoom de Mapa 16x16 centralizado no complexo da Lan House
      const cx = WORLD_W / 2;
      const cy = WORLD_H / 2 - 16;
      ctx.translate(cx, cy);
      ctx.scale(zoomMapa, zoomMapa);
      ctx.translate(-cx, -cy);

      // 1. ARQUITETURA EM TILES (Paleta Neon Cyberpunk-Cozy)
      renderLanHouseArchitecture(
        ctx,
        computadores,
        hoveredPc,
        tick,
        1,
        parallax,
        mostrarGrade16x16,
        melhorias
      );

      // Detecta evoluções de PC / melhorias do estabelecimento e dispara animação de Level-Up
      {
        const atuais = new Map<string, number>();
        computadores.forEach((pc) => atuais.set(`pc_${pc.numero}`, TIER_PC[pc.categoria] ?? 0));
        melhorias.forEach((m) => atuais.set(`m_${m.id}`, m.nivel));
        const anteriores = niveisAnterioresRef.current;
        if (anteriores) {
          atuais.forEach((nivel, chave) => {
            const antigo = anteriores.get(chave);
            if (antigo === undefined || nivel <= antigo) return;
            if (chave.startsWith('pc_')) {
              const pos = obterPosicaoEstacao(Number(chave.slice(3)));
              burstsRef.current.push({ x: pos.x, y: pos.y - 8, inicio: tick, texto: 'UPGRADE!' });
            } else {
              const alvo = POSICAO_MELHORIA[chave.slice(2)];
              if (alvo) burstsRef.current.push({ x: alvo.x, y: alvo.y, inicio: tick, texto: `LV.${nivel}!` });
            }
          });
        }
        niveisAnterioresRef.current = atuais;
      }

      const midShiftX = Math.round((parallax.camX * 0.8) / 2) * 2;
      const midShiftY = Math.round((parallax.camY * 0.8) / 2) * 2;

      ctx.save();
      ctx.translate(midShiftX, midShiftY);

      if (mostrarRotasIA) {
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.6)';
        ctx.lineWidth = 2;
        Object.values(WAYPOINT_NODES).forEach((node) => {
          node.vizinhos.forEach((vizId) => {
            const viz = WAYPOINT_NODES[vizId];
            if (!viz) return;
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(viz.x, viz.y);
            ctx.stroke();
          });
        });

        Object.values(WAYPOINT_NODES).forEach((node) => {
          const ehPorta = node.id.includes('porta');
          ctx.fillStyle = ehPorta ? '#facc15' : '#38bdf8';
          ctx.fillRect(node.x - 3, node.y - 3, 6, 6);
        });
        ctx.restore();
      }

      // 3. PERSONAGENS RPG EM MATRIZ DE SPRITE 16x24 REAL (Cores Naturais Restauradas!)
      const botsOrdenados = simuladorBotsMapa.atualizarFrame(
        computadores,
        sessoes,
        funcionarios
      );

      if (mostrarRotasIA) {
        ctx.save();
        ctx.setLineDash([4, 4]);
        botsOrdenados.forEach((bot) => {
          if (bot.filaRota.length === 0) return;
          ctx.strokeStyle = bot.ehCliente ? '#38bdf8' : '#facc15';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(bot.x, bot.y);
          bot.filaRota.forEach((nodeId: string) => {
            const n = WAYPOINT_NODES[nodeId];
            if (n) ctx.lineTo(n.x, n.y);
          });
          ctx.stroke();
        });
        ctx.restore();
      }

      botsOrdenados.forEach((bot, idx) => {
        drawRpgPixelCharacter(ctx, bot, idx, tick);
      });

      // Animação de Level-Up (anel de pixels + partículas douradas subindo)
      burstsRef.current = burstsRef.current.filter((b) => tick - b.inicio < 100);
      burstsRef.current.forEach((b) => {
        const t = tick - b.inicio;
        const raio = 8 + t * 0.55;
        const alpha = Math.max(0, 1 - t / 100);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = t % 8 < 4 ? '#facc15' : '#22d3ee';
        ctx.lineWidth = 3;
        ctx.strokeRect(Math.round(b.x - raio), Math.round(b.y - raio * 0.6), Math.round(raio * 2), Math.round(raio * 1.2));
        for (let i = 0; i < 10; i++) {
          const px = b.x + Math.round(Math.sin(i * 1.9 + b.inicio) * 22);
          const py = b.y - ((t * 0.9 + i * 11) % 60);
          ctx.fillStyle = i % 2 === 0 ? '#fde047' : '#67e8f9';
          ctx.fillRect(Math.round(px / 2) * 2, Math.round(py / 2) * 2, 4, 4);
        }
        ctx.font = '700 11px "Chakra Petch", monospace';
        ctx.textAlign = 'center';
        const ty = Math.round(b.y - 30 - t * 0.4);
        ctx.fillStyle = '#261d2e';
        ctx.fillText(`⬆ ${b.texto}`, b.x + 1, ty + 1);
        ctx.fillStyle = '#fde047';
        ctx.fillText(`⬆ ${b.texto}`, b.x, ty);
        ctx.textAlign = 'start';
        ctx.restore();
      });

      ctx.restore();

      // 4. FOREGROUND PARALLAX (Paredes Cutaway Brancas + Placas de Cômodos)
      renderDoorwayLintelsAndLabels(ctx, tick, 1, parallax);

      // 5. BALÕES DE FALA CLÁSSICOS (#fbfbf2)
      ctx.save();
      ctx.translate(
        Math.round((parallax.camX * 0.92) / 2) * 2,
        Math.round((parallax.camY * 0.92) / 2) * 2
      );

      let botSobMouse: AgenteBot | null = null;
      for (const bot of botsOrdenados) {
        if (
          Math.abs(mouseWorld.wx - bot.x) <= 16 &&
          Math.abs(mouseWorld.wy - (bot.y - 8)) <= 22
        ) {
          botSobMouse = bot;
          break;
        }
      }

      botsOrdenados.forEach((bot) => {
        if (botSobMouse && botSobMouse.id === bot.id) return;
        drawClassicRpgSpeechBubble(ctx, bot, false);
      });

      if (botSobMouse) {
        drawClassicRpgSpeechBubble(ctx, botSobMouse, true);
      }
      ctx.restore();

      ctx.restore();
      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animId);
  }, [
    computadores,
    sessoes,
    funcionarios,
    configuracoes,
    hoveredPc,
    mostrarRotasIA,
    mostrarGrade16x16,
    modoBaloes,
    modoParallax,
    zoomMapa,
    mouseWorld,
  ]);

  const alternarModoBaloes = () => {
    setModoBaloes((atual) =>
      atual === 'COMPACTO' ? 'ICONES' : atual === 'ICONES' ? 'OCULTO' : 'COMPACTO'
    );
  };

  const alternarZoomMapa = () => {
    setZoomMapa((atual) => (atual === 1.15 ? 1.3 : atual === 1.3 ? 1 : 1.15));
  };

  const labelZoom =
    zoomMapa === 1.3
      ? 'Zoom 16×16 (1.30×)'
      : zoomMapa === 1.15
      ? 'Ampliado 16×16 (1.15×)'
      : 'Completo 80×48 (1.0×)';

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh' }}>
      <canvas
        ref={canvasRef}
        width={WORLD_W}
        height={WORLD_H}
        onMouseMove={handleMouseMove}
        onClick={handleClick}
        style={{
          width: '100vw',
          height: '100vh',
          objectFit: 'cover',
          display: 'block',
          imageRendering: 'pixelated',
          cursor: hoveredPc || hoveredRoom ? 'pointer' : 'default',
        }}
      />

      {/* Controles rápidos do Mapa 16x16, Parallax 2D, Malha de Tiles e Balões */}
      <div
        style={{
          position: 'fixed',
          top: 12,
          left: 268,
          zIndex: 25,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <button
          onClick={alternarZoomMapa}
          className="pixel-btn"
          style={{
            fontSize: '0.72rem',
            padding: '5px 11px',
            background: 'rgba(15, 23, 42, 0.92)',
            borderColor: '#facc15',
            color: '#fef08a',
          }}
          title="Alternar ampliação do Mapa de Tiles 16x16"
        >
          🔍 Mapa: {labelZoom}
        </button>

        <button
          onClick={() => setMostrarGrade16x16((g) => !g)}
          className="pixel-btn"
          style={{
            fontSize: '0.72rem',
            padding: '5px 11px',
            background: mostrarGrade16x16
              ? 'rgba(14, 116, 144, 0.94)'
              : 'rgba(15, 23, 42, 0.9)',
            borderColor: '#c084fc',
            color: '#f3e8ff',
          }}
          title="Exibir/ocultar as linhas da grade de Tiles 16x16 no piso"
        >
          🧱 Grade 16×16: {mostrarGrade16x16 ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={() => setMostrarRotasIA((r) => !r)}
          className="pixel-btn"
          style={{
            fontSize: '0.72rem',
            padding: '5px 11px',
            background: mostrarRotasIA
              ? 'rgba(14, 116, 144, 0.94)'
              : 'rgba(15, 23, 42, 0.9)',
            borderColor: mostrarRotasIA ? '#fde047' : '#38bdf8',
            color: mostrarRotasIA ? '#fef08a' : '#e2e8f0',
          }}
          title="Visualizar Grafo Arquitetônico de Portas, Corredores e Trajetórias dos Bots"
        >
          🗺️ Rotas IA: {mostrarRotasIA ? 'ON' : 'OFF'}
        </button>

        <button
          onClick={alternarModoBaloes}
          className="pixel-btn"
          style={{
            fontSize: '0.72rem',
            padding: '5px 11px',
            background: 'rgba(15, 23, 42, 0.9)',
            borderColor: '#4ade80',
            color: '#bbf7d0',
          }}
          title="Alternar estilo dos balões de diálogo RPG (Compacto / Apenas Ícones / Oculto)"
        >
          💬 Balões: {modoBaloes}
        </button>
      </div>
    </div>
  );
};
