import React from 'react';
import { MelhoriaEstabelecimento } from '../../domain/types';
import { formatarMoeda } from '../HudOverlay';
import { PixelIcon } from '../PixelSprites';

interface Props {
  melhorias: MelhoriaEstabelecimento[];
  onClose: () => void;
  onEvoluirOuAlternar: (id: string) => void;
}

/**
 * Fiel à Imagem 15 (Esquerda): "Configurações / Melhorias do Estabelecimento"
 * com seções Infraestrutura, Equipamentos e Serviços (switches verdes)!
 */
export const UpgradesEstablishmentModal: React.FC<Props> = ({
  melhorias,
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
        style={{ width: 'min(920px, 95vw)', maxHeight: '87vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pixel-modal-header">
          <div className="pixel-modal-title">
            <PixelIcon name="settings" size={26} />
            <div>
              <div>MELHORIAS & INFRAESTRUTURA DO ESTABELECIMENTO</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 400 }}>
                Evolua instalações elétricas, climatização, segurança e serviços da LAN House (RN10)
              </div>
            </div>
          </div>
          <span style={{ color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }} onClick={onClose}>
            ✕
          </span>
        </div>

        <div style={{ padding: 18, overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* INFRAESTRUTURA */}
          <div>
            <h3 style={{ fontSize: '0.96rem', color: '#f8fafc', marginBottom: 10 }}>
              Infraestrutura
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {infra.map((m, idx) => (
                <div
                  key={m.id}
                  onClick={() => onEvoluirOuAlternar(m.id)}
                  className="pixel-subcard"
                  style={{
                    padding: 14,
                    cursor: 'pointer',
                    textAlign: 'center',
                    borderColor: idx === 0 ? '#38bdf8' : '#314770',
                    boxShadow: idx === 0 ? '0 0 14px rgba(56,189,248,0.25)' : undefined,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                    <PixelIcon name={m.icone} size={46} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#f8fafc' }}>
                    {m.nome}
                  </div>
                  <div style={{ fontSize: '0.74rem', color: '#7dd3fc', marginTop: 2 }}>
                    Nível {m.nivel} / {m.nivelMax}
                  </div>
                  <div style={{ fontSize: '0.73rem', color: '#94a3b8', margin: '6px 0 10px' }}>
                    {m.beneficio}
                  </div>
                  <button className="pixel-btn primary" style={{ width: '100%', fontSize: '0.76rem' }}>
                    {m.nivel >= m.nivelMax
                      ? '✔ Nível Máximo'
                      : `[ Evoluir: ${formatarMoeda(m.custoProximo)} ]`}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* EQUIPAMENTOS */}
          <div>
            <h3 style={{ fontSize: '0.96rem', color: '#f8fafc', marginBottom: 10 }}>
              Equipamentos
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
              {equip.map((m) => (
                <div
                  key={m.id}
                  onClick={() => onEvoluirOuAlternar(m.id)}
                  className="pixel-subcard"
                  style={{ padding: 12, cursor: 'pointer', textAlign: 'center' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 6 }}>
                    <PixelIcon name={m.icone} size={38} />
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.84rem' }}>{m.nome}</div>
                  <div style={{ fontSize: '0.72rem', color: '#facc15', margin: '3px 0 8px' }}>
                    Lv. {m.nivel}/{m.nivelMax}
                  </div>
                  <button className="pixel-btn" style={{ width: '100%', fontSize: '0.72rem', padding: '5px 6px' }}>
                    {m.nivel >= m.nivelMax ? 'Máximo' : formatarMoeda(m.custoProximo)}
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* SERVIÇOS (Toggles Verdes iguais à Imagem 15!) */}
          <div>
            <h3 style={{ fontSize: '0.96rem', color: '#f8fafc', marginBottom: 10 }}>
              Serviços Ativos
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              {servicos.map((s) => (
                <div
                  key={s.id}
                  onClick={() => onEvoluirOuAlternar(s.id)}
                  className="pixel-subcard"
                  style={{
                    padding: '11px 14px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#f8fafc' }}>
                      {s.nome}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>{s.beneficio}</div>
                  </div>
                  {/* Switch Pixel Verde */}
                  <div
                    style={{
                      width: 48,
                      height: 22,
                      background: s.ativo ? '#16a34a' : '#1e293b',
                      border: `1px solid ${s.ativo ? '#4ade80' : '#475569'}`,
                      borderRadius: 4,
                      padding: 2,
                      display: 'flex',
                      justifyContent: s.ativo ? 'flex-end' : 'flex-start',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 16,
                        background: s.ativo ? '#bbf7d0' : '#94a3b8',
                        borderRadius: 2,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
