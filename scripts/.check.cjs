"use strict";

// src/world/constants.ts
var TILE_SIZE = 32;
var MAP_COLS = 96;
var MAP_ROWS = 64;
var WORLD_W = MAP_COLS * TILE_SIZE;
var WORLD_H = MAP_ROWS * TILE_SIZE;
var COLLISION_CELL = TILE_SIZE / 2;
var COLLISION_COLS = MAP_COLS * 2;
var COLLISION_ROWS = MAP_ROWS * 2;
var BOT_SPEED_SCALE = 1.7;

// src/world/layout.ts
var SALAS = [
  { id: "estudio", tipo: "ESTUDIO", nome: "EST\xDADIO LIVE", x: 4, y: 4, w: 16, h: 8, piso: "AZULEJO", cor: "#f472b6" },
  { id: "adm", tipo: "ADM", nome: "ADMINISTRA\xC7\xC3O", x: 20, y: 4, w: 16, h: 8, piso: "CARPETE", cor: "#38bdf8" },
  { id: "noc", tipo: "NOC", nome: "NOC SERVIDORES", x: 36, y: 4, w: 16, h: 8, piso: "AZULEJO", cor: "#4ade80" },
  { id: "estoque", tipo: "ESTOQUE", nome: "ESTOQUE", x: 52, y: 4, w: 16, h: 8, piso: "CONCRETO", cor: "#fb923c" },
  { id: "wc_cliente", tipo: "BANHEIRO_CLIENTE", nome: "WC CLIENTES", x: 68, y: 4, w: 8, h: 8, piso: "AZULEJO", cor: "#67e8f9" },
  { id: "wc_func", tipo: "BANHEIRO_FUNC", nome: "WC EQUIPE", x: 76, y: 4, w: 8, h: 8, piso: "AZULEJO", cor: "#a5b4fc" },
  { id: "servico", tipo: "SERVICO", nome: "CORREDOR DE SERVI\xC7O", x: 4, y: 12, w: 80, h: 3, piso: "CONCRETO", cor: "#94a3b8" },
  { id: "bomboniere", tipo: "BOMBONIERE", nome: "BOMBONIERE", x: 4, y: 15, w: 16, h: 16, piso: "AZULEJO", cor: "#f472b6" },
  { id: "lounge", tipo: "LOUNGE", nome: "LOUNGE", x: 4, y: 31, w: 16, h: 21, piso: "MADEIRA", cor: "#2dd4bf" },
  { id: "salao", tipo: "SALAO", nome: "SAL\xC3O GAMER", x: 20, y: 15, w: 40, h: 30, piso: "CARPETE", cor: "#22d3ee" },
  { id: "corredor", tipo: "CORREDOR", nome: "CORREDOR LESTE", x: 60, y: 15, w: 3, h: 37, piso: "CONCRETO", cor: "#94a3b8" },
  { id: "vip", tipo: "VIP", nome: "GAME ON VIP", x: 63, y: 15, w: 21, h: 18, piso: "CARPETE", cor: "#c084fc" },
  { id: "arena", tipo: "ARENA", nome: "CONSOLES & E-SPORTS", x: 63, y: 33, w: 21, h: 19, piso: "AZULEJO", cor: "#facc15" },
  { id: "recepcao", tipo: "RECEPCAO", nome: "RECEP\xC7\xC3O PIX", x: 20, y: 45, w: 40, h: 7, piso: "MADEIRA", cor: "#38bdf8" },
  { id: "expansao", tipo: "EXPANSAO", nome: "EXPANS\xC3O", x: 84, y: 4, w: 10, h: 48, piso: "CONCRETO", cor: "#fbbf24", bloqueada: true }
];
var PORTAS = [
  { id: "porta_principal", orientacao: "H", x: 40, y: 52, largura: 2, etiqueta: "ENTRADA" },
  { id: "porta_recepcao", orientacao: "H", x: 40, y: 45, largura: 2, etiqueta: "SAL\xC3O" },
  { id: "porta_recepcao_leste", orientacao: "V", x: 60, y: 47, largura: 2 },
  { id: "porta_servico_salao", orientacao: "H", x: 40, y: 15, largura: 2 },
  { id: "porta_salao_leste", orientacao: "V", x: 60, y: 28, largura: 2 },
  { id: "porta_bomboniere", orientacao: "V", x: 20, y: 21, largura: 2 },
  { id: "porta_ala_oeste", orientacao: "V", x: 20, y: 35, largura: 2, etiqueta: "LOUNGE" },
  { id: "porta_cozinha", orientacao: "H", x: 12, y: 15, largura: 2, etiqueta: "BOMBONIERE" },
  { id: "porta_bomb_lounge", orientacao: "H", x: 12, y: 31, largura: 2 },
  { id: "porta_estudio", orientacao: "H", x: 12, y: 12, largura: 2, etiqueta: "EST\xDADIO" },
  { id: "porta_escritorio", orientacao: "H", x: 28, y: 12, largura: 2, etiqueta: "ADM" },
  { id: "porta_sala_tecnica", orientacao: "H", x: 44.5, y: 12, largura: 2, etiqueta: "NOC" },
  { id: "porta_estoque", orientacao: "H", x: 60, y: 12, largura: 2, etiqueta: "ESTOQUE" },
  { id: "porta_wc_cliente", orientacao: "H", x: 72, y: 12, largura: 2 },
  { id: "porta_wc_func", orientacao: "H", x: 80, y: 12, largura: 2 },
  { id: "porta_corredor_servico", orientacao: "H", x: 61.5, y: 15, largura: 3 },
  { id: "porta_vip", orientacao: "V", x: 63, y: 21, largura: 2, etiqueta: "VIP" },
  { id: "porta_sala_vip", orientacao: "H", x: 73.5, y: 33, largura: 2 },
  { id: "porta_arena_esports", orientacao: "V", x: 63, y: 41, largura: 2, etiqueta: "ARENA" }
];
var linha = (numeros, prefixoAssento, xs, y, corredores) => numeros.map((n, i) => ({
  numero: n,
  nodoAssento: `${prefixoAssento}_${String(n).padStart(2, "0")}_seat`,
  x: xs[i],
  y,
  corredor: corredores[i]
}));
var SLOTS_PC = [
  // Salão: 3 ilhas de 4 PCs (comuns)
  ...linha([1, 2, 3, 4], "pc", [24.5, 27.5, 30.5, 33.5], 19.5, ["aisle_pc_01", "aisle_pc_02", "corredor_pcs_fila_1", "aisle_pc_04"]),
  ...linha([5, 6, 7, 8], "pc", [24.5, 27.5, 30.5, 33.5], 26.5, ["aisle_pc_05", "aisle_pc_06", "corredor_pcs_fila_2", "aisle_pc_08"]),
  ...linha([9, 10, 11, 12], "pc", [24.5, 27.5, 30.5, 33.5], 33.5, ["aisle_pc_09", "aisle_pc_10", "corredor_pcs_fila_3", "aisle_pc_12"]),
  // VIP: 2 fileiras de 3
  ...linha([13, 14, 15], "vip", [69.5, 73.5, 77.5], 19.5, ["aisle_vip_13", "corredor_vip_1", "aisle_vip_15"]),
  ...linha([16, 17, 18], "vip", [69.5, 73.5, 77.5], 26.5, ["aisle_vip_16", "corredor_vip_2", "aisle_vip_18"]),
  // Deck gamer (lado leste do salão): 2 fileiras de 3
  ...linha([19, 20, 21], "deck", [45.5, 49.5, 53.5], 19.5, ["deck_aisle_19", "deck_aisle_20", "deck_aisle_21"]),
  ...linha([22, 23, 24], "deck", [45.5, 49.5, 53.5], 26.5, ["deck_aisle_22", "deck_aisle_23", "deck_aisle_24"])
];
var A = (id, x, y, etiqueta) => ({ id, x, y, etiqueta });
var ANCORAS = [
  // --- calçada (trilho y = 54)
  A("calcada_extremo_esq", 8, 54, "Esquina Oeste"),
  A("calcada_banco_esq", 22, 54, "Banco da Cal\xE7ada"),
  A("calcada_vitrine_esq", 34, 54, "Vitrine Gamer"),
  A("porta_principal_fora", 40, 54),
  A("calcada_vitrine_dir", 46, 54),
  A("calcada_banco_dir", 56, 54),
  A("calcada_foodtruck", 70, 54, "Food Truck"),
  A("calcada_extremo_dir", 82, 54),
  // --- recepção
  A("porta_principal", 40, 52),
  A("porta_principal_dentro", 40, 51),
  A("recepcao_hall_interno", 40, 49.5),
  A("recepcao_fila_1", 29, 49.5),
  A("recepcao_fila_2", 33, 49.5),
  A("recepcao_geladeira_sul", 57, 49.5),
  A("recepcao_geladeira", 57, 47),
  A("porta_recepcao_leste", 60, 47),
  A("porta_recepcao", 40, 45),
  A("recepcao_porta_interna", 40, 46),
  A("recepcao_acesso_balcao", 36, 46),
  A("recepcao_balcao_dir", 32, 46),
  A("recepcao_balcao_centro", 28, 46),
  A("recepcao_balcao_esq", 24, 46),
  // --- salão: espinha central (x = 40) e trilhos de ilha
  A("corredor_central_norte", 40, 17),
  A("porta_servico_salao", 40, 15),
  A("corredor_central_1", 40, 21),
  A("corredor_central_2", 40, 28),
  A("corredor_central_3", 40, 35),
  A("corredor_central_sul", 40, 43.5),
  A("corredor_oeste_1", 22, 21),
  A("corredor_oeste_2", 22, 28),
  A("corredor_oeste_3", 22, 35),
  A("aisle_pc_01", 24.5, 21),
  A("aisle_pc_02", 27.5, 21),
  A("corredor_pcs_fila_1", 30.5, 21),
  A("aisle_pc_04", 33.5, 21),
  A("aisle_pc_05", 24.5, 28),
  A("aisle_pc_06", 27.5, 28),
  A("corredor_pcs_fila_2", 30.5, 28),
  A("aisle_pc_08", 33.5, 28),
  A("aisle_pc_09", 24.5, 35),
  A("aisle_pc_10", 27.5, 35),
  A("corredor_pcs_fila_3", 30.5, 35),
  A("aisle_pc_12", 33.5, 35),
  A("deck_aisle_19", 45.5, 21),
  A("deck_aisle_20", 49.5, 21),
  A("deck_aisle_21", 53.5, 21),
  A("deck_aisle_22", 45.5, 28),
  A("deck_aisle_23", 49.5, 28),
  A("deck_aisle_24", 53.5, 28),
  A("salao_leste_1", 57.5, 21),
  A("salao_leste_2", 57.5, 28),
  A("salao_leste_3", 57.5, 35),
  A("deck_aisle_35a", 45.5, 35),
  A("deck_aisle_35b", 49.5, 35),
  A("porta_salao_leste", 60, 28),
  // --- corredor leste (x = 61.5)
  A("corredor_leste_quina", 61.5, 13.5),
  A("porta_corredor_servico", 61.5, 15),
  A("corredor_leste_norte", 61.5, 17),
  A("corredor_leste_vip", 61.5, 21),
  A("corredor_leste_meio", 61.5, 28),
  A("corredor_leste_sul_meio", 61.5, 35),
  A("corredor_leste_sul", 61.5, 41),
  A("corredor_leste_base", 61.5, 47),
  // --- VIP
  A("porta_vip", 63, 21),
  A("vip_hall_1", 66, 21),
  A("vip_hall_2", 66, 28),
  A("aisle_vip_13", 69.5, 21),
  A("corredor_vip_1", 73.5, 21),
  A("aisle_vip_15", 77.5, 21),
  A("aisle_vip_16", 69.5, 28),
  A("corredor_vip_2", 73.5, 28),
  A("aisle_vip_18", 77.5, 28),
  A("vip_leste", 81, 21),
  A("vip_leste_2", 81, 28),
  A("porta_sala_vip", 73.5, 33),
  // --- arena / consoles
  A("sala_vip_arcade", 73.5, 36),
  A("sala_vip_tv", 73.5, 41),
  A("porta_arena_esports", 63, 41),
  A("arena_hall", 66, 41),
  A("sala_vip_sofa", 66, 46),
  A("arena_esports_palco", 80, 41, "Arena E-Sports"),
  // --- serviço
  A("servico_estudio", 12, 13.5),
  A("servico_adm", 28, 13.5),
  A("servico_salao", 40, 13.5),
  A("servico_noc", 44.5, 13.5),
  A("servico_estoque", 60, 13.5),
  A("servico_wc_cliente", 72, 13.5),
  A("servico_wc_func", 80, 13.5),
  // --- estúdio
  A("porta_estudio", 12, 12),
  A("estudio_corredor", 12, 10.5),
  A("lounge_gameon", 8, 10.5),
  A("estudio_streamer", 12, 7.8),
  // --- adm
  A("porta_escritorio", 28, 12),
  A("escritorio_corredor", 28, 10.5),
  A("escritorio_mesa", 28, 8),
  // --- noc
  A("porta_sala_tecnica", 44.5, 12),
  A("tecnica_hall_esq", 40, 10),
  A("tecnica_hall", 44.5, 10),
  A("tecnica_hall_dir", 49, 10),
  A("tecnica_rack_1", 40, 8.2),
  A("tecnica_rack_2", 44.5, 8.2),
  A("tecnica_bancada", 49, 8.2),
  // --- estoque
  A("porta_estoque", 60, 12),
  A("estoque_caixas", 55, 10),
  A("estoque_prateleira_1", 60, 10),
  A("estoque_prateleira_2", 65, 10),
  // --- banheiros
  A("porta_wc_cliente", 72, 12),
  A("banheiro_cliente", 72, 9.5),
  A("porta_wc_func", 80, 12),
  A("banheiro_func", 80, 9.5),
  // --- bomboniere
  A("porta_cozinha", 12, 15),
  A("cozinha_hall", 12, 17.5),
  A("cozinha_geladeira", 7, 17.5),
  A("cozinha_balcao", 16.5, 17.5),
  A("cozinha_mesa_1", 7, 21),
  A("cozinha_corredor", 12, 21),
  A("cozinha_mesa_2", 16.5, 21),
  A("porta_bomboniere", 20, 21),
  A("cozinha_mesa_3", 12, 26),
  A("porta_bomb_lounge", 12, 31),
  // --- lounge
  A("lounge_hall", 12, 33),
  A("ala_oeste_lounge", 12, 35),
  A("porta_ala_oeste", 20, 35),
  A("lounge_leste", 17, 35),
  A("lounge_sofa", 12, 40),
  A("lounge_arcade", 12, 45)
];
var SOLIDOS_FIXOS = [
  { x: 22, y: 47, w: 15, h: 1.4 },
  // balcão da recepção
  { x: 9.5, y: 5.6, w: 5, h: 1.1 },
  // mesa do streamer
  { x: 26, y: 5.2, w: 5, h: 1.5 },
  // mesa executiva ADM
  { x: 84, y: 4, w: 10, h: 48 }
  // zona de expansão
];

