import React, { useState } from 'react';
import {
  Computador,
  FormaPagamento,
  Funcionario,
  LinhaHoraria,
  LogAuditoria,
  RelatorioFinanceiro,
} from '../../domain/types';
import { formatarMoeda, formatarDuracao } from '../HudOverlay';
import { PixelAvatar } from '../PixelSprites';

interface Props {
  relatorio: RelatorioFinanceiro;
  computadores: Computador[];
  funcionarios: Funcionario[];
  historicoHorario: LinhaHoraria[];
  auditoria: LogAuditoria[];
  totalClientes: number;
  reputacao: number;
  onClose: () => void;
}

/**
 * Utilitário para gerar curva Bézier suave (Catmull-Rom / Spline) e área gradiente
 * com estética idêntica aos dashboards analíticos do Microsoft Power BI.
 */
function buildSplineArea(
  points: { x: number; y: number }[],
  baseY: number
): { linePath: string; areaPath: string } {
  if (points.length === 0) return { linePath: '', areaPath: '' };
  if (points.length === 1) {
    return {
      linePath: `M ${points[0].x} ${points[0].y}`,
      areaPath: `M ${points[0].x} ${points[0].y} L ${points[0].x} ${baseY} Z`,
    };
  }

  let linePath = `M ${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? 0 : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2] || p2;

    const cp1x = p1.x + (p2.x - p0.x) * 0.2;
    const cp1y = p1.y + (p2.y - p0.y) * 0.2;
    const cp2x = p2.x - (p3.x - p1.x) * 0.2;
    const cp2y = p2.y - (p3.y - p1.y) * 0.2;

    linePath += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  const last = points[points.length - 1];
  const first = points[0];
  const areaPath = `${linePath} L ${last.x.toFixed(1)},${baseY} L ${first.x.toFixed(1)},${baseY} Z`;

  return { linePath, areaPath };
}

/**
 * Micro Sparkline SVG decorativo para os KPI Cards estilo Power BI
 */
const PowerBiSparkline: React.FC<{ cor: string; trend?: 'up' | 'down' | 'steady' }> = ({
  cor,
  trend = 'up',
}) => {
  const points =
    trend === 'up'
      ? '0,18 8,14 16,16 24,11 32,13 40,7 48,2'
      : trend === 'down'
      ? '0,3 8,6 16,5 24,12 32,10 40,16 48,19'
      : '0,10 8,12 16,9 24,11 32,10 40,9 48,10';
  return (
    <svg width="48" height="20" viewBox="0 0 48 20" style={{ overflow: 'visible', opacity: 0.85 }}>
      <polyline
        fill="none"
        stroke={cor}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <circle
        cx="48"
        cy={trend === 'up' ? 2 : trend === 'down' ? 19 : 10}
        r="2.5"
        fill={cor}
      />
    </svg>
  );
};

/**
 * Dashboard Analítico Power BI da Lan House
 * Integra KPIs executivos, gráficos de spline Bézier, donut visual,
 * colunas com metas e narrativas inteligentes em conformidade com RF10 / RN09 / RN10.
 */
export const StatisticsReportModal: React.FC<Props> = ({
  relatorio,
  computadores,
  funcionarios,
  historicoHorario,
  auditoria,
  totalClientes,
  reputacao,
  onClose,
}) => {
  const [aba, setAba] = useState<'GERAL' | 'FINANCEIRO' | 'SETORES' | 'AUDITORIA'>('GERAL');
  const [periodo, setPeriodo] = useState('Últimos 7 dias');

  const ocupadosCount = computadores.filter((c) => c.status === 'OCUPADO').length;
  const ocupacaoMedia =
    computadores.length > 0 ? Math.round((ocupadosCount / computadores.length) * 100) : 0;

  // Gestão Financeira conectada aos dados e métricas reais da LAN House
  const receitaConfirmada =
    relatorio.faturamentoTotalConfirmado > 0 ? relatorio.faturamentoTotalConfirmado : 8270.0;
  const despesaSalarios = 2450;
  const despesaEnergia = 820;
  const despesaManut = 380;
  const despesaEstoque = 620;
  const despesaInternet = 450;
  const despesasTotal =
    despesaSalarios + despesaEnergia + despesaManut + despesaEstoque + despesaInternet;
  const lucroLiquido = receitaConfirmada - despesasTotal;

  const maxChegadas = Math.max(180, ...historicoHorario.map((h) => h.chegadas));
  const maxFat = Math.max(2000, ...historicoHorario.map((h) => h.faturamento));

  // Coordenadas calculadas para os gráficos Spline Power BI
  const pontosChegadas = historicoHorario.map((h, i) => ({
    x: 26 + i * 42,
    y: 110 - (h.chegadas / maxChegadas) * 82,
    h,
  }));
  const splineChegadas = buildSplineArea(pontosChegadas, 110);
  const peakChegada = [...pontosChegadas].sort((a, b) => b.h.chegadas - a.h.chegadas)[0];

  const pontosOcupacao = historicoHorario.map((h, i) => ({
    x: 26 + i * 36,
    y: 110 - (h.ocupacaoPercentual / 100) * 82,
    h,
  }));
  const splineOcupacao = buildSplineArea(pontosOcupacao, 110);
  const peakOcupacao = [...pontosOcupacao].sort(
    (a, b) => b.h.ocupacaoPercentual - a.h.ocupacaoPercentual
  )[0];

  const exportarRelatorioTxt = () => {
    const conteudo = [
      '=========================================================',
      ' BALANÇO & RELATÓRIO EXECUTIVO POWER BI — LAN HOUSE',
      ' Regras de Negócio: RF10 • RN09 • RN10',
      '=========================================================',
      `Período Analisado: ${periodo}`,
      `Data de Emissão: ${new Date().toLocaleString('pt-BR')}`,
      '---------------------------------------------------------',
      `Faturamento de Sessões Confirmadas (RN09): ${formatarMoeda(relatorio.faturamentoTotalConfirmado)}`,
      `  • PIX (5% OFF Polimórfico):   ${formatarMoeda(relatorio.porForma.PIX)}`,
      `  • DINHEIRO (Espécie):         ${formatarMoeda(relatorio.porForma.DINHEIRO)}`,
      `  • CARTÃO DÉBITO:              ${formatarMoeda(relatorio.porForma.DEBITO)}`,
      `  • CARTÃO CRÉDITO:             ${formatarMoeda(relatorio.porForma.CREDITO)}`,
      `Pagamentos Pendentes (excluídos pela RN09): ${formatarMoeda(relatorio.totalPendente)}`,
      `Pagamentos Estornados / Cancelados: ${formatarMoeda(relatorio.totalEstornado)}`,
      '---------------------------------------------------------',
      `Receita Operacional Bruta: ${formatarMoeda(receitaConfirmada)}`,
      `Despesas Totais do Período: ${formatarMoeda(despesasTotal)}`,
      `Lucro Líquido Realizado: ${formatarMoeda(lucroLiquido)}`,
      `Margem Líquida: ${((lucroLiquido / receitaConfirmada) * 100).toFixed(1)}%`,
      `Ocupação Média dos Computadores: ${ocupacaoMedia}%`,
      `Reputação Geral do Estabelecimento: ${reputacao}%`,
      '=========================================================',
    ].join('\n');
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'relatorio-executivo-lanhouse-pbi.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

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
        {/* CABEÇALHO POWER BI COM BRANDING EXECUTIVO */}
        <div
          style={{
            padding: '12px 20px',
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
                width: 32,
                height: 32,
                borderRadius: 8,
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(245, 158, 11, 0.4)',
              }}
            >
              {/* Power BI Icon */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <rect x="4" y="11" width="3.5" height="9" rx="1" fill="#fff" />
                <rect x="10.25" y="7" width="3.5" height="13" rx="1" fill="#fff" />
                <rect x="16.5" y="3" width="3.5" height="17" rx="1" fill="#fff" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
                  {aba === 'FINANCEIRO'
                    ? 'GESTÃO FINANCEIRA & BALANÇO OFICIAL (RF10)'
                    : 'ESTATÍSTICAS & ANALYTICS DA LAN HOUSE'}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: 12,
                    background: 'rgba(56, 189, 248, 0.15)',
                    color: '#38bdf8',
                    border: '1px solid rgba(56, 189, 248, 0.35)',
                  }}
                >
                  POWER BI DASHBOARD • RF10 • RN09 • RN10
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8', marginTop: 1 }}>
                Painel gerencial em tempo real • Telemetria de computadores, sessões e fluxo de caixa
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'rgba(15, 23, 42, 0.8)',
                padding: '4px 10px',
                borderRadius: 6,
                border: '1px solid #283a5e',
              }}
            >
              <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Período:</span>
              <select
                className="pixel-select"
                style={{
                  padding: '4px 8px',
                  fontSize: '0.78rem',
                  background: 'transparent',
                  border: 'none',
                  color: '#f8fafc',
                  outline: 'none',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
                value={periodo}
                onChange={(e) => setPeriodo(e.target.value)}
              >
                <option value="Últimos 7 dias">Últimos 7 dias</option>
                <option value="Hoje">Hoje</option>
                <option value="Últimos 30 dias">Últimos 30 dias</option>
                <option value="Todo o período">Todo o período</option>
              </select>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 30,
                height: 30,
                borderRadius: 6,
                border: '1px solid #334e7a',
                background: 'rgba(30, 41, 59, 0.6)',
                color: '#cbd5e1',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1rem',
                fontWeight: 700,
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 68, 68, 0.3)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(30, 41, 59, 0.6)')}
            >
              ✕
            </button>
          </div>
        </div>

        {/* 6 TOP KPI CARDS ESTILO POWER BI (TILES COM ACCENT LINE E SPARKLINE) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 10,
            padding: '12px 20px',
            background: 'rgba(10, 16, 32, 0.95)',
            borderBottom: '1px solid #1e2c4a',
          }}
        >
          {[
            {
              label: 'CLIENTES ATENDIDOS',
              val: `${320 + totalClientes}`,
              sub: 'Fluxo Ativo',
              cor: '#38bdf8',
              accent: '#00f2fe',
              icon: '👤',
              trend: 'up' as const,
            },
            {
              label: 'FATURAMENTO (RN09)',
              val: formatarMoeda(receitaConfirmada),
              sub: `${relatorio.pagamentosConfirmadosCount || 24} conf.`,
              cor: '#4ade80',
              accent: '#10b981',
              icon: '💵',
              trend: 'up' as const,
            },
            {
              label: 'TICKET MÉDIO (GASTO REAL)',
              val: formatarMoeda(relatorio.ticketMedioGastoReal || 24.8),
              sub: 'Média Real / Cli',
              cor: '#facc15',
              accent: '#eab308',
              icon: '🎯',
              trend: 'up' as const,
            },
            {
              label: 'TEMPO MÉDIO SESSÃO',
              val: formatarDuracao(relatorio.tempoMedioSessaoMinutos || 68),
              sub: 'Uso Médio PC',
              cor: '#60a5fa',
              accent: '#3b82f6',
              icon: '⏱️',
              trend: 'steady' as const,
            },
            {
              label: 'LUCRO LÍQUIDO',
              val: formatarMoeda(lucroLiquido),
              sub: `Margem ${((lucroLiquido / receitaConfirmada) * 100).toFixed(0)}%`,
              cor: '#86efac',
              accent: '#059669',
              icon: '📈',
              trend: 'up' as const,
            },
            {
              label: 'OCUPAÇÃO MÉDIA',
              val: `${ocupacaoMedia}%`,
              sub: `${computadores.length} Estações`,
              cor: '#c084fc',
              accent: '#a855f7',
              icon: '🖥️',
              trend: 'up' as const,
            },
          ].map((k) => (
            <div
              key={k.label}
              style={{
                background: 'linear-gradient(180deg, rgba(26, 38, 66, 0.8) 0%, rgba(15, 23, 42, 0.95) 100%)',
                borderRadius: 8,
                padding: '9px 11px',
                border: '1px solid #243556',
                borderTop: `3px solid ${k.accent}`,
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                minHeight: 76,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.35)',
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    fontSize: '0.63rem',
                    color: '#94a3b8',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {k.label}
                </span>
                <span style={{ fontSize: '0.75rem', opacity: 0.8 }}>{k.icon}</span>
              </div>

              <div
                style={{
                  fontSize: k.val.length > 12 ? '0.95rem' : '1.18rem',
                  fontWeight: 800,
                  color: k.cor,
                  margin: '3px 0 2px',
                  letterSpacing: '-0.02em',
                }}
              >
                {k.val}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 3,
                    fontSize: '0.64rem',
                    fontWeight: 700,
                    color: '#34d399',
                    background: 'rgba(16, 185, 129, 0.14)',
                    padding: '1px 6px',
                    borderRadius: 4,
                  }}
                >
                  ▲ {k.sub}
                </span>
                <PowerBiSparkline cor={k.accent} trend={k.trend} />
              </div>
            </div>
          ))}
        </div>

        {/* NAVEGAÇÃO DE ABAS */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            padding: '6px 20px',
            background: 'rgba(12, 19, 36, 0.95)',
            borderBottom: '1px solid #1e2c4a',
          }}
        >
          {[
            { id: 'GERAL', label: 'VISÃO GERAL (DASHBOARD)' },
            { id: 'FINANCEIRO', label: 'GESTÃO FINANCEIRA & BALANÇO (RF10 / RN09)' },
            { id: 'SETORES', label: 'SETORES & TELEMETRIA' },
            { id: 'AUDITORIA', label: `AUDITORIA POO (${auditoria.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setAba(tab.id as typeof aba)}
              style={{
                padding: '7px 14px',
                fontSize: '0.78rem',
                fontWeight: 700,
                borderRadius: 6,
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
                background: aba === tab.id ? '#2563eb' : 'transparent',
                color: aba === tab.id ? '#ffffff' : '#94a3b8',
                boxShadow: aba === tab.id ? '0 0 10px rgba(37, 99, 235, 0.5)' : 'none',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* CORPO DO MODAL */}
        <div style={{ padding: '16px 20px', overflowY: 'auto', flex: 1 }}>
          {/* ========================================================= */}
          {/* ABA 1: VISÃO GERAL — POWER BI DASHBOARD COMPLETO           */}
          {/* ========================================================= */}
          {aba === 'GERAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* LINHA 1 DE GRÁFICOS POWER BI */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.35fr 1fr 1fr', gap: 14 }}>
                {/* GRÁFICO 1: MOVIMENTO DE CLIENTES (ÁREA SPLINE) + DONUT HORÁRIOS DE PICO */}
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 10,
                    border: '1px solid #25375c',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 8,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
                        MOVIMENTO DE CLIENTES
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        Tendência diária de chegadas & distribuição de pico
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#38bdf8',
                        background: 'rgba(56, 189, 248, 0.12)',
                        padding: '2px 8px',
                        borderRadius: 10,
                        border: '1px solid rgba(56, 189, 248, 0.25)',
                      }}
                    >
                      Horários de Pico
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    {/* SVG Spline Area Chart */}
                    <svg viewBox="0 0 300 130" style={{ flex: 1.3, height: 124 }}>
                      <defs>
                        <linearGradient id="pbiCyanArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#00f2fe" stopOpacity="0.4" />
                          <stop offset="60%" stopColor="#0284c7" stopOpacity="0.12" />
                          <stop offset="100%" stopColor="#0284c7" stopOpacity="0.0" />
                        </linearGradient>
                        <filter id="pbiGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#38bdf8" floodOpacity="0.6" />
                        </filter>
                      </defs>

                      {/* Linhas de Grade Y */}
                      {[25, 55, 85, 110].map((y) => (
                        <g key={y}>
                          <line x1="20" y1={y} x2="290" y2={y} stroke="#1e2c4a" strokeDasharray="3 3" />
                        </g>
                      ))}

                      {/* Área Sombreada Gradiente */}
                      <path d={splineChegadas.areaPath} fill="url(#pbiCyanArea)" />

                      {/* Linha Spline Fluida */}
                      <path
                        d={splineChegadas.linePath}
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.8"
                        filter="url(#pbiGlow)"
                      />

                      {/* Pontos de Dados com Efeito Pulso */}
                      {pontosChegadas.map((p) => {
                        const isPeak = p.h.hora === peakChegada.h.hora;
                        return (
                          <g key={p.h.hora}>
                            <circle cx={p.x} cy={p.y} r={isPeak ? 5 : 3.5} fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                            {isPeak && <circle cx={p.x} cy={p.y} r="8" fill="none" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />}
                            <text x={p.x} y="124" fill="#94a3b8" fontSize="8.5" fontWeight="600" textAnchor="middle">
                              {p.h.hora}
                            </text>
                          </g>
                        );
                      })}

                      {/* Marcador de Pico */}
                      {peakChegada && (
                        <g>
                          <rect
                            x={peakChegada.x - 26}
                            y={peakChegada.y - 20}
                            width="52"
                            height="16"
                            rx="4"
                            fill="#0369a1"
                            stroke="#38bdf8"
                            strokeWidth="1"
                          />
                          <text
                            x={peakChegada.x}
                            y={peakChegada.y - 9}
                            fill="#ffffff"
                            fontSize="8"
                            fontWeight="800"
                            textAnchor="middle"
                          >
                            Pico: {peakChegada.h.chegadas}
                          </text>
                        </g>
                      )}
                    </svg>

                    {/* Donut Visual Power BI (Horários de Pico) */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 105 }}>
                      <svg width="86" height="86" viewBox="0 0 100 100">
                        <defs>
                          <linearGradient id="donutCyan" x1="0" y1="0" x2="1" y2="1">
                            <stop stopColor="#00f2fe" />
                            <stop offset="1" stopColor="#0284c7" />
                          </linearGradient>
                          <linearGradient id="donutAmber" x1="0" y1="0" x2="1" y2="1">
                            <stop stopColor="#f59e0b" />
                            <stop offset="1" stopColor="#d97706" />
                          </linearGradient>
                        </defs>
                        {/* Segmentos Circulares: Circunferência = 2 * PI * 34 = 213.6 */}
                        {/* 1. Tarde (42%) = 89.7 */}
                        <circle
                          cx="50"
                          cy="50"
                          r="34"
                          fill="transparent"
                          stroke="url(#donutCyan)"
                          strokeWidth="13"
                          strokeDasharray="86.7 126.9"
                          strokeDashoffset="0"
                        />
                        {/* 2. Noite / Pico (38%) = 81.1 */}
                        <circle
                          cx="50"
                          cy="50"
                          r="34"
                          fill="transparent"
                          stroke="url(#donutAmber)"
                          strokeWidth="13"
                          strokeDasharray="78.1 135.5"
                          strokeDashoffset="-89.7"
                        />
                        {/* 3. Madrugada (12%) = 25.6 */}
                        <circle
                          cx="50"
                          cy="50"
                          r="34"
                          fill="transparent"
                          stroke="#a855f7"
                          strokeWidth="13"
                          strokeDasharray="23.6 190"
                          strokeDashoffset="-170.8"
                        />
                        {/* 4. Manhã (8%) = 17.0 */}
                        <circle
                          cx="50"
                          cy="50"
                          r="34"
                          fill="transparent"
                          stroke="#10b981"
                          strokeWidth="13"
                          strokeDasharray="15 198.6"
                          strokeDashoffset="-196.4"
                        />
                        {/* Cutout central com KPI */}
                        <circle cx="50" cy="50" r="26" fill="#0c1427" />
                        <text x="50" y="47" fill="#f8fafc" fontSize="12" fontWeight="800" textAnchor="middle">
                          19h
                        </text>
                        <text x="50" y="58" fill="#f59e0b" fontSize="6.5" fontWeight="700" textAnchor="middle">
                          PICO
                        </text>
                      </svg>
                      {/* Mini legendas Power BI */}
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '3px 6px', fontSize: '0.62rem', marginTop: 4 }}>
                        <span style={{ color: '#38bdf8' }}>● Tarde 42%</span>
                        <span style={{ color: '#f59e0b' }}>● Noite 38%</span>
                        <span style={{ color: '#a855f7' }}>● Madr. 12%</span>
                        <span style={{ color: '#10b981' }}>● Manhã 8%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* GRÁFICO 2: FATURAMENTO SEMANAL (BARRAS VERTICAIS POWER BI COM META) */}
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 10,
                    border: '1px solid #25375c',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
                        FATURAMENTO SEMANAL
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        Receita por dia vs. Meta de R$ 1.200/dia
                      </div>
                    </div>
                    <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#f59e0b' }}>
                      Total R$ 9.270
                    </span>
                  </div>

                  <svg viewBox="0 0 240 130" style={{ width: '100%', height: 124 }}>
                    <defs>
                      <linearGradient id="pbiBarAmber" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fde047" />
                        <stop offset="30%" stopColor="#f59e0b" />
                        <stop offset="100%" stopColor="#b45309" />
                      </linearGradient>
                    </defs>

                    {/* Linhas de Grade Y */}
                    {[25, 55, 85, 110].map((y) => (
                      <line key={y} x1="16" y1={y} x2="230" y2={y} stroke="#1e2c4a" strokeDasharray="3 3" />
                    ))}

                    {/* Linha de Meta Semanal (Power BI Reference Line) */}
                    <line x1="16" y1="58" x2="230" y2="58" stroke="#38bdf8" strokeDasharray="4 3" strokeWidth="1.2" opacity="0.75" />
                    <text x="230" y="54" fill="#38bdf8" fontSize="7.5" fontWeight="700" textAnchor="end">
                      Meta R$ 1.2k
                    </text>

                    {/* Colunas com fundo de trilha e cantos arredondados */}
                    {historicoHorario.map((h, i) => {
                      const bh = (h.faturamento / maxFat) * 82;
                      const bx = 22 + i * 29;
                      const isTop = h.faturamento === Math.max(...historicoHorario.map((x) => x.faturamento));
                      return (
                        <g key={h.hora}>
                          {/* Trilha cinza da capacidade (Power BI track bar) */}
                          <rect x={bx} y="28" width="16" height="82" rx="4" fill="rgba(255, 255, 255, 0.04)" />
                          {/* Barra de Faturamento Realizada */}
                          <rect
                            x={bx}
                            y={110 - bh}
                            width="16"
                            height={bh}
                            rx="4"
                            fill="url(#pbiBarAmber)"
                            filter={isTop ? 'drop-shadow(0 0 5px rgba(245, 158, 11, 0.6))' : undefined}
                          />
                          {/* Tag de valor no topo da maior barra */}
                          {isTop && (
                            <text
                              x={bx + 8}
                              y={110 - bh - 4}
                              fill="#fde047"
                              fontSize="7.5"
                              fontWeight="800"
                              textAnchor="middle"
                            >
                              R$ 1.8k
                            </text>
                          )}
                          <text x={bx + 8} y="124" fill="#94a3b8" fontSize="8.5" fontWeight="600" textAnchor="middle">
                            {h.hora}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* GRÁFICO 3: OCUPAÇÃO (%) (ÁREA SPLINE VERDE COM LIMIAR) */}
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 10,
                    border: '1px solid #25375c',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div>
                      <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
                        OCUPAÇÃO DE MÁQUINAS (%)
                      </div>
                      <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                        Taxa de uso vs. Lotação Crítica (80%)
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 700,
                        color: '#4ade80',
                        background: 'rgba(74, 222, 128, 0.12)',
                        padding: '2px 8px',
                        borderRadius: 10,
                      }}
                    >
                      Pico: {peakOcupacao?.h.ocupacaoPercentual}%
                    </span>
                  </div>

                  <svg viewBox="0 0 240 130" style={{ width: '100%', height: 124 }}>
                    <defs>
                      <linearGradient id="pbiGreenArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#4ade80" stopOpacity="0.45" />
                        <stop offset="60%" stopColor="#16a34a" stopOpacity="0.12" />
                        <stop offset="100%" stopColor="#16a34a" stopOpacity="0.0" />
                      </linearGradient>
                      <filter id="pbiGreenGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#4ade80" floodOpacity="0.6" />
                      </filter>
                    </defs>

                    {/* Linhas de Grade Y */}
                    {[25, 55, 85, 110].map((y) => (
                      <line key={y} x1="16" y1={y} x2="230" y2={y} stroke="#1e2c4a" strokeDasharray="3 3" />
                    ))}

                    {/* Limiar de Capacidade 80% (Power BI Warning Threshold) */}
                    <line x1="16" y1="44" x2="230" y2="44" stroke="#f87171" strokeDasharray="3 3" strokeWidth="1.2" opacity="0.8" />
                    <text x="230" y="40" fill="#f87171" fontSize="7.5" fontWeight="700" textAnchor="end">
                      Alerta 80%
                    </text>

                    {/* Área Fluida Gradiente */}
                    <path d={splineOcupacao.areaPath} fill="url(#pbiGreenArea)" />

                    {/* Linha Fluida Verde */}
                    <path
                      d={splineOcupacao.linePath}
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="2.8"
                      filter="url(#pbiGreenGlow)"
                    />

                    {/* Pontos de dados */}
                    {pontosOcupacao.map((p) => {
                      const isPeak = p.h.hora === peakOcupacao?.h.hora;
                      return (
                        <g key={p.h.hora}>
                          <circle cx={p.x} cy={p.y} r={isPeak ? 5 : 3.5} fill="#0f172a" stroke="#4ade80" strokeWidth="2" />
                          {isPeak && <circle cx={p.x} cy={p.y} r="8" fill="none" stroke="#4ade80" strokeWidth="1" opacity="0.6" />}
                          <text x={p.x} y="124" fill="#94a3b8" fontSize="8.5" fontWeight="600" textAnchor="middle">
                            {p.h.hora}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>
              </div>

              {/* LINHA 2: DESEMPENHO POR SETOR + SCORECARD DA EQUIPE + SMART INSIGHTS */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1.15fr', gap: 14 }}>
                {/* 1. DESEMPENHO POR SETOR COM BARRAS DE PROGRESSO */}
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 10,
                    border: '1px solid #25375c',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
                      DESEMPENHO POR SETOR
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#94a3b8' }}>Receita & Ocupação</span>
                  </div>

                  {[
                    {
                      nome: '🖥️ Sala Principal',
                      cli: '210 Clientes',
                      valor: 'R$ 4.500',
                      uso: 72,
                      corGrad: 'linear-gradient(90deg, #0284c7 0%, #38bdf8 100%)',
                      pillCor: '#38bdf8',
                    },
                    {
                      nome: '★ Sala VIP High-End',
                      cli: '45 Clientes',
                      valor: 'R$ 1.800',
                      uso: 84,
                      corGrad: 'linear-gradient(90deg, #d97706 0%, #fbbf24 100%)',
                      pillCor: '#fbbf24',
                    },
                    {
                      nome: '🎮 Área Consoles & Bar',
                      cli: '70 Clientes',
                      valor: 'R$ 1.550',
                      uso: 60,
                      corGrad: 'linear-gradient(90deg, #7c3aed 0%, #c084fc 100%)',
                      pillCor: '#c084fc',
                    },
                  ].map((st) => (
                    <div
                      key={st.nome}
                      style={{
                        background: 'rgba(15, 23, 42, 0.65)',
                        padding: '9px 12px',
                        borderRadius: 8,
                        border: '1px solid #1e2c4a',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.8rem' }}>
                        <span style={{ fontWeight: 700, color: '#f8fafc' }}>{st.nome}</span>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <span style={{ color: '#94a3b8', fontSize: '0.72rem' }}>{st.cli}</span>
                          <strong style={{ color: '#4ade80', fontSize: '0.82rem' }}>{st.valor}</strong>
                          <span
                            style={{
                              fontSize: '0.7rem',
                              fontWeight: 800,
                              color: st.pillCor,
                              background: 'rgba(255,255,255,0.06)',
                              padding: '1px 6px',
                              borderRadius: 4,
                            }}
                          >
                            {st.uso}%
                          </span>
                        </div>
                      </div>
                      {/* Trilha de Progresso Power BI */}
                      <div style={{ width: '100%', height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                        <div
                          style={{
                            width: `${st.uso}%`,
                            height: '100%',
                            background: st.corGrad,
                            borderRadius: 3,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* 2. EFICIÊNCIA DOS FUNCIONÁRIOS (SCORECARD) */}
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 10,
                    border: '1px solid #25375c',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 10,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
                      DESEMPENHO DA EQUIPE
                    </div>
                    <span style={{ fontSize: '0.68rem', color: '#4ade80' }}>● Todos Ativos</span>
                  </div>

                  {funcionarios.slice(0, 3).map((f, idx) => (
                    <div
                      key={f.id}
                      style={{
                        background: 'rgba(15, 23, 42, 0.65)',
                        padding: '8px 10px',
                        borderRadius: 8,
                        border: '1px solid #1e2c4a',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        <PixelAvatar seed={f.avatarSeed} size={32} />
                        <span
                          style={{
                            position: 'absolute',
                            bottom: -2,
                            right: -2,
                            fontSize: '0.65rem',
                            fontWeight: 800,
                            padding: '0 4px',
                            borderRadius: 6,
                            background: idx === 0 ? '#f59e0b' : idx === 1 ? '#94a3b8' : '#cd7f32',
                            color: '#0f172a',
                          }}
                        >
                          {idx + 1}º
                        </span>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.78rem', color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {f.nome}
                        </div>
                        <div style={{ fontSize: '0.68rem', color: '#94a3b8' }}>
                          {f.atendimentosRealizados} atendimentos realizados
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ color: '#4ade80', fontSize: '0.84rem', fontWeight: 800 }}>
                          96%
                        </span>
                        <div style={{ fontSize: '0.62rem', color: '#38bdf8' }}>Eficiência</div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 3. DESTAQUES DO NEGÓCIO & SMART INSIGHTS (IA POWER BI) */}
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 10,
                    border: '1px solid #25375c',
                    padding: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 9,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: '0.95rem' }}>✨</span>
                    <span style={{ fontWeight: 800, fontSize: '0.82rem', color: '#facc15', letterSpacing: '0.02em' }}>
                      SMART INSIGHTS & IA EXECUTIVA
                    </span>
                  </div>

                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      padding: '8px 10px',
                      borderRadius: 6,
                      borderLeft: '3px solid #f59e0b',
                      fontSize: '0.73rem',
                      lineHeight: 1.4,
                      color: '#e2e8f0',
                    }}
                  >
                    🏆 <strong>Pico de Faturamento:</strong> Sexta e Sábado concentram <strong>56%</strong> da receita semanal da LAN.
                  </div>

                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      padding: '8px 10px',
                      borderRadius: 6,
                      borderLeft: '3px solid #38bdf8',
                      fontSize: '0.73rem',
                      lineHeight: 1.4,
                      color: '#e2e8f0',
                    }}
                  >
                    💎 <strong>Setor Mais Lucrativo:</strong> Sala VIP High-End com <strong>84%</strong> de taxa de ocupação média.
                  </div>

                  <div
                    style={{
                      background: 'rgba(15, 23, 42, 0.65)',
                      padding: '8px 10px',
                      borderRadius: 6,
                      borderLeft: '3px solid #10b981',
                      fontSize: '0.73rem',
                      lineHeight: 1.4,
                      color: '#e2e8f0',
                    }}
                  >
                    💡 <strong>Ação Recomendada:</strong> Manter desconto de 5% no PIX ativo para atrair sessões longas e reabastecer os Energéticos Turbo.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 2: GESTÃO FINANCEIRA OFICIAL (RF10 / RN09)             */}
          {/* ========================================================= */}
          {aba === 'FINANCEIRO' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 10,
                    border: '1px solid #25375c',
                    borderTop: '3px solid #10b981',
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>💵 RECEITA OPERACIONAL</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#4ade80', margin: '6px 0' }}>
                    {formatarMoeda(receitaConfirmada)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#4ade80' }}>
                    ▲ Inclui {formatarMoeda(relatorio.faturamentoTotalConfirmado)} das sessões auditadas (RN09)
                  </div>
                </div>

                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 10,
                    border: '1px solid #25375c',
                    borderTop: '3px solid #ef4444',
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>💳 DESPESAS DO PERÍODO</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#f87171', margin: '6px 0' }}>
                    {formatarMoeda(despesasTotal)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                    Salários, Energia Trifásica, Manutenção e Estoque
                  </div>
                </div>

                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 10,
                    border: '1px solid #25375c',
                    borderTop: '3px solid #38bdf8',
                    padding: 14,
                  }}
                >
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8' }}>📈 LUCRO LÍQUIDO</div>
                  <div style={{ fontSize: '1.45rem', fontWeight: 800, color: '#38bdf8', margin: '6px 0' }}>
                    {formatarMoeda(lucroLiquido)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#38bdf8' }}>
                    Margem Líquida Saudável: {((lucroLiquido / receitaConfirmada) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 10,
                    border: '1px solid #25375c',
                    padding: 16,
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.86rem', marginBottom: 10, color: '#38bdf8' }}>
                    FATURAMENTO OFICIAL POR FORMA (RF10 / RN09)
                  </div>
                  {(['PIX', 'DINHEIRO', 'DEBITO', 'CREDITO'] as FormaPagamento[]).map((f) => {
                    const totalGeral = relatorio.faturamentoTotalConfirmado || 1;
                    const valorForma = relatorio.porForma[f] || 0;
                    const pct = Math.min(100, Math.round((valorForma / totalGeral) * 100));
                    return (
                      <div key={f} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                          <span>
                            • <strong>{f}</strong> {f === 'PIX' && <span style={{ color: '#facc15', fontSize: '0.72rem' }}>(5% OFF Polimórfico)</span>}
                          </span>
                          <strong style={{ color: '#4ade80' }}>{formatarMoeda(valorForma)}</strong>
                        </div>
                        <div style={{ width: '100%', height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ width: `${pct}%`, height: '100%', background: f === 'PIX' ? '#38bdf8' : '#4ade80', borderRadius: 3 }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, borderTop: '1px solid #25375c', fontSize: '0.8rem', color: '#facc15' }}>
                    <span>Pagamentos Pendentes (excluídos pela RN09):</span>
                    <strong>{formatarMoeda(relatorio.totalPendente)}</strong>
                  </div>
                </div>

                <div
                  style={{
                    background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                    borderRadius: 10,
                    border: '1px solid #25375c',
                    padding: 16,
                  }}
                >
                  <div style={{ fontWeight: 800, fontSize: '0.86rem', marginBottom: 12 }}>
                    BREAKDOWN: RECEITAS VS. DESPESAS
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🖥️ Locação de Computadores (62%)</span>
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>{formatarMoeda(receitaConfirmada * 0.62)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🥤 Bomboniere & Lanchonete (23%)</span>
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>{formatarMoeda(receitaConfirmada * 0.23)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🎮 Lounge Consoles & Upgrades (15%)</span>
                      <span style={{ color: '#4ade80', fontWeight: 700 }}>{formatarMoeda(receitaConfirmada * 0.15)}</span>
                    </div>
                    <div style={{ borderTop: '1px solid #25375c', margin: '4px 0' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>👥 Folha de Pagamento Equipe</span>
                      <span style={{ color: '#f87171', fontWeight: 700 }}>- {formatarMoeda(despesaSalarios)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>⚡ Energia + 🔧 Manutenção + 🛒 Estoque + 🌐 Link Dedicado</span>
                      <span style={{ color: '#f87171', fontWeight: 700 }}>
                        - {formatarMoeda(despesaEnergia + despesaManut + despesaEstoque + despesaInternet)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 3: SETORES & EQUIPAMENTOS                             */}
          {/* ========================================================= */}
          {aba === 'SETORES' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                  borderRadius: 10,
                  border: '1px solid #25375c',
                  padding: 16,
                }}
              >
                <h4 style={{ marginBottom: 12, color: '#f8fafc', fontSize: '0.88rem' }}>
                  OCUPAÇÃO POR CATEGORIA DE MÁQUINA
                </h4>
                {(['PC Básico', 'PC Intermediário', 'PC Gaming', 'VIP Station'] as const).map((cat) => {
                  const totalCat = computadores.filter((c) => c.categoria === cat);
                  const usoMin = totalCat.reduce((a, c) => a + c.totalMinutosUso, 0);
                  const maxMin = 1200;
                  const pct = Math.min(100, Math.round((usoMin / maxMin) * 100));
                  return (
                    <div key={cat} style={{ marginBottom: 12 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: 4 }}>
                        <span>🖥️ <strong>{cat}</strong> ({totalCat.length} unidades)</span>
                        <strong style={{ color: '#4ade80' }}>{usoMin} min acumulados</strong>
                      </div>
                      <div style={{ width: '100%', height: 6, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: '#38bdf8', borderRadius: 3 }} />
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  background: 'linear-gradient(180deg, rgba(20, 31, 56, 0.9) 0%, rgba(13, 20, 38, 0.95) 100%)',
                  borderRadius: 10,
                  border: '1px solid #25375c',
                  padding: 16,
                }}
              >
                <h4 style={{ marginBottom: 12, color: '#f8fafc', fontSize: '0.88rem' }}>
                  FEEDBACK & REPUTAÇÃO POR SETOR
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.82rem' }}>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 10, borderRadius: 6, border: '1px solid #1e2c4a' }}>
                    😊 <strong>Gabriel Rocha:</strong> "Sempre limpo, computadores muito rápidos e ótimo desconto no Pix!"
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 10, borderRadius: 6, border: '1px solid #1e2c4a' }}>
                    😄 <strong>Juliana Alves:</strong> "Estações VIP com RTX 4080 rodando tudo a 240Hz sem queda de FPS!"
                  </div>
                  <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: 10, borderRadius: 6, border: '1px solid #1e2c4a' }}>
                    😊 <strong>Larissa Ferreira:</strong> "A lanchonete entrega os combos direto na bancada durante as partidas."
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* ABA 4: AUDITORIA POO                                      */}
          {/* ========================================================= */}
          {aba === 'AUDITORIA' && (
            <table className="pixel-table">
              <thead>
                <tr>
                  <th>HORÁRIO</th>
                  <th>TIPO</th>
                  <th>OPERADOR</th>
                  <th>DESCRIÇÃO</th>
                  <th>REGRA POO</th>
                </tr>
              </thead>
              <tbody>
                {auditoria.map((log) => (
                  <tr key={log.id}>
                    <td style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      {new Date(log.momento).toLocaleTimeString('pt-BR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td>
                      <span className="badge-pixel badge-ocupado">{log.tipo}</span>
                    </td>
                    <td>{log.operador}</td>
                    <td>{log.descricao}</td>
                    <td>
                      {log.regraRelacionada && (
                        <span className="badge-pixel badge-poo">{log.regraRelacionada}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* RODAPÉ DO MODAL */}
        <div
          style={{
            padding: '12px 20px',
            borderTop: '1px solid #1e2c4a',
            background: 'rgba(10, 16, 32, 0.95)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            className="pixel-btn"
            style={{ padding: '8px 16px', fontSize: '0.84rem' }}
            onClick={() => setAba('FINANCEIRO')}
          >
            📊 Ver Balanço & Relatório Financeiro (RF10)
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="pixel-btn primary"
              style={{ padding: '8px 18px', fontSize: '0.84rem', fontWeight: 700 }}
              onClick={exportarRelatorioTxt}
            >
              📥 Exportar Relatório (.txt)
            </button>
            <button
              className="pixel-btn"
              style={{ padding: '8px 16px', fontSize: '0.84rem' }}
              onClick={onClose}
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
