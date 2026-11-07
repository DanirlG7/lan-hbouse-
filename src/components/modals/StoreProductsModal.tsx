import React, { useState } from 'react';
import { AreaComputador, Produto, Sessao } from '../../domain/types';
import { formatarMoeda } from '../HudOverlay';
import { PixelIcon } from '../PixelSprites';

interface Props {
  produtos: Produto[];
  sessoes: Sessao[];
  onClose: () => void;
  onVenderParaSessao: (sessaoId: number, produtoId: number, qtd: number) => void;
  onReporEstoque: (produtoId: number, qtd: number) => void;
  onAtualizarPreco: (produtoId: number, novoPreco: number) => void;
  onBuyNewPc: (area: AreaComputador) => void;
}

/**
 * Une fielmente:
 * - Imagem 7 (Direita): LOJA (Vendas Rápidas + Hardware Replacement AMD Ryzen / Radeon GPU + [Buy New PC])
 * - Imagem 15 (Direita): Inventário de Produtos (Alimentos, Acessórios, Gráfico Estoque 30 dias e Alerta de Baixo Estoque)
 */
export const StoreProductsModal: React.FC<Props> = ({
  produtos,
  sessoes,
  onClose,
  onVenderParaSessao,
  onReporEstoque,
  onAtualizarPreco,
  onBuyNewPc,
}) => {
  const [aba, setAba] = useState<'INVENTARIO' | 'LOJA_HARDWARE'>('INVENTARIO');
  const sessoesAtivas = sessoes.filter((s) => s.status === 'ATIVA');
  const [sessaoDestinoId, setSessaoDestinoId] = useState<number>(
    sessoesAtivas[0]?.id || 0
  );
  const [editPrecoId, setEditPrecoId] = useState<number | null>(null);
  const [novoPrecoStr, setNovoPrecoStr] = useState('');

  const alimentos = produtos.filter((p) => p.categoria !== 'PERIFERICO');
  const acessorios = produtos.filter((p) => p.categoria === 'PERIFERICO');
  const maisVendido = [...produtos].sort((a, b) => b.vendidos - a.vendidos)[0];
  const valorEstoqueTotal = produtos.reduce((acc, p) => acc + p.preco * p.estoque, 0);
  const baixoEstoque = produtos.some((p) => p.estoque <= 15);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-window"
        style={{ width: 'min(980px, 95vw)', maxHeight: '87vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pixel-modal-header">
          <div className="pixel-modal-title">
            <PixelIcon name="store" size={26} />
            <span>INVENTÁRIO DE PRODUTOS & LOJA DE HARDWARE</span>
          </div>
          <span style={{ color: '#94a3b8', cursor: 'pointer', fontSize: '1.1rem' }} onClick={onClose}>
            ✕
          </span>
        </div>

        <div className="pixel-tabs" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className={`pixel-tab ${aba === 'INVENTARIO' ? 'active' : ''}`}
              onClick={() => setAba('INVENTARIO')}
            >
              [V] INVENTÁRIO DE PRODUTOS (BOMBONIERE)
            </button>
            <button
              className={`pixel-tab ${aba === 'LOJA_HARDWARE' ? 'active' : ''}`}
              onClick={() => setAba('LOJA_HARDWARE')}
            >
              [+] LOJA DE HARDWARE & BUY NEW PC (RF03)
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>Sessão ativa p/ venda:</span>
            <select
              className="pixel-select"
              style={{ padding: '5px 8px', fontSize: '0.78rem' }}
              value={sessaoDestinoId}
              onChange={(e) => setSessaoDestinoId(Number(e.target.value))}
            >
              {sessoesAtivas.length === 0 ? (
                <option value={0}>Sem sessão ativa</option>
              ) : (
                sessoesAtivas.map((s) => (
                  <option key={s.id} value={s.id}>
                    S#{s.id} - {s.clienteNome} (PC-{String(s.computadorNumero).padStart(2, '0')})
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        <div style={{ padding: 18, overflowY: 'auto', flex: 1 }}>
          {aba === 'INVENTARIO' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1.45fr 0.95fr', gap: 16 }}>
              {/* Coluna Esquerda fiel à Imagem 15 (Direita): Alimentos & Acessórios */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {[
                  { titulo: 'Alimentos & Bebidas', lista: alimentos },
                  { titulo: 'Acessórios Gaming', lista: acessorios },
                ].map((bloco) => (
                  <div key={bloco.titulo}>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '1fr 80px 80px 145px',
                        fontSize: '0.78rem',
                        color: '#94a3b8',
                        fontWeight: 700,
                        padding: '0 8px 6px',
                        borderBottom: '1px solid #26385c',
                      }}
                    >
                      <span>{bloco.titulo}</span>
                      <span>Preço</span>
                      <span>Estoque</span>
                      <span style={{ textAlign: 'right' }}>Ações</span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7, marginTop: 7 }}>
                      {bloco.lista.map((p) => (
                        <div
                          key={p.id}
                          className="pixel-subcard"
                          style={{
                            padding: '8px 10px',
                            display: 'grid',
                            gridTemplateColumns: '1fr 80px 80px 145px',
                            alignItems: 'center',
                            gap: 8,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <PixelIcon name={p.icone} size={28} />
                            <div>
                              <div style={{ fontWeight: 700, fontSize: '0.86rem', color: '#f8fafc' }}>
                                {p.nome}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: '#4ade80' }}>
                                {formatarMoeda(p.preco)} / unid.
                              </div>
                            </div>
                          </div>

                          <div style={{ fontWeight: 700, color: '#fde047', fontSize: '0.82rem' }}>
                            {editPrecoId === p.id ? (
                              <input
                                type="number"
                                className="pixel-input"
                                style={{ width: 68, padding: '3px 5px' }}
                                value={novoPrecoStr}
                                onChange={(e) => setNovoPrecoStr(e.target.value)}
                                onBlur={() => {
                                  onAtualizarPreco(p.id, Number(novoPrecoStr) || p.preco);
                                  setEditPrecoId(null);
                                }}
                              />
                            ) : (
                              <span
                                style={{ cursor: 'pointer' }}
                                title="Clique para alterar preço (RN10)"
                                onClick={() => {
                                  setEditPrecoId(p.id);
                                  setNovoPrecoStr(p.preco.toFixed(2));
                                }}
                              >
                                {formatarMoeda(p.preco)} ✎
                              </span>
                            )}
                          </div>

                          <div>
                            <span
                              style={{
                                display: 'inline-block',
                                minWidth: 44,
                                textAlign: 'center',
                                padding: '3px 8px',
                                background: '#0c1426',
                                border: `1px solid ${p.estoque <= 15 ? '#ef4444' : '#334b78'}`,
                                borderRadius: 4,
                                fontWeight: 700,
                                color: p.estoque <= 15 ? '#fca5a5' : '#f8fafc',
                              }}
                            >
                              {p.estoque}
                            </span>
                          </div>

                          <div style={{ display: 'flex', gap: 5, justifyContent: 'flex-end' }}>
                            <button
                              className="pixel-btn primary"
                              style={{ padding: '4px 8px', fontSize: '0.73rem' }}
                              disabled={sessoesAtivas.length === 0 || p.estoque <= 0}
                              onClick={() => onVenderParaSessao(sessaoDestinoId, p.id, 1)}
                            >
                              [Vender]
                            </button>
                            <button
                              className="pixel-btn"
                              style={{ padding: '4px 8px', fontSize: '0.73rem' }}
                              onClick={() => onReporEstoque(p.id, 10)}
                            >
                              [+10]
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Coluna Direita fiel à Imagem 15: Gráfico Estoque 30 dias + Resumo & Alerta */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div className="pixel-subcard" style={{ padding: 14 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: 8 }}>
                    Estoque & Giro (30 dias)
                  </div>
                  <svg viewBox="0 0 260 125" style={{ width: '100%', height: 130 }}>
                    {[25, 55, 85, 108].map((y) => (
                      <line key={y} x1="26" y1={y} x2="250" y2={y} stroke="#223458" />
                    ))}
                    {[52, 68, 58, 86, 74, 79, 64, 92, 70, 66, 88].map((val, i) => {
                      const h = (val / 100) * 82;
                      const x = 32 + i * 19;
                      const isLow = i === 7 || i === 10;
                      return (
                        <rect
                          key={i}
                          x={x}
                          y={108 - h}
                          width="12"
                          height={h}
                          fill={isLow ? '#ef4444' : '#22c55e'}
                        />
                      );
                    })}
                    {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((d, idx) => (
                      <text
                        key={d}
                        x={38 + idx * 32}
                        y="121"
                        fill="#94a3b8"
                        fontSize="9"
                        textAnchor="middle"
                      >
                        {d}
                      </text>
                    ))}
                  </svg>
                </div>

                <div className="pixel-subcard" style={{ padding: 14, display: 'flex', flexDirection: 'column', gap: 9 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: '#cbd5e1' }}>Item Mais Vendido:</span>
                    <strong style={{ color: '#4ade80' }}>
                      {maisVendido?.nome.split(' ')[0]} ({maisVendido?.vendidos} un.)
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.84rem' }}>
                    <span style={{ color: '#cbd5e1' }}>Valor em Estoque:</span>
                    <strong style={{ color: '#4ade80' }}>{formatarMoeda(valorEstoqueTotal)}</strong>
                  </div>
                  {baixoEstoque && (
                    <div
                      style={{
                        marginTop: 4,
                        padding: '8px 10px',
                        background: 'rgba(239, 68, 68, 0.16)',
                        border: '1px solid #ef4444',
                        borderRadius: 4,
                        color: '#fca5a5',
                        fontWeight: 700,
                        fontSize: '0.8rem',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span>Alerta de Baixo Estoque</span>
                      <span>⚠</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {aba === 'LOJA_HARDWARE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Fiel à Imagem 7 (Direita): HARDWARE REPLACEMENT + BUY NEW PC */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '0.96rem', color: '#f8fafc' }}>
                  HARDWARE REPLACEMENT & EXPANSÃO DE MÁQUINAS (RF03)
                </h3>
                <span style={{ color: '#f87171', fontWeight: 800, letterSpacing: '0.06em' }}>
                  AMD RYZEN • RADEON • RTX
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {[
                  { nome: 'AMD Ryzen 5 CPU', sub: '6-Core Gaming', preco: 'R$ 850', icone: 'cpu' as const },
                  { nome: 'AMD Ryzen 7 X3D', sub: '8-Core 3D V-Cache', preco: 'R$ 1.400', icone: 'cpu' as const },
                  { nome: 'Radeon RX 7600', sub: '8GB GDDR6', preco: 'R$ 1.650', icone: 'gpu' as const },
                  { nome: 'GeForce RTX 4080', sub: '16GB VIP Station', preco: 'R$ 3.200', icone: 'gpu' as const },
                ].map((hw) => (
                  <div key={hw.nome} className="pixel-subcard" style={{ padding: 14, textAlign: 'center' }}>
                    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
                      <PixelIcon name={hw.icone} size={42} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{hw.nome}</div>
                    <div style={{ fontSize: '0.73rem', color: '#94a3b8', margin: '3px 0 8px' }}>
                      {hw.sub}
                    </div>
                    <span className="badge-pixel badge-ocupado">{hw.preco}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 6 }}>
                <button
                  className="pixel-btn primary"
                  style={{ padding: '12px 18px', fontSize: '0.92rem' }}
                  onClick={() => onBuyNewPc('COMUM')}
                >
                  🖥️ Buy New PC — Estação Área Comum (R$ 12,00/h • RF03)
                </button>
                <button
                  className="pixel-btn success"
                  style={{ padding: '12px 18px', fontSize: '0.92rem' }}
                  onClick={() => onBuyNewPc('VIP')}
                >
                  ★ Buy New PC — Estação VIP High-End (R$ 20,00/h • RF03)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