// src/world/collision.ts
function chave(o, linha2, idx) {
  return `${o}:${linha2}:${idx}`;
}
function construirParedes() {
  const paredes = /* @__PURE__ */ new Set();
  SALAS.forEach((s) => {
    const x1 = Math.round(s.x * 2);
    const x2 = Math.round((s.x + s.w) * 2);
    const y1 = Math.round(s.y * 2);
    const y2 = Math.round((s.y + s.h) * 2);
    for (let i = x1; i < x2; i++) {
      paredes.add(chave("H", y1, i));
      paredes.add(chave("H", y2, i));
    }
    for (let i = y1; i < y2; i++) {
      paredes.add(chave("V", x1, i));
      paredes.add(chave("V", x2, i));
    }
  });
  PORTAS.forEach((p) => {
    const meia = p.largura / 2;
    if (p.orientacao === "H") {
      const linha2 = Math.round(p.y * 2);
      const a = Math.round((p.x - meia) * 2);
      const b = Math.round((p.x + meia) * 2);
      for (let i = a; i < b; i++) paredes.delete(chave("H", linha2, i));
    } else {
      const linha2 = Math.round(p.x * 2);
      const a = Math.round((p.y - meia) * 2);
      const b = Math.round((p.y + meia) * 2);
      for (let i = a; i < b; i++) paredes.delete(chave("V", linha2, i));
    }
  });
  return paredes;
}
var PAREDES = construirParedes();
function construirGrade() {
  const grade = new Uint8Array(COLLISION_COLS * COLLISION_ROWS);
  const bloquear = (col, row) => {
    if (col < 0 || row < 0 || col >= COLLISION_COLS || row >= COLLISION_ROWS) return;
    grade[row * COLLISION_COLS + col] = 1;
  };
  PAREDES.forEach((k) => {
    const [o, linha2, idx] = k.split(":");
    const l = Number(linha2);
    const i = Number(idx);
    if (o === "H") bloquear(i, l);
    else bloquear(l, i);
  });
  const s\u00F3lido = (x, y, w, h) => {
    const c1 = Math.floor(x * 2);
    const c2 = Math.ceil((x + w) * 2);
    const r1 = Math.floor(y * 2);
    const r2 = Math.ceil((y + h) * 2);
    for (let r = r1; r < r2; r++) for (let c = c1; c < c2; c++) bloquear(c, r);
  };
  SOLIDOS_FIXOS.forEach((s) => s\u00F3lido(s.x, s.y, s.w, s.h));
  SLOTS_PC.forEach((p) => s\u00F3lido(p.x - 0.6, p.y - 1.1, 1.3, 0.75));
  return grade;
}
var COLISAO = construirGrade();
function celulaBloqueada(col, row) {
  if (col < 0 || row < 0 || col >= COLLISION_COLS || row >= COLLISION_ROWS) return true;
  return COLISAO[row * COLLISION_COLS + col] === 1;
}
function ehCaminhavel(px, py) {
  return !celulaBloqueada(Math.floor(px / COLLISION_CELL), Math.floor(py / COLLISION_CELL));
}
function temLinhaDeVisao(x1, y1, x2, y2) {
  const dist = Math.hypot(x2 - x1, y2 - y1);
  const passos = Math.max(1, Math.ceil(dist / (TILE_SIZE / 4)));
  for (let i = 0; i <= passos; i++) {
    const t = i / passos;
    if (!ehCaminhavel(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t)) return false;
  }
  return true;
}

