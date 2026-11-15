import { AgenteBot, UniformeFuncionario } from '../domain/WaypointGraph';

/**
 * MOTOR DE SPRITES PIXEL-A-PIXEL 16x24 (Estilo LimeZu "Modern Interiors" + @ErisEsra)
 * - Paleta de cores natural e vibrante restaurada (tons quentes de pele, roupas variadas, cabelos naturais)
 * - Desenhado 100% em matriz de pixels individuais (sem retângulos plásticos)
 */

export const RPG_OUTLINE = '#261d2e'; // Contorno escuro clássico LimeZu / @ErisEsra

const SKIN_PALETTES = [
  { hi: '#fff1e6', base: '#fbd3b4', sh: '#d99b78', out: '#422638', blush: '#f472b6' },
  { hi: '#fde8d4', base: '#f0bc94', sh: '#c7855c', out: '#3b2032', blush: '#fb7185' },
  { hi: '#f6d6ad', base: '#dda062', sh: '#a86c36', out: '#331a29', blush: '#e11d48' },
  { hi: '#e8b982', base: '#bc7c44', sh: '#854e22', out: '#291521', blush: '#be123c' },
  { hi: '#cd9360', base: '#91582d', sh: '#613416', out: '#231018', blush: '#9f1239' },
  { hi: '#a36b43', base: '#6b3e21', sh: '#452411', out: '#1a0c12', blush: '#881337' },
];

const HAIR_PALETTES = [
  // 0: Preto Carvão (mais comum e natural)
  { hi: '#64748b', light: '#334155', base: '#1e293b', sh: '#0f172a', out: '#181020' },
  // 1: Castanho Escuro
  { hi: '#c29b7a', light: '#7a523b', base: '#543524', sh: '#331d12', out: '#261d2e' },
  // 2: Castanho Mel / Urbano
  { hi: '#fde68a', light: '#b47b4e', base: '#8c5832', sh: '#5c361b', out: '#261d2e' },
  // 3: Loiro Dourado
  { hi: '#fef9c3', light: '#fde047', base: '#ca8a04', sh: '#854d0e', out: '#261d2e' },
  // 4: Ruivo Cobre
  { hi: '#fed7aa', light: '#fb923c', base: '#ea580c', sh: '#9a3412', out: '#261d2e' },
  // 5: Platinado / Prata
  { hi: '#ffffff', light: '#e2e8f0', base: '#94a3b8', sh: '#475569', out: '#261d2e' },
  // 6: Vermelho Streetwear
  { hi: '#fecdd3', light: '#f43f5e', base: '#be123c', sh: '#881337', out: '#261d2e' },
  // 7: Azul Meia-Noite
  { hi: '#bae6fd', light: '#38bdf8', base: '#1d4ed8', sh: '#1e3a8a', out: '#1e1b2e' },
  // 8: Rosa Pastel Gamer
  { hi: '#fce7f3', light: '#f472b6', base: '#db2777', sh: '#9d174d', out: '#261d2e' },
  // 9: Roxo Neon (apenas 1 em 10, nunca dominante)
  { hi: '#f3e8ff', light: '#a855f7', base: '#7e22ce', sh: '#4c1d95', out: '#261d2e' },
];

interface OutfitStyle {
  collar: string;
  trim: string;
  light: string;
  base: string;
  sh: string;
  pants: string;
  pantsSh: string;
  shoes: string;
}

