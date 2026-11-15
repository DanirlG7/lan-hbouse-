import React, { useState } from 'react';
import { Conquista } from '../../domain/types';
import { formatarMoeda } from '../HudOverlay';

interface Props {
  conquistas: Conquista[];
  onClose: () => void;
  onResgatar: (id: string) => void;
  onResgatarTodas: () => void;
}

const nomeCat: Record<Conquista['categoria'], string> = {
  GERAL: '🎯 Geral',
  EXPANSAO: '🏗️ Expansão',
  FINANCEIRO: '💰 Financeiro',
  CLIENTES: '👥 Clientes',
  EQUIPAMENTOS: '🖥️ Equipamentos',
};

const corCat: Record<Conquista['categoria'], string> = {
  GERAL: '#38bdf8',
  EXPANSAO: '#c084fc',
  FINANCEIRO: '#facc15',
  CLIENTES: '#4ade80',
  EQUIPAMENTOS: '#fb923c',
};

type Filtro = 'TODAS' | Conquista['categoria'];
type Estado = 'TODAS' | 'PRONTAS' | 'ANDAMENTO' | 'RESGATADAS';

/**
 * Central de Conquistas em cards (estilo PlayStation/Xbox/Duolingo):
 * anel de progresso, selo de raridade por recompensa, animação ao resgatar.
 */
