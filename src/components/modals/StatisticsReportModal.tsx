import React, { useState } from 'react';
import {
  Computador,
  FormaPagamento,
  Funcionario,
  LinhaHoraria,
  LogAuditoria,
  RelatorioFinanceiro,
} from '../../domain/types';
import { formatarMoeda } from '../HudOverlay';
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
 * Une todas as telas analíticas das referências:
 * - Imagem 8: ESTATÍSTICAS (6 KPI Cards + Gráfico Movimento + Pizza Horários de Pico + Faturamento + Ocupação + Desempenho por Setor + Recomendações)
 * - Imagem 6: GESTÃO FINANCEIRA (Receita Total, Despesas, Lucro Líquido, Evolução Financeira, Fontes de Receita, Despesas Detalhadas, Balanço Mensal + RF10/RN09)
 * - Imagem 5: Hardware & Categorias de Máquina + Auditoria POO
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

  // Cálculo da Gestão Financeira (Imagem 6) conectado aos dados reais + operação da LAN
  const receitaConfirmada = relatorio.faturamentoTotalConfirmado + 5720;
  const despesaSalarios = 1280;
  const despesaEnergia = 420;
  const despesaManut = 310;
  const despesaEstoque = 220;
  const despesaOutros = 160;
  const despesasTotal =
    despesaSalarios + despesaEnergia + despesaManut + despesaEstoque + despesaOutros;
  const lucroLiquido = receitaConfirmada - despesasTotal;

  const maxChegadas = Math.max(180, ...historicoHorario.map((h) => h.chegadas));
  const maxFat = Math.max(2000, ...historicoHorario.map((h) => h.faturamento));

  const exportarRelatorioTxt = () => {
    const conteudo = [
      '=========================================================',
      ' BALANÇO & RELATÓRIO FINANCEIRO — LAN HOUSE (RF10 / RN09)',
      '=========================================================',
      `Período: ${periodo}`,
      `Faturamento de Sessões Confirmadas (RN09): ${formatarMoeda(relatorio.faturamentoTotalConfirmado)}`,
      `  • PIX (5% OFF):   ${formatarMoeda(relatorio.porForma.PIX)}`,
      `  • DINHEIRO:       ${formatarMoeda(relatorio.porForma.DINHEIRO)}`,
      `  • CARTÃO DÉBITO:  ${formatarMoeda(relatorio.porForma.DEBITO)}`,
      `  • CARTÃO CRÉDITO: ${formatarMoeda(relatorio.porForma.CREDITO)}`,
      `Pagamentos Pendentes (excluídos pela RN09): ${formatarMoeda(relatorio.totalPendente)}`,
      `Pagamentos Estornados: ${formatarMoeda(relatorio.totalEstornado)}`,
      '=========================================================',
    ].join('\n');
    const blob = new Blob([conteudo], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'balanco-lanhouse-poo.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-window"
        style={{ width: 'min(1060px, 96vw)', maxHeight: '89vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pixel-modal-header">
          <div className="pixel-modal-title">
            <span className="pixel-close-bracket" onClick={onClose}>
              [ X ]
            </span>
            <span>
              {aba === 'FINANCEIRO'
                ? 'GESTÃO FINANCEIRA & RELATÓRIO OFICIAL (RF10)'
                : 'ESTATÍSTICAS DA LAN HOUSE'}
            </span>
            <span className="badge-pixel badge-poo">RF10 • RN09 • RN10</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Período:</span>
            <select
              className="pixel-select"
              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value)}
            >
              <option value="Últimos 7 dias">Últimos 7 dias</option>
              <option value="Hoje">Hoje</option>
              <option value="Últimos 30 dias">Últimos 30 dias</option>
              <option value="Todo o período">Todo o período</option>
            </select>
          </div>
        </div>

        {/* 6 KPI CARDS NO TOPO FIÉIS À IMAGEM 8! */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(6, 1fr)',
            gap: 8,
            padding: '10px 18px',
            background: 'rgba(12, 19, 36, 0.72)',
          }}
        >
          {[
            { label: 'CLIENTES ATENDIDOS', val: `👤 ${320 + totalClientes}`, sub: '+15% vs. Per. Ant.', cor: '#f8fafc' },
            { label: 'FATURAMENTO (RN09)', val: formatarMoeda(relatorio.faturamentoTotalConfirmado), sub: `${relatorio.pagamentosConfirmadosCount} confirmados`, cor: '#4ade80' },
            { label: 'LUCRO LÍQUIDO', val: formatarMoeda(lucroLiquido), sub: '+18% vs. Per. Ant.', cor: '#86efac' },
            { label: 'OCUPAÇÃO MÉDIA', val: `🖥️ ${ocupacaoMedia}%`, sub: '+5% vs. Per. Ant.', cor: '#38bdf8' },
            { label: 'SATISFAÇÃO CLIENTE', val: '😊 4.8 ★', sub: '+0.2★ vs. Per. Ant.', cor: '#facc15' },
            { label: 'REPUTAÇÃO LAN HOUSE', val: `🛡️ ${reputacao}%`, sub: '+2% vs. Per. Ant.', cor: '#c084fc' },
          ].map((k) => (
            <div key={k.label} className="pixel-subcard" style={{ padding: '8px 8px', textAlign: 'center' }}>
              <div style={{ fontSize: '0.65rem', color: '#cbd5e1', fontWeight: 700 }}>{k.label}</div>
              <div style={{ fontSize: '1.02rem', fontWeight: 700, color: k.cor, margin: '4px 0' }}>
                {k.val}
              </div>
              <div style={{ fontSize: '0.64rem', color: '#4ade80' }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* ABAS */}
        <div className="pixel-tabs">
          <button
            className={`pixel-tab ${aba === 'GERAL' ? 'active' : ''}`}
            onClick={() => setAba('GERAL')}
          >
            VISÃO GERAL
          </button>
          <button
            className={`pixel-tab ${aba === 'FINANCEIRO' ? 'active' : ''}`}
            onClick={() => setAba('FINANCEIRO')}
          >
            GESTÃO FINANCEIRA & BALANÇO (RF10 / RN09)
          </button>
          <button
            className={`pixel-tab ${aba === 'SETORES' ? 'active' : ''}`}
            onClick={() => setAba('SETORES')}
          >
            SETORES & EQUIPAMENTOS
          </button>
          <button
            className={`pixel-tab ${aba === 'AUDITORIA' ? 'active' : ''}`}
            onClick={() => setAba('AUDITORIA')}
          >
            AUDITORIA POO ({auditoria.length})
          </button>
        </div>

        <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1 }}>
          {/* ABA 1: VISÃO GERAL FIEL À IMAGEM 8 */}
          {aba === 'GERAL' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: 12 }}>
                {/* Movimento de Clientes + Pizza Horários de Pico (Imagem 8!) */}
                <div className="pixel-subcard" style={{ padding: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
                    <span>MOVIMENTO DE CLIENTES</span>
                    <span style={{ color: '#94a3b8' }}>Horários de Pico</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <svg viewBox="0 0 210 110" style={{ flex: 1, height: 108 }}>
                      {[25, 55, 85].map((y) => (
                        <line key={y} x1="18" y1={y} x2="200" y2={y} stroke="#233559" />
                      ))}
                      <polyline
                        fill="none"
                        stroke="#38bdf8"
                        strokeWidth="2.5"
                        points={historicoHorario
                          .map((h, i) => `${24 + i * 28},${92 - (h.chegadas / maxChegadas) * 68}`)
                          .join(' ')}
                      />
                      {historicoHorario.map((h, i) => (
                        <text key={h.hora} x={24 + i * 28} y="106" fill="#94a3b8" fontSize="9" textAnchor="middle">
                          {h.hora}
                        </text>
                      ))}
                    </svg>
                    {/* Gráfico de Pizza SVG (Imagem 8) */}
                    <svg width="76" height="76" viewBox="0 0 36 36">
                      <circle cx="18" cy="18" r="15.9" fill="#1d4ed8" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="transparent"
                        stroke="#38bdf8"
                        strokeWidth="10"
                        strokeDasharray="42 58"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.9"
                        fill="transparent"
                        stroke="#f59e0b"
                        strokeWidth="10"
                        strokeDasharray="24 76"
                        strokeDashoffset="-42"
                      />
                    </svg>
                  </div>
                </div>

                {/* Faturamento em Barras Laranja (Imagem 8!) */}
                <div className="pixel-subcard" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
                    FATURAMENTO SEMANAL
                  </div>
                  <svg viewBox="0 0 220 110" style={{ width: '100%', height: 108 }}>
                    {[25, 55, 85].map((y) => (
                      <line key={y} x1="18" y1={y} x2="210" y2={y} stroke="#233559" />
                    ))}
                    {historicoHorario.map((h, i) => {
                      const bh = (h.faturamento / maxFat) * 68;
                      return (
                        <g key={h.hora}>
                          <rect x={22 + i * 27} y={92 - bh} width="14" height={bh} fill="#f59e0b" />
                          <text x={29 + i * 27} y="106" fill="#94a3b8" fontSize="9" textAnchor="middle">
                            {h.hora}
                          </text>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Ocupação em Área Verde (Imagem 8!) */}
                <div className="pixel-subcard" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 700, marginBottom: 6 }}>
                    OCUPAÇÃO (%)
                  </div>
                  <svg viewBox="0 0 220 110" style={{ width: '100%', height: 108 }}>
                    {[25, 55, 85].map((y) => (
                      <line key={y} x1="18" y1={y} x2="210" y2={y} stroke="#233559" />
                    ))}
                    <polygon
                      fill="rgba(74, 222, 128, 0.2)"
                      points={`24,92 ${historicoHorario
                        .map((h, i) => `${24 + i * 28},${92 - (h.ocupacaoPercentual / 100) * 68}`)
                        .join(' ')} 192,92`}
                    />
                    <polyline
                      fill="none"
                      stroke="#4ade80"
                      strokeWidth="2.5"
                      points={historicoHorario
                        .map((h, i) => `${24 + i * 28},${92 - (h.ocupacaoPercentual / 100) * 68}`)
                        .join(' ')}
                    />
                  </svg>
                </div>
              </div>

              {/* Linha Inferior da Imagem 8: Desempenho por Setor + Equipe + Destaques/Recomendações */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1fr 1.1fr', gap: 12 }}>
                <div className="pixel-subcard" style={{ padding: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 8 }}>
                    DESEMPENHO POR SETOR
                  </div>
                  {[
                    { nome: '🖥️ Sala Principal', cli: '210 Clientes', valor: 'R$ 4.500', uso: '72%' },
                    { nome: '★ Sala VIP High-End', cli: '45 Clientes', valor: 'R$ 1.800', uso: '84%' },
                    { nome: '🎮 Área Consoles & Bar', cli: '70 Clientes', valor: 'R$ 1.550', uso: '60%' },
                  ].map((st) => (
                    <div
                      key={st.nome}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.78rem',
                        padding: '6px 0',
                        borderBottom: '1px solid #1e2d4d',
                      }}
                    >
                      <strong>{st.nome}</strong>
                      <span style={{ color: '#94a3b8' }}>{st.cli}</span>
                      <span style={{ color: '#4ade80' }}>{st.valor}</span>
                      <span style={{ color: '#38bdf8' }}>{st.uso}</span>
                    </div>
                  ))}
                </div>

                <div className="pixel-subcard" style={{ padding: 12 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.82rem', marginBottom: 8 }}>
                    DESEMPENHO DOS FUNCIONÁRIOS
                  </div>
                  {funcionarios.slice(0, 3).map((f) => (
                    <div
                      key={f.id}
                      style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 7 }}
                    >
                      <PixelAvatar seed={f.avatarSeed} size={30} />
                      <div style={{ flex: 1, fontSize: '0.75rem' }}>
                        <div style={{ fontWeight: 700 }}>{f.nome}</div>
                        <div style={{ color: '#94a3b8' }}>
                          Atendimentos: {f.atendimentosRealizados}
                        </div>
                      </div>
                      <span style={{ color: '#4ade80', fontSize: '0.75rem', fontWeight: 700 }}>
                        96%
                      </span>
                    </div>
                  ))}
                </div>

                <div className="pixel-subcard" style={{ padding: 12, fontSize: '0.76rem' }}>
                  <div style={{ fontWeight: 700, color: '#facc15', marginBottom: 6 }}>
                    ★ DESTAQUES DO NEGÓCIO & RECOMENDAÇÕES
                  </div>
                  <div style={{ color: '#cbd5e1', lineHeight: 1.45 }}>
                    • Melhor Dia de Faturamento: <strong>Sexta & Sábado</strong>
                    <br />• Setor Mais Lucrativo: <strong>Sala VIP High-End</strong>
                    <br />• 💡 <em>Recomendação:</em> Mantenha o Pix ativo (5% OFF polimórfico aumenta fidelidade) e reponha estoque de Sodas!
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA 2: GESTÃO FINANCEIRA COMPLETA FIEL À IMAGEM 6 + RF10/RN09! */}
          {aba === 'FINANCEIRO' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* 3 Cards Grandes da Imagem 6: RECEITA TOTAL, DESPESAS TOTAL, LUCRO LÍQUIDO */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                <div className="pixel-subcard" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>💵 RECEITA OPERACIONAL</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#4ade80', margin: '4px 0' }}>
                    {formatarMoeda(receitaConfirmada)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#4ade80' }}>
                    ▲ Inclui {formatarMoeda(relatorio.faturamentoTotalConfirmado)} das sessões atuais (RN09)
                  </div>
                </div>
                <div className="pixel-subcard" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>💳 DESPESAS DO PERÍODO</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#f87171', margin: '4px 0' }}>
                    {formatarMoeda(despesasTotal)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#fca5a5' }}>
                    Salários, Energia, Manutenção e Estoque
                  </div>
                </div>
                <div className="pixel-subcard" style={{ padding: 12 }}>
                  <div style={{ fontSize: '0.78rem', fontWeight: 700 }}>📈 LUCRO LÍQUIDO</div>
                  <div style={{ fontSize: '1.3rem', fontWeight: 700, color: '#4ade80', margin: '4px 0' }}>
                    {formatarMoeda(lucroLiquido)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: '#4ade80' }}>
                    Balanço Geral: Negócio Altamente Lucrativo
                  </div>
                </div>
              </div>

              {/* 2x2 Grid da Imagem 6 + Tabela Oficial por Forma de Pagamento RF10 */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div className="pixel-subcard" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 8, color: '#38bdf8' }}>
                    FATURAMENTO OFICIAL POR FORMA (RF10 / RN09)
                  </div>
                  {(['PIX', 'DINHEIRO', 'DEBITO', 'CREDITO'] as FormaPagamento[]).map((f) => (
                    <div
                      key={f}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '5px 0',
                        borderBottom: '1px solid #1e2d4d',
                        fontSize: '0.83rem',
                      }}
                    >
                      <span>• {f}</span>
                      <strong style={{ color: '#4ade80' }}>{formatarMoeda(relatorio.porForma[f])}</strong>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, fontSize: '0.8rem', color: '#facc15' }}>
                    <span>Pagamentos Pendentes (fora da RN09):</span>
                    <strong>{formatarMoeda(relatorio.totalPendente)}</strong>
                  </div>
                </div>

                <div className="pixel-subcard" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', marginBottom: 8 }}>
                    PRINCIPAIS FONTES DE RECEITA & DESPESAS DETALHADAS
                  </div>
                  <div style={{ fontSize: '0.8rem', display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🖥️ Computadores (62%)</span>
                      <span style={{ color: '#4ade80' }}>{formatarMoeda(receitaConfirmada * 0.62)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>🥤 Lanchonete / Bomboniere (23%)</span>
                      <span style={{ color: '#4ade80' }}>{formatarMoeda(receitaConfirmada * 0.23)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #1e2d4d', paddingTop: 5 }}>
                      <span>👥 Salários Equipe</span>
                      <span style={{ color: '#f87171' }}>- {formatarMoeda(despesaSalarios)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>⚡ Energia + 🔧 Manutenção + 🛒 Estoque</span>
                      <span style={{ color: '#f87171' }}>
                        - {formatarMoeda(despesaEnergia + despesaManut + despesaEstoque + despesaOutros)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {aba === 'SETORES' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div className="pixel-subcard" style={{ padding: 14 }}>
                <h4 style={{ marginBottom: 10 }}>OCUPAÇÃO POR CATEGORIA DE MÁQUINA</h4>
                {(['PC Básico', 'PC Intermediário', 'PC Gaming', 'VIP Station'] as const).map((cat) => {
                  const totalCat = computadores.filter((c) => c.categoria === cat);
                  const usoMin = totalCat.reduce((a, c) => a + c.totalMinutosUso, 0);
                  return (
                    <div
                      key={cat}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '8px 0',
                        borderBottom: '1px solid #1e2d4d',
                      }}
                    >
                      <span>🖥️ {cat} ({totalCat.length} un.)</span>
                      <strong style={{ color: '#4ade80' }}>{usoMin} min acumulados</strong>
                    </div>
                  );
                })}
              </div>

              <div className="pixel-subcard" style={{ padding: 14 }}>
                <h4 style={{ marginBottom: 10 }}>AVALIAÇÕES RECENTES DOS CLIENTES</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.82rem' }}>
                  <div>😊 <strong>Gabriel Rocha:</strong> "Sempre limpo, muito rápido e ótimo desconto no Pix!"</div>
                  <div>😄 <strong>Juliana Alves:</strong> "Estações VIP com RTX 4080 rodando tudo liso!"</div>
                  <div>😊 <strong>Larissa Ferreira:</strong> "Lanchonete entrega direto na bancada durante a sessão!"</div>
                </div>
              </div>
            </div>
          )}

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

        <div
          style={{
            padding: '11px 18px',
            borderTop: '2px solid #283a5e',
            background: 'rgba(12, 19, 36, 0.92)',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <button className="pixel-btn" onClick={() => setAba('FINANCEIRO')}>
            [ Ver Balanço & Relatório Completo ]
          </button>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="pixel-btn primary" onClick={exportarRelatorioTxt}>
              [ Exportar / Imprimir Balanço ]
            </button>
            <button className="pixel-btn" onClick={onClose}>
              [ Fechar ]
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
