import { AgenteBot, UniformeFuncionario } from '../domain/WaypointGraph';

/**
 * MOTOR DE SPRITES PIXEL-A-PIXEL 16x24 (Estilo LimeZu "Modern Interiors" + @ErisEsra)
 * - Paleta de cores natural e vibrante restaurada (tons quentes de pele, roupas variadas, cabelos naturais)
 * - Desenhado 100% em matriz de pixels individuais (sem retângulos plásticos)
 */

export const RPG_OUTLINE = '#261d2e'; // Contorno escuro clássico LimeZu / @ErisEsra

const SKIN_PALETTES = [
  { hi: '#fff1e6', base: '#fbd3b4', sh: '#d99b78', out: '#422638', blush: '#f472b6' },
  { hi: '#fde8d4', base: '#eab38c', sh: '#c27d56', out: '#3b2032', blush: '#fb7185' },
  { hi: '#f5d4a9', base: '#d49658', sh: '#9e6230', out: '#331a29', blush: '#e11d48' },
  { hi: '#e3b178', base: '#a86b38', sh: '#75421c', out: '#291521', blush: '#be123c' },
];

const HAIR_PALETTES = [
  // 0: Roxo Recepcionista (Imagem 2)
  { hi: '#f3e8ff', light: '#a855f7', base: '#7e22ce', sh: '#4c1d95', out: '#261d2e' },
  // 1: Castanho Apresentador c/ Monóculo (Imagem 3)
  { hi: '#fde68a', light: '#b47b4e', base: '#8c5832', sh: '#5c361b', out: '#261d2e' },
  // 2: Laranja/Ruivo Atendente (Imagem 4)
  { hi: '#fed7aa', light: '#fb923c', base: '#ea580c', sh: '#9a3412', out: '#261d2e' },
  // 3: Castanho Escuro Topete (Imagem 4)
  { hi: '#d6c7b2', light: '#855d47', base: '#5e3d2b', sh: '#3b2316', out: '#261d2e' },
  // 4: Cinza/Castanho Urbano (Imagem 1)
  { hi: '#e7e5e4', light: '#a8a29e', base: '#78716c', sh: '#44403c', out: '#261d2e' },
  // 5: Loiro Dourado Gamer
  { hi: '#fef9c3', light: '#facc15', base: '#ca8a04', sh: '#854d0e', out: '#261d2e' },
];

const OUTFIT_PALETTES = [
  // 0: Moletom Roxo/Lilás (Igual à Imagem 1!)
  { collar: '#fbd3b4', trim: '#facc15', light: '#a855f7', base: '#7e22ce', sh: '#4c1d95' },
  // 1: Jaqueta Azul Gamer
  { collar: '#ffffff', trim: '#38bdf8', light: '#3b82f6', base: '#1d4ed8', sh: '#1e3a8a' },
  // 2: Terno/Blazer Castanho Estúdio (Igual ao Apresentador da Imagem 3!)
  { collar: '#ffffff', trim: '#ef4444', light: '#a16207', base: '#78350f', sh: '#451a03' },
  // 3: Camisa Verde Esmeralda (Igual ao Câmera da Imagem 3!)
  { collar: '#ffffff', trim: '#fde047', light: '#22c55e', base: '#15803d', sh: '#14532d' },
  // 4: Jaqueta Vermelha Carmesim
  { collar: '#ffffff', trim: '#fde047', light: '#f43f5e', base: '#be123c', sh: '#881337' },
  // 5: Camisa Branca / Jaleco Recepção (Imagem 4!)
  { collar: '#38bdf8', trim: '#2563eb', light: '#f8fafc', base: '#cbd5e1', sh: '#64748b' },
];

// Uniformes por cargo (paleta do corpo + detalhes desenhados por cima do sprite)
const UNIFORM_PALETTES: Record<
  UniformeFuncionario,
  { collar: string; trim: string; light: string; base: string; sh: string }
