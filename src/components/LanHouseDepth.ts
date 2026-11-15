/**
 * PROFUNDIDADE (y-sort) DOS OBJETOS ESTÁTICOS
 *
 * Regra: todo objeto tem uma "linha de base" (a borda inferior, onde ele toca o chão).
 * Quem tem a base mais ao sul (y maior) fica NA FRENTE.
 *
 * Como funciona para os móveis e paredes (que vivem num cache único):
 *  1. Ao montar o cache, cada retângulo desenhado grava a sua base num mapa de profundidade
 *     (uma célula a cada 2 px). Se vários retângulos cobrem a mesma célula, vale a maior base.
 *  2. Ao desenhar um personagem, as células com base MAIOR que a dele são recolocadas por cima
 *     (copiadas do cache), então ele aparece ATRÁS da mesa, da estante, da parede...
 *  3. Itens planos (palco, cabos no chão, tiras de LED) são marcados com `plano()` e nunca
 *     cobrem ninguém.
 *
 * Retângulos translúcidos (sombras, vidro) não gravam profundidade.
 */

export const CELULA = 2;

export interface RetanguloDebug {
  x: number;
  y: number;
  w: number;
  h: number;
  base: number;
}

type Ctx = CanvasRenderingContext2D;

export class MapaProfundidade {
  readonly cols: number;
  readonly rows: number;
  readonly dados: Uint16Array;
  /** só preenchido quando `guardarRetangulos` é verdadeiro (testes/depuração) */
  readonly retangulos: RetanguloDebug[] = [];
  guardarRetangulos = false;
  private nivelPlano = 0;

  constructor(larguraMundo: number, alturaMundo: number) {
    this.cols = Math.ceil(larguraMundo / CELULA);
    this.rows = Math.ceil(alturaMundo / CELULA);
    this.dados = new Uint16Array(this.cols * this.rows);
  }

  /** Liga o mapa a um contexto: todo fillRect opaco passa a registrar a sua base */
  anexar(ctx: Ctx) {
    const original = ctx.fillRect.bind(ctx);
    ctx.fillRect = (x: number, y: number, w: number, h: number) => {
      original(x, y, w, h);
      if (this.nivelPlano > 0) return;
      if (ctx.globalAlpha < 1) return;
      const estilo = ctx.fillStyle;
      if (typeof estilo !== 'string') return;
      if (estilo.startsWith('rgba') || estilo.startsWith('hsla')) return;
      const m = typeof ctx.getTransform === 'function' ? ctx.getTransform() : null;
      let x0 = x;
      let y0 = y;
      let x1 = x + w;
      let y1 = y + h;
      if (m && !(m.a === 1 && m.d === 1 && m.b === 0 && m.c === 0 && m.e === 0 && m.f === 0)) {
        const px = [x, x + w, x, x + w].map((vx, i) => m.a * vx + m.c * (i < 2 ? y : y + h) + m.e);
        const py = [x, x + w, x, x + w].map((vx, i) => m.b * vx + m.d * (i < 2 ? y : y + h) + m.f);
        x0 = Math.min(...px);
        x1 = Math.max(...px);
        y0 = Math.min(...py);
        y1 = Math.max(...py);
      }
      this.registrar(x0, y0, x1 - x0, y1 - y0);
    };
  }

  /** Tudo desenhado dentro de `fn` é "chão": nunca cobre personagens */
  plano<T>(fn: () => T): T {
    this.nivelPlano += 1;
    try {
      return fn();
    } finally {
      this.nivelPlano -= 1;
    }
  }

  registrar(x: number, y: number, w: number, h: number) {
    const base = Math.min(65535, Math.max(0, Math.round(y + h)));
    const c0 = Math.max(0, Math.floor(x / CELULA));
    const c1 = Math.min(this.cols, Math.ceil((x + w) / CELULA));
    const r0 = Math.max(0, Math.floor(y / CELULA));
    const r1 = Math.min(this.rows, Math.ceil((y + h) / CELULA));
    for (let r = r0; r < r1; r++) {
      const linha = r * this.cols;
      for (let c = c0; c < c1; c++) {
        if (base > this.dados[linha + c]) this.dados[linha + c] = base;
      }
    }
    if (this.guardarRetangulos) this.retangulos.push({ x, y, w, h, base });
  }

  /** Base (px) do objeto que cobre o ponto, ou 0 */
  baseEm(px: number, py: number): number {
    const c = Math.floor(px / CELULA);
    const r = Math.floor(py / CELULA);
    if (c < 0 || r < 0 || c >= this.cols || r >= this.rows) return 0;
    return this.dados[r * this.cols + c];
  }

  /**
   * Recoloca sobre `destino` os pedaços do cache cuja base é maior que `chave`
   * (isto é, que estão na frente de quem tem os pés em `chave`), dentro do retângulo dado.
   */
  recolocar(destino: Ctx, cache: CanvasImageSource, x: number, y: number, w: number, h: number, chave: number) {
    const c0 = Math.max(0, Math.floor(x / CELULA));
    const c1 = Math.min(this.cols, Math.ceil((x + w) / CELULA));
    const r0 = Math.max(0, Math.floor(y / CELULA));
    const r1 = Math.min(this.rows, Math.ceil((y + h) / CELULA));
    for (let r = r0; r < r1; r++) {
      const linha = r * this.cols;
      let inicio = -1;
      for (let c = c0; c <= c1; c++) {
        const na_frente = c < c1 && this.dados[linha + c] > chave;
        if (na_frente && inicio < 0) inicio = c;
        else if (!na_frente && inicio >= 0) {
          const larg = (c - inicio) * CELULA;
          destino.drawImage(cache, inicio * CELULA, r * CELULA, larg, CELULA, inicio * CELULA, r * CELULA, larg, CELULA);
          inicio = -1;
        }
      }
    }
  }
}

/** Objeto desenhado a cada frame que participa da ordenação por profundidade */
export interface ObjetoProfundo {
  /** y (px) da linha de base: define quem fica na frente */
  base: number;
  desenhar: (ctx: Ctx) => void;
  /** retângulo ocupado (para culling) */
  x: number;
  y: number;
  w: number;
  h: number;
}