const OUTFIT_PALETTES: OutfitStyle[] = [
  // 0: Moletom Verde Oliva (Figma #1)
  { collar: '#d9f99d', trim: '#facc15', light: '#4d7c0f', base: '#3f6212', sh: '#1a2e05', pants: '#1e293b', pantsSh: '#0f172a', shoes: '#e2e8f0' },
  // 1: Colete Jeans sobre Camisa (Figma #2)
  { collar: '#f8fafc', trim: '#38bdf8', light: '#3b82f6', base: '#1d4ed8', sh: '#1e3a8a', pants: '#334155', pantsSh: '#1e293b', shoes: '#f8fafc' },
  // 2: Regata Preta & Jeans (Figma #3)
  { collar: '#fbd3b4', trim: '#cbd5e1', light: '#475569', base: '#1f2937', sh: '#090d16', pants: '#2563eb', pantsSh: '#1e3a8a', shoes: '#f1f5f9' },
  // 3: Jaqueta Varsity Azul/Branco (Figma #4)
  { collar: '#ffffff', trim: '#fde047', light: '#2563eb', base: '#1e40af', sh: '#172554', pants: '#3f3f46', pantsSh: '#18181b', shoes: '#ffffff' },
  // 4: Camisa Listrada Branca/Ciano & Calça Azul (Figma #5)
  { collar: '#ffffff', trim: '#38bdf8', light: '#f8fafc', base: '#cbd5e1', sh: '#64748b', pants: '#2563eb', pantsSh: '#1e40af', shoes: '#fda4af' },
  // 5: Moletom Roxo Cyberpunk (Figma #6)
  { collar: '#e9d5ff', trim: '#22d3ee', light: '#a855f7', base: '#7e22ce', sh: '#4c1d95', pants: '#1e293b', pantsSh: '#090d16', shoes: '#a855f7' },
  // 6: Camisa Xadrez Flanelada Vermelha (Figma #7)
  { collar: '#fecdd3', trim: '#1e293b', light: '#ef4444', base: '#b91c1c', sh: '#7f1d1d', pants: '#1e293b', pantsSh: '#0f172a', shoes: '#cbd5e1' },
  // 7: Jaqueta de Couro Preta (Figma #8)
  { collar: '#e2e8f0', trim: '#94a3b8', light: '#3f3f46', base: '#18181b', sh: '#09090b', pants: '#2563eb', pantsSh: '#1e3a8a', shoes: '#d6d3d1' },
  // 8: Regata Amarela Mostarda (Figma #9)
  { collar: '#fef08a', trim: '#f97316', light: '#facc15', base: '#eab308', sh: '#a16207', pants: '#3b82f6', pantsSh: '#1d4ed8', shoes: '#f8fafc' },
  // 9: Tricô Escuro Listrado (Figma #10)
  { collar: '#cbd5e1', trim: '#94a3b8', light: '#475569', base: '#334155', sh: '#1e293b', pants: '#18181b', pantsSh: '#09090b', shoes: '#94a3b8' },
  // 10: Bomber Rosa Pastel (Figma #11)
  { collar: '#ffffff', trim: '#fbcfe8', light: '#f472b6', base: '#ec4899', sh: '#9d174d', pants: '#64748b', pantsSh: '#334155', shoes: '#fbcfe8' },
  // 11: Conjunto Moletom Cinza Esporte (Figma #12)
  { collar: '#f8fafc', trim: '#38bdf8', light: '#cbd5e1', base: '#94a3b8', sh: '#475569', pants: '#64748b', pantsSh: '#475569', shoes: '#f8fafc' },
  // 12: Corta-Vento Teal Gamer
  { collar: '#ccfbf1', trim: '#22d3ee', light: '#2dd4bf', base: '#0d9488', sh: '#115e59', pants: '#1e293b', pantsSh: '#0f172a', shoes: '#2dd4bf' },
  // 13: Jersey Laranja Sunset
  { collar: '#ffedd5', trim: '#fde047', light: '#fb923c', base: '#ea580c', sh: '#9a3412', pants: '#334155', pantsSh: '#1e293b', shoes: '#f8fafc' },
];

const HAT_PALETTES = [
  { base: '#1e293b', hi: '#475569', sh: '#090d16', brim: '#38bdf8' }, // Boné preto + detalhe ciano
  { base: '#dc2626', hi: '#f87171', sh: '#7f1d1d', brim: '#991b1b' }, // Boné vermelho
  { base: '#0284c7', hi: '#38bdf8', sh: '#0c4a6e', brim: '#facc15' }, // Boné azul + detalhe ouro
  { base: '#3f6212', hi: '#84cc16', sh: '#1a2e05', brim: '#365314' }, // Gorro oliva
  { base: '#d97706', hi: '#fbbf24', sh: '#78350f', brim: '#b45309' }, // Gorro mostarda
  { base: '#e2e8f0', hi: '#ffffff', sh: '#94a3b8', brim: '#1e293b' }, // Aba branca/cinza
  { base: '#7e22ce', hi: '#c084fc', sh: '#4c1d95', brim: '#22d3ee' }, // Boné gamer roxo
];