> = {
  GERENTE: { collar: '#ffffff', trim: '#dc2626', light: '#475569', base: '#1e293b', sh: '#0f172a' },
  RECEPCAO: { collar: '#ffffff', trim: '#facc15', light: '#3b82f6', base: '#1d4ed8', sh: '#1e3a8a' },
  TECNICO: { collar: '#67e8f9', trim: '#22d3ee', light: '#2563eb', base: '#1e3a8a', sh: '#172554' },
  ESTOQUE: { collar: '#fde047', trim: '#fef08a', light: '#fb923c', base: '#ea580c', sh: '#9a3412' },
  LANCHONETE: { collar: '#ffffff', trim: '#fecdd3', light: '#f43f5e', base: '#be123c', sh: '#881337' },
  LIMPEZA: { collar: '#ccfbf1', trim: '#5eead4', light: '#14b8a6', base: '#0f766e', sh: '#134e4a' },
  DEV: { collar: '#e9d5ff', trim: '#c084fc', light: '#a855f7', base: '#7e22ce', sh: '#4c1d95' },
};

function drawUniformDetails(
  ctx: CanvasRenderingContext2D,
  uniforme: UniformeFuncionario,
  dir: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT'
) {
  if (dir === 'UP') {
    if (uniforme === 'ESTOQUE') {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(4, 14, 8, 1);
      ctx.fillRect(4, 16, 8, 1);
    }
    if (uniforme === 'LANCHONETE') {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(7, 14, 2, 3); // laço do avental
    }
    return;
  }
  switch (uniforme) {
    case 'GERENTE':
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, 13, 4, 1);
      ctx.fillStyle = '#dc2626';
      ctx.fillRect(7, 14, 2, 3); // gravata
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(7, 16, 2, 1);
      break;
    case 'RECEPCAO':
      ctx.fillStyle = '#facc15';
      ctx.fillRect(10, 14, 2, 2); // crachá dourado
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(5, 13, 1, 1);
      ctx.fillRect(10, 13, 1, 1);
      break;
    case 'TECNICO':
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(5, 14, 1, 3);
      ctx.fillRect(10, 14, 1, 3); // faixas refletivas do colete
      ctx.fillStyle = '#92400e';
      ctx.fillRect(4, 17, 8, 1); // cinto de ferramentas
      ctx.fillStyle = '#facc15';
      ctx.fillRect(7, 17, 2, 1);
      break;
    case 'ESTOQUE':
      ctx.fillStyle = '#fde047';
      ctx.fillRect(4, 14, 8, 1);
      ctx.fillRect(4, 16, 8, 1); // faixas hi-vis
      break;
    case 'LANCHONETE':
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(5, 14, 6, 4); // avental branco
      ctx.fillStyle = '#cbd5e1';
      ctx.fillRect(6, 16, 4, 1);
      ctx.fillStyle = '#be123c';
      ctx.fillRect(7, 15, 2, 1);
      break;
    case 'LIMPEZA':
      ctx.fillStyle = '#0d9488';
      ctx.fillRect(5, 14, 6, 3);
      ctx.fillStyle = '#5eead4';
      ctx.fillRect(6, 15, 2, 1);
      break;
    case 'DEV':
      ctx.fillStyle = '#e9d5ff';
      ctx.fillRect(7, 15, 2, 1);
      ctx.fillRect(6, 16, 4, 1);
      break;
  }
}

const BODY_DOWN_IDLE: string[] = [
  '................',
  '................',
  '....OOOOOOOO....',
  '...OOHHHHHHOO...',
  '..OOHSSSSSSsOO..',
  '..OHSSSSSSSSsO..',
  '..OSSSSSSSSSsO..',
  '..OSSEWSSWEssO..',
  '..OSSEESSEEssO..',
  '..OSBSSSSSSBsO..',
  '..OOssssssssOO..',
  '...OOOssssOOO...',
  '....OOCCCCOO....',
  '...OOMCTTTMOO...',
  '..OOSLMMMMDsOO..',
  '..OOSLMTMMDsOO..',
  '..OOssMMMDsSOO..',
  '...OODDDDDDOO...',
  '...OOPP..ppOO...',
  '...OOPP..ppOO...',
  '...OOFF..FFOO...',
  '....OOO..OOO....',
  '................',
  '................',
];

