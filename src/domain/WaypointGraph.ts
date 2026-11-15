import { Computador, Funcionario, Sessao } from './types';
import { construirGrafo } from '../world/graph';
import { BOT_SPEED_SCALE, TILE_SIZE } from '../world/constants';
import { Loja, LOJAS } from '../world/decor';
import { ASSENTOS_ESPERA, ASSENTOS_REFEICAO, AssentoEspera, AssentoRefeicao } from '../world/mobiliario';
import { ehCaminhavel } from '../world/collision';
import { obterResumoEstacionamento } from '../world/parking';

export type DirecaoSprite = 'DOWN' | 'UP' | 'LEFT' | 'RIGHT';

export type PoseBot =
  | 'WALK'
  | 'IDLE'
  | 'SITTING_PC'
  | 'PC_TRIPLE_KILL'
  | 'PC_LOUCURA'
  | 'CARRYING_BOX'
  | 'WORKING_TOOL'
  | 'CLEANING'
  | 'EATING'
  | 'CHATTING'
  | 'SITTING_EAT'
  | 'SITTING_REST'
  | 'PLAY_POOL'
  | 'ROMANCE_CUDDLE'
  | 'ROMANCE_KISS'
  | 'FIGHT_STANCE'
  | 'PUNCH'
  | 'KICK'
  | 'BLOCK'
  | 'CHEER';

export type EventoPcHype = 'TRIPLE_KILL' | 'PENTA_KILL' | 'ACE' | 'HEADSHOT' | 'LOUCURA';

export function ehPosePc(pose: PoseBot): boolean {
  return pose === 'SITTING_PC' || pose === 'PC_TRIPLE_KILL' || pose === 'PC_LOUCURA';
}

export interface EstadoPcHypeVisual {
  numeroPc: number;
  tipo: EventoPcHype;
  label: string;
  progresso: number;
}

export type UniformeFuncionario =
  | 'GERENTE'
  | 'RECEPCAO'
  | 'TECNICO'
  | 'ESTOQUE'
  | 'LANCHONETE'
  | 'LIMPEZA'
  | 'DEV'
  | 'SEGURANCA'
  | 'ESTACIONAMENTO';

export type FerramentaTrabalho =
  | 'VASSOURA'
  | 'CHAVE_SOLDA'
  | 'CAIXA'
  | 'PRANCHETA'
  | 'BANDEJA_LANCHE'
  | 'TABLET_EXEC'
  | 'LAPTOP_DEV'
  | 'NONE';

export interface WaypointNode {
  id: string;
  x: number;
  y: number;
  vizinhos: string[];
  etiqueta?: string;
}

/**
 * GRAFO DE ROTAS: gerado automaticamente a partir do layout em dados (src/world/layout.ts)
 * e da camada de colisão (src/world/collision.ts). Veja src/world/graph.ts.
 */
export const WAYPOINT_NODES: Record<string, WaypointNode> = construirGrafo();

export function nodoAssentoDoPc(numeroPc: number): string {
  if (numeroPc >= 1 && numeroPc <= 12) {
    return `pc_${String(numeroPc).padStart(2, '0')}_seat`;
  }
  if (numeroPc >= 13 && numeroPc <= 18) {
    return `vip_${String(numeroPc).padStart(2, '0')}_seat`;
  }
  if (numeroPc >= 19 && numeroPc <= 24) {
    return `deck_${String(numeroPc).padStart(2, '0')}_seat`;
  }
  return 'pc_01_seat';
}

export function calcularCaminhoNoGrafo(origemId: string, destinoId: string): string[] {
  if (origemId === destinoId) return [];
  if (!WAYPOINT_NODES[origemId] || !WAYPOINT_NODES[destinoId]) return [destinoId];

  const fila: string[][] = [[origemId]];
  const visitados = new Set<string>([origemId]);

  while (fila.length > 0) {
    const caminho = fila.shift()!;
    const atual = caminho[caminho.length - 1];

    if (atual === destinoId) {
      return caminho.slice(1);
    }

    const nodo = WAYPOINT_NODES[atual];
    if (!nodo) continue;

    for (const viz of nodo.vizinhos) {
      if (!visitados.has(viz)) {
        visitados.add(viz);
        fila.push([...caminho, viz]);
      }
    }
  }

  return [destinoId];
}

export interface EstadoArenaVisual {
  hpRed: number;
  hpBlue: number;
  bag1Hit: boolean;
  bag2Hit: boolean;
  koFlash: boolean;
}

export interface AgenteBot {
  id: string;
  nome: string;
  papel: string;
  ehCliente: boolean;
  x: number;
  y: number;
  nodoAtualId: string;
  filaRota: string[];
  direcao: DirecaoSprite;
  pose: PoseBot;
  acaoTexto: string; // Descrição completa (aparece no hover/inspeção)
  falaCurta: string; // Tag curta e super legível (máx ~15 chars)
  iconeCabeca?: string;
  mostrarBalao: boolean;
  timerEsperaFrames: number;
  timerConversaFrames: number;
  cooldownConversaFrames: number;
  etapaRotina: number;
  corRoupa: string;
  corCabelo: string;
  temFone: boolean;
  uniforme?: UniformeFuncionario;
  ferramenta?: FerramentaTrabalho;
  profundidadeOffset?: number;
  comendoItem?: string;
  assentoReservadoId?: string;
  estadoLanchonete?: 'INDO_FILA' | 'NA_FILA' | 'INDO_MESA' | 'SENTADO_COMENDO';
  destinoAssentoId?: string;
  assentoEsperaId?: string;
  eventoPcHype?: EventoPcHype;
  eventoPcLabel?: string;
  estadoEsperaSalao?: 'INDO_ESPERA' | 'DESCANSANDO';
  pcProximaTriggerTick?: number;
  pcHypeAteTick?: number;
  pcChatProximaTick?: number;
  pcChatAteTick?: number;
  pcChatTexto?: string;
  pcChatIcone?: string;
  pcTempoSentadoFrames?: number;
  balaoVisivelAteTick?: number;
  balaoCooldownAteTick?: number;
  balaoUltimoTexto?: string;
  balaoPrioridade?: number;
}

const MAX_BALOES_MUNDO = 7;
const MAX_PC_HYPES_SIMULTANEOS = 2;

const hashDeterministico = (a: number, b: number): number => {
  let h = (a * 374761393 + b * 668265263) >>> 0;
  h = ((h ^ (h >> 13)) * 1274126177) >>> 0;
  return (h ^ (h >> 16)) >>> 0;
};

const FRASES_PC_CLIP_STREAK: Array<{ tipo: EventoPcHype; label: string }> = [
  { tipo: 'TRIPLE_KILL', label: 'TRIPLE KILL!' },
  { tipo: 'PENTA_KILL', label: 'PENTA KILL!' },
  { tipo: 'ACE', label: 'ACE CLUTCH!' },
  { tipo: 'HEADSHOT', label: 'HEADSHOT!!' },
  { tipo: 'TRIPLE_KILL', label: 'CLIPEI ESSA!!' },
  { tipo: 'ACE', label: '4K INSANO!!' },
  { tipo: 'HEADSHOT', label: '200 DE QI!!' },
  { tipo: 'PENTA_KILL', label: 'MVP DA PARTIDA!' },
];

const FRASES_PC_LOUCURA: string[] = [
  'INCORPOROU!!',
  'MODO DEUS!!',
  'CORINGOU!!',
  'IMPARÁVEL!!',
  'TÁ POSSUÍDO!!',
  'VOANDO BAIXO!!',
  'DESLIGA O HACK!!',
  'QUE BALA ABSURDA!!',
];

const REACOES_PC_VIZINHO: string[] = [
  'Clipei pra você!!',
  'Chama o VAR!!',
  'Que mira foi essa?!',
  'Salva o VOD!!',
  'Monstro sagrado!!',
  'Jogou demais cara!',
  'Vai pro TikTok!!',
  'Impossível isso!',
  'Deu aula hoje!!',
  'Amassou o time!',
];

const CONVERSAS_PC_POR_JOGO: Record<string, string[]> = {
  CS2: ['Dropa a AWP!', 'Smoke meio rápido', 'Rotaciona pro B!', 'Defusa agora!!', 'Miado 1 HP!', 'Segura o rush!'],
  Valorant: ['Ulta na spike!', 'Cuidado no bomb A', 'Olha esse flick!', 'Pinou tudo kkk', 'Clutch 1v3 calma', 'Bora retake!'],
  LoL: ['Ganka o bot!', 'Wardou o barão?', 'Combo perfeito!', 'Ultou na hora H', 'Solo kill no mid', 'Falta 150g pra item'],
  'GTA RP': ['Fuga de helicóptero!', 'Chamou no drift!', 'Polícia colando!!', 'Partiu assalto RP', 'Bora garagem sul'],
  'EA FC': ['Cravou no ângulo!', 'Gol de placa!!', 'Tiki-taka liso', 'Defendeu pênalti!!', 'Sem chance pro GK!'],
  'Dota 2': ['Roshan tá vivo!', 'Black Hole perfeito', 'Compra BKB logo', 'Empurra a T3!'],
  Fortnite: ['Construiu torreão!', 'Edit rápido d+!', 'Vitória Royale!!', 'Puxa a pump!'],
  Warzone: ['Cai no loadout!', 'Plate acabou!!', 'Sniper na torre!', 'Clutch no gulag!'],
  Apex: ['Crackei o colete!', 'Terceira squad!', 'Shieldou rápido', 'Movimento liso!'],
};

const CONVERSAS_PC_GERAIS: string[] = [
  'Ping tá 2ms liso!',
  '360Hz faz diferença',
  'Não erra uma hoje!',
  'Vou baixar mais 2h',
  'Calma q eu salvo',
  'Time tá entrosado',
  'Só mais uma win',
  'Tô on fire demais',
  'Manda link do clipe!',
  'Mousepad voando!',
];

const DIALOGOS_PC_BANCADA: Array<[string, string]> = [
  ['Clipei sua play!', 'Manda no Zap!!'],
  ['Caiu de novo?!', 'Pinou o mouse kkk'],
  ['Bora duo depois?', 'Fechou, puxa fila!'],
  ['Olha esse FPS!', '300 liso no ultra'],
  ['Passa a call A!', 'Dois entrando varanda'],
  ['Vai renovar hora?', 'Só saio com win!'],
  ['Que bala limpa!', 'Pura mira treinada'],
  ['Cuidado às costas', 'Valeu pela call!'],
  ['Pede refri aí?', 'Bora rachar pizza!'],
  ['Salvou o clutch!', 'Confia no pai!'],
];

const CORES_ROUPA_BOT = [
  '#2563eb',
  '#e11d48',
  '#059669',
  '#7c3aed',
  '#d97706',
  '#0284c7',
  '#db2777',
  '#4f46e5',
  '#0d9488',
  '#ea580c',
];
const CORES_CABELO_BOT = ['#7c2d12', '#1e293b', '#92400e', '#7f1d1d', '#3b0764', '#3f3f46'];

// Diálogos curtos e aleatórios quando 2 bots param para conversar na calçada, mesas ou corredores!
const DIALOGOS_CONVERSA_CURTOS: Array<[string, string]> = [
  ['"Bora CS2?"', '"Fechou, PC 8!"'],
  ['"Ping tá 1ms!"', '"Fibra braba!"'],
  ['"Viu o VIP?"', '"RTX 4090 lisa!"'],
  ['"Pede pizza?"', '"Com energético!"'],
  ['"Vai no camp?"', '"Time fechado!"'],
  ['"144Hz ou 360?"', '"360Hz no VIP!"'],
  ['"Bora FIFA?"', '"No PS5 agora!"'],
  ['"Combo Burger?"', '"Bora no Truck!"'],
  ['"Coxinha top!"', '"Pede açaí tb!"'],
  ['"Divide pizza?"', '"Calabresa + refri!"'],
  ['"Achou capinha?"', '"Na barraca ali!"'],
  ['"Carta rara?"', '"Veio foil!"'],
  ['"Café fresquinho"', '"Vou pegar um!"'],
  ['"Vim só comer!"', '"Melhor lanchonete!"'],
];

// =============================================================================
// VISITANTES EXTRAS GERADOS (deixa o espaço vivo: lanchonete, mesas, barracas e lounge)
// Sorteio determinístico (mesmas pessoas a cada carregamento). Só usa nós públicos.
// =============================================================================
interface PassoRoteiro {
  nodo: string;
  curto: string;
  acao: string;
  icone: string;
  pose: PoseBot;
  dir: DirecaoSprite;
  tempo: number;
}

const TOTAL_VISITANTES_EXTRAS = 28;

const PARADAS_LANCHONETE: Array<Omit<PassoRoteiro, 'tempo'>> = [
  { nodo: 'cozinha_balcao', curto: 'Pedido', acao: 'Fazendo pedido no balcão da lanchonete', icone: '🧾', pose: 'IDLE', dir: 'UP' },
  { nodo: 'cozinha_geladeira', curto: 'Refri gelado', acao: 'Escolhendo bebida na geladeira', icone: '🥤', pose: 'IDLE', dir: 'UP' },
  { nodo: 'cozinha_mesa_1', curto: 'Pizza', acao: 'Comendo pizza na mesa da lanchonete', icone: '🍕', pose: 'EATING', dir: 'UP' },
  { nodo: 'cozinha_mesa_2', curto: 'Salgado', acao: 'Comendo coxinha e lanchando na mesa', icone: '🥟', pose: 'EATING', dir: 'UP' },
  { nodo: 'cozinha_mesa_3', curto: 'Café & Pão', acao: 'Tomando café na mesa da lanchonete', icone: '☕', pose: 'EATING', dir: 'UP' },
  { nodo: 'cozinha_hall', curto: 'Bate-papo', acao: 'Conversando na área das mesas', icone: '💬', pose: 'CHATTING', dir: 'DOWN' },
  { nodo: 'cozinha_sul_centro', curto: 'Sobremesa', acao: 'Saboreando doce na mesa da lanchonete', icone: '🍩', pose: 'EATING', dir: 'UP' },
  { nodo: 'loja_acai_frente', curto: 'Açaí 500ml', acao: 'Comprando açaí na barraca', icone: '🍧', pose: 'EATING', dir: 'RIGHT' },
  { nodo: 'calcada_foodtruck', curto: 'Smash Burger', acao: 'Comprando lanche no Food Truck', icone: '🍔', pose: 'EATING', dir: 'UP' },
  { nodo: 'recepcao_geladeira', curto: 'Energético', acao: 'Pegando energético na geladeira', icone: '🥤', pose: 'IDLE', dir: 'UP' },
];

const PARADAS_BARRACAS: Array<Omit<PassoRoteiro, 'tempo'>> = [
  { nodo: 'loja_hardware_frente', curto: 'GPU nova', acao: 'Olhando placas de vídeo na barraca', icone: '🖥️', pose: 'IDLE', dir: 'DOWN' },
  { nodo: 'loja_assistencia_frente', curto: 'Conserto', acao: 'Deixando notebook na assistência', icone: '🔧', pose: 'IDLE', dir: 'DOWN' },
  { nodo: 'loja_games_frente', curto: 'Jogo novo', acao: 'Comprando jogo na Game Store', icone: '🎮', pose: 'IDLE', dir: 'DOWN' },
  { nodo: 'loja_perifericos_frente', curto: 'Teclado', acao: 'Testando teclado mecânico na barraca', icone: '⌨️', pose: 'IDLE', dir: 'DOWN' },
  { nodo: 'loja_celular_frente', curto: 'Capinha', acao: 'Comprando capinha e película', icone: '📱', pose: 'IDLE', dir: 'LEFT' },
  { nodo: 'loja_cards_frente', curto: 'Booster', acao: 'Comprando booster de cards', icone: '🃏', pose: 'IDLE', dir: 'LEFT' },
  { nodo: 'loja_acai_frente', curto: 'Açaí', acao: 'Tomando açaí na barraca', icone: '🍧', pose: 'EATING', dir: 'RIGHT' },
  { nodo: 'loja_merch_frente', curto: 'Camisa', acao: 'Comprando camisa na barraca de merch', icone: '👕', pose: 'IDLE', dir: 'RIGHT' },
];

const PARADAS_LAZER: Array<Omit<PassoRoteiro, 'tempo'>> = [
  { nodo: 'calcada_banco_esq', curto: 'No banco', acao: 'Sentado no banco da calçada', icone: '☀️', pose: 'IDLE', dir: 'DOWN' },
  { nodo: 'calcada_banco_dir', curto: 'No celular', acao: 'Vendo o celular na calçada', icone: '📱', pose: 'IDLE', dir: 'DOWN' },
  { nodo: 'calcada_vitrine_esq', curto: 'Vitrine', acao: 'Olhando a vitrine', icone: '👀', pose: 'IDLE', dir: 'UP' },
  { nodo: 'calcada_vitrine_dir', curto: 'Torneio!', acao: 'Vendo o cartaz do torneio', icone: '🏆', pose: 'IDLE', dir: 'UP' },
  { nodo: 'recepcao_fila_1', curto: 'Na fila', acao: 'Tirando dúvida na recepção', icone: '💬', pose: 'IDLE', dir: 'UP' },
  { nodo: 'recepcao_fila_2', curto: 'PIX', acao: 'Pagando no totem PIX', icone: '💸', pose: 'IDLE', dir: 'UP' },
  { nodo: 'salao_leste_2', curto: 'Assistindo', acao: 'Assistindo uma partida no salão', icone: '👀', pose: 'IDLE', dir: 'LEFT' },
  { nodo: 'lounge_sofa', curto: 'Relaxando', acao: 'Descansando no sofá do lounge', icone: '🛋️', pose: 'IDLE', dir: 'UP' },
  { nodo: 'lounge_arcade', curto: 'Fliperama', acao: 'Jogando fliperama no lounge', icone: '🕹️', pose: 'IDLE', dir: 'UP' },
  { nodo: 'ala_oeste_lounge', curto: 'Papo na mesa', acao: 'Conversando nas mesas do lounge', icone: '💬', pose: 'CHATTING', dir: 'UP' },
  { nodo: 'espera_salao_oeste', curto: 'No sofá', acao: 'Descansando no sofá da área de descanso', icone: '🛋️', pose: 'SITTING_REST', dir: 'DOWN' },
  { nodo: 'espera_salao_leste', curto: 'Celular', acao: 'Vendo streams nos pufes do salão', icone: '📱', pose: 'SITTING_REST', dir: 'DOWN' },
  { nodo: 'corredor_pcs_fila_1', curto: 'Vendo PCs', acao: 'Conferindo as máquinas disponíveis nas fileiras', icone: '🖥️', pose: 'IDLE', dir: 'UP' },
  { nodo: 'corredor_pcs_fila_2', curto: 'Quero jogar!', acao: 'Escolhendo uma estação gamer no salão', icone: '🎮', pose: 'IDLE', dir: 'UP' },
  { nodo: 'corredor_vip_1', curto: 'Setup VIP', acao: 'Admirando os PCs 360Hz da área VIP', icone: '⚡', pose: 'IDLE', dir: 'UP' },
  { nodo: 'lounge_gameon', curto: 'Área GameOn', acao: 'Passeando pelo lounge norte da loja', icone: '✨', pose: 'IDLE', dir: 'LEFT' },
  { nodo: 'arena_esports_palco', curto: 'Torcendo!', acao: 'Torcendo no palco E-Sports', icone: '📣', pose: 'IDLE', dir: 'UP' },
  { nodo: 'arena_hall', curto: 'Arena', acao: 'Curtindo o movimento da arena', icone: '⏳', pose: 'IDLE', dir: 'UP' },
  { nodo: 'sala_vip_tv', curto: 'FIFA', acao: 'Assistindo FIFA na TV', icone: '📺', pose: 'IDLE', dir: 'UP' },
  { nodo: 'banheiro_cliente', curto: 'Banheiro', acao: 'Indo ao banheiro', icone: '🚻', pose: 'IDLE', dir: 'UP' },
];