export const AchievementsModal: React.FC<Props> = ({ conquistas, onClose, onResgatar, onResgatarTodas }) => {
  const [cat, setCat] = useState<Filtro>('TODAS');
  const [estado, setEstado] = useState<Estado>('TODAS');
  const [animando, setAnimando] = useState<string | null>(null);

  const concluida = (c: Conquista) => c.atual >= c.meta;
  const prontas = conquistas.filter((c) => concluida(c) && !c.resgatada);
  const resgatadas = conquistas.filter((c) => c.resgatada);
  const desbloqueadas = conquistas.filter(concluida).length;
  const percTotal = Math.round((desbloqueadas / (conquistas.length || 1)) * 100);
  const xpGanho = resgatadas.reduce((a, c) => a + c.recompensaXp, 0);
  const dinheiroPendente = prontas.reduce((a, c) => a + c.recompensaDinheiro, 0);

  const filtradas = conquistas
    .filter((c) => {
      if (cat !== 'TODAS' && c.categoria !== cat) return false;
      if (estado === 'PRONTAS') return concluida(c) && !c.resgatada;
      if (estado === 'ANDAMENTO') return !concluida(c);
      if (estado === 'RESGATADAS') return c.resgatada;
      return true;
    })
    // prontas primeiro, depois em andamento (maior progresso), resgatadas por último
    .sort((a, b) => {
      const peso = (c: Conquista) => (concluida(c) && !c.resgatada ? 0 : c.resgatada ? 2 : 1);
      if (peso(a) !== peso(b)) return peso(a) - peso(b);
      return b.atual / b.meta - a.atual / a.meta;
    });

  const raridade = (c: Conquista) =>
    c.recompensaDinheiro >= 5000
      ? { nome: 'Lendária', cor: '#f59e0b' }
      : c.recompensaDinheiro >= 1000
      ? { nome: 'Épica', cor: '#c084fc' }
      : c.recompensaDinheiro >= 300
      ? { nome: 'Rara', cor: '#38bdf8' }
      : { nome: 'Comum', cor: '#94a3b8' };

  const resgatar = (id: string) => {
    setAnimando(id);
    onResgatar(id);
    window.setTimeout(() => setAnimando(null), 900);
  };

  const anel = (perc: number, cor: string, icone: string) => {
    const r = 24;
    const circ = 2 * Math.PI * r;
    return (
      <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0 }}>
        <svg width="60" height="60" viewBox="0 0 60 60" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="30" cy="30" r={r} fill="none" stroke="#1e293b" strokeWidth="5" />
          <circle
            cx="30"
            cy="30"
            r={r}
            fill="none"
            stroke={cor}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circ}
            strokeDashoffset={circ * (1 - perc / 100)}
            style={{ transition: 'stroke-dashoffset 0.5s ease' }}
          />
        </svg>
        <span
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.3rem',
          }}
        >
          {icone}
        </span>
      </div>
    );
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-window"
        style={{ width: 'min(1040px, 95vw)', maxHeight: '89vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pixel-modal-header">
          <div className="pixel-modal-title">
            <span>🏆 CENTRAL DE CONQUISTAS</span>
          </div>
          <span style={{ color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer' }} onClick={onClose}>
            ✕
          </span>
        </div>

        {/* Resumo de progresso geral */}
        <div
          style={{
            padding: '14px 18px',
            display: 'grid',
            gridTemplateColumns: '1.4fr 1fr 1fr 1fr',
            gap: 10,
            borderBottom: '1px solid #26385c',
            background: 'rgba(14, 21, 39, 0.65)',
          }}
        >
          <div className="pixel-subcard" style={{ padding: '10px 12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: '#94a3b8' }}>
              <span>Progresso geral</span>
              <strong style={{ color: '#7dd3fc' }}>
                {desbloqueadas}/{conquistas.length} ({percTotal}%)
              </strong>
            </div>
            <div style={{ height: 8, background: '#1e293b', borderRadius: 4, marginTop: 8, overflow: 'hidden' }}>
              <div
                style={{
                  width: `${percTotal}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #0ea5e9, #4ade80)',
                  transition: 'width 0.5s ease',
                }}
              />
            </div>
          </div>
          <div className="pixel-subcard" style={{ padding: '10px 12px', borderLeft: '3px solid #4ade80' }}>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Prontas p/ resgatar</div>
            <div style={{ fontWeight: 800, color: '#4ade80', fontSize: '1.05rem' }}>{prontas.length} 🎁</div>
          </div>
          <div className="pixel-subcard" style={{ padding: '10px 12px', borderLeft: '3px solid #facc15' }}>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>Prêmio pendente</div>
            <div style={{ fontWeight: 800, color: '#fde047', fontSize: '1.05rem' }}>
              {formatarMoeda(dinheiroPendente)}
            </div>
          </div>
          <div className="pixel-subcard" style={{ padding: '10px 12px', borderLeft: '3px solid #c084fc' }}>
            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>XP já conquistado</div>
            <div style={{ fontWeight: 800, color: '#d8b4fe', fontSize: '1.05rem' }}>{xpGanho} XP</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="pixel-tabs" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {(['TODAS', 'GERAL', 'EXPANSAO', 'FINANCEIRO', 'CLIENTES', 'EQUIPAMENTOS'] as const).map((c) => (
              <button
                key={c}
                className={`pixel-tab ${cat === c ? 'active' : ''}`}
                style={{ fontSize: '0.76rem', padding: '5px 10px' }}
                onClick={() => setCat(c)}
              >
                {c === 'TODAS' ? 'Todas' : nomeCat[c]}
              </button>
            ))}
          </div>
          <select
            className="pixel-select"
            style={{ padding: '5px 9px', fontSize: '0.8rem' }}
            value={estado}
            onChange={(e) => setEstado(e.target.value as Estado)}
          >
            <option value="TODAS">Todos os estados</option>
            <option value="PRONTAS">🎁 Prontas p/ resgatar</option>
            <option value="ANDAMENTO">⏳ Em andamento</option>
            <option value="RESGATADAS">✔ Resgatadas</option>
          </select>
        </div>

        {/* Cards */}
        <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1 }}>
          {filtradas.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 30 }}>Nenhuma conquista neste filtro.</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
              {filtradas.map((c) => {
                const perc = Math.min(100, Math.round((c.atual / c.meta) * 100));
                const pronta = concluida(c) && !c.resgatada;
                const rar = raridade(c);
                const cor = c.resgatada ? '#facc15' : pronta ? '#4ade80' : corCat[c.categoria];
                return (
                  <div
                    key={c.id}
                    className={`pixel-subcard ${animando === c.id ? 'conquista-resgatada' : ''} ${
                      pronta ? 'conquista-pronta' : ''
                    }`}
                    style={{
                      padding: 12,
                      borderRadius: 8,
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                      opacity: c.resgatada ? 0.72 : 1,
                      borderColor: pronta ? '#4ade80' : '#314770',
                    }}
                  >
                    {anel(perc, cor, c.resgatada ? '✔' : pronta ? '🏆' : '🔒')}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 6, alignItems: 'center' }}>
                        <strong style={{ color: '#f8fafc', fontSize: '0.92rem' }}>{c.titulo}</strong>
                        <span
                          style={{
                            fontSize: '0.64rem',
                            fontWeight: 700,
                            color: rar.cor,
                            border: `1px solid ${rar.cor}`,
                            borderRadius: 10,
                            padding: '1px 6px',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {rar.nome}
                        </span>
                      </div>
                      <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>{c.descricao}</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        {Math.min(c.atual, c.meta).toLocaleString('pt-BR')} / {c.meta.toLocaleString('pt-BR')} ({perc}%)
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 2 }}>
                        <span style={{ fontSize: '0.76rem', color: '#4ade80', fontWeight: 700 }}>
                          💵 {formatarMoeda(c.recompensaDinheiro)} · ⭐ {c.recompensaXp} XP
                        </span>
                        {c.resgatada ? (
                          <span style={{ fontSize: '0.76rem', color: '#fde047', fontWeight: 700 }}>Resgatada</span>
                        ) : pronta ? (
                          <button
                            className="pixel-btn success"
                            style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                            onClick={() => resgatar(c.id)}
                          >
                            Resgatar
                          </button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div
          style={{
            padding: '12px 18px',
            borderTop: '2px solid #283a5e',
            background: 'rgba(12, 19, 36, 0.9)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '0.86rem', color: '#94a3b8' }}>
            {prontas.length > 0
              ? `🎁 ${prontas.length} recompensa(s) esperando por você`
              : 'Continue jogando para desbloquear mais conquistas'}
          </div>
          <button
            className="pixel-btn primary"
            style={{ padding: '7px 14px', fontSize: '0.84rem', fontWeight: 600 }}
            disabled={prontas.length === 0}
            onClick={onResgatarTodas}
          >
            Resgatar Todas ({formatarMoeda(dinheiroPendente)})
          </button>
        </div>
      </div>
    </div>
  );
};
