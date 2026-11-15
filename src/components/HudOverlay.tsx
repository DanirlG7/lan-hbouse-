import React from 'react';
import { Funcionario, ModalAtivo } from '../domain/types';
import { EstadoCompletoLanHouse, FABRICA_CARGOS, lanHouseStore } from '../domain/LanHouseEngine';
import { obterResumoEstacionamento, ResumoEstacionamento } from '../world/parking';
import { PixelAvatar } from './PixelSprites';
import {
  HdIconPc,
  HdIconPix,
  HdIconStore,
  HdIconUpgrades,
  HdIconStats,
  HdIconTrophy,
  HdIconSettings,
} from './HdIcons';

interface Props {
  estado: EstadoCompletoLanHouse;
  operador: Funcionario;
  modalAtivo: ModalAtivo;
  javaOnline: boolean;
  hudOculto?: boolean;
  onToggleHud?: () => void;
  onOpenModal: (modal: ModalAtivo) => void;
  onSetSpeed: (speed: 0 | 1 | 3 | 8) => void;
  onAdvanceMinutes: (mins: number) => void;
}

export const formatarMoeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const formatarDuracao = (minutos: number): string => {
  if (minutos <= 0) return '0 min';
  if (minutos < 60) return `${minutos} min`;
  const horas = Math.floor(minutos / 60);
  const resto = minutos % 60;
  return resto > 0 ? `${horas}h ${resto}m` : `${horas}h`;
};