const BODY_DOWN_WALK1: string[] = [
  '................',
  '................',
  '....OOOOOOOO....',
  '...OOHHHHHHOO...',
  '..OOHSSSSSSsOO..',
  '..OHSSSSSSSSsO..',
  '..OSSSSSSSSSsO..',
  '..OSSEWSSWEssO..',
  '..OSSEESSEEssO..',
  '..OSBSSSSSSBsO..',
  '..OOssssssssOO..',
  '...OOOssssOOO...',
  '....OOCCCCOO....',
  '...OOMCTTTMOO...',
  '..OOssMMMMDLOO..',
  '..OOSLMTMMDsOO..',
  '...OOLMMMMDsOO..',
  '...OODDDDDDOO...',
  '...OOFF..ppOO...',
  '....OOO..ppOO...',
  '.........FFOO...',
  '.........OOO....',
  '................',
  '................',
];

const BODY_DOWN_WALK2: string[] = [
  '................',
  '................',
  '....OOOOOOOO....',
  '...OOHHHHHHOO...',
  '..OOHSSSSSSsOO..',
  '..OHSSSSSSSSsO..',
  '..OSSSSSSSSSsO..',
  '..OSSEWSSWEssO..',
  '..OSSEESSEEssO..',
  '..OSBSSSSSSBsO..',
  '..OOssssssssOO..',
  '...OOOssssOOO...',
  '....OOCCCCOO....',
  '...OOMCTTTMOO...',
  '..OOSLMMMMssOO..',
  '..OOSLMTMMDsOO..',
  '..OOSLMMMMDOO...',
  '...OODDDDDDOO...',
  '...OOPP..FFOO...',
  '...OOPP..OOO....',
  '...OOFF.........',
  '....OOO.........',
  '................',
  '................',
];

const BODY_UP_IDLE: string[] = [
  '................',
  '................',
  '....OOOOOOOO....',
  '...OOHHHHHHOO...',
  '..OSSSSSSSSSsO..',
  '..OSSSSSSSSSsO..',
  '..OSSSSSSSSSsO..',
  '..OSSSSSSSSSsO..',
  '..OSSSSSSSSSsO..',
  '..OssssssssssO..',
  '..OOssssssssOO..',
  '...OOOssssOOO...',
  '....OOCCCCOO....',
  '...OOMMMMMMOO...',
  '..OOSMOTTTOMsO..',
  '..OOSMOTTTOMsO..',
  '..OOssOOOOssOO..',
  '...OODDDDDDOO...',
  '...OOPP..ppOO...',
  '...OOPP..ppOO...',
  '...OOFF..FFOO...',
  '....OOO..OOO....',
  '................',
  '................',
];

const BODY_SIDE_IDLE: string[] = [
  '................',
  '................',
  '....OOOOOOOO....',
  '...OOHHHHHHOO...',
  '..OOHSSSSSSSOO..',
  '..OHSSSSSSSSSO..',
  '..OSSSSSSSSSSO..',
  '..OSSSSSSWEsOO..',
  '..OSSSSSSEEsO...',
  '..OSSSSSSSBsO...',
  '..OOssssssssOO..',
  '...OOOssssOOO...',
  '....OOCCCCOO....',
  '...OOMMMMMMOO...',
  '...OOLMssMMOO...',
  '...OOLMssMMOO...',
  '...OODDDDDDOO...',
  '....OOPPppOO....',
  '....OOPPppOO....',
  '....OOFFFFOO....',
  '.....OOOOOO.....',
  '................',
  '................',
  '................',
];

const BODY_SIDE_WALK1: string[] = [
  '................',
  '................',
  '....OOOOOOOO....',
  '...OOHHHHHHOO...',
  '..OOHSSSSSSSOO..',
  '..OHSSSSSSSSSO..',
  '..OSSSSSSSSSSO..',
  '..OSSSSSSWEsOO..',
  '..OSSSSSSEEsO...',
  '..OSSSSSSSBsO...',
  '..OOssssssssOO..',
  '...OOOssssOOO...',
  '....OOCCCCOO....',
  '...OOMMMMMMOO...',
  '..OOssMMMMMOO...',
  '...OOLMMMMssOO..',
  '...OODDDDDDOO...',
  '...OOPP..ppOO...',
  '..OOFF....FFOO..',
  '...OOO....OOO...',
  '................',
  '................',
  '................',
  '................',
];

