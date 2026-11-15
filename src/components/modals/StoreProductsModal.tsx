import React, { useState } from 'react';
import { MAX_ESTACOES_MAPA } from '../../domain/LanHouseEngine';
import { AreaComputador, Produto, Sessao } from '../../domain/types';
import { formatarMoeda } from '../HudOverlay';
import { ProductIllustration } from '../ProductHdIcons';
import { HdIconStore } from '../HdIcons';

interface Props {
  produtos: Produto[];
  sessoes: Sessao[];
  computadoresCount?: number;
  onClose: () => void;
  onVenderParaSessao: (sessaoId: number, produtoId: number, qtd: number) => void;
  onReporEstoque: (produtoId: number, qtd: number) => void;
  onAtualizarPreco: (produtoId: number, novoPreco: number) => void;
  onBuyNewPc: (area: AreaComputador) => void;
}

type FiltroCat = 'TODOS' | Produto['categoria'] | 'BAIXO';

const LIMITE_BAIXO = 15;

const nomeCategoria: Record<Produto['categoria'], string> = {
  BEBIDA: '🥤 Bebidas',
  LANCHE: '🍔 Lanches',
  PERIFERICO: '🎧 Periféricos',
};

/**
 * Vitrine estilo e-commerce (cards de produto, filtros, estoque baixo, reposição em 1 clique)
 * + Loja de Hardware (RF03).
 */
