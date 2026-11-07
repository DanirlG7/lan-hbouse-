import React, { useState } from 'react';
import {
  AreaComputador,
  Cliente,
  Computador,
  Produto,
  Sessao,
} from '../../domain/types';
import { formatarMoeda } from '../HudOverlay';
import { PixelAvatar } from '../PixelSprites';

interface Props {
  computadores: Computador[];
  clientes: Cliente[];
  sessoes: Sessao[];
  produtos: Produto[];
  pcSelecionadoInicial: number | null;
  onClose: () => void;
  onIniciarSessao: (clienteId: number, numeroPc: number) => void;
  onEncerrarSessao: (sessaoId: number, irParaPagamento: boolean) => void;
  onAdicionarConsumo: (sessaoId: number, produtoId: number, qtd: number) => void;
  onColocarManutencao: (numeroPc: number, motivo: string) => void;
  onLiberarManutencao: (numeroPc: number) => void;
  onCadastrarPc: (
    area: AreaComputador,
    categoria: Computador['categoria'],
    especificacoes: string,
    precoHora: number
  ) => void;
  onAlterarTarifa: (numeroPc: number, novoPreco: number) => void;
  onUpgradeHardware: (numeroPc: number) => void;
  onIrParaClientes: () => void;
}

/**
 * Fiel às Imagens 14 (GERENCIAMENTO DE COMPUTADORES com diagrama de rede no topo e botões [⬆] [🔧] [$])
 * e Imagem 7 (ESTADO ATUAL DOS COMPUTADORES com barras e gráfico de onda verde) + todos os RF03-RF07 / RN01-RN05 / RN10!
 */
