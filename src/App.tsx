import React, { useEffect, useState } from 'react';
import {
  lanHouseStore,
  RegraNegocioError,
} from './domain/LanHouseEngine';
import { ModalAtivo } from './domain/types';
import { soundFX } from './audio/soundEffects';
import { LanHouseCanvas } from './components/LanHouseCanvas';
import { HudOverlay } from './components/HudOverlay';
import { ComputersSessionsModal } from './components/modals/ComputersSessionsModal';
import { ClientsPaymentsModal } from './components/modals/ClientsPaymentsModal';
import { EmployeesModal } from './components/modals/EmployeesModal';
import { StoreProductsModal } from './components/modals/StoreProductsModal';
import { UpgradesEstablishmentModal } from './components/modals/UpgradesEstablishmentModal';
import { StatisticsReportModal } from './components/modals/StatisticsReportModal';
import { AchievementsModal } from './components/modals/AchievementsModal';
import { SettingsModal } from './components/modals/SettingsModal';
import { LoginOperatorModal } from './components/modals/LoginOperatorModal';
import { ParkingAutomationModal } from './components/modals/ParkingAutomationModal';

interface NotificacaoJogo {
  id: number;
  tipo: 'sucesso' | 'erro';
  titulo: string;
  mensagem: string;
}

export const App: React.FC = () => {
  const [, setVersao] = useState(0);
  const [modalAtivo, setModalAtivo] = useState<ModalAtivo>(null);
  const [pcFocado, setPcFocado] = useState<number | null>(null);
  const [sessaoCheckoutId, setSessaoCheckoutId] = useState<number | null>(null);
  const [notificacoes, setNotificacoes] = useState<NotificacaoJogo[]>([]);
  const [javaOnline, setJavaOnline] = useState(false);
  const [hudOculto, setHudOculto] = useState(false);

  const estado = lanHouseStore.getState();
  const operador = lanHouseStore.getOperadorLogado();

  useEffect(() => {
    soundFX.setConfig(estado.configuracoes);
  }, [estado.configuracoes]);

  useEffect(() => {
    return lanHouseStore.subscribe(() => setVersao((v) => v + 1));
  }, []);

  useEffect(() => {
    let cancelado = false;
    const checarBackendJava = async () => {
      try {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), 1200);
        const resp = await fetch(`${estado.configuracoes.urlBackendJava}/api/health`, {
          signal: ctrl.signal,
        });
        clearTimeout(timer);
        if (!cancelado) setJavaOnline(resp.ok);
      } catch {
        if (!cancelado) setJavaOnline(false);
      }
    };
    checarBackendJava();
    const interval = setInterval(checarBackendJava, 15000);
    return () => {
      cancelado = true;
      clearInterval(interval);
    };
  }, [estado.configuracoes.urlBackendJava]);

  useEffect(() => {
    const vel = estado.configuracoes.velocidadeSimulacao;
    if (vel === 0) return;
    const msPorMinuto = vel === 8 ? 900 : vel === 3 ? 2200 : 4800;
    const timer = setInterval(() => {
      lanHouseStore.avancarTempoSimulado(1);
    }, msPorMinuto);
    return () => clearInterval(timer);
  }, [estado.configuracoes.velocidadeSimulacao]);

  const dispararToast = (tipo: 'sucesso' | 'erro', titulo: string, mensagem: string) => {
    const novoId = Date.now() + Math.random();
    setNotificacoes((atuais) => [...atuais.slice(-3), { id: novoId, tipo, titulo, mensagem }]);
    setTimeout(() => {
      setNotificacoes((atuais) => atuais.filter((n) => n.id !== novoId));
    }, 5200);
  };

  const executarComTratamentoPOO = (acao: () => void, msgSucesso?: string, tocarMoeda = false) => {
    try {
      acao();
      if (tocarMoeda) {
        soundFX.playCoin();
      } else {
        soundFX.playSuccess();
      }
      if (msgSucesso) {
        dispararToast('sucesso', 'Operação Confirmada', msgSucesso);
      }
    } catch (err) {
      soundFX.playError();
      if (err instanceof RegraNegocioError) {
        dispararToast('erro', `Regra de Negócio [${err.codigoRegra}]`, err.message);
      } else if (err instanceof Error) {
        dispararToast('erro', 'Erro na Operação', err.message);
      }
    }
  };

  return (
    <div style={{ position: 'relative', width: '100vw', height: '100vh', overflow: 'hidden' }}>
      <LanHouseCanvas
        computadores={estado.computadores}
        sessoes={estado.sessoes}
        funcionarios={estado.funcionarios}
        personagens={estado.personagens}
        melhorias={estado.melhorias}
        configuracoes={estado.configuracoes}
        tarifaEstacionamento={estado.estacionamento.tarifaBase}
        estacionamentoAtivo={estado.melhorias.find((m) => m.id === 'srv_estacionamento')?.ativo ?? true}
        hudOculto={hudOculto}
        onRegistrarTicketEstacionamento={(placa, vagaId, modelo) =>
          lanHouseStore.registrarTicketEstacionamento(placa, vagaId, modelo)
        }
        onSelectPc={(num) => {
          soundFX.playClick();
          setPcFocado(num);
          setModalAtivo('COMPUTADORES');
        }}
        onSelectSector={(setor) => {
          soundFX.playClick();
          if (setor === 'RECEPCAO') setModalAtivo('CLIENTES');
          else if (setor === 'BOMBONIERE' || setor === 'ESTOQUE') setModalAtivo('LOJA');
          else if (setor === 'CONSOLES') setModalAtivo('MELHORIAS');
          else if (setor === 'ESCRITORIO') setModalAtivo('ESTATISTICAS');
          else if (setor === 'MANUTENCAO') setModalAtivo('COMPUTADORES');
          else if (setor === 'ESTACIONAMENTO') setModalAtivo('ESTACIONAMENTO');
        }}
      />

      <HudOverlay
        estado={estado}
        operador={operador}
        modalAtivo={modalAtivo}
        javaOnline={javaOnline}
        hudOculto={hudOculto}
        onToggleHud={() => {
          soundFX.playClick();
          setHudOculto((h) => !h);
        }}
        onOpenModal={(m) => {
          soundFX.playClick();
          setSessaoCheckoutId(null);
          setModalAtivo(m);
        }}
        onSetSpeed={(spd) => {
          soundFX.playClick();
          lanHouseStore.atualizarConfiguracoes({ velocidadeSimulacao: spd });
        }}
        onAdvanceMinutes={(mins) => {
          soundFX.playClick();
          lanHouseStore.avancarTempoSimulado(mins);
          dispararToast(
            'sucesso',
            `+${mins} Minutos Simulados`,
            'Cronômetros e valores das sessões ativas recalculados (RF07 / RN04)!'
          );
        }}
      />

      {/* Fila de Notificações Toast em Pilha */}
      {notificacoes.length > 0 && (
        <div
          style={{
            position: 'fixed',
            top: 16,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 90,
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
            alignItems: 'center',
            pointerEvents: 'none',
          }}
        >
          {notificacoes.map((n) => (
            <div
              key={n.id}
              className="pixel-window"
              style={{
                padding: '8px 16px',
                minWidth: 320,
                maxWidth: 540,
                borderColor: n.tipo === 'erro' ? '#f87171' : '#4ade80',
                pointerEvents: 'auto',
                boxShadow: '0 8px 24px rgba(0,0,0,0.85)',
              }}
            >
              <div
                style={{
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  color: n.tipo === 'erro' ? '#fca5a5' : '#86efac',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span>
                  {n.tipo === 'erro' ? '⚠ ' : '✔ '}
                  {n.titulo}
                </span>
                <span
                  style={{ cursor: 'pointer', marginLeft: 12, fontSize: '0.78rem', color: '#94a3b8' }}
                  onClick={() => setNotificacoes((atuais) => atuais.filter((item) => item.id !== n.id))}
                >
                  ✕
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#f8fafc', marginTop: 2 }}>
                {n.mensagem}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalAtivo === 'COMPUTADORES' && (
        <ComputersSessionsModal
          computadores={estado.computadores}
          clientes={estado.clientes}
          sessoes={estado.sessoes}
          produtos={estado.produtos}
          pcSelecionadoInicial={pcFocado}
          onClose={() => setModalAtivo(null)}
          onIniciarSessao={(cliId, pcNum) =>
            executarComTratamentoPOO(
              () => lanHouseStore.iniciarSessao(cliId, pcNum),
              `Sessão iniciada com sucesso no PC-${String(pcNum).padStart(2, '0')}!`
            )
          }
          onEncerrarSessao={(sessaoId, irPag) =>
            executarComTratamentoPOO(() => {
              const s = lanHouseStore.encerrarSessao(sessaoId);
              if (irPag) {
                setSessaoCheckoutId(s.id);
                setModalAtivo('CLIENTES');
              }
            }, 'Sessão encerrada e valor calculado automaticamente (RF06 / RF07)!')
          }
          onAdicionarConsumo={(sessaoId, prodId, qtd) =>
            executarComTratamentoPOO(
              () => lanHouseStore.adicionarConsumoSessao(sessaoId, prodId, qtd),
              'Item da Bomboniere adicionado à conta da sessão!'
            )
          }
          onColocarManutencao={(pcNum, motivo) =>
            executarComTratamentoPOO(
              () => lanHouseStore.colocarEmManutencao(pcNum, motivo),
              `PC-${String(pcNum).padStart(2, '0')} colocado em manutenção (RN05)!`
            )
          }
          onLiberarManutencao={(pcNum) =>
            executarComTratamentoPOO(
              () => lanHouseStore.liberarManutencao(pcNum),
              `PC-${String(pcNum).padStart(2, '0')} liberado e pronto para uso!`
            )
          }
          onCadastrarPc={(area, cat, spec, preco) =>
            executarComTratamentoPOO(
              () => lanHouseStore.cadastrarComputador(area, cat, spec, preco),
              'Novo computador cadastrado na LAN House (RF03)!'
            )
          }
          onAlterarTarifa={(pcNum, novoPreco) =>
            executarComTratamentoPOO(
              () => lanHouseStore.alterarTarifaComputador(pcNum, novoPreco),
              `Tarifa atualizada para R$ ${novoPreco.toFixed(2)}/h (RN10)!`
            )
          }
          onUpgradeHardware={(pcNum) =>
            executarComTratamentoPOO(
              () => lanHouseStore.upgradeHardwareComputador(pcNum),
              `Upgrade de CPU/GPU concluído no PC-${String(pcNum).padStart(2, '0')}!`,
              true
            )
          }
          onIrParaClientes={() => setModalAtivo('CLIENTES')}
        />
      )}

      {modalAtivo === 'CLIENTES' && (
        <ClientsPaymentsModal
          clientes={estado.clientes}
          sessoes={estado.sessoes}
          pagamentos={estado.pagamentos}
          sessaoCheckoutInicial={sessaoCheckoutId}
          onClose={() => setModalAtivo(null)}
          onCadastrarCliente={(nome, tel, doc) =>
            executarComTratamentoPOO(
              () => lanHouseStore.cadastrarCliente(nome, tel, doc),
              `Cliente ${nome} cadastrado com sucesso (RF01)!`
            )
          }
          onRegistrarPagamento={(sessaoId, forma, confirmar) =>
            executarComTratamentoPOO(
              () => lanHouseStore.registrarPagamento(sessaoId, forma, confirmar),
              `Pagamento via ${forma} registrado com sucesso (RF08)!`,
              true
            )
          }
          onConfirmarPagamento={(pagId) =>
            executarComTratamentoPOO(
              () => lanHouseStore.confirmarPagamentoPendente(pagId),
              'Pagamento confirmado e somado ao faturamento oficial (RN09)!',
              true
            )
          }
          onEstornarPagamento={(pagId) =>
            executarComTratamentoPOO(
              () => lanHouseStore.estornarPagamento(pagId),
              'Pagamento estornado pelo Administrador e estoque devolvido!'
            )
          }
        />
      )}

      {modalAtivo === 'FUNCIONARIOS' && (
        <EmployeesModal
          funcionarios={estado.funcionarios}
          onClose={() => setModalAtivo(null)}
          onContratar={(nome, login, senha, cargo, turno) =>
            executarComTratamentoPOO(
              () => lanHouseStore.contratarFuncionario(nome, login, senha, cargo, turno),
              `Funcionário ${nome} contratado na equipe (RF11)!`
            )
          }
          onAlternarTrabalho={(id) =>
            executarComTratamentoPOO(() =>
              lanHouseStore.alternarStatusTrabalhoFuncionario(id)
            )
          }
          onAlterarTurno={(id, turno) =>
            executarComTratamentoPOO(
              () => lanHouseStore.alterarTurnoFuncionario(id, turno),
              'Escala de turno atualizada!'
            )
          }
          onTrocarOperador={(id) => {
            lanHouseStore.trocarOperadorRapido(id);
            soundFX.playSuccess();
            dispararToast(
              'sucesso',
              'Operador Alterado (RF12)',
              `Agora operando como ${lanHouseStore.getOperadorLogado().nome}`
            );
          }}
        />
      )}

      {modalAtivo === 'LOJA' && (
        <StoreProductsModal
          produtos={estado.produtos}
          sessoes={estado.sessoes}
          onClose={() => setModalAtivo(null)}
          onVenderParaSessao={(sessaoId, prodId, qtd) =>
            executarComTratamentoPOO(
              () => lanHouseStore.adicionarConsumoSessao(sessaoId, prodId, qtd),
              'Produto lançado na sessão ativa!',
              true
            )
          }
          onReporEstoque={(prodId, qtd) =>
            executarComTratamentoPOO(
              () => lanHouseStore.reporEstoqueProduto(prodId, qtd),
              `Estoque reabastecido (+${qtd} unidades)!`
            )
          }
          onAtualizarPreco={(prodId, preco) =>
            executarComTratamentoPOO(
              () => lanHouseStore.atualizarPrecoProduto(prodId, preco),
              'Preço do produto atualizado (RN10)!'
            )
          }
          onBuyNewPc={(area) =>
            executarComTratamentoPOO(
              () =>
                lanHouseStore.cadastrarComputador(
                  area,
                  area === 'VIP' ? 'VIP Station' : 'PC Gaming',
                  area === 'VIP'
                    ? 'AMD Ryzen 7 7800X3D • RTX 4080 • 32GB RAM'
                    : 'AMD Ryzen 5 5600X • RX 7600 • 16GB RAM',
                  area === 'VIP' ? 20 : 12
                ),
              `Nova máquina ${area} adquirida e cadastrada (RF03)!`,
              true
            )
          }
          computadoresCount={estado.computadores.length}
        />
      )}

      {modalAtivo === 'MELHORIAS' && (
        <UpgradesEstablishmentModal
          melhorias={estado.melhorias}
          computadoresCount={estado.computadores.length}
          onClose={() => setModalAtivo(null)}
          onEvoluirOuAlternar={(id) =>
            executarComTratamentoPOO(
              () => lanHouseStore.evoluirMelhoriaEstabelecimento(id),
              'Estabelecimento atualizado com sucesso!',
              true
            )
          }
        />
      )}

      {modalAtivo === 'ESTATISTICAS' && (
        <StatisticsReportModal
          relatorio={lanHouseStore.gerarRelatorioFinanceiro()}
          computadores={estado.computadores}
          funcionarios={estado.funcionarios}
          historicoHorario={estado.historicoHorario}
          auditoria={estado.auditoria}
          totalClientes={estado.clientes.length}
          reputacao={estado.reputacao}
          onClose={() => setModalAtivo(null)}
        />
      )}

      {modalAtivo === 'CONQUISTAS' && (
        <AchievementsModal
          conquistas={lanHouseStore.obterConquistas()}
          onClose={() => setModalAtivo(null)}
          onResgatar={(id) => {
            lanHouseStore.resgatarConquista(id);
            soundFX.playCoin();
            dispararToast('sucesso', 'Conquista Resgatada!', 'Recompensa creditada no caixa e XP!');
          }}
          onResgatarTodas={() => {
            const qtd = lanHouseStore.resgatarTodasConquistas();
            if (qtd > 0) {
              soundFX.playCoin();
              dispararToast('sucesso', 'Conquistas Resgatadas!', `${qtd} recompensa(s) coletada(s)!`);
            } else {
              soundFX.playClick();
              dispararToast('sucesso', 'Conquistas', 'Nenhuma conquista pendente pronta para resgate.');
            }
          }}
        />
      )}

      {modalAtivo === 'CONFIGURACOES' && (
        <SettingsModal
          configuracoes={estado.configuracoes}
          onClose={() => setModalAtivo(null)}
          onSaveConfig={(cfg) => {
            lanHouseStore.atualizarConfiguracoes(cfg);
            soundFX.playSuccess();
            dispararToast('sucesso', 'Configurações Salvas', 'Preferências aplicadas com sucesso!');
          }}
          onExportSave={() => {
            const json = lanHouseStore.exportarSaveJson();
            const blob = new Blob([json], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'lanhouse-poo-save.json';
            a.click();
            URL.revokeObjectURL(url);
            soundFX.playSuccess();
          }}
          onImportSave={(json) =>
            executarComTratamentoPOO(
              () => lanHouseStore.importarSaveJson(json),
              'Banco de dados JSON importado com sucesso (RNF06)!'
            )
          }
          onResetSave={() => {
            lanHouseStore.resetarDadosIniciais();
            soundFX.playSuccess();
            dispararToast('sucesso', 'Dados Restaurados', 'Carga inicial restaurada com sucesso!');
          }}
        />
      )}

      {modalAtivo === 'LOGIN' && (
        <LoginOperatorModal
          funcionarios={estado.funcionarios}
          operadorAtual={operador}
          onClose={() => setModalAtivo(null)}
          onAutenticarComSenha={(login, senha) =>
            executarComTratamentoPOO(() => {
              const f = lanHouseStore.autenticar(login, senha);
              setModalAtivo(null);
              dispararToast('sucesso', 'Login Autenticado (RF12)', `Bem-vindo(a), ${f.nome}!`);
            })
          }
          onTrocaRapidaDemo={(id) => {
            lanHouseStore.trocarOperadorRapido(id);
            soundFX.playSuccess();
            dispararToast(
              'sucesso',
              'Perfil Ativo Alterado (RF12)',
              `Operando agora como ${lanHouseStore.getOperadorLogado().nome}`
            );
          }}
        />
      )}

      {modalAtivo === 'ESTACIONAMENTO' && (
        <ParkingAutomationModal
          estacionamento={estado.estacionamento}
          funcionarios={estado.funcionarios}
          servicoPagoAtivo={estado.melhorias.find((m) => m.id === 'srv_estacionamento')?.ativo ?? true}
          onAlterarTarifa={(v) =>
            executarComTratamentoPOO(
              () => lanHouseStore.alterarTarifaEstacionamento(v),
              `Tarifa do estacionamento ajustada para R$ ${v.toFixed(2)}!`
            )
          }
          onAlternarServicoPago={() =>
            executarComTratamentoPOO(
              () => lanHouseStore.evoluirMelhoriaEstabelecimento('srv_estacionamento'),
              'Modo de cobrança do estacionamento atualizado!'
            )
          }
          onAbrirStaff={() => setModalAtivo('FUNCIONARIOS')}
          onClose={() => setModalAtivo(null)}
        />
      )}
    </div>
  );
};