// src/world/graph.ts
function construirGrafo() {
  const nos = {};
  ANCORAS.forEach((a) => {
    if (nos[a.id]) throw new Error(`\xC2ncora duplicada: ${a.id}`);
    nos[a.id] = {
      id: a.id,
      x: Math.round(a.x * TILE_SIZE),
      y: Math.round(a.y * TILE_SIZE),
      vizinhos: [],
      etiqueta: a.etiqueta
    };
  });
  const ligar = (a, b) => {
    if (a === b) return;
    if (!nos[a].vizinhos.includes(b)) nos[a].vizinhos.push(b);
    if (!nos[b].vizinhos.includes(a)) nos[b].vizinhos.push(a);
  };
  const lista = Object.values(nos);
  lista.forEach((n) => {
    const dirs = [
      { ok: (o) => o.y === n.y && o.x > n.x, dist: (o) => o.x - n.x },
      { ok: (o) => o.y === n.y && o.x < n.x, dist: (o) => n.x - o.x },
      { ok: (o) => o.x === n.x && o.y > n.y, dist: (o) => o.y - n.y },
      { ok: (o) => o.x === n.x && o.y < n.y, dist: (o) => n.y - o.y }
    ];
    dirs.forEach((d) => {
      const candidatos = lista.filter((o) => o !== n && d.ok(o)).sort((p, q) => d.dist(p) - d.dist(q));
      const alvo = candidatos[0];
      if (alvo && temLinhaDeVisao(n.x, n.y, alvo.x, alvo.y)) ligar(n.id, alvo.id);
    });
  });
  SLOTS_PC.forEach((p) => {
    if (nos[p.nodoAssento]) throw new Error(`Assento duplicado: ${p.nodoAssento}`);
    if (!nos[p.corredor]) throw new Error(`Corredor inexistente para ${p.nodoAssento}: ${p.corredor}`);
    nos[p.nodoAssento] = {
      id: p.nodoAssento,
      x: Math.round(p.x * TILE_SIZE),
      y: Math.round(p.y * TILE_SIZE),
      vizinhos: []
    };
    ligar(p.nodoAssento, p.corredor);
  });
  return nos;
}