export const ComputersSessionsModal: React.FC<Props> = ({
  computadores,
  clientes,
  sessoes,
  produtos,
  pcSelecionadoInicial,
  onClose,
  onIniciarSessao,
  onEncerrarSessao,
  onAdicionarConsumo,
  onColocarManutencao,
  onLiberarManutencao,
  onCadastrarPc,
  onAlterarTarifa,
  onUpgradeHardware,
  onIrParaClientes,
}) => {
  const [aba, setAba] = useState<'ESTADO' | 'MELHORIAS' | 'SOFTWARE' | 'MANUTENCAO'>('ESTADO');
  const [pcNumeroSel, setPcNumeroSel] = useState<number>(
    pcSelecionadoInicial || computadores[0]?.numero || 1
  );
  const [clienteEscolhidoId, setClienteEscolhidoId] = useState<number>(clientes[0]?.id || 1);
  const [produtoConsumoId, setProdutoConsumoId] = useState<number>(produtos[0]?.id || 1);
  const [motivoManut, setMotivoManut] = useState('Manutenção preventiva / limpeza de cooler');
  const [novaTarifaInput, setNovaTarifaInput] = useState('');

  // Form RF03
  const [novoArea, setNovoArea] = useState<AreaComputador>('COMUM');
  const [novoCat, setNovoCat] = useState<Computador['categoria']>('PC Gaming');
  const [novoSpec, setNovoSpec] = useState('AMD Ryzen 5 5600X • Nvidia RTX 3060 • 16GB • 512GB');
  const [novoPreco, setNovoPreco] = useState('12.00');

  const pcAtual =
    computadores.find((c) => c.numero === pcNumeroSel) || computadores[0];
  const sessaoAtivaPc = pcAtual?.sessaoAtivaId
    ? sessoes.find((s) => s.id === pcAtual.sessaoAtivaId)
    : undefined;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-window"
        style={{ width: 'min(1080px, 96vw)', maxHeight: '89vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pixel-modal-header">
          <div className="pixel-modal-title" style={{ margin: '0 auto' }}>
            <span>GERENCIAMENTO DE COMPUTADORES</span>
            <span className="badge-pixel badge-poo">RF03–RF07 • RN01–RN05 • RN10</span>
          </div>
          <span style={{ color: '#94a3b8', fontSize: '1.05rem', cursor: 'pointer' }} onClick={onClose}>
            ✕
          </span>
        </div>

        {/* TOPO VISUAL DA IMAGEM 14: Diagrama de Rede de Torres + Monitores + Teclados Conectados! */}
        <div
          style={{
            padding: '12px 18px 8px',
            background: 'linear-gradient(180deg, rgba(16,26,48,0.95), rgba(11,18,34,0.95))',
            borderBottom: '1px solid #263a63',
            overflowX: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minWidth: 740,
              position: 'relative',
              padding: '4px 10px',
            }}
          >
            {/* Linha de rede conectando os PCs */}
            <div
              style={{
                position: 'absolute',
                left: 42,
                right: 42,
                top: 34,
                height: 3,
                background: 'linear-gradient(90deg, #1d4ed8, #38bdf8, #1d4ed8)',
                zIndex: 0,
              }}
            />

            {computadores.map((pc) => {
              const sel = pc.numero === pcAtual?.numero;
              const corTela =
                pc.status === 'OCUPADO'
                  ? '#38bdf8'
                  : pc.status === 'LIVRE'
                  ? '#22c55e'
                  : '#ef4444';
              return (
                <div
                  key={pc.numero}
                  onClick={() => {
                    setPcNumeroSel(pc.numero);
                    setNovaTarifaInput(pc.precoPorHora.toFixed(2));
                  }}
                  style={{
                    zIndex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transform: sel ? 'scale(1.08)' : 'scale(1)',
                    transition: 'transform 0.14s',
                  }}
                  title={`${pc.identificacao} (${pc.status}) - Clique para selecionar`}
                >
                  <span style={{ fontSize: '0.62rem', color: sel ? '#38bdf8' : 'transparent', height: 10 }}>
                    ▼
                  </span>
                  <svg width="58" height="44" viewBox="0 0 29 22" shapeRendering="crispEdges">
                    {/* Gabinete Torre Esquerdo */}
                    <rect x="1" y="2" width="6" height="14" fill="#334155" />
                    <rect x="2" y="4" width="4" height="2" fill={corTela} />
                    <rect x="2" y="12" width="2" height="2" fill="#94a3b8" />
                    {/* Monitor */}
                    <rect x="8" y="3" width="16" height="11" fill={sel ? '#7dd3fc' : '#475569'} />
                    <rect x="9" y="4" width="14" height="9" fill={corTela} opacity={pc.status === 'LIVRE' ? 0.65 : 0.95} />
                    <rect x="14" y="14" width="4" height="2" fill="#64748b" />
                    {/* Teclado + Mouse */}
                    <rect x="8" y="17" width="14" height="3" fill="#475569" />
                    <rect x="24" y="17" width="3" height="3" fill="#64748b" />
                  </svg>
                  <span
                    style={{
                      fontSize: '0.67rem',
                      fontWeight: 700,
                      color: sel ? '#38bdf8' : '#cbd5e1',
                    }}
                  >
                    {pc.identificacao}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4 ABAS FIÉIS À IMAGEM 14 */}
        <div className="pixel-tabs">
          <button
            className={`pixel-tab ${aba === 'ESTADO' ? 'active' : ''}`}
            onClick={() => setAba('ESTADO')}
          >
            🖥️ ESTADO ATUAL & SESSÕES
          </button>
          <button
            className={`pixel-tab ${aba === 'MELHORIAS' ? 'active' : ''}`}
            onClick={() => setAba('MELHORIAS')}
          >
            ⬆️ MELHORIAS & NOVO PC (RF03)
          </button>
          <button
            className={`pixel-tab ${aba === 'SOFTWARE' ? 'active' : ''}`}
            onClick={() => setAba('SOFTWARE')}
          >
            💾 HISTÓRICO DE SESSÕES ({sessoes.length})
          </button>
          <button
            className={`pixel-tab ${aba === 'MANUTENCAO' ? 'active' : ''}`}
            onClick={() => setAba('MANUTENCAO')}
          >
            🛠️ MANUTENÇÃO & TARIFAS (RN10)
          </button>
        </div>

        <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1 }}>
          {aba === 'ESTADO' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 14 }}>
              {/* Lista de Linhas estilo Imagem 14 + Onda de Monitoramento estilo Imagem 7 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {computadores.map((pc) => {
                  const sel = pc.numero === pcAtual?.numero;
                  const partes = pc.especificacoes.split('•').map((s) => s.trim());
                  const cpuTxt = partes[0] || 'Intel Core i5';
                  const ramTxt = partes[1] || '16GB RAM';
                  const gpuTxt = partes[2] || 'Nvidia GTX 1660';
                  const usoPct = pc.status === 'OCUPADO' ? 85 : pc.status === 'LIVRE' ? 12 : 0;
                  const saudePct = pc.status === 'MANUTENCAO' ? 42 : 98;

                  return (
                    <div
                      key={pc.numero}
                      onClick={() => {
                        setPcNumeroSel(pc.numero);
                        setNovaTarifaInput(pc.precoPorHora.toFixed(2));
                      }}
                      className="pixel-subcard"
                      style={{
                        padding: '9px 12px',
                        cursor: 'pointer',
                        borderColor: sel ? '#38bdf8' : '#2d4470',
                        background: sel ? 'rgba(20, 42, 82, 0.92)' : 'rgba(18, 28, 52, 0.88)',
                        display: 'grid',
                        gridTemplateColumns: '88px 1.2fr 0.9fr 76px 96px 104px',
                        alignItems: 'center',
                        gap: 8,
                      }}
                    >
                      {/* Identificação + Estado (Imagem 14) */}
                      <div>
                        <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.88rem' }}>
                          {pc.identificacao}
                        </div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            fontWeight: 700,
                            color:
                              pc.status === 'OCUPADO'
                                ? '#4ade80'
                                : pc.status === 'LIVRE'
                                ? '#60a5fa'
                                : '#f87171',
                          }}
                        >
                          {pc.status === 'OCUPADO'
                            ? '✔ Em Sessão'
                            : pc.status === 'LIVRE'
                            ? 'zZ Standby'
                            : '⚠ Manutenção'}
                        </div>
                      </div>

                      {/* CPU & GPU */}
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>CPU / Placa de Vídeo</div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#e2e8f0' }}>
                          {cpuTxt} • {gpuTxt}
                        </div>
                      </div>

                      {/* RAM + Tarifa */}
                      <div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>RAM / Tarifa</div>
                        <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#facc15' }}>
                          {ramTxt} • {formatarMoeda(pc.precoPorHora)}/h
                        </div>
                      </div>

                      {/* Utilização & Saúde */}
                      <div>
                        <div style={{ fontSize: '0.72rem', color: '#fbbf24' }}>Uso: {usoPct}%</div>
                        <div
                          style={{
                            fontSize: '0.72rem',
                            color: saudePct > 70 ? '#4ade80' : '#f87171',
                          }}
                        >
                          Saúde: {saudePct}%
                        </div>
                      </div>

                      {/* Mini Sparkline Verde estilo Imagem 7 */}
                      <svg width="86" height="26" viewBox="0 0 86 26">
                        <rect width="86" height="26" fill="#091224" stroke="#233861" />
                        <polyline
                          fill="none"
                          stroke={pc.status === 'MANUTENCAO' ? '#ef4444' : '#4ade80'}
                          strokeWidth="1.5"
                          points={
                            pc.status === 'OCUPADO'
                              ? '2,20 12,18 20,6 28,16 38,14 46,4 54,17 66,12 76,8 84,15'
                              : pc.status === 'LIVRE'
                              ? '2,21 20,21 35,19 50,21 68,20 84,21'
                              : '2,22 40,22 84,22'
                          }
                        />
                      </svg>

                      {/* 3 Botões Quadrados da Imagem 14: [⬆] [🔧] [$] */}
                      <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                        <button
                          className="pixel-btn primary"
                          style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                          title="Upgrade de Hardware (+CPU/GPU e +Tarifa)"
                          onClick={() => onUpgradeHardware(pc.numero)}
                        >
                          ⬆
                        </button>
                        <button
                          className="pixel-btn"
                          style={{ padding: '5px 8px', fontSize: '0.78rem' }}
                          title={
                            pc.status === 'MANUTENCAO'
                              ? 'Liberar da Manutenção'
                              : 'Colocar em Manutenção (RN05)'
                          }
                          onClick={() =>
                            pc.status === 'MANUTENCAO'
                              ? onLiberarManutencao(pc.numero)
                              : onColocarManutencao(pc.numero, motivoManut)
                          }
                        >
                          🔧
                        </button>
                        <button
                          className="pixel-btn warning"
                          style={{ padding: '5px 9px', fontSize: '0.78rem' }}
                          title="Operar Sessão / Cobrança"
                          onClick={() => setPcNumeroSel(pc.numero)}
                        >
                          $
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Painel Direito: Operação de Sessão da Estação Selecionada (RF05 / RF06 / RF07) */}
              {pcAtual && (
                <div className="pixel-subcard" style={{ padding: 15, display: 'flex', flexDirection: 'column', gap: 11 }}>
                  <div style={{ borderBottom: '1px solid #2b3f66', paddingBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h3 style={{ fontSize: '1.05rem', color: '#38bdf8' }}>
                        {pcAtual.identificacao} ({pcAtual.area})
                      </h3>
                      <span
                        className={`badge-pixel ${
                          pcAtual.status === 'LIVRE'
                            ? 'badge-livre'
                            : pcAtual.status === 'OCUPADO'
                            ? 'badge-ocupado'
                            : 'badge-manutencao'
                        }`}
                      >
                        {pcAtual.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: 4 }}>
                      {pcAtual.especificacoes}
                    </div>
                    <div style={{ fontSize: '0.86rem', color: '#4ade80', fontWeight: 700, marginTop: 4 }}>
                      Tarifa Configurada: {formatarMoeda(pcAtual.precoPorHora)} / hora
                    </div>
                  </div>

                  {pcAtual.status === 'OCUPADO' && sessaoAtivaPc && (
                    <div
                      style={{
                        background: 'rgba(14, 165, 233, 0.12)',
                        border: '1px solid #0284c7',
                        borderRadius: 4,
                        padding: 11,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                        <PixelAvatar seed={sessaoAtivaPc.clienteId + 10} size={36} />
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>
                            Sessão #{sessaoAtivaPc.id} — {sessaoAtivaPc.clienteNome}
                          </div>
                          <div style={{ fontSize: '0.74rem', color: '#bae6fd' }}>
                            Duração: <strong>{sessaoAtivaPc.minutosUtilizados} min</strong> • Tarifa:{' '}
                            {formatarMoeda(sessaoAtivaPc.tarifaPorHoraCongelada)}/h
                          </div>
                        </div>
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 1fr 1fr',
                          gap: 6,
                          background: '#0b1325',
                          padding: 8,
                          borderRadius: 3,
                          fontSize: '0.76rem',
                        }}
                      >
                        <div>
                          <div style={{ color: '#94a3b8' }}>Tempo (RF07)</div>
                          <strong style={{ color: '#7dd3fc' }}>{formatarMoeda(sessaoAtivaPc.valorTempo)}</strong>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8' }}>Lanches</div>
                          <strong style={{ color: '#facc15' }}>{formatarMoeda(sessaoAtivaPc.valorConsumo)}</strong>
                        </div>
                        <div>
                          <div style={{ color: '#94a3b8' }}>Total Atual</div>
                          <strong style={{ color: '#4ade80' }}>{formatarMoeda(sessaoAtivaPc.valorTotal)}</strong>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6 }}>
                        <select
                          className="pixel-select"
                          style={{ flex: 1, fontSize: '0.78rem' }}
                          value={produtoConsumoId}
                          onChange={(e) => setProdutoConsumoId(Number(e.target.value))}
                        >
                          {produtos.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.nome} ({formatarMoeda(p.preco)})
                            </option>
                          ))}
                        </select>
                        <button
                          className="pixel-btn"
                          onClick={() => onAdicionarConsumo(sessaoAtivaPc.id, produtoConsumoId, 1)}
                        >
                          [+ Lanche]
                        </button>
                      </div>

                      <button
                        className="pixel-btn success"
                        onClick={() => onEncerrarSessao(sessaoAtivaPc.id, true)}
                      >
                        [ Encerrar Sessão & Ir p/ Pagamento (RF06) ]
                      </button>
                    </div>
                  )}

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#cbd5e1' }}>
                      ABRIR SESSÃO NESTE COMPUTADOR (RF05)
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <select
                        className="pixel-select"
                        style={{ flex: 1, fontSize: '0.82rem' }}
                        value={clienteEscolhidoId}
                        onChange={(e) => setClienteEscolhidoId(Number(e.target.value))}
                      >
                        {clientes.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.nome} ({c.identificador})
                          </option>
                        ))}
                      </select>
                      <button className="pixel-btn" onClick={onIrParaClientes}>
                        [+ Novo]
                      </button>
                    </div>
                    <button
                      className="pixel-btn primary"
                      onClick={() => onIniciarSessao(clienteEscolhidoId, pcAtual.numero)}
                    >
                      {pcAtual.status === 'LIVRE'
                        ? `[ Iniciar Sessão no ${pcAtual.identificacao} ]`
                        : `[ Testar Bloqueio ${pcAtual.status === 'OCUPADO' ? 'RN01 (Ocupado)' : 'RN05 (Manutenção)'} ]`}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {aba === 'MELHORIAS' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pixel-subcard" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ fontSize: '0.98rem', color: '#4ade80' }}>
                  [+] BUY NEW PC — CADASTRAR COMPUTADOR (RF03 / RN10)
                </h3>
                <select
                  className="pixel-select"
                  value={novoArea}
                  onChange={(e) => setNovoArea(e.target.value as AreaComputador)}
                >
                  <option value="COMUM">Área Comum</option>
                  <option value="VIP">Área VIP High-End</option>
                </select>
                <select
                  className="pixel-select"
                  value={novoCat}
                  onChange={(e) => setNovoCat(e.target.value as Computador['categoria'])}
                >
                  <option value="PC Básico">PC Básico</option>
                  <option value="PC Intermediário">PC Intermediário</option>
                  <option value="PC Gaming">PC Gaming</option>
                  <option value="VIP Station">VIP Station</option>
                </select>
                <input
                  className="pixel-input"
                  value={novoSpec}
                  onChange={(e) => setNovoSpec(e.target.value)}
                  placeholder="CPU • GPU • RAM • SSD"
                />
                <input
                  type="number"
                  step="0.5"
                  className="pixel-input"
                  value={novoPreco}
                  onChange={(e) => setNovoPreco(e.target.value)}
                  placeholder="Preço por hora (R$)"
                />
                <button
                  className="pixel-btn primary"
                  onClick={() =>
                    onCadastrarPc(novoArea, novoCat, novoSpec, Number(novoPreco) || 12)
                  }
                >
                  [ Cadastrar Nova Máquina (RF03) ]
                </button>
              </div>

              <div className="pixel-subcard" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ fontSize: '0.98rem', color: '#38bdf8' }}>
                  [⬆] UPGRADE DE HARDWARE NA ESTAÇÃO SELECIONADA
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Instala processador Ryzen / GPU superior no <strong>{pcAtual?.identificacao}</strong> e eleva sua tarifa horária em +R$ 2,00/h.
                </p>
                <div style={{ background: '#0c1426', padding: 12, borderRadius: 4, fontSize: '0.84rem' }}>
                  <div>Estação: <strong>{pcAtual?.identificacao}</strong> ({pcAtual?.categoria})</div>
                  <div style={{ color: '#94a3b8', marginTop: 4 }}>{pcAtual?.especificacoes}</div>
                </div>
                <button
                  className="pixel-btn success"
                  onClick={() => pcAtual && onUpgradeHardware(pcAtual.numero)}
                >
                  [ Realizar Upgrade de CPU & GPU ]
                </button>
              </div>
            </div>
          )}

          {aba === 'SOFTWARE' && (
            <table className="pixel-table">
              <thead>
                <tr>
                  <th>SESSÃO</th>
                  <th>CLIENTE</th>
                  <th>ESTAÇÃO</th>
                  <th>INÍCIO → FIM (RN03)</th>
                  <th>DURAÇÃO</th>
                  <th>VALOR (RF07)</th>
                  <th>STATUS</th>
                  <th>AÇÃO</th>
                </tr>
              </thead>
              <tbody>
                {sessoes.map((s) => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 700, color: '#7dd3fc' }}>#{s.id}</td>
                    <td>{s.clienteNome}</td>
                    <td>PC-{String(s.computadorNumero).padStart(2, '0')}</td>
                    <td style={{ fontSize: '0.8rem' }}>
                      {new Date(s.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} →{' '}
                      {s.fim
                        ? new Date(s.fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : 'Ativa'}
                    </td>
                    <td>{s.minutosUtilizados} min</td>
                    <td style={{ fontWeight: 700, color: '#4ade80' }}>{formatarMoeda(s.valorTotal)}</td>
                    <td>
                      <span className={`badge-pixel ${s.status === 'ATIVA' ? 'badge-ocupado' : 'badge-livre'}`}>
                        {s.status}
                      </span>
                    </td>
                    <td>
                      {s.status === 'ATIVA' ? (
                        <button
                          className="pixel-btn success"
                          style={{ padding: '4px 9px', fontSize: '0.75rem' }}
                          onClick={() => onEncerrarSessao(s.id, true)}
                        >
                          [Encerrar]
                        </button>
                      ) : (
                        <button
                          className="pixel-btn"
                          style={{ padding: '4px 9px', fontSize: '0.74rem' }}
                          onClick={() => onEncerrarSessao(s.id, false)}
                        >
                          [Testar RN07]
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {aba === 'MANUTENCAO' && pcAtual && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pixel-subcard" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ fontSize: '0.98rem', color: '#fb923c' }}>
                  🔧 CONTROLE DE MANUTENÇÃO ({pcAtual.identificacao})
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Computadores em manutenção ficam bloqueados para novas sessões conforme a <strong>RN05</strong>.
                </p>
                <input
                  className="pixel-input"
                  value={motivoManut}
                  onChange={(e) => setMotivoManut(e.target.value)}
                />
                {pcAtual.status === 'MANUTENCAO' ? (
                  <button
                    className="pixel-btn success"
                    onClick={() => onLiberarManutencao(pcAtual.numero)}
                  >
                    [ Concluir Reparo e Liberar {pcAtual.identificacao} ]
                  </button>
                ) : (
                  <button
                    className="pixel-btn warning"
                    onClick={() => onColocarManutencao(pcAtual.numero, motivoManut)}
                  >
                    [ Enviar {pcAtual.identificacao} para Manutenção ]
                  </button>
                )}
              </div>

              <div className="pixel-subcard" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ fontSize: '0.98rem', color: '#facc15' }}>
                  💲 ALTERAR PREÇO POR HORA (RN10)
                </h3>
                <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                  Somente usuários com permissão <code>GERENCIAR_COMPUTADOR</code> podem alterar tarifas.
                </p>
                <input
                  type="number"
                  step="0.5"
                  className="pixel-input"
                  value={novaTarifaInput || pcAtual.precoPorHora.toFixed(2)}
                  onChange={(e) => setNovaTarifaInput(e.target.value)}
                />
                <button
                  className="pixel-btn primary"
                  onClick={() =>
                    onAlterarTarifa(pcAtual.numero, Number(novaTarifaInput) || pcAtual.precoPorHora)
                  }
                >
                  [ Salvar Nova Tarifa no {pcAtual.identificacao} ]
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
