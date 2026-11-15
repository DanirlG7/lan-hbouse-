import React, { useState } from 'react';
import { Cliente, FormaPagamento, Pagamento, Sessao } from '../../domain/types';
import { PROCESSADORES_PAGAMENTO } from '../../domain/LanHouseEngine';
import { formatarMoeda, formatarDuracao } from '../HudOverlay';
import { PixelAvatar } from '../PixelSprites';

interface Props {
  clientes: Cliente[];
  sessoes: Sessao[];
  pagamentos: Pagamento[];
  sessaoCheckoutInicial: number | null;
  abaInicial?: 'CLIENTES' | 'PAGAMENTOS';
  onClose: () => void;
  onCadastrarCliente: (nome: string, telefone: string, identificador: string) => void;
  onRegistrarPagamento: (sessaoId: number, forma: FormaPagamento, confirmar: boolean) => void;
  onConfirmarPagamento: (pagamentoId: number) => void;
  onEstornarPagamento: (pagamentoId: number) => void;
}

export const ClientsPaymentsModal: React.FC<Props> = ({
  clientes,
  sessoes,
  pagamentos,
  sessaoCheckoutInicial,
  abaInicial = 'CLIENTES',
  onClose,
  onCadastrarCliente,
  onRegistrarPagamento,
  onConfirmarPagamento,
  onEstornarPagamento,
}) => {
  const [aba, setAba] = useState<'CLIENTES' | 'PAGAMENTOS'>(
    sessaoCheckoutInicial ? 'PAGAMENTOS' : abaInicial
  );
  const [busca, setBusca] = useState('');
  const [clienteSelId, setClienteSelId] = useState<number>(clientes[0]?.id || 1);

  // Novo Cliente (RF01)
  const [novoNome, setNovoNome] = useState('');
  const [novoTel, setNovoTel] = useState('');
  const [novoDoc, setNovoDoc] = useState('');

  // Checkout Pagamento (RF08)
  const sessoesSemPagamento = sessoes.filter(
    (s) =>
      s.status === 'ENCERRADA' &&
      !pagamentos.some((p) => p.sessaoId === s.id && p.status !== 'ESTORNADO')
  );
  const [sessaoPagId, setSessaoPagId] = useState<number>(
    sessaoCheckoutInicial || sessoesSemPagamento[0]?.id || sessoes[0]?.id || 101
  );
  const [formaPag, setFormaPag] = useState<FormaPagamento>('PIX');
  const [confirmarAuto, setConfirmarAuto] = useState(true);

  // Estados do Checkout Moderno (estilo Mobbin / Fintechs)
  const [valorRecebidoDinheiro, setValorRecebidoDinheiro] = useState('');
  const [comprovanteAberto, setComprovanteAberto] = useState<Pagamento | null>(null);
  const [filtroStatusPag, setFiltroStatusPag] = useState<'TODOS' | 'CONFIRMADO' | 'PENDENTE' | 'ESTORNADO'>('TODOS');
  const [buscaPag, setBuscaPag] = useState('');
  const [pixCopiado, setPixCopiado] = useState(false);

  const clientesFiltrados = clientes.filter(
    (c) =>
      c.nome.toLowerCase().includes(busca.toLowerCase()) ||
      c.identificador.toLowerCase().includes(busca.toLowerCase()) ||
      c.telefone.includes(busca)
  );

  const clienteSelecionado =
    clientes.find((c) => c.id === clienteSelId) || clientesFiltrados[0];
  const historicoCliente = clienteSelecionado
    ? sessoes.filter((s) => s.clienteId === clienteSelecionado.id)
    : [];

  const gastoTotalCliente = historicoCliente.reduce((acc, s) => acc + s.valorTotal, 0);
  const ticketMedioCliente =
    historicoCliente.length > 0 ? gastoTotalCliente / historicoCliente.length : 0;
  const tempoTotalCliente = historicoCliente.reduce((acc, s) => acc + s.minutosUtilizados, 0);

  const sessaoParaPagar = sessoes.find((s) => s.id === sessaoPagId);
  const simulacaoCalculo = sessaoParaPagar
    ? PROCESSADORES_PAGAMENTO[formaPag].calcularTotal(sessaoParaPagar.valorTotal)
    : { desconto: 0, valorFinal: 0 };

  const handleSubmitCliente = (e: React.FormEvent) => {
    e.preventDefault();
    onCadastrarCliente(novoNome, novoTel, novoDoc);
    setNovoNome('');
    setNovoTel('');
    setNovoDoc('');
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-window"
        style={{
          width: 'min(1100px, 96vw)',
          maxHeight: '90vh',
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
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.25) 0%, rgba(5, 150, 105, 0.35) 100%)',
                border: '1px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 12px rgba(16, 185, 129, 0.3)',
              }}
            >
              {/* Ícone de Caixa / Carteira HD */}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <rect x="3" y="6" width="18" height="14" rx="3" stroke="#34d399" strokeWidth="2" />
                <path d="M3 10h18" stroke="#34d399" strokeWidth="1.5" />
                <circle cx="16" cy="14" r="1.5" fill="#34d399" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#f8fafc', letterSpacing: '0.02em' }}>
                  CLIENTES, HISTÓRICO & CAIXA DE PAGAMENTOS
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
                  RF01 • RF02 • RF08 • RF09 • RN06–RN09
                </span>
              </div>
              <div style={{ fontSize: '0.74rem', color: '#94a3b8', marginTop: 1 }}>
                Gestão cadastral, fidelidade pontuada, checkout digital polimórfico e estorno
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

        {/* NAVEGAÇÃO DE ABAS MODERNA */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '8px 22px',
            background: 'rgba(12, 19, 36, 0.95)',
            borderBottom: '1px solid #1e2c4a',
          }}
        >
          <button
            onClick={() => setAba('CLIENTES')}
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: aba === 'CLIENTES' ? '#2563eb' : 'transparent',
              color: aba === 'CLIENTES' ? '#ffffff' : '#94a3b8',
              boxShadow: aba === 'CLIENTES' ? '0 0 10px rgba(37, 99, 235, 0.5)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span>👤</span>
            <span>Cadastro, Busca & Histórico (RF01 / RF02 / RF09)</span>
          </button>

          <button
            onClick={() => setAba('PAGAMENTOS')}
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              fontWeight: 700,
              borderRadius: 6,
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              background: aba === 'PAGAMENTOS' ? '#10b981' : 'transparent',
              color: aba === 'PAGAMENTOS' ? '#ffffff' : '#94a3b8',
              boxShadow: aba === 'PAGAMENTOS' ? '0 0 10px rgba(16, 185, 129, 0.5)' : 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span>💳</span>
            <span>Registrar Pagamento</span>
            {sessoesSemPagamento.length > 0 && (
              <span
                style={{
                  fontSize: '0.66rem',
                  fontWeight: 800,
                  padding: '1px 6px',
                  borderRadius: 10,
                  background: '#f59e0b',
                  color: '#0f172a',
                }}
              >
                {sessoesSemPagamento.length} pendentes
              </span>
            )}
          </button>
        </div>

        <div style={{ padding: 18, overflowY: 'auto', flex: 1 }}>
          {aba === 'CLIENTES' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.05fr 1.25fr', gap: 16 }}>
              {/* Coluna Esquerda: Cadastro RF01 + Busca RF02 */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <form
                  onSubmit={handleSubmitCliente}
                  className="pixel-subcard"
                  style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#38bdf8' }}>
                    + Cadastrar Novo Cliente (RF01)
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    <input
                      className="pixel-input"
                      placeholder="Nome completo..."
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                    />
                    <input
                      className="pixel-input"
                      placeholder="CPF / Identificador..."
                      value={novoDoc}
                      onChange={(e) => setNovoDoc(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="pixel-input"
                      style={{ flex: 1 }}
                      placeholder="Telefone: (11) 99999-0000"
                      value={novoTel}
                      onChange={(e) => setNovoTel(e.target.value)}
                    />
                    <button type="submit" className="pixel-btn primary" style={{ padding: '8px 14px', fontSize: '0.84rem' }}>
                      Salvar Cliente
                    </button>
                  </div>
                </form>

                {/* Pesquisa RF02 */}
                <input
                  className="pixel-input"
                  placeholder="🔍 Pesquisar cliente por nome, CPF ou telefone (RF02)..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    maxHeight: 320,
                    overflowY: 'auto',
                  }}
                >
                  {clientesFiltrados.map((c) => {
                    const isSel = clienteSelecionado?.id === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setClienteSelId(c.id)}
                        className="pixel-subcard"
                        style={{
                          padding: '9px 12px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          borderColor: isSel ? '#38bdf8' : '#314770',
                          background: isSel ? 'rgba(14, 165, 233, 0.16)' : undefined,
                        }}
                      >
                        <PixelAvatar seed={c.avatarSeed} size={36} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.9rem' }}>
                            {c.nome}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                            Doc: {c.identificador} • {c.telefone}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.74rem', color: '#facc15', fontWeight: 700 }}>
                          ★ {c.fidelidadePontos} pts
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Coluna Direita: Histórico Completo do Cliente (RF09) */}
              <div className="pixel-subcard" style={{ padding: 14 }}>
                {clienteSelecionado ? (
                  <>
                    <div
                      style={{
                        borderBottom: '1px solid #2b3f66',
                        paddingBottom: 10,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <PixelAvatar seed={clienteSelecionado.avatarSeed} size={44} />
                        <div>
                          <h3 style={{ fontSize: '1.02rem', color: '#f8fafc' }}>
                            Histórico de {clienteSelecionado.nome} (RF09)
                          </h3>
                          <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                            ID #{clienteSelecionado.id} • CPF/ID: {clienteSelecionado.identificador} •{' '}
                            {historicoCliente.length} sessão(ões)
                          </div>
                        </div>
                      </div>

                      {/* MÉTRICAS REAIS DO CLIENTE (TICKET MÉDIO E TEMPO TOTAL) */}
                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            background: 'rgba(250, 204, 21, 0.12)',
                            border: '1px solid rgba(250, 204, 21, 0.3)',
                            color: '#facc15',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 700,
                          }}
                        >
                          🎯 Média de Gasto Real: {formatarMoeda(ticketMedioCliente)}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            background: 'rgba(56, 189, 248, 0.12)',
                            border: '1px solid rgba(56, 189, 248, 0.3)',
                            color: '#38bdf8',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 700,
                          }}
                        >
                          ⏱️ Tempo em Máquinas: {formatarDuracao(tempoTotalCliente)}
                        </span>
                        <span
                          style={{
                            fontSize: '0.72rem',
                            background: 'rgba(74, 222, 128, 0.12)',
                            border: '1px solid rgba(74, 222, 128, 0.3)',
                            color: '#4ade80',
                            padding: '2px 8px',
                            borderRadius: 4,
                            fontWeight: 700,
                          }}
                        >
                          💳 Total Gasto: {formatarMoeda(gastoTotalCliente)}
                        </span>
                      </div>
                    </div>

                    {historicoCliente.length === 0 ? (
                      <div style={{ color: '#94a3b8', padding: 20, textAlign: 'center' }}>
                        Este cliente ainda não realizou sessões na LAN House.
                      </div>
                    ) : (
                      <table className="pixel-table">
                        <thead>
                          <tr>
                            <th>SESSÃO</th>
                            <th>PC</th>
                            <th>DURAÇÃO</th>
                            <th>TOTAL</th>
                            <th>PAGAMENTO</th>
                          </tr>
                        </thead>
                        <tbody>
                          {historicoCliente.map((s) => {
                            const pag = pagamentos.find((p) => p.sessaoId === s.id);
                            return (
                              <tr key={s.id}>
                                <td style={{ fontWeight: 700, color: '#7dd3fc' }}>#{s.id}</td>
                                <td>PC-{String(s.computadorNumero).padStart(2, '0')}</td>
                                <td>{formatarDuracao(s.minutosUtilizados)}</td>
                                <td style={{ color: '#4ade80', fontWeight: 700 }}>
                                  {formatarMoeda(s.valorTotal)}
                                </td>
                                <td>
                                  {pag ? (
                                    <span
                                      className={`badge-pixel ${
                                        pag.status === 'CONFIRMADO'
                                          ? 'badge-livre'
                                          : pag.status === 'PENDENTE'
                                          ? 'badge-manutencao'
                                          : 'badge-poo'
                                      }`}
                                    >
                                      {pag.forma} ({pag.status})
                                    </span>
                                  ) : s.status === 'ATIVA' ? (
                                    <span className="badge-pixel badge-ocupado">EM USO</span>
                                  ) : (
                                    <button
                                      className="pixel-btn warning"
                                      style={{ padding: '4px 10px', fontSize: '0.78rem' }}
                                      onClick={() => {
                                        setSessaoPagId(s.id);
                                        setAba('PAGAMENTOS');
                                      }}
                                    >
                                      Pagar
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </>
                ) : null}
              </div>
            </div>
          )}

          {aba === 'PAGAMENTOS' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* ALERTA DE SESSÕES AGUARDANDO ACERTO DE CONTAS */}
              {sessoesSemPagamento.length > 0 ? (
                <div
                  style={{
                    background: 'linear-gradient(90deg, rgba(234, 179, 8, 0.12), rgba(245, 158, 11, 0.08))',
                    border: '1px solid #eab308',
                    borderRadius: 6,
                    padding: '10px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '0.86rem', fontWeight: 700, color: '#facc15' }}>
                      ⚡ {sessoesSemPagamento.length} Sessão(ões) Encerrada(s) Aguardando Pagamento no Balcão:
                    </span>
                    <span style={{ fontSize: '0.74rem', color: '#cbd5e1' }}>Clique em um card para carregar no checkout</span>
                  </div>

                  <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
                    {sessoesSemPagamento.map((s) => {
                      const isSel = s.id === sessaoPagId;
                      return (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSessaoPagId(s.id);
                            setValorRecebidoDinheiro('');
                          }}
                          style={{
                            minWidth: 220,
                            padding: '8px 12px',
                            borderRadius: 6,
                            cursor: 'pointer',
                            background: isSel ? 'rgba(14, 165, 233, 0.25)' : 'rgba(15, 23, 42, 0.85)',
                            border: `2px solid ${isSel ? '#38bdf8' : '#334b72'}`,
                            boxShadow: isSel ? '0 0 12px rgba(56, 189, 248, 0.35)' : 'none',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#f8fafc' }}>
                              #{s.id} · {s.clienteNome}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                              PC-{String(s.computadorNumero).padStart(2, '0')} ({formatarDuracao(s.minutosUtilizados)})
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#4ade80' }}>
                              {formatarMoeda(s.valorTotal)}
                            </div>
                            <span className="badge-pixel badge-manutencao" style={{ fontSize: '0.64rem', padding: '1px 5px' }}>
                              A Pagar
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              {/* GRID PRINCIPAL: CHECKOUT MODERNO (ESQUERDA) + HISTÓRICO & FILTROS (DIREITA) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 1.35fr', gap: 16 }}>
                {/* COLUNA ESQUERDA: CHECKOUT TIPO FINTECH (NUBANK / MERCADO PAGO) */}
                <div className="pixel-subcard" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #283e66', paddingBottom: 8 }}>
                    <div>
                      <h3 style={{ fontSize: '1.05rem', color: '#4ade80', fontWeight: 700 }}>
                        💳 Caixa & Checkout Digital
                      </h3>
                      <div style={{ fontSize: '0.76rem', color: '#94a3b8' }}>
                        Polimorfismo POO: cálculo de desconto, emissão de PIX e troco automático
                      </div>
                    </div>
                    {sessaoParaPagar && (
                      <span className="badge-pixel badge-ocupado" style={{ fontSize: '0.76rem' }}>
                        Sessão #{sessaoParaPagar.id}
                      </span>
                    )}
                  </div>

                  {/* SELETOR DE SESSÃO */}
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: 4 }}>
                      Selecionar Sessão p/ Pagamento:
                    </label>
                    <select
                      className="pixel-select"
                      style={{ width: '100%', fontSize: '0.84rem' }}
                      value={sessaoPagId}
                      onChange={(e) => {
                        setSessaoPagId(Number(e.target.value));
                        setValorRecebidoDinheiro('');
                      }}
                    >
                      {sessoes.map((s) => (
                        <option key={s.id} value={s.id}>
                          Sessão #{s.id} — {s.clienteNome} (PC-{String(s.computadorNumero).padStart(2, '0')}) — {s.status} — {formatarMoeda(s.valorTotal)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* CARDS VISUAIS DE FORMA DE PAGAMENTO (GRID 2x2) */}
                  <div>
                    <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600, display: 'block', marginBottom: 6 }}>
                      Forma de Pagamento:
                    </label>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {/* CARD PIX */}
                      <div
                        onClick={() => setFormaPag('PIX')}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: formaPag === 'PIX' ? 'rgba(6, 78, 59, 0.4)' : 'rgba(15, 23, 42, 0.75)',
                          border: `2px solid ${formaPag === 'PIX' ? '#10b981' : '#283c5e'}`,
                          boxShadow: formaPag === 'PIX' ? '0 0 10px rgba(16, 185, 129, 0.35)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>💠 PIX</span>
                          <span style={{ fontSize: '0.64rem', fontWeight: 800, background: '#10b981', color: '#022c22', padding: '1px 6px', borderRadius: 4 }}>
                            5% OFF
                          </span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#6ee7b7' }}>QR Code & Chave Copia e Cola</span>
                      </div>

                      {/* CARD DINHEIRO */}
                      <div
                        onClick={() => setFormaPag('DINHEIRO')}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: formaPag === 'DINHEIRO' ? 'rgba(30, 58, 138, 0.4)' : 'rgba(15, 23, 42, 0.75)',
                          border: `2px solid ${formaPag === 'DINHEIRO' ? '#38bdf8' : '#283c5e'}`,
                          boxShadow: formaPag === 'DINHEIRO' ? '0 0 10px rgba(56, 189, 248, 0.35)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>💵 Dinheiro</span>
                          <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>Balcão</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#7dd3fc' }}>Calculadora de Troco</span>
                      </div>

                      {/* CARD CARTÃO DÉBITO */}
                      <div
                        onClick={() => setFormaPag('DEBITO')}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: formaPag === 'DEBITO' ? 'rgba(126, 34, 206, 0.35)' : 'rgba(15, 23, 42, 0.75)',
                          border: `2px solid ${formaPag === 'DEBITO' ? '#c084fc' : '#283c5e'}`,
                          boxShadow: formaPag === 'DEBITO' ? '0 0 10px rgba(192, 132, 252, 0.35)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>💳 Débito</span>
                          <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>Maquininha</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#e9d5ff' }}>Aprovação Imediata</span>
                      </div>

                      {/* CARD CARTÃO CRÉDITO */}
                      <div
                        onClick={() => setFormaPag('CREDITO')}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 6,
                          cursor: 'pointer',
                          background: formaPag === 'CREDITO' ? 'rgba(194, 65, 12, 0.35)' : 'rgba(15, 23, 42, 0.75)',
                          border: `2px solid ${formaPag === 'CREDITO' ? '#fb923c' : '#283c5e'}`,
                          boxShadow: formaPag === 'CREDITO' ? '0 0 10px rgba(251, 146, 60, 0.35)' : 'none',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 4,
                          transition: 'all 0.15s ease',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.88rem', color: '#f8fafc' }}>💳 Crédito</span>
                          <span style={{ fontSize: '0.64rem', color: '#94a3b8' }}>À Vista</span>
                        </div>
                        <span style={{ fontSize: '0.72rem', color: '#fed7aa' }}>Comprovante Digital</span>
                      </div>
                    </div>
                  </div>

                  {/* PAINEL DINÂMICO CONFORME A FORMA ESCOLHIDA */}
                  {formaPag === 'PIX' && (
                    <div
                      style={{
                        background: 'linear-gradient(135deg, rgba(6, 78, 59, 0.3) 0%, rgba(4, 47, 46, 0.5) 100%)',
                        border: '1px solid #10b981',
                        boxShadow: '0 0 16px rgba(16, 185, 129, 0.2)',
                        borderRadius: 8,
                        padding: 14,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 16,
                      }}
                    >
                      {/* SIMULAÇÃO DE QR CODE PIX EM ALTA DEFINIÇÃO (FINTECH HD) */}
                      <div
                        style={{
                          background: '#ffffff',
                          padding: 8,
                          borderRadius: 8,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          boxShadow: '0 4px 14px rgba(0, 0, 0, 0.6)',
                          flexShrink: 0,
                        }}
                      >
                        <svg width="84" height="84" viewBox="0 0 84 84">
                          <rect width="84" height="84" fill="#ffffff" />
                          {/* Marcador Superior Esquerdo */}
                          <rect x="6" y="6" width="22" height="22" rx="4" fill="#0f172a" />
                          <rect x="9" y="9" width="16" height="16" rx="2.5" fill="#ffffff" />
                          <rect x="12" y="12" width="10" height="10" rx="1.5" fill="#0f172a" />

                          {/* Marcador Superior Direito */}
                          <rect x="56" y="6" width="22" height="22" rx="4" fill="#0f172a" />
                          <rect x="59" y="9" width="16" height="16" rx="2.5" fill="#ffffff" />
                          <rect x="62" y="12" width="10" height="10" rx="1.5" fill="#0f172a" />

                          {/* Marcador Inferior Esquerdo */}
                          <rect x="6" y="56" width="22" height="22" rx="4" fill="#0f172a" />
                          <rect x="9" y="59" width="16" height="16" rx="2.5" fill="#ffffff" />
                          <rect x="12" y="62" width="10" height="10" rx="1.5" fill="#0f172a" />

                          {/* Padrões de Dados Matriz */}
                          <rect x="34" y="8" width="6" height="6" fill="#0f172a" />
                          <rect x="44" y="8" width="6" height="6" fill="#10b981" />
                          <rect x="34" y="18" width="6" height="6" fill="#10b981" />
                          <rect x="44" y="18" width="6" height="6" fill="#0f172a" />

                          <rect x="8" y="34" width="6" height="6" fill="#0f172a" />
                          <rect x="18" y="34" width="6" height="6" fill="#0f172a" />
                          <rect x="8" y="44" width="6" height="6" fill="#10b981" />
                          <rect x="18" y="44" width="6" height="6" fill="#0f172a" />

                          {/* Emblema Central PIX */}
                          <rect x="32" y="32" width="20" height="20" rx="4" fill="#042f2e" />
                          <path
                            d="M42 36l3.5 3.5c.6.6.6 1.5 0 2.1L42 45l-3.5-3.5c-.6-.6-.6-1.5 0-2.1L42 36z"
                            fill="#10b981"
                          />
                          <path
                            d="M42 40l3.5 3.5c.6.6.6 1.5 0 2.1L42 49l-3.5-3.5c-.6-.6-.6-1.5 0-2.1L42 40z"
                            fill="#34d399"
                            opacity="0.8"
                          />

                          <rect x="58" y="34" width="8" height="6" fill="#0f172a" />
                          <rect x="70" y="34" width="6" height="6" fill="#10b981" />
                          <rect x="58" y="44" width="6" height="6" fill="#10b981" />
                          <rect x="68" y="44" width="8" height="6" fill="#0f172a" />

                          <rect x="34" y="58" width="6" height="8" fill="#10b981" />
                          <rect x="44" y="58" width="6" height="6" fill="#0f172a" />
                          <rect x="34" y="70" width="8" height="6" fill="#0f172a" />
                          <rect x="46" y="68" width="6" height="8" fill="#10b981" />
                          <rect x="58" y="58" width="8" height="8" fill="#0f172a" />
                          <rect x="70" y="58" width="6" height="6" fill="#0f172a" />
                          <rect x="58" y="70" width="6" height="6" fill="#10b981" />
                          <rect x="68" y="68" width="8" height="8" fill="#0f172a" />
                        </svg>
                        <span style={{ fontSize: '0.62rem', fontWeight: 800, color: '#047857', marginTop: 4, letterSpacing: '0.04em' }}>
                          PIX • BANCO CENTRAL
                        </span>
                      </div>

                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 7 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', color: '#a7f3d0', fontWeight: 700 }}>
                            Chave PIX Copia e Cola:
                          </span>
                          <span style={{ fontSize: '0.68rem', fontWeight: 800, color: '#34d399', background: 'rgba(16, 185, 129, 0.2)', padding: '1px 6px', borderRadius: 4 }}>
                            5% OFF APLICADO
                          </span>
                        </div>
                        <input
                          className="pixel-input"
                          readOnly
                          value={`00020126580014br.gov.bcb.pix0136lanhouse-pix-2026-rf08-sessao-${sessaoPagId}5204000053039865405${simulacaoCalculo.valorFinal.toFixed(2)}`}
                          style={{
                            fontSize: '0.74rem',
                            color: '#6ee7b7',
                            background: '#022c22',
                            border: '1px solid #059669',
                            borderRadius: 6,
                            padding: '7px 10px',
                            fontFamily: 'monospace',
                          }}
                        />
                        <button
                          type="button"
                          className="pixel-btn"
                          style={{
                            padding: '8px 12px',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            background: pixCopiado ? '#15803d' : '#047857',
                            borderColor: '#10b981',
                            color: '#ffffff',
                            borderRadius: 6,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: 6,
                            transition: 'all 0.15s ease',
                          }}
                          onClick={() => {
                            navigator.clipboard?.writeText?.(
                              `00020126580014br.gov.bcb.pix0136lanhouse-pix-2026-rf08-sessao-${sessaoPagId}`
                            );
                            setPixCopiado(true);
                            setTimeout(() => setPixCopiado(false), 2000);
                          }}
                        >
                          {pixCopiado ? '✔ Chave PIX Copiada com Sucesso!' : '📋 Copiar Código PIX Copia e Cola'}
                        </button>
                      </div>
                    </div>
                  )}

                  {formaPag === 'DINHEIRO' && (
                    <div
                      style={{
                        background: 'linear-gradient(180deg, rgba(30, 58, 138, 0.25) 0%, rgba(15, 23, 42, 0.5) 100%)',
                        border: '1px solid #38bdf8',
                        borderRadius: 6,
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 8,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#cbd5e1' }}>
                          Calculadora de Troco Automática:
                        </span>
                        <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                          Total a Pagar: <strong>{formatarMoeda(simulacaoCalculo.valorFinal)}</strong>
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <div style={{ flex: 1 }}>
                          <input
                            type="number"
                            step="0.5"
                            className="pixel-input"
                            style={{ width: '100%', fontSize: '0.88rem' }}
                            placeholder="Valor entregue pelo cliente (R$)..."
                            value={valorRecebidoDinheiro}
                            onChange={(e) => setValorRecebidoDinheiro(e.target.value)}
                          />
                        </div>
                        {/* Chips rápidos */}
                        <button
                          type="button"
                          className="pixel-btn"
                          style={{ padding: '6px 9px', fontSize: '0.76rem' }}
                          onClick={() => setValorRecebidoDinheiro(simulacaoCalculo.valorFinal.toFixed(2))}
                        >
                          Exato
                        </button>
                        {[20, 50, 100].map((v) => (
                          <button
                            key={v}
                            type="button"
                            className="pixel-btn"
                            style={{ padding: '6px 9px', fontSize: '0.76rem' }}
                            onClick={() => setValorRecebidoDinheiro(String(v))}
                          >
                            R$ {v}
                          </button>
                        ))}
                      </div>

                      {/* RESULTADO DO TROCO */}
                      {Number(valorRecebidoDinheiro) > 0 && (
                        <div
                          style={{
                            background: '#0a1324',
                            padding: '8px 12px',
                            borderRadius: 4,
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            border: '1px solid #233c66',
                          }}
                        >
                          {Number(valorRecebidoDinheiro) >= simulacaoCalculo.valorFinal ? (
                            <>
                              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Troco a Devolver:</span>
                              <span style={{ fontSize: '1.05rem', fontWeight: 800, color: '#4ade80' }}>
                                {formatarMoeda(Number(valorRecebidoDinheiro) - simulacaoCalculo.valorFinal)}
                              </span>
                            </>
                          ) : (
                            <>
                              <span style={{ fontSize: '0.82rem', color: '#fb923c' }}>Valor Insuficiente:</span>
                              <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#f87171' }}>
                                Faltam {formatarMoeda(simulacaoCalculo.valorFinal - Number(valorRecebidoDinheiro))}
                              </span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* RESUMO DO PEDIDO / INVOICE DETALHADA */}
                  {sessaoParaPagar && (
                    <div
                      style={{
                        background: '#091021',
                        border: '1px solid #283e68',
                        borderRadius: 6,
                        padding: 12,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 6,
                      }}
                    >
                      <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#cbd5e1', borderBottom: '1px solid #1a2a47', paddingBottom: 4 }}>
                        Discriminação da Sessão:
                      </div>

                      {/* Tempo */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem' }}>
                        <span style={{ color: '#94a3b8' }}>
                          🖥️ Terminal PC-{String(sessaoParaPagar.computadorNumero).padStart(2, '0')} ({formatarDuracao(sessaoParaPagar.minutosUtilizados)} @ {formatarMoeda(sessaoParaPagar.tarifaPorHoraCongelada)}/h):
                        </span>
                        <span style={{ color: '#f8fafc', fontWeight: 600 }}>{formatarMoeda(sessaoParaPagar.valorTempo)}</span>
                      </div>

                      {/* Lanches / Produtos */}
                      {sessaoParaPagar.itensConsumo && sessaoParaPagar.itensConsumo.length > 0 ? (
                        sessaoParaPagar.itensConsumo.map((item, idx) => (
                          <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#cbd5e1' }}>
                            <span style={{ color: '#94a3b8', paddingLeft: 8 }}>
                              • {item.quantidade}x {item.nomeProduto}:
                            </span>
                            <span>{formatarMoeda(item.subtotal)}</span>
                          </div>
                        ))
                      ) : null}

                      {/* Subtotal */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', borderTop: '1px dashed #1e3357', paddingTop: 6, marginTop: 2 }}>
                        <span style={{ color: '#94a3b8' }}>Subtotal Bruto:</span>
                        <span style={{ color: '#e2e8f0' }}>{formatarMoeda(sessaoParaPagar.valorTotal)}</span>
                      </div>

                      {/* Desconto */}
                      {simulacaoCalculo.desconto > 0 ? (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem', color: '#10b981', fontWeight: 600 }}>
                          <span>Desconto Polimórfico ({formaPag} 5% OFF):</span>
                          <span>- {formatarMoeda(simulacaoCalculo.desconto)}</span>
                        </div>
                      ) : null}

                      {/* Total Final Grande */}
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          borderTop: '2px solid #243c68',
                          paddingTop: 8,
                          marginTop: 4,
                        }}
                      >
                        <span style={{ fontSize: '0.92rem', fontWeight: 700, color: '#f8fafc' }}>Total a Quitar:</span>
                        <span style={{ fontSize: '1.28rem', fontWeight: 800, color: '#4ade80', textShadow: '0 0 10px rgba(74, 222, 128, 0.4)' }}>
                          {formatarMoeda(simulacaoCalculo.valorFinal)}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* CHECKBOX QUITAÇÃO AUTOMÁTICA */}
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.82rem', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={confirmarAuto}
                      onChange={(e) => setConfirmarAuto(e.target.checked)}
                    />
                    <span style={{ color: '#cbd5e1' }}>
                      Confirmar quitação e creditar no caixa imediatamente (RN09)
                    </span>
                  </label>

                  {/* BOTAO FINAL DE PAGAMENTO */}
                  <button
                    className="pixel-btn success"
                    style={{ padding: '11px 18px', fontSize: '0.94rem', fontWeight: 700 }}
                    disabled={!sessaoParaPagar}
                    onClick={() => {
                      onRegistrarPagamento(sessaoPagId, formaPag, confirmarAuto);
                      // Simula abertura do comprovante se confirmado
                      setTimeout(() => {
                        const recemCriado = pagamentos[pagamentos.length - 1];
                        if (recemCriado) setComprovanteAberto(recemCriado);
                      }, 200);
                    }}
                  >
                    Confirmar Pagamento de {formatarMoeda(simulacaoCalculo.valorFinal)}
                  </button>
                </div>

                {/* COLUNA DIREITA: HISTÓRICO DE PAGAMENTOS COM FILTROS E EMISSÃO DE COMPROVANTE */}
                <div className="pixel-subcard" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>
                      Histórico do Caixa & Pagamentos
                    </div>
                    <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>
                      Total de registros: {pagamentos.length}
                    </span>
                  </div>

                  {/* BARRA DE FILTRO E BUSCA */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input
                      className="pixel-input"
                      style={{ flex: 1, fontSize: '0.8rem', padding: '6px 10px' }}
                      placeholder="Buscar por cliente ou ID..."
                      value={buscaPag}
                      onChange={(e) => setBuscaPag(e.target.value)}
                    />
                    <div style={{ display: 'flex', gap: 4 }}>
                      {(['TODOS', 'CONFIRMADO', 'PENDENTE', 'ESTORNADO'] as const).map((st) => (
                        <button
                          key={st}
                          className={`pixel-btn ${filtroStatusPag === st ? 'primary' : ''}`}
                          style={{ padding: '4px 8px', fontSize: '0.72rem' }}
                          onClick={() => setFiltroStatusPag(st)}
                        >
                          {st === 'TODOS' ? 'Todos' : st === 'CONFIRMADO' ? 'Pagos' : st === 'PENDENTE' ? 'Pendentes' : 'Estornos'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* TABELA DE PAGAMENTOS REGISTRADOS */}
                  <div style={{ maxHeight: 420, overflowY: 'auto' }}>
                    <table className="pixel-table">
                      <thead>
                        <tr>
                          <th>ID / SESSÃO</th>
                          <th>CLIENTE</th>
                          <th>FORMA</th>
                          <th>VALOR FINAL</th>
                          <th>STATUS</th>
                          <th>AÇÕES</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pagamentos
                          .filter((p) => {
                            const matchBusca =
                              p.clienteNome.toLowerCase().includes(buscaPag.toLowerCase()) ||
                              String(p.id).includes(buscaPag) ||
                              String(p.sessaoId).includes(buscaPag);
                            const matchFiltro =
                              filtroStatusPag === 'TODOS' ? true : p.status === filtroStatusPag;
                            return matchBusca && matchFiltro;
                          })
                          .map((p) => (
                            <tr key={p.id}>
                              <td style={{ fontWeight: 700, color: '#7dd3fc', fontSize: '0.82rem' }}>
                                #{p.id} (S#{p.sessaoId})
                              </td>
                              <td style={{ fontSize: '0.84rem' }}>{p.clienteNome}</td>
                              <td>
                                <span style={{ fontSize: '0.78rem', fontWeight: 600, color: p.forma === 'PIX' ? '#10b981' : '#cbd5e1' }}>
                                  {p.forma}
                                </span>
                              </td>
                              <td style={{ fontWeight: 700, color: '#4ade80', fontSize: '0.86rem' }}>
                                {formatarMoeda(p.valorFinal)}
                              </td>
                              <td>
                                <span
                                  className={`badge-pixel ${
                                    p.status === 'CONFIRMADO'
                                      ? 'badge-livre'
                                      : p.status === 'PENDENTE'
                                      ? 'badge-manutencao'
                                      : 'badge-poo'
                                  }`}
                                  style={{ fontSize: '0.7rem' }}
                                >
                                  {p.status}
                                </span>
                              </td>
                              <td>
                                <div style={{ display: 'flex', gap: 5 }}>
                                  <button
                                    className="pixel-btn"
                                    style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                                    title="Ver comprovante fiscal"
                                    onClick={() => setComprovanteAberto(p)}
                                  >
                                    📄 Recibo
                                  </button>

                                  {p.status === 'PENDENTE' && (
                                    <button
                                      className="pixel-btn success"
                                      style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                                      onClick={() => onConfirmarPagamento(p.id)}
                                    >
                                      Confirmar
                                    </button>
                                  )}

                                  {p.status === 'CONFIRMADO' && (
                                    <button
                                      className="pixel-btn danger"
                                      style={{ padding: '3px 8px', fontSize: '0.74rem' }}
                                      title="Somente Administrador (RN10) — devolve estoque da sessão"
                                      onClick={() => onEstornarPagamento(p.id)}
                                    >
                                      Estornar
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* MODAL / POPUP DE COMPROVANTE DIGITAL DE PAGAMENTO (RECEIPT FISCAL) */}
              {comprovanteAberto && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 60,
                    background: 'rgba(5, 10, 20, 0.75)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: 20,
                  }}
                  onClick={() => setComprovanteAberto(null)}
                >
                  <div
                    className="pixel-window"
                    style={{ width: 'min(480px, 92vw)', padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div style={{ textAlign: 'center', borderBottom: '1px dashed #334e7a', paddingBottom: 10 }}>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#38bdf8' }}>
                        LAN HOUSE GAMER ZONE & CYBER
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                        CNPJ: 12.345.678/0001-90 · Comprovante de Pagamento
                      </div>
                      <div style={{ fontSize: '0.74rem', color: '#cbd5e1', marginTop: 4 }}>
                        {new Date(comprovanteAberto.dataHora).toLocaleString('pt-BR')}
                      </div>
                    </div>

                    <div style={{ fontSize: '0.84rem', display: 'flex', flexDirection: 'column', gap: 6 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Recibo / Pagamento Nº:</span>
                        <strong style={{ color: '#f8fafc' }}>#{comprovanteAberto.id}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Sessão de Uso:</span>
                        <strong style={{ color: '#f8fafc' }}>Sessão #{comprovanteAberto.sessaoId} (PC-{String(comprovanteAberto.computadorNumero).padStart(2, '0')})</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Cliente:</span>
                        <strong style={{ color: '#f8fafc' }}>{comprovanteAberto.clienteNome}</strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Forma de Pagamento:</span>
                        <strong style={{ color: comprovanteAberto.forma === 'PIX' ? '#10b981' : '#38bdf8' }}>
                          {comprovanteAberto.forma}
                        </strong>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Operador do Caixa:</span>
                        <span style={{ color: '#f8fafc' }}>{comprovanteAberto.operadorRegistro}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Situação:</span>
                        <span style={{ fontWeight: 700, color: comprovanteAberto.status === 'CONFIRMADO' ? '#4ade80' : '#facc15' }}>
                          {comprovanteAberto.status}
                        </span>
                      </div>
                    </div>

                    <div
                      style={{
                        borderTop: '1px dashed #334e7a',
                        borderBottom: '1px dashed #334e7a',
                        padding: '10px 0',
                        fontSize: '0.86rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 4,
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#94a3b8' }}>Subtotal Bruto:</span>
                        <span>{formatarMoeda(comprovanteAberto.valorBruto)}</span>
                      </div>
                      {comprovanteAberto.descontoAplicado > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981' }}>
                          <span>Desconto ({comprovanteAberto.forma}):</span>
                          <span>- {formatarMoeda(comprovanteAberto.descontoAplicado)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: '1.1rem', color: '#4ade80', paddingTop: 4 }}>
                        <span>VALOR TOTAL PAGO:</span>
                        <span>{formatarMoeda(comprovanteAberto.valorFinal)}</span>
                      </div>
                    </div>

                    <div style={{ fontSize: '0.68rem', color: '#64748b', textAlign: 'center' }}>
                      Autenticação Digital: MD5-AUTH-{comprovanteAberto.id}-{comprovanteAberto.sessaoId}-{Math.round(comprovanteAberto.valorFinal * 100)}
                    </div>

                    <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 6 }}>
                      <button
                        className="pixel-btn primary"
                        style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                        onClick={() => window.print?.()}
                      >
                        🖨️ Imprimir
                      </button>
                      <button
                        className="pixel-btn"
                        style={{ padding: '8px 16px', fontSize: '0.84rem' }}
                        onClick={() => setComprovanteAberto(null)}
                      >
                        Fechar
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