export const HudOverlay: React.FC<Props> = ({
  estado,
  operador,
  modalAtivo,
  javaOnline,
  hudOculto = false,
  onToggleHud,
  onOpenModal,
  onSetSpeed,
  onAdvanceMinutes,
}) => {
  const [painelEquipeAberto, setPainelEquipeAberto] = React.useState(false);
  const [painelMissaoAberto, setPainelMissaoAberto] = React.useState(true);
  const [painelEstoqueAberto, setPainelEstoqueAberto] = React.useState(false);
  const [resumoEstac, setResumoEstac] = React.useState<ResumoEstacionamento>(() =>
    obterResumoEstacionamento()
  );

  React.useEffect(() => {
    const id = window.setInterval(() => setResumoEstac(obterResumoEstacionamento()), 300);
    return () => window.clearInterval(id);
  }, []);

  // Atalhos de teclado [1] a [8] para abrir os modais rapidamente e [H] para ocultar/mostrar HUD
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignora se estiver digitando em campos de input
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'h' || e.key === 'H') {
        e.preventDefault();
        onToggleHud?.();
        return;
      }
      const mapaTeclas: Record<string, ModalAtivo> = {
        '1': 'COMPUTADORES',
        '2': 'CLIENTES',
        '3': 'LOJA',
        '4': 'MELHORIAS',
        '5': 'FUNCIONARIOS',
        '6': 'ESTATISTICAS',
        '7': 'CONQUISTAS',
        '8': 'CONFIGURACOES',
      };
      if (mapaTeclas[e.key]) {
        e.preventDefault();
        const alvo = mapaTeclas[e.key];
        onOpenModal(modalAtivo === alvo ? null : alvo);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [modalAtivo, onOpenModal, onToggleHud]);

  const dataObj = new Date(estado.relogioIso);
  const horaStr = dataObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dataCurta = dataObj.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  const pcsLivres = estado.computadores.filter((c) => c.status === 'LIVRE').length;
  const sessoesEncerradasSemPag = estado.sessoes.filter(
    (s) =>
      s.status === 'ENCERRADA' &&
      !estado.pagamentos.some((p) => p.sessaoId === s.id && p.status !== 'ESTORNADO')
  ).length;
  const pagsPendentes =
    estado.pagamentos.filter((p) => p.status === 'PENDENTE').length +
    sessoesEncerradasSemPag;

  const xpPercent = Math.min(
    100,
    Math.round((estado.xpAtual / estado.xpProximoNivel) * 100)
  );
  const ultimoLog = estado.auditoria[0];

  const missaoMeta = 12;
  const missaoProgresso = Math.min(missaoMeta, estado.sessoes.length);

  if (hudOculto) {
    return (
      <button
        onClick={onToggleHud}
        className="hud-camera-btn"
        style={{
          position: 'fixed',
          top: 14,
          left: 14,
          zIndex: 30,
          padding: '7px 12px',
          fontSize: '0.78rem',
          background: 'linear-gradient(180deg, rgba(14, 22, 42, 0.88) 0%, rgba(9, 14, 28, 0.94) 100%)',
          borderColor: 'rgba(56, 189, 248, 0.45)',
          boxShadow: '0 6px 18px rgba(0, 0, 0, 0.55)',
        }}
        title="Mostrar todo o HUD novamente (atalho: H)"
        aria-label="Mostrar HUD"
      >
        👁️ Mostrar HUD ▶
      </button>
    );
  }

  return (
    <>
      {/* TOPO ESQUERDO: Card do Gerente / Operador Logado (HD Glassmorphism) */}
      <div
        className="hud-panel-hd"
        style={{
          position: 'fixed',
          top: 14,
          left: 14,
          zIndex: 25,
          padding: '12px 14px',
          width: 256,
        }}
      >
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <div className="hud-avatar-frame">
              <PixelAvatar seed={operador.avatarSeed} size={50} />
            </div>
            <span className="hud-level-pill">
              Lv. {estado.nivelGerente}
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: '0.98rem',
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                letterSpacing: '0.01em',
              }}
            >
              {operador.nome}
            </div>
            <div style={{ fontSize: '0.72rem', color: '#7dd3fc', fontWeight: 600, marginTop: 1 }}>
              {FABRICA_CARGOS[operador.cargo].nomeExibicao}
            </div>

            {/* Chips Modernos: Saldo + Reputação */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 4 }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 5,
                  fontSize: '0.86rem',
                  fontWeight: 800,
                  color: '#4ade80',
                }}
              >
                <span>💵</span>
                <span>{formatarMoeda(estado.caixaSaldo)}</span>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  fontSize: '0.73rem',
                  fontWeight: 700,
                  color: '#facc15',
                }}
              >
                <span>⭐</span>
                <span>Reputação: {estado.reputacao}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Barra de XP + Botão Trocar Operador (RF12) */}
        <div style={{ marginTop: 10, paddingTop: 8, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '0.74rem',
              color: '#94a3b8',
              marginBottom: 5,
            }}
          >
            <span style={{ fontWeight: 600 }}>XP {estado.xpAtual.toLocaleString('pt-BR')} / {estado.xpProximoNivel.toLocaleString('pt-BR')}</span>
            <button
              onClick={() => onOpenModal('LOGIN')}
              className="hud-camera-btn"
              style={{ padding: '2px 8px', fontSize: '0.70rem', color: '#38bdf8' }}
              title="Alternar funcionário / operador logado"
            >
              🔄 Trocar
            </button>
          </div>
          <div
            style={{
              height: 6,
              background: 'rgba(15, 23, 42, 0.8)',
              border: '1px solid rgba(56, 189, 248, 0.25)',
              borderRadius: 3,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${xpPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
                boxShadow: '0 0 8px rgba(56, 189, 248, 0.6)',
                transition: 'width 0.4s ease',
              }}
            />
          </div>
        </div>
      </div>

      {/* MEIO ESQUERDO: Lista Lateral de Funcionários + Botão Ocultar HUD (HD Glassmorphism) */}
      <div
        style={{
          position: 'fixed',
          top: 172,
          left: 14,
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          gap: 7,
        }}
      >
        {painelEquipeAberto ? (
          <aside
            className="hud-panel-hd"
            style={{
              width: 216,
              maxHeight: 'calc(100vh - 375px)',
              display: 'flex',
              flexDirection: 'column',
              padding: '10px 12px',
            }}
            aria-label="Painel da Equipe de Funcionários"
          >
          <div
            style={{
              fontSize: '0.84rem',
              fontWeight: 700,
              color: '#cbd5e1',
              paddingBottom: 8,
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span>👥</span>
              <span>Equipe ({estado.funcionarios.length})</span>
            </span>
            <button
              onClick={() => setPainelEquipeAberto(false)}
              className="hud-camera-btn"
              style={{ padding: '2px 6px', fontSize: '0.66rem' }}
              title="Recolher painel"
            >
              ◀
            </button>
          </div>

          <div
            style={{
              overflowY: 'auto',
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              padding: '8px 0',
            }}
          >
            {estado.funcionarios.map((f) => {
              const isSelf = f.id === operador.id;
              return (
                <div
                  key={f.id}
                  onClick={() => onOpenModal('FUNCIONARIOS')}
                  className={`hud-staff-row ${isSelf ? 'self' : ''}`}
                  title={`${f.nome} - ${FABRICA_CARGOS[f.cargo].nomeExibicao} (${f.trabalhandoAgora ? 'Em Turno' : 'Em Folga'})`}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}>
                    <PixelAvatar seed={f.avatarSeed} size={28} />
                  </div>
                  <div style={{ minWidth: 0, flex: 1 }}>
                    <div
                      style={{
                        fontSize: '0.82rem',
                        fontWeight: 600,
                        color: '#f8fafc',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span>{f.nome.split(' ')[0]}</span>
                      {isSelf && (
                        <span style={{ fontSize: '0.62rem', color: '#38bdf8', fontWeight: 700 }}>
                          (Você)
                        </span>
                      )}
                    </div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 500,
                        color: '#94a3b8',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                      }}
                    >
                      <span className={`hud-status-dot ${f.trabalhandoAgora ? 'online' : 'idle'}`} />
                      <span>{FABRICA_CARGOS[f.cargo].nomeExibicao.split(' ')[0]}</span>
                      <span style={{ opacity: 0.5 }}>•</span>
                      <span style={{ color: f.trabalhandoAgora ? '#4ade80' : '#fbbf24', fontWeight: 600 }}>
                        {f.trabalhandoAgora ? 'Ativo' : 'Folga'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="hud-camera-btn"
            style={{
              width: '100%',
              marginTop: 6,
              justifyContent: 'center',
              padding: '7px 10px',
              fontSize: '0.78rem',
              color: '#38bdf8',
              borderColor: 'rgba(56, 189, 248, 0.35)',
              background: 'rgba(56, 189, 248, 0.12)',
            }}
            onClick={() => onOpenModal('FUNCIONARIOS')}
          >
            Gerenciar Equipe
          </button>
        </aside>
      ) : (
        <button
          onClick={() => setPainelEquipeAberto(true)}
          className="hud-camera-btn"
          style={{
            padding: '7px 12px',
            fontSize: '0.78rem',
            background: 'linear-gradient(180deg, rgba(14, 22, 42, 0.9) 0%, rgba(9, 14, 28, 0.95) 100%)',
            borderColor: 'rgba(56, 189, 248, 0.35)',
          }}
          title="Expandir painel de funcionários"
        >
          👥 Equipe ({estado.funcionarios.length}) ▶
        </button>
      )}

        <button
          onClick={onToggleHud}
          className="hud-camera-btn"
          style={{
            padding: '7px 12px',
            fontSize: '0.78rem',
            background: 'linear-gradient(180deg, rgba(14, 22, 42, 0.9) 0%, rgba(9, 14, 28, 0.95) 100%)',
            borderColor: 'rgba(56, 189, 248, 0.35)',
          }}
          title="Ocultar todos os painéis do HUD para visualizar melhor o mapa (atalho: H)"
          aria-label="Ocultar HUD"
        >
          👁️ Ocultar HUD ◀
        </button>
      </div>

      {/* CANTO INFERIOR ESQUERDO: Card MISSÃO ATUAL (HD Glassmorphism) */}
      {painelMissaoAberto ? (
        <aside
          className="hud-panel-hd"
          style={{
            position: 'fixed',
            bottom: 14,
            left: 14,
            zIndex: 25,
            width: 256,
            padding: '12px 14px',
            borderColor: 'rgba(250, 204, 21, 0.35)',
          }}
          aria-label="Missão Atual"
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontSize: '0.78rem',
                fontWeight: 800,
                color: '#facc15',
                letterSpacing: '0.04em',
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              <span>★</span>
              <span>MISSÃO ATUAL</span>
            </div>
            <button
              onClick={() => setPainelMissaoAberto(false)}
              className="hud-camera-btn"
              style={{ padding: '2px 6px', fontSize: '0.64rem' }}
              title="Recolher missão"
            >
              ▼
            </button>
          </div>
          <div
            onClick={() => onOpenModal('CONQUISTAS')}
            style={{ cursor: 'pointer', marginTop: 6 }}
          >
            <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#f8fafc' }}>
              Realize {missaoMeta} sessões na LAN House
            </div>
            <div style={{ fontSize: '0.73rem', color: '#94a3b8', marginTop: 2 }}>
              Inicie e encerre sessões para elevar sua reputação.
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 8,
              }}
            >
              <div
                style={{
                  flex: 1,
                  height: 7,
                  background: 'rgba(15, 23, 42, 0.8)',
                  border: '1px solid rgba(56, 189, 248, 0.25)',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${(missaoProgresso / missaoMeta) * 100}%`,
                    height: '100%',
                    background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
                    boxShadow: '0 0 8px rgba(56, 189, 248, 0.6)',
                  }}
                />
              </div>
              <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#38bdf8' }}>
                {missaoProgresso}/{missaoMeta}
              </span>
            </div>
            <div style={{ fontSize: '0.73rem', color: '#4ade80', fontWeight: 700, marginTop: 5 }}>
              🎁 Recompensa: XP 400 • R$ 1.500,00
            </div>
          </div>
        </aside>
      ) : (
        <button
          onClick={() => setPainelMissaoAberto(true)}
          className="hud-camera-btn"
          style={{
            position: 'fixed',
            bottom: 14,
            left: 14,
            zIndex: 25,
            padding: '7px 12px',
            fontSize: '0.78rem',
            background: 'linear-gradient(180deg, rgba(14, 22, 42, 0.9) 0%, rgba(9, 14, 28, 0.95) 100%)',
            borderColor: 'rgba(250, 204, 21, 0.4)',
            color: '#facc15',
          }}
          title="Expandir missão atual"
        >
          ★ Missão ({missaoProgresso}/{missaoMeta}) ▲
        </button>
      )}

      {/* TOPO DIREITO: Relógio, Clima & Pill de Caixa (HD Glassmorphism) */}
      <div
        style={{
          position: 'fixed',
          top: 14,
          right: 14,
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 7,
        }}
      >
        {/* Linha 1: Clima + Relógio + Saldo de Dinheiro */}
        <div style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
          {/* Pill Clima */}
          <div
            className="hud-panel-hd"
            style={{
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontSize: '0.84rem',
              fontWeight: 700,
              color: '#facc15',
              borderRadius: 14,
            }}
          >
            <span>☀️</span>
            <span>29°C</span>
          </div>

          {/* Pill Relógio e Dia */}
          <div
            className="hud-panel-hd"
            style={{
              padding: '6px 12px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              borderRadius: 14,
            }}
          >
            <span style={{ fontSize: '0.92rem' }}>🕒</span>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#f8fafc' }}>
                {horaStr}
              </span>
              <span style={{ fontSize: '0.64rem', color: '#94a3b8', textTransform: 'capitalize' }}>
                {dataCurta}
              </span>
            </div>
          </div>

          {/* Pill de Saldo em Dinheiro (Destaque Verde Neon HD) */}
          <div
            className="hud-panel-hd"
            onClick={() => onOpenModal('CLIENTES')}
            style={{
              padding: '6px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              cursor: 'pointer',
              background: 'linear-gradient(180deg, rgba(20, 83, 45, 0.9) 0%, rgba(6, 44, 20, 0.95) 100%)',
              borderColor: '#22c55e',
              boxShadow: '0 0 16px rgba(34, 197, 94, 0.35)',
              borderRadius: 14,
              transition: 'transform 0.15s ease',
            }}
            title="Caixa da Lan House (clique para abrir Clientes & Pagamentos)"
          >
            <span style={{ fontSize: '1.05rem' }}>💵</span>
            <span
              style={{
                fontSize: '0.96rem',
                fontWeight: 800,
                color: '#4ade80',
                letterSpacing: '0.02em',
                textShadow: '0 0 8px rgba(74, 222, 128, 0.6)',
              }}
            >
              +{formatarMoeda(estado.caixaSaldo)}
            </span>
          </div>
        </div>

        {/* Linha 2: Controles de Velocidade & Acesso ao Estoque */}
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          <div
            className="hud-panel-hd"
            style={{
              padding: '4px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              borderRadius: 12,
            }}
          >
            {([0, 1, 3, 8] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => onSetSpeed(spd)}
                className="pixel-btn"
                style={{
                  padding: '3px 6px',
                  fontSize: '0.7rem',
                  borderColor:
                    estado.configuracoes.velocidadeSimulacao === spd
                      ? '#38bdf8'
                      : '#364e7c',
                  background:
                    estado.configuracoes.velocidadeSimulacao === spd
                      ? '#0369a1'
                      : '#17233e',
                }}
                title={spd === 0 ? 'Pausar relógio' : `Velocidade ${spd}x`}
              >
                {spd === 0 ? '⏸' : `${spd}x`}
              </button>
            ))}
            <button
              onClick={() => onAdvanceMinutes(15)}
              className="pixel-btn warning"
              style={{ padding: '3px 6px', fontSize: '0.7rem' }}
              title="Avança +15 minutos (testar sessões)"
            >
              +15m
            </button>
          </div>

          <button
            onClick={() => onOpenModal(modalAtivo === 'ESTACIONAMENTO' ? null : 'ESTACIONAMENTO')}
            className="pixel-btn"
            style={{
              padding: '4px 8px',
              fontSize: '0.72rem',
              background:
                modalAtivo === 'ESTACIONAMENTO'
                  ? 'rgba(21, 128, 61, 0.92)'
                  : 'rgba(15, 23, 42, 0.88)',
              borderColor: resumoEstac.vagasLivres > 0 ? '#22c55e' : '#ef4444',
            }}
            title="Painel do Estacionamento Pago, Vagas V01-V08 e Cancelas"
          >
            🅿️ {resumoEstac.vagasLivres}/{resumoEstac.totalVagas}
          </button>

          <button
            onClick={() => setPainelEstoqueAberto(!painelEstoqueAberto)}
            className="pixel-btn"
            style={{
              padding: '4px 8px',
              fontSize: '0.72rem',
              background: painelEstoqueAberto ? 'rgba(14, 116, 144, 0.9)' : 'rgba(15, 23, 42, 0.88)',
              borderColor: painelEstoqueAberto ? '#38bdf8' : '#334155',
            }}
          >
            📦 Estoque {painelEstoqueAberto ? '▲' : '▼'}
          </button>
        </div>

        {/* Mini-Painel de Estoque (recolhível) */}
        {painelEstoqueAberto && (
          <div
            className="pixel-hud-card"
            onClick={() => onOpenModal('LOJA')}
            style={{
              width: 220,
              padding: '8px 12px',
              cursor: 'pointer',
              borderRight: '3px solid #f97316',
            }}
          >
            <div
              style={{
                fontSize: '0.76rem',
                fontWeight: 700,
                color: '#cbd5e1',
                borderBottom: '1px solid #2b3f66',
                paddingBottom: 4,
                marginBottom: 5,
                letterSpacing: '0.05em',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <span>ESTOQUE & VENDAS</span>
              <span style={{ color: '#38bdf8', fontSize: '0.68rem' }}>Ver Loja</span>
            </div>
            {estado.produtos.slice(0, 4).map((p) => (
              <div
                key={p.id}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: '0.74rem',
                  padding: '2px 0',
                }}
              >
                <span style={{ color: '#94a3b8' }}>• {p.nome.split(' ')[0]}:</span>
                <span
                  style={{
                    fontWeight: 700,
                    color: p.estoque <= 10 ? '#f87171' : '#4ade80',
                  }}
                >
                  {p.estoque} un ({formatarMoeda(p.preco)})
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* DOCK INFERIOR CENTRAL (HD GLASSMORPHISM GAMER BAR) */}
      <nav className="hud-dock" aria-label="Menu Principal da LAN House">
        {[
          {
            id: 'COMPUTADORES' as ModalAtivo,
            label: 'Computadores',
            icon: <HdIconPc size={24} />,
            badge: `${pcsLivres}/${estado.computadores.length}`,
            badgeColor: '#22c55e',
            tecla: '1',
          },
          {
            id: 'CLIENTES' as ModalAtivo,
            label: 'Caixa PIX',
            icon: <HdIconPix size={24} />,
            badge: pagsPendentes > 0 ? `${pagsPendentes}` : undefined,
            badgeColor: '#f59e0b',
            tecla: '2',
          },
          {
            id: 'LOJA' as ModalAtivo,
            label: 'Loja',
            icon: <HdIconStore size={24} />,
            badge: '↑',
            badgeColor: '#22c55e',
            tecla: '3',
          },
          {
            id: 'MELHORIAS' as ModalAtivo,
            label: 'Melhorias',
            icon: <HdIconUpgrades size={24} />,
            badge: '↑',
            badgeColor: '#22c55e',
            tecla: '4',
          },
          {
            id: 'ESTATISTICAS' as ModalAtivo,
            label: 'Estatísticas',
            icon: <HdIconStats size={24} />,
            tecla: '5',
          },
          {
            id: 'CONQUISTAS' as ModalAtivo,
            label: 'Conquistas',
            icon: <HdIconTrophy size={24} />,
            badge: lanHouseStore.obterConquistas().some((c) => c.atual >= c.meta && !c.resgatada) ? '!' : undefined,
            badgeColor: '#ef4444',
            tecla: '6',
          },
          {
            id: 'CONFIGURACOES' as ModalAtivo,
            label: 'Configurações',
            icon: <HdIconSettings size={24} />,
            tecla: '7',
          },
        ].map((item) => {
          const isAtivo = modalAtivo === item.id;
          return (
            <button
              key={item.id}
              className={`hud-dock-btn ${isAtivo ? 'ativo' : ''}`}
              onClick={() => onOpenModal(isAtivo ? null : item.id)}
              title={`${item.label} (Pressione ${item.tecla})`}
            >
              <span className="hud-dock-key">{item.tecla}</span>

              {item.badge && (
                <span
                  className={`hud-dock-badge ${item.id === 'CLIENTES' || item.id === 'CONQUISTAS' ? 'pulsa' : ''}`}
                  style={{ background: item.badgeColor || '#0ea5e9' }}
                >
                  {item.badge}
                </span>
              )}

              <span className="hud-dock-icon">{item.icon}</span>
              <span className="hud-dock-label">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* CANTO INFERIOR DIREITO: Badge Modo 24h & Feed de Auditoria POO (HD Glass) */}
      <aside className="hud-status-card" aria-label="Status do Sistema">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: '#38bdf8', boxShadow: '0 0 6px #38bdf8' }} />
            <span style={{ fontSize: '0.76rem', fontWeight: 700, color: '#38bdf8' }}>
              Modo 24h Ativo
            </span>
          </div>
          {ultimoLog?.regraRelacionada && (
            <span className="badge-pixel badge-poo" style={{ fontSize: '0.66rem', padding: '1px 6px' }}>
              {ultimoLog.regraRelacionada}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: '0.72rem',
            color: '#cbd5e1',
            marginTop: 4,
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {ultimoLog ? ultimoLog.descricao : 'Sua LAN House funciona dia e noite!'}
        </div>
      </aside>
    </>
  );
};
