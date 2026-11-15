/**
 * AUDITORIA: props visuais (world/detalhes.ts + TV/CFTV da fachada) x GRAFO REAL de navegação.
 * Rode no SEU projeto (precisa de world/graph.ts + collision.ts reais). Só leitura: não altera nada.
 *   npx tsx src/auditar_grafo_vs_detalhes.ts      (ou compile com o seu bundler)
 */
import { WAYPOINT_NODES } from './domain/WaypointGraph';
import { DETALHES } from './world/detalhes';

const TAM: Record<string, [number, number]> = {
  EXTINTOR: [10, 16], CAIXAS: [26, 20], PLACA: [14, 20], LIXEIRA: [14, 18], CABO_H: [96, 4], CABO_V: [4, 96],
};
interface Rc { id: string; x: number; y: number; w: number; h: number; chao: boolean }

const objetos: Rc[] = DETALHES.map((d, i) => ({
  id: `${d.tipo}#${i}@${d.x},${d.y}`, x: d.x, y: d.y, w: TAM[d.tipo][0] / 32, h: TAM[d.tipo][1] / 32,
  chao: d.tipo.startsWith('CABO'), // cabos são chão: andar por cima é aceitável
}));
objetos.push(
  { id: 'TV_torneio', x: 33.4, y: 52.7, w: 56 / 32, h: 36 / 32, chao: false },
  { id: 'CFTV_esq', x: 20.3, y: 52.45, w: 12 / 32, h: 10 / 32, chao: false },
  { id: 'CFTV_dir', x: 59.2, y: 52.45, w: 12 / 32, h: 10 / 32, chao: false },
);

const MARGEM = 0.35; // ~ raio do corpo do NPC em tiles
const dentro = (x: number, y: number, r: Rc, m: number) =>
  x >= r.x - m && x <= r.x + r.w + m && y >= r.y - m && y <= r.y + r.h + m;

const nos = Object.values(WAYPOINT_NODES);
const nosBloqueados: string[] = [];
const arestasQueCruzam: string[] = [];

nos.forEach((n) => objetos.forEach((o) => { if (!o.chao && dentro(n.x, n.y, o, 0)) nosBloqueados.push(`${n.id} DENTRO de ${o.id}`); }));

const vistas = new Set<string>();
nos.forEach((a) => a.vizinhos.forEach((idB) => {
  const b = WAYPOINT_NODES[idB]; if (!b) return;
  const chave = [a.id, b.id].sort().join('|'); if (vistas.has(chave)) return; vistas.add(chave);
  objetos.forEach((o) => {
    if (o.chao) return;
    for (let t = 0; t <= 1; t += 0.01) {
      if (dentro(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t, o, MARGEM)) { arestasQueCruzam.push(`${a.id} <-> ${b.id} cruza ${o.id}`); break; }
    }
  });
}));

// conectividade (a decoração não deve ter mudado o grafo, mas confirma que continua um só componente)
const ids = nos.map((n) => n.id); const vis = new Set<string>([ids[0]]); const fila = [ids[0]];
while (fila.length) { const u = fila.shift()!; WAYPOINT_NODES[u].vizinhos.forEach((v) => { if (!vis.has(v) && WAYPOINT_NODES[v]) { vis.add(v); fila.push(v); } }); }

console.log(`Nós: ${nos.length} | arestas únicas: ${vistas.size} | objetos verificados: ${objetos.length}`);
console.log(`Nós dentro de objeto sólido: ${nosBloqueados.length}`, nosBloqueados);
console.log(`Arestas reais que cruzam objeto (margem ${MARGEM} tile): ${arestasQueCruzam.length}`, arestasQueCruzam);
console.log(`Conectividade: ${vis.size}/${ids.length} nós alcançáveis a partir de ${ids[0]}`);
console.log(nosBloqueados.length === 0 && arestasQueCruzam.length === 0 && vis.size === ids.length ? 'RESULTADO: APROVADO' : 'RESULTADO: REVISAR (ver listas acima)');
