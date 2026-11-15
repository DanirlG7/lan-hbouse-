import React, { useState } from 'react';
import { CargoFuncionario, Funcionario, Turno } from '../../domain/types';
import { FABRICA_CARGOS } from '../../domain/LanHouseEngine';
import { formatarMoeda } from '../HudOverlay';
import { PixelAvatar } from '../PixelSprites';

interface Props {
  funcionarios: Funcionario[];
  onClose: () => void;
  onContratar: (
    nome: string,
    login: string,
    senha: string,
    cargo: CargoFuncionario,
    turno: Turno
  ) => void;
  onAlternarTrabalho: (id: number) => void;
  onAlterarTurno: (id: number, turno: Turno) => void;
  onTrocarOperador: (id: number) => void;
}

const LABEL_TURNO: Record<Turno, { nome: string; horario: string }> = {
  MANHA: { nome: 'Manhã', horario: '(06h-14h)' },
  TARDE: { nome: 'Tarde', horario: '(14h-22h)' },
  NOITE: { nome: 'Noite', horario: '(22h-06h)' },
};

const EMOJI_HUMOR = {
  RADIANTE: { icone: '😄', cor: '#4ade80', label: 'Radiante' },
  FELIZ: { icone: '😊', cor: '#86efac', label: 'Feliz' },
  NEUTRO: { icone: '😐', cor: '#fde047', label: 'Neutro' },
  ESTRESSADO: { icone: '😡', cor: '#f87171', label: 'Estressado' },
};

/**
 * Fiel à Imagem 1: [X] GESTÃO DE FUNCIONÁRIOS + RF11 + Herança POO!
 */
