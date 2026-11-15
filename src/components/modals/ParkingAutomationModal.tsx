import React, { useEffect, useState } from 'react';
import { EstadoEstacionamento, Funcionario } from '../../domain/types';
import { FABRICA_CARGOS } from '../../domain/LanHouseEngine';
import { acionarCancelaManual, obterResumoEstacionamento, ResumoEstacionamento } from '../../world/parking';
import { formatarMoeda } from '../HudOverlay';
import { UpgradeHdParking } from '../UpgradeHdIcons';
import { PixelAvatar } from '../PixelSprites';

interface Props {
  estacionamento: EstadoEstacionamento;
  funcionarios: Funcionario[];
  servicoPagoAtivo: boolean;
  onAlterarTarifa: (valor: number) => void;
  onAlternarServicoPago: () => void;
  onAbrirStaff: () => void;
  onClose: () => void;
}

const FASE_LABEL: Record<string, string> = {
  INBOUND_AVENUE: 'Na rampa de entrada',
  AT_ENTRY_GATE: 'Emitindo ticket na cancela',
  DRIVE_TO_VAGA: 'Indo até a vaga',
  MANEUVER_IN: 'Estacionando',
  PARKED: 'Estacionado',
  MANEUVER_OUT: 'Saindo da vaga',
  DRIVE_TO_EXIT_GATE: 'Indo para a guarita',
  AT_EXIT_GATE: 'Pagando saída',
  OUTBOUND_AVENUE: 'Saindo p/ avenida',
};