// Uniformes por cargo (paleta do corpo + detalhes desenhados por cima do sprite)
const UNIFORM_PALETTES: Record<UniformeFuncionario, OutfitStyle> = {
  GERENTE: { collar: '#ffffff', trim: '#dc2626', light: '#475569', base: '#1e293b', sh: '#0f172a', pants: '#1e293b', pantsSh: '#090d16', shoes: '#0f172a' },
  RECEPCAO: { collar: '#ffffff', trim: '#facc15', light: '#3b82f6', base: '#1d4ed8', sh: '#1e3a8a', pants: '#1e293b', pantsSh: '#0f172a', shoes: '#e2e8f0' },
  TECNICO: { collar: '#67e8f9', trim: '#22d3ee', light: '#2563eb', base: '#1e3a8a', sh: '#172554', pants: '#334155', pantsSh: '#1e293b', shoes: '#cbd5e1' },
  ESTOQUE: { collar: '#fde047', trim: '#fef08a', light: '#fb923c', base: '#ea580c', sh: '#9a3412', pants: '#334155', pantsSh: '#1e293b', shoes: '#78350f' },
  LANCHONETE: { collar: '#ffffff', trim: '#fecdd3', light: '#f43f5e', base: '#be123c', sh: '#881337', pants: '#1e293b', pantsSh: '#0f172a', shoes: '#f8fafc' },
  LIMPEZA: { collar: '#ccfbf1', trim: '#5eead4', light: '#14b8a6', base: '#0f766e', sh: '#134e4a', pants: '#1e293b', pantsSh: '#0f172a', shoes: '#cbd5e1' },
  DEV: { collar: '#e9d5ff', trim: '#c084fc', light: '#a855f7', base: '#7e22ce', sh: '#4c1d95', pants: '#1e293b', pantsSh: '#090d16', shoes: '#a855f7' },
  SEGURANCA: { collar: '#ffffff', trim: '#09090b', light: '#27272a', base: '#18181b', sh: '#09090b', pants: '#09090b', pantsSh: '#000000', shoes: '#18181b' },
  ESTACIONAMENTO: { collar: '#f8fafc', trim: '#bef264', light: '#eab308', base: '#0f172a', sh: '#020617', pants: '#1e293b', pantsSh: '#090d16', shoes: '#0f172a' },
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
    if (uniforme === 'ESTACIONAMENTO') {
      ctx.fillStyle = '#a3e635';
      ctx.fillRect(4, 13, 8, 4);
      ctx.fillStyle = '#fef08a';
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
    case 'SEGURANCA':
      // Camisa branca social + gravata slim escura + broche VIP dourado
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(6, 13, 4, 1);
      ctx.fillRect(7, 14, 2, 1);
      ctx.fillStyle = '#334155';
      ctx.fillRect(7, 15, 2, 3);
      ctx.fillStyle = '#facc15';
      ctx.fillRect(10, 14, 1, 2); // badge segurança VIP
      break;
    case 'ESTACIONAMENTO':
      // Colete refletivo limão/amarelo sobre uniforme escuro + rádio comunicador no ombro
      ctx.fillStyle = '#84cc16';
      ctx.fillRect(4, 13, 8, 4);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(4, 14, 8, 1);
      ctx.fillRect(4, 16, 8, 1);
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(7, 13, 2, 4); // abertura frontal do colete
      ctx.fillStyle = '#ef4444';
      ctx.fillRect(10, 12, 1, 1); // LED do rádio comunicador
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
  // 0: Buzz Cut / Fade Curto Natural (Figma #4/#12)
  [
    '....OOOOOOOO....',
    '..OO33222233OO..',
    '.OO3221111223OO.',
    '.O333333333333O.',
    '.O44OOOOOOOO44O.',
    '..OO........OO..',
    '................',
  ],
  // 1: Bob Cut c/ Mechas Laterais (Figma #3)
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
  // 2: Spiky Undercut Gamer (Figma #6)
  [
    '..OO..OOOO..OO..',
    '.O23OO2212OO34O.',
    '.O322111122234O.',
    '.O332222222334O.',
    '.O4334OOOO4334O.',
    '.OO4OO....OO4OO.',
    '................',
  ],
  // 3: Topete Pompadour Alto
  [
    '...OOOOOOOOOO...',
    '..O2111111223O..',
    '.O322111122334O.',
    '.O332222223344O.',
    '.O4444OOOO4444O.',
    '..OO........OO..',
    '................',
  ],
  // 4: Rabo de Cavalo Lateral Alto (Figma #5)
  [
    '....OOOOOOOOOO..',
    '..OO3322223323O.',
    '.OO322111122334O',
    '.O3223333322O44O',
    '.O3344OOOO44O.OO',
    '..OO........OO..',
    '................',
  ],
  // 5: Black Power / Afro Volumoso (Figma #1)
  [
    '..OOOOOOOOOOOO..',
    '.O332211112233O.',
    'O32221111112223O',
    'O33222222222234O',
    'O43334OOOO43334O',
    '.OO4OO....OO4OO.',
    '................',
  ],
  // 6: Maria Chiquinha / Twin Pigtails (Figma #7)
  [
    '...OOOOOOOOOO...',
    '.OO3322112233OO.',
    'O33222222222233O',
    'O34334OOOO43343O',
    'O44O........O44O',
    '.OO..........OO.',
    '................',
  ],
  // 7: Coque Alto / Top Bun (Figma #11)
  [
    '.....OOOOOO.....',
    '....O221122O....',
    '..OO33222233OO..',
    '.O332222222234O.',
    '.O444OOOOOO444O.',
    '..OO........OO..',
    '................',
  ],
  // 8: Careca Limpo (combina com barba!) (Figma #8)
  [
    '................',
    '................',
    '................',
    '................',
  ],
  // 9: Franja Caída Skatista / Casual (Figma #2/#10)
  [
    '....OOOOOOOO....',
    '..OO33222233OO..',
    '.O322111122233O.',
    '.O323322123334O.',
    '.O43O334O33O44O.',
    '..OO........OO..',
    '................',
  ],
];

const HAIRSTYLE_BACK: string[][] = [
  // Curto padrão
  [
    '....OOOOOOOO....',
    '..OO33222233OO..',
    '.OO3221111223OO.',
    '.O322222222234O.',
    '.O333333333344O.',
    '.O333333333344O.',
    '.O444444444444O.',
    '..OO44444444OO..',
    '...OOOOOOOOOO...',
  ],
  // Bob longo
  [
    '....OOOOOOOO....',
    '..OO33222233OO..',
    '.OO3221111223OO.',
    '.O322222222234O.',
    '.O333333333344O.',
    '.O333333333344O.',
    '.O433333333344O.',
    '.O444444444444O.',
    '.OO4444444444OO.',
    '..OOOOOOOOOOOO..',
  ],
  // Rabo de cavalo / Coque
  [
    '.....OOOOOO.....',
    '....OO2112OO....',
    '..OO33222233OO..',
    '.O322222222234O.',
    '.O333311113344O.',
    '..OO33222233OO..',
    '....OO3333OO....',
    '......OOOO......',
  ],
  // Afro atrás
  [
    '..OOOOOOOOOOOO..',
    '.O332211112233O.',
    'O32222222222223O',
    'O33333333333334O',
    'O43333333333334O',
    '.O444444444444O.',
    '..OO44444444OO..',
  ],
];

type HeadwearType = 'NONE' | 'SNAPBACK' | 'CAP_BACKWARDS' | 'BEANIE';
type AccessoryType = 'NONE' | 'GLASSES' | 'SUNGLASSES' | 'MONOCLE' | 'HEADSET' | 'EARPIECE';

function hashNpcVisual(str: string): number {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  h ^= h >>> 16;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35) >>> 0;
  h ^= h >>> 16;
  return h >>> 0;
}

