import { TILE_SIZE } from './constants';
import { ANCORAS, SLOTS_PC } from './layout';
import { temLinhaDeVisao } from './collision';

export interface NoGrafo {
  id: string;
  x: number;
  y: number;
  vizinhos: string[];
  etiqueta?: string;
}

/**
 * Gera o grafo de rotas a partir das âncoras do layout.
 * Cada âncora liga-se ao vizinho mais próximo nas 4 direções (mesma linha/coluna)
 * desde que o trecho reto esteja livre na grade de colisão. Assentos ligam-se ao seu corredor.
 */
export function construirGrafo(): Record<string, NoGrafo> {
  const nos: Record<string, NoGrafo> = {};

  ANCORAS.forEach((a) => {
    if (nos[a.id]) throw new Error(`Âncora duplicada: ${a.id}`);
    nos[a.id] = {
      id: a.id,
      x: Math.round(a.x * TILE_SIZE),
      y: Math.round(a.y * TILE_SIZE),
      vizinhos: [],
      etiqueta: a.etiqueta,
    };
  });

  const ligar = (a: string, b: string) => {
    if (a === b) return;
    if (!nos[a].vizinhos.includes(b)) nos[a].vizinhos.push(b);
    if (!nos[b].vizinhos.includes(a)) nos[b].vizinhos.push(a);
  };

  const lista = Object.values(nos);
  lista.forEach((n) => {
    // 4 direções: E, W, S, N
    const dirs: Array<{ ok: (o: NoGrafo) => boolean; dist: (o: NoGrafo) => number }> = [
      { ok: (o) => o.y === n.y && o.x > n.x, dist: (o) => o.x - n.x },
      { ok: (o) => o.y === n.y && o.x < n.x, dist: (o) => n.x - o.x },
      { ok: (o) => o.x === n.x && o.y > n.y, dist: (o) => o.y - n.y },
      { ok: (o) => o.x === n.x && o.y < n.y, dist: (o) => n.y - o.y },
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
      vizinhos: [],
    };
    ligar(p.nodoAssento, p.corredor);
  });

  return nos;
}