export const ParkingAutomationModal: React.FC<Props> = ({
  estacionamento,
  funcionarios,
  servicoPagoAtivo,
  onAlterarTarifa,
  onAlternarServicoPago,
  onAbrirStaff,
  onClose,
}) => {
  const [resumo, setResumo] = useState<ResumoEstacionamento>(() => obterResumoEstacionamento());

  useEffect(() => {
    const id = window.setInterval(() => {
      setResumo(obterResumoEstacionamento());
    }, 220);
    return () => window.clearInterval(id);
  }, []);

  const equipePatio = funcionarios.filter(
    (f) => f.cargo === 'PORTEIRO_ESTACIONAMENTO' || f.cargo === 'GUARDA_PATIO'
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-window"
        style={{
          width: 'min(980px, 96vw)',
          maxHeight: '90vh',
          display: 'flex',
          flexDirection: 'column',
          background: 'linear-gradient(180deg, #0e172a 0%, #070d1e 100%)',
          border: '1px solid #334e7a',
          borderRadius: 12,
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
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
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'rgba(34, 197, 94, 0.14)',
                border: '1px solid rgba(74, 222, 128, 0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <UpgradeHdParking size={28} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc' }}>
                  ESTACIONAMENTO AUTOMATIZADO &amp; PORTARIA
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 10,
                    background: resumo.vagasLivres > 0 ? 'rgba(34, 197, 94, 0.18)' : 'rgba(239, 68, 68, 0.22)',
                    color: resumo.vagasLivres > 0 ? '#4ade80' : '#f87171',
                    border: `1px solid ${resumo.vagasLivres > 0 ? 'rgba(74, 222, 128, 0.4)' : 'rgba(248, 113, 113, 0.4)'}`,
                  }}
                >
                  {resumo.vagasLivres > 0 ? `${resumo.vagasLivres}/${resumo.totalVagas} LIVRES` : 'PÁTIO LOTADO'}
                </span>
              </div>
              <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: 2 }}>
                Sensores automáticos V01–V08 • Fluxo mão dupla organizado • Guarita e cancelas inteligentes
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
              fontSize: '1.05rem',
              fontWeight: 700,
            }}
          >
            ✕
          </button>
        </div>

        {/* Corpo */}
        <div style={{ padding: 20, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* KPIs */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
            <div className="pixel-subcard" style={{ padding: '10px 14px', borderTop: '3px solid #22c55e' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>VAGAS LIVRES</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#4ade80', marginTop: 2 }}>
                {resumo.vagasLivres} / {resumo.totalVagas}
              </div>
            </div>
            <div className="pixel-subcard" style={{ padding: '10px 14px', borderTop: '3px solid #f59e0b' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>OCUPADAS / EM MANOBRA</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fbbf24', marginTop: 2 }}>
                {resumo.vagasOcupadas} / {resumo.totalVagas}
              </div>
            </div>
            <div className="pixel-subcard" style={{ padding: '10px 14px', borderTop: '3px solid #38bdf8' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>RECEITA ESTACIONAMENTO</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', marginTop: 2 }}>
                {formatarMoeda(estacionamento.receitaEstacionamento)}
              </div>
            </div>
            <div className="pixel-subcard" style={{ padding: '10px 14px', borderTop: '3px solid #a855f7' }}>
              <div style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: 700 }}>VEÍCULOS ATENDIDOS</div>
              <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#c084fc', marginTop: 2 }}>
                {estacionamento.totalVeiculosAtendidos} tickets
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
            {/* Painel de Vagas V01..V08 */}
            <div className="pixel-subcard" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                  Sensores das 8 Vagas Numeradas (V01 – V08)
                </span>
                <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Leitura automática em tempo real</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {resumo.vagas.map((vg) => {
                  const veic = resumo.veiculosNoPatio.find((v) => v.vagaId === vg.id);
                  const ocupada = Boolean(vg.ocupadaPorPlaca);
                  const reservada = Boolean(vg.reservadaPorPlaca) && !ocupada;
                  return (
                    <div
                      key={vg.id}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        background: ocupada
                          ? 'rgba(239, 68, 68, 0.12)'
                          : reservada
                            ? 'rgba(245, 158, 11, 0.14)'
                            : 'rgba(34, 197, 94, 0.1)',
                        border: `1px solid ${ocupada ? 'rgba(239, 68, 68, 0.35)' : reservada ? 'rgba(245, 158, 11, 0.4)' : 'rgba(34, 197, 94, 0.3)'}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 800, fontSize: '0.82rem', color: '#f8fafc' }}>
                          {vg.id} • {veic ? `${veic.placa} (${veic.modeloLabel})` : 'Disponível'}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                          {veic ? FASE_LABEL[veic.fase] || veic.fase : 'Sensor óptico livre'}
                        </div>
                      </div>
                      <span
                        style={{
                          width: 10,
                          height: 10,
                          borderRadius: '50%',
                          background: ocupada ? '#ef4444' : reservada ? '#f59e0b' : '#22c55e',
                          boxShadow: `0 0 8px ${ocupada ? '#ef4444' : reservada ? '#f59e0b' : '#22c55e'}`,
                        }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Controle das Cancelas & Tarifa */}
            <div className="pixel-subcard" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>
                Automação das Cancelas &amp; Cobrança
              </div>

              {/* Cancela Entrada */}
              <div style={{ background: '#0c1426', padding: 10, borderRadius: 8, border: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Cancela Entrada (Pista Leste ↑)</span>
                  <span style={{ color: resumo.cancelaEntrada.luzVerde ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                    {resumo.cancelaEntrada.abertura > 0.7 ? 'ABERTA' : 'FECHADA'} ({Math.round(resumo.cancelaEntrada.abertura * 100)}%)
                  </span>
                </div>
                <div style={{ height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <div
                    style={{
                      width: `${Math.round(resumo.cancelaEntrada.abertura * 100)}%`,
                      height: '100%',
                      background: '#22c55e',
                      transition: 'width 0.15s',
                    }}
                  />
                </div>
                <button
                  className="pixel-btn primary"
                  style={{ width: '100%', padding: '6px 10px', fontSize: '0.78rem' }}
                  onClick={() => {
                    acionarCancelaManual('ENTRADA');
                    setResumo(obterResumoEstacionamento());
                  }}
                >
                  🚧 Abrir Cancela de Entrada Manualmente
                </button>
              </div>

              {/* Cancela Saída */}
              <div style={{ background: '#0c1426', padding: 10, borderRadius: 8, border: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', marginBottom: 6 }}>
                  <span style={{ color: '#cbd5e1', fontWeight: 600 }}>Cancela Saída / Guarita (Oeste ↓)</span>
                  <span style={{ color: resumo.cancelaSaida.luzVerde ? '#4ade80' : '#f87171', fontWeight: 700 }}>
                    {resumo.cancelaSaida.abertura > 0.7 ? 'ABERTA' : 'FECHADA'} ({Math.round(resumo.cancelaSaida.abertura * 100)}%)
                  </span>
                </div>
                <div style={{ height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden', marginBottom: 8 }}>
                  <div
                    style={{
                      width: `${Math.round(resumo.cancelaSaida.abertura * 100)}%`,
                      height: '100%',
                      background: '#38bdf8',
                      transition: 'width 0.15s',
                    }}
                  />
                </div>
                <button
                  className="pixel-btn success"
                  style={{ width: '100%', padding: '6px 10px', fontSize: '0.78rem' }}
                  onClick={() => {
                    acionarCancelaManual('SAIDA');
                    setResumo(obterResumoEstacionamento());
                  }}
                >
                  🚧 Liberar Cancela da Guarita Manualmente
                </button>
              </div>

              {/* Tarifa e Cobrança */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                  Tarifa Única ({servicoPagoAtivo ? 'Cobrança Ativa' : 'Gratuito'}):
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {[5, 10, 15, 20].map((v) => (
                    <button
                      key={v}
                      className={`pixel-btn ${estacionamento.tarifaBase === v ? 'primary' : ''}`}
                      style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                      onClick={() => onAlterarTarifa(v)}
                    >
                      R$ {v}
                    </button>
                  ))}
                  <button
                    className={`pixel-btn ${servicoPagoAtivo ? 'warning' : 'success'}`}
                    style={{ padding: '4px 8px', fontSize: '0.74rem' }}
                    onClick={onAlternarServicoPago}
                  >
                    {servicoPagoAtivo ? 'Pagar ON' : 'Livre'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Rodapé: Equipe do Pátio + Últimos Tickets */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: 16 }}>
            <div className="pixel-subcard" style={{ padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span style={{ fontWeight: 700, fontSize: '0.84rem', color: '#f8fafc' }}>
                  Equipe do Estacionamento ({equipePatio.length})
                </span>
                <button className="pixel-btn" style={{ padding: '3px 8px', fontSize: '0.7rem' }} onClick={onAbrirStaff}>
                  Gerenciar Equipe
                </button>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {equipePatio.map((f) => (
                  <div
                    key={f.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '6px 8px',
                      borderRadius: 8,
                      background: 'rgba(15, 23, 42, 0.7)',
                      border: '1px solid #1e293b',
                    }}
                  >
                    <PixelAvatar seed={f.avatarSeed} size={30} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.8rem', color: '#f8fafc' }}>{f.nome}</div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        {FABRICA_CARGOS[f.cargo].nomeExibicao} • Turno {f.turno} • {f.atendimentosRealizados} atend.
                      </div>
                    </div>
                    <span className={`badge-pixel ${f.trabalhandoAgora ? 'badge-livre' : 'badge-manutencao'}`}>
                      {f.trabalhandoAgora ? 'EM SERVIÇO' : 'FOLGA'}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pixel-subcard" style={{ padding: 14 }}>
              <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#f8fafc', marginBottom: 8 }}>
                Últimos Tickets da Guarita Automática
              </div>
              <div style={{ maxHeight: 140, overflowY: 'auto' }}>
                <table className="pixel-table" style={{ fontSize: '0.76rem' }}>
                  <thead>
                    <tr>
                      <th>TICKET</th>
                      <th>PLACA</th>
                      <th>VAGA</th>
                      <th>HORA</th>
                      <th>VALOR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {estacionamento.ultimosTickets.slice(0, 8).map((tk) => (
                      <tr key={tk.id}>
                        <td style={{ color: '#38bdf8', fontWeight: 700 }}>{tk.id}</td>
                        <td>{tk.placa}</td>
                        <td>{tk.vagaId}</td>
                        <td>{tk.horario}</td>
                        <td style={{ color: '#4ade80', fontWeight: 700 }}>{formatarMoeda(tk.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