const PARADAS_PUBLICAS: Array<Omit<PassoRoteiro, 'tempo'>> = [
  ...PARADAS_LANCHONETE,
  ...PARADAS_BARRACAS,
  ...PARADAS_LAZER,
];

const NOMES_EXTRAS = [
  'Ana', 'Caio', 'Júlia', 'Mateus', 'Larissa', 'Gabriel', 'Camila', 'Felipe',
  'Yasmin', 'Diego', 'Letícia', 'Rafael', 'Beatriz', 'Vitor', 'Sofia', 'Igor',
  'Mariana', 'Tiago', 'Bruna', 'Danilo', 'Helena', 'Cauã', 'Lorena', 'Murilo',
  'Clara', 'Enzo', 'Lívia', 'Gustavo', 'Rafaela', 'Pedro', 'Fernanda', 'André',
];
const ROUPAS_EXTRAS = ['#16a34a', '#dc2626', '#2563eb', '#ca8a04', '#9333ea', '#0891b2', '#e11d48', '#475569', '#f97316', '#14b8a6'];

function gerarVisitantesExtras() {
  let seed = 20261114;
  const rnd = () => {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  return Array.from({ length: TOTAL_VISITANTES_EXTRAS }, (_, i) => {
    // Perfis variados: lanchonete/mesas, compradores de barracas, entusiastas de PC/vitrine, e passantes da loja
    const perfil = i % 4;
    let poolPrincipal: Array<Omit<PassoRoteiro, 'tempo'>>;
    let papel = 'Visitante';
    if (perfil === 0) {
      poolPrincipal = PARADAS_LANCHONETE;
      papel = 'Cliente Lanchonete';
    } else if (perfil === 1) {
      poolPrincipal = PARADAS_BARRACAS;
      papel = 'Cliente Loja';
    } else if (perfil === 2) {
      poolPrincipal = PARADAS_LAZER;
      papel = 'Visitante';
    } else {
      poolPrincipal = PARADAS_PUBLICAS;
      papel = i % 8 === 3 ? 'Curioso VIP' : 'Comprador';
    }

    const principais = [...poolPrincipal].sort(() => rnd() - 0.5).slice(0, 3 + Math.floor(rnd() * 2));
    const extras = [...PARADAS_LANCHONETE, ...PARADAS_BARRACAS]
      .sort(() => rnd() - 0.5)
      .slice(0, 2);

    // Alguns visitantes curiosos passam em frente à porta restrita do Cantinho VIP para interagir com o porteiro
    if (i === 5 || i === 17) {
      principais.splice(1, 0, {
        nodo: 'servico_wc_func',
        curto: 'Área VIP?',
        acao: 'Conferindo a entrada restrita com o porteiro do Cantinho VIP',
        icone: '🔒',
        pose: 'IDLE',
        dir: 'RIGHT',
      });
    }

    const roteiro: PassoRoteiro[] = [
      ...principais.map((p) => ({ ...p, tempo: 210 + Math.floor(rnd() * 160) })),
      ...extras.map((p) => ({ ...p, tempo: 180 + Math.floor(rnd() * 140) })),
    ];
    return {
      id: `visitante_extra_${i + 1}`,
      nome: NOMES_EXTRAS[i % NOMES_EXTRAS.length],
      papel,
      corRoupa: ROUPAS_EXTRAS[i % ROUPAS_EXTRAS.length],
      corCabelo: CORES_CABELO_BOT[Math.floor(rnd() * CORES_CABELO_BOT.length)],
      roteiro,
      etapaInicial: (i * 2 + 1) % roteiro.length,
      discreto: true,
    };
  });
}

const VISITANTES_EXTRAS = gerarVisitantesExtras();

// =============================================================================
// ATENDENTES E CATÁLOGO DAS LOJAS
// =============================================================================
export interface ItemCatalogoLoja {
  pedido: string;
  iconeCliente: string;
  resposta: string;
  iconeAtendente: string;
  preco: number;
  agradecimento: string;
}

export interface EventoCompraVisual {
  id: string;
  x: number;
  y: number;
  textoValor: string;
  icone: string;
  inicioTick: number;
  corLoja: string;
}

export const CATALOGO_LOJAS: Record<string, ItemCatalogoLoja[]> = {
  hardware: [
    { pedido: 'Quanto tá a RTX?', iconeCliente: '🖥️', resposta: 'Promoção hoje!', iconeAtendente: '🔥', preco: 3200, agradecimento: 'Vou levar!' },
    { pedido: 'Tem SSD NVMe?', iconeCliente: '⚡', resposta: 'Leitura 7000MB/s!', iconeAtendente: '💾', preco: 420, agradecimento: 'Perfeito!' },
    { pedido: 'Pasta térmica prata', iconeCliente: '❄️', resposta: 'Temos Arctic!', iconeAtendente: '🛠️', preco: 55, agradecimento: 'Valeu demais!' },
  ],
  assistencia: [
    { pedido: 'Formata com Windows?', iconeCliente: '💻', resposta: 'Backup incluso!', iconeAtendente: '🔧', preco: 70, agradecimento: 'Salvou minha vida!' },
    { pedido: 'Tá esquentando muito', iconeCliente: '🔥', resposta: 'Troco a pasta agora!', iconeAtendente: '🧼', preco: 90, agradecimento: 'Ficou top!' },
    { pedido: 'Troca a tela do note?', iconeCliente: '🖥️', resposta: 'Fica pronto hoje!', iconeAtendente: '🛠️', preco: 280, agradecimento: 'Muito rápido!' },
  ],
  games: [
    { pedido: 'Tem o jogo novo?', iconeCliente: '🎮', resposta: 'Última cópia física!', iconeAtendente: '✨', preco: 299, agradecimento: 'Zerar no feriado!' },
    { pedido: 'Gift card R$ 100', iconeCliente: '🎁', resposta: 'Código na tela!', iconeAtendente: '🧾', preco: 100, agradecimento: 'Bora skin nova!' },
    { pedido: 'Controle sem fio', iconeCliente: '🕹️', resposta: 'Grip emborrachado!', iconeAtendente: '⭐', preco: 340, agradecimento: 'Partiu FIFA!' },
  ],
  perifericos: [
    { pedido: 'Mouse gamer 16k DPI', iconeCliente: '🖱️', resposta: 'Sensor óptico puro!', iconeAtendente: '⚡', preco: 190, agradecimento: 'Agora subo de elo!' },
    { pedido: 'Teclado mecânico', iconeCliente: '⌨️', resposta: 'Switch vermelho macio!', iconeAtendente: '🎧', preco: 270, agradecimento: 'Digitação linda!' },
    { pedido: 'Headset pra CS2', iconeCliente: '🎧', resposta: 'Som 7.1 espacial!', iconeAtendente: '🎵', preco: 230, agradecimento: 'Ouvir até passo!' },
  ],
  celular: [
    { pedido: 'Aplica película?', iconeCliente: '📱', resposta: 'Vidro temperado 3D!', iconeAtendente: '✨', preco: 35, agradecimento: 'Ficou lisinho!' },
    { pedido: 'Cabo turbo Tipo-C', iconeCliente: '🔌', resposta: 'Carga rápida 65W!', iconeAtendente: '⚡', preco: 45, agradecimento: 'Carrega voando!' },
    { pedido: 'Capinha neon fosca', iconeCliente: '✨', resposta: 'Anti-impacto militar!', iconeAtendente: '🛍️', preco: 50, agradecimento: 'Combina com a Lan!' },
  ],
  cards: [
    { pedido: '2 boosters Pokémon!', iconeCliente: '🃏', resposta: 'Boa sorte na ultra-rara!', iconeAtendente: '⭐', preco: 36, agradecimento: 'Vem Charizard!' },
    { pedido: 'Pacote de sleeves', iconeCliente: '📦', resposta: '100 unidades matte!', iconeAtendente: '🛡️', preco: 48, agradecimento: 'Cartas protegidas!' },
    { pedido: 'Deck box magnética', iconeCliente: '🎴', resposta: 'Acabamento premium!', iconeAtendente: '💎', preco: 85, agradecimento: 'Muito estilosa!' },
  ],
  acai: [
    { pedido: 'Açaí 500ml com ninho!', iconeCliente: '🍧', resposta: 'Caprichado com morango!', iconeAtendente: '🍓', preco: 22, agradecimento: 'Bom demais!' },
    { pedido: 'Shake gamer energético', iconeCliente: '🥤', resposta: 'Batido bem cremoso!', iconeAtendente: '⚡', preco: 18, agradecimento: 'Energia pro corujão!' },
    { pedido: 'Copo de açaí com banana', iconeCliente: '🍌', resposta: 'Com mel e granola!', iconeAtendente: '🍧', preco: 20, agradecimento: 'Refrescante!' },
  ],
  merch: [
    { pedido: 'Camisa oficial M', iconeCliente: '👕', resposta: 'Dry-fit do time!', iconeAtendente: '🏆', preco: 130, agradecimento: 'Uniforme de gala!' },
    { pedido: 'Boné aba reta preto', iconeCliente: '🧢', resposta: 'Bordado em alto relevo!', iconeAtendente: '✨', preco: 75, agradecimento: 'Ficou estiloso!' },
    { pedido: 'Mousepad gigante speed', iconeCliente: '🗺️', resposta: 'Borda costurada neon!', iconeAtendente: '🎮', preco: 90, agradecimento: 'Mesa completa!' },
  ],
};

const DADOS_ATENDENTES: Record<string, { nome: string; uniforme: UniformeFuncionario; falas: Array<[string, string]> }> = {
  hardware: { nome: 'Renan', uniforme: 'TECNICO', falas: [['RTX em promo!', '💾'], ['Monta seu PC?', '🖥️']] },
  assistencia: { nome: 'Marcos', uniforme: 'TECNICO', falas: [['Formatação R$50', '🔧'], ['Pronto amanhã', '🛠️']] },
  games: { nome: 'Lívia', uniforme: 'RECEPCAO', falas: [['Lançamento!', '🎮'], ['Gift card?', '🎁']] },
  perifericos: { nome: 'Bruno', uniforme: 'RECEPCAO', falas: [['Testa o mouse!', '🖱️'], ['Headset 7.1', '🎧']] },
  celular: { nome: 'Paula', uniforme: 'RECEPCAO', falas: [['Película grátis', '📱'], ['Carregador?', '🔌']] },
  cards: { nome: 'Otávio', uniforme: 'RECEPCAO', falas: [['Booster novo!', '🃏'], ['Torneio sábado', '🏆']] },
  acai: { nome: 'Duda', uniforme: 'LANCHONETE', falas: [['Açaí 500ml!', '🍧'], ['Shake gelado', '🥤']] },
  merch: { nome: 'Kaique', uniforme: 'RECEPCAO', falas: [['Camisa oficial', '👕'], ['Boné do time', '🧢']] },
};

/** Posição (px, pés do sprite) e direção do atendente, atrás do balcão de cada loja */
function posicaoAtendente(l: Loja): { x: number; y: number; dir: DirecaoSprite } {
  const px = l.x * TILE_SIZE;
  const py = l.y * TILE_SIZE;
  const pw = l.w * TILE_SIZE;
  const ph = l.h * TILE_SIZE;
  if (l.lado === 'N') return { x: Math.round(px + pw * 0.35), y: Math.round(py + 48), dir: 'UP' };
  if (l.lado === 'E') return { x: Math.round(px + pw - 46), y: Math.round(py + ph / 2 + 10), dir: 'RIGHT' };
  return { x: Math.round(px + 46), y: Math.round(py + ph / 2 + 10), dir: 'LEFT' };
}

const ehBotFixo = (b: AgenteBot) =>
  b.id === 'staff_recepcao' ||
  b.id.startsWith('atendente_') ||
  b.id.startsWith('arena_') ||
  b.id.startsWith('vip_sinuca_') ||
  b.id === 'vip_barman' ||
  b.id.startsWith('porteiro_') ||
  b.id.startsWith('casal_') ||
  b.pose === 'SITTING_EAT' ||
  b.pose === 'SITTING_REST' ||
  b.estadoLanchonete === 'NA_FILA' ||
  b.estadoLanchonete === 'INDO_MESA' ||
  b.estadoEsperaSalao !== undefined;

const MESAS_BOMBONIERE_SET = new Set([
  'cozinha_mesa_1',
  'cozinha_mesa_2',
  'cozinha_mesa_3',
  'cozinha_sul_centro',
]);

const NODOS_ESPERA_SALAO_SET = new Set(['espera_salao_oeste', 'espera_salao_leste']);

export class SimuladorBotsMapa {
  private bots = new Map<string, AgenteBot>();
  private globalTick = 0;
  private transacoesLojas = new Map<string, { clienteId: string; frameInicio: number; itemIndex: number; concluida: boolean }>();
  private eventosCompra: EventoCompraVisual[] = [];
  private filaLanchonete: string[] = [];
  private filaFoodTruck: string[] = [];
  private assentosOcupados = new Map<string, string>();
  private assentosEsperaOcupados = new Map<string, string>();
  private eventosPcAtivos = new Map<number, EstadoPcHypeVisual>();
  private lanchoneteIniciada = false;
  private arenaEstado: EstadoArenaVisual = {
    hpRed: 0.88,
    hpBlue: 0.85,
    bag1Hit: false,
    bag2Hit: false,
    koFlash: false,
  };

  public obterEstadoArena(): EstadoArenaVisual {
    return this.arenaEstado;
  }

  public obterEventosPcAtivos(): Map<number, EstadoPcHypeVisual> {
    return this.eventosPcAtivos;
  }

  public obterEventosCompra(tickAtual: number): EventoCompraVisual[] {
    this.eventosCompra = this.eventosCompra.filter((ev) => tickAtual - ev.inicioTick < 80);
    return this.eventosCompra;
  }

  public registrarPagamentoEstacionamentoVisual(valor: number, placa: string, tickAtual: number) {
    this.eventosCompra.push({
      id: `estac_${tickAtual}_${placa}`,
      x: Math.round(88.25 * TILE_SIZE),
      y: Math.round(49.1 * TILE_SIZE),
      textoValor: valor > 0 ? `+R$ ${valor.toFixed(0)}` : 'LIBERADO',
      icone: '🅿️',
      corLoja: '#4ade80',
      inicioTick: tickAtual,
    });
  }

  private reservarAssentoLivre(bot: AgenteBot, preferIdx = 0): AssentoRefeicao | undefined {
    if (bot.assentoReservadoId) {
      const atual = ASSENTOS_REFEICAO.find((a) => a.id === bot.assentoReservadoId);
      if (atual && this.assentosOcupados.get(atual.id) === bot.id) return atual;
    }
    const livres = ASSENTOS_REFEICAO.filter((a) => !this.assentosOcupados.has(a.id));
    if (livres.length === 0) return undefined;

    // Conta ocupação por mesa para distribuir os clientes harmoniosamente nas 4 mesas alinhadas
    const ocupacaoMesa = new Map<string, number>();
    for (const [assentoId] of this.assentosOcupados) {
      const mesa = assentoId.split('_').slice(0, 2).join('_');
      ocupacaoMesa.set(mesa, (ocupacaoMesa.get(mesa) ?? 0) + 1);
    }

    const ordenados = [...livres].sort((a, b) => {
      const ma = ocupacaoMesa.get(a.id.split('_').slice(0, 2).join('_')) ?? 0;
      const mb = ocupacaoMesa.get(b.id.split('_').slice(0, 2).join('_')) ?? 0;
      if (ma !== mb) return ma - mb;
      return 0;
    });

    const candidato = ordenados[preferIdx % Math.min(ordenados.length, 4)] ?? ordenados[0];
    this.assentosOcupados.set(candidato.id, bot.id);
    bot.assentoReservadoId = candidato.id;
    return candidato;
  }

  private liberarAssento(bot: AgenteBot) {
    if (bot.assentoReservadoId) {
      if (this.assentosOcupados.get(bot.assentoReservadoId) === bot.id) {
        this.assentosOcupados.delete(bot.assentoReservadoId);
      }
      delete bot.assentoReservadoId;
    }
  }

  private reservarAssentoEsperaLivre(bot: AgenteBot, preferIdx = 0): AssentoEspera | undefined {
    if (bot.assentoEsperaId) {
      const atual = ASSENTOS_ESPERA.find((a) => a.id === bot.assentoEsperaId);
      if (atual && this.assentosEsperaOcupados.get(atual.id) === bot.id) return atual;
    }
    const livres = ASSENTOS_ESPERA.filter((a) => !this.assentosEsperaOcupados.has(a.id));
    if (livres.length === 0) return undefined;
    const escolhido = livres[preferIdx % livres.length];
    this.assentosEsperaOcupados.set(escolhido.id, bot.id);
    bot.assentoEsperaId = escolhido.id;
    return escolhido;
  }

  private liberarAssentoEspera(bot: AgenteBot) {
    if (bot.assentoEsperaId) {
      if (this.assentosEsperaOcupados.get(bot.assentoEsperaId) === bot.id) {
        this.assentosEsperaOcupados.delete(bot.assentoEsperaId);
      }
      delete bot.assentoEsperaId;
    }
  }

  private removerDasFilas(botId: string) {
    const idxL = this.filaLanchonete.indexOf(botId);
    if (idxL >= 0) this.filaLanchonete.splice(idxL, 1);
    const idxF = this.filaFoodTruck.indexOf(botId);
    if (idxF >= 0) this.filaFoodTruck.splice(idxF, 1);
  }

  private moverParaPontoExato(bot: AgenteBot, tx: number, ty: number, velocidadeBase: number): boolean {
    const velocidade = velocidadeBase * BOT_SPEED_SCALE;
    const dx = tx - bot.x;
    const dy = ty - bot.y;
    const dist = Math.hypot(dx, dy);
    if (dist <= velocidade) {
      bot.x = tx;
      bot.y = ty;
      return true;
    }
    if (Math.abs(dx) > Math.abs(dy)) {
      bot.direcao = dx >= 0 ? 'RIGHT' : 'LEFT';
    } else {
      bot.direcao = dy >= 0 ? 'DOWN' : 'UP';
    }
    bot.pose = 'WALK';
    bot.x += (dx / dist) * velocidade;
    bot.y += (dy / dist) * velocidade;
    return false;
  }

  private estaAlvoOcupadoPorOutro(alvoX: number, alvoY: number, selfId: string): boolean {
    for (const [id, outro] of this.bots) {
      if (id === selfId) continue;
      if (ehPosePc(outro.pose) || outro.pose === 'SITTING_EAT' || outro.id.startsWith('atendente_') || outro.id.startsWith('arena_')) continue;
      if (Math.hypot(outro.x - alvoX, outro.y - alvoY) < 22) return true;
    }
    return false;
  }

  private criarOuAtualizarBot(
    id: string,
    nome: string,
    papel: string,
    ehCliente: boolean,
    nodoInicial: string,
    corRoupa: string,
    corCabelo: string,
    temFone = false
  ): AgenteBot {
    const existente = this.bots.get(id);
    if (existente) {
      existente.nome = nome;
      existente.papel = papel;
      return existente;
    }
    const coords = WAYPOINT_NODES[nodoInicial] || WAYPOINT_NODES.corredor_central_1;
    const novo: AgenteBot = {
      id,
      nome,
      papel,
      ehCliente,
      x: coords.x,
      y: coords.y,
      nodoAtualId: nodoInicial,
      filaRota: [],
      direcao: 'DOWN',
      pose: 'IDLE',
      acaoTexto: 'No local',
      falaCurta: '✨',
      mostrarBalao: false,
      timerEsperaFrames: 20,
      timerConversaFrames: 0,
      cooldownConversaFrames: 90,
      etapaRotina: 0,
      corRoupa,
      corCabelo,
      temFone,
    };
    this.bots.set(id, novo);
    return novo;
  }

  private enviarParaDestino(bot: AgenteBot, nodoDestinoId: string) {
    if (bot.nodoAtualId === nodoDestinoId && bot.filaRota.length === 0) return;
    bot.filaRota = calcularCaminhoNoGrafo(bot.nodoAtualId, nodoDestinoId);
  }

  private avancarMovimentoFisico(bot: AgenteBot, velocidadeBase: number): boolean {
    const velocidade = velocidadeBase * BOT_SPEED_SCALE;
    // Se o bot parou para conversar com alguém, fica parado olhando para o colega!
    if (bot.timerConversaFrames > 0) {
      bot.timerConversaFrames--;
      bot.pose = 'CHATTING';
      bot.mostrarBalao = true;
      return false;
    }
    if (bot.cooldownConversaFrames > 0) {
      bot.cooldownConversaFrames--;
    }

    if (bot.filaRota.length === 0) {
      return true;
    }

    const proxId = bot.filaRota[0];
    const alvo = WAYPOINT_NODES[proxId];
    if (!alvo) {
      bot.filaRota.shift();
      return bot.filaRota.length === 0;
    }

    const dx = alvo.x - bot.x;
    const dy = alvo.y - bot.y;
    const dist = Math.hypot(dx, dy);

    if (Math.abs(dx) > Math.abs(dy)) {
      bot.direcao = dx >= 0 ? 'RIGHT' : 'LEFT';
    } else {
      bot.direcao = dy >= 0 ? 'DOWN' : 'UP';
    }

    if (bot.pose !== 'CARRYING_BOX') {
      bot.pose = 'WALK';
    }

    if (dist <= velocidade) {
      bot.x = alvo.x;
      bot.y = alvo.y;
      bot.nodoAtualId = proxId;
      bot.filaRota.shift();
      return bot.filaRota.length === 0;
    } else if (
      bot.filaRota.length === 1 &&
      dist <= 28 &&
      ehCaminhavel(bot.x, bot.y) &&
      this.estaAlvoOcupadoPorOutro(alvo.x, alvo.y, bot.id)
    ) {
      // Evita empilhar exatamente no mesmo pixel quando outro bot já está parado no ponto de interesse
      bot.nodoAtualId = proxId;
      bot.filaRota.shift();
      return true;
    } else {
      bot.x += (dx / dist) * velocidade;
      bot.y += (dy / dist) * velocidade;
      return false;
    }
  }

  private aplicarFisicaSeparacao(todos: AgenteBot[]) {
    const ehFixoEspecial = (b: AgenteBot) =>
      ehPosePc(b.pose) ||
      b.pose === 'SITTING_EAT' ||
      b.pose === 'SITTING_REST' ||
      b.pose === 'PLAY_POOL' ||
      b.pose === 'ROMANCE_CUDDLE' ||
      b.pose === 'ROMANCE_KISS' ||
      b.id.startsWith('arena_') ||
      b.id.startsWith('vip_sinuca_') ||
      b.id === 'vip_barman' ||
      b.id.startsWith('porteiro_') ||
      b.id.startsWith('casal_') ||
      b.id.startsWith('espectador_') ||
      b.id.startsWith('cliente_barraca_') ||
      b.id.startsWith('espera_');

    const podeMover = (b: AgenteBot) =>
      !ehFixoEspecial(b) &&
      b.pose !== 'CHEER' &&
      !b.id.startsWith('atendente_') &&
      b.id !== 'staff_recepcao' &&
      b.estadoLanchonete !== 'NA_FILA' &&
      b.estadoLanchonete !== 'INDO_MESA' &&
      b.estadoEsperaSalao === undefined &&
      !(b.uniforme === 'LANCHONETE' && b.x >= 13.5 * TILE_SIZE && b.y <= 17.3 * TILE_SIZE);

    const minDist = 26;
    for (let i = 0; i < todos.length; i++) {
      const a = todos[i];
      if (ehFixoEspecial(a)) continue;
      for (let j = i + 1; j < todos.length; j++) {
        const b = todos[j];
        if (ehFixoEspecial(b)) continue;

        const aMov = podeMover(a);
        const bMov = podeMover(b);
        if (!aMov && !bMov) continue;

        const dx = a.x - b.x;
        const dy = a.y - b.y;
        const dist = Math.hypot(dx, dy);
        if (dist >= minDist) continue;

        let ux = 0;
        let uy = 0;
        if (dist < 0.05) {
          const ang = (i * 1.9 + j * 2.7 + this.globalTick * 0.03) % (Math.PI * 2);
          ux = Math.cos(ang);
          uy = Math.sin(ang);
        } else {
          ux = dx / dist;
          uy = dy / dist;
        }

        const overlap = minDist - dist;
        const step = Math.min(2.4, overlap * 0.42);
        const fatorA = aMov ? (bMov ? 0.5 : 1) : 0;
        const fatorB = bMov ? (aMov ? 0.5 : 1) : 0;

        if (fatorA > 0) {
          const nx = a.x + ux * step * fatorA;
          const ny = a.y + uy * step * fatorA;
          if (ehCaminhavel(nx, ny)) {
            a.x = nx;
            a.y = ny;
          } else if (ehCaminhavel(nx, a.y)) {
            a.x = nx;
          } else if (ehCaminhavel(a.x, ny)) {
            a.y = ny;
          }
        }
        if (fatorB > 0) {
          const nx = b.x - ux * step * fatorB;
          const ny = b.y - uy * step * fatorB;
          if (ehCaminhavel(nx, ny)) {
            b.x = nx;
            b.y = ny;
          } else if (ehCaminhavel(nx, b.y)) {
            b.x = nx;
          } else if (ehCaminhavel(b.x, ny)) {
            b.y = ny;
          }
        }
      }
    }
  }

  // Detecta bots próximos na calçada ou nos corredores para pararem e baterem papo!
  private processarEncontrosSociais(listaBots: AgenteBot[]) {
    for (let i = 0; i < listaBots.length; i++) {
      const a = listaBots[i];
      if (
        ehPosePc(a.pose) ||
        a.pose === 'SITTING_EAT' ||
        a.pose === 'SITTING_REST' ||
        a.pose === 'PLAY_POOL' ||
        a.pose === 'ROMANCE_CUDDLE' ||
        a.pose === 'ROMANCE_KISS' ||
        a.pose === 'WORKING_TOOL' ||
        a.pose === 'CARRYING_BOX' ||
        a.pose === 'FIGHT_STANCE' ||
        a.pose === 'PUNCH' ||
        a.pose === 'KICK' ||
        a.pose === 'BLOCK' ||
        a.pose === 'CHEER' ||
        a.estadoLanchonete !== undefined ||
        a.estadoEsperaSalao !== undefined ||
        a.timerConversaFrames > 0 ||
        a.cooldownConversaFrames > 0 ||
        ehBotFixo(a)
      ) {
        continue;
      }

      for (let j = i + 1; j < listaBots.length; j++) {
        const b = listaBots[j];
        if (
          ehPosePc(b.pose) ||
          b.pose === 'SITTING_EAT' ||
          b.pose === 'WORKING_TOOL' ||
          b.pose === 'CARRYING_BOX' ||
          b.pose === 'FIGHT_STANCE' ||
          b.pose === 'PUNCH' ||
          b.pose === 'KICK' ||
          b.pose === 'BLOCK' ||
          b.pose === 'CHEER' ||
          b.estadoLanchonete !== undefined ||
          b.timerConversaFrames > 0 ||
          b.cooldownConversaFrames > 0 ||
          ehBotFixo(b)
        ) {
          continue;
        }

        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);

        // Se estiverem lado a lado na calçada ou corredor (entre 16px e 36px)
        if (dist >= 14 && dist <= 36 && Math.abs(dy) <= 18) {
          // Chance baixa de pararem para conversar para não poluir corredores
          if ((this.globalTick + i * 7 + j * 13) % 17 === 0) {
            const parDialogo =
              DIALOGOS_CONVERSA_CURTOS[
                (this.globalTick + i + j) % DIALOGOS_CONVERSA_CURTOS.length
              ];
            a.timerConversaFrames = 110;
            b.timerConversaFrames = 110;
            a.cooldownConversaFrames = 960;
            b.cooldownConversaFrames = 960;
            a.direcao = dx >= 0 ? 'RIGHT' : 'LEFT';
            b.direcao = dx >= 0 ? 'LEFT' : 'RIGHT';
            a.iconeCabeca = '💬';
            b.iconeCabeca = '💬';
            a.falaCurta = parDialogo[0];
            b.falaCurta = parDialogo[1];
            a.balaoPrioridade = 2;
            b.balaoPrioridade = 2;
            a.acaoTexto = `Conversando com ${b.nome}: ${parDialogo[0]}`;
            b.acaoTexto = `Respondendo ${a.nome}: ${parDialogo[1]}`;
            break;
          }
        }
      }
    }
  }

  public atualizarFrame(
    computadores: Computador[],
    sessoesAtivas: Sessao[],
    funcionarios: Funcionario[]
  ): AgenteBot[] {
    this.globalTick++;
    const idsAtivosNesteFrame = new Set<string>();

    // =========================================================================
    // 1. EQUIPE DE FUNCIONÁRIOS UNIFORMIZADOS E COM FERRAMENTAS DE TRABALHO (RF11)
    // =========================================================================
    const ativos = funcionarios.filter((f) => f.trabalhandoAgora);
    let contRecepcao = 0;
    let temAtendenteLanchonete = false;

    const atualizarAtendenteBalcaoCozinha = (
      id: string,
      nome: string
    ) => {
      const botCozinha = this.criarOuAtualizarBot(
        id,
        nome,
        'Atendente Lanchonete',
        false,
        'cozinha_balcao',
        '#e11d48',
        '#7c2d12',
        false
      );
      botCozinha.uniforme = 'LANCHONETE';
      botCozinha.ferramenta = 'BANDEJA_LANCHE';
      botCozinha.filaRota = [];
      botCozinha.nodoAtualId = 'cozinha_balcao';
      botCozinha.profundidadeOffset = 0;

      // Posiciona sempre atrás do balcão da lanchonete (y = 16.25, atrás da vitrine y=16.3..17.2)
      if (botCozinha.y > 17.0 * TILE_SIZE || botCozinha.x < 13.8 * TILE_SIZE || botCozinha.x > 18.6 * TILE_SIZE) {
        botCozinha.x = Math.round(14.8 * TILE_SIZE);
        botCozinha.y = Math.round(16.25 * TILE_SIZE);
      }

      const temClienteFila = this.filaLanchonete.length > 0;
      const frenteCliente = temClienteFila ? this.bots.get(this.filaLanchonete[0]) : undefined;
      const destinoX = temClienteFila
        ? Math.round(14.8 * TILE_SIZE)
        : Math.round((15.2 + (Math.sin(this.globalTick * 0.025) * 0.5 + 0.5) * 2.3) * TILE_SIZE);
      const destinoY = Math.round(16.25 * TILE_SIZE);

      const dx = destinoX - botCozinha.x;
      const dy = destinoY - botCozinha.y;
      if (Math.hypot(dx, dy) > 2) {
        botCozinha.x += Math.sign(dx) * Math.min(Math.abs(dx), 1.4);
        botCozinha.y += Math.sign(dy) * Math.min(Math.abs(dy), 1.4);
        botCozinha.pose = 'WALK';
        botCozinha.direcao = dx >= 0 ? 'RIGHT' : 'LEFT';
      } else {
        botCozinha.x = destinoX;
        botCozinha.y = destinoY;
        botCozinha.pose = 'WORKING_TOOL';
        botCozinha.direcao = temClienteFila ? 'DOWN' : (Math.floor(this.globalTick / 90) % 2 === 0 ? 'UP' : 'DOWN');
      }

      if (frenteCliente && frenteCliente.estadoLanchonete === 'NA_FILA') {
        botCozinha.mostrarBalao = true;
        if (frenteCliente.timerEsperaFrames > 90) {
          botCozinha.falaCurta = 'Pode pedir!';
          botCozinha.iconeCabeca = '🧾';
        } else if (frenteCliente.timerEsperaFrames > 40) {
          botCozinha.falaCurta = 'Aceita PIX!';
          botCozinha.iconeCabeca = '📠';
        } else {
          botCozinha.falaCurta = 'Bom apetite!';
          botCozinha.iconeCabeca = '🍕';
        }
        botCozinha.acaoTexto = `Atendendo ${frenteCliente.nome} no balcão da Lanchonete`;
      } else {
        const falasPrep: Array<[string, string, string]> = [
          ['Assando Pizza', '🍕', 'Preparando pizzas e salgados quentinhos na estufa'],
          ['Café Expresso', '☕', 'Passando café expresso gamer atrás do balcão'],
          ['Cup Noodles', '🍜', 'Fervendo água para Cup Noodles na estação'],
          ['Vitrine cheia!', '🥐', 'Reabastecendo vitrine de salgados e bebidas'],
        ];
        const idxFala = Math.floor(this.globalTick / 150) % falasPrep.length;
        const [fala, icone, acao] = falasPrep[idxFala];
        botCozinha.falaCurta = fala;
        botCozinha.iconeCabeca = icone;
        botCozinha.acaoTexto = acao;
        botCozinha.mostrarBalao = false;
      }
    };

    ativos.forEach((func) => {
      const id = `staff_func_${func.id}`;
      idsAtivosNesteFrame.add(id);
      const primeiroNome = func.nome.split(' ')[0];

      // 1A. ADMINISTRADOR / GERENTE EXECUTIVO (Ex: Daniel)
      if (func.cargo === 'ADMINISTRADOR') {
        const bot = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          'Gerente Geral',
          false,
          'escritorio_mesa',
          '#1e293b',
          '#5c361b',
          false
        );
        bot.uniforme = 'GERENTE';
        const chegou = this.avancarMovimentoFisico(bot, 1.28);
        if (chegou && bot.timerConversaFrames === 0) {
          bot.pose = 'WORKING_TOOL';
          bot.ferramenta = 'TABLET_EXEC';
          bot.direcao = 'DOWN';
          bot.mostrarBalao = false;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
          } else {
            const rotaGerente = [
              { nodo: 'escritorio_mesa', curto: 'Gestão POO', txt: 'Auditando Caixa e Relatórios (RF10)', icone: '📊' },
              { nodo: 'estudio_streamer', curto: 'Live Game On', txt: 'Supervisionando Estúdio de Podcast', icone: '🎙️' },
              { nodo: 'recepcao_balcao_dir', curto: 'Checando PIX', txt: 'Conferindo Pagamentos no Balcão (RN09)', icone: '💼' },
              { nodo: 'corredor_vip_1', curto: 'Vistoria VIP', txt: 'Inspecionando Arena VIP Championship', icone: '⭐' },
              { nodo: 'arena_esports_palco', curto: 'Palco Torneio', txt: 'Organizando Campeonato no Palco E-Sports', icone: '🏆' },
            ];
            bot.etapaRotina = (bot.etapaRotina + 1) % rotaGerente.length;
            const p = rotaGerente[bot.etapaRotina];
            this.enviarParaDestino(bot, p.nodo);
            bot.falaCurta = p.curto;
            bot.acaoTexto = p.txt;
            bot.iconeCabeca = p.icone;
            bot.timerEsperaFrames = 190;
          }
        } else if (!chegou) {
          bot.ferramenta = 'TABLET_EXEC';
          bot.mostrarBalao = false;
        }
        return;
      }

      // 1B. DESENVOLVEDOR DE SISTEMAS (Ex: Diego)
      if (func.cargo === 'DESENVOLVEDOR') {
        const bot = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          'Dev Sistemas',
          false,
          'tecnica_rack_2',
          '#7e22ce',
          '#1e293b',
          true
        );
        bot.uniforme = 'DEV';
        const chegou = this.avancarMovimentoFisico(bot, 1.35);
        if (chegou && bot.timerConversaFrames === 0) {
          bot.pose = 'WORKING_TOOL';
          bot.ferramenta = 'LAPTOP_DEV';
          bot.direcao = 'UP';
          bot.mostrarBalao = false;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
          } else {
            const rotaDev = [
              { nodo: 'tecnica_rack_2', curto: 'Java Server', txt: 'Otimizando Backend Java POO no Rack', icone: '💻' },
              { nodo: 'escritorio_mesa', curto: 'Deploy API', txt: 'Compilando Atualização do Sistema', icone: '⚡' },
              { nodo: 'estudio_streamer', curto: 'OBS Stream', txt: 'Configurando Bitrate da Transmissão', icone: '📡' },
            ];
            bot.etapaRotina = (bot.etapaRotina + 1) % rotaDev.length;
            const p = rotaDev[bot.etapaRotina];
            this.enviarParaDestino(bot, p.nodo);
            bot.falaCurta = p.curto;
            bot.acaoTexto = p.txt;
            bot.iconeCabeca = p.icone;
            bot.timerEsperaFrames = 185;
          }
        } else if (!chegou) {
          bot.ferramenta = 'LAPTOP_DEV';
          bot.mostrarBalao = false;
        }
        return;
      }

      // 1C. SUPORTE TÉCNICO (Ex: Lucas Ribeiro, Bruno Costa)
      if (func.cargo === 'SUPORTE_TECNICO') {
        const bot = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          'Técnico TI',
          false,
          'tecnica_bancada',
          '#0284c7',
          '#1e293b',
          true
        );
        bot.uniforme = 'TECNICO';

        const pcEmManutencao = computadores.find((c) => c.status === 'MANUTENCAO');
        const chegou = this.avancarMovimentoFisico(bot, 1.6);

        if (pcEmManutencao) {
          const nodoPc = nodoAssentoDoPc(pcEmManutencao.numero);
          if (bot.nodoAtualId !== nodoPc && bot.filaRota.length === 0) {
            this.enviarParaDestino(bot, nodoPc);
            bot.ferramenta = 'CHAVE_SOLDA';
            bot.falaCurta = `Indo ${pcEmManutencao.identificacao}`;
            bot.acaoTexto = `Levando maleta de ferramentas ao ${pcEmManutencao.identificacao}`;
            bot.iconeCabeca = '🔧';
            bot.mostrarBalao = true;
          } else if (chegou && bot.nodoAtualId === nodoPc) {
            bot.pose = 'WORKING_TOOL';
            bot.ferramenta = 'CHAVE_SOLDA';
            bot.direcao = 'UP';
            bot.falaCurta = `Reparo ${pcEmManutencao.identificacao}`;
            bot.acaoTexto = `Soldando e trocando pasta térmica do ${pcEmManutencao.identificacao}`;
            bot.iconeCabeca = '🔧';
            bot.mostrarBalao = true;
          }
        } else if (chegou) {
          bot.mostrarBalao = false;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
            bot.pose = 'WORKING_TOOL';
            bot.ferramenta = bot.nodoAtualId === 'escritorio_mesa' ? 'PRANCHETA' : 'CHAVE_SOLDA';
            bot.direcao = 'UP';
          } else {
            bot.etapaRotina = (bot.etapaRotina + 1) % 4;
            if (bot.etapaRotina === 0) {
              this.enviarParaDestino(bot, 'tecnica_rack_1');
              bot.falaCurta = 'Ping 1ms OK';
              bot.acaoTexto = 'Crimpando cabos nos Racks Fibra Óptica';
              bot.iconeCabeca = '🖧';
              bot.timerEsperaFrames = 175;
            } else if (bot.etapaRotina === 1) {
              this.enviarParaDestino(bot, 'tecnica_bancada');
              bot.falaCurta = 'Soldando GPU';
              bot.acaoTexto = 'Testando Placa de Vídeo com Ferro de Solda';
              bot.iconeCabeca = '🔧';
              bot.timerEsperaFrames = 210;
            } else if (bot.etapaRotina === 2) {
              this.enviarParaDestino(bot, 'corredor_vip_2');
              bot.falaCurta = 'Coolers VIP';
              bot.acaoTexto = 'Calibrando WaterCooler da Arena VIP';
              bot.iconeCabeca = '❄️';
              bot.timerEsperaFrames = 145;
            } else {
              this.enviarParaDestino(bot, 'escritorio_mesa');
              bot.falaCurta = 'Laudo TI';
              bot.acaoTexto = 'Assinando Laudo Técnico no Escritório';
              bot.iconeCabeca = '📋';
              bot.timerEsperaFrames = 150;
            }
          }
        } else {
          bot.ferramenta = 'CHAVE_SOLDA';
          bot.mostrarBalao = false;
        }
        return;
      }

      // 1D. ZELADORIA / LIMPEZA (Ex: Carla Mendes)
      if (func.cargo === 'LIMPEZA') {
        const bot = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          'Zeladoria',
          false,
          'corredor_central_2',
          '#059669',
          '#7f1d1d',
          false
        );
        bot.uniforme = 'LIMPEZA';
        const chegou = this.avancarMovimentoFisico(bot, 1.35);
        if (chegou && bot.timerConversaFrames === 0) {
          bot.pose = 'CLEANING';
          bot.ferramenta = 'VASSOURA';
          bot.direcao = 'DOWN';
          bot.mostrarBalao = false;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
          } else {
            const pontosLimpeza = [
              { nodo: 'corredor_pcs_fila_3', curto: 'Varrendo Arena', txt: 'Varrendo Corredor da Arena Gamer' },
              { nodo: 'estudio_streamer', curto: 'Limpando Estúdio', txt: 'Higienizando Estúdio GAME ON' },
              { nodo: 'corredor_central_norte', curto: 'Polindo Hall', txt: 'Lustrando Piso da Recepção' },
              { nodo: 'ala_oeste_lounge', curto: 'Varrendo Deck', txt: 'Varrendo Deck Cyber Lounge Oeste' },
              { nodo: 'sala_vip_sofa', curto: 'Arrumando VIP', txt: 'Organizando Lounge de Consoles' },
            ];
            bot.etapaRotina = (bot.etapaRotina + 1) % pontosLimpeza.length;
            const alvo = pontosLimpeza[bot.etapaRotina];
            this.enviarParaDestino(bot, alvo.nodo);
            bot.falaCurta = alvo.curto;
            bot.acaoTexto = alvo.txt;
            bot.iconeCabeca = '🧹';
            bot.timerEsperaFrames = 185;
          }
        } else if (bot.timerConversaFrames === 0) {
          bot.ferramenta = 'VASSOURA';
          bot.mostrarBalao = false;
        }
        return;
      }

      // 1E-ESTAC. PORTEIRO DA GUARITA (x=88.02, y=50.65) E GUARDA DE PÁTIO (patrulha x=88.25)
      if (func.cargo === 'PORTEIRO_ESTACIONAMENTO') {
        const resumoEstac = obterResumoEstacionamento();
        let bot = this.bots.get(id);
        if (!bot) {
          bot = this.criarOuAtualizarBot(
            id,
            primeiroNome,
            'Porteiro Estac.',
            false,
            'porta_principal',
            '#1e293b',
            '#334155',
            false
          );
          bot.x = Math.round(88.02 * TILE_SIZE);
          bot.y = Math.round(50.65 * TILE_SIZE);
        }
        bot.nome = primeiroNome;
        bot.papel = 'Porteiro Estac.';
        bot.filaRota = [];
        bot.uniforme = 'ESTACIONAMENTO';
        bot.ferramenta = 'TABLET_EXEC';
        bot.x = Math.round(88.02 * TILE_SIZE);
        bot.y = Math.round(50.65 * TILE_SIZE);
        bot.direcao = 'RIGHT';

        const cancelaAtiva = resumoEstac.cancelaEntrada.luzVerde || resumoEstac.cancelaSaida.luzVerde;
        bot.pose = cancelaAtiva ? 'WORKING_TOOL' : 'IDLE';
        bot.acaoTexto = cancelaAtiva
          ? resumoEstac.cancelaEntrada.luzVerde
            ? 'Emitindo ticket automático e erguendo cancela de entrada'
            : 'Validando pagamento na saída e liberando cancela'
          : `Controlando guarita • ${resumoEstac.vagasLivres}/${resumoEstac.totalVagas} vagas livres`;

        const janelaIdle = (this.globalTick + func.id * 45) % 260 < 52;
        if (cancelaAtiva) {
          bot.mostrarBalao = true;
          bot.falaCurta = resumoEstac.cancelaEntrada.luzVerde ? 'Ticket OK!' : 'Boa viagem!';
          bot.iconeCabeca = '🚦';
        } else if (janelaIdle) {
          bot.mostrarBalao = true;
          bot.falaCurta = resumoEstac.lotado ? 'Pátio lotado' : `${resumoEstac.vagasLivres} vagas!`;
          bot.iconeCabeca = '🅿️';
        } else {
          bot.mostrarBalao = false;
        }
        return;
      }

      if (func.cargo === 'GUARDA_PATIO') {
        const resumoEstac = obterResumoEstacionamento();
        let bot = this.bots.get(id);
        if (!bot) {
          bot = this.criarOuAtualizarBot(
            id,
            primeiroNome,
            'Guarda de Pátio',
            false,
            'porta_principal',
            '#0f172a',
            '#1e293b',
            false
          );
          bot.x = Math.round(88.25 * TILE_SIZE);
          bot.y = Math.round(33.2 * TILE_SIZE);
        }
        bot.nome = primeiroNome;
        bot.papel = 'Guarda de Pátio';
        bot.filaRota = [];
        bot.uniforme = 'ESTACIONAMENTO';
        bot.ferramenta = 'PRANCHETA';

        const yPontos = [20.5, 27.0, 34.0, 41.2, 45.6];
        const alvoY = Math.round(yPontos[bot.etapaRotina % yPontos.length] * TILE_SIZE);
        const alvoX = Math.round(88.25 * TILE_SIZE);
        const dx = alvoX - bot.x;
        const dy = alvoY - bot.y;
        const dist = Math.hypot(dx, dy);

        if (dist > 2) {
          const vStep = 0.85;
          bot.x += (dx / dist) * Math.min(dist, vStep);
          bot.y += (dy / dist) * Math.min(dist, vStep);
          bot.pose = 'WALK';
          bot.direcao = dy < 0 ? 'UP' : 'DOWN';
          bot.acaoTexto = `Ronda de segurança no estacionamento (${resumoEstac.vagasOcupadas}/8 ocupadas)`;
        } else {
          bot.x = alvoX;
          bot.y = alvoY;
          bot.pose = 'WORKING_TOOL';
          bot.direcao = 'LEFT';
          bot.acaoTexto = `Conferindo sensores das vagas V01–V08 (${resumoEstac.vagasLivres} livres)`;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
          } else {
            bot.etapaRotina = (bot.etapaRotina + 1) % yPontos.length;
            bot.timerEsperaFrames = 175;
          }
        }

        const janelaFala = (this.globalTick + 130) % 280 < 52;
        if (janelaFala) {
          bot.mostrarBalao = true;
          bot.falaCurta = resumoEstac.lotado
            ? 'Sem vagas!'
            : `${resumoEstac.vagasLivres}/8 livres`;
          bot.iconeCabeca = '🦺';
        } else {
          bot.mostrarBalao = false;
        }
        return;
      }

      // 1E. RECEPCIONISTAS DISTRIBUÍDOS POR FUNÇÃO (1º Balcão PIX, 2º Estoque/Logística, 3º Barista/Lanchonete)
      const slotRecep = contRecepcao++;
      if (slotRecep === 0) {
        // Recepcionista Titular no Balcão (Ex: Ana Silva)
        const bot = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          'Recepção',
          false,
          'recepcao_balcao_centro',
          '#2563eb',
          '#92400e',
          true
        );
        bot.uniforme = 'RECEPCAO';
        const chegou = this.avancarMovimentoFisico(bot, 1.15);
        if (chegou) {
          bot.pose = 'WORKING_TOOL';
          bot.ferramenta = 'PRANCHETA';
          bot.direcao = 'DOWN';
          bot.mostrarBalao = false;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
          } else {
            bot.etapaRotina = (bot.etapaRotina + 1) % 3;
            if (bot.etapaRotina === 0) {
              this.enviarParaDestino(bot, 'recepcao_balcao_esq');
              bot.falaCurta = 'Check-in';
              bot.acaoTexto = 'Cadastrando Check-in na Prancheta';
              bot.iconeCabeca = '📋';
              bot.timerEsperaFrames = 180;
            } else if (bot.etapaRotina === 1) {
              this.enviarParaDestino(bot, 'recepcao_balcao_centro');
              bot.falaCurta = 'Caixa PIX';
              bot.acaoTexto = 'Confirmando Pagamento PIX (RF08)';
              bot.iconeCabeca = '💸';
              bot.timerEsperaFrames = 210;
            } else {
              this.enviarParaDestino(bot, 'recepcao_balcao_dir');
              bot.falaCurta = 'Liberando PC';
              bot.acaoTexto = 'Liberando Sessão no Terminal';
              bot.iconeCabeca = '🖥️';
              bot.timerEsperaFrames = 170;
            }
          }
        } else {
          bot.ferramenta = 'PRANCHETA';
        }
      } else if (slotRecep === 1) {
        // Logística & Estoque (Ex: Fernanda Oliveira)
        const botEstoque = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          'Estoque',
          false,
          'estoque_prateleira_1',
          '#d97706',
          '#3f3f46',
          false
        );
        botEstoque.uniforme = 'ESTOQUE';
        const chegou = this.avancarMovimentoFisico(botEstoque, 1.45);
        botEstoque.mostrarBalao = false;
        if (chegou && botEstoque.timerConversaFrames === 0) {
          if (botEstoque.timerEsperaFrames > 0) {
            botEstoque.timerEsperaFrames--;
            if (
              botEstoque.nodoAtualId === 'estoque_caixas' ||
              botEstoque.nodoAtualId === 'cozinha_geladeira' ||
              botEstoque.nodoAtualId === 'recepcao_geladeira'
            ) {
              botEstoque.pose = 'CARRYING_BOX';
              botEstoque.ferramenta = 'CAIXA';
            } else {
              botEstoque.pose = 'WORKING_TOOL';
              botEstoque.ferramenta = 'PRANCHETA';
            }
          } else {
            botEstoque.etapaRotina = (botEstoque.etapaRotina + 1) % 4;
            if (botEstoque.etapaRotina === 0) {
              botEstoque.pose = 'WALK';
              botEstoque.ferramenta = 'PRANCHETA';
              this.enviarParaDestino(botEstoque, 'estoque_caixas');
              botEstoque.falaCurta = 'Separando';
              botEstoque.acaoTexto = 'Separando Caixas no Almoxarifado';
              botEstoque.iconeCabeca = '📋';
              botEstoque.timerEsperaFrames = 140;
            } else if (botEstoque.etapaRotina === 1) {
              botEstoque.pose = 'CARRYING_BOX';
              botEstoque.ferramenta = 'CAIXA';
              this.enviarParaDestino(botEstoque, 'cozinha_geladeira');
              botEstoque.falaCurta = 'Repondo Café';
              botEstoque.acaoTexto = 'Carregando Fardos para a Lanchonete';
              botEstoque.iconeCabeca = '📦';
              botEstoque.timerEsperaFrames = 160;
            } else if (botEstoque.etapaRotina === 2) {
              botEstoque.pose = 'CARRYING_BOX';
              botEstoque.ferramenta = 'CAIXA';
              this.enviarParaDestino(botEstoque, 'recepcao_geladeira');
              botEstoque.falaCurta = 'Repondo Refri';
              botEstoque.acaoTexto = 'Abastecendo Geladeiras da Recepção';
              botEstoque.iconeCabeca = '🧃';
              botEstoque.timerEsperaFrames = 150;
            } else {
              botEstoque.pose = 'WORKING_TOOL';
              botEstoque.ferramenta = 'PRANCHETA';
              this.enviarParaDestino(botEstoque, 'estoque_prateleira_2');
              botEstoque.falaCurta = 'Inventário';
              botEstoque.acaoTexto = 'Bipando Estoque de Hardware na Prancheta';
              botEstoque.iconeCabeca = '📦';
              botEstoque.timerEsperaFrames = 170;
            }
          }
        }
      } else {
        // Barista & Lanchonete fixo no balcão (Ex: Mariana Lima ou novos contratados)
        if (!temAtendenteLanchonete) {
          temAtendenteLanchonete = true;
          atualizarAtendenteBalcaoCozinha(id, primeiroNome);
        } else {
          const botCozinha = this.criarOuAtualizarBot(
            id,
            primeiroNome,
            'Lanchonete Salão',
            false,
            'cozinha_hall',
            '#e11d48',
            '#7c2d12',
            false
          );
          botCozinha.uniforme = 'LANCHONETE';
          botCozinha.ferramenta = 'BANDEJA_LANCHE';
          const chegou = this.avancarMovimentoFisico(botCozinha, 1.3);
          if (chegou && botCozinha.timerConversaFrames === 0) {
            botCozinha.pose = 'WORKING_TOOL';
            botCozinha.direcao = 'DOWN';
            botCozinha.mostrarBalao = true;
            if (botCozinha.timerEsperaFrames > 0) {
              botCozinha.timerEsperaFrames--;
            } else {
              botCozinha.etapaRotina = (botCozinha.etapaRotina + 1) % 3;
              const rotas = [
                { nodo: 'cozinha_mesa_1', curto: 'Servindo Pizza', txt: 'Entregando lanche nas mesas da Bomboniere', icone: '🍕' },
                { nodo: 'cozinha_geladeira', curto: 'Repor Refris', txt: 'Organizando geladeira de energéticos', icone: '🥤' },
                { nodo: 'ala_oeste_lounge', curto: 'Entrega Deck', txt: 'Levando bandeja de café ao Lounge', icone: '☕' },
              ];
              const p = rotas[botCozinha.etapaRotina];
              this.enviarParaDestino(botCozinha, p.nodo);
              botCozinha.falaCurta = p.curto;
              botCozinha.acaoTexto = p.txt;
              botCozinha.iconeCabeca = p.icone;
              botCozinha.timerEsperaFrames = 140;
            }
          } else {
            botCozinha.mostrarBalao = false;
          }
        }
      }
    });

    if (!temAtendenteLanchonete) {
      idsAtivosNesteFrame.add('atendente_lanchonete');
      atualizarAtendenteBalcaoCozinha('atendente_lanchonete', 'Mariana');
    }

    // =========================================================================
    // 2. CLIENTES COM SESSÃO ATIVA NOS 24 PCS (CLIPES NÃO-ROTEIRIZADOS & RESENHA)
    // =========================================================================
    this.eventosPcAtivos.clear();
    const jogosCurto = ['CS2', 'Valorant', 'LoL', 'GTA RP', 'EA FC', 'Dota 2', 'Fortnite', 'Warzone', 'Apex'];
    const pcsLivresCount = computadores.filter((c) => c.status === 'LIVRE' && c.numero <= 24 && c.numero !== 3).length;
    const salaoLotado = pcsLivresCount <= 1;
    const sessoesEmAndamento = sessoesAtivas.filter(
      (s) => s.status === 'ATIVA' && s.computadorNumero >= 1 && s.computadorNumero <= 24
    );

    const botsSentadosPorPc = new Map<number, { bot: AgenteBot; sessaoIdx: number; jogo: string }>();
    let hypesAtivosNesteFrame = 0;

    sessoesEmAndamento.forEach((sessao, idx) => {
      const id = `cliente_sessao_${sessao.clienteId}`;
      idsAtivosNesteFrame.add(id);
      const nodoAssento = nodoAssentoDoPc(sessao.computadorNumero);
      if (!WAYPOINT_NODES[nodoAssento]) return;
      const primeiroNome = sessao.clienteNome.split(' ')[0];

      // Distribuição inteligente de spawn:
      // Os primeiros 15 PCs já iniciam jogando sentados para ter todas as fileiras (PC-01..24 + VIP) vivas de imediato
      // Os demais PCs (e novas rotatividades) entram pela porta/recepção e caminham até o PC com balão em destaque!
      const pontosEntrada = [
        'porta_principal_fora',
        'porta_principal_dentro',
        'recepcao_fila_1',
        'recepcao_fila_2',
        'recepcao_hall_interno',
        'porta_recepcao',
        'corredor_central_sul',
      ];
      const nodoSpawn =
        idx < 15 && this.globalTick <= 6
          ? nodoAssento
          : pontosEntrada[(idx + sessao.clienteId) % pontosEntrada.length];

      const bot = this.criarOuAtualizarBot(
        id,
        primeiroNome,
        'Cliente PC',
        true,
        nodoSpawn,
        CORES_ROUPA_BOT[sessao.clienteId % CORES_ROUPA_BOT.length],
        CORES_CABELO_BOT[idx % CORES_CABELO_BOT.length],
        true
      );
      bot.eventoPcHype = undefined;
      bot.eventoPcLabel = undefined;
      bot.balaoPrioridade = 1;

      const num = sessao.computadorNumero;
      const jogo = jogosCurto[num % jogosCurto.length];
      const pad = String(num).padStart(2, '0');
      const ehVip = num >= 13 && num <= 18;
      const idPcTag = ehVip ? `VIP-${pad}` : `PC-${pad}`;

      if (bot.nodoAtualId !== nodoAssento && bot.filaRota.length === 0) {
        this.enviarParaDestino(bot, nodoAssento);
      }

      // Se o cliente ainda está caminhando rumo ao seu PC: FOCO TOTAL NA CHEGADA!
      if (bot.nodoAtualId !== nodoAssento || bot.filaRota.length > 0) {
        const falasCaminho = [
          `Partiu ${idPcTag}! 🎮`,
          `Bora ${idPcTag}! 🔥`,
          `Minha vez no ${idPcTag}! 🕹️`,
          `Indo jogar ${jogo}!`,
          `Cadeira ${idPcTag} on! ⭐`,
          `Partiu ranked no ${idPcTag}!`,
          `Abrir ${jogo}! ⚡`,
        ];
        const hashFala = hashDeterministico(sessao.clienteId * 17, num * 31) % falasCaminho.length;
        bot.falaCurta = falasCaminho[hashFala];
        bot.acaoTexto = `Caminhando com ingresso até o ${idPcTag} (${sessao.areaComputador}) para jogar ${jogo}`;
        bot.iconeCabeca = ehVip ? '⭐' : '🎮';
        bot.mostrarBalao = true;
        bot.balaoPrioridade = 4; // Prioridade máxima no mapa para o jogador ver os clientes indo aos PCs!
        this.avancarMovimentoFisico(bot, 2.05);
        return;
      }

      bot.direcao = 'UP';
      bot.profundidadeOffset = 12;

      // Animação de celebração ao chegar e ligar a máquina nos primeiros frames
      if (bot.pcTempoSentadoFrames === undefined) {
        bot.pcTempoSentadoFrames = 0;
      }
      bot.pcTempoSentadoFrames++;

      if (bot.pcTempoSentadoFrames <= 65) {
        bot.pose = 'CHATTING';
        bot.iconeCabeca = '💻';
        const falasChegada = [
          `Sentei no ${idPcTag}!`,
          `Ligando ${idPcTag}... 💻`,
          `Logando na Steam! 🔑`,
          `Iniciando ${jogo}! 🚀`,
          `Headset e mouse ok!`,
        ];
        bot.falaCurta = falasChegada[(sessao.clienteId + num) % falasChegada.length];
        bot.acaoTexto = `Acomodando-se na cadeira gamer do ${idPcTag} e iniciando ${jogo}`;
        bot.mostrarBalao = true;
        bot.balaoPrioridade = 3;
        return;
      }

      // Agenda dinâmica não-roteirizada para Clipe / Triple Kill / Modo Loucura
      const seedPc = hashDeterministico(this.globalTick + sessao.clienteId * 31, num * 97);
      if (bot.pcProximaTriggerTick === undefined) {
        bot.pcProximaTriggerTick = this.globalTick + 70 + (hashDeterministico(num, sessao.clienteId) % 520);
      }
      if (bot.pcChatProximaTick === undefined) {
        bot.pcChatProximaTick = this.globalTick + 50 + (hashDeterministico(sessao.clienteId, num * 13) % 360);
      }

      const emHypeAtivo = bot.pcHypeAteTick !== undefined && this.globalTick <= bot.pcHypeAteTick;
      const podeIniciarHype =
        !emHypeAtivo &&
        this.globalTick >= bot.pcProximaTriggerTick &&
        hypesAtivosNesteFrame < MAX_PC_HYPES_SIMULTANEOS;

      if (podeIniciarHype) {
        const duracao = 105 + (seedPc % 40);
        bot.pcHypeAteTick = this.globalTick + duracao;
        // Próximo clipe em intervalo orgânico longo (6s a 16s), nunca sincronizado
        bot.pcProximaTriggerTick = bot.pcHypeAteTick + 360 + (seedPc % 580);
        const modoLoucura = (seedPc >> 3) % 2 === 1;
        if (modoLoucura) {
          const lbl = FRASES_PC_LOUCURA[(seedPc >> 5) % FRASES_PC_LOUCURA.length];
          bot.pose = 'PC_LOUCURA';
          bot.eventoPcHype = 'LOUCURA';
          bot.eventoPcLabel = lbl;
          bot.falaCurta = lbl;
          bot.iconeCabeca = '🔥';
        } else {
          const ks = FRASES_PC_CLIP_STREAK[(seedPc >> 5) % FRASES_PC_CLIP_STREAK.length];
          bot.pose = 'PC_TRIPLE_KILL';
          bot.eventoPcHype = ks.tipo;
          bot.eventoPcLabel = ks.label;
          bot.falaCurta = ks.label;
          bot.iconeCabeca = '⚡';
        }
        bot.acaoTexto = `${bot.eventoPcLabel} jogando ${jogo} no PC-${pad}!`;
        bot.balaoPrioridade = 3;
        bot.mostrarBalao = true;
        hypesAtivosNesteFrame++;
        this.eventosPcAtivos.set(num, {
          numeroPc: num,
          tipo: bot.eventoPcHype,
          label: bot.eventoPcLabel!,
          progresso: 0.1,
        });
      } else if (emHypeAtivo && hypesAtivosNesteFrame < MAX_PC_HYPES_SIMULTANEOS) {
        const ehLoucura = bot.pose === 'PC_LOUCURA';
        const lbl = bot.falaCurta || (ehLoucura ? 'INCORPOROU!!' : 'TRIPLE KILL!');
        bot.pose = ehLoucura ? 'PC_LOUCURA' : 'PC_TRIPLE_KILL';
        bot.eventoPcHype = ehLoucura ? 'LOUCURA' : 'TRIPLE_KILL';
        bot.eventoPcLabel = lbl;
        bot.iconeCabeca = ehLoucura ? '🔥' : '⚡';
        bot.acaoTexto = `${lbl} jogando ${jogo} no PC-${pad}!`;
        bot.balaoPrioridade = 3;
        bot.mostrarBalao = true;
        hypesAtivosNesteFrame++;
        this.eventosPcAtivos.set(num, {
          numeroPc: num,
          tipo: bot.eventoPcHype,
          label: lbl,
          progresso: Math.max(0, 1 - (bot.pcHypeAteTick! - this.globalTick) / 130),
        });
      } else {
        if (bot.pcHypeAteTick !== undefined && this.globalTick > bot.pcHypeAteTick) {
          bot.pcHypeAteTick = undefined;
        }
        if (this.globalTick >= bot.pcProximaTriggerTick && hypesAtivosNesteFrame >= MAX_PC_HYPES_SIMULTANEOS) {
          // Adia levemente se já houver 2 PCs estourando clipe na mesma hora
          bot.pcProximaTriggerTick = this.globalTick + 65 + (seedPc % 90);
        }
        bot.pose = 'SITTING_PC';
        botsSentadosPorPc.set(num, { bot, sessaoIdx: idx, jogo });
      }
    });

    // Conversas orgânicas de bancada & reações cronometradas ao vizinho que clipou
    const faixaMesa = (n: number) =>
      n <= 4 ? 1 : n <= 8 ? 2 : n <= 12 ? 3 : n <= 15 ? 4 : n <= 18 ? 5 : n <= 21 ? 6 : 7;
    const mesmaBancada = (a: number, b: number) => b >= 1 && b <= 24 && faixaMesa(a) === faixaMesa(b);
    const paresConversadosNesteTick = new Set<number>();

    botsSentadosPorPc.forEach(({ bot, jogo }, num) => {
      const seedChat = hashDeterministico(this.globalTick + num * 41, bot.nome.charCodeAt(0) * 19);
      const vizinhoLeftHype = mesmaBancada(num, num - 1) && this.eventosPcAtivos.has(num - 1);
      const vizinhoRightHype = mesmaBancada(num, num + 1) && this.eventosPcAtivos.has(num + 1);

      if (vizinhoLeftHype || vizinhoRightHype) {
        const reacao = REACOES_PC_VIZINHO[(seedChat + num) % REACOES_PC_VIZINHO.length];
        bot.pcChatTexto = reacao;
        bot.pcChatIcone = '😲';
        bot.pcChatAteTick = this.globalTick + 115;
        bot.pcChatProximaTick = bot.pcChatAteTick + 320 + (seedChat % 300);
        bot.falaCurta = reacao;
        bot.iconeCabeca = '😲';
        bot.acaoTexto = `Reagindo à jogada épica do colega ao lado em ${jogo}`;
        bot.balaoPrioridade = 2;
        bot.mostrarBalao = true;
        return;
      }

      if (bot.pcChatAteTick !== undefined && this.globalTick <= bot.pcChatAteTick && bot.pcChatTexto) {
        bot.falaCurta = bot.pcChatTexto;
        bot.iconeCabeca = bot.pcChatIcone || '🎧';
        bot.acaoTexto = `Conversando enquanto joga ${jogo} no PC-${String(num).padStart(2, '0')}`;
        bot.balaoPrioridade = 2;
        bot.mostrarBalao = true;
        return;
      }

      if (bot.pcChatProximaTick !== undefined && this.globalTick >= bot.pcChatProximaTick && !paresConversadosNesteTick.has(num)) {
        const direita = mesmaBancada(num, num + 1) ? botsSentadosPorPc.get(num + 1) : undefined;
        if (direita && (seedChat % 3 === 0) && (!direita.bot.pcChatAteTick || this.globalTick > direita.bot.pcChatAteTick)) {
          // Resenha em dupla espontânea entre dois colegas de bancada
          const par = DIALOGOS_PC_BANCADA[(seedChat >> 2) % DIALOGOS_PC_BANCADA.length];
          bot.pcChatTexto = par[0];
          bot.pcChatIcone = '💬';
          bot.pcChatAteTick = this.globalTick + 115;
          bot.pcChatProximaTick = bot.pcChatAteTick + 360 + (seedChat % 420);

          direita.bot.pcChatTexto = par[1];
          direita.bot.pcChatIcone = '🎧';
          direita.bot.pcChatAteTick = this.globalTick + 125;
          direita.bot.pcChatProximaTick = direita.bot.pcChatAteTick + 380 + (seedChat % 400);
          paresConversadosNesteTick.add(num + 1);

          bot.falaCurta = par[0];
          bot.iconeCabeca = '💬';
          bot.balaoPrioridade = 2;
          bot.mostrarBalao = true;
        } else {
          const falasDoJogo = CONVERSAS_PC_POR_JOGO[jogo] || [];
          const pool = seedChat % 2 === 0 && falasDoJogo.length > 0 ? falasDoJogo : CONVERSAS_PC_GERAIS;
          const frase = pool[(seedChat >> 3) % pool.length];
          bot.pcChatTexto = frase;
          bot.pcChatIcone = seedChat % 4 === 0 ? '🎤' : '🎧';
          bot.pcChatAteTick = this.globalTick + 110;
          bot.pcChatProximaTick = bot.pcChatAteTick + 340 + (seedChat % 480);

          bot.falaCurta = frase;
          bot.iconeCabeca = bot.pcChatIcone;
          bot.balaoPrioridade = 2;
          bot.mostrarBalao = true;
        }
        bot.acaoTexto = `Jogando ${jogo} no PC-${String(num).padStart(2, '0')}`;
      } else {
        bot.falaCurta = jogo;
        bot.iconeCabeca = '🎧';
        bot.acaoTexto = `Jogando ${jogo} concentrado no PC-${String(num).padStart(2, '0')}`;
        bot.mostrarBalao = false;
      }
    });

    // =========================================================================
    // 3. VISITANTES INTERNOS E DE CONSUMO (menos vagantes sem destino)
    // =========================================================================
    const botsCirculantes = [
      {
        id: 'visitante_1',
        nome: 'Pedro',
        corRoupa: '#7c3aed',
        corCabelo: '#1e293b',
        roteiro: [
          { nodo: 'recepcao_fila_1', curto: 'Check-in PC!', acao: 'Comprando ficha para jogar nos PCs', icone: '🎟️', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 210 },
          {
            nodo: 'espera_salao_oeste',
            curto: salaoLotado ? 'Esperando PC' : 'Pausa pós-jogo',
            acao: salaoLotado ? 'Descansando no sofá aguardando PC liberar' : 'Descansando no sofá entre partidas de CS2',
            icone: '🛋️',
            pose: 'SITTING_REST' as PoseBot,
            dir: 'DOWN' as DirecaoSprite,
            tempo: 260,
          },
          { nodo: 'loja_hardware_frente', curto: 'Vendo GPUs', acao: 'Olhando placas de vídeo na Hardware Store', icone: '🖥️', pose: 'IDLE' as PoseBot, dir: 'DOWN' as DirecaoSprite, tempo: 240 },
          { nodo: 'cozinha_mesa_1', curto: 'Cup Noodles', acao: 'Comendo Ramen & Pizza na Lanchonete', icone: '🍜', pose: 'EATING' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 260 },
          { nodo: 'sala_vip_sofa', curto: 'Jogando PS5', acao: 'Jogando FIFA no Lounge VIP', icone: '🎮', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 260 },
          { nodo: 'calcada_foodtruck', curto: 'Byte Burger', acao: 'Comprando lanche no Food Truck', icone: '🍔', pose: 'EATING' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 220 },
        ],
      },
      {
        id: 'visitante_2',
        nome: 'Thiago',
        corRoupa: '#0d9488',
        corCabelo: '#7c2d12',
        roteiro: [
          { nodo: 'estudio_streamer', curto: 'Live Podcast', acao: 'Gravando participação no Estúdio GAME ON', icone: '🎙️', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 280 },
          { nodo: 'arena_esports_palco', curto: 'Final Torneio', acao: 'Assistindo Final no Palco E-Sports', icone: '🏆', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 280 },
          { nodo: 'sala_vip_arcade', curto: 'Street Fighter', acao: 'Jogando Fliperama Arcade', icone: '🕹️', pose: 'IDLE' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 320 },
          { nodo: 'loja_games_frente', curto: 'Novos jogos', acao: 'Escolhendo jogo na Game Store', icone: '🎮', pose: 'IDLE' as PoseBot, dir: 'DOWN' as DirecaoSprite, tempo: 230 },
          { nodo: 'loja_acai_frente', curto: 'Açaí 500ml', acao: 'Pedindo açaí no balcão', icone: '🍧', pose: 'EATING' as PoseBot, dir: 'RIGHT' as DirecaoSprite, tempo: 240 },
          { nodo: 'cozinha_mesa_3', curto: 'Café Gamer', acao: 'Tomando Expresso na Lanchonete', icone: '☕', pose: 'EATING' as PoseBot, dir: 'UP' as DirecaoSprite, tempo: 260 },
        ],
      },
    ];

    const todosCirculantes: Array<{
      id: string;
      nome: string;
      papel?: string;
      corRoupa: string;
      corCabelo: string;
      roteiro: PassoRoteiro[];
      etapaInicial?: number;
      discreto?: boolean;
    }> = [...botsCirculantes, ...VISITANTES_EXTRAS];

    const seedLanchoneteNesteFrame = !this.lanchoneteIniciada;
    if (seedLanchoneteNesteFrame) {
      this.lanchoneteIniciada = true;
    }

    todosCirculantes.forEach((v, idxVisitante) => {
      idsAtivosNesteFrame.add(v.id);
      const jaExistia = this.bots.has(v.id);
      const etapaInit = (v.etapaInicial ?? 0) % v.roteiro.length;
      const bot = this.criarOuAtualizarBot(
        v.id,
        v.nome,
        v.papel || 'Visitante',
        true,
        v.roteiro[etapaInit].nodo,
        v.corRoupa,
        v.corCabelo,
        false
      );

      const avancarProximaEtapa = () => {
        this.liberarAssento(bot);
        this.liberarAssentoEspera(bot);
        delete bot.estadoLanchonete;
        delete bot.estadoEsperaSalao;
        delete bot.destinoAssentoId;
        delete bot.comendoItem;
        bot.profundidadeOffset = 0;
        const pulo = (this.globalTick + v.id.length) % 3 === 0 ? 2 : 1;
        bot.etapaRotina = (bot.etapaRotina + pulo) % v.roteiro.length;
        const proxPasso = v.roteiro[bot.etapaRotina];
        this.enviarParaDestino(bot, proxPasso.nodo);
        bot.falaCurta = proxPasso.curto;
        bot.acaoTexto = proxPasso.acao;
        bot.iconeCabeca = proxPasso.icone;
        bot.timerEsperaFrames = proxPasso.tempo;
      };

      if (!jaExistia) {
        bot.etapaRotina = etapaInit;
        bot.timerEsperaFrames = v.roteiro[etapaInit].tempo;

        // Semente inicial para a Bomboniere e Sala de Espera do Salão já abrirem ocupadas
        if (seedLanchoneteNesteFrame) {
          if (idxVisitante === 1) {
            const p0x = Math.round(14.8 * TILE_SIZE);
            const p0y = Math.round(18.0 * TILE_SIZE);
            bot.x = p0x;
            bot.y = p0y;
            bot.nodoAtualId = 'cozinha_balcao';
            bot.filaRota = [];
            bot.direcao = 'UP';
            bot.pose = 'IDLE';
            bot.estadoLanchonete = 'NA_FILA';
            bot.timerEsperaFrames = 120;
            this.filaLanchonete.push(bot.id);
          } else if (idxVisitante === 2) {
            const p1x = Math.round((14.8 + 1.15) * TILE_SIZE);
            const p1y = Math.round(18.0 * TILE_SIZE);
            bot.x = p1x;
            bot.y = p1y;
            bot.nodoAtualId = 'cozinha_balcao';
            bot.filaRota = [];
            bot.direcao = 'LEFT';
            bot.pose = 'IDLE';
            bot.estadoLanchonete = 'NA_FILA';
            bot.timerEsperaFrames = 90;
            this.filaLanchonete.push(bot.id);
          } else if (
            idxVisitante === 3 ||
            idxVisitante === 6 ||
            idxVisitante === 9 ||
            idxVisitante === 12
          ) {
            const assento = this.reservarAssentoLivre(bot, idxVisitante);
            if (assento) {
              const itens = ['🍕', '🍜', '☕', '🍔'];
              const falas = ['Pizza ótima!', 'Cup Noodles', 'Café gamer!', 'Lanche top!'];
              const subIdx = [3, 6, 9, 12].indexOf(idxVisitante);
              bot.x = assento.x * TILE_SIZE;
              bot.y = assento.y * TILE_SIZE;
              bot.nodoAtualId = assento.acesso;
              bot.filaRota = [];
              bot.direcao = assento.dir;
              bot.pose = 'SITTING_EAT';
              bot.profundidadeOffset = assento.dir === 'UP' ? 8 : 0;
              bot.estadoLanchonete = 'SENTADO_COMENDO';
              bot.comendoItem = itens[subIdx % itens.length];
              bot.falaCurta = falas[subIdx % falas.length];
              bot.iconeCabeca = bot.comendoItem;
              bot.acaoTexto = `Lanchando sentado na mesa (${bot.comendoItem})`;
              bot.timerEsperaFrames = 240 + subIdx * 80;
            }
          } else if (
            idxVisitante === 4 ||
            idxVisitante === 7 ||
            idxVisitante === 10 ||
            idxVisitante === 13
          ) {
            const assentoEsp = this.reservarAssentoEsperaLivre(bot, idxVisitante);
            if (assentoEsp) {
              const falasEsp = salaoLotado
                ? ['Esperando PC!', 'Fila do PC!', 'Logo vaga um!', 'Sofá macio!']
                : ['Pausa no sofá!', 'Vendo strats', 'Esperando duo!', 'Tomando fôlego'];
              const subE = [4, 7, 10, 13].indexOf(idxVisitante);
              bot.x = assentoEsp.x * TILE_SIZE;
              bot.y = assentoEsp.y * TILE_SIZE;
              bot.nodoAtualId = assentoEsp.acesso;
              bot.filaRota = [];
              bot.direcao = assentoEsp.dir;
              bot.pose = 'SITTING_REST';
              bot.profundidadeOffset = 22;
              bot.estadoEsperaSalao = 'DESCANSANDO';
              bot.falaCurta = falasEsp[subE % falasEsp.length];
              bot.iconeCabeca = subE % 2 === 0 ? '🛋️' : '📱';
              bot.acaoTexto = salaoLotado
                ? 'Descansando no sofá da sala de espera aguardando PC'
                : 'Descansando no sofá entre partidas no Salão Gamer';
              bot.timerEsperaFrames = 230 + subE * 70;
            }
          }
        }
      }

      const passoAtual = v.roteiro[bot.etapaRotina % v.roteiro.length];

      // 1) Fluxo dedicado da Bomboniere: Fila Ordenada no Balcão -> Assento Alinhado na Mesa
      if (bot.estadoLanchonete === 'INDO_FILA' || bot.estadoLanchonete === 'NA_FILA') {
        if (!this.filaLanchonete.includes(bot.id)) {
          if (this.filaLanchonete.length < 4) {
            this.filaLanchonete.push(bot.id);
          } else {
            avancarProximaEtapa();
            return;
          }
        }
        const slot = this.filaLanchonete.indexOf(bot.id);
        const slotX = Math.round((14.8 + slot * 1.15) * TILE_SIZE);
        const slotY = Math.round(18.0 * TILE_SIZE);

        if (bot.filaRota.length > 0 && Math.hypot(bot.x - slotX, bot.y - slotY) > 120) {
          this.avancarMovimentoFisico(bot, 1.38);
          bot.mostrarBalao = false;
        } else {
          bot.filaRota = [];
          const chegouSlot = this.moverParaPontoExato(bot, slotX, slotY, 1.38);
          if (chegouSlot) {
            bot.estadoLanchonete = 'NA_FILA';
            bot.pose = slot === 0 && bot.timerEsperaFrames <= 90 && bot.timerEsperaFrames > 40 ? 'CHATTING' : 'IDLE';
            bot.direcao = slot === 0 ? 'UP' : 'LEFT';
            bot.mostrarBalao = slot === 0;
            bot.balaoPrioridade = slot === 0 ? 2 : 1;
            if (slot === 0) {
              if (bot.timerEsperaFrames > 90) {
                bot.falaCurta = 'Quero lanche!';
                bot.iconeCabeca = '🧾';
              } else if (bot.timerEsperaFrames > 40) {
                bot.falaCurta = 'Passa PIX!';
                bot.iconeCabeca = '💳';
              } else {
                bot.falaCurta = 'Valeu!';
                bot.iconeCabeca = '🍕';
              }
              bot.acaoTexto = 'Fazendo pedido no balcão da Lanchonete';
              if (bot.timerEsperaFrames === 42) {
                this.eventosCompra.push({
                  id: `lanche_${this.globalTick}_${bot.id}`,
                  x: Math.round(bot.x),
                  y: Math.round(bot.y - 16),
                  textoValor: '+R$ 18',
                  icone: '🍕',
                  corLoja: '#ec4899',
                  inicioTick: this.globalTick,
                });
              }
              if (bot.timerEsperaFrames > 0) {
                bot.timerEsperaFrames--;
              } else {
                this.removerDasFilas(bot.id);
                const assento = this.reservarAssentoLivre(bot, idxVisitante);
                if (assento) {
                  bot.estadoLanchonete = 'INDO_MESA';
                  bot.comendoItem = ['🍕', '🍜', '☕', '🍔', '🥟', '🥤'][idxVisitante % 6];
                  bot.nodoAtualId = 'cozinha_balcao';
                  this.enviarParaDestino(bot, assento.acesso);
                  bot.timerEsperaFrames = 260 + (idxVisitante % 3) * 60;
                } else {
                  avancarProximaEtapa();
                }
              }
            } else {
              bot.falaCurta = 'Na fila...';
              bot.iconeCabeca = '⏳';
              bot.acaoTexto = `Aguardando na fila da Lanchonete (${slot + 1}º lugar)`;
              bot.timerEsperaFrames = 135;
            }
          } else {
            bot.estadoLanchonete = 'INDO_FILA';
            bot.mostrarBalao = false;
          }
        }
        return;
      }

      if (bot.estadoLanchonete === 'INDO_MESA') {
        const assento = ASSENTOS_REFEICAO.find((a) => a.id === bot.assentoReservadoId);
        if (!assento) {
          avancarProximaEtapa();
          return;
        }
        if (bot.filaRota.length > 0) {
          this.avancarMovimentoFisico(bot, 1.38);
          bot.mostrarBalao = false;
        } else {
          const chegouAssento = this.moverParaPontoExato(bot, assento.x * TILE_SIZE, assento.y * TILE_SIZE, 1.25);
          if (chegouAssento) {
            bot.estadoLanchonete = 'SENTADO_COMENDO';
            bot.pose = 'SITTING_EAT';
            bot.direcao = assento.dir;
            bot.profundidadeOffset = assento.dir === 'UP' ? 8 : 0;
            bot.comendoItem = bot.comendoItem || ['🍕', '🍜', '☕', '🍔', '🥟', '🥤'][idxVisitante % 6];
            bot.falaCurta = passoAtual.curto || 'Bom demais!';
            bot.iconeCabeca = bot.comendoItem;
            bot.acaoTexto = `Lanchando sentado na mesa da Bomboniere (${bot.comendoItem})`;
            bot.mostrarBalao = true;
          } else {
            bot.mostrarBalao = false;
          }
        }
        return;
      }

      if (bot.estadoLanchonete === 'SENTADO_COMENDO') {
        const assento = ASSENTOS_REFEICAO.find((a) => a.id === bot.assentoReservadoId);
        if (assento) {
          bot.x = assento.x * TILE_SIZE;
          bot.y = assento.y * TILE_SIZE;
          bot.direcao = assento.dir;
          bot.profundidadeOffset = assento.dir === 'UP' ? 8 : 0;
        }
        bot.pose = 'SITTING_EAT';
        bot.mostrarBalao = false;
        bot.iconeCabeca = bot.comendoItem || '🍕';
        bot.falaCurta = passoAtual.curto;
        if (bot.timerEsperaFrames > 0) {
          bot.timerEsperaFrames--;
        } else {
          // Levanta com segurança voltando para o corredor de acesso antes de seguir a próxima rota
          const acesso = assento?.acesso || 'cozinha_hall';
          this.liberarAssento(bot);
          delete bot.estadoLanchonete;
          delete bot.comendoItem;
          bot.profundidadeOffset = 0;
          const pulo = (this.globalTick + v.id.length) % 3 === 0 ? 2 : 1;
          bot.etapaRotina = (bot.etapaRotina + pulo) % v.roteiro.length;
          const proxPasso = v.roteiro[bot.etapaRotina];
          bot.nodoAtualId = acesso;
          bot.filaRota = [acesso, ...calcularCaminhoNoGrafo(acesso, proxPasso.nodo)];
          bot.pose = 'WALK';
          bot.falaCurta = proxPasso.curto;
          bot.acaoTexto = proxPasso.acao;
          bot.iconeCabeca = proxPasso.icone;
          bot.timerEsperaFrames = proxPasso.tempo;
        }
        return;
      }

      // Intercepta chegada em cozinha_balcao quando o visitante se aproxima da área da lanchonete
      if (
        passoAtual.nodo === 'cozinha_balcao' &&
        bot.timerConversaFrames === 0 &&
        Math.hypot(bot.x - 15.2 * TILE_SIZE, bot.y - 18.0 * TILE_SIZE) <= 135
      ) {
        if (this.filaLanchonete.length < 4) {
          this.filaLanchonete.push(bot.id);
          bot.estadoLanchonete = 'INDO_FILA';
          bot.timerEsperaFrames = 135;
          return;
        } else {
          const assento = this.reservarAssentoLivre(bot, idxVisitante);
          if (assento) {
            bot.estadoLanchonete = 'INDO_MESA';
            bot.comendoItem = ['🍕', '🍜', '☕', '🥟'][idxVisitante % 4];
            this.enviarParaDestino(bot, assento.acesso);
            bot.timerEsperaFrames = 240;
            return;
          }
        }
      }

      if (MESAS_BOMBONIERE_SET.has(passoAtual.nodo) && bot.timerConversaFrames === 0) {
        const assento = this.reservarAssentoLivre(bot, idxVisitante);
        if (assento) {
          bot.estadoLanchonete = 'INDO_MESA';
          bot.comendoItem = passoAtual.icone || '🍕';
          this.enviarParaDestino(bot, assento.acesso);
          bot.timerEsperaFrames = passoAtual.tempo;
          return;
        }
      }

      // Fluxo da Sala de Espera & Descanso PC no Salão Gamer (sofás e pufes)
      if (bot.estadoEsperaSalao === 'INDO_ESPERA') {
        const assentoEsp = ASSENTOS_ESPERA.find((a) => a.id === bot.assentoEsperaId);
        if (!assentoEsp) {
          avancarProximaEtapa();
          return;
        }
        if (bot.filaRota.length > 0) {
          this.avancarMovimentoFisico(bot, 1.38);
          bot.mostrarBalao = false;
        } else {
          const chegouEsp = this.moverParaPontoExato(bot, assentoEsp.x * TILE_SIZE, assentoEsp.y * TILE_SIZE, 1.25);
          if (chegouEsp) {
            bot.estadoEsperaSalao = 'DESCANSANDO';
            bot.pose = 'SITTING_REST';
            bot.direcao = assentoEsp.dir;
            bot.profundidadeOffset = 22;
            bot.falaCurta = salaoLotado ? 'Esperando PC' : 'Pausa no sofá';
            bot.iconeCabeca = '🛋️';
            bot.acaoTexto = salaoLotado
              ? 'Descansando no sofá da sala de espera aguardando PC'
              : 'Descansando no sofá entre partidas no Salão Gamer';
            bot.mostrarBalao = true;
          } else {
            bot.mostrarBalao = false;
          }
        }
        return;
      }

      if (bot.estadoEsperaSalao === 'DESCANSANDO') {
        const assentoEsp = ASSENTOS_ESPERA.find((a) => a.id === bot.assentoEsperaId);
        if (assentoEsp) {
          bot.x = assentoEsp.x * TILE_SIZE;
          bot.y = assentoEsp.y * TILE_SIZE;
          bot.direcao = assentoEsp.dir;
          bot.profundidadeOffset = 22;
        }
        bot.pose = 'SITTING_REST';
        bot.mostrarBalao = false;
        bot.falaCurta = salaoLotado ? 'Esperando PC' : 'Relaxando 📱';
        bot.iconeCabeca = salaoLotado ? '🛋️' : '📱';
        bot.acaoTexto = salaoLotado
          ? 'Descansando no sofá da sala de espera aguardando PC'
          : 'Relaxando no sofá do Salão Gamer entre partidas';
        if (bot.timerEsperaFrames > 0) {
          bot.timerEsperaFrames--;
        } else {
          const acesso = assentoEsp?.acesso || 'espera_salao_oeste';
          this.liberarAssentoEspera(bot);
          delete bot.estadoEsperaSalao;
          bot.profundidadeOffset = 0;
          const pulo = (this.globalTick + v.id.length) % 3 === 0 ? 2 : 1;
          bot.etapaRotina = (bot.etapaRotina + pulo) % v.roteiro.length;
          const proxPasso = v.roteiro[bot.etapaRotina];
          bot.nodoAtualId = acesso;
          bot.filaRota = [acesso, ...calcularCaminhoNoGrafo(acesso, proxPasso.nodo)];
          bot.pose = 'WALK';
          bot.falaCurta = proxPasso.curto;
          bot.acaoTexto = proxPasso.acao;
          bot.iconeCabeca = proxPasso.icone;
          bot.timerEsperaFrames = proxPasso.tempo;
        }
        return;
      }

      if (NODOS_ESPERA_SALAO_SET.has(passoAtual.nodo) && bot.timerConversaFrames === 0) {
        const assentoEsp = this.reservarAssentoEsperaLivre(bot, idxVisitante);
        if (assentoEsp) {
          bot.estadoEsperaSalao = 'INDO_ESPERA';
          this.enviarParaDestino(bot, assentoEsp.acesso);
          bot.timerEsperaFrames = 240;
          return;
        }
      }

      // Fila organizada no Food Truck da calçada ao se aproximar do balcão
      if (
        passoAtual.nodo === 'calcada_foodtruck' &&
        bot.timerConversaFrames === 0 &&
        Math.hypot(bot.x - WAYPOINT_NODES.calcada_foodtruck.x, bot.y - WAYPOINT_NODES.calcada_foodtruck.y) <= 135
      ) {
        if (!this.filaFoodTruck.includes(bot.id) && this.filaFoodTruck.length < 4) {
          this.filaFoodTruck.push(bot.id);
        }
        const slotFT = this.filaFoodTruck.indexOf(bot.id);
        if (slotFT >= 0) {
          const baseFT = WAYPOINT_NODES.calcada_foodtruck;
          const sx = baseFT.x + slotFT * 34;
          const sy = baseFT.y;
          if (bot.filaRota.length > 0 && Math.hypot(bot.x - sx, bot.y - sy) > 100) {
            this.avancarMovimentoFisico(bot, 1.38);
            bot.mostrarBalao = false;
            return;
          }
          bot.filaRota = [];
          const chegouFT = this.moverParaPontoExato(bot, sx, sy, 1.38);
          if (chegouFT) {
            bot.direcao = slotFT === 0 ? 'UP' : 'LEFT';
            bot.pose = slotFT === 0 ? 'EATING' : 'IDLE';
            bot.mostrarBalao = true;
            bot.falaCurta = slotFT === 0 ? passoAtual.curto : 'Na fila...';
            bot.iconeCabeca = slotFT === 0 ? passoAtual.icone : '🍔';
            bot.acaoTexto = slotFT === 0 ? passoAtual.acao : 'Aguardando na fila do Food Truck';
            if (slotFT === 0) {
              if (bot.timerEsperaFrames === 60) {
                this.eventosCompra.push({
                  id: `lanche_${this.globalTick}_${bot.id}`,
                  x: Math.round(bot.x),
                  y: Math.round(bot.y - 16),
                  textoValor: '+R$ 24',
                  icone: '🍔',
                  corLoja: '#f59e0b',
                  inicioTick: this.globalTick,
                });
              }
              if (bot.timerEsperaFrames > 0) {
                bot.timerEsperaFrames--;
              } else {
                this.removerDasFilas(bot.id);
                avancarProximaEtapa();
              }
            }
          } else {
            bot.mostrarBalao = false;
          }
          return;
        }
      }

      const chegou = this.avancarMovimentoFisico(bot, 1.38);

      if (bot.timerConversaFrames > 0) {
        bot.mostrarBalao = true;
        bot.balaoPrioridade = 2;
      } else if (chegou) {
        bot.pose = passoAtual.pose;
        bot.direcao = passoAtual.dir;
        bot.falaCurta = passoAtual.curto;
        bot.acaoTexto = passoAtual.acao;
        bot.iconeCabeca = passoAtual.icone;
        bot.mostrarBalao = false;

        if (bot.timerEsperaFrames > 0) {
          bot.timerEsperaFrames--;
        } else {
          avancarProximaEtapa();
        }
      } else {
        bot.mostrarBalao = false;
      }
    });

    // =========================================================================
    // 4. ATENDENTES DAS LOJAS (interagem ativamente com clientes no balcão!)
    // =========================================================================
    LOJAS.forEach((loja, idxLoja) => {
      const dados = DADOS_ATENDENTES[loja.id];
      const catalogo = CATALOGO_LOJAS[loja.id] || [];
      if (!dados) return;
      const id = `atendente_${loja.id}`;
      idsAtivosNesteFrame.add(id);
      const bot = this.criarOuAtualizarBot(id, dados.nome, `Atendente ${loja.nome}`, false, loja.frente.id, loja.cor, CORES_CABELO_BOT[idxLoja % CORES_CABELO_BOT.length]);
      const pos = posicaoAtendente(loja);
      bot.x = pos.x;
      bot.y = pos.y;
      bot.filaRota = [];
      bot.direcao = pos.dir;
      bot.pose = 'IDLE';
      bot.uniforme = dados.uniforme;

      // Procura cliente parado no balcão da loja
      const clienteNaLoja = Array.from(this.bots.values()).find(
        (b) => b.ehCliente && b.nodoAtualId === loja.frente.id && b.filaRota.length === 0
      );

      if (clienteNaLoja && catalogo.length > 0) {
        let transacao = this.transacoesLojas.get(loja.id);
        if (!transacao || transacao.clienteId !== clienteNaLoja.id) {
          transacao = {
            clienteId: clienteNaLoja.id,
            frameInicio: this.globalTick,
            itemIndex: (this.globalTick + idxLoja * 3) % catalogo.length,
            concluida: false,
          };
          this.transacoesLojas.set(loja.id, transacao);
          clienteNaLoja.timerEsperaFrames = Math.max(clienteNaLoja.timerEsperaFrames, 180);
        }

        const item = catalogo[transacao.itemIndex];
        const tempo = this.globalTick - transacao.frameInicio;

        // Vira um de frente para o outro!
        if (loja.lado === 'N') {
          bot.direcao = 'UP';
          clienteNaLoja.direcao = 'DOWN';
        } else if (loja.lado === 'E') {
          bot.direcao = 'RIGHT';
          clienteNaLoja.direcao = 'LEFT';
        } else {
          bot.direcao = 'LEFT';
          clienteNaLoja.direcao = 'RIGHT';
        }

        // Fases da compra:
        if (tempo < 50) {
          // Fase 1: Pedido
          clienteNaLoja.falaCurta = item.pedido;
          clienteNaLoja.iconeCabeca = item.iconeCliente;
          clienteNaLoja.mostrarBalao = true;
          clienteNaLoja.pose = 'IDLE';

          bot.falaCurta = item.resposta;
          bot.iconeCabeca = item.iconeAtendente;
          bot.mostrarBalao = true;
          bot.acaoTexto = `Atendendo ${clienteNaLoja.nome} na ${loja.nome}`;
        } else if (tempo < 95) {
          // Fase 2: Pagamento
          clienteNaLoja.falaCurta = 'Passa no PIX!';
          clienteNaLoja.iconeCabeca = '💳';
          clienteNaLoja.mostrarBalao = true;
          clienteNaLoja.pose = 'CHATTING';

          bot.falaCurta = `R$ ${item.preco},00`;
          bot.iconeCabeca = '📠';
          bot.mostrarBalao = true;
          bot.acaoTexto = `Recebendo pagamento de ${clienteNaLoja.nome}`;
        } else {
          // Fase 3: Conclusão e Entrega (dispara animação de compra no frame 95)
          if (!transacao.concluida) {
            transacao.concluida = true;
            this.eventosCompra.push({
              id: `compra_${this.globalTick}_${loja.id}`,
              x: Math.round((pos.x + clienteNaLoja.x) / 2),
              y: Math.round((pos.y + clienteNaLoja.y) / 2 - 10),
              textoValor: `+R$ ${item.preco}`,
              icone: item.iconeCliente,
              inicioTick: this.globalTick,
              corLoja: loja.cor,
            });
          }

          clienteNaLoja.falaCurta = item.agradecimento;
          clienteNaLoja.iconeCabeca = '🛍️';
          clienteNaLoja.mostrarBalao = true;
          clienteNaLoja.pose = 'EATING';

          bot.falaCurta = 'Volte sempre!';
          bot.iconeCabeca = '✨';
          bot.mostrarBalao = true;
          bot.acaoTexto = `Entregando ${item.pedido} para ${clienteNaLoja.nome}`;
        }
      } else {
        // Sem cliente no balcão: comportamento relaxado padrão
        this.transacoesLojas.delete(loja.id);
        const ciclo = Math.floor(this.globalTick / 240);
        const [fala, icone] = dados.falas[(ciclo + idxLoja) % dados.falas.length];
        bot.falaCurta = fala;
        bot.iconeCabeca = icone;
        bot.acaoTexto = `Atendendo na ${loja.nome}`;
        bot.mostrarBalao = false;
      }
    });

    // =========================================================================
    // 5. ARENA DE COMBATE, TATAME DE TREINO & PLATEIA NA ARQUIBANCADA
    // =========================================================================
    {
      const roundIdx = Math.floor(this.globalTick / 360);
      const cyc = this.globalTick % 360;
      const swayX = Math.sin(this.globalTick * 0.045) * 10;
      const swayY = Math.cos(this.globalTick * 0.035) * 6;

      let poseRed: PoseBot = 'FIGHT_STANCE';
      let poseBlue: PoseBot = 'FIGHT_STANCE';
      let falaRed = 'Na guarda!';
      let falaBlue = 'Vem!';
      let koFlash = false;
      let hpRed = 0.92;
      let hpBlue = 0.92;

      if (cyc < 70) {
        poseRed = 'FIGHT_STANCE';
        poseBlue = 'FIGHT_STANCE';
        hpRed = 0.95;
        hpBlue = 0.95;
      } else if (cyc < 105) {
        poseRed = cyc < 90 ? 'PUNCH' : 'FIGHT_STANCE';
        poseBlue = cyc < 92 ? 'BLOCK' : 'FIGHT_STANCE';
        falaRed = 'Direto!';
        falaBlue = 'Bloqueio!';
        hpRed = 0.92;
        hpBlue = 0.78;
      } else if (cyc < 145) {
        poseRed = 'FIGHT_STANCE';
        poseBlue = 'FIGHT_STANCE';
        hpRed = 0.90;
        hpBlue = 0.78;
      } else if (cyc < 185) {
        poseRed = cyc < 170 ? 'BLOCK' : 'FIGHT_STANCE';
        poseBlue = cyc < 168 ? 'KICK' : 'PUNCH';
        falaRed = 'Defesa!';
        falaBlue = 'Chute alto!';
        hpRed = 0.68;
        hpBlue = 0.76;
      } else if (cyc < 250) {
        const hitAlt = Math.floor(cyc / 16) % 2 === 0;
        poseRed = hitAlt ? 'PUNCH' : 'KICK';
        poseBlue = hitAlt ? 'BLOCK' : 'PUNCH';
        falaRed = 'Combo!!';
        falaBlue = 'Trocação!';
        const p = (cyc - 185) / 65;
        hpRed = 0.68 - p * 0.38;
        hpBlue = 0.76 - p * 0.44;
      } else if (cyc < 298) {
        const redVence = roundIdx % 2 === 0;
        koFlash = cyc >= 258 && cyc < 292;
        if (redVence) {
          poseRed = cyc < 276 ? 'KICK' : 'CHEER';
          poseBlue = 'BLOCK';
          falaRed = 'Nocaute!';
          falaBlue = 'Uff!';
          hpRed = 0.34;
          hpBlue = 0.04;
        } else {
          poseBlue = cyc < 276 ? 'PUNCH' : 'CHEER';
          poseRed = 'BLOCK';
          falaBlue = 'K.O.!!';
          falaRed = 'Aii!';
          hpRed = 0.04;
          hpBlue = 0.36;
        }
      } else {
        const rec = (cyc - 298) / 62;
        poseRed = 'FIGHT_STANCE';
        poseBlue = 'FIGHT_STANCE';
        falaRed = 'Boa luta!';
        falaBlue = 'Próx. round!';
        hpRed = 0.25 + rec * 0.7;
        hpBlue = 0.25 + rec * 0.7;
      }

      const bag1Cyc = this.globalTick % 75;
      const bag2Cyc = (this.globalTick + 32) % 75;
      const bag1Hit = bag1Cyc >= 28 && bag1Cyc < 42;
      const bag2Hit = bag2Cyc >= 28 && bag2Cyc < 42;

      this.arenaEstado = {
        hpRed,
        hpBlue,
        bag1Hit,
        bag2Hit,
        koFlash,
      };

      const registrarAtorArena = (
        id: string,
        nome: string,
        papel: string,
        x: number,
        y: number,
        dir: DirecaoSprite,
        pose: PoseBot,
        corRoupa: string,
        corCabelo: string,
        curto: string,
        acao: string,
        icone: string,
        mostrarBalao: boolean,
        profundidadeOffset = 0,
        temFone = false
      ) => {
        idsAtivosNesteFrame.add(id);
        const actor = this.criarOuAtualizarBot(id, nome, papel, false, 'arena_hall', corRoupa, corCabelo, temFone);
        actor.x = Math.round(x);
        actor.y = Math.round(y);
        actor.filaRota = [];
        actor.direcao = dir;
        actor.pose = pose;
        actor.falaCurta = curto;
        actor.acaoTexto = acao;
        actor.iconeCabeca = icone;
        actor.mostrarBalao = mostrarBalao;
        actor.profundidadeOffset = profundidadeOffset;
        actor.uniforme = undefined;
        actor.ferramenta = undefined;
      };

      const redX = 78.05 * TILE_SIZE + swayX - (poseRed === 'PUNCH' || poseRed === 'KICK' ? -5 : 0);
      const blueX = 80.35 * TILE_SIZE + swayX - (poseBlue === 'PUNCH' || poseBlue === 'KICK' ? 5 : 0);
      const fightY = 41.2 * TILE_SIZE + swayY;

      registrarAtorArena(
        'arena_lutador_red',
        'Kael Red',
        'Lutador MMA',
        redX,
        fightY,
        'RIGHT',
        poseRed,
        '#dc2626',
        '#1e293b',
        falaRed,
        'Lutando no Ringue da Arena (Corner Vermelho)',
        '🥊',
        koFlash,
        0
      );

      registrarAtorArena(
        'arena_lutador_blue',
        'Ryuji Blue',
        'Lutador Kickbox',
        blueX,
        fightY,
        'LEFT',
        poseBlue,
        '#2563eb',
        '#92400e',
        falaBlue,
        'Lutando no Ringue da Arena (Corner Azul)',
        '🥊',
        koFlash,
        0
      );

      registrarAtorArena(
        'arena_arbitro',
        'Árbitro Leo',
        'Juiz do Ringue',
        79.2 * TILE_SIZE + swayX * 0.6,
        38.7 * TILE_SIZE,
        'DOWN',
        koFlash ? 'CHEER' : 'IDLE',
        '#18181b',
        '#3f3f46',
        koFlash ? 'Nocaute!' : 'Fight!',
        'Arbitrando combate oficial no ringue',
        '🔔',
        false,
        0
      );

      // Dupla treinando nos Sacos de Pancada no Tatame (67.6..72.6, y=42.2..45.0)
      const poseTr1: PoseBot = bag1Cyc >= 25 && bag1Cyc < 36 ? 'PUNCH' : bag1Cyc >= 52 && bag1Cyc < 64 ? 'KICK' : 'FIGHT_STANCE';
      const poseTr2: PoseBot = bag2Cyc >= 25 && bag2Cyc < 36 ? 'KICK' : bag2Cyc >= 52 && bag2Cyc < 64 ? 'PUNCH' : 'FIGHT_STANCE';

      registrarAtorArena(
        'arena_treino_1',
        'Igor Thai',
        'Atleta Muay Thai',
        69.1 * TILE_SIZE,
        43.45 * TILE_SIZE,
        'LEFT',
        poseTr1,
        '#e11d48',
        '#1e293b',
        'Jab-Direto!',
        'Treinando combinações no saco de pancada',
        '🥊',
        false,
        0
      );

      registrarAtorArena(
        'arena_treino_2',
        'Bella MMA',
        'Atleta Boxe',
        71.15 * TILE_SIZE,
        43.45 * TILE_SIZE,
        'RIGHT',
        poseTr2,
        '#0d9488',
        '#7c2d12',
        'Chute Alto!',
        'Treinando chutes no tatame',
        '🥋',
        false,
        0
      );

      registrarAtorArena(
        'arena_treinador',
        'Mestre Aldo',
        'Coach Arena',
        70.1 * TILE_SIZE,
        44.35 * TILE_SIZE,
        Math.floor(this.globalTick / 80) % 2 === 0 ? 'LEFT' : 'RIGHT',
        'CHATTING',
        '#ca8a04',
        '#3f3f46',
        'Mais guarda!',
        'Orientando atletas no tatame de treino',
        '⏱️',
        false,
        0
      );

      // Narrador atrás da Bancada de Narradores (71.2, 47.2)
      registrarAtorArena(
        'arena_narrador',
        'CasterGui',
        'Narrador Arena',
        72.35 * TILE_SIZE,
        48.1 * TILE_SIZE,
        'UP',
        koFlash ? 'CHEER' : 'CHATTING',
        '#7c3aed',
        '#1e293b',
        koFlash ? 'NOCAUTE!!' : 'QUE LUTA!',
        'Narrando ao vivo os combates da Arena',
        '🎙️',
        koFlash,
        6,
        true
      );

      // Plateia sentada na Arquibancada (3 degraus x=67.8..73.0, y=37.05 / 38.15 / 39.3)
      const plateiaSpec: Array<{ x: number; y: number; off: number; nome: string; cor: string; cab: string }> = [
        { x: 68.0, y: 37.05, off: 8, nome: 'Vini', cor: '#2563eb', cab: '#1e293b' },
        { x: 70.3, y: 37.05, off: 8, nome: 'Luana', cor: '#db2777', cab: '#7c2d12' },
        { x: 72.5, y: 37.05, off: 8, nome: 'Rafa', cor: '#16a34a', cab: '#92400e' },
        { x: 69.1, y: 38.15, off: 8, nome: 'Tati', cor: '#9333ea', cab: '#3b0764' },
        { x: 71.5, y: 38.15, off: 8, nome: 'Beto', cor: '#ea580c', cab: '#1e293b' },
        { x: 70.3, y: 39.3, off: 22, nome: 'Léo', cor: '#0284c7', cab: '#7f1d1d' },
      ];
      plateiaSpec.forEach((sp, iP) => {
        const vibrando = koFlash || (cyc >= 70 && cyc < 105) || (cyc >= 185 && cyc < 250);
        registrarAtorArena(
          `arena_plateia_${iP + 1}`,
          sp.nome,
          'Torcida Arena',
          sp.x * TILE_SIZE,
          sp.y * TILE_SIZE,
          'DOWN',
          vibrando ? 'CHEER' : 'IDLE',
          sp.cor,
          sp.cab,
          koFlash ? 'UHUUUL!!' : 'VAI!!',
          'Torcendo na arquibancada da Arena',
          koFlash ? '🔥' : '📣',
          false,
          sp.off
        );
      });
    }

    // =========================================================================
    // 6. SINUCA & BAR NA ÁREA VIP + CANTINHO SECRETO ROMÂNTICO (AO LADO DO WC)
    // =========================================================================
    {
      const registrarAtorFixo = (
        id: string,
        nome: string,
        papel: string,
        xTile: number,
        yTile: number,
        dir: DirecaoSprite,
        pose: PoseBot,
        corRoupa: string,
        corCabelo: string,
        falaCurta: string,
        acaoTexto: string,
        iconeCabeca: string,
        mostrarBalao: boolean,
        profundidadeOffset = 0,
        uniforme?: UniformeFuncionario,
        ferramenta?: FerramentaTrabalho,
        balaoPrioridade = 1
      ) => {
        idsAtivosNesteFrame.add(id);
        const actor = this.criarOuAtualizarBot(id, nome, papel, false, 'vip_hall_1', corRoupa, corCabelo, false);
        actor.x = Math.round(xTile * TILE_SIZE);
        actor.y = Math.round(yTile * TILE_SIZE);
        actor.filaRota = [];
        actor.direcao = dir;
        actor.pose = pose;
        actor.falaCurta = falaCurta;
        actor.acaoTexto = acaoTexto;
        actor.iconeCabeca = iconeCabeca;
        actor.mostrarBalao = mostrarBalao;
        actor.balaoPrioridade = balaoPrioridade;
        actor.profundidadeOffset = profundidadeOffset;
        actor.uniforme = uniforme;
        actor.ferramenta = ferramenta;
      };

      const s1 = this.globalTick % 90;
      const s2 = (this.globalTick + 45) % 90;
      const falasSinuca = ['Bola 8!', 'Tacada!', 'Caçapa!', 'Sua vez!'];

      // Mesa 1 (67.4, 30.2)
      registrarAtorFixo(
        'vip_sinuca_1',
        'Matheus',
        'Jogador Sinuca',
        66.75,
        30.95,
        'RIGHT',
        'PLAY_POOL',
        '#2563eb',
        '#1e293b',
        falasSinuca[Math.floor(this.globalTick / 90) % falasSinuca.length],
        'Jogando sinuca na área VIP',
        '🎱',
        false
      );
      registrarAtorFixo(
        'vip_sinuca_2',
        'Rafaela',
        'Jogadora Sinuca',
        71.2,
        30.95,
        'LEFT',
        s1 >= 55 ? 'PLAY_POOL' : 'IDLE',
        '#db2777',
        '#7c2d12',
        'Boa tacada!',
        'Disputando partida de sinuca na área VIP',
        '✨',
        false
      );

      // Mesa 2 (76.4, 30.2)
      registrarAtorFixo(
        'vip_sinuca_3',
        'Kauã',
        'Jogador Sinuca',
        75.75,
        30.95,
        'RIGHT',
        'PLAY_POOL',
        '#059669',
        '#3f3f46',
        'Olha o efeito!',
        'Jogando sinuca na mesa leste VIP',
        '🎱',
        false
      );
      registrarAtorFixo(
        'vip_sinuca_4',
        'Beatriz',
        'Jogadora Sinuca',
        78.0,
        29.85,
        'DOWN',
        s2 >= 50 ? 'PLAY_POOL' : 'CHATTING',
        '#7c3aed',
        '#92400e',
        'Encaçapou!',
        'Torcendo e jogando sinuca no Lounge VIP',
        '🔥',
        false
      );

      // Barman e cliente no Bar VIP (80.2, 28.9)
      registrarAtorFixo(
        'vip_barman',
        'Tom',
        'Barman VIP',
        81.4,
        29.55,
        'DOWN',
        'WORKING_TOOL',
        '#be185d',
        '#1e293b',
        'Drink VIP!',
        'Preparando drinks atrás do Bar VIP',
        '🍹',
        false,
        0,
        'LANCHONETE',
        'BANDEJA_LANCHE'
      );
      registrarAtorFixo(
        'vip_bar_cliente',
        'Henrique',
        'Cliente VIP',
        81.6,
        31.1,
        'UP',
        'SITTING_EAT',
        '#0ea5e9',
        '#7c2d12',
        'Energético!',
        'Tomando drink no balcão do Bar VIP',
        '🍹',
        false,
        8
      );

      // Porteiro / Segurança guardando a porta restrita do Cantinho VIP (x=82.85, y=13.5)
      const curiosoNaPortaVip = Array.from(this.bots.values()).some(
        (b) =>
          (b.id.startsWith('visitante_') || b.id.startsWith('cliente_')) &&
          b.x >= 78.2 * TILE_SIZE &&
          b.x <= 84.0 * TILE_SIZE &&
          b.y >= 11.8 * TILE_SIZE &&
          b.y <= 15.2 * TILE_SIZE
      );
      const portaJanela = curiosoNaPortaVip || Math.floor(this.globalTick / 110) % 4 === 0;
      const idxPorteiro = Math.floor(this.globalTick / 110) % 4;
      const falasPorteiro = curiosoNaPortaVip
        ? ['Só c/ VIP!', 'Área Restrita', 'Pulseira VIP?', 'Sem acesso!']
        : ['Área Restrita', 'Lista na porta', 'Só Casal VIP', 'Porta trancada'];
      registrarAtorFixo(
        'porteiro_cantinho_vip',
        'Seg. Marcos',
        'Porteiro VIP',
        82.85,
        13.5,
        'LEFT',
        'IDLE',
        '#111827',
        '#1e293b',
        falasPorteiro[idxPorteiro],
        curiosoNaPortaVip
          ? 'Barrando curioso na entrada restrita do Cantinho VIP'
          : 'Protegendo a porta blindada e conferindo a lista do Cantinho VIP',
        '🕶️',
        portaJanela,
        10,
        'SEGURANCA',
        undefined,
        curiosoNaPortaVip ? 3 : 2
      );

      // Setor Escondido Romântico (x=84.4..93.4, y=4.6..15.6 ao lado do WC Equipe)
      const cFase = Math.floor(this.globalTick / 55) % 4;
      const kiss1 = cFase === 1 || cFase === 3;
      const kiss2 = cFase === 0 || cFase === 2;
      const slotVip = Math.floor(this.globalTick / 120) % 6;
      const subVip = Math.floor(this.globalTick / 360) % 3;

      const falasC1A = ['Beijinho! ❤️', 'Meu duo VIP', 'Só nós dois!'];
      const acoesC1A = [
        'Trocando beijos apaixonados no sofá reservado do Cantinho VIP',
        'Curtindo a privacidade da suíte atrás da porta protegida',
        'Abraçado com o amor no sofá do setor restrito',
      ];
      const falasC1B = ['Te amo! 💕', 'Porta fechada', 'Meu player 1'];
      const acoesC1B = [
        'Aconchegada no sofá reservado longe do barulho do salão',
        'Sussurrando declarações no ouvido dentro do Cantinho VIP',
        'Rindo baixinho enquanto o porteiro guarda a entrada',
      ];
      const falasC2A = ['Modo Love 💕', 'Manta quente', 'Ninguém entra'];
      const acoesC2A = [
        'Em clima íntimo sob a mantinha no setor VIP reservado',
        'Fazendo amor escondidinho sob a manta no cantinho VIP',
        'Aproveitando o isolamento total da ala VIP',
      ];
      const falasC2B = ['Shhh... 🤫', 'Porteiro tá lá', 'VIP valeu mto'];
      const acoesC2B = [
        'Curtindo momento romântico com o segurança vigiando a porta',
        'Namorando intensamente sob a manta no Cantinho VIP',
        'Sussurrando no ouvido para ninguém do corredor ouvir',
      ];
      const falasC3A = ['Climinha ❤️', 'Cola aqui 💕', 'Sozinhos!'];
      const acoesC3A = [
        'Trocando carícias no canto escondido do setor restrito',
        'Beijando a namorada na penumbra da ala VIP',
        'Aproveitando o acesso exclusivo do Cantinho VIP',
      ];
      const falasC3B = ['Lovinho 💕', 'Sem lag aqui', 'Meu duo ❤️'];
      const acoesC3B = [
        'Beijando o namorado protegidos pela porta restrita VIP',
        'Abraçadinha aproveitando o clima romântico da sala',
        'Curtindo a noite sem pressa dentro do setor VIP',
      ];

      // Casal 1 no Loveseat Norte (85.7..89.3, y=6.1..7.45)
      registrarAtorFixo(
        'casal_1_a',
        'Gabriel ❤️',
        'Casal VIP',
        87.15,
        7.05,
        'RIGHT',
        kiss1 ? 'ROMANCE_KISS' : 'ROMANCE_CUDDLE',
        '#e11d48',
        '#1e293b',
        falasC1A[subVip],
        acoesC1A[subVip],
        '❤️',
        slotVip === 0 || slotVip === 3,
        20,
        undefined,
        undefined,
        2
      );
      registrarAtorFixo(
        'casal_1_b',
        'Júlia 💕',
        'Casal VIP',
        87.82,
        7.05,
        'LEFT',
        kiss1 ? 'ROMANCE_KISS' : 'ROMANCE_CUDDLE',
        '#ec4899',
        '#7c2d12',
        falasC1B[subVip],
        acoesC1B[subVip],
        '💕',
        slotVip === 1 || slotVip === 4,
        20,
        undefined,
        undefined,
        2
      );

      // Casal 2 sob a mantinha no Cantinho Reservado Leste (88.6..92.5, y=10.5..13.0)
      registrarAtorFixo(
        'casal_2_a',
        'Léo ❤️',
        'Casal VIP',
        90.15,
        11.45,
        'RIGHT',
        kiss2 ? 'ROMANCE_KISS' : 'ROMANCE_CUDDLE',
        '#7c3aed',
        '#1e293b',
        falasC2A[subVip],
        acoesC2A[subVip],
        '💕',
        slotVip === 2,
        0,
        undefined,
        undefined,
        2
      );
      registrarAtorFixo(
        'casal_2_b',
        'Clara 💖',
        'Casal VIP',
        90.82,
        11.45,
        'LEFT',
        kiss2 ? 'ROMANCE_KISS' : 'ROMANCE_CUDDLE',
        '#f43f5e',
        '#3b0764',
        falasC2B[subVip],
        acoesC2B[subVip],
        '💖',
        slotVip === 5,
        0,
        undefined,
        undefined,
        2
      );

      // Casal 3 abraçadinho no canto sul-oeste do setor escondido (85.6..87.2, y=11.8)
      registrarAtorFixo(
        'casal_3_a',
        'Enzo ❤️',
        'Casal VIP',
        85.95,
        11.85,
        'RIGHT',
        cFase === 2 ? 'ROMANCE_KISS' : 'ROMANCE_CUDDLE',
        '#2563eb',
        '#92400e',
        falasC3A[subVip],
        acoesC3A[subVip],
        '❤️',
        slotVip === 1 || slotVip === 4,
        0,
        undefined,
        undefined,
        2
      );
      registrarAtorFixo(
        'casal_3_b',
        'Malu 💕',
        'Casal VIP',
        86.62,
        11.85,
        'LEFT',
        cFase === 2 ? 'ROMANCE_KISS' : 'ROMANCE_CUDDLE',
        '#db2777',
        '#7f1d1d',
        falasC3B[subVip],
        acoesC3B[subVip],
        '💕',
        slotVip === 2 || slotVip === 5,
        0,
        undefined,
        undefined,
        2
      );
    }

    // =========================================================================
    // 7. SALÃO GAMER VIVO & POVOADO (ESPERA & DESCANSO, ESPECTADORES E BARRACAS)
    // =========================================================================
    {
      const pcsLivresSalao = computadores.filter((c) => c.status === 'LIVRE' && c.numero <= 24 && c.numero !== 3).length;
      const salaoSemPcLivre = pcsLivresSalao <= 1;

      const registrarClienteSetor = (
        id: string,
        nome: string,
        papel: string,
        xTile: number,
        yTile: number,
        dir: DirecaoSprite,
        pose: PoseBot,
        corRoupa: string,
        corCabelo: string,
        falaCurta: string,
        acaoTexto: string,
        iconeCabeca: string,
        profundidadeOffset = 0
      ) => {
        idsAtivosNesteFrame.add(id);
        const bot = this.criarOuAtualizarBot(id, nome, papel, true, 'espera_salao_oeste', corRoupa, corCabelo, true);
        bot.x = Math.round(xTile * TILE_SIZE);
        bot.y = Math.round(yTile * TILE_SIZE);
        bot.filaRota = [];
        bot.direcao = dir;
        bot.pose = pose;
        bot.falaCurta = falaCurta;
        bot.acaoTexto = acaoTexto;
        bot.iconeCabeca = iconeCabeca;
        bot.mostrarBalao = false;
        bot.profundidadeOffset = profundidadeOffset;
      };

      // 7A. ÁREA "ESPERA & DESCANSO" (Sofás azul e roxo + pufes x=43..57, y=29.7..33.8)
      // Só exibe falas de "aguardando PC liberar" quando o salão estiver realmente lotado; caso contrário mostra pausa/descanso
      const papelLounge = salaoSemPcLivre ? 'Cliente Espera' : 'Descanso Lounge';
      registrarClienteSetor(
        'espera_sofa1_a',
        'Lucas',
        papelLounge,
        44.7,
        30.45,
        'DOWN',
        'SITTING_REST',
        '#0284c7',
        '#1e293b',
        salaoSemPcLivre ? 'Fila PC 📱' : 'Vendo stream 📱',
        salaoSemPcLivre ? 'Descansando no sofá azul aguardando vaga nos PCs' : 'Descansando no sofá azul assistindo stream após jogar',
        '📱',
        22
      );
      registrarClienteSetor(
        'espera_sofa1_b',
        'Marina',
        papelLounge,
        46.7,
        30.45,
        'DOWN',
        'SITTING_REST',
        '#db2777',
        '#7c2d12',
        'Guia Gamer',
        'Lendo guia gamer no sofá do lounge entre partidas',
        '🛋️',
        22
      );

      registrarClienteSetor(
        'espera_sofa2_a',
        'Felipe',
        papelLounge,
        52.7,
        30.45,
        'DOWN',
        'SITTING_REST',
        '#7c3aed',
        '#92400e',
        'Switch 🎮',
        'Jogando Nintendo Switch com amigos no sofá roxo',
        '🎮',
        22
      );
      registrarClienteSetor(
        'espera_sofa2_b',
        'Júlia',
        papelLounge,
        54.7,
        30.45,
        'DOWN',
        'SITTING_REST',
        '#ea580c',
        '#3f3f46',
        salaoSemPcLivre ? 'Esperando PC' : 'Bora duo?',
        salaoSemPcLivre
          ? 'Conversando no lounge aguardando um PC vagar'
          : 'Conversando no sofá do lounge combinando a próxima partida',
        '💬',
        22
      );

      registrarClienteSetor(
        'espera_pufe_1',
        'Danilo',
        papelLounge,
        44.5,
        33.1,
        'UP',
        'SITTING_REST',
        '#16a34a',
        '#1e293b',
        'Carregando cel',
        'Carregando o celular nos pufes do salão',
        '🔋',
        12
      );
      registrarClienteSetor(
        'espera_pufe_3',
        'Beatriz',
        papelLounge,
        52.5,
        33.1,
        'UP',
        'SITTING_REST',
        '#0891b2',
        '#7f1d1d',
        'Vendo deck PC',
        'Acompanhando as jogadas dos amigos no deck nos pufes',
        '👀',
        12
      );

      // 7B. ESPECTADORES / AMIGOS NAS FILEIRAS DE PCS (acompanhando os jogos de pé nas bancadas)
      // Fileira 1 (atrás do PC-02 / PC-03):
      registrarClienteSetor('espectador_ilha_1', 'Thiago', 'Espectador PC', 27.5, 19.8, 'UP', 'IDLE', '#4f46e5', '#1e293b', 'Passa a call!', 'Assistindo o amigo jogar CS2 no PC-02', '👀', 0);
      // Fileira 2 (atrás do PC-06 / PC-07):
      registrarClienteSetor('espectador_ilha_2', 'Cauã', 'Espectador PC', 32.5, 28.8, 'UP', 'IDLE', '#e11d48', '#92400e', 'Que mira limpa!', 'Vibrando com o clutch no PC-06', '🔥', 0);
      // Fileira 3 (atrás do PC-10 / PC-11):
      registrarClienteSetor('espectador_ilha_3', 'Lorena', 'Espectador PC', 29.5, 37.8, 'UP', 'IDLE', '#059669', '#3b0764', '300 FPS liso', 'Conferindo a gameplay fluida no PC-10', '⚡', 0);
      // Deck Gamer (Deck 1 e Deck 2):
      registrarClienteSetor('espectador_deck_1', 'Enzo', 'Espectador PC', 51.0, 19.8, 'UP', 'IDLE', '#d97706', '#1e293b', 'Joga muito!', 'Torcendo pelo duo no PC-20', '🏆', 0);
      registrarClienteSetor('espectador_deck_2', 'Paula', 'Espectador PC', 53.0, 28.8, 'UP', 'IDLE', '#ec4899', '#7c2d12', 'Que play insana!', 'Acompanhando a partida no PC-23', '🎯', 0);

      // 7C. CLIENTES INTERAGINDO NAS 4 BARRACAS DO SALÃO GAMER (y=41.8)
      registrarClienteSetor('cliente_barraca_hardware', 'Murilo', 'Cliente Loja', 18.0, 41.8, 'UP', 'IDLE', '#2563eb', '#1e293b', 'Tem RTX 4070?', 'Pesquisando upgrades na Hardware Store', '🖥️', 0);
      registrarClienteSetor('cliente_barraca_assistencia', 'Camila', 'Cliente Loja', 27.5, 41.8, 'UP', 'IDLE', '#ca8a04', '#7c2d12', 'Conserto rápido', 'Solicitando troca de pasta térmica na Assistência', '🔧', 0);
      registrarClienteSetor('cliente_barraca_games', 'Breno', 'Cliente Loja', 47.0, 41.8, 'UP', 'IDLE', '#9333ea', '#3f3f46', 'Gift Card Steam', 'Comprando gift cards na Game Store', '🎮', 0);
      registrarClienteSetor('cliente_barraca_perifericos', 'Letícia', 'Cliente Loja', 56.5, 41.8, 'UP', 'IDLE', '#dc2626', '#1e293b', 'Mouse 8000Hz', 'Testando switches e mouses na barraca', '⌨️', 0);
    }

    // Remove bots antigos e libera filas/assentos órfãos
    for (const key of Array.from(this.bots.keys())) {
      if (!idsAtivosNesteFrame.has(key)) {
        const removido = this.bots.get(key);
        if (removido) {
          this.liberarAssento(removido);
          this.liberarAssentoEspera(removido);
        }
        this.removerDasFilas(key);
        this.bots.delete(key);
      }
    }

    this.filaLanchonete = this.filaLanchonete.filter((id) => idsAtivosNesteFrame.has(id));
    this.filaFoodTruck = this.filaFoodTruck.filter((id) => idsAtivosNesteFrame.has(id));

    const todos = Array.from(this.bots.values());
    // Física de separação para impedir empilhamento no ambiente
    this.aplicarFisicaSeparacao(todos);
    // Verifica encontros na calçada e nos corredores para pararem e conversar!
    this.processarEncontrosSociais(todos);
    // Cronômetro global dos balões de conversa + limite máximo simultâneo no mapa
    this.aplicarControleTempoBaloes(todos);

    return todos.sort((a, b) => a.y - b.y);
  }

  private aplicarControleTempoBaloes(todos: AgenteBot[]) {
    const candidatos: AgenteBot[] = [];

    for (const bot of todos) {
      // Bots em hype PC usam o banner arcade próprio — não duplicar com balão de texto HUD
      if (bot.eventoPcHype) {
        bot.mostrarBalao = false;
        bot.balaoVisivelAteTick = undefined;
        continue;
      }

      if (!bot.mostrarBalao) {
        bot.balaoVisivelAteTick = undefined;
        continue;
      }

      // Se o tempo máximo do balão já expirou, encerra e inicia cooldown silencioso
      if (bot.balaoVisivelAteTick !== undefined && this.globalTick > bot.balaoVisivelAteTick) {
        bot.mostrarBalao = false;
        bot.balaoVisivelAteTick = undefined;
        const jitter = hashDeterministico(this.globalTick, bot.id.length * 17) % 360;
        bot.balaoCooldownAteTick = this.globalTick + 450 + jitter;
        continue;
      }

      const prioridade = bot.balaoPrioridade ?? 1;
      const textoNovo = bot.balaoUltimoTexto !== bot.falaCurta;

      if (bot.balaoVisivelAteTick === undefined) {
        if (
          bot.balaoCooldownAteTick !== undefined &&
          this.globalTick < bot.balaoCooldownAteTick &&
          (!textoNovo || prioridade < 2) &&
          prioridade < 4
        ) {
          bot.mostrarBalao = false;
          continue;
        }
        // Duração cronometrada: clientes a caminho dos PCs ganham maior destaque e tempo de leitura (~3s)
        const ttl = prioridade >= 4 ? 180 : prioridade >= 2 ? 120 : 90;
        bot.balaoVisivelAteTick = this.globalTick + ttl;
        bot.balaoUltimoTexto = bot.falaCurta;
      }

      candidatos.push(bot);
    }

    if (candidatos.length > MAX_BALOES_MUNDO) {
      candidatos.sort((a, b) => {
        const pa = a.balaoPrioridade ?? 1;
        const pb = b.balaoPrioridade ?? 1;
        if (pb !== pa) return pb - pa;
        return (b.balaoVisivelAteTick ?? 0) - (a.balaoVisivelAteTick ?? 0);
      });
      for (let i = MAX_BALOES_MUNDO; i < candidatos.length; i++) {
        candidatos[i].mostrarBalao = false;
      }
    }
  }
}

export const simuladorBotsMapa = new SimuladorBotsMapa();