const HAIRSTYLE_FRONT: string[][] = [
  // Estilo 0: Corte Clássico Redondo / Cap (Imagem 1!)
  [
    '....OOOOOOOO....',
    '..OO33222233OO..',
    '.OO3221111223OO.',
    '.O322222222234O.',
    '.O333333333344O.',
    '.O44OOOOOOOO44O.',
    '.OO..........OO.',
    '................',
  ],
  // Estilo 1: Bob Cut c/ Mechas Laterais (Recepcionista da Imagem 2!)
  [
    '....OOOOOOOO....',
    '..OO33222233OO..',
    '.OO3211112233OO.',
    '.O322223322234O.',
    '.O33344OO44334O.',
    '.O334O....O434O.',
    '.O34O......O44O.',
    '.O44O......O44O.',
    '.OOO........OOO.',
  ],
  // Estilo 2: Spiky Apresentador (Imagem 3!)
  [
    '..OO..OOOO..OO..',
    '.O23OO2212OO34O.',
    '.O322111122234O.',
    '.O332222222334O.',
    '.O4334OOOO4334O.',
    '.OO4OO....OO4OO.',
    '................',
  ],
  // Estilo 3: Topete Pompadour Alto (Imagem 4!)
  [
    '...OOOOOOOOOO...',
    '..O2111111223O..',
    '.O322111122334O.',
    '.O332222223344O.',
    '.O4444OOOO4444O.',
    '..OO........OO..',
    '................',
  ],
];

const HAIRSTYLE_BACK: string[] = [
  '....OOOOOOOO....',
  '..OO33222233OO..',
  '.OO3221111223OO.',
  '.O322222222234O.',
  '.O333333333344O.',
  '.O333333333344O.',
  '.O433333333344O.',
  '.O444444444444O.',
  '..OO44444444OO..',
  '...OOOOOOOOOO...',
];

const spriteCache = new Map<string, HTMLCanvasElement>();

