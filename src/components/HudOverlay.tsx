import React from 'react';
import { Funcionario, ModalAtivo } from '../domain/types';
import { EstadoCompletoLanHouse, FABRICA_CARGOS } from '../domain/LanHouseEngine';
import { PixelAvatar, PixelIcon } from './PixelSprites';

interface Props {
  estado: EstadoCompletoLanHouse;
  operador: Funcionario;
  modalAtivo: ModalAtivo;
  javaOnline: boolean;
  onOpenModal: (modal: ModalAtivo) => void;
  onSetSpeed: (speed: 0 | 1 | 3 | 8) => void;
  onAdvanceMinutes: (mins: number) => void;
}

export const formatarMoeda = (valor: number) =>
  valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const HudOverlay: React.FC<Props> = ({
  estado,
  operador,
  modalAtivo,
  javaOnline,
  onOpenModal,
  onSetSpeed,
  onAdvanceMinutes,
}) => {
  const dataObj = new Date(estado.relogioIso);
  const horaStr = dataObj.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
  const dataCurta = dataObj.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  });

  const pcsLivres = estado.computadores.filter((c) => c.status === 'LIVRE').length;
  const sessoesEncerradasSemPag = estado.sessoes.filter(
    (s) =>
      s.status === 'ENCERRADA' &&
      !estado.pagamentos.some((p) => p.sessaoId === s.id && p.status !== 'ESTORNADO')
  ).length;
  const pagsPendentes =
    estado.pagamentos.filter((p) => p.status === 'PENDENTE').length +
    sessoesEncerradasSemPag;

  const xpPercent = Math.min(
    100,
    Math.round((estado.xpAtual / estado.xpProximoNivel) * 100)
  );
  const ultimoLog = estado.auditoria[0];

  const missaoMeta = 12;
  const missaoProgresso = Math.min(missaoMeta, estado.sessoes.length);

  return (
    <>
      {/* TOPO ESQUERDO: Card do Gerente / Operador Logado (RF12) */}
      <div
        className="pixel-hud-card"
        style={{
          position: 'fixed',
          top: 12,
          left: 12,
          zIndex: 25,
          padding: '10px 12px',
          width: 246,
        }}
      >
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <PixelAvatar seed={operador.avatarSeed} size={54} />
            <span
              style={{
                position: 'absolute',
                bottom: -4,
                left: 0,
                right: 0,
                background: '#0ea5e9',
                color: '#fff',
                fontSize: '0.64rem',
                fontWeight: 700,
                textAlign: 'center',
                borderRadius: 2,
              }}
            >
              Lv. {estado.nivelGerente}
            </span>
          </div>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontWeight: 700,
                fontSize: '0.96rem',
                color: '#f8fafc',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {operador.nome}
            </div>
            <div style={{ fontSize: '0.73rem', color: '#7dd3fc', fontWeight: 600 }}>
              {FABRICA_CARGOS[operador.cargo].nomeExibicao}
            </div>
            <div
              style={{
                fontSize: '0.88rem',
                fontWeight: 700,
                color: '#4ade80',
                marginTop: 2,
              }}
            >
              ● {formatarMoeda(estado.caixaSaldo)}
            </div>
            <div style={{ fontSize: '0.74rem', color: '#fde047' }}>
              ★ Reputação: {estado.reputacao}%
            </div>
          </div>
        </div>

        {/* Barra de XP + Botão Trocar Operador (RF12) */}
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              fontSize: '0.68rem',
              color: '#94a3b8',
              marginBottom: 3,
            }}
          >
            <span>XP {estado.xpAtual} / {estado.xpProximoNivel}</span>
            <button
              onClick={() => onOpenModal('LOGIN')}
              style={{
                background: 'none',
                border: 'none',
                color: '#38bdf8',
                fontWeight: 700,
                fontSize: '0.7rem',
                cursor: 'pointer',
                textDecoration: 'underline',
              }}
            >
              [Trocar Login RF12]
            </button>
          </div>
          <div
            style={{
              height: 6,
              background: '#0d1527',
              border: '1px solid #2b426e',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${xpPercent}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0ea5e9, #38bdf8)',
              }}
            />
          </div>
        </div>
      </div>

      {/* MEIO ESQUERDO: Lista Lateral de Funcionários (igual às referências!) */}
      <div
        className="pixel-hud-card"
        style={{
          position: 'fixed',
          top: 148,
          left: 12,
          zIndex: 25,
          width: 196,
          maxHeight: 'calc(100vh - 315px)',
          display: 'flex',
          flexDirection: 'column',
          padding: '8px 10px',
        }}
      >
        <div
          style={{
            fontSize: '0.8rem',
            fontWeight: 700,
            color: '#cbd5e1',
            paddingBottom: 6,
            borderBottom: '1px solid #2b3f66',
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <span>Funcionários ({estado.funcionarios.length})</span>
          <span style={{ color: '#4ade80', fontSize: '0.72rem' }}>
            {estado.funcionarios.filter((f) => f.trabalhandoAgora).length} on
          </span>
        </div>

        <div
          style={{
            overflowY: 'auto',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 6,
            padding: '6px 2px',
          }}
        >
          {estado.funcionarios.map((f) => (
            <div
              key={f.id}
              onClick={() => onOpenModal('FUNCIONARIOS')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                cursor: 'pointer',
                padding: '3px 4px',
                borderRadius: 3,
                background:
                  f.id === operador.id ? 'rgba(56, 189, 248, 0.14)' : 'transparent',
              }}
            >
              <PixelAvatar seed={f.avatarSeed} size={28} />
              <div style={{ minWidth: 0, flex: 1 }}>
                <div
                  style={{
                    fontSize: '0.77rem',
                    fontWeight: 600,
                    color: '#f1f5f9',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {f.nome.split(' ')[0]}
                </div>
                <div
                  style={{
                    fontSize: '0.67rem',
                    color: f.trabalhandoAgora ? '#4ade80' : '#fbbf24',
                  }}
                >
                  {FABRICA_CARGOS[f.cargo].nomeExibicao.split(' ')[0]} •
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          className="pixel-btn"
          style={{ width: '100%', marginTop: 6, fontSize: '0.75rem', padding: '5px 8px' }}
          onClick={() => onOpenModal('FUNCIONARIOS')}
        >
          👥 Gerenciar Equipe
        </button>
      </div>

      {/* CANTO INFERIOR ESQUERDO: Card MISSÃO ATUAL */}
      <div
        className="pixel-hud-card"
        onClick={() => onOpenModal('CONQUISTAS')}
        style={{
          position: 'fixed',
          bottom: 12,
          left: 12,
          zIndex: 25,
          width: 254,
          padding: '10px 12px',
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            fontSize: '0.76rem',
            fontWeight: 700,
            color: '#facc15',
            letterSpacing: '0.05em',
          }}
        >
          ★ MISSÃO ATUAL
        </div>
        <div style={{ fontSize: '0.83rem', fontWeight: 600, marginTop: 3, color: '#f1f5f9' }}>
          Realize {missaoMeta} sessões na LAN House
        </div>
        <div style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: 1 }}>
          Inicie e encerre sessões para elevar sua reputação.
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginTop: 7,
          }}
        >
          <div
            style={{
              flex: 1,
              height: 8,
              background: '#0c1426',
              border: '1px solid #334b78',
              borderRadius: 2,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                width: `${(missaoProgresso / missaoMeta) * 100}%`,
                height: '100%',
                background: 'linear-gradient(90deg, #0284c7, #38bdf8)',
              }}
            />
          </div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#cbd5e1' }}>
            {missaoProgresso}/{missaoMeta}
          </span>
        </div>
        <div style={{ fontSize: '0.68rem', color: '#4ade80', marginTop: 4 }}>
          Recompensa: XP 400 • R$ 1.500,00
        </div>
      </div>

      {/* TOPO DIREITO: Relógio, Clima, Velocidade do Tempo & Card Estoque e Vendas */}
      <div
        style={{
          position: 'fixed',
          top: 12,
          right: 12,
          zIndex: 25,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 8,
        }}
      >
        <div
          className="pixel-hud-card"
          style={{
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div>
            <div style={{ fontSize: '1.08rem', fontWeight: 700, color: '#f8fafc' }}>
              🕒 {horaStr}
            </div>
            <div style={{ fontSize: '0.68rem', color: '#94a3b8', textTransform: 'capitalize' }}>
              {dataCurta}
            </div>
          </div>

          <div style={{ borderLeft: '1px solid #2b3f66', paddingLeft: 12 }}>
            <div style={{ fontSize: '0.84rem', color: '#fde047', fontWeight: 600 }}>
              ☀ 24°C
            </div>
            <div style={{ fontSize: '0.68rem', color: '#4ade80', fontWeight: 700 }}>
              {javaOnline ? '● API Java Online' : '● Motor POO Ativo'}
            </div>
          </div>

          {/* Controles de Velocidade e Avanço de Minutos (ótimo para testar RF07!) */}
          <div
            style={{
              borderLeft: '1px solid #2b3f66',
              paddingLeft: 12,
              display: 'flex',
              gap: 4,
              alignItems: 'center',
            }}
          >
            {([0, 1, 3, 8] as const).map((spd) => (
              <button
                key={spd}
                onClick={() => onSetSpeed(spd)}
                className="pixel-btn"
                style={{
                  padding: '4px 7px',
                  fontSize: '0.72rem',
                  borderColor:
                    estado.configuracoes.velocidadeSimulacao === spd
                      ? '#38bdf8'
                      : '#364e7c',
                  background:
                    estado.configuracoes.velocidadeSimulacao === spd
                      ? '#0369a1'
                      : '#17233e',
                }}
                title={spd === 0 ? 'Pausar relógio' : `Velocidade ${spd}x`}
              >
                {spd === 0 ? '⏸' : `${spd}x`}
              </button>
            ))}
            <button
              onClick={() => onAdvanceMinutes(15)}
              className="pixel-btn warning"
              style={{ padding: '4px 8px', fontSize: '0.72rem' }}
              title="Avança +15 minutos nas sessões ativas para demonstrar cálculo de valor (RF07)"
            >
              +15min
            </button>
          </div>
        </div>

        {/* Mini-Painel ESTOQUE E VENDAS (idêntico às referências!) */}
        <div
          className="pixel-hud-card"
          onClick={() => onOpenModal('LOJA')}
          style={{
            width: 215,
            padding: '8px 12px',
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              fontSize: '0.74rem',
              fontWeight: 700,
              color: '#cbd5e1',
              borderBottom: '1px solid #2b3f66',
              paddingBottom: 4,
              marginBottom: 5,
              letterSpacing: '0.05em',
            }}
          >
            ESTOQUE E VENDAS
          </div>
          {estado.produtos.slice(0, 4).map((p) => (
            <div
              key={p.id}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.74rem',
                padding: '2px 0',
              }}
            >
              <span style={{ color: '#94a3b8' }}>• {p.nome.split(' ')[0]}:</span>
              <span
                style={{
                  fontWeight: 700,
                  color: p.estoque <= 10 ? '#f87171' : '#4ade80',
                }}
              >
                {p.estoque} un ({formatarMoeda(p.preco)})
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* DOCK INFERIOR CENTRAL (Barra Principal de Navegação Estilo Jogo) */}
      <div
        className="pixel-hud-card"
        style={{
          position: 'fixed',
          bottom: 12,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 30,
          display: 'flex',
          gap: 6,
          padding: '7px 12px',
        }}
      >
        {[
          {
            id: 'COMPUTADORES' as ModalAtivo,
            label: 'Computadores',
            icon: 'pc' as const,
            badge: `${pcsLivres}/${estado.computadores.length}`,
            badgeColor: '#22c55e',
          },
          {
            id: 'CLIENTES' as ModalAtivo,
            label: 'Clientes & Caixa',
            icon: 'clients' as const,
            badge: pagsPendentes > 0 ? `${pagsPendentes}` : undefined,
            badgeColor: '#f59e0b',
          },
          {
            id: 'LOJA' as ModalAtivo,
            label: 'Loja',
            icon: 'store' as const,
          },
          {
            id: 'MELHORIAS' as ModalAtivo,
            label: 'Melhorias',
            icon: 'upgrades' as const,
          },
          {
            id: 'FUNCIONARIOS' as ModalAtivo,
            label: 'Equipe',
            icon: 'staff' as const,
          },
          {
            id: 'ESTATISTICAS' as ModalAtivo,
            label: 'Estatísticas',
            icon: 'stats' as const,
          },
          {
            id: 'CONQUISTAS' as ModalAtivo,
            label: 'Conquistas',
            icon: 'trophy' as const,
          },
          {
            id: 'CONFIGURACOES' as ModalAtivo,
            label: 'Configurações',
            icon: 'settings' as const,
          },
        ].map((item) => {
          const isAtivo = modalAtivo === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onOpenModal(isAtivo ? null : item.id)}
              style={{
                position: 'relative',
                background: isAtivo
                  ? 'linear-gradient(180deg, rgba(14,165,233,0.35), rgba(3,105,161,0.5))'
                  : 'rgba(20, 30, 54, 0.75)',
                border: `1px solid ${isAtivo ? '#38bdf8' : '#2d426b'}`,
                borderRadius: 4,
                padding: '6px 11px',
                minWidth: 84,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                cursor: 'pointer',
                color: isAtivo ? '#ffffff' : '#cbd5e1',
                transition: 'all 0.14s ease',
              }}
            >
              {item.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: -5,
                    right: -4,
                    background: item.badgeColor || '#0ea5e9',
                    color: '#090f1d',
                    fontSize: '0.64rem',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: 8,
                  }}
                >
                  {item.badge}
                </span>
              )}
              <PixelIcon name={item.icon} size={26} />
              <span style={{ fontSize: '0.7rem', fontWeight: 600 }}>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* CANTO INFERIOR DIREITO: Badge Modo 24h & Feed de Auditoria POO */}
      <div
        className="pixel-hud-card"
        style={{
          position: 'fixed',
          bottom: 12,
          right: 12,
          zIndex: 25,
          width: 248,
          padding: '9px 12px',
          borderColor: '#0ea5e9',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#38bdf8' }}>
            ✦ Modo 24h Ativo
          </span>
          {ultimoLog?.regraRelacionada && (
            <span className="badge-pixel badge-poo">{ultimoLog.regraRelacionada}</span>
          )}
        </div>
        <div
          style={{
            fontSize: '0.72rem',
            color: '#cbd5e1',
            marginTop: 4,
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {ultimoLog ? ultimoLog.descricao : 'Sua LAN House funciona dia e noite!'}
        </div>
      </div>
    </>
  );
};