export const StoreProductsModal: React.FC<Props> = ({
  produtos,
  sessoes,
  computadoresCount = MAX_ESTACOES_MAPA,
  onClose,
  onVenderParaSessao,
  onReporEstoque,
  onAtualizarPreco,
  onBuyNewPc,
}) => {
  const [aba, setAba] = useState<'INVENTARIO' | 'LOJA_HARDWARE'>('INVENTARIO');
  const sessoesAtivas = sessoes.filter((s) => s.status === 'ATIVA');
  const [sessaoDestinoId, setSessaoDestinoId] = useState<number>(sessoesAtivas[0]?.id || 0);
  const [editPrecoId, setEditPrecoId] = useState<number | null>(null);
  const [novoPrecoStr, setNovoPrecoStr] = useState('');
  const [busca, setBusca] = useState('');
  const [filtro, setFiltro] = useState<FiltroCat>('TODOS');
  const [ordem, setOrdem] = useState<'VENDIDOS' | 'PRECO' | 'ESTOQUE'>('VENDIDOS');
  const [feedback, setFeedback] = useState<string | null>(null);

  const maisVendido = [...produtos].sort((a, b) => b.vendidos - a.vendidos)[0];
  const valorEstoqueTotal = produtos.reduce((acc, p) => acc + p.preco * p.estoque, 0);
  const produtosBaixos = produtos.filter((p) => p.estoque <= LIMITE_BAIXO);
  const sessaoDestino = sessoesAtivas.find((s) => s.id === sessaoDestinoId);

  const lista = produtos
    .filter((p) => {
      const okCat =
        filtro === 'TODOS' ? true : filtro === 'BAIXO' ? p.estoque <= LIMITE_BAIXO : p.categoria === filtro;
      return okCat && p.nome.toLowerCase().includes(busca.toLowerCase());
    })
    .sort((a, b) =>
      ordem === 'VENDIDOS' ? b.vendidos - a.vendidos : ordem === 'PRECO' ? a.preco - b.preco : a.estoque - b.estoque
    );

  const avisar = (msg: string) => {
    setFeedback(msg);
    window.setTimeout(() => setFeedback(null), 2200);
  };

  const vender = (p: Produto) => {
    onVenderParaSessao(sessaoDestinoId, p.id, 1);
    avisar(`${p.nome} adicionado à conta de ${sessaoDestino?.clienteNome ?? 'cliente'}`);
  };

  const repor = (p: Produto) => {
    onReporEstoque(p.id, 10);
    avisar(`+10 unidades de ${p.nome} no estoque`);
  };

  const kpi = (titulo: string, valor: string, cor: string) => (
    <div className="pixel-subcard" style={{ padding: '8px 12px', borderLeft: `3px solid ${cor}` }}>
      <div style={{ fontSize: '0.74rem', color: '#94a3b8' }}>{titulo}</div>
      <div style={{ fontSize: '1.02rem', fontWeight: 800, color: cor }}>{valor}</div>
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-window"
        style={{ width: 'min(1040px, 95vw)', maxHeight: '89vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pixel-modal-header">
          <div className="pixel-modal-title">
            <HdIconStore size={26} />
            <span>LOJA & INVENTÁRIO</span>
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
              🍫 Bomboniere & Periféricos
            </button>
            <button
              className={`pixel-tab ${aba === 'LOJA_HARDWARE' ? 'active' : ''}`}
              onClick={() => setAba('LOJA_HARDWARE')}
            >
              ⚡ Loja de Hardware (RF03)
            </button>
          </div>

          {aba === 'INVENTARIO' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: '0.82rem', color: '#94a3b8' }}>Entregar para:</span>
              <select
                className="pixel-select"
                style={{ padding: '6px 10px', fontSize: '0.82rem' }}
                value={sessaoDestinoId}
                onChange={(e) => setSessaoDestinoId(Number(e.target.value))}
              >
                {sessoesAtivas.length === 0 ? (
                  <option value={0}>Sem sessão ativa</option>
                ) : (
                  sessoesAtivas.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.clienteNome} (PC-{String(s.computadorNumero).padStart(2, '0')})
                    </option>
                  ))
                )}
              </select>
            </div>
          )}
        </div>

        <div style={{ padding: 18, overflowY: 'auto', flex: 1, position: 'relative' }}>
          {feedback && (
            <div
              style={{
                position: 'sticky',
                top: 0,
                zIndex: 5,
                marginBottom: 10,
                padding: '8px 12px',
                background: 'rgba(22, 163, 74, 0.92)',
                border: '1px solid #4ade80',
                borderRadius: 6,
                color: '#fff',
                fontWeight: 600,
                fontSize: '0.84rem',
              }}
            >
              ✓ {feedback}
            </div>
          )}

          {aba === 'INVENTARIO' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))', gap: 10 }}>
                {kpi('Valor em Estoque', formatarMoeda(valorEstoqueTotal), '#4ade80')}
                {kpi(
                  'Mais Vendido',
                  maisVendido ? `${maisVendido.nome.split(' ')[0]} (${maisVendido.vendidos} un.)` : '—',
                  '#38bdf8'
                )}
                {kpi('Itens Cadastrados', `${produtos.length} produtos`, '#cbd5e1')}
                {kpi(
                  'Estoque Baixo',
                  produtosBaixos.length > 0 ? `${produtosBaixos.length} itens ⚠` : 'Tudo em dia',
                  produtosBaixos.length > 0 ? '#f87171' : '#4ade80'
                )}
              </div>

              {/* Alerta de reposição */}
              {produtosBaixos.length > 0 && (
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 12px',
                    background: 'rgba(239, 68, 68, 0.14)',
                    border: '1px solid #ef4444',
                    borderRadius: 6,
                    fontSize: '0.84rem',
                    color: '#fecaca',
                  }}
                >
                  <span>
                    ⚠ <strong>Reposição necessária:</strong> {produtosBaixos.map((p) => p.nome).join(', ')}
                  </span>
                  <button
                    className="pixel-btn danger"
                    style={{ padding: '5px 10px', fontSize: '0.78rem', whiteSpace: 'nowrap' }}
                    onClick={() => {
                      produtosBaixos.forEach((p) => onReporEstoque(p.id, 10));
                      avisar(`Reposição de ${produtosBaixos.length} itens concluída`);
                    }}
                  >
                    Repor todos (+10)
                  </button>
                </div>
              )}

              {/* Busca / filtros / ordenação */}
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                <input
                  className="pixel-input"
                  style={{ flex: 1, minWidth: 200, padding: '6px 11px', fontSize: '0.84rem' }}
                  placeholder="🔍 Buscar produto..."
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                />
                {(['TODOS', 'BEBIDA', 'LANCHE', 'PERIFERICO', 'BAIXO'] as const).map((c) => (
                  <button
                    key={c}
                    className={`pixel-tab ${filtro === c ? 'active' : ''}`}
                    style={{ padding: '5px 10px', fontSize: '0.76rem' }}
                    onClick={() => setFiltro(c)}
                  >
                    {c === 'TODOS' ? 'Todos' : c === 'BAIXO' ? '⚠ Estoque baixo' : nomeCategoria[c]}
                  </button>
                ))}
                <select
                  className="pixel-select"
                  style={{ padding: '6px 9px', fontSize: '0.8rem' }}
                  value={ordem}
                  onChange={(e) => setOrdem(e.target.value as typeof ordem)}
                >
                  <option value="VENDIDOS">Mais vendidos</option>
                  <option value="PRECO">Menor preço</option>
                  <option value="ESTOQUE">Menor estoque</option>
                </select>
              </div>

              {/* Vitrine */}
              {lista.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: 30 }}>
                  Nenhum produto encontrado.
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(215px, 1fr))', gap: 12 }}>
                  {lista.map((p) => {
                    const baixo = p.estoque <= LIMITE_BAIXO;
                    const esgotado = p.estoque <= 0;
                    const pct = Math.min(100, Math.round((p.estoque / 60) * 100));
                    return (
                      <div
                        key={p.id}
                        className="pixel-subcard"
                        style={{
                          padding: 12,
                          borderRadius: 8,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 8,
                          borderColor: baixo ? '#7f1d1d' : '#314770',
                          position: 'relative',
                        }}
                      >
                        {p.id === maisVendido?.id && (
                          <span
                            style={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              fontSize: '0.66rem',
                              fontWeight: 700,
                              padding: '2px 6px',
                              borderRadius: 10,
                              background: 'rgba(250, 204, 21, 0.18)',
                              color: '#fde047',
                              border: '1px solid #facc15',
                            }}
                          >
                            ★ Top vendas
                          </span>
                        )}
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'center',
                            alignItems: 'center',
                            padding: '8px 0',
                            background: 'radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, rgba(10, 18, 36, 0.85) 75%)',
                            borderRadius: 8,
                            border: '1px solid rgba(255, 255, 255, 0.05)',
                            minHeight: 84,
                          }}
                        >
                          <ProductIllustration icone={p.icone} size={62} />
                        </div>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#f8fafc' }}>{p.nome}</div>
                          <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                            {nomeCategoria[p.categoria]} • {p.vendidos} vendidos
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          {editPrecoId === p.id ? (
                            <input
                              type="number"
                              autoFocus
                              className="pixel-input"
                              style={{ width: 84, padding: '3px 6px' }}
                              value={novoPrecoStr}
                              onChange={(e) => setNovoPrecoStr(e.target.value)}
                              onBlur={() => {
                                onAtualizarPreco(p.id, Number(novoPrecoStr) || p.preco);
                                setEditPrecoId(null);
                              }}
                            />
                          ) : (
                            <span
                              style={{ fontWeight: 800, fontSize: '1.08rem', color: '#4ade80', cursor: 'pointer' }}
                              title="Clique para alterar preço (RN10)"
                              onClick={() => {
                                setEditPrecoId(p.id);
                                setNovoPrecoStr(p.preco.toFixed(2));
                              }}
                            >
                              {formatarMoeda(p.preco)} <span style={{ fontSize: '0.74rem', color: '#64748b' }}>✎</span>
                            </span>
                          )}
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              color: esgotado ? '#f87171' : baixo ? '#fbbf24' : '#94a3b8',
                            }}
                          >
                            {esgotado ? 'Esgotado' : baixo ? `Restam ${p.estoque}` : `${p.estoque} em estoque`}
                          </span>
                        </div>

                        <div style={{ height: 5, background: '#1e293b', borderRadius: 3, overflow: 'hidden' }}>
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: esgotado || baixo ? '#ef4444' : '#22c55e',
                            }}
                          />
                        </div>

                        <div style={{ display: 'flex', gap: 6 }}>
                          <button
                            className="pixel-btn primary"
                            style={{ flex: 1, padding: '7px 10px', fontSize: '0.8rem' }}
                            disabled={sessoesAtivas.length === 0 || esgotado}
                            onClick={() => vender(p)}
                          >
                            🛒 Vender
                          </button>
                          <button
                            className={`pixel-btn ${baixo ? 'warning' : ''}`}
                            style={{ padding: '7px 10px', fontSize: '0.8rem' }}
                            onClick={() => repor(p)}
                            title="Repor 10 unidades"
                          >
                            +10
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {aba === 'LOJA_HARDWARE' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 74, marginBottom: 8 }}>
                      <ProductIllustration icone={hw.icone} size={58} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '0.86rem' }}>{hw.nome}</div>
                    <div style={{ fontSize: '0.73rem', color: '#94a3b8', margin: '3px 0 8px' }}>{hw.sub}</div>
                    <span className="badge-pixel badge-ocupado">{hw.preco}</span>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14, marginTop: 6 }}>
                <button
                  className="pixel-btn primary"
                  disabled={computadoresCount >= MAX_ESTACOES_MAPA}
                  style={{ padding: '12px 18px', fontSize: '0.92rem', opacity: computadoresCount >= MAX_ESTACOES_MAPA ? 0.55 : 1 }}
                  onClick={() => onBuyNewPc('COMUM')}
                >
                  {computadoresCount >= MAX_ESTACOES_MAPA
                    ? `✓ Capacidade Comum Completa (${computadoresCount}/${MAX_ESTACOES_MAPA} no mapa)`
                    : `🖥️ Buy New PC — Estação Área Comum (${computadoresCount}/${MAX_ESTACOES_MAPA} • RF03)`}
                </button>
                <button
                  className="pixel-btn success"
                  disabled={computadoresCount >= MAX_ESTACOES_MAPA}
                  style={{ padding: '12px 18px', fontSize: '0.92rem', opacity: computadoresCount >= MAX_ESTACOES_MAPA ? 0.55 : 1 }}
                  onClick={() => onBuyNewPc('VIP')}
                >
                  {computadoresCount >= MAX_ESTACOES_MAPA
                    ? `✓ 6/6 VIP + 18/18 Comuns Ativos (Total ${MAX_ESTACOES_MAPA})`
                    : `★ Buy New PC — Estação VIP High-End (${computadoresCount}/${MAX_ESTACOES_MAPA} • RF03)`}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