function buildSpriteFrameCanvas(
  dir: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT',
  walkState: 0 | 1 | 2,
  skinIdx: number,
  hairIdx: number,
  outfitIdx: number,
  accessoryType: 'NONE' | 'GLASSES' | 'MONOCLE' | 'HEADSET',
  uniforme?: UniformeFuncionario
): HTMLCanvasElement {
  const key = `v3_${dir}_${walkState}_${skinIdx}_${hairIdx}_${outfitIdx}_${accessoryType}_${uniforme ?? '-'}`;
  const cached = spriteCache.get(key);
  if (cached) return cached;

  const can = document.createElement('canvas');
  can.width = 16;
  can.height = 24;
  const ctx = can.getContext('2d')!;
  ctx.imageSmoothingEnabled = false;

  const skin = SKIN_PALETTES[skinIdx % SKIN_PALETTES.length];
  const hair = HAIR_PALETTES[hairIdx % HAIR_PALETTES.length];
  const outfit = uniforme
    ? UNIFORM_PALETTES[uniforme]
    : OUTFIT_PALETTES[outfitIdx % OUTFIT_PALETTES.length];

  let matrix = BODY_DOWN_IDLE;
  if (dir === 'UP') {
    matrix = BODY_UP_IDLE;
  } else if (dir === 'LEFT' || dir === 'RIGHT') {
    matrix = walkState === 0 ? BODY_SIDE_IDLE : BODY_SIDE_WALK1;
  } else {
    matrix =
      walkState === 1
        ? BODY_DOWN_WALK1
        : walkState === 2
        ? BODY_DOWN_WALK2
        : BODY_DOWN_IDLE;
  }

  for (let y = 0; y < matrix.length; y++) {
    const row = matrix[y];
    for (let x = 0; x < 16; x++) {
      const ch = row[x];
      if (!ch || ch === '.') continue;
      const drawX = dir === 'LEFT' ? 15 - x : x;

      switch (ch) {
        case 'O':
          ctx.fillStyle = RPG_OUTLINE;
          break;
        case 'o':
          ctx.fillStyle = skin.out;
          break;
        case 'H':
          ctx.fillStyle = skin.hi;
          break;
        case 'S':
          ctx.fillStyle = skin.base;
          break;
        case 's':
          ctx.fillStyle = skin.sh;
          break;
        case 'B':
          ctx.fillStyle = skin.blush;
          break;
        case 'E':
          ctx.fillStyle = RPG_OUTLINE;
          break;
        case 'W':
          ctx.fillStyle = '#ffffff';
          break;
        case 'C':
          ctx.fillStyle = outfit.collar;
          break;
        case 'T':
          ctx.fillStyle = outfit.trim;
          break;
        case 'L':
          ctx.fillStyle = outfit.light;
          break;
        case 'M':
          ctx.fillStyle = outfit.base;
          break;
        case 'D':
          ctx.fillStyle = outfit.sh;
          break;
        case 'P':
          ctx.fillStyle = '#334155';
          break;
        case 'p':
          ctx.fillStyle = '#1e293b';
          break;
        case 'F':
          ctx.fillStyle = '#f8fafc';
          break;
        default:
          continue;
      }
      ctx.fillRect(drawX, y, 1, 1);
    }
  }

  if (uniforme) drawUniformDetails(ctx, uniforme, dir);

  const hairRows =
    dir === 'UP'
      ? HAIRSTYLE_BACK
      : HAIRSTYLE_FRONT[hairIdx % HAIRSTYLE_FRONT.length];

  for (let y = 0; y < hairRows.length; y++) {
    const row = hairRows[y];
    for (let x = 0; x < 16; x++) {
      const ch = row[x];
      if (!ch || ch === '.') continue;
      const drawX = dir === 'LEFT' ? 15 - x : x;

      if (ch === 'O') ctx.fillStyle = hair.out;
      else if (ch === '1') ctx.fillStyle = hair.hi;
      else if (ch === '2') ctx.fillStyle = hair.light;
      else if (ch === '3') ctx.fillStyle = hair.base;
      else if (ch === '4') ctx.fillStyle = hair.sh;
      ctx.fillRect(drawX, y + 1, 1, 1);
    }
  }

  if (dir !== 'UP') {
    if (accessoryType === 'GLASSES') {
      ctx.fillStyle = RPG_OUTLINE;
      ctx.fillRect(3, 7, 10, 1);
      ctx.fillRect(3, 8, 4, 2);
      ctx.fillRect(9, 8, 4, 2);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(4, 8, 2, 1);
      ctx.fillRect(10, 8, 2, 1);
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(4, 9, 2, 1);
      ctx.fillRect(10, 9, 2, 1);
    } else if (accessoryType === 'MONOCLE') {
      ctx.fillStyle = '#fde047';
      ctx.fillRect(9, 7, 3, 3);
      ctx.fillStyle = '#bae6fd';
      ctx.fillRect(10, 8, 1, 1);
      ctx.fillStyle = '#eab308';
      ctx.fillRect(11, 10, 1, 2);
    } else if (accessoryType === 'HEADSET') {
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(1, 6, 2, 4);
      ctx.fillRect(13, 6, 2, 4);
      ctx.fillStyle = '#0284c7';
      ctx.fillRect(2, 7, 1, 2);
      ctx.fillRect(13, 7, 1, 2);
    }
  }

  spriteCache.set(key, can);
  return can;
}

