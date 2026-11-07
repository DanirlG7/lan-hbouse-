import React from 'react';

interface AvatarProps {
  seed: number;
  size?: number;
  className?: string;
}

const SKIN_TONES = [
  { base: '#fbd3b4', shadow: '#e2a882', light: '#ffe8d6' },
  { base: '#f1c27d', shadow: '#d19b52', light: '#ffdbac' },
  { base: '#e0ac69', shadow: '#b88141', light: '#f3c68f' },
  { base: '#c68642', shadow: '#996024', light: '#dda15e' },
  { base: '#8d5524', shadow: '#643811', light: '#ad713c' },
];
const HAIR_PALETTES = [
  { base: '#9a3412', dark: '#5c1d08', light: '#ea580c' }, // Castanho avermelhado (Daniel)
  { base: '#1e293b', dark: '#0f172a', light: '#475569' }, // Preto azulado
  { base: '#b45309', dark: '#78350f', light: '#f59e0b' }, // Loiro mel
  { base: '#991b1b', dark: '#5f1010', light: '#ef4444' }, // Ruivo
  { base: '#581c87', dark: '#3b0764', light: '#a855f7' }, // Roxo neon
  { base: '#3f3f46', dark: '#18181b', light: '#71717a' }, // Cinza
];
const JACKET_PALETTES = [
  { base: '#2563eb', dark: '#1e3a8a', collar: '#eff6ff' },
  { base: '#0284c7', dark: '#0c4a6e', collar: '#e0f2fe' },
  { base: '#059669', dark: '#064e3b', collar: '#d1fae5' },
  { base: '#7c3aed', dark: '#4c1d95', collar: '#ede9fe' },
  { base: '#e11d48', dark: '#881337', collar: '#ffe4e6' },
  { base: '#d97706', dark: '#78350f', collar: '#fef3c7' },
];

export const PixelAvatar: React.FC<AvatarProps> = ({ seed, size = 42, className = '' }) => {
  const skin = SKIN_TONES[seed % SKIN_TONES.length];
  const hair = HAIR_PALETTES[(seed * 3) % HAIR_PALETTES.length];
  const jacket = JACKET_PALETTES[(seed * 5) % JACKET_PALETTES.length];
  const hasGlasses = seed % 5 === 0;
  const hasHeadset = seed % 3 === 1;
  const longHair = seed % 2 === 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      shapeRendering="crispEdges"
      className={className}
      style={{ imageRendering: 'pixelated', flexShrink: 0 }}
    >
      {/* Moldura interna degradê escuro estilo RPG */}
      <rect width="20" height="20" fill="#0f172a" />
      <rect x="1" y="1" width="18" height="18" fill="#1b2a4a" />
      <rect x="2" y="2" width="16" height="16" fill="#233862" />

      {/* Cabelo longo atrás */}
      {longHair && (
        <>
          <rect x="4" y="6" width="12" height="11" fill={hair.dark} />
          <rect x="5" y="6" width="10" height="10" fill={hair.base} />
        </>
      )}

      {/* Contorno & Corpo / Jaqueta com Gola (estilo Daniel das imagens!) */}
      <rect x="3" y="14" width="14" height="5" fill="#090d16" />
      <rect x="4" y="15" width="12" height="4" fill={jacket.dark} />
      <rect x="5" y="15" width="10" height="4" fill={jacket.base} />
      {/* Camisa interna branca + gola */}
      <rect x="8" y="15" width="4" height="4" fill="#f8fafc" />
      <rect x="6" y="14" width="2" height="2" fill={jacket.collar} />
      <rect x="12" y="14" width="2" height="2" fill={jacket.collar} />

      {/* Pescoço com sombra */}
      <rect x="8" y="12" width="4" height="3" fill={skin.shadow} />
      <rect x="8" y="12" width="3" height="2" fill={skin.base} />

      {/* Rosto sombreado */}
      <rect x="5" y="5" width="10" height="8" fill="#0f172a" />
      <rect x="6" y="6" width="8" height="7" fill={skin.base} />
      <rect x="6" y="6" width="1" height="6" fill={skin.light} />
      <rect x="13" y="7" width="1" height="5" fill={skin.shadow} />
      <rect x="7" y="12" width="6" height="1" fill={skin.shadow} />

      {/* Olhos estilo Stardew / Anime Pixel com brilho */}
      <rect x="6" y="8" width="3" height="3" fill="#ffffff" />
      <rect x="11" y="8" width="3" height="3" fill="#ffffff" />
      <rect x="7" y="8" width="2" height="3" fill="#1e293b" />
      <rect x="12" y="8" width="2" height="3" fill="#1e293b" />
      <rect x="7" y="8" width="1" height="1" fill="#ffffff" />
      <rect x="12" y="8" width="1" height="1" fill="#ffffff" />

      {/* Bochechas + Sorriso */}
      <rect x="6" y="11" width="1" height="1" fill="#f472b6" opacity="0.65" />
      <rect x="13" y="11" width="1" height="1" fill="#f472b6" opacity="0.65" />
      <rect x="9" y="11" width="2" height="1" fill="#9a3412" />

      {/* Cabelo Topo volumoso com luz (Highlight) */}
      <rect x="4" y="3" width="12" height="4" fill={hair.dark} />
      <rect x="5" y="2" width="10" height="4" fill={hair.base} />
      <rect x="6" y="3" width="6" height="2" fill={hair.light} />
      {/* Franja */}
      <rect x="5" y="6" width="3" height="2" fill={hair.base} />
      <rect x="8" y="6" width="2" height="1" fill={hair.light} />
      <rect x="11" y="6" width="4" height="2" fill={hair.base} />
      <rect x="4" y="5" width="2" height="4" fill={hair.dark} />
      <rect x="14" y="5" width="2" height="4" fill={hair.dark} />

      {hasGlasses && (
        <>
          <rect x="6" y="8" width="3" height="1" fill="#38bdf8" />
          <rect x="11" y="8" width="3" height="1" fill="#38bdf8" />
          <rect x="9" y="8" width="2" height="1" fill="#0284c7" />
        </>
      )}

      {hasHeadset && (
        <>
          <rect x="4" y="3" width="12" height="1" fill="#38bdf8" />
          <rect x="3" y="7" width="2" height="4" fill="#0284c7" />
          <rect x="15" y="7" width="2" height="4" fill="#0284c7" />
          <rect x="3" y="8" width="1" height="2" fill="#7dd3fc" />
          <rect x="16" y="8" width="1" height="2" fill="#7dd3fc" />
        </>
      )}
    </svg>
  );
};