export const EmployeesModal: React.FC<Props> = ({
  funcionarios,
  onClose,
  onContratar,
  onAlternarTrabalho,
  onAlterarTurno,
  onTrocarOperador,
}) => {
  const [aba, setAba] = useState<'GERAL' | 'TURNOS' | 'DESEMPENHO' | 'POO'>('GERAL');
  const [mostrarFormContratar, setMostrarFormContratar] = useState(false);
  const [detalheFunc, setDetalheFunc] = useState<Funcionario | null>(null);

  const [nome, setNome] = useState('');
  const [login, setLogin] = useState('');
  const [senha, setSenha] = useState('Lan@House2026');
  const [cargo, setCargo] = useState<CargoFuncionario>('RECEPCIONISTA');
  const [turno, setTurno] = useState<Turno>('TARDE');

  const folhaTotal = funcionarios.reduce((acc, f) => acc + f.salario, 0);

  const handleContratar = (e: React.FormEvent) => {
    e.preventDefault();
    onContratar(nome, login, senha, cargo, turno);
    setNome('');
    setLogin('');
    setMostrarFormContratar(false);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="pixel-window"
        style={{ width: 'min(960px, 95vw)', maxHeight: '86vh', display: 'flex', flexDirection: 'column' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header fiel à Imagem 1 */}
        <div className="pixel-modal-header">
          <div className="pixel-modal-title">
            <span>GESTÃO DE FUNCIONÁRIOS</span>
            <span className="badge-pixel badge-poo">RF11 • RF12 • Herança POO</span>
          </div>
          <span style={{ color: '#94a3b8', fontSize: '1.1rem', cursor: 'pointer' }} onClick={onClose}>
            ✕
          </span>
        </div>

        {/* Abas fiéis à Imagem 1 */}
        <div className="pixel-tabs">
          <button
            className={`pixel-tab ${aba === 'GERAL' ? 'active' : ''}`}
            onClick={() => setAba('GERAL')}
          >
            👥 Visão Geral
          </button>
          <button
            className={`pixel-tab ${aba === 'TURNOS' ? 'active' : ''}`}
            onClick={() => setAba('TURNOS')}
          >
            🕒 Escala de Turnos
          </button>
          <button
            className={`pixel-tab ${aba === 'DESEMPENHO' ? 'active' : ''}`}
            onClick={() => setAba('DESEMPENHO')}
          >
            📈 Desempenho
          </button>
          <button
            className={`pixel-tab ${aba === 'POO' ? 'active' : ''}`}
            onClick={() => setAba('POO')}
          >
            🧩 Hierarquia & Permissões (POO)
          </button>
        </div>

        <div style={{ padding: '14px 18px', overflowY: 'auto', flex: 1 }}>
          {mostrarFormContratar && (
            <form
              onSubmit={handleContratar}
              className="pixel-subcard"
              style={{
                padding: 14,
                marginBottom: 14,
                borderColor: '#38bdf8',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                gap: 10,
                alignItems: 'end',
              }}
            >
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Nome do Funcionário</label>
                <input
                  className="pixel-input"
                  style={{ width: '100%' }}
                  placeholder="Ex: Rafael Souza"
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Login de Acesso</label>
                <input
                  className="pixel-input"
                  style={{ width: '100%' }}
                  placeholder="Ex: rafael.souza"
                  value={login}
                  onChange={(e) => setLogin(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Senha (Hash RNF02)</label>
                <input
                  type="password"
                  className="pixel-input"
                  style={{ width: '100%' }}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Subclasse / Cargo (Herança)</label>
                <select
                  className="pixel-select"
                  style={{ width: '100%' }}
                  value={cargo}
                  onChange={(e) => setCargo(e.target.value as CargoFuncionario)}
                >
                  <option value="RECEPCIONISTA">Atendente / Recepcionista</option>
                  <option value="SUPORTE_TECNICO">Suporte Técnico</option>
                  <option value="LIMPEZA">Limpeza</option>
                  <option value="PORTEIRO_ESTACIONAMENTO">Porteiro do Estacionamento</option>
                  <option value="GUARDA_PATIO">Guarda de Pátio</option>
                  <option value="DESENVOLVEDOR">Desenvolvedor</option>
                  <option value="ADMINISTRADOR">Administrador</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Turno</label>
                <select
                  className="pixel-select"
                  style={{ width: '100%' }}
                  value={turno}
                  onChange={(e) => setTurno(e.target.value as Turno)}
                >
                  <option value="MANHA">Manhã (06h-14h)</option>
                  <option value="TARDE">Tarde (14h-22h)</option>
                  <option value="NOITE">Noite (22h-06h)</option>
                </select>
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <button type="submit" className="pixel-btn success">
                  [ Confirmar ]
                </button>
                <button
                  type="button"
                  className="pixel-btn"
                  onClick={() => setMostrarFormContratar(false)}
                >
                  [X]
                </button>
              </div>
            </form>
          )}

          {aba === 'GERAL' && (
            <table className="pixel-table">
              <thead>
                <tr>
                  <th>FUNCIONÁRIO</th>
                  <th>CARGO</th>
                  <th>TURNO</th>
                  <th>HUMOR</th>
                  <th>STATUS</th>
                  <th>AÇÕES</th>
                </tr>
              </thead>
              <tbody>
                {funcionarios.map((f) => {
                  const infoTurno = LABEL_TURNO[f.turno];
                  const humor = EMOJI_HUMOR[f.humor];
                  return (
                    <tr key={f.id}>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <PixelAvatar seed={f.avatarSeed} size={38} />
                          <div>
                            <div style={{ fontWeight: 700, color: '#f8fafc' }}>{f.nome}</div>
                            <div style={{ fontSize: '0.72rem', color: '#64748b' }}>@{f.login}</div>
                          </div>
                        </div>
                      </td>
                      <td>{FABRICA_CARGOS[f.cargo].nomeExibicao}</td>
                      <td>
                        <div>{infoTurno.nome}</div>
                        <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                          {infoTurno.horario}
                        </div>
                      </td>
                      <td style={{ color: humor.cor, fontWeight: 600 }}>
                        {humor.icone} {humor.label}
                      </td>
                      <td>
                        <span
                          onClick={() => onAlternarTrabalho(f.id)}
                          style={{
                            color: f.trabalhandoAgora ? '#4ade80' : '#facc15',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                          title="Clique para alternar Trabalhando / Em Pausa"
                        >
                          ● {f.trabalhandoAgora ? 'Trabalhando' : 'Em Pausa'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="pixel-btn"
                          style={{ padding: '5px 12px', fontSize: '0.82rem' }}
                          onClick={() => setDetalheFunc(f)}
                        >
                          Detalhes
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}

          {aba === 'TURNOS' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
              {(['MANHA', 'TARDE', 'NOITE'] as Turno[]).map((t) => (
                <div key={t} className="pixel-subcard" style={{ padding: 14 }}>
                  <h4 style={{ color: '#38bdf8', marginBottom: 10 }}>
                    🕒 Turno da {LABEL_TURNO[t].nome} {LABEL_TURNO[t].horario}
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {funcionarios
                      .filter((f) => f.turno === t)
                      .map((f) => (
                        <div
                          key={f.id}
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            background: '#0d1527',
                            padding: 8,
                            borderRadius: 3,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <PixelAvatar seed={f.avatarSeed} size={28} />
                            <div>
                              <div style={{ fontSize: '0.84rem', fontWeight: 700 }}>{f.nome}</div>
                              <div style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                                {FABRICA_CARGOS[f.cargo].nomeExibicao}
                              </div>
                            </div>
                          </div>
                          <select
                            className="pixel-select"
                            style={{ fontSize: '0.74rem', padding: '4px 6px' }}
                            value={f.turno}
                            onChange={(e) => onAlterarTurno(f.id, e.target.value as Turno)}
                          >
                            <option value="MANHA">Manhã</option>
                            <option value="TARDE">Tarde</option>
                            <option value="NOITE">Noite</option>
                          </select>
                        </div>
                      ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {aba === 'DESEMPENHO' && (
            <table className="pixel-table">
              <thead>
                <tr>
                  <th>FUNCIONÁRIO</th>
                  <th>CARGO</th>
                  <th>ATENDIMENTOS / OPERAÇÕES</th>
                  <th>SALÁRIO MENSAL</th>
                  <th>TESTAR PERFIL (RF12)</th>
                </tr>
              </thead>
              <tbody>
                {funcionarios.map((f) => (
                  <tr key={f.id}>
                    <td style={{ fontWeight: 700 }}>{f.nome}</td>
                    <td>{FABRICA_CARGOS[f.cargo].nomeExibicao}</td>
                    <td style={{ color: '#38bdf8', fontWeight: 700 }}>
                      {f.atendimentosRealizados} operações registradas
                    </td>
                    <td style={{ color: '#4ade80' }}>{formatarMoeda(f.salario)}</td>
                    <td>
                      <button
                        className="pixel-btn primary"
                        style={{ padding: '5px 12px', fontSize: '0.8rem', fontWeight: 600 }}
                        onClick={() => onTrocarOperador(f.id)}
                      >
                        Assumir Operador
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {aba === 'POO' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 12 }}>
              {(Object.keys(FABRICA_CARGOS) as CargoFuncionario[]).map((cKey) => {
                const perfil = FABRICA_CARGOS[cKey];
                return (
                  <div key={cKey} className="pixel-subcard" style={{ padding: 14 }}>
                    <div style={{ fontSize: '0.8rem', color: '#c084fc', fontWeight: 600 }}>
                      extends Funcionario
                    </div>
                    <h4 style={{ fontSize: '1rem', color: '#f8fafc', marginTop: 3 }}>
                      {perfil.nomeExibicao}
                    </h4>
                    <div style={{ fontSize: '0.82rem', color: '#4ade80', margin: '4px 0 8px' }}>
                      Salário Base: {formatarMoeda(perfil.salarioBase)}
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {perfil.obterPermissoes().map((perm) => (
                        <span key={perm} className="badge-pixel badge-ocupado" style={{ fontSize: '0.74rem' }}>
                          {perm}
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {detalheFunc && (
            <div
              className="pixel-subcard"
              style={{
                marginTop: 12,
                padding: 14,
                borderColor: '#38bdf8',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div>
                <div style={{ fontWeight: 700, color: '#38bdf8' }}>
                  Ficha POO — {detalheFunc.nome} ({FABRICA_CARGOS[detalheFunc.cargo].nomeExibicao})
                </div>
                <div style={{ fontSize: '0.76rem', color: '#94a3b8', marginTop: 3 }}>
                  Hash Senha (RNF02): <code>{detalheFunc.senhaHash}</code> • Permissões:{' '}
                  {FABRICA_CARGOS[detalheFunc.cargo].obterPermissoes().join(', ')}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  className="pixel-btn primary"
                  style={{ padding: '6px 14px', fontSize: '0.84rem', fontWeight: 600 }}
                  onClick={() => {
                    onTrocarOperador(detalheFunc.id);
                    setDetalheFunc(null);
                  }}
                >
                  Logar como {detalheFunc.nome.split(' ')[0]}
                </button>
                <button className="pixel-btn" style={{ padding: '6px 14px', fontSize: '0.84rem' }} onClick={() => setDetalheFunc(null)}>
                  Fechar
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé fiel à Imagem 1 */}
        <div
          style={{
            padding: '12px 18px',
            borderTop: '2px solid #283a5e',
            background: 'rgba(12, 19, 36, 0.9)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <div style={{ fontSize: '0.9rem', color: '#cbd5e1', fontWeight: 600 }}>
            👥 Equipe Atual: {funcionarios.filter((f) => f.trabalhandoAgora).length}/{funcionarios.length} Funcionários Ativos
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              className="pixel-btn primary"
              style={{ padding: '7px 14px', fontSize: '0.84rem', fontWeight: 600 }}
              onClick={() => setMostrarFormContratar(!mostrarFormContratar)}
            >
              + Contratar Funcionário
            </button>
            <button
              className="pixel-btn"
              style={{ padding: '7px 14px', fontSize: '0.84rem' }}
              onClick={() => setAba('DESEMPENHO')}
              title={`Folha mensal total: ${formatarMoeda(folhaTotal)}`}
            >
              Folha: {formatarMoeda(folhaTotal)}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
