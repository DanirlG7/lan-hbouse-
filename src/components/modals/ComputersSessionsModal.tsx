import React, { useState } from 'react';
import { MAX_ESTACOES_MAPA } from '../../domain/LanHouseEngine';
import {
  AreaComputador,
  Cliente,
  Computador,
  Produto,
  Sessao,
} from '../../domain/types';
import { formatarMoeda, formatarDuracao } from '../HudOverlay';
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

  // Estados de Dashboard Moderno (Etapa 2 - Mobbin Dashboard & Monitoring)
  const [filtroStatusPc, setFiltroStatusPc] = useState<'TODOS' | 'OCUPADO' | 'LIVRE' | 'MANUTENCAO'>('TODOS');
  const [filtroAreaPc, setFiltroAreaPc] = useState<'TODAS' | AreaComputador>('TODAS');
  const [modoVisualizacao, setModoVisualizacao] = useState<'LISTA' | 'GRID'>('LISTA');
  const [buscaPc, setBuscaPc] = useState('');

  const pcsOcupados = computadores.filter((c) => c.status === 'OCUPADO').length;
  const pcsLivres = computadores.filter((c) => c.status === 'LIVRE').length;
  const pcsManut = computadores.filter((c) => c.status === 'MANUTENCAO').length;
  const taxaOcupacao = Math.round((pcsOcupados / (computadores.length || 1)) * 100);
  const faturamentoHoraEstimado = computadores
    .filter((c) => c.status === 'OCUPADO')
    .reduce((acc, c) => acc + c.precoPorHora, 0);

  const sessoesFinalizadas = sessoes.filter((s) => s.status === 'ENCERRADA');
  const ticketMedioSessao =
    sessoesFinalizadas.length > 0
      ? sessoesFinalizadas.reduce((a, s) => a + s.valorTotal, 0) / sessoesFinalizadas.length
      : 24.8;

  const computadoresFiltrados = computadores.filter((c) => {
    const matchStatus = filtroStatusPc === 'TODOS' ? true : c.status === filtroStatusPc;
    const matchArea = filtroAreaPc === 'TODAS' ? true : c.area === filtroAreaPc;
    const matchBusca =
      c.identificacao.toLowerCase().includes(buscaPc.toLowerCase()) ||
      c.especificacoes.toLowerCase().includes(buscaPc.toLowerCase()) ||
      c.categoria.toLowerCase().includes(buscaPc.toLowerCase());
    return matchStatus && matchArea && matchBusca;
  });

  const pcAtual =
    computadores.find((c) => c.numero === pcNumeroSel) || computadores[0];
  const sessaoAtivaPc = pcAtual?.sessaoAtivaId
    ? sessoes.find((s) => s.id === pcAtual.sessaoAtivaId)
    : undefined;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-window"
        style={{
          width: 'min(1120px, 97vw)',
          maxHeight: '91vh',
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
              {/* Ícone de Monitor / PC HD */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="2" y="3" width="20" height="13" rx="2" stroke="#38bdf8" strokeWidth="2" />
                <path d="M8 20h8M12 16v4" stroke="#38bdf8" strokeWidth="2" strokeLinecap="round" />
                <path d="M6 10h3l2-3 2 5 2-2h3" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
                  GERENCIAMENTO DE COMPUTADORES & TELEMETRIA
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
                  RF03–RF07 • RN01–RN05 • RN10
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 1 }}>
                Painel operacional de estações, telemetria térmica, sessões ativas e manutenção
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

        {/* TOPO VISUAL: DIAGRAMA DE REDE DE TERMINAIS CYBER EM ALTA DEFINIÇÃO */}
        <div
          style={{
            padding: '12px 20px 8px',
            background: 'linear-gradient(180deg, rgba(16, 26, 48, 0.95), rgba(11, 18, 34, 0.95))',
            borderBottom: '1px solid #263a63',
            overflowX: 'auto',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              minWidth: 780,
              position: 'relative',
              padding: '4px 10px',
            }}
          >
            {/* Linha de barramento de rede conectando os PCs */}
            <div
              style={{
                position: 'absolute',
                left: 42,
                right: 42,
                top: 36,
                height: 3,
                background: 'linear-gradient(90deg, #1d4ed8, #38bdf8, #1d4ed8)',
                boxShadow: '0 0 10px rgba(56, 189, 248, 0.5)',
                zIndex: 0,
              }}
            />

            {computadores.map((pc) => {
              const sel = pc.numero === pcAtual?.numero;
              const corStatus =
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
                    transform: sel ? 'scale(1.12)' : 'scale(1)',
                    transition: 'all 0.15s ease',
                  }}
                  title={`${pc.identificacao} (${pc.status}) - Clique para inspecionar`}
                >
                  <span
                    style={{
                      fontSize: '0.66rem',
                      color: sel ? '#38bdf8' : 'transparent',
                      height: 12,
                      filter: 'drop-shadow(0 0 4px #38bdf8)',
                    }}
                  >
                    ▼
                  </span>

                  {/* ESTAÇÃO CYBER HD (Gabinete + Monitor Curvo + Periféricos) */}
                  <svg width="60" height="46" viewBox="0 0 60 46" fill="none">
                    <defs>
                      <linearGradient id={`pcScreenBlue_${pc.numero}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00f2fe" />
                        <stop offset="100%" stopColor="#0284c7" />
                      </linearGradient>
                      <linearGradient id={`pcScreenGreen_${pc.numero}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ade80" />
                        <stop offset="100%" stopColor="#15803d" />
                      </linearGradient>
                      <linearGradient id={`pcScreenRed_${pc.numero}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#f87171" />
                        <stop offset="100%" stopColor="#991b1b" />
                      </linearGradient>
                    </defs>

                    {/* Torre / Gabinete Gamer com Friso RGB */}
                    <rect x="2" y="7" width="12" height="28" rx="2.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <rect x="4.5" y="10.5" width="7" height="2" rx="0.5" fill={corStatus} />
                    <line x1="12" y1="10" x2="12" y2="31" stroke={corStatus} strokeWidth="1.2" opacity="0.85" />
                    <circle cx="8" cy="20" r="2.5" fill="#1e293b" />
                    <circle cx="8" cy="28" r="2.5" fill="#1e293b" />

                    {/* Monitor Gamer Bezel-less Curvo */}
                    <rect
                      x="18"
                      y="7"
                      width="34"
                      height="23"
                      rx="3.5"
                      fill="#090d16"
                      stroke={sel ? '#38bdf8' : '#283c5e'}
                      strokeWidth={sel ? '2' : '1.2'}
                      filter={sel ? 'drop-shadow(0 0 6px rgba(56, 189, 248, 0.6))' : undefined}
                    />

                    {/* Tela Iluminada Conforme Status */}
                    <rect
                      x="20.5"
                      y="9.5"
                      width="29"
                      height="18"
                      rx="2"
                      fill={
                        pc.status === 'OCUPADO'
                          ? `url(#pcScreenBlue_${pc.numero})`
                          : pc.status === 'LIVRE'
                          ? `url(#pcScreenGreen_${pc.numero})`
                          : `url(#pcScreenRed_${pc.numero})`
                      }
                      opacity={pc.status === 'LIVRE' ? 0.75 : 0.95}
                    />

                    {/* Linha de telemetria na tela */}
                    <path
                      d="M22 19h5l2-4 3 7 3-3 3 1.5h8"
                      stroke="#ffffff"
                      strokeWidth="1.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      opacity="0.85"
                    />

                    {/* Base Metálica do Monitor */}
                    <path d="M33 30h4v5h-4z" fill="#475569" />
                    <path d="M26 35h18v1.5H26z" fill="#334155" />

                    {/* Teclado e Mouse RGB */}
                    <rect x="18" y="38" width="22" height="4" rx="1" fill="#1e293b" stroke="#334155" strokeWidth="0.8" />
                    <rect x="43" y="38" width="8" height="4" rx="1.5" fill="#334155" />
                  </svg>

                  <span
                    style={{
                      fontSize: '0.68rem',
                      fontWeight: 800,
                      color: sel ? '#38bdf8' : '#cbd5e1',
                      marginTop: 2,
                    }}
                  >
                    {pc.identificacao}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '8px 20px',
            background: 'rgba(12, 19, 36, 0.95)',
            borderBottom: '1px solid #1e2c4a',
          }}
        >
          <button
            className={`pixel-tab ${aba === 'ESTADO' ? 'active' : ''}`}
            onClick={() => setAba('ESTADO')}
            style={{
              padding: '7px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: aba === 'ESTADO' ? '#2563eb' : 'transparent',
              color: aba === 'ESTADO' ? '#ffffff' : '#94a3b8',
              boxShadow: aba === 'ESTADO' ? '0 0 10px rgba(37, 99, 235, 0.5)' : 'none',
            }}
          >
            🖥️ ESTADO ATUAL & SESSÕES
          </button>
          <button
            className={`pixel-tab ${aba === 'MELHORIAS' ? 'active' : ''}`}
            onClick={() => setAba('MELHORIAS')}
            style={{
              padding: '7px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: aba === 'MELHORIAS' ? '#2563eb' : 'transparent',
              color: aba === 'MELHORIAS' ? '#ffffff' : '#94a3b8',
              boxShadow: aba === 'MELHORIAS' ? '0 0 10px rgba(37, 99, 235, 0.5)' : 'none',
            }}
          >
            ⬆️ MELHORIAS & NOVO PC (RF03)
          </button>
          <button
            className={`pixel-tab ${aba === 'SOFTWARE' ? 'active' : ''}`}
            onClick={() => setAba('SOFTWARE')}
            style={{
              padding: '7px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: aba === 'SOFTWARE' ? '#2563eb' : 'transparent',
              color: aba === 'SOFTWARE' ? '#ffffff' : '#94a3b8',
              boxShadow: aba === 'SOFTWARE' ? '0 0 10px rgba(37, 99, 235, 0.5)' : 'none',
            }}
          >
            💾 HISTÓRICO DE SESSÕES ({sessoes.length})
          </button>
          <button
            className={`pixel-tab ${aba === 'MANUTENCAO' ? 'active' : ''}`}
            onClick={() => setAba('MANUTENCAO')}
            style={{
              padding: '7px 14px',
              fontSize: '0.78rem',
              fontWeight: 700,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              background: aba === 'MANUTENCAO' ? '#2563eb' : 'transparent',
              color: aba === 'MANUTENCAO' ? '#ffffff' : '#94a3b8',
              boxShadow: aba === 'MANUTENCAO' ? '0 0 10px rgba(37, 99, 235, 0.5)' : 'none',
            }}
          >
            🛠️ MANUTENÇÃO & TARIFAS (RN10)
          </button>
        </div>

        <div style={{ padding: '14px 20px', overflowY: 'auto', flex: 1 }}>
          {aba === 'ESTADO' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* TELEMETRIA & KPIS ESTILO POWER BI NO TOPO */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(6, 1fr)',
                  gap: 10,
                }}
              >
                {/* KPI 1: TOTAL */}
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    border: '1px solid #25375c',
                    borderTop: '3px solid #38bdf8',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Total de Estações
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#f8fafc', margin: '3px 0' }}>
                    {computadores.length}/{MAX_ESTACOES_MAPA} Máquinas
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#38bdf8', fontWeight: 600 }}>
                    18 Comuns/Deck + 6 VIPs no mapa
                  </div>
                </div>

                {/* KPI 2: LIVRES */}
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    border: '1px solid #25375c',
                    borderTop: '3px solid #10b981',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    PCs Disponíveis
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#4ade80', margin: '3px 0' }}>
                    {pcsLivres} Livres
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#4ade80', fontWeight: 600 }}>
                    Prontos para alocação
                  </div>
                </div>

                {/* KPI 3: OCUPADOS */}
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    border: '1px solid #25375c',
                    borderTop: '3px solid #0284c7',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Ocupação em Sessão
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#38bdf8', margin: '3px 0' }}>
                    {pcsOcupados} em uso ({taxaOcupacao}%)
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#38bdf8', fontWeight: 600 }}>
                    Taxa ativa normal
                  </div>
                </div>

                {/* KPI 4: MANUTENÇÃO */}
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    border: '1px solid #25375c',
                    borderTop: `3px solid ${pcsManut > 0 ? '#f59e0b' : '#475569'}`,
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Manutenção (RN05)
                  </div>
                  <div
                    style={{
                      fontSize: '1.2rem',
                      fontWeight: 800,
                      color: pcsManut > 0 ? '#f59e0b' : '#94a3b8',
                      margin: '3px 0',
                    }}
                  >
                    {pcsManut} Bloqueados
                  </div>
                  <div style={{ fontSize: '0.66rem', color: pcsManut > 0 ? '#fbbf24' : '#64748b', fontWeight: 600 }}>
                    {pcsManut > 0 ? 'Requer intervenção' : 'Todos saudáveis'}
                  </div>
                </div>

                {/* KPI 5: RECEITA / HORA */}
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    border: '1px solid #25375c',
                    borderTop: '3px solid #facc15',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Receita / Hora Ativa
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#facc15', margin: '3px 0' }}>
                    {formatarMoeda(faturamentoHoraEstimado)}/h
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#fde047', fontWeight: 600 }}>
                    Faturamento corrente
                  </div>
                </div>

                {/* KPI 6: MÉDIA DE GASTO REAL */}
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 8,
                    padding: '10px 12px',
                    border: '1px solid #25375c',
                    borderTop: '3px solid #f59e0b',
                  }}
                >
                  <div style={{ fontSize: '0.68rem', color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase' }}>
                    Média Gasto Real
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#facc15', margin: '3px 0' }}>
                    {formatarMoeda(ticketMedioSessao)}
                  </div>
                  <div style={{ fontSize: '0.66rem', color: '#fde047', fontWeight: 600 }}>
                    Ticket médio / sessão
                  </div>
                </div>
              </div>

              {/* BARRA DE CONTROLE: BUSCA, FILTROS RÁPIDOS E MODO DE VISÃO */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  gap: 10,
                  flexWrap: 'wrap',
                }}
              >
                {/* Busca e Filtro de Área */}
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flex: 1, minWidth: 260 }}>
                  <input
                    className="pixel-input"
                    style={{ flex: 1, padding: '6px 11px', fontSize: '0.82rem' }}
                    placeholder="🔍 Buscar máquina, processador ou GPU..."
                    value={buscaPc}
                    onChange={(e) => setBuscaPc(e.target.value)}
                  />
                  <select
                    className="pixel-select"
                    style={{ padding: '6px 9px', fontSize: '0.82rem' }}
                    value={filtroAreaPc}
                    onChange={(e) => setFiltroAreaPc(e.target.value as any)}
                  >
                    <option value="TODAS">Todas as Áreas</option>
                    <option value="COMUM">Área Comum</option>
                    <option value="VIP">Área VIP</option>
                  </select>
                </div>

                {/* Filtros de Status */}
                <div style={{ display: 'flex', gap: 4 }}>
                  {(['TODOS', 'OCUPADO', 'LIVRE', 'MANUTENCAO'] as const).map((st) => (
                    <button
                      key={st}
                      className={`pixel-tab ${filtroStatusPc === st ? 'active' : ''}`}
                      style={{ padding: '5px 10px', fontSize: '0.76rem' }}
                      onClick={() => setFiltroStatusPc(st)}
                    >
                      {st === 'TODOS'
                        ? `Todos (${computadores.length})`
                        : st === 'OCUPADO'
                        ? `Em Uso (${pcsOcupados})`
                        : st === 'LIVRE'
                        ? `Livres (${pcsLivres})`
                        : `Manutenção (${pcsManut})`}
                    </button>
                  ))}
                </div>

                {/* Alternador de Modo: Lista vs Grid */}
                <div style={{ display: 'flex', gap: 4, background: '#0b1324', padding: 2, borderRadius: 4, border: '1px solid #283e66' }}>
                  <button
                    className="pixel-btn"
                    style={{
                      padding: '4px 9px',
                      fontSize: '0.76rem',
                      background: modoVisualizacao === 'LISTA' ? '#0284c7' : 'transparent',
                      borderColor: modoVisualizacao === 'LISTA' ? '#38bdf8' : 'transparent',
                    }}
                    onClick={() => setModoVisualizacao('LISTA')}
                    title="Visualização em Lista Detalhada com Telemetria"
                  >
                    📋 Lista
                  </button>
                  <button
                    className="pixel-btn"
                    style={{
                      padding: '4px 9px',
                      fontSize: '0.76rem',
                      background: modoVisualizacao === 'GRID' ? '#0284c7' : 'transparent',
                      borderColor: modoVisualizacao === 'GRID' ? '#38bdf8' : 'transparent',
                    }}
                    onClick={() => setModoVisualizacao('GRID')}
                    title="Visualização em Grid de Estações (Cyber Café)"
                  >
                    🔲 Grid
                  </button>
                </div>
              </div>

              {/* CORPO PRINCIPAL: LISTA/GRID (ESQUERDA) + PAINEL DE TELEMETRIA/OPERAÇÃO (DIREITA) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.55fr 1fr', gap: 14 }}>
                {/* ESQUERDA: LISTA OU GRID DE ESTAÇÕES */}
                <div>
                  {modoVisualizacao === 'LISTA' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxHeight: 460, overflowY: 'auto', paddingRight: 4 }}>
                      {computadoresFiltrados.map((pc) => {
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
                              boxShadow: sel ? '0 0 14px rgba(56, 189, 248, 0.28)' : 'none',
                              display: 'grid',
                              gridTemplateColumns: '88px 1.2fr 0.9fr 76px 96px 104px',
                              alignItems: 'center',
                              gap: 8,
                              transition: 'all 0.12s ease',
                            }}
                          >
                            {/* Identificação + Estado */}
                            <div>
                              <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.92rem' }}>
                                {pc.identificacao}
                              </div>
                              <div
                                style={{
                                  fontSize: '0.78rem',
                                  fontWeight: 600,
                                  color:
                                    pc.status === 'OCUPADO'
                                      ? '#4ade80'
                                      : pc.status === 'LIVRE'
                                      ? '#60a5fa'
                                      : '#f87171',
                                }}
                              >
                                {pc.status === 'OCUPADO'
                                  ? '● Em Sessão'
                                  : pc.status === 'LIVRE'
                                  ? '○ Standby'
                                  : '▲ Manutenção'}
                              </div>
                            </div>

                            {/* CPU & GPU */}
                            <div>
                              <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 500 }}>CPU / Placa de Vídeo</div>
                              <div style={{ fontSize: '0.84rem', fontWeight: 600, color: '#f1f5f9' }}>
                                {cpuTxt} • {gpuTxt}
                              </div>
                            </div>

                            {/* RAM + Tarifa */}
                            <div>
                              <div style={{ fontSize: '0.74rem', color: '#94a3b8', fontWeight: 500 }}>RAM / Tarifa</div>
                              <div style={{ fontSize: '0.84rem', fontWeight: 700, color: '#facc15' }}>
                                {ramTxt} • {formatarMoeda(pc.precoPorHora)}/h
                              </div>
                            </div>

                            {/* Utilização & Saúde */}
                            <div>
                              <div style={{ fontSize: '0.76rem', color: '#fbbf24', fontWeight: 600 }}>Uso: {usoPct}%</div>
                              <div
                                style={{
                                  fontSize: '0.76rem',
                                  fontWeight: 600,
                                  color: saudePct > 70 ? '#4ade80' : '#f87171',
                                }}
                              >
                                Saúde: {saudePct}%
                              </div>
                            </div>

                            {/* Mini Sparkline Verde */}
                            <svg width="86" height="26" viewBox="0 0 86 26">
                              <rect width="86" height="26" fill="#091224" stroke="#233861" rx="3" />
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

                            {/* 3 Botões de Ação */}
                            <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }} onClick={(e) => e.stopPropagation()}>
                              <button
                                className="pixel-btn primary"
                                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                                title="Upgrade de Hardware (+CPU/GPU e +Tarifa)"
                                onClick={() => onUpgradeHardware(pc.numero)}
                              >
                                ⬆
                              </button>
                              <button
                                className="pixel-btn"
                                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
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
                                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
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
                  ) : (
                    /* MODO GRID DE ESTAÇÕES (CYBER CAFÉ VIEW) */
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))',
                        gap: 10,
                        maxHeight: 460,
                        overflowY: 'auto',
                        paddingRight: 4,
                      }}
                    >
                      {computadoresFiltrados.map((pc) => {
                        const sel = pc.numero === pcAtual?.numero;
                        const sessao = sessoes.find((s) => s.id === pc.sessaoAtivaId);
                        const corStatus =
                          pc.status === 'OCUPADO'
                            ? '#38bdf8'
                            : pc.status === 'LIVRE'
                            ? '#22c55e'
                            : '#fb923c';

                        return (
                          <div
                            key={pc.numero}
                            onClick={() => {
                              setPcNumeroSel(pc.numero);
                              setNovaTarifaInput(pc.precoPorHora.toFixed(2));
                            }}
                            className="pixel-subcard"
                            style={{
                              padding: 10,
                              cursor: 'pointer',
                              borderRadius: 6,
                              borderColor: sel ? '#38bdf8' : '#2a3d66',
                              background: sel ? 'rgba(20, 42, 82, 0.95)' : 'rgba(15, 23, 44, 0.88)',
                              boxShadow: sel ? '0 0 14px rgba(56, 189, 248, 0.35)' : 'none',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 6,
                              transition: 'all 0.12s ease',
                            }}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <span style={{ fontWeight: 800, fontSize: '0.94rem', color: '#f8fafc' }}>
                                {pc.identificacao}
                              </span>
                              <span
                                style={{
                                  fontSize: '0.64rem',
                                  fontWeight: 700,
                                  padding: '1px 5px',
                                  borderRadius: 3,
                                  background: pc.area === 'VIP' ? 'rgba(234, 179, 8, 0.2)' : 'rgba(56, 189, 248, 0.16)',
                                  color: pc.area === 'VIP' ? '#facc15' : '#7dd3fc',
                                  border: `1px solid ${pc.area === 'VIP' ? '#facc15' : '#38bdf8'}`,
                                }}
                              >
                                {pc.area}
                              </span>
                            </div>

                            {/* Monitor Central com LED */}
                            <div
                              style={{
                                background: '#091021',
                                border: `1px solid ${corStatus}`,
                                borderRadius: 4,
                                padding: '8px 6px',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: 4,
                                minHeight: 68,
                                justifyContent: 'center',
                              }}
                            >
                              {pc.status === 'OCUPADO' && sessao ? (
                                <>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <PixelAvatar seed={sessao.clienteId + 10} size={22} />
                                    <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#f1f5f9', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 96 }}>
                                      {sessao.clienteNome.split(' ')[0]}
                                    </span>
                                  </div>
                                  <div style={{ fontSize: '0.72rem', color: '#38bdf8', fontWeight: 600 }}>
                                    ⏱️ {formatarDuracao(sessao.minutosUtilizados)}
                                  </div>
                                  <div style={{ width: '100%', background: '#1e293b', height: 4, borderRadius: 2, overflow: 'hidden' }}>
                                    <div style={{ width: '85%', height: '100%', background: '#38bdf8' }} />
                                  </div>
                                </>
                              ) : pc.status === 'LIVRE' ? (
                                <>
                                  <span style={{ fontSize: '1.1rem' }}>🟢</span>
                                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#4ade80' }}>
                                    Disponível
                                  </span>
                                  <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                                    {formatarMoeda(pc.precoPorHora)}/h
                                  </span>
                                </>
                              ) : (
                                <>
                                  <span style={{ fontSize: '1.1rem' }}>🔧</span>
                                  <span style={{ fontSize: '0.74rem', fontWeight: 700, color: '#fb923c' }}>
                                    Em Manutenção
                                  </span>
                                  <span style={{ fontSize: '0.66rem', color: '#f87171' }}>
                                    RN05 Bloqueado
                                  </span>
                                </>
                              )}
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#94a3b8' }}>
                              <span>{pc.categoria.replace('PC ', '')}</span>
                              <span style={{ color: '#4ade80', fontWeight: 600 }}>Saúde: {pc.status === 'MANUTENCAO' ? '42%' : '98%'}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* DIREITA: PAINEL DE TELEMETRIA & OPERAÇÃO EM TEMPO REAL */}
                {pcAtual && (
                  <div className="pixel-subcard" style={{ padding: 15, display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {/* CABEÇALHO DO PC SELECIONADO */}
                    <div style={{ borderBottom: '1px solid #2b3f66', paddingBottom: 10 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <h3 style={{ fontSize: '1.15rem', color: '#38bdf8', fontWeight: 800 }}>
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
                      <div style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: 4 }}>
                        {pcAtual.especificacoes}
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#4ade80', fontWeight: 700, marginTop: 4 }}>
                        Tarifa Configurada: {formatarMoeda(pcAtual.precoPorHora)} / hora
                      </div>
                    </div>

                    {/* TELEMETRIA DE HARDWARE & SENSORES EM TEMPO REAL */}
                    <div
                      style={{
                        background: '#091021',
                        border: '1px solid #233b66',
                        borderRadius: 6,
                        padding: 10,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ fontSize: '0.78rem', fontWeight: 700, color: '#94a3b8' }}>
                        SENSORES & TELEMETRIA DE HARDWARE
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: '0.78rem' }}>
                        <div>
                          <span style={{ color: '#94a3b8' }}>🌡️ Temperatura CPU:</span>
                          <div style={{ fontWeight: 700, color: pcAtual.status === 'OCUPADO' ? '#fbbf24' : '#4ade80' }}>
                            {pcAtual.status === 'OCUPADO' ? '68°C · Carga Alta' : '42°C · Estável'}
                          </div>
                        </div>

                        <div>
                          <span style={{ color: '#94a3b8' }}>⚡ Consumo Fonte:</span>
                          <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                            {pcAtual.status === 'OCUPADO' ? '340W (Gamer)' : '95W (Idle)'}
                          </div>
                        </div>
                      </div>

                      {/* BARRA DE SAÚDE DE HARDWARE */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.74rem', marginBottom: 2 }}>
                          <span style={{ color: '#94a3b8' }}>Saúde dos Coolers & SSD:</span>
                          <span style={{ fontWeight: 700, color: pcAtual.status === 'MANUTENCAO' ? '#f87171' : '#4ade80' }}>
                            {pcAtual.status === 'MANUTENCAO' ? '42% · Manutenção Necessária' : '98% · 100% Operacional'}
                          </span>
                        </div>
                        <div style={{ width: '100%', background: '#1e293b', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: pcAtual.status === 'MANUTENCAO' ? '42%' : '98%',
                              height: '100%',
                              background: pcAtual.status === 'MANUTENCAO' ? '#ef4444' : '#22c55e',
                            }}
                          />
                        </div>
                      </div>
                    </div>

                    {/* SESSÃO ATIVA (SE OCUPADO) */}
                    {pcAtual.status === 'OCUPADO' && sessaoAtivaPc && (
                      <div
                        style={{
                          background: 'rgba(14, 165, 233, 0.12)',
                          border: '1px solid #0284c7',
                          borderRadius: 6,
                          padding: 12,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 9,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <PixelAvatar seed={sessaoAtivaPc.clienteId + 10} size={38} />
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.94rem', color: '#f8fafc' }}>
                              Sessão #{sessaoAtivaPc.id} — {sessaoAtivaPc.clienteNome}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#bae6fd' }}>
                              Duração: <strong>{formatarDuracao(sessaoAtivaPc.minutosUtilizados)}</strong> • Tarifa:{' '}
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
                            borderRadius: 4,
                            fontSize: '0.78rem',
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
                            style={{ flex: 1, fontSize: '0.82rem' }}
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
                            style={{ padding: '6px 12px', fontSize: '0.82rem' }}
                            onClick={() => onAdicionarConsumo(sessaoAtivaPc.id, produtoConsumoId, 1)}
                          >
                            + Lanche
                          </button>
                        </div>

                        <button
                          className="pixel-btn success"
                          style={{ padding: '9px 14px', fontSize: '0.88rem', fontWeight: 700 }}
                          onClick={() => onEncerrarSessao(sessaoAtivaPc.id, true)}
                        >
                          Encerrar Sessão & Pagamento (RF06)
                        </button>
                      </div>
                    )}

                    {/* SE LIVRE: FORMULÁRIO DE ABERTURA DE SESSÃO */}
                    {pcAtual.status === 'LIVRE' && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, background: '#091021', padding: 12, borderRadius: 6, border: '1px solid #1e3a68' }}>
                        <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#cbd5e1' }}>
                          ABRIR SESSÃO NESTE COMPUTADOR (RF05)
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <select
                            className="pixel-select"
                            style={{ flex: 1, fontSize: '0.84rem' }}
                            value={clienteEscolhidoId}
                            onChange={(e) => setClienteEscolhidoId(Number(e.target.value))}
                          >
                            {clientes.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.nome} ({c.identificador})
                              </option>
                            ))}
                          </select>
                          <button className="pixel-btn" style={{ padding: '6px 12px', fontSize: '0.82rem' }} onClick={onIrParaClientes}>
                            + Novo Cliente
                          </button>
                        </div>
                        <button
                          className="pixel-btn primary"
                          style={{ padding: '10px 14px', fontSize: '0.9rem', fontWeight: 700 }}
                          onClick={() => onIniciarSessao(clienteEscolhidoId, pcAtual.numero)}
                        >
                          Iniciar Sessão no {pcAtual.identificacao}
                        </button>
                      </div>
                    )}

                    {/* SE EM MANUTENÇÃO: CARD DE DESBLOQUEIO */}
                    {pcAtual.status === 'MANUTENCAO' && (
                      <div
                        style={{
                          background: 'rgba(234, 88, 12, 0.14)',
                          border: '1px solid #fb923c',
                          borderRadius: 6,
                          padding: 12,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                        }}
                      >
                        <div style={{ fontWeight: 700, fontSize: '0.88rem', color: '#fed7aa' }}>
                          Estação Bloqueada para Manutenção (RN05)
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                          {motivoManut}
                        </div>
                        <button
                          className="pixel-btn success"
                          style={{ padding: '9px 14px', fontSize: '0.86rem', fontWeight: 700 }}
                          onClick={() => onLiberarManutencao(pcAtual.numero)}
                        >
                          Concluir Reparo e Liberar {pcAtual.identificacao}
                        </button>
                      </div>
                    )}

                    {/* ATALHOS RÁPIDOS DE HARDWARE NO RODAPÉ DO CARD */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 'auto', paddingTop: 6, borderTop: '1px solid #1e3052' }}>
                      <button
                        className="pixel-btn primary"
                        style={{ padding: '7px 10px', fontSize: '0.78rem' }}
                        onClick={() => onUpgradeHardware(pcAtual.numero)}
                      >
                        ⬆ Upgrade (+Tarifa)
                      </button>
                      <button
                        className="pixel-btn"
                        style={{ padding: '7px 10px', fontSize: '0.78rem' }}
                        onClick={() => {
                          setAba('MANUTENCAO');
                          setNovaTarifaInput(pcAtual.precoPorHora.toFixed(2));
                        }}
                      >
                        🛠️ Ajustar Tarifa
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {aba === 'MELHORIAS' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="pixel-subcard" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ fontSize: '1rem', color: '#4ade80' }}>
                  + Cadastrar Computador ({computadores.length}/{MAX_ESTACOES_MAPA} no Mapa)
                </h3>
                {computadores.length >= MAX_ESTACOES_MAPA ? (
                  <div
                    style={{
                      padding: 12,
                      borderRadius: 6,
                      background: 'rgba(34, 197, 94, 0.12)',
                      border: '1px solid rgba(74, 222, 128, 0.35)',
                      fontSize: '0.82rem',
                      color: '#cbd5e1',
                    }}
                  >
                    Capacidade física completa: as <strong>24 estações reais do mapa</strong> (PC-01..12 Salão, VIP-13..18 e PC-19..24 Deck) estão ativas. Use o painel ao lado para fazer Upgrade de Hardware nas máquinas existentes!
                  </div>
                ) : (
                  <>
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
                      Cadastrar Nova Máquina (RF03)
                    </button>
                  </>
                )}
              </div>

              <div className="pixel-subcard" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ fontSize: '1rem', color: '#38bdf8' }}>
                  Upgrade de Hardware na Estação Selecionada
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                  Instala processador Ryzen / GPU superior no <strong>{pcAtual?.identificacao}</strong> e eleva sua tarifa horária em +R$ 2,00/h.
                </p>
                <div style={{ background: '#0c1426', padding: 12, borderRadius: 4, fontSize: '0.86rem' }}>
                  <div>Estação: <strong>{pcAtual?.identificacao}</strong> ({pcAtual?.categoria})</div>
                  <div style={{ color: '#94a3b8', marginTop: 4 }}>{pcAtual?.especificacoes}</div>
                </div>
                <button
                  className="pixel-btn success"
                  onClick={() => pcAtual && onUpgradeHardware(pcAtual.numero)}
                >
                  Realizar Upgrade de CPU & GPU
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
                    <td style={{ fontSize: '0.82rem' }}>
                      {new Date(s.inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} →{' '}
                      {s.fim
                        ? new Date(s.fim).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                        : 'Ativa'}
                    </td>
                    <td>{formatarDuracao(s.minutosUtilizados)}</td>
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
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => onEncerrarSessao(s.id, true)}
                        >
                          Encerrar
                        </button>
                      ) : (
                        <button
                          className="pixel-btn"
                          style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                          onClick={() => onEncerrarSessao(s.id, false)}
                        >
                          Testar RN07
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
                <h3 style={{ fontSize: '1rem', color: '#fb923c' }}>
                  🔧 Controle de Manutenção ({pcAtual.identificacao})
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
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
                    Concluir Reparo e Liberar {pcAtual.identificacao}
                  </button>
                ) : (
                  <button
                    className="pixel-btn warning"
                    onClick={() => onColocarManutencao(pcAtual.numero, motivoManut)}
                  >
                    Enviar {pcAtual.identificacao} para Manutenção
                  </button>
                )}
              </div>

              <div className="pixel-subcard" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ fontSize: '1rem', color: '#facc15' }}>
                  💲 Alterar Preço por Hora (RN10)
                </h3>
                <p style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
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
                  Salvar Nova Tarifa no {pcAtual.identificacao}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