export type DockIconType =
  | 'pc'
  | 'clients'
  | 'store'
  | 'upgrades'
  | 'staff'
  | 'stats'
  | 'trophy'
  | 'settings'
  | 'soda'
  | 'pizza'
  | 'energy'
  | 'coffee'
  | 'headset'
  | 'mouse'
  | 'burger'
  | 'electrical'
  | 'cctv'
  | 'ac'
  | 'printer'
  | 'console'
  | 'monitor'
  | 'cpu'
  | 'gpu';

export const PixelIcon: React.FC<{ name: DockIconType; size?: number }> = ({
  name,
  size = 28,
}) => {
  switch (name) {
    case 'pc':
    case 'monitor':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="2" y="2" width="12" height="9" fill="#1e3a8a" />
          <rect x="3" y="3" width="10" height="7" fill="#38bdf8" />
          <rect x="4" y="4" width="4" height="2" fill="#bae6fd" />
          <rect x="6" y="11" width="4" height="2" fill="#64748b" />
          <rect x="4" y="13" width="8" height="2" fill="#94a3b8" />
        </svg>
      );
    case 'upgrades':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="7" y="2" width="2" height="2" fill="#86efac" />
          <rect x="5" y="4" width="6" height="2" fill="#4ade80" />
          <rect x="3" y="6" width="10" height="2" fill="#22c55e" />
          <rect x="6" y="8" width="4" height="6" fill="#16a34a" />
        </svg>
      );
    case 'clients':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="5" y="2" width="6" height="5" fill="#fbbf24" />
          <rect x="6" y="3" width="4" height="4" fill="#fde68a" />
          <rect x="3" y="8" width="10" height="6" fill="#38bdf8" />
          <rect x="5" y="9" width="6" height="4" fill="#0284c7" />
        </svg>
      );
    case 'store':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="2" y="3" width="2" height="2" fill="#e2e8f0" />
          <rect x="4" y="4" width="10" height="6" fill="#94a3b8" />
          <rect x="5" y="5" width="8" height="4" fill="#cbd5e1" />
          <rect x="5" y="11" width="2" height="3" fill="#facc15" />
          <rect x="10" y="11" width="2" height="3" fill="#facc15" />
        </svg>
      );
    case 'staff':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="3" y="3" width="4" height="4" fill="#f59e0b" />
          <rect x="9" y="3" width="4" height="4" fill="#38bdf8" />
          <rect x="2" y="8" width="6" height="6" fill="#d97706" />
          <rect x="8" y="8" width="6" height="6" fill="#0284c7" />
        </svg>
      );
    case 'stats':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="3" y="2" width="10" height="12" fill="#cbd5e1" />
          <rect x="4" y="3" width="8" height="10" fill="#f8fafc" />
          <rect x="5" y="8" width="2" height="4" fill="#38bdf8" />
          <rect x="8" y="5" width="2" height="7" fill="#16a34a" />
          <rect x="6" y="1" width="4" height="2" fill="#64748b" />
        </svg>
      );
    case 'trophy':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="4" y="2" width="8" height="6" fill="#facc15" />
          <rect x="2" y="3" width="2" height="3" fill="#eab308" />
          <rect x="12" y="3" width="2" height="3" fill="#eab308" />
          <rect x="6" y="8" width="4" height="3" fill="#ca8a04" />
          <rect x="4" y="11" width="8" height="3" fill="#eab308" />
        </svg>
      );
    case 'settings':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="6" y="2" width="4" height="12" fill="#a855f7" />
          <rect x="2" y="6" width="12" height="4" fill="#a855f7" />
          <rect x="4" y="4" width="8" height="8" fill="#c084fc" />
          <rect x="6" y="6" width="4" height="4" fill="#1e1b4b" />
        </svg>
      );
    case 'electrical':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="2" y="2" width="12" height="12" fill="#475569" />
          <rect x="3" y="3" width="10" height="10" fill="#64748b" />
          <rect x="7" y="4" width="2" height="4" fill="#facc15" />
          <rect x="6" y="7" width="4" height="2" fill="#facc15" />
          <rect x="7" y="9" width="2" height="3" fill="#facc15" />
        </svg>
      );
    case 'cctv':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="3" y="5" width="9" height="4" fill="#cbd5e1" />
          <rect x="11" y="6" width="3" height="2" fill="#0f172a" />
          <rect x="13" y="6" width="1" height="1" fill="#ef4444" />
          <rect x="4" y="9" width="2" height="4" fill="#64748b" />
        </svg>
      );
    case 'ac':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="2" y="3" width="12" height="5" fill="#e2e8f0" />
          <rect x="3" y="6" width="10" height="1" fill="#64748b" />
          <rect x="4" y="9" width="1" height="4" fill="#38bdf8" />
          <rect x="8" y="9" width="1" height="4" fill="#38bdf8" />
          <rect x="12" y="9" width="1" height="4" fill="#38bdf8" />
        </svg>
      );
    case 'printer':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="5" y="2" width="6" height="3" fill="#f8fafc" />
          <rect x="2" y="5" width="12" height="6" fill="#475569" />
          <rect x="5" y="10" width="6" height="4" fill="#e2e8f0" />
          <rect x="11" y="6" width="1" height="1" fill="#4ade80" />
        </svg>
      );
    case 'console':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="2" y="5" width="12" height="5" fill="#334155" />
          <rect x="2" y="9" width="3" height="3" fill="#334155" />
          <rect x="11" y="9" width="3" height="3" fill="#334155" />
          <rect x="4" y="7" width="2" height="1" fill="#94a3b8" />
          <rect x="11" y="6" width="1" height="1" fill="#4ade80" />
          <rect x="12" y="7" width="1" height="1" fill="#ef4444" />
        </svg>
      );
    case 'cpu':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="3" y="3" width="10" height="10" fill="#0f766e" />
          <rect x="5" y="5" width="6" height="6" fill="#cbd5e1" />
          <rect x="6" y="6" width="4" height="2" fill="#f97316" />
        </svg>
      );
    case 'gpu':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="2" y="4" width="12" height="8" fill="#1e293b" />
          <rect x="4" y="5" width="3" height="6" fill="#ef4444" />
          <rect x="9" y="5" width="3" height="6" fill="#ef4444" />
        </svg>
      );
    case 'soda':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="5" y="3" width="6" height="11" fill="#ef4444" />
          <rect x="5" y="2" width="6" height="2" fill="#cbd5e1" />
          <rect x="5" y="7" width="6" height="2" fill="#ffffff" />
        </svg>
      );
    case 'pizza':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="3" y="3" width="10" height="3" fill="#d97706" />
          <rect x="4" y="6" width="8" height="4" fill="#facc15" />
          <rect x="6" y="10" width="4" height="3" fill="#facc15" />
          <rect x="6" y="7" width="2" height="2" fill="#dc2626" />
          <rect x="9" y="6" width="2" height="2" fill="#dc2626" />
        </svg>
      );
    case 'energy':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="5" y="2" width="6" height="12" fill="#10b981" />
          <rect x="7" y="5" width="2" height="6" fill="#facc15" />
        </svg>
      );
    case 'headset':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="4" y="3" width="8" height="2" fill="#38bdf8" />
          <rect x="3" y="5" width="2" height="6" fill="#0284c7" />
          <rect x="11" y="5" width="2" height="6" fill="#0284c7" />
          <rect x="2" y="8" width="3" height="4" fill="#a855f7" />
          <rect x="11" y="8" width="3" height="4" fill="#a855f7" />
        </svg>
      );
    case 'mouse':
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="5" y="3" width="6" height="10" fill="#475569" />
          <rect x="7" y="4" width="2" height="3" fill="#38bdf8" />
          <rect x="5" y="11" width="6" height="2" fill="#ec4899" />
        </svg>
      );
    default:
      return (
        <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
          <rect x="4" y="4" width="8" height="8" fill="#f59e0b" />
          <rect x="5" y="6" width="6" height="2" fill="#ef4444" />
        </svg>
      );
  }
};
