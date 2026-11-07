import React, { useState } from 'react';
import { Funcionario } from '../../domain/types';
import { FABRICA_CARGOS } from '../../domain/LanHouseEngine';
import { PixelAvatar } from '../PixelSprites';

interface Props {
  funcionarios: Funcionario[];
  operadorAtual: Funcionario;
  onClose: () => void;
  onAutenticarComSenha: (login: string, senha: string) => void;
  onTrocaRapidaDemo: (funcionarioId: number) => void;
}

/**
 * Modal de Autenticação (RF12 & RNF02) + Alternância Rápida de Cargo para Apresentação POO!
 */
export const LoginOperatorModal: React.FC<Props> = ({
  funcionarios,
  operadorAtual,
  onClose,
  onAutenticarComSenha,
  onTrocaRapidaDemo,
}) => {
  const [login, setLogin] = useState('carlos.lima');
  const [senha, setSenha] = useState('Lan@House2026');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onAutenticarComSenha(login, senha);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-window"
        style={{ width: 'min(760px, 94vw)', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="pixel-modal-header">
          <div className="pixel-modal-title">
            <span className="pixel-close-bracket" onClick={onClose}>
              [ X ]
            </span>
            <span>AUTENTICAÇÃO & CONTROLE DE ACESSO</span>
            <span className="badge-pixel badge-poo">RF12 • RNF02 • RN10</span>
          </div>
          <span style={{ color: '#94a3b8', cursor: 'pointer' }} onClick={onClose}>
            ✕
          </span>
        </div>

        <div style={{ padding: 18, display: 'grid', gridTemplateColumns: '1fr 1.15fr', gap: 16 }}>
          {/* Formulário Oficial com Verificação de Hash (RNF02) */}
          <form
            onSubmit={handleSubmit}
            className="pixel-subcard"
            style={{ padding: 15, display: 'flex', flexDirection: 'column', gap: 10 }}
          >
            <h3 style={{ fontSize: '0.96rem', color: '#38bdf8' }}>
              🔐 LOGIN COM SENHA PROTEGIDA (RNF02)
            </h3>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
              A senha nunca fica salva em texto puro: o sistema compara o hash <code>PBKDF2</code> igual ao <code>Seguranca.java</code>.
            </p>

            <label style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Login do Funcionário</label>
            <input
              className="pixel-input"
              value={login}
              onChange={(e) => setLogin(e.target.value)}
            />

            <label style={{ fontSize: '0.78rem', color: '#cbd5e1' }}>Senha</label>
            <input
              type="password"
              className="pixel-input"
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
            />

            <div style={{ fontSize: '0.73rem', color: '#facc15' }}>
              Senha padrão da equipe inicial: <code>Lan@House2026</code>
            </div>

            <button type="submit" className="pixel-btn primary" style={{ marginTop: 4 }}>
              [ Autenticar Operador ]
            </button>
          </form>

          {/* Troca Rápida para Demonstrar Herança & Permissões na Aula */}
          <div className="pixel-subcard" style={{ padding: 15 }}>
            <h3 style={{ fontSize: '0.96rem', color: '#4ade80', marginBottom: 6 }}>
              ⚡ TROCA RÁPIDA DE CARGO (MODO APRESENTAÇÃO)
            </h3>
            <p style={{ fontSize: '0.76rem', color: '#94a3b8', marginBottom: 10 }}>
              Clique em um perfil para testar na hora o que cada subclasse de <code>Funcionario</code> pode ou não fazer (RN10):
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, maxHeight: 245, overflowY: 'auto' }}>
              {funcionarios.map((f) => {
                const isAtivo = f.id === operadorAtual.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => {
                      onTrocaRapidaDemo(f.id);
                      onClose();
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '7px 10px',
                      background: isAtivo ? 'rgba(14, 165, 233, 0.24)' : '#0c1426',
                      border: `1px solid ${isAtivo ? '#38bdf8' : '#26385c'}`,
                      borderRadius: 4,
                      cursor: 'pointer',
                    }}
                  >
                    <PixelAvatar seed={f.avatarSeed} size={32} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.84rem', color: '#f8fafc' }}>
                        {f.nome}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#7dd3fc' }}>
                        {FABRICA_CARGOS[f.cargo].nomeExibicao} (@{f.login})
                      </div>
                    </div>
                    {isAtivo && (
                      <span className="badge-pixel badge-livre" style={{ fontSize: '0.65rem' }}>
                        ATIVO
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