export function drawRpgPixelCharacter(
  ctx: CanvasRenderingContext2D,
  bot: AgenteBot,
  idx: number,
  tick: number
) {
  ctx.imageSmoothingEnabled = false;

  const andando =
    bot.pose === 'WALK' || (bot.pose === 'CARRYING_BOX' && bot.filaRota.length > 0);

  const rawStep = andando ? Math.floor((tick + idx * 7) / 7) % 4 : 0;
  const walkState: 0 | 1 | 2 = rawStep === 1 ? 1 : rawStep === 3 ? 2 : 0;

  const idleOffsetPx =
    !andando && bot.pose !== 'SITTING_PC' && Math.floor((tick + idx * 13) / 28) % 2 === 1
      ? -1
      : 0;

  // Índice estável por personagem (evita trocar de aparência quando a ordem de profundidade muda)
  let sidx = 0;
  for (let i = 0; i < bot.id.length; i++) sidx = (sidx * 31 + bot.id.charCodeAt(i)) % 9973;

  const accessory: 'NONE' | 'GLASSES' | 'MONOCLE' | 'HEADSET' =
    bot.pose === 'SITTING_PC' || bot.temFone
      ? 'HEADSET'
      : sidx % 5 === 1
      ? 'MONOCLE'
      : sidx % 4 === 0
      ? 'GLASSES'
      : 'NONE';

  const spriteCanvas = buildSpriteFrameCanvas(
    bot.direcao,
    walkState,
    sidx % SKIN_PALETTES.length,
    (sidx >> 2) % HAIR_PALETTES.length,
    (sidx >> 3) % OUTFIT_PALETTES.length,
    accessory,
    bot.uniforme
  );

  // Escala inteira 2x: 32x48 unidades lógicas (casando com a malha de Tiles 16x16!)
  const SPRITE_W = 32;
  const SPRITE_H = 48;
  const drawX = Math.round(bot.x - SPRITE_W / 2);
  const drawY = Math.round(bot.y - SPRITE_H + 14 + idleOffsetPx);

  ctx.fillStyle = 'rgba(34, 24, 46, 0.34)';
  ctx.fillRect(drawX + 6, Math.round(bot.y + 6), 20, 6);
  ctx.fillRect(drawX + 4, Math.round(bot.y + 8), 24, 2);

  ctx.drawImage(spriteCanvas, drawX, drawY, SPRITE_W, SPRITE_H);

  if (bot.pose === 'SITTING_PC') {
    const cx = Math.round(bot.x);
    const cy = Math.round(bot.y);
    ctx.fillStyle = RPG_OUTLINE;
    ctx.fillRect(cx - 12, cy - 8, 24, 14);
    ctx.fillStyle = '#1e293b';
    ctx.fillRect(cx - 10, cy - 6, 20, 10);
    ctx.fillStyle = '#38bdf8';
    ctx.fillRect(cx - 8, cy - 4, 2, 6);
    ctx.fillRect(cx + 6, cy - 4, 2, 6);
  }

  if (bot.pose === 'CARRYING_BOX') {
    const bx = Math.round(bot.x - 10);
    const by = Math.round(bot.y - 12 + idleOffsetPx);
    ctx.fillStyle = RPG_OUTLINE;
    ctx.fillRect(bx, by, 20, 14);
    ctx.fillStyle = '#d99b52';
    ctx.fillRect(bx + 2, by + 2, 16, 10);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(bx + 8, by + 2, 4, 10);
  }

  if (!bot.ehCliente && bot.ferramenta && bot.ferramenta !== 'NONE') {
    drawFerramentaTrabalho(ctx, bot, tick, idleOffsetPx);
  }
}

/**
 * FERRAMENTAS DE TRABALHO ANIMADAS (pixel a pixel) segundo a função do funcionário
 */