// src/domain/WaypointGraph.ts
var WAYPOINT_NODES = construirGrafo();
function nodoAssentoDoPc(numeroPc) {
  if (numeroPc >= 1 && numeroPc <= 12) {
    return `pc_${String(numeroPc).padStart(2, "0")}_seat`;
  }
  if (numeroPc >= 13 && numeroPc <= 18) {
    return `vip_${String(numeroPc).padStart(2, "0")}_seat`;
  }
  if (numeroPc >= 19 && numeroPc <= 24) {
    return `deck_${String(numeroPc).padStart(2, "0")}_seat`;
  }
  return "pc_01_seat";
}
function calcularCaminhoNoGrafo(origemId, destinoId) {
  if (origemId === destinoId) return [];
  if (!WAYPOINT_NODES[origemId] || !WAYPOINT_NODES[destinoId]) return [destinoId];
  const fila2 = [[origemId]];
  const visitados = /* @__PURE__ */ new Set([origemId]);
  while (fila2.length > 0) {
    const caminho = fila2.shift();
    const atual = caminho[caminho.length - 1];
    if (atual === destinoId) {
      return caminho.slice(1);
    }
    const nodo = WAYPOINT_NODES[atual];
    if (!nodo) continue;
    for (const viz of nodo.vizinhos) {
      if (!visitados.has(viz)) {
        visitados.add(viz);
        fila2.push([...caminho, viz]);
      }
    }
  }
  return [destinoId];
}
var CORES_ROUPA_BOT = [
  "#2563eb",
  "#e11d48",
  "#059669",
  "#7c3aed",
  "#d97706",
  "#0284c7",
  "#db2777",
  "#4f46e5",
  "#0d9488",
  "#ea580c"
];
var CORES_CABELO_BOT = ["#7c2d12", "#1e293b", "#92400e", "#7f1d1d", "#3b0764", "#3f3f46"];
var DIALOGOS_CONVERSA_CURTOS = [
  ['"Bora CS2?"', '"Fechou, PC 8!"'],
  ['"Ping t\xE1 1ms!"', '"Fibra braba!"'],
  ['"Viu o VIP?"', '"RTX 4090 lisa!"'],
  ['"Pede pizza?"', '"Com energ\xE9tico!"'],
  ['"Vai no camp?"', '"Time fechado!"'],
  ['"144Hz ou 360?"', '"360Hz no VIP!"'],
  ['"Bora FIFA?"', '"No PS5 agora!"'],
  ['"Combo Burger?"', '"Bora no Truck!"']
];
var SimuladorBotsMapa = class {
  bots = /* @__PURE__ */ new Map();
  globalTick = 0;
  criarOuAtualizarBot(id, nome, papel, ehCliente, nodoInicial, corRoupa, corCabelo, temFone = false) {
    const existente = this.bots.get(id);
    if (existente) {
      existente.nome = nome;
      existente.papel = papel;
      return existente;
    }
    const coords = WAYPOINT_NODES[nodoInicial] || WAYPOINT_NODES.corredor_central_1;
    const novo = {
      id,
      nome,
      papel,
      ehCliente,
      x: coords.x,
      y: coords.y,
      nodoAtualId: nodoInicial,
      filaRota: [],
      direcao: "DOWN",
      pose: "IDLE",
      acaoTexto: "No local",
      falaCurta: "\u2728",
      mostrarBalao: false,
      timerEsperaFrames: 20,
      timerConversaFrames: 0,
      cooldownConversaFrames: 90,
      etapaRotina: 0,
      corRoupa,
      corCabelo,
      temFone
    };
    this.bots.set(id, novo);
    return novo;
  }
  enviarParaDestino(bot, nodoDestinoId) {
    if (bot.nodoAtualId === nodoDestinoId && bot.filaRota.length === 0) return;
    bot.filaRota = calcularCaminhoNoGrafo(bot.nodoAtualId, nodoDestinoId);
  }
  avancarMovimentoFisico(bot, velocidadeBase) {
    const velocidade = velocidadeBase * BOT_SPEED_SCALE;
    if (bot.timerConversaFrames > 0) {
      bot.timerConversaFrames--;
      bot.pose = "CHATTING";
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
      bot.direcao = dx >= 0 ? "RIGHT" : "LEFT";
    } else {
      bot.direcao = dy >= 0 ? "DOWN" : "UP";
    }
    if (bot.pose !== "CARRYING_BOX") {
      bot.pose = "WALK";
    }
    if (dist <= velocidade) {
      bot.x = alvo.x;
      bot.y = alvo.y;
      bot.nodoAtualId = proxId;
      bot.filaRota.shift();
      return bot.filaRota.length === 0;
    } else {
      bot.x += dx / dist * velocidade;
      bot.y += dy / dist * velocidade;
      return false;
    }
  }
  // Detecta bots próximos na calçada ou nos corredores para pararem e baterem papo!
  processarEncontrosSociais(listaBots) {
    for (let i = 0; i < listaBots.length; i++) {
      const a = listaBots[i];
      if (a.pose === "SITTING_PC" || a.pose === "WORKING_TOOL" || a.pose === "CARRYING_BOX" || a.timerConversaFrames > 0 || a.cooldownConversaFrames > 0 || a.id === "staff_recepcao") {
        continue;
      }
      for (let j = i + 1; j < listaBots.length; j++) {
        const b = listaBots[j];
        if (b.pose === "SITTING_PC" || b.pose === "WORKING_TOOL" || b.pose === "CARRYING_BOX" || b.timerConversaFrames > 0 || b.cooldownConversaFrames > 0 || b.id === "staff_recepcao") {
          continue;
        }
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const dist = Math.hypot(dx, dy);
        if (dist >= 14 && dist <= 36 && Math.abs(dy) <= 18) {
          if ((this.globalTick + i * 7 + j * 13) % 5 === 0) {
            const parDialogo = DIALOGOS_CONVERSA_CURTOS[(this.globalTick + i + j) % DIALOGOS_CONVERSA_CURTOS.length];
            a.timerConversaFrames = 150;
            b.timerConversaFrames = 150;
            a.cooldownConversaFrames = 520;
            b.cooldownConversaFrames = 520;
            a.direcao = dx >= 0 ? "RIGHT" : "LEFT";
            b.direcao = dx >= 0 ? "LEFT" : "RIGHT";
            a.iconeCabeca = "\u{1F4AC}";
            b.iconeCabeca = "\u{1F4AC}";
            a.falaCurta = parDialogo[0];
            b.falaCurta = parDialogo[1];
            a.acaoTexto = `Conversando com ${b.nome}: ${parDialogo[0]}`;
            b.acaoTexto = `Respondendo ${a.nome}: ${parDialogo[1]}`;
            break;
          }
        }
      }
    }
  }
  atualizarFrame(computadores, sessoesAtivas, funcionarios) {
    this.globalTick++;
    const idsAtivosNesteFrame = /* @__PURE__ */ new Set();
    const ativos = funcionarios.filter((f) => f.trabalhandoAgora);
    let contRecepcao = 0;
    ativos.forEach((func) => {
      const id = `staff_func_${func.id}`;
      idsAtivosNesteFrame.add(id);
      const primeiroNome = func.nome.split(" ")[0];
      if (func.cargo === "ADMINISTRADOR") {
        const bot = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          "Gerente Geral",
          false,
          "escritorio_mesa",
          "#1e293b",
          "#5c361b",
          false
        );
        bot.uniforme = "GERENTE";
        const chegou = this.avancarMovimentoFisico(bot, 1.28);
        if (chegou && bot.timerConversaFrames === 0) {
          bot.pose = "WORKING_TOOL";
          bot.ferramenta = "TABLET_EXEC";
          bot.direcao = "DOWN";
          bot.mostrarBalao = true;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
          } else {
            const rotaGerente = [
              { nodo: "escritorio_mesa", curto: "Gest\xE3o POO", txt: "Auditando Caixa e Relat\xF3rios (RF10)", icone: "\u{1F4CA}" },
              { nodo: "estudio_streamer", curto: "Live Game On", txt: "Supervisionando Est\xFAdio de Podcast", icone: "\u{1F399}\uFE0F" },
              { nodo: "recepcao_balcao_dir", curto: "Checando PIX", txt: "Conferindo Pagamentos no Balc\xE3o (RN09)", icone: "\u{1F4BC}" },
              { nodo: "corredor_vip_1", curto: "Vistoria VIP", txt: "Inspecionando Arena VIP Championship", icone: "\u2B50" },
              { nodo: "arena_esports_palco", curto: "Palco Torneio", txt: "Organizando Campeonato no Palco E-Sports", icone: "\u{1F3C6}" }
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
          bot.ferramenta = "TABLET_EXEC";
          bot.mostrarBalao = false;
        }
        return;
      }
      if (func.cargo === "DESENVOLVEDOR") {
        const bot = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          "Dev Sistemas",
          false,
          "tecnica_rack_2",
          "#7e22ce",
          "#1e293b",
          true
        );
        bot.uniforme = "DEV";
        const chegou = this.avancarMovimentoFisico(bot, 1.35);
        if (chegou && bot.timerConversaFrames === 0) {
          bot.pose = "WORKING_TOOL";
          bot.ferramenta = "LAPTOP_DEV";
          bot.direcao = "UP";
          bot.mostrarBalao = true;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
          } else {
            const rotaDev = [
              { nodo: "tecnica_rack_2", curto: "Java Server", txt: "Otimizando Backend Java POO no Rack", icone: "\u{1F4BB}" },
              { nodo: "escritorio_mesa", curto: "Deploy API", txt: "Compilando Atualiza\xE7\xE3o do Sistema", icone: "\u26A1" },
              { nodo: "estudio_streamer", curto: "OBS Stream", txt: "Configurando Bitrate da Transmiss\xE3o", icone: "\u{1F4E1}" }
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
          bot.ferramenta = "LAPTOP_DEV";
          bot.mostrarBalao = false;
        }
        return;
      }
      if (func.cargo === "SUPORTE_TECNICO") {
        const bot = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          "T\xE9cnico TI",
          false,
          "tecnica_bancada",
          "#0284c7",
          "#1e293b",
          true
        );
        bot.uniforme = "TECNICO";
        const pcEmManutencao = computadores.find((c) => c.status === "MANUTENCAO");
        const chegou = this.avancarMovimentoFisico(bot, 1.6);
        if (pcEmManutencao) {
          const nodoPc = nodoAssentoDoPc(pcEmManutencao.numero);
          if (bot.nodoAtualId !== nodoPc && bot.filaRota.length === 0) {
            this.enviarParaDestino(bot, nodoPc);
            bot.ferramenta = "CHAVE_SOLDA";
            bot.falaCurta = `Indo ${pcEmManutencao.identificacao}`;
            bot.acaoTexto = `Levando maleta de ferramentas ao ${pcEmManutencao.identificacao}`;
            bot.iconeCabeca = "\u{1F527}";
            bot.mostrarBalao = true;
          } else if (chegou && bot.nodoAtualId === nodoPc) {
            bot.pose = "WORKING_TOOL";
            bot.ferramenta = "CHAVE_SOLDA";
            bot.direcao = "UP";
            bot.falaCurta = `Reparo ${pcEmManutencao.identificacao}`;
            bot.acaoTexto = `Soldando e trocando pasta t\xE9rmica do ${pcEmManutencao.identificacao}`;
            bot.iconeCabeca = "\u{1F527}";
            bot.mostrarBalao = true;
          }
        } else if (chegou) {
          bot.mostrarBalao = true;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
            bot.pose = "WORKING_TOOL";
            bot.ferramenta = bot.nodoAtualId === "escritorio_mesa" ? "PRANCHETA" : "CHAVE_SOLDA";
            bot.direcao = "UP";
          } else {
            bot.etapaRotina = (bot.etapaRotina + 1) % 4;
            if (bot.etapaRotina === 0) {
              this.enviarParaDestino(bot, "tecnica_rack_1");
              bot.falaCurta = "Ping 1ms OK";
              bot.acaoTexto = "Crimpando cabos nos Racks Fibra \xD3ptica";
              bot.iconeCabeca = "\u{1F5A7}";
              bot.timerEsperaFrames = 175;
            } else if (bot.etapaRotina === 1) {
              this.enviarParaDestino(bot, "tecnica_bancada");
              bot.falaCurta = "Soldando GPU";
              bot.acaoTexto = "Testando Placa de V\xEDdeo com Ferro de Solda";
              bot.iconeCabeca = "\u{1F527}";
              bot.timerEsperaFrames = 210;
            } else if (bot.etapaRotina === 2) {
              this.enviarParaDestino(bot, "corredor_vip_2");
              bot.falaCurta = "Coolers VIP";
              bot.acaoTexto = "Calibrando WaterCooler da Arena VIP";
              bot.iconeCabeca = "\u2744\uFE0F";
              bot.timerEsperaFrames = 145;
            } else {
              this.enviarParaDestino(bot, "escritorio_mesa");
              bot.falaCurta = "Laudo TI";
              bot.acaoTexto = "Assinando Laudo T\xE9cnico no Escrit\xF3rio";
              bot.iconeCabeca = "\u{1F4CB}";
              bot.timerEsperaFrames = 150;
            }
          }
        } else {
          bot.ferramenta = "CHAVE_SOLDA";
          bot.mostrarBalao = false;
        }
        return;
      }
      if (func.cargo === "LIMPEZA") {
        const bot = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          "Zeladoria",
          false,
          "corredor_central_2",
          "#059669",
          "#7f1d1d",
          false
        );
        bot.uniforme = "LIMPEZA";
        const chegou = this.avancarMovimentoFisico(bot, 1.35);
        if (chegou && bot.timerConversaFrames === 0) {
          bot.pose = "CLEANING";
          bot.ferramenta = "VASSOURA";
          bot.direcao = "DOWN";
          bot.mostrarBalao = true;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
          } else {
            const pontosLimpeza = [
              { nodo: "corredor_pcs_fila_3", curto: "Varrendo Arena", txt: "Varrendo Corredor da Arena Gamer" },
              { nodo: "estudio_streamer", curto: "Limpando Est\xFAdio", txt: "Higienizando Est\xFAdio GAME ON" },
              { nodo: "corredor_central_norte", curto: "Polindo Hall", txt: "Lustrando Piso da Recep\xE7\xE3o" },
              { nodo: "ala_oeste_lounge", curto: "Varrendo Deck", txt: "Varrendo Deck Cyber Lounge Oeste" },
              { nodo: "sala_vip_sofa", curto: "Arrumando VIP", txt: "Organizando Lounge de Consoles" }
            ];
            bot.etapaRotina = (bot.etapaRotina + 1) % pontosLimpeza.length;
            const alvo = pontosLimpeza[bot.etapaRotina];
            this.enviarParaDestino(bot, alvo.nodo);
            bot.falaCurta = alvo.curto;
            bot.acaoTexto = alvo.txt;
            bot.iconeCabeca = "\u{1F9F9}";
            bot.timerEsperaFrames = 185;
          }
        } else if (bot.timerConversaFrames === 0) {
          bot.ferramenta = "VASSOURA";
          bot.mostrarBalao = false;
        }
        return;
      }
      const slotRecep = contRecepcao++;
      if (slotRecep === 0) {
        const bot = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          "Recep\xE7\xE3o",
          false,
          "recepcao_balcao_centro",
          "#2563eb",
          "#92400e",
          true
        );
        bot.uniforme = "RECEPCAO";
        const chegou = this.avancarMovimentoFisico(bot, 1.15);
        if (chegou) {
          bot.pose = "WORKING_TOOL";
          bot.ferramenta = "PRANCHETA";
          bot.direcao = "DOWN";
          bot.mostrarBalao = true;
          if (bot.timerEsperaFrames > 0) {
            bot.timerEsperaFrames--;
          } else {
            bot.etapaRotina = (bot.etapaRotina + 1) % 3;
            if (bot.etapaRotina === 0) {
              this.enviarParaDestino(bot, "recepcao_balcao_esq");
              bot.falaCurta = "Check-in";
              bot.acaoTexto = "Cadastrando Check-in na Prancheta";
              bot.iconeCabeca = "\u{1F4CB}";
              bot.timerEsperaFrames = 180;
            } else if (bot.etapaRotina === 1) {
              this.enviarParaDestino(bot, "recepcao_balcao_centro");
              bot.falaCurta = "Caixa PIX";
              bot.acaoTexto = "Confirmando Pagamento PIX (RF08)";
              bot.iconeCabeca = "\u{1F4B8}";
              bot.timerEsperaFrames = 210;
            } else {
              this.enviarParaDestino(bot, "recepcao_balcao_dir");
              bot.falaCurta = "Liberando PC";
              bot.acaoTexto = "Liberando Sess\xE3o no Terminal";
              bot.iconeCabeca = "\u{1F5A5}\uFE0F";
              bot.timerEsperaFrames = 170;
            }
          }
        } else {
          bot.ferramenta = "PRANCHETA";
        }
      } else if (slotRecep === 1) {
        const botEstoque = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          "Estoque",
          false,
          "estoque_prateleira_1",
          "#d97706",
          "#3f3f46",
          false
        );
        botEstoque.uniforme = "ESTOQUE";
        const chegou = this.avancarMovimentoFisico(botEstoque, 1.45);
        botEstoque.mostrarBalao = botEstoque.pose === "CARRYING_BOX" || chegou;
        if (chegou && botEstoque.timerConversaFrames === 0) {
          if (botEstoque.timerEsperaFrames > 0) {
            botEstoque.timerEsperaFrames--;
            if (botEstoque.nodoAtualId === "estoque_caixas" || botEstoque.nodoAtualId === "cozinha_geladeira" || botEstoque.nodoAtualId === "recepcao_geladeira") {
              botEstoque.pose = "CARRYING_BOX";
              botEstoque.ferramenta = "CAIXA";
            } else {
              botEstoque.pose = "WORKING_TOOL";
              botEstoque.ferramenta = "PRANCHETA";
            }
          } else {
            botEstoque.etapaRotina = (botEstoque.etapaRotina + 1) % 4;
            if (botEstoque.etapaRotina === 0) {
              botEstoque.pose = "WALK";
              botEstoque.ferramenta = "PRANCHETA";
              this.enviarParaDestino(botEstoque, "estoque_caixas");
              botEstoque.falaCurta = "Separando";
              botEstoque.acaoTexto = "Separando Caixas no Almoxarifado";
              botEstoque.iconeCabeca = "\u{1F4CB}";
              botEstoque.timerEsperaFrames = 140;
            } else if (botEstoque.etapaRotina === 1) {
              botEstoque.pose = "CARRYING_BOX";
              botEstoque.ferramenta = "CAIXA";
              this.enviarParaDestino(botEstoque, "cozinha_geladeira");
              botEstoque.falaCurta = "Repondo Caf\xE9";
              botEstoque.acaoTexto = "Carregando Fardos para a Lanchonete";
              botEstoque.iconeCabeca = "\u{1F4E6}";
              botEstoque.timerEsperaFrames = 160;
            } else if (botEstoque.etapaRotina === 2) {
              botEstoque.pose = "CARRYING_BOX";
              botEstoque.ferramenta = "CAIXA";
              this.enviarParaDestino(botEstoque, "recepcao_geladeira");
              botEstoque.falaCurta = "Repondo Refri";
              botEstoque.acaoTexto = "Abastecendo Geladeiras da Recep\xE7\xE3o";
              botEstoque.iconeCabeca = "\u{1F9C3}";
              botEstoque.timerEsperaFrames = 150;
            } else {
              botEstoque.pose = "WORKING_TOOL";
              botEstoque.ferramenta = "PRANCHETA";
              this.enviarParaDestino(botEstoque, "estoque_prateleira_2");
              botEstoque.falaCurta = "Invent\xE1rio";
              botEstoque.acaoTexto = "Bipando Estoque de Hardware na Prancheta";
              botEstoque.iconeCabeca = "\u{1F4E6}";
              botEstoque.timerEsperaFrames = 170;
            }
          }
        }
      } else {
        const botCozinha = this.criarOuAtualizarBot(
          id,
          primeiroNome,
          "Lanchonete",
          false,
          "cozinha_balcao",
          "#e11d48",
          "#7c2d12",
          false
        );
        botCozinha.uniforme = "LANCHONETE";
        const chegou = this.avancarMovimentoFisico(botCozinha, 1.3);
        if (chegou && botCozinha.timerConversaFrames === 0) {
          botCozinha.pose = "WORKING_TOOL";
          botCozinha.ferramenta = "BANDEJA_LANCHE";
          botCozinha.direcao = "DOWN";
          botCozinha.mostrarBalao = true;
          if (botCozinha.timerEsperaFrames > 0) {
            botCozinha.timerEsperaFrames--;
          } else {
            botCozinha.etapaRotina = (botCozinha.etapaRotina + 1) % 4;
            if (botCozinha.etapaRotina === 0) {
              this.enviarParaDestino(botCozinha, "cozinha_balcao");
              botCozinha.falaCurta = "Assando Pizza";
              botCozinha.acaoTexto = "Preparando Pizza & Caf\xE9 Expresso na Bandeja";
              botCozinha.iconeCabeca = "\u{1F355}";
              botCozinha.timerEsperaFrames = 190;
            } else if (botCozinha.etapaRotina === 1) {
              this.enviarParaDestino(botCozinha, "cozinha_geladeira");
              botCozinha.falaCurta = "Cup Noodles";
              botCozinha.acaoTexto = "Preparando Ramen Quente & Energ\xE9ticos";
              botCozinha.iconeCabeca = "\u{1F35C}";
              botCozinha.timerEsperaFrames = 150;
            } else if (botCozinha.etapaRotina === 2) {
              this.enviarParaDestino(botCozinha, "cozinha_mesa_3");
              botCozinha.falaCurta = "Servindo Mesa";
              botCozinha.acaoTexto = "Servindo Bandeja com Lanche na Mesa";
              botCozinha.iconeCabeca = "\u2615";
              botCozinha.timerEsperaFrames = 145;
            } else {
              this.enviarParaDestino(botCozinha, "ala_oeste_lounge");
              botCozinha.falaCurta = "Entrega Deck";
              botCozinha.acaoTexto = "Levando Bandeja de Caf\xE9 ao Cyber Deck";
              botCozinha.iconeCabeca = "\u{1F964}";
              botCozinha.timerEsperaFrames = 155;
            }
          }
        } else {
          botCozinha.ferramenta = "BANDEJA_LANCHE";
          botCozinha.mostrarBalao = false;
        }
      }
    });
    const jogosCurto = ["CS2", "Valorant", "LoL", "GTA RP", "EA FC", "Dota 2", "Fortnite", "Warzone", "Apex"];
    const sessoesEmAndamento = sessoesAtivas.filter((s) => s.status === "ATIVA");
    sessoesEmAndamento.forEach((sessao, idx) => {
      const id = `cliente_sessao_${sessao.clienteId}`;
      idsAtivosNesteFrame.add(id);
      const nodoAssento = nodoAssentoDoPc(sessao.computadorNumero);
      const primeiroNome = sessao.clienteNome.split(" ")[0];
      const bot = this.criarOuAtualizarBot(
        id,
        primeiroNome,
        "Cliente PC",
        true,
        "recepcao_fila_1",
        CORES_ROUPA_BOT[sessao.clienteId % CORES_ROUPA_BOT.length],
        CORES_CABELO_BOT[idx % CORES_CABELO_BOT.length],
        true
      );
      if (bot.nodoAtualId !== nodoAssento && bot.filaRota.length === 0) {
        this.enviarParaDestino(bot, nodoAssento);
        bot.falaCurta = `Indo PC-${String(sessao.computadorNumero).padStart(2, "0")}`;
        bot.acaoTexto = `Caminhando at\xE9 o PC-${String(sessao.computadorNumero).padStart(2, "0")}`;
        bot.iconeCabeca = "\u{1F3AE}";
        bot.mostrarBalao = true;
      }
      const chegou = this.avancarMovimentoFisico(bot, 1.7);
      if (chegou && bot.nodoAtualId === nodoAssento) {
        bot.pose = "SITTING_PC";
        bot.direcao = "UP";
        const jogo = jogosCurto[sessao.computadorNumero % jogosCurto.length];
        bot.falaCurta = jogo;
        bot.acaoTexto = `Jogando ${jogo} no PC-${String(sessao.computadorNumero).padStart(2, "0")}`;
        bot.iconeCabeca = "\u{1F3A7}";
        bot.mostrarBalao = (Math.floor(this.globalTick / 120) + idx) % 2 === 0;
      }
    });
    const botsCirculantes = [
      {
        id: "visitante_1",
        nome: "Pedro",
        corRoupa: "#7c3aed",
        corCabelo: "#1e293b",
        roteiro: [
          { nodo: "calcada_banco_esq", curto: "Olhando Rua", acao: "Descansando no banco da cal\xE7ada", icone: "\u2600\uFE0F", pose: "IDLE", dir: "DOWN", tempo: 110 },
          { nodo: "recepcao_fila_1", curto: "Check-in", acao: "Pedindo ficha na Recep\xE7\xE3o", icone: "\u{1F4AC}", pose: "IDLE", dir: "UP", tempo: 150 },
          { nodo: "ala_oeste_lounge", curto: "Cyber Deck", acao: "Relaxando no Deck Cyber Lounge 32x32", icone: "\u{1F964}", pose: "EATING", dir: "UP", tempo: 180 },
          { nodo: "cozinha_mesa_1", curto: "Cup Noodles", acao: "Comendo Ramen & Pizza na Lanchonete", icone: "\u{1F35C}", pose: "EATING", dir: "UP", tempo: 220 },
          { nodo: "sala_vip_sofa", curto: "Jogando PS5", acao: "Jogando FIFA no Lounge VIP", icone: "\u{1F3AE}", pose: "IDLE", dir: "UP", tempo: 240 },
          { nodo: "recepcao_fila_2", curto: "Totem PIX", acao: "Pagando no Totem Auto-Atendimento PIX", icone: "\u{1F4B8}", pose: "IDLE", dir: "UP", tempo: 140 },
          { nodo: "calcada_foodtruck", curto: "Byte Burger", acao: "Comprando lanche no Food Truck", icone: "\u{1F354}", pose: "EATING", dir: "UP", tempo: 160 }
        ]
      },
      {
        id: "visitante_2",
        nome: "Thiago",
        corRoupa: "#0d9488",
        corCabelo: "#7c2d12",
        roteiro: [
          { nodo: "calcada_extremo_dir", curto: "Passeando", acao: "Caminhando pela cal\xE7ada leste", icone: "\u{1F6B6}", pose: "IDLE", dir: "LEFT", tempo: 60 },
          { nodo: "calcada_vitrine_dir", curto: "Vendo Vitrine", acao: "Olhando os PCs VIP pela vitrine", icone: "\u{1F440}", pose: "IDLE", dir: "UP", tempo: 140 },
          { nodo: "estudio_streamer", curto: "Live Podcast", acao: "Gravando participa\xE7\xE3o no Est\xFAdio GAME ON", icone: "\u{1F399}\uFE0F", pose: "IDLE", dir: "UP", tempo: 210 },
          { nodo: "arena_esports_palco", curto: "Final Torneio", acao: "Assistindo Final no Palco E-Sports", icone: "\u{1F3C6}", pose: "IDLE", dir: "UP", tempo: 210 },
          { nodo: "sala_vip_arcade", curto: "Street Fighter", acao: "Jogando Fliperama Arcade", icone: "\u{1F579}\uFE0F", pose: "IDLE", dir: "UP", tempo: 220 },
          { nodo: "cozinha_mesa_3", curto: "Caf\xE9 Gamer", acao: "Tomando Expresso na Lanchonete", icone: "\u2615", pose: "EATING", dir: "UP", tempo: 180 },
          { nodo: "calcada_extremo_esq", curto: "Indo embora", acao: "Indo pela cal\xE7ada oeste", icone: "\u2B50", pose: "IDLE", dir: "LEFT", tempo: 70 }
        ]
      },
      {
        id: "pedestre_calcada_1",
        nome: "Lucas",
        corRoupa: "#ea580c",
        corCabelo: "#1e293b",
        roteiro: [
          { nodo: "calcada_extremo_esq", curto: "Caminhando", acao: "Andando pela cal\xE7ada", icone: "\u{1F3A7}", pose: "IDLE", dir: "RIGHT", tempo: 50 },
          { nodo: "calcada_vitrine_esq", curto: '"Que Lan Top!"', acao: "Admirando a fachada neon da Lan House", icone: "\u{1F929}", pose: "IDLE", dir: "UP", tempo: 150 },
          { nodo: "calcada_foodtruck", curto: "Pedindo Burger", acao: "Pedindo Smash Burger no Food Truck", icone: "\u{1F354}", pose: "EATING", dir: "UP", tempo: 190 },
          { nodo: "calcada_banco_dir", curto: "Comendo", acao: "Lanchando na pra\xE7a leste", icone: "\u{1F35F}", pose: "EATING", dir: "DOWN", tempo: 160 },
          { nodo: "calcada_extremo_dir", curto: "Passeando", acao: "Seguindo pela rua", icone: "\u{1F6B6}", pose: "IDLE", dir: "LEFT", tempo: 60 }
        ]
      },
      {
        id: "pedestre_calcada_2",
        nome: "Bianca",
        corRoupa: "#db2777",
        corCabelo: "#3b0764",
        roteiro: [
          { nodo: "calcada_extremo_dir", curto: "Na Cal\xE7ada", acao: "Passeando \xE0 noite", icone: "\u2728", pose: "IDLE", dir: "LEFT", tempo: 55 },
          { nodo: "calcada_banco_dir", curto: "Vendo Celular", acao: "Mandando mensagem para o squad", icone: "\u{1F4F1}", pose: "IDLE", dir: "DOWN", tempo: 145 },
          { nodo: "porta_principal_fora", curto: "Entrando!", acao: "Decidindo entrar na Lan House", icone: "\u{1F3AE}", pose: "IDLE", dir: "UP", tempo: 100 },
          { nodo: "recepcao_geladeira", curto: "Monster Gelado", acao: "Pegando Energ\xE9tico na Recep\xE7\xE3o", icone: "\u{1F964}", pose: "IDLE", dir: "UP", tempo: 160 },
          { nodo: "calcada_banco_esq", curto: "Esperando Uber", acao: "Aguardando na cal\xE7ada oeste", icone: "\u{1F697}", pose: "IDLE", dir: "DOWN", tempo: 140 }
        ]
      },
      {
        id: "pedestre_calcada_3",
        nome: "Rodrigo",
        corRoupa: "#4f46e5",
        corCabelo: "#92400e",
        roteiro: [
          { nodo: "calcada_banco_esq", curto: "No Banco", acao: "Conversando na cal\xE7ada", icone: "\u{1F4AC}", pose: "IDLE", dir: "RIGHT", tempo: 120 },
          { nodo: "calcada_foodtruck", curto: "Fila do Truck", acao: "Comprando refrigerante no Truck", icone: "\u{1F964}", pose: "EATING", dir: "UP", tempo: 170 },
          { nodo: "calcada_vitrine_esq", curto: "Vendo Jogos", acao: "Olhando p\xF4steres de campeonato", icone: "\u{1F3C6}", pose: "IDLE", dir: "UP", tempo: 130 },
          { nodo: "calcada_extremo_dir", curto: "Caminhando", acao: "Andando pela cal\xE7ada", icone: "\u{1F6B6}", pose: "IDLE", dir: "LEFT", tempo: 60 }
        ]
      }
    ];
    botsCirculantes.forEach((v) => {
      idsAtivosNesteFrame.add(v.id);
      const bot = this.criarOuAtualizarBot(
        v.id,
        v.nome,
        "Visitante",
        true,
        v.roteiro[0].nodo,
        v.corRoupa,
        v.corCabelo,
        false
      );
      const chegou = this.avancarMovimentoFisico(bot, 1.38);
      const passoAtual = v.roteiro[bot.etapaRotina % v.roteiro.length];
      if (bot.timerConversaFrames > 0) {
        bot.mostrarBalao = true;
      } else if (chegou) {
        bot.pose = passoAtual.pose;
        bot.direcao = passoAtual.dir;
        bot.falaCurta = passoAtual.curto;
        bot.acaoTexto = passoAtual.acao;
        bot.iconeCabeca = passoAtual.icone;
        bot.mostrarBalao = true;
        if (bot.timerEsperaFrames > 0) {
          bot.timerEsperaFrames--;
        } else {
          const pulo = (this.globalTick + v.id.length) % 3 === 0 ? 2 : 1;
          bot.etapaRotina = (bot.etapaRotina + pulo) % v.roteiro.length;
          const proxPasso = v.roteiro[bot.etapaRotina];
          this.enviarParaDestino(bot, proxPasso.nodo);
          bot.falaCurta = proxPasso.curto;
          bot.acaoTexto = proxPasso.acao;
          bot.iconeCabeca = proxPasso.icone;
          bot.timerEsperaFrames = proxPasso.tempo;
        }
      } else {
        bot.mostrarBalao = false;
      }
    });
    for (const key of Array.from(this.bots.keys())) {
      if (!idsAtivosNesteFrame.has(key)) {
        this.bots.delete(key);
      }
    }
    const todos = Array.from(this.bots.values());
    this.processarEncontrosSociais(todos);
    return todos.sort((a, b) => a.y - b.y);
  }
};
var simuladorBotsMapa = new SimuladorBotsMapa();

