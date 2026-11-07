import React, { useState } from 'react';
import { Conquista } from '../../domain/types';
import { formatarMoeda } from '../HudOverlay';
import { SegmentedBar } from '../SegmentedBar';

interface Props {
  conquistas: Conquista[];
  onClose: () => void;
  onResgatar: (id: string) => void;
  onResgatarTodas: () => void;
}

/**
 * Fiel à Imagem 3: [X] SISTEMA DE CONQUISTAS com barras segmentadas pixeladas!
 */
export const AchievementsModal: React.FC<Props> = ({
  conquistas,
  onClose,
  onResgatar,
  onResgatarTodas,
}) => {
  const [aba, setAba] = useState<'TODAS' | Conquista['categoria']>('TODAS');
  const [apenasPendentes, setApenasPendentes] = useState(false);

  const filtradas = conquistas.filter((c) => {
    if (aba !== 'TODAS' && c.categoria !== aba) return false;
    if (apenasPendentes && c.resgatada) return false;
    return true;
  });

  const desbloqueadasCount = conquistas.filter((c) => c.atual >= c.meta).length;
  const percTotal = Math.round((desbloqueadasCount / conquistas.length) * 100);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-window"
        style={{ width: 'min(960px, 95vw)', maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pixel-modal-header">
          <div className="pixel-modal-title">
            <span className="pixel-close-bracket" onClick={onClose}>
              [ X ]
            </span>
            <span>SISTEMA DE CONQUISTAS</span>
          </div>
          <span style={{ color: '#94a3b8', cursor: 'pointer' }} onClick={onClose}>
            ✕
          </span>
        </div>

        <div className="pixel-tabs">
          {(['TODAS', 'GERAL', 'EXPANSAO', 'FINANCEIRO', 'CLIENTES', 'EQUIPAMENTOS'] as const).map(
            (cat) => (
              <button
                key={cat}
                className={`pixel-tab ${aba === cat ? 'active' : ''}`}
                onClick={() => setAba(cat)}
              >
                [{aba === cat ? 'V' : ' '}] {cat === 'EXPANSAO' ? 'EXPANSÃO' : cat}
              </button>
            )
          )}
        </div>

        <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1 }}>
          <table className="pixel-table">
            <thead>
              <tr>
                <th>CONQUISTA</th>
                <th>DESCRIÇÃO DA TAREFA</th>
                <th>PROGRESSO</th>
                <th>STATUS / RECOMPENSA</th>
              </tr>
            </thead>
            <tbody>
              {filtradas.map((c) => {
                const perc = Math.min(100, Math.round((c.atual / c.meta) * 100));
                const concluida = perc >= 100;
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <span
                          style={{
                            width: 34,
                            height: 34,
                            borderRadius: 4,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: concluida
                              ? 'rgba(34, 197, 94, 0.2)'
                              : 'rgba(250, 204, 21, 0.14)',
                            border: `1px solid ${concluida ? '#4ade80' : '#facc15'}`,
                            fontSize: '1.1rem',
                          }}
                        >
                          {c.resgatada ? '✔' : concluida ? '🏆' : '🔒'}
                        </span>
                        <strong style={{ color: '#f8fafc' }}>{c.titulo}</strong>
                      </div>
                    </td>
                    <td style={{ color: '#cbd5e1', fontSize: '0.84rem' }}>{c.descricao}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <SegmentedBar
                          percent={perc}
                          cells={14}
                          color={concluida ? 'green' : 'cyan'}
                        />
                        <span
                          style={{
                            fontWeight: 700,
                            fontSize: '0.84rem',
                            color: concluida ? '#4ade80' : '#7dd3fc',
                          }}
                        >
                          {perc}%
                        </span>
                      </div>
                    </td>
                    <td>
                      {c.resgatada ? (
                        <span style={{ color: '#fde047', fontWeight: 700, fontSize: '0.82rem' }}>
                          ✔ Concluída (Resg.)
                        </span>
                      ) : concluida ? (
                        <button
                          className="pixel-btn success"
                          style={{ padding: '5px 10px', fontSize: '0.76rem' }}
                          onClick={() => onResgatar(c.id)}
                        >
                          [ Resgatar {formatarMoeda(c.recompensaDinheiro)} ]
                        </button>
                      ) : (
                        <span style={{ color: '#4ade80', fontWeight: 700, fontSize: '0.82rem' }}>
                          💵 {formatarMoeda(c.recompensaDinheiro)} + {c.recompensaXp} XP
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Rodapé fiel à Imagem 3 */}
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
          <div style={{ fontSize: '0.88rem', color: '#7dd3fc', fontWeight: 700 }}>
            📊 Conquistas Desbloqueadas: {desbloqueadasCount} / {conquistas.length} ({percTotal}%)
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="pixel-btn"
              onClick={() => setApenasPendentes(!apenasPendentes)}
            >
              [ {apenasPendentes ? 'Mostrar Todas' : 'Filtrar Pendentes'} ]
            </button>
            <button className="pixel-btn primary" onClick={onResgatarTodas}>
              [ Resgatar Todos ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
