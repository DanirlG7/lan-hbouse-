import React, { useState } from 'react';
import { ConfiguracoesJogo } from '../../domain/types';
import { SegmentedBar } from '../SegmentedBar';

interface Props {
  configuracoes: ConfiguracoesJogo;
  onClose: () => void;
  onSaveConfig: (cfg: Partial<ConfiguracoesJogo>) => void;
  onExportSave: () => void;
  onImportSave: (json: string) => void;
  onResetSave: () => void;
}

type CategoriaConfig =
  | 'AUDIO'
  | 'JOGABILIDADE'
  | 'INTERFACE'
  | 'DADOS'
  | 'POO_CHECKLIST';

/**
 * Fiel à Imagem 4: [X] CONFIGURAÇÕES (menu lateral esquerdo + barras segmentadas pixel + RNF06 + Checklist Acadêmico!)
 */
export const SettingsModal: React.FC<Props> = ({
  configuracoes,
  onClose,
  onSaveConfig,
  onExportSave,
  onImportSave,
  onResetSave,
}) => {
  const [secao, setSecao] = useState<CategoriaConfig>('AUDIO');
  const [localCfg, setLocalCfg] = useState<ConfiguracoesJogo>({ ...configuracoes });

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        onImportSave(reader.result);
      }
    };
    reader.readAsText(file);
  };

  const renderSliderPixel = (
    titulo: string,
    descricao: string,
    valor: number,
    onChange: (v: number) => void
  ) => (
    <div style={{ paddingBottom: 14, borderBottom: '1px solid #233559' }}>
      <div style={{ fontWeight: 700, fontSize: '0.96rem', color: '#f8fafc', marginBottom: 6 }}>
        {titulo}
      </div>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 12, cursor: 'pointer' }}
        onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const perc = Math.round(
            Math.max(0, Math.min(100, ((e.clientX - rect.left) / (rect.width - 55)) * 100))
          );
          onChange(perc);
        }}
      >
        <SegmentedBar percent={valor} cells={36} color="cyan" />
        <span style={{ fontWeight: 700, color: '#4ade80', minWidth: 42 }}>
          {valor}%
        </span>
      </div>
      <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: 5 }}>{descricao}</div>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-window"
        style={{ width: 'min(920px, 95vw)', maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pixel-modal-header">
          <div className="pixel-modal-title">
            <span className="pixel-close-bracket" onClick={onClose}>
              [ X ]
            </span>
            <span>CONFIGURAÇÕES</span>
          </div>
          <span style={{ color: '#94a3b8', cursor: 'pointer' }} onClick={onClose}>
            ✕
          </span>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '220px 1fr',
            flex: 1,
            overflow: 'hidden',
          }}
        >
          {/* Menu Lateral Esquerdo fiel à Imagem 4 */}
          <div
            style={{
              borderRight: '1px solid #293d66',
              padding: 12,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
              background: 'rgba(13, 20, 38, 0.72)',
            }}
          >
            {[
              { id: 'AUDIO' as CategoriaConfig, label: '🔊 Áudio' },
              { id: 'JOGABILIDADE' as CategoriaConfig, label: '🎮 Jogabilidade & Sim.' },
              { id: 'INTERFACE' as CategoriaConfig, label: '🖥️ Gráficos & Interface' },
              { id: 'DADOS' as CategoriaConfig, label: '💾 Dados e Salv. (RNF06)' },
              { id: 'POO_CHECKLIST' as CategoriaConfig, label: '🎓 Requisitos POO (Faculdade)' },
            ].map((item) => {
              const ativo = secao === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setSecao(item.id)}
                  style={{
                    textAlign: 'left',
                    padding: '10px 12px',
                    background: ativo
                      ? 'linear-gradient(90deg, rgba(14,165,233,0.32), rgba(30,58,138,0.4))'
                      : 'transparent',
                    border: `1px solid ${ativo ? '#38bdf8' : 'transparent'}`,
                    borderRadius: 4,
                    color: ativo ? '#ffffff' : '#cbd5e1',
                    fontWeight: ativo ? 700 : 500,
                    fontSize: '0.86rem',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                  }}
                >
                  <span>{item.label}</span>
                  {ativo && <span style={{ color: '#38bdf8' }}>›</span>}
                </button>
              );
            })}
          </div>

          {/* Painel Direito */}
          <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
            {secao === 'AUDIO' && (
              <>
                {renderSliderPixel(
                  'Volume Principal',
                  'Volume principal para os efeitos 8-bit e trilha sonora geral do jogo.',
                  localCfg.volumePrincipal,
                  (v) => setLocalCfg({ ...localCfg, volumePrincipal: v })
                )}
                {renderSliderPixel(
                  'Volume de Efeitos',
                  'Volume de efeitos sonoros para interações, cliques, pagamentos e alertas de regra.',
                  localCfg.volumeEfeitos,
                  (v) => setLocalCfg({ ...localCfg, volumeEfeitos: v })
                )}
                {renderSliderPixel(
                  'Volume da Música',
                  'Volume da trilha sonora ambiente noturna do estabelecimento.',
                  localCfg.volumeMusica,
                  (v) => setLocalCfg({ ...localCfg, volumeMusica: v })
                )}

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 6,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>Ativar Vozes e Feedback Sonoro</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Ativar feedback auditivo para reações e confirmações de caixa.
                    </div>
                  </div>
                  <button
                    className={`pixel-btn ${localCfg.ativarVozes ? 'success' : ''}`}
                    onClick={() =>
                      setLocalCfg({ ...localCfg, ativarVozes: !localCfg.ativarVozes })
                    }
                  >
                    {localCfg.ativarVozes ? '● Ativado' : '○ Desativado'}
                  </button>
                </div>

                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    paddingTop: 6,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700 }}>Opção de Saída de Áudio</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Dispositivo de saída principal Web Audio API.
                    </div>
                  </div>
                  <span style={{ color: '#4ade80', fontWeight: 700 }}>
                    [ {localCfg.saidaAudio} ▾ ]
                  </span>
                </div>
              </>
            )}

            {secao === 'JOGABILIDADE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="pixel-subcard" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    Simulação Autônoma de Clientes (JogoLanHouse)
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginBottom: 10 }}>
                    Quando ativada, clientes virtuais chegam da rua e abrem/encerram sessões automaticamente conforme o relógio avança. Desative se quiser controlar 100% manualmente durante a apresentação!
                  </p>
                  <button
                    className={`pixel-btn ${localCfg.simulacaoAutomatica ? 'success' : ''}`}
                    onClick={() =>
                      setLocalCfg({
                        ...localCfg,
                        simulacaoAutomatica: !localCfg.simulacaoAutomatica,
                      })
                    }
                  >
                    {localCfg.simulacaoAutomatica
                      ? '[V] Simulação Automática Ativada'
                      : '[ ] Apenas Controle Manual'}
                  </button>
                </div>

                <div className="pixel-subcard" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, marginBottom: 4 }}>
                    Endpoint do Servidor Java Opcional
                  </div>
                  <input
                    className="pixel-input"
                    style={{ width: '100%', marginTop: 6 }}
                    value={localCfg.urlBackendJava}
                    onChange={(e) =>
                      setLocalCfg({ ...localCfg, urlBackendJava: e.target.value })
                    }
                  />
                </div>
              </div>
            )}

            {secao === 'INTERFACE' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="pixel-subcard" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Balões de Ação nos Personagens</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Mostra o que cada cliente ou funcionário está fazendo no mapa 2D.
                    </div>
                  </div>
                  <button
                    className={`pixel-btn ${localCfg.mostrarBaloesMapa ? 'primary' : ''}`}
                    onClick={() =>
                      setLocalCfg({
                        ...localCfg,
                        mostrarBaloesMapa: !localCfg.mostrarBaloesMapa,
                      })
                    }
                  >
                    {localCfg.mostrarBaloesMapa ? 'Visível' : 'Oculto'}
                  </button>
                </div>

                <div className="pixel-subcard" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontWeight: 700 }}>Grade Técnica de Tiles (32x32)</div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      Exibe a malha ortogonal sobre o cenário Pixel Art.
                    </div>
                  </div>
                  <button
                    className={`pixel-btn ${localCfg.mostrarGradePixel ? 'primary' : ''}`}
                    onClick={() =>
                      setLocalCfg({
                        ...localCfg,
                        mostrarGradePixel: !localCfg.mostrarGradePixel,
                      })
                    }
                  >
                    {localCfg.mostrarGradePixel ? 'Ativada' : 'Desativada'}
                  </button>
                </div>
              </div>
            )}

            {secao === 'DADOS' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div className="pixel-subcard" style={{ padding: 14 }}>
                  <h4 style={{ color: '#4ade80', marginBottom: 6 }}>
                    ✔ Persistência Automática Ativa (RNF06)
                  </h4>
                  <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.45 }}>
                    Todos os cadastros de clientes, computadores, sessões, pagamentos e funcionários permanecem gravados após fechar ou recarregar o navegador, atendendo integralmente ao requisito <strong>RNF06</strong>! Você também pode exportar ou importar o banco completo em JSON:
                  </p>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12, flexWrap: 'wrap' }}>
                    <button className="pixel-btn primary" onClick={onExportSave}>
                      [ 💾 Exportar Banco .JSON ]
                    </button>
                    <label className="pixel-btn" style={{ cursor: 'pointer' }}>
                      [ 📂 Importar Banco .JSON ]
                      <input
                        type="file"
                        accept=".json"
                        style={{ display: 'none' }}
                        onChange={handleFileImport}
                      />
                    </label>
                    <button className="pixel-btn danger" onClick={onResetSave}>
                      [ ↺ Restaurar Carga Inicial ]
                    </button>
                  </div>
                </div>
              </div>
            )}

            {secao === 'POO_CHECKLIST' && (
              <div style={{ fontSize: '0.82rem', lineHeight: 1.5, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div className="pixel-subcard" style={{ padding: 12 }}>
                  <strong style={{ color: '#38bdf8' }}>Roteiro Rápido para Apresentar ao Professor:</strong>
                  <ul style={{ paddingLeft: 18, marginTop: 6, color: '#cbd5e1' }}>
                    <li><strong>RF01/RF02/RF09:</strong> Abra <em>Clientes & Caixa</em> → cadastre um cliente, pesquise e veja o histórico.</li>
                    <li><strong>RF03/RF04/RN01/RN05:</strong> Abra <em>Computadores</em> → cadastre um PC, coloque um PC em manutenção e tente iniciar sessão nele (bloqueio RN05) ou num PC ocupado (bloqueio RN01).</li>
                    <li><strong>RF05/RF06/RF07:</strong> Inicie uma sessão num PC Livre, clique em <code>+15min</code> no relógio do topo direito para ver o cálculo automático por tarifa e encerre.</li>
                    <li><strong>RF08/RN06/RN08/Polimorfismo:</strong> Pague via <strong>PIX (5% OFF polimórfico)</strong> e tente pagar a mesma sessão 2 vezes (bloqueio RN08).</li>
                    <li><strong>RF10/RN09:</strong> Abra <em>Estatísticas → Relatório Financeiro</em> e mostre que só pagamentos confirmados entram no total.</li>
                    <li><strong>RF11/RF12/RN10/Herança:</strong> Clique em <em>[Trocar Login RF12]</em> no card superior esquerdo, mude para Recepcionista e tente alterar tarifa ou estornar (bloqueio de permissão POO!).</li>
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Rodapé fiel à Imagem 4 */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '2px solid #283a5e',
            background: 'rgba(12, 19, 36, 0.9)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <button
            className="pixel-btn"
            onClick={() =>
              setLocalCfg({
                ...localCfg,
                volumePrincipal: 75,
                volumeEfeitos: 60,
                volumeMusica: 80,
                ativarVozes: true,
              })
            }
          >
            [Restaurar Padrão]
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="pixel-btn" onClick={onClose}>
              Cancelar
            </button>
            <button
              className="pixel-btn primary"
              onClick={() => {
                onSaveConfig(localCfg);
                onClose();
              }}
            >
              Aplicar Alterações
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
