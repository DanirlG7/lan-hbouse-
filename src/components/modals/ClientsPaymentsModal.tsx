import React, { useState } from 'react';
import { Cliente, FormaPagamento, Pagamento, Sessao } from '../../domain/types';
import { PROCESSADORES_PAGAMENTO } from '../../domain/LanHouseEngine';
import { formatarMoeda } from '../HudOverlay';
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
        style={{ width: 'min(1040px, 95vw)', maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pixel-modal-header">
          <div className="pixel-modal-title">
            <span className="pixel-close-bracket" onClick={onClose}>
              [ X ]
            </span>
            <span>CLIENTES, HISTÓRICO & CAIXA DE PAGAMENTOS</span>
            <span className="badge-pixel badge-poo">RF01 • RF02 • RF08 • RF09 • RN06–RN09</span>
          </div>
          <span style={{ color: '#94a3b8', cursor: 'pointer' }} onClick={onClose}>
            ✕
          </span>
        </div>

        <div className="pixel-tabs">
          <button
            className={`pixel-tab ${aba === 'CLIENTES' ? 'active' : ''}`}
            onClick={() => setAba('CLIENTES')}
          >
            [{aba === 'CLIENTES' ? 'V' : ' '}] CADASTRO, BUSCA & HISTÓRICO (RF01 / RF02 / RF09)
          </button>
          <button
            className={`pixel-tab ${aba === 'PAGAMENTOS' ? 'active' : ''}`}
            onClick={() => setAba('PAGAMENTOS')}
          >
            [{aba === 'PAGAMENTOS' ? '$' : ' '}] REGISTRAR PAGAMENTO & POLIMORFISMO ({sessoesSemPagamento.length} EM ABERTO)
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
                  <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#38bdf8' }}>
                    [+] CADASTRAR NOVO CLIENTE (RF01)
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
                    <button type="submit" className="pixel-btn primary">
                      [ Salvar Cliente ]
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
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        borderBottom: '1px solid #2b3f66',
                        paddingBottom: 10,
                        marginBottom: 10,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
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
                                <td>{s.minutosUtilizados} min</td>
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
                                      style={{ padding: '3px 8px', fontSize: '0.72rem' }}
                                      onClick={() => {
                                        setSessaoPagId(s.id);
                                        setAba('PAGAMENTOS');
                                      }}
                                    >
                                      [Pagar]
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
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 16 }}>
              {/* Checkout Polimórfico (RF08 / RN06 / RN08) */}
              <div className="pixel-subcard" style={{ padding: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
                <h3 style={{ fontSize: '0.98rem', color: '#4ade80' }}>
                  [$] REGISTRAR PAGAMENTO DE SESSÃO (RF08)
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                  Demonstra <strong>Polimorfismo POO</strong>: <code>PagamentoPix</code> sobrescreve o cálculo aplicando 5% de desconto automático.
                </p>

                <label style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                  Sessão Associada (RN06):
                </label>
                <select
                  className="pixel-select"
                  value={sessaoPagId}
                  onChange={(e) => setSessaoPagId(Number(e.target.value))}
                >
                  {sessoes.map((s) => (
                    <option key={s.id} value={s.id}>
                      Sessão #{s.id} — {s.clienteNome} ({s.status}) — {formatarMoeda(s.valorTotal)}
                    </option>
                  ))}
                </select>

                <label style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>
                  Forma de Pagamento (Polimórfica):
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 6 }}>
                  {(['PIX', 'DINHEIRO', 'DEBITO', 'CREDITO'] as FormaPagamento[]).map((f) => (
                    <button
                      key={f}
                      type="button"
                      className={`pixel-btn ${formaPag === f ? 'primary' : ''}`}
                      onClick={() => setFormaPag(f)}
                    >
                      {PROCESSADORES_PAGAMENTO[f].descricao}
                    </button>
                  ))}
                </div>

                {sessaoParaPagar && (
                  <div
                    style={{
                      background: '#0c1426',
                      border: '1px solid #2d426b',
                      padding: 10,
                      borderRadius: 4,
                      fontSize: '0.84rem',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: '#94a3b8' }}>Subtotal Sessão + Consumo:</span>
                      <span>{formatarMoeda(sessaoParaPagar.valorTotal)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: '#38bdf8' }}>
                      <span>Desconto ({formaPag}):</span>
                      <span>- {formatarMoeda(simulacaoCalculo.desconto)}</span>
                    </div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontWeight: 700,
                        fontSize: '1rem',
                        color: '#4ade80',
                        borderTop: '1px solid #1e293b',
                        paddingTop: 5,
                      }}
                    >
                      <span>Total a Quitar:</span>
                      <span>{formatarMoeda(simulacaoCalculo.valorFinal)}</span>
                    </div>
                  </div>
                )}

                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: '0.8rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={confirmarAuto}
                    onChange={(e) => setConfirmarAuto(e.target.checked)}
                  />
                  <span>Confirmar quitação imediatamente (entra no faturamento RN09)</span>
                </label>

                <button
                  className="pixel-btn success"
                  onClick={() => onRegistrarPagamento(sessaoPagId, formaPag, confirmarAuto)}
                >
                  [ Registrar Pagamento (Valida RN06 & RN08) ]
                </button>
              </div>

              {/* Lista de Pagamentos Registrados */}
              <div className="pixel-subcard" style={{ padding: 14 }}>
                <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 8, color: '#f8fafc' }}>
                  REGISTROS DE PAGAMENTO (RN08 / RN09 / ESTORNO RN10)
                </div>
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
                    {pagamentos.map((p) => (
                      <tr key={p.id}>
                        <td style={{ fontWeight: 700, color: '#7dd3fc' }}>
                          #{p.id} (S#{p.sessaoId})
                        </td>
                        <td>{p.clienteNome}</td>
                        <td>{p.forma}</td>
                        <td style={{ fontWeight: 700, color: '#4ade80' }}>
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
                          >
                            {p.status}
                          </span>
                        </td>
                        <td style={{ display: 'flex', gap: 6 }}>
                          {p.status === 'PENDENTE' && (
                            <button
                              className="pixel-btn success"
                              style={{ padding: '3px 8px', fontSize: '0.73rem' }}
                              onClick={() => onConfirmarPagamento(p.id)}
                            >
                              [Confirmar]
                            </button>
                          )}
                          {p.status === 'CONFIRMADO' && (
                            <button
                              className="pixel-btn danger"
                              style={{ padding: '3px 8px', fontSize: '0.73rem' }}
                              title="Somente Administrador (RN10) — devolve estoque da sessão"
                              onClick={() => onEstornarPagamento(p.id)}
                            >
                              [Estornar]
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