// scripts/check-graph.ts
var import_fs = require("fs");
var ids = Object.keys(WAYPOINT_NODES);
console.log("nos:", ids.length);
var src = (0, import_fs.readFileSync)("src/domain/WaypointGraph.ts", "utf8");
var usados = /* @__PURE__ */ new Set();
for (const m of src.matchAll(/(?:enviarParaDestino\([a-zA-Z]+,\s*|nodo:\s*|'recepcao_[a-z_]+'|criarOuAtualizarBot\(\s*[^,]+,[^,]+,[^,]+,[^,]+,\s*)'([a-z_0-9]+)'/g)) usados.add(m[1]);
for (const m of src.matchAll(/nodo: '([a-z_0-9]+)'/g)) usados.add(m[1]);
for (const m of src.matchAll(/'((?:calcada|recepcao|tecnica|estoque|cozinha|corredor|sala|ala|lounge|escritorio|estudio|porta|arena)[a-z_0-9]*)'/g)) usados.add(m[1]);
var faltando = [...usados].filter((u) => !WAYPOINT_NODES[u]);
console.log("ids usados ausentes:", faltando);
var visit = /* @__PURE__ */ new Set(["porta_principal_fora"]);
var fila = ["porta_principal_fora"];
while (fila.length) {
  const a = fila.shift();
  for (const v of WAYPOINT_NODES[a].vizinhos) if (!visit.has(v)) {
    visit.add(v);
    fila.push(v);
  }
}
console.log("inalcancaveis:", ids.filter((i) => !visit.has(i)));
console.log("sem vizinhos:", ids.filter((i) => WAYPOINT_NODES[i].vizinhos.length === 0));
