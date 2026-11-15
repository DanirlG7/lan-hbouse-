import React from 'react';
import { MelhoriaEstabelecimento } from '../../domain/types';
import { formatarMoeda } from '../HudOverlay';
import { UpgradeIllustration, UpgradeHdCog } from '../UpgradeHdIcons';

interface Props {
  melhorias: MelhoriaEstabelecimento[];
  computadoresCount?: number;
  onClose: () => void;
  onEvoluirOuAlternar: (id: string) => void;
}

/**
 * Modal de Melhorias & Infraestrutura do Estabelecimento (RN10)
 * Redesenhado com estética HD, slim, clean e moderna:
 * - Ícones vetoriais em alta resolução com iluminação volumétrica.
 * - Cards com microbarras de nível e gradientes suaves.
 * - Switches modernos (estilo iOS/Cyber) para ativação de serviços.
 */
export const UpgradesEstablishmentModal: React.FC<Props> = ({
  melhorias,
  computadoresCount = 24,
  onClose,
  onEvoluirOuAlternar,
}) => {
  const infra = melhorias.filter((m) => m.grupo === 'INFRAESTRUTURA');
  const equip = melhorias.filter((m) => m.grupo === 'EQUIPAMENTOS');
  const servicos = melhorias.filter((m) => m.grupo === 'SERVICOS');

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-window"
        style={{
          width: 'min(980px, 96vw)',
          maxHeight: '89vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #0e172a 0%, #070d1e 100%)',
          border: '1px solid #334e7a',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.75), 0 0 1px 1px rgba(56, 189, 248, 0.2)',
          borderRadius: 12,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* CABEÇALHO MODERNO HD */}
        <div
          style={{
            padding: '14px 22px',
            background: 'linear-gradient(90deg, #0f1c3f 0%, #172554 50%, #0f1c3f 100%)',
            borderBottom: '1px solid rgba(56, 189, 248, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 9,
                background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.25) 0%, rgba(37, 99, 235, 0.35) 100%)',
                border: '1px solid #38bdf8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(56, 189, 248, 0.3)',
              }}
            >
              <UpgradeHdCog size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
                  MELHORIAS & INFRAESTRUTURA DO ESTABELECIMENTO
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                  }}
                >
                  REGRA DE NEGÓCIO RN10
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 1 }}>
                Evolua infraestrutura, climatização e as {computadoresCount}/24 estações do mapa + 8 vagas do estacionamento
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              width: 32,
              height: 32,
              borderRadius: 6,
              border: '1px solid #334e7a',
              background: 'rgba(30, 41, 59, 0.6)',
              color: '#cbd5e1',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.05rem',
              fontWeight: 700,
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)')}
          >
            ✕
          </button>
        </div>

        {/* CORPO DO MODAL */}
        <div style={{ padding: '18px 22px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* SEÇÃO 1: INFRAESTRUTURA */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '1rem' }}>⚡</span>
                <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
                  INFRAESTRUTURA DA LAN HOUSE
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Estabilidade de energia, CFTV 24h e climatização dos servidores
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {infra.map((m, idx) => {
                const isMax = m.nivel >= m.nivelMax;
                const pct = Math.round((m.nivel / m.nivelMax) * 100);
                return (
                  <div
                    key={m.id}
                    onClick={() => onEvoluirOuAlternar(m.id)}
                    style={{
                      background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.85) 0%, rgba(13, 20, 38, 0.95) 100%)',
                      borderRadius: 10,
                      border: idx === 0 ? '1px solid #38bdf8' : '1px solid #25375c',
                      boxShadow: idx === 0 ? '0 0 16px rgba(56, 189, 248, 0.2)' : '0 4px 12px rgba(0, 0, 0, 0.3)',
                      padding: '16px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      transition: 'all 0.15s ease',
                      position: 'relative',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38bdf8')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = idx === 0 ? '#38bdf8' : '#25375c')}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                      {/* Círculo do Ícone HD */}
                      <div
                        style={{
                          width: 72,
                          height: 72,
                          borderRadius: '50%',
                          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.18) 0%, rgba(15, 23, 42, 0.8) 75%)',
                          border: '1px solid rgba(56, 189, 248, 0.25)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 10,
                        }}
                      >
                        <UpgradeIllustration icone={m.icone} size={50} />
                      </div>

                      <div style={{ fontWeight: 800, fontSize: '0.94rem', color: '#f8fafc', marginBottom: 2 }}>
                        {m.nome}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                        <span style={{ fontSize: '0.74rem', color: '#38bdf8', fontWeight: 700 }}>
                          Nível {m.nivel} de {m.nivelMax}
                        </span>
                        <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>•</span>
                        <span style={{ fontSize: '0.72rem', color: isMax ? '#4ade80' : '#facc15', fontWeight: 700 }}>
                          {pct}%
                        </span>
                      </div>

                      {/* Micro barra de nível moderna */}
                      <div style={{ width: '100%', height: 5, background: '#1e293b', borderRadius: 3, overflow: 'hidden', marginBottom: 10 }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: isMax ? 'linear-gradient(90deg, #10b981, #4ade80)' : 'linear-gradient(90deg, #0284c7, #38bdf8)',
                            borderRadius: 3,
                          }}
                        />
                      </div>

                      <div style={{ fontSize: '0.76rem', color: '#cbd5e1', lineHeight: 1.4, minHeight: 38, marginBottom: 12 }}>
                        {m.beneficio}
                      </div>
                    </div>

                    <button
                      className={`pixel-btn ${isMax ? 'success' : 'primary'}`}
                      style={{
                        width: '100%',
                        padding: '9px 12px',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        borderRadius: 6,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                      }}
                    >
                      {isMax ? (
                        <>✓ Nível Máximo</>
                      ) : (
                        <>⬆ Evoluir: {formatarMoeda(m.custoProximo)}</>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 2: EQUIPAMENTOS */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '1rem' }}>🖥️</span>
                <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
                  EQUIPAMENTOS & BANCADAS
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Monitores eSports 360Hz, bancadas gamer, consoles e impressoras
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {equip.map((m) => {
                const isMax = m.nivel >= m.nivelMax;
                const pct = Math.round((m.nivel / m.nivelMax) * 100);
                return (
                  <div
                    key={m.id}
                    onClick={() => onEvoluirOuAlternar(m.id)}
                    style={{
                      background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.85) 0%, rgba(13, 20, 38, 0.95) 100%)',
                      borderRadius: 10,
                      border: '1px solid #25375c',
                      padding: '14px',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      textAlign: 'center',
                      transition: 'all 0.15s ease',
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#38bdf8')}
                    onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#25375c')}
                  >
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: 60,
                          height: 60,
                          borderRadius: '50%',
                          background: 'radial-gradient(circle, rgba(56, 189, 248, 0.15) 0%, rgba(15, 23, 42, 0.8) 75%)',
                          border: '1px solid rgba(56, 189, 248, 0.2)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          marginBottom: 8,
                        }}
                      >
                        <UpgradeIllustration icone={m.icone} size={42} />
                      </div>

                      <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#f8fafc', marginBottom: 3 }}>
                        {m.nome}
                      </div>

                      <div style={{ fontSize: '0.72rem', color: isMax ? '#4ade80' : '#facc15', fontWeight: 700, marginBottom: 6 }}>
                        Lv. {m.nivel}/{m.nivelMax} ({pct}%)
                      </div>

                      {/* Barra de progresso */}
                      <div style={{ width: '100%', height: 4, background: '#1e293b', borderRadius: 2, overflow: 'hidden', marginBottom: 8 }}>
                        <div
                          style={{
                            width: `${pct}%`,
                            height: '100%',
                            background: isMax ? '#10b981' : '#facc15',
                            borderRadius: 2,
                          }}
                        />
                      </div>
                    </div>

                    <button
                      className={`pixel-btn ${isMax ? '' : 'primary'}`}
                      style={{
                        width: '100%',
                        fontSize: '0.74rem',
                        padding: '6px 8px',
                        fontWeight: 700,
                        borderRadius: 6,
                        background: isMax ? 'rgba(30, 41, 59, 0.8)' : undefined,
                        borderColor: isMax ? '#334e7a' : undefined,
                        color: isMax ? '#94a3b8' : undefined,
                      }}
                    >
                      {isMax ? '✓ Máximo' : `Evoluir: ${formatarMoeda(m.custoProximo)}`}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* SEÇÃO 3: SERVIÇOS ATIVOS COM SWITCHES SLIM CYBER */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: '1rem' }}>⚙️</span>
                <span style={{ fontSize: '0.94rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
                  SERVIÇOS ATIVOS DO ESTABELECIMENTO
                </span>
              </div>
              <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                Alterne os módulos operacionais com um clique
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {servicos.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onEvoluirOuAlternar(s.id)}
                  style={{
                    background: s.ativo
                      ? 'linear-gradient(90deg, rgba(6, 78, 59, 0.35) 0%, rgba(15, 23, 42, 0.85) 100%)'
                      : 'rgba(15, 23, 42, 0.75)',
                    border: `1px solid ${s.ativo ? '#10b981' : '#25375c'}`,
                    boxShadow: s.ativo ? '0 0 12px rgba(16, 185, 129, 0.2)' : 'none',
                    borderRadius: 10,
                    padding: '12px 16px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div style={{ flex: 1, marginRight: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                        {s.nome}
                      </span>
                      <span
                        style={{
                          fontSize: '0.62rem',
                          fontWeight: 800,
                          padding: '1px 6px',
                          borderRadius: 8,
                          background: s.ativo ? 'rgba(16, 185, 129, 0.2)' : 'rgba(148, 163, 184, 0.15)',
                          color: s.ativo ? '#34d399' : '#94a3b8',
                        }}
                      >
                        {s.ativo ? 'ATIVO' : 'DESLIGADO'}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.73rem', color: '#94a3b8' }}>{s.beneficio}</div>
                  </div>

                  {/* Switch Slim iOS / Cyber */}
                  <div
                    style={{
                      width: 50,
                      height: 26,
                      background: s.ativo ? '#10b981' : '#1e293b',
                      borderRadius: 13,
                      position: 'relative',
                      transition: 'background 0.2s ease',
                      border: `1px solid ${s.ativo ? '#34d399' : '#475569'}`,
                      boxShadow: s.ativo ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        position: 'absolute',
                        top: 2,
                        left: s.ativo ? 26 : 3,
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        background: '#ffffff',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.35)',
                        transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RODAPÉ DO MODAL */}
        <div
          style={{
            padding: '12px 22px',
            borderTop: '1px solid #1e2c4a',
            background: 'rgba(10, 16, 32, 0.95)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
            💡 <strong style={{ color: '#f8fafc' }}>Dica:</strong> Manter a infraestrutura climatizada reduz em até 40% o tempo de manutenção dos PCs.
          </div>
          <button
            className="pixel-btn"
            style={{ padding: '8px 20px', fontSize: '0.84rem' }}
            onClick={onClose}
          >
            Fechar Janela
          </button>
        </div>
      </div>
    </div>
  );
};