function drawFerramentaTrabalho(
  ctx: CanvasRenderingContext2D,
  bot: AgenteBot,
  tick: number,
  idleOffsetPx: number
) {
  const x = Math.round(bot.x);
  const y = Math.round(bot.y + idleOffsetPx);
  const px = (rx: number, ry: number, w: number, h: number, cor: string) => {
    ctx.fillStyle = cor;
    ctx.fillRect(x + rx, y + ry, w, h);
  };
  const trabalhando = bot.pose === 'WORKING_TOOL' || bot.pose === 'CLEANING';
  const lado = bot.direcao === 'LEFT' ? -1 : 1;

  switch (bot.ferramenta) {
    case 'VASSOURA': {
      const varre = bot.pose === 'CLEANING' ? Math.round(Math.sin(tick * 0.22) * 6) : 0;
      // cabo de madeira diagonal
      for (let i = 0; i < 16; i++) {
        px(12 + varre + Math.round(i * -0.45), -32 + i * 2, 2, 2, i % 4 < 2 ? '#a16207' : '#854d0e');
      }
      // cerdas
      px(1 + varre, -2, 12, 5, RPG_OUTLINE);
      px(2 + varre, -1, 10, 3, '#facc15');
      px(2 + varre, 1, 10, 1, '#ca8a04');
      if (trabalhando) {
        for (let s = 0; s < 3; s++) {
          const fase = (tick + s * 9) % 24;
          px(-6 + varre + s * 8, 2 - Math.round(fase * 0.5), 2, 2, fase < 12 ? '#e0f2fe' : '#67e8f9');
        }
      }
      break;
    }
    case 'CHAVE_SOLDA': {
      const bate = trabalhando ? Math.round(Math.sin(tick * 0.4) * 2) : 0;
      // chave inglesa
      px(11, -24 + bate, 3, 12, RPG_OUTLINE);
      px(12, -23 + bate, 1, 10, '#cbd5e1');
      px(10, -28 + bate, 5, 5, RPG_OUTLINE);
      px(11, -27 + bate, 1, 3, '#94a3b8');
      px(13, -27 + bate, 1, 3, '#94a3b8');
      // ferro de solda com faíscas
      px(-14, -22, 3, 9, '#475569');
      px(-14, -24, 3, 2, '#f97316');
      if (trabalhando && tick % 6 < 3) {
        px(-17, -27, 2, 2, '#fde047');
        px(-11, -29, 2, 2, '#ffffff');
        px(-15, -31, 2, 2, '#f97316');
        px(14, -30, 2, 2, '#fde047');
      }
      break;
    }
    case 'PRANCHETA': {
      px(9 * lado - (lado < 0 ? 10 : 0), -26, 10, 14, RPG_OUTLINE);
      const bx = 9 * lado - (lado < 0 ? 10 : 0);
      px(bx + 1, -25, 8, 12, '#b45309');
      px(bx + 2, -23, 6, 9, '#f8fafc');
      px(bx + 3, -21, 4, 1, '#94a3b8');
      px(bx + 3, -19, 4, 1, '#94a3b8');
      px(bx + 3, -17, 3, 1, '#94a3b8');
      if (trabalhando && tick % 40 < 20) px(bx + 6, -16, 2, 2, '#22c55e'); // visto piscando
      px(bx + 4, -27, 2, 2, '#facc15');
      break;
    }
    case 'BANDEJA_LANCHE': {
      // bandeja prateada à frente do corpo
      px(-13, -14, 26, 4, RPG_OUTLINE);
      px(-12, -13, 24, 2, '#e2e8f0');
      // fatia de pizza
      px(-9, -19, 8, 5, RPG_OUTLINE);
      px(-8, -18, 6, 3, '#f59e0b');
      px(-6, -17, 2, 1, '#dc2626');
      // xícara de café + vapor
      px(2, -20, 6, 6, RPG_OUTLINE);
      px(3, -19, 4, 4, '#ffffff');
      px(4, -18, 2, 2, '#78350f');
      const v = tick % 30;
      px(3 + (v < 15 ? 0 : 1), -23 - Math.floor(v / 6), 1, 2, 'rgba(255,255,255,0.8)');
      px(6 - (v < 15 ? 0 : 1), -24 - Math.floor(v / 8), 1, 2, 'rgba(255,255,255,0.6)');
      break;
    }
    case 'TABLET_EXEC': {
      px(8, -26, 11, 15, RPG_OUTLINE);
      px(9, -25, 9, 13, '#0f172a');
      const h1 = 3 + ((tick >> 3) % 5);
      const h2 = 7 - ((tick >> 4) % 4);
      px(10, -14 - h1, 2, h1, '#22d3ee');
      px(13, -14 - h2, 2, h2, '#4ade80');
      px(16, -16, 1, 4, '#facc15');
      break;
    }
    case 'LAPTOP_DEV': {
      px(-11, -17, 22, 3, RPG_OUTLINE);
      px(-10, -16, 20, 1, '#94a3b8');
      px(-9, -27, 18, 10, RPG_OUTLINE);
      px(-8, -26, 16, 8, '#0f172a');
      for (let l = 0; l < 3; l++) {
        const w = 4 + ((tick >> 3) + l * 3) % 8;
        px(-6, -25 + l * 2, w, 1, l === 1 ? '#facc15' : '#4ade80');
      }
      break;
    }
    default:
      break;
  }
}