const spriteCache = new Map<string, HTMLCanvasElement>();

function buildSpriteFrameCanvas(
  dir: 'DOWN' | 'UP' | 'LEFT' | 'RIGHT',
  walkState: 0 | 1 | 2,
  skinIdx: number,
  hairStyleIdx: number,
  hairIdx: number,
  outfitIdx: number,
  headwear: HeadwearType,
  hatIdx: number,
  hasBeard: boolean,
  accessoryType: AccessoryType,
  uniforme?: UniformeFuncionario
): HTMLCanvasElement {
  const key = `v5_${dir}_${walkState}_${skinIdx}_${hairStyleIdx}_${hairIdx}_${outfitIdx}_${headwear}_${hatIdx}_${hasBeard ? 1 : 0}_${accessoryType}_${uniforme ?? '-'}`;
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
  const hat = HAT_PALETTES[hatIdx % HAT_PALETTES.length];

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
          ctx.fillStyle = outfit.pants;
          break;
        case 'p':
          ctx.fillStyle = outfit.pantsSh;
          break;
        case 'F':
          ctx.fillStyle = outfit.shoes;
          break;
        default:
          continue;
      }
      ctx.fillRect(drawX, y, 1, 1);
    }
  }

  if (uniforme) drawUniformDetails(ctx, uniforme, dir);

  // Barba estilizada (quando frontal/lateral)
  if (hasBeard && dir !== 'UP') {
    ctx.fillStyle = hair.sh;
    if (dir === 'DOWN') {
      ctx.fillRect(4, 10, 8, 2);
      ctx.fillRect(6, 11, 4, 1);
    } else if (dir === 'RIGHT') {
      ctx.fillRect(7, 10, 4, 2);
    } else {
      ctx.fillRect(5, 10, 4, 2);
    }
  }

  const backStyle =
    hairStyleIdx === 1 || hairStyleIdx === 6
      ? HAIRSTYLE_BACK[1]
      : hairStyleIdx === 4 || hairStyleIdx === 7
      ? HAIRSTYLE_BACK[2]
      : hairStyleIdx === 5
      ? HAIRSTYLE_BACK[3]
      : hairStyleIdx === 8
      ? []
      : HAIRSTYLE_BACK[0];

  const hairRows =
    dir === 'UP'
      ? backStyle
      : HAIRSTYLE_FRONT[hairStyleIdx % HAIRSTYLE_FRONT.length];

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

  // Chapéus / Bonés / Gorros variados (apenas quando headwear !== 'NONE')
  if (headwear !== 'NONE') {
    ctx.fillStyle = RPG_OUTLINE;
    ctx.fillRect(3, 1, 10, 4);
    ctx.fillStyle = hat.base;
    ctx.fillRect(4, 2, 8, 3);
    ctx.fillStyle = hat.hi;
    ctx.fillRect(5, 2, 5, 1);
    if (headwear === 'SNAPBACK') {
      const brimX = dir === 'LEFT' ? 2 : dir === 'RIGHT' ? 5 : 4;
      const brimW = dir === 'DOWN' ? 8 : 9;
      ctx.fillStyle = hat.sh;
      ctx.fillRect(4, 4, 8, 1);
      ctx.fillStyle = hat.brim;
      ctx.fillRect(brimX, 4, brimW, 2);
    } else if (headwear === 'CAP_BACKWARDS') {
      ctx.fillStyle = hat.brim;
      if (dir === 'DOWN') {
        ctx.fillRect(5, 4, 6, 1);
      } else if (dir === 'UP') {
        ctx.fillRect(4, 4, 8, 2);
      } else {
        ctx.fillRect(dir === 'RIGHT' ? 2 : 9, 4, 5, 2);
      }
    } else if (headwear === 'BEANIE') {
      ctx.fillStyle = hat.sh;
      ctx.fillRect(3, 4, 10, 2);
      ctx.fillStyle = hat.hi;
      ctx.fillRect(6, 0, 4, 2); // pompom / dobra
    }
  }

  if (dir !== 'UP') {
    if (accessoryType === 'SUNGLASSES' || accessoryType === 'EARPIECE') {
      // Óculos escuros estilosos
      ctx.fillStyle = RPG_OUTLINE;
      ctx.fillRect(3, 7, 10, 2);
      ctx.fillRect(4, 7, 3, 3);
      ctx.fillRect(9, 7, 3, 3);
      ctx.fillStyle = '#090d16';
      ctx.fillRect(4, 8, 3, 2);
      ctx.fillRect(9, 8, 3, 2);
      ctx.fillStyle = '#38bdf8';
      ctx.fillRect(4, 8, 1, 1); // reflexo discreto na lente
      ctx.fillRect(10, 8, 1, 1);
      if (accessoryType === 'EARPIECE') {
        // Ponto branco de segurança na orelha + fio no pescoço
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(dir === 'LEFT' ? 12 : 2, 8, 2, 2);
        ctx.fillStyle = '#94a3b8';
        ctx.fillRect(dir === 'LEFT' ? 12 : 3, 10, 1, 3);
      }
    } else if (accessoryType === 'GLASSES') {
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

  const isFighting =
    bot.pose === 'FIGHT_STANCE' ||
    bot.pose === 'PUNCH' ||
    bot.pose === 'KICK' ||
    bot.pose === 'BLOCK';

  const isRomance = bot.pose === 'ROMANCE_CUDDLE' || bot.pose === 'ROMANCE_KISS';
  const isPcHype = bot.pose === 'PC_TRIPLE_KILL' || bot.pose === 'PC_LOUCURA';
  const isPcSitting = bot.pose === 'SITTING_PC' || isPcHype;

  const idleOffsetPx =
    bot.pose === 'PC_LOUCURA'
      ? Math.floor((tick + idx * 2) / 3) % 2 === 0
        ? -4
        : -1
      : bot.pose === 'PC_TRIPLE_KILL'
      ? Math.floor((tick + idx * 3) / 5) % 2 === 0
        ? -3
        : 0
      : bot.pose === 'CHEER'
      ? Math.floor((tick + idx * 3) / 6) % 2 === 0
        ? -4
        : 0
      : isFighting
      ? Math.floor((tick + idx * 5) / 7) % 2 === 0
        ? -2
        : 0
      : isRomance
      ? Math.floor((tick + idx * 4) / 14) % 2 === 0
        ? -1
        : 0
      : !andando &&
        !isPcSitting &&
        bot.pose !== 'SITTING_EAT' &&
        bot.pose !== 'SITTING_REST' &&
        Math.floor((tick + idx * 13) / 28) % 2 === 1
      ? -1
      : 0;

  // Hash de alta dispersão FNV-1a (garante que IDs sequenciais nunca gerem clones)
  const h1 = hashNpcVisual(`${bot.id}#${bot.nome}`);
  const h2 = hashNpcVisual(`${bot.nome}@${bot.id}`);
  const h3 = hashNpcVisual(`outfit:${bot.id}:${bot.corRoupa || ''}`);

  const ehSeguranca = bot.uniforme === 'SEGURANCA';
  const ehStaff = !bot.ehCliente && Boolean(bot.uniforme);

  const skinIdx = h1 % SKIN_PALETTES.length;
  const hairStyleIdx = ehSeguranca ? 0 : (h2 % HAIRSTYLE_FRONT.length);
  const hairIdx = ehSeguranca ? 0 : ((h1 >>> 5) % HAIR_PALETTES.length);
  const outfitIdx = h3 % OUTFIT_PALETTES.length;

  const hatRoll = (h2 >>> 7) % 10;
  const headwear: HeadwearType =
    ehSeguranca || ehStaff || isFighting || isRomance || hairStyleIdx >= 4
      ? 'NONE'
      : hatRoll === 0
      ? 'SNAPBACK'
      : hatRoll === 1
      ? 'CAP_BACKWARDS'
      : hatRoll === 2
      ? 'BEANIE'
      : 'NONE';
  const hatIdx = (h3 >>> 9) % HAT_PALETTES.length;
  const hasBeard = ehSeguranca || (!bot.uniforme && !isRomance && hairStyleIdx === 8 && (h1 & 1) === 1);

  const accRoll = (h2 >>> 11) % 12;
  const accessory: AccessoryType = ehSeguranca
    ? 'EARPIECE'
    : isPcSitting || bot.temFone
    ? 'HEADSET'
    : isFighting || isRomance
    ? 'NONE'
    : accRoll <= 2
    ? 'GLASSES'
    : accRoll === 3
    ? 'SUNGLASSES'
    : accRoll === 4
    ? 'MONOCLE'
    : 'NONE';

  const spriteCanvas = buildSpriteFrameCanvas(
    bot.direcao,
    walkState,
    skinIdx,
    hairStyleIdx,
    hairIdx,
    outfitIdx,
    headwear,
    hatIdx,
    hasBeard,
    accessory,
    bot.uniforme
  );

  // Escala inteira 2x: 32x48 unidades lógicas (casando com a malha de Tiles 16x16!)
  const SPRITE_W = 32;
  const SPRITE_H = 48;
  const hypeShakeX =
    bot.pose === 'PC_LOUCURA'
      ? (Math.floor(tick / 2) + idx) % 2 === 0
        ? -2
        : 2
      : bot.pose === 'PC_TRIPLE_KILL'
      ? (Math.floor(tick / 4) + idx) % 2 === 0
        ? -1
        : 1
      : 0;
  const kissLeanX =
    bot.pose === 'ROMANCE_KISS' ? (bot.direcao === 'RIGHT' ? 3 : bot.direcao === 'LEFT' ? -3 : 0) : 0;
  const drawX = Math.round(bot.x - SPRITE_W / 2 + kissLeanX + hypeShakeX);
  const drawY = Math.round(
    bot.y - SPRITE_H + 14 + idleOffsetPx + (bot.pose === 'SITTING_REST' ? 2 : 0)
  );

  // Aura de "Incorporação / Modo Loucura" ou "Triple Kill" atrás do jogador no PC
  if (isPcHype) {
    const ax = Math.round(bot.x + hypeShakeX);
    const ay = Math.round(bot.y + idleOffsetPx);
    const flash = Math.floor(tick / 3) % 2 === 0;
    const aura1 = bot.pose === 'PC_LOUCURA' ? (flash ? '#ef4444' : '#facc15') : flash ? '#facc15' : '#22d3ee';
    const aura2 = bot.pose === 'PC_LOUCURA' ? '#fde047' : '#67e8f9';

    // Halo de energia subindo ao redor do corpo e cabeça
    ctx.fillStyle = aura1;
    ctx.fillRect(ax - 15, ay - 26, 3, 18);
    ctx.fillRect(ax + 12, ay - 26, 3, 18);
    ctx.fillRect(ax - 11, ay - 35, 22, 4);
    ctx.fillStyle = aura2;
    for (let k = 0; k < 4; k++) {
      const faseFogo = (tick * 2 + k * 7 + idx * 5) % 20;
      const fx = ax + (k % 2 === 0 ? -13 : 11) + (k < 2 ? 0 : k === 2 ? 4 : -4);
      const fy = ay - 12 - faseFogo;
      ctx.fillRect(fx, fy, 3, 4);
    }
    if (bot.pose === 'PC_LOUCURA') {
      // Raios pixel art piscando em volta da cabeça ("saiyajin / incorporou")
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(ax - 18, ay - 30 + (flash ? 0 : 4), 4, 2);
      ctx.fillRect(ax + 14, ay - 28 + (flash ? 4 : 0), 4, 2);
      ctx.fillStyle = '#fde047';
      ctx.fillRect(ax - 16, ay - 32 + (flash ? 0 : 4), 2, 6);
      ctx.fillRect(ax + 14, ay - 30 + (flash ? 4 : 0), 2, 6);
    }
  }

  if (bot.pose !== 'SITTING_EAT' && bot.pose !== 'SITTING_REST') {
    ctx.fillStyle = 'rgba(34, 24, 46, 0.34)';
    ctx.fillRect(drawX + 6, Math.round(bot.y + 6), 20, 6);
    ctx.fillRect(drawX + 4, Math.round(bot.y + 8), 24, 2);
  }

  ctx.drawImage(spriteCanvas, drawX, drawY, SPRITE_W, SPRITE_H);

  if (bot.pose === 'SITTING_REST') {
    const cx = Math.round(bot.x);
    const cy = Math.round(bot.y);
    // Celular iluminado ou latinha na mão descansando no sofá
    const usaCel = idx % 2 === 0;
    if (usaCel) {
      ctx.fillStyle = RPG_OUTLINE;
      ctx.fillRect(cx + 2, cy - 11, 7, 9);
      ctx.fillStyle = Math.floor(tick / 15) % 2 === 0 ? '#38bdf8' : '#22d3ee';
      ctx.fillRect(cx + 3, cy - 10, 5, 7);
    } else {
      ctx.fillStyle = RPG_OUTLINE;
      ctx.fillRect(cx - 7, cy - 11, 6, 8);
      ctx.fillStyle = '#10b981';
      ctx.fillRect(cx - 6, cy - 10, 4, 6);
    }
  }

  if (bot.pose === 'PLAY_POOL') {
    const cx = Math.round(bot.x);
    const cy = Math.round(bot.y + idleOffsetPx);
    const cyc = tick % 90;
    // Recua e dá a tacada sincronizada com a bola da sinuca
    const thrust = cyc >= 12 && cyc < 22 ? Math.round(((cyc - 12) / 10) * 6) : cyc >= 22 && cyc < 30 ? 4 : 0;
    ctx.fillStyle = RPG_OUTLINE;
    if (bot.direcao === 'RIGHT') {
      const tx = cx + 4 + thrust;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(tx - 10, cy - 10, 18, 3);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(tx + 8, cy - 9, 14, 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(tx + 22, cy - 9, 3, 2);
    } else if (bot.direcao === 'LEFT') {
      const tx = cx - 4 - thrust;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(tx - 8, cy - 10, 18, 3);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(tx - 22, cy - 9, 14, 2);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(tx - 25, cy - 9, 3, 2);
    } else {
      const ty = cy - 4 + thrust;
      ctx.fillStyle = '#78350f';
      ctx.fillRect(cx + 4, ty - 10, 3, 14);
      ctx.fillStyle = '#d97706';
      ctx.fillRect(cx + 4, ty + 4, 2, 10);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(cx + 4, ty + 14, 2, 3);
    }
  }

  if (isRomance) {
    const cx = Math.round(bot.x + kissLeanX);
    const cy = Math.round(bot.y + idleOffsetPx);
    const lDir = bot.direcao === 'LEFT' ? -1 : 1;
    // Bochechas coradas
    ctx.fillStyle = '#fda4af';
    ctx.fillRect(cx + lDir * 3 - 1, cy - 19, 3, 2);
    // Braço abraçando
    ctx.fillStyle = bot.corRoupa || '#f43f5e';
    ctx.fillRect(cx + lDir * 4 - 2, cy - 12, 7, 3);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(cx + lDir * 7 - 1, cy - 12, 3, 3);
    if (bot.pose === 'ROMANCE_KISS' && Math.floor(tick / 10) % 2 === 0) {
      // Mini coração entre os lábios
      const hx = cx + lDir * 9 - 2;
      const hy = cy - 23;
      ctx.fillStyle = '#f43f5e';
      ctx.fillRect(hx, hy, 2, 2);
      ctx.fillRect(hx + 3, hy, 2, 2);
      ctx.fillRect(hx + 1, hy + 1, 3, 2);
    }
  }

  if (isPcSitting) {
    const cx = Math.round(bot.x + hypeShakeX);
    const cy = Math.round(bot.y + idleOffsetPx);
    const baseY = Math.round(bot.y);

    // Headset Gamer RGB visível de costas na cabeça do jogador sentado
    const hsCor = isPcHype
      ? Math.floor(tick / 4) % 2 === 0
        ? '#facc15'
        : '#ef4444'
      : '#38bdf8';
    ctx.fillStyle = RPG_OUTLINE;
    ctx.fillRect(cx - 11, cy - 23, 3, 7);
    ctx.fillRect(cx + 8, cy - 23, 3, 7);
    ctx.fillStyle = hsCor;
    ctx.fillRect(cx - 10, cy - 22, 2, 5);
    ctx.fillRect(cx + 8, cy - 22, 2, 5);

    // Encosto da cadeira gamer
    ctx.fillStyle = RPG_OUTLINE;
    ctx.fillRect(cx - 12, baseY - 8, 24, 14);
    ctx.fillStyle = isPcHype ? '#312e81' : '#1e293b';
    ctx.fillRect(cx - 10, baseY - 6, 20, 10);
    ctx.fillStyle = isPcHype ? hsCor : '#38bdf8';
    ctx.fillRect(cx - 8, baseY - 4, 2, 6);
    ctx.fillRect(cx + 6, baseY - 4, 2, 6);

    if (isPcHype) {
      // Braços erguidos comemorando / enlouquecendo na frente do PC ("incorporando")
      const waveL =
        bot.pose === 'PC_LOUCURA'
          ? Math.floor(tick / 3) % 2 === 0
            ? -5
            : 2
          : Math.floor(tick / 6) % 2 === 0
          ? -3
          : 0;
      const waveR =
        bot.pose === 'PC_LOUCURA'
          ? Math.floor(tick / 3) % 2 === 0
            ? 2
            : -5
          : waveL;
      const armCol = bot.corRoupa || '#38bdf8';

      ctx.fillStyle = RPG_OUTLINE;
      ctx.fillRect(cx - 15, cy - 27 + waveL, 6, 10);
      ctx.fillRect(cx + 9, cy - 27 + waveR, 6, 10);
      ctx.fillStyle = armCol;
      ctx.fillRect(cx - 13, cy - 23 + waveL, 4, 5);
      ctx.fillRect(cx + 9, cy - 23 + waveR, 4, 5);
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(cx - 14, cy - 27 + waveL, 4, 4);
      ctx.fillRect(cx + 10, cy - 27 + waveR, 4, 4);

      // Faíscas / estrelas de impacto saindo dos punhos
      ctx.fillStyle = Math.floor(tick / 3) % 2 === 0 ? '#fde047' : '#22d3ee';
      ctx.fillRect(cx - 16, cy - 31 + waveL, 3, 3);
      ctx.fillRect(cx + 13, cy - 31 + waveR, 3, 3);
    }
  }

  if (bot.pose === 'SITTING_EAT') {
    const cx = Math.round(bot.x);
    const cy = Math.round(bot.y);
    const mordida = Math.floor(tick / 12) % 2 === 0 ? -1 : 0;
    // Prato / lanche na mesa diante do cliente
    const dirY = bot.direcao === 'UP' ? -15 : 6;
    ctx.fillStyle = RPG_OUTLINE;
    ctx.fillRect(cx - 5, cy + dirY, 10, 6);
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(cx - 4, cy + dirY + 1, 8, 4);
    ctx.fillStyle = '#f97316';
    ctx.fillRect(cx - 2, cy + dirY - 2 + mordida, 5, 4);
    // Encosto da cadeira ao sentar de costas na fileira sul
    if (bot.direcao === 'UP') {
      ctx.fillStyle = RPG_OUTLINE;
      ctx.fillRect(cx - 9, cy - 5, 18, 10);
      ctx.fillStyle = '#2563eb';
      ctx.fillRect(cx - 7, cy - 3, 14, 6);
    }
  }

  if (bot.pose === 'CHEER') {
    const cx = Math.round(bot.x);
    const cy = Math.round(bot.y + idleOffsetPx);
    const wave = Math.floor(tick / 7) % 2 === 0 ? -2 : 0;
    const armCol = bot.corRoupa || '#38bdf8';
    // Braços erguidos vibrando na torcida / vitória
    ctx.fillStyle = RPG_OUTLINE;
    ctx.fillRect(cx - 14, cy - 26 + wave, 6, 10);
    ctx.fillRect(cx + 8, cy - 26 - wave, 6, 10);
    ctx.fillStyle = armCol;
    ctx.fillRect(cx - 12, cy - 22 + wave, 4, 5);
    ctx.fillRect(cx + 8, cy - 22 - wave, 4, 5);
    ctx.fillStyle = '#fed7aa';
    ctx.fillRect(cx - 13, cy - 26 + wave, 4, 4);
    ctx.fillRect(cx + 9, cy - 26 - wave, 4, 4);
  }

  if (isFighting) {
    const cx = Math.round(bot.x);
    const cy = Math.round(bot.y + idleOffsetPx);
    const fDir = bot.direcao === 'LEFT' ? -1 : 1;
    const isRedCorner = bot.corRoupa === '#dc2626' || bot.corRoupa === '#e11d48';
    const gloveCol = isRedCorner ? '#ef4444' : '#3b82f6';
    const gloveLight = isRedCorner ? '#fca5a5' : '#93c5fd';

    // Faixa de lutador na testa
    ctx.fillStyle = RPG_OUTLINE;
    ctx.fillRect(cx - 8, cy - 27, 16, 4);
    ctx.fillStyle = gloveCol;
    ctx.fillRect(cx - 7, cy - 26, 14, 2);

    if (bot.pose === 'PUNCH') {
      const gx = fDir === 1 ? cx + 10 : cx - 18;
      const gy = cy - 12;
      // Braço estendido + luva grande + feixe de impacto
      ctx.fillStyle = '#fed7aa';
      ctx.fillRect(fDir === 1 ? cx + 3 : cx - 10, gy + 2, 8, 4);
      ctx.fillStyle = RPG_OUTLINE;
      ctx.fillRect(gx - 1, gy - 1, 9, 8);
      ctx.fillStyle = gloveCol;
      ctx.fillRect(gx, gy, 7, 6);
      ctx.fillStyle = gloveLight;
      ctx.fillRect(gx + 1, gy + 1, 3, 2);
      // Estouro de soco
      const pxTip = fDir === 1 ? gx + 9 : gx - 6;
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(pxTip, gy + 1, 5, 4);
      ctx.fillStyle = '#f97316';
      ctx.fillRect(pxTip + fDir * 2, gy - 2, 3, 2);
      ctx.fillRect(pxTip + fDir * 2, gy + 6, 3, 2);
    } else if (bot.pose === 'KICK') {
      const kx = fDir === 1 ? cx + 7 : cx - 18;
      const ky = cy - 3;
      // Perna chutando alto + rastro de velocidade
      ctx.fillStyle = RPG_OUTLINE;
      ctx.fillRect(kx, ky - 1, 11, 6);
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(kx + 1, ky, 9, 4);
      ctx.fillStyle = '#22d3ee';
      ctx.fillRect(fDir === 1 ? kx + 10 : kx - 5, ky - 3, 5, 3);
      ctx.fillStyle = '#fef08a';
      ctx.fillRect(fDir === 1 ? kx + 11 : kx - 4, ky + 1, 4, 4);
      // Guarda recolhida
      ctx.fillStyle = gloveCol;
      ctx.fillRect(cx + fDir * 4 - 3, cy - 15, 6, 6);
    } else if (bot.pose === 'BLOCK') {
      // Luvas erguidas protegendo o rosto
      ctx.fillStyle = RPG_OUTLINE;
      ctx.fillRect(cx + fDir * 5 - 4, cy - 20, 9, 10);
      ctx.fillStyle = gloveCol;
      ctx.fillRect(cx + fDir * 5 - 3, cy - 19, 7, 8);
      ctx.fillStyle = gloveLight;
      ctx.fillRect(cx + fDir * 5 - 2, cy - 18, 4, 3);
    } else {
      // FIGHT_STANCE: duas luvas alternando na guarda
      const jab = Math.floor(tick / 8) % 2 === 0 ? 1 : -1;
      ctx.fillStyle = RPG_OUTLINE;
      ctx.fillRect(cx + fDir * 7 - 3, cy - 14 + jab, 7, 7);
      ctx.fillRect(cx + fDir * 2 - 3, cy - 11 - jab, 6, 6);
      ctx.fillStyle = gloveCol;
      ctx.fillRect(cx + fDir * 7 - 2, cy - 13 + jab, 5, 5);
      ctx.fillRect(cx + fDir * 2 - 2, cy - 10 - jab, 4, 4);
    }
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
