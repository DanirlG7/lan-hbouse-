import { WAYPOINT_NODES } from '../src/domain/WaypointGraph';
import { readFileSync } from 'fs';
const ids = Object.keys(WAYPOINT_NODES);
console.log('nos:', ids.length);
const src = readFileSync('src/domain/WaypointGraph.ts', 'utf8');
const usados = new Set<string>();
for (const m of src.matchAll(/(?:enviarParaDestino\([a-zA-Z]+,\s*|nodo:\s*|'recepcao_[a-z_]+'|criarOuAtualizarBot\(\s*[^,]+,[^,]+,[^,]+,[^,]+,\s*)'([a-z_0-9]+)'/g)) usados.add(m[1]);
for (const m of src.matchAll(/nodo: '([a-z_0-9]+)'/g)) usados.add(m[1]);
for (const m of src.matchAll(/'((?:calcada|recepcao|tecnica|estoque|cozinha|corredor|sala|ala|lounge|escritorio|estudio|porta|arena)[a-z_0-9]*)'/g)) usados.add(m[1]);
const faltando = [...usados].filter((u) => !WAYPOINT_NODES[u]);
console.log('ids usados ausentes:', faltando);
const visit = new Set<string>(['porta_principal_fora']);
const fila = ['porta_principal_fora'];
while (fila.length) { const a = fila.shift()!; for (const v of WAYPOINT_NODES[a].vizinhos) if (!visit.has(v)) { visit.add(v); fila.push(v); } }
console.log('inalcancaveis:', ids.filter((i) => !visit.has(i)));
console.log('sem vizinhos:', ids.filter((i) => WAYPOINT_NODES[i].vizinhos.length === 0));
