import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
}

/**
 * Ilustrações Vetoriais em Alta Definição (HD / SVG) para
 * Melhorias & Infraestrutura do Estabelecimento (RN10).
 */

// 1. QUADRO ELÉTRICO TRIFÁSICO (Painel Elétrico com Disjuntores e Raio Neon)
export const UpgradeHdElectrical: React.FC<IconProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="elecBox" x1="12" y1="8" x2="52" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1e293b" />
        <stop offset="0.5" stopColor="#0f172a" />
        <stop offset="1" stopColor="#020617" />
      </linearGradient>
      <linearGradient id="elecDoor" x1="16" y1="12" x2="48" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#334155" />
        <stop offset="1" stopColor="#1e293b" />
      </linearGradient>
      <linearGradient id="neonBolt" x1="26" y1="20" x2="38" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fde047" />
        <stop offset="0.5" stopColor="#eab308" />
        <stop offset="1" stopColor="#ca8a04" />
      </linearGradient>
      <filter id="boltGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor="#facc15" floodOpacity="0.8" />
      </filter>
    </defs>
    {/* Caixa Externa de Aço */}
    <rect x="10" y="8" width="44" height="48" rx="6" fill="url(#elecBox)" stroke="#38bdf8" strokeWidth="1.5" />
    {/* Porta Interna do Painel */}
    <rect x="14" y="12" width="36" height="40" rx="4" fill="url(#elecDoor)" stroke="#475569" strokeWidth="1" />
    {/* Trilho de Disjuntores Topo */}
    <rect x="18" y="16" width="6" height="10" rx="1.5" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
    <rect x="26" y="16" width="6" height="10" rx="1.5" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
    <rect x="34" y="16" width="6" height="10" rx="1.5" fill="#0f172a" stroke="#64748b" strokeWidth="0.8" />
    <rect x="42" y="16" width="4" height="10" rx="1" fill="#22c55e" />
    {/* Display Digital de Tensão */}
    <rect x="18" y="29" width="28" height="18" rx="3" fill="#090d16" stroke="#1e293b" strokeWidth="1" />
    {/* Raio Neon Central com Glow */}
    <path
      d="M33 31L26 39h7l-3 7 9-9h-7l3-6h-2z"
      fill="url(#neonBolt)"
      filter="url(#boltGlow)"
    />
    {/* LEDs de Status Trifásico (R, S, T) */}
    <circle cx="21" cy="50" r="1.5" fill="#22c55e" />
    <circle cx="32" cy="50" r="1.5" fill="#22c55e" />
    <circle cx="43" cy="50" r="1.5" fill="#22c55e" />
  </svg>
);

// 2. SISTEMA DE SEGURANÇA CFTV (Câmera PTZ / Bullet com Lente e LED de Gravação)
export const UpgradeHdCctv: React.FC<IconProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="camBody" x1="16" y1="16" x2="48" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f8fafc" />
        <stop offset="0.6" stopColor="#cbd5e1" />
        <stop offset="1" stopColor="#94a3b8" />
      </linearGradient>
      <linearGradient id="lensGrad" x1="42" y1="20" x2="52" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0ea5e9" />
        <stop offset="0.5" stopColor="#0369a1" />
        <stop offset="1" stopColor="#082f49" />
      </linearGradient>
    </defs>
    {/* Suporte de Parede */}
    <path d="M10 38V18h4v20H10z" fill="#475569" />
    <path d="M14 24h12l4 4H14v-4z" fill="#64748b" />
    {/* Articulação / Base Giratória */}
    <circle cx="26" cy="27" r="4" fill="#334155" stroke="#64748b" strokeWidth="1" />
    {/* Corpo Cilíndrico da Câmera */}
    <path
      d="M20 22h24l6 4v10l-6 4H20c-2.2 0-4-1.8-4-4V26c0-2.2 1.8-4 4-4z"
      fill="url(#camBody)"
      stroke="#1e293b"
      strokeWidth="1.2"
    />
    {/* Visor / Lente Óptica Frontal */}
    <ellipse cx="45" cy="29" rx="5" ry="8" fill="url(#lensGrad)" stroke="#38bdf8" strokeWidth="1.2" />
    <ellipse cx="44.5" cy="27.5" rx="2" ry="3.5" fill="#ffffff" opacity="0.75" />
    {/* LED de Gravação Ativa (REC) */}
    <circle cx="36" cy="25" r="1.8" fill="#ef4444" />
    <circle cx="36" cy="25" r="3.5" fill="none" stroke="#ef4444" strokeWidth="0.8" opacity="0.6" />
    {/* Feixe Infravermelho Sutil */}
    <path
      d="M48 24l10-4v18l-10-4"
      fill="rgba(56, 189, 248, 0.12)"
    />
  </svg>
);

// 3. AR-CONDICIONADO CLIMATIZADO (Split Inverter com Fluxo Gelado e Display)
export const UpgradeHdAc: React.FC<IconProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="acBody" x1="10" y1="18" x2="54" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ffffff" />
        <stop offset="0.6" stopColor="#e2e8f0" />
        <stop offset="1" stopColor="#cbd5e1" />
      </linearGradient>
    </defs>
    {/* Unidade Evaporadora */}
    <rect x="8" y="18" width="48" height="22" rx="4" fill="url(#acBody)" stroke="#94a3b8" strokeWidth="1.2" />
    {/* Friso Cromado */}
    <line x1="8" y1="33" x2="56" y2="33" stroke="#64748b" strokeWidth="0.8" />
    {/* Display LED Digital 18°C */}
    <rect x="42" y="22" width="11" height="6" rx="1.5" fill="#0f172a" />
    <text x="47.5" y="27" fill="#38bdf8" fontSize="4.5" fontWeight="800" textAnchor="middle">
      18°C
    </text>
    {/* Aleta Inferior de Ar */}
    <rect x="12" y="36" width="40" height="2.5" rx="1" fill="#475569" />
    {/* Ondas de Fluxo Gelado */}
    <path
      d="M16 43c2 2 5 2 7 0s5-2 7 0M26 47c2 2 5 2 7 0s5-2 7 0M18 51c2 2 5 2 7 0s5-2 7 0"
      stroke="#38bdf8"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.8"
    />
    {/* Cristal de Gelo / Floco */}
    <circle cx="16" cy="25" r="1.5" fill="#38bdf8" />
  </svg>
);

// 4. BANCADAS GAMER RGB (Mesa Gamer com Iluminação Neon)
export const UpgradeHdDesk: React.FC<IconProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="rgbDesk" x1="10" y1="28" x2="54" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00f2fe" />
        <stop offset="0.5" stopColor="#a855f7" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    {/* Monitor sobre a mesa */}
    <rect x="22" y="14" width="20" height="13" rx="2" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
    <rect x="24" y="16" width="16" height="9" fill="#1e293b" />
    <path d="M30 27h4v4h-4z" fill="#475569" />
    <path d="M27 31h10v1.5H27z" fill="#334155" />
    {/* Tampo de Fibra de Carbono */}
    <rect x="10" y="32" width="44" height="5" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />
    {/* Fita de LED RGB sob a borda da mesa */}
    <rect x="12" y="37" width="40" height="2.5" rx="1" fill="url(#rgbDesk)" />
    {/* Pés em 'Z' Metálicos */}
    <path d="M14 39l-4 15h4l4-15h-4z" fill="#475569" />
    <path d="M50 39l4 15h-4l-4-15h4z" fill="#475569" />
    <rect x="8" y="53" width="10" height="2" rx="1" fill="#334155" />
    <rect x="46" y="53" width="10" height="2" rx="1" fill="#334155" />
  </svg>
);

// 5. CENTRAL DE IMPRESSÃO LASER (Multifuncional com Painel Touchscreen)
export const UpgradeHdPrinter: React.FC<IconProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="printBody" x1="14" y1="20" x2="50" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f8fafc" />
        <stop offset="0.7" stopColor="#cbd5e1" />
        <stop offset="1" stopColor="#94a3b8" />
      </linearGradient>
    </defs>
    {/* Bandeja de Alimentação Superior / Scanner */}
    <rect x="18" y="14" width="28" height="6" rx="2" fill="#475569" stroke="#64748b" strokeWidth="0.8" />
    <rect x="22" y="10" width="20" height="4" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
    {/* Corpo Principal da Impressora */}
    <rect x="12" y="20" width="40" height="26" rx="4" fill="url(#printBody)" stroke="#334155" strokeWidth="1.2" />
    {/* Painel Touchscreen Iluminado */}
    <rect x="36" y="24" width="12" height="7" rx="1.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" />
    <circle cx="42" cy="27.5" r="1.5" fill="#22c55e" />
    {/* Bandeja de Saída de Folha Impressa */}
    <rect x="18" y="32" width="28" height="4" rx="1" fill="#1e293b" />
    <path d="M22 34h20v8H22z" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
    <line x1="25" y1="37" x2="35" y2="37" stroke="#0284c7" strokeWidth="1" />
    <line x1="25" y1="39" x2="32" y2="39" stroke="#94a3b8" strokeWidth="0.8" />
    {/* Bandeja de Gaveta Inferior */}
    <rect x="14" y="47" width="36" height="4" rx="1" fill="#334155" />
  </svg>
);

// 6. LOUNGE DE CONSOLES NEXT-GEN (Console Slim + Controle com Grip)
export const UpgradeHdConsole: React.FC<IconProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="consoleGrad" x1="12" y1="16" x2="32" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f8fafc" />
        <stop offset="0.5" stopColor="#e2e8f0" />
        <stop offset="1" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="padGrad" x1="24" y1="30" x2="52" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#334155" />
        <stop offset="1" stopColor="#0f172a" />
      </linearGradient>
    </defs>
    {/* Console Vertical com Barra de LED Azul */}
    <path d="M14 14h10l-2 36H12z" fill="url(#consoleGrad)" stroke="#38bdf8" strokeWidth="1" />
    <line x1="19" y1="15" x2="17" y2="49" stroke="#00f2fe" strokeWidth="1.2" />
    {/* Controle Gamer Wireless em Destaque */}
    <path
      d="M26 36c-3 0-5 2-5 5 0 3 2 11 5 11 2 0 3-3 5-3h8c2 0 3 3 5 3 3 0 5-8 5-11 0-3-2-5-5-5H26z"
      fill="url(#padGrad)"
      stroke="#64748b"
      strokeWidth="1.2"
    />
    {/* D-Pad e Botões de Ação */}
    <circle cx="28" cy="41" r="2.5" fill="#1e293b" stroke="#94a3b8" strokeWidth="0.6" />
    <circle cx="46" cy="41" r="2.5" fill="#1e293b" />
    <circle cx="46" cy="39" r="0.8" fill="#f43f5e" />
    <circle cx="48" cy="41" r="0.8" fill="#38bdf8" />
    <circle cx="44" cy="41" r="0.8" fill="#eab308" />
    <circle cx="46" cy="43" r="0.8" fill="#22c55e" />
    {/* Analógicos Duplos */}
    <circle cx="33" cy="45" r="2.8" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" />
    <circle cx="41" cy="45" r="2.8" fill="#0f172a" stroke="#38bdf8" strokeWidth="0.8" />
    {/* LED Guia Central */}
    <circle cx="37" cy="40" r="1.5" fill="#38bdf8" />
  </svg>
);

// 7. MONITORES 240Hz / 360Hz (Tela Curva Ultra-Slim com Backlight RGB)
export const UpgradeHdMonitor: React.FC<IconProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="monScreen" x1="10" y1="14" x2="54" y2="40" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0f172a" />
        <stop offset="0.5" stopColor="#1e293b" />
        <stop offset="1" stopColor="#090d16" />
      </linearGradient>
      <linearGradient id="monGlow" x1="8" y1="12" x2="56" y2="42" gradientUnits="userSpaceOnUse">
        <stop stopColor="#00f2fe" />
        <stop offset="0.5" stopColor="#a855f7" />
        <stop offset="1" stopColor="#ec4899" />
      </linearGradient>
    </defs>
    {/* Halo Luminoso / Backlight Traseiro */}
    <rect x="8" y="14" width="48" height="28" rx="4" fill="none" stroke="url(#monGlow)" strokeWidth="2.5" opacity="0.65" />
    {/* Painel Display Curvo Ultrawide */}
    <rect x="9" y="15" width="46" height="26" rx="3" fill="url(#monScreen)" stroke="#475569" strokeWidth="1" />
    {/* Imagem de Jogo / Gráfico de Desempenho na Tela */}
    <path d="M14 34l8-9 8 5 9-11 11 15H14z" fill="rgba(56, 189, 248, 0.18)" />
    <polyline fill="none" stroke="#38bdf8" strokeWidth="1.5" points="14,34 22,25 30,30 39,19 50,34" />
    {/* Selo 360Hz no Canto */}
    <rect x="40" y="17" width="13" height="5" rx="1.5" fill="#facc15" />
    <text x="46.5" y="21" fill="#0f172a" fontSize="3.8" fontWeight="900" textAnchor="middle">
      360Hz
    </text>
    {/* Suporte Metálico V-Stand */}
    <path d="M30 42h4v8h-4z" fill="#64748b" />
    <path d="M22 52l10-2 10 2H22z" fill="#475569" stroke="#334155" strokeWidth="0.8" />
  </svg>
);

// 8. ÍCONE DE ENGRENAGEM DE MELHORIAS / SETTINGS HD
export const UpgradeHdCog: React.FC<IconProps> = ({ size = 26 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M12 15a3 3 0 100-6 3 3 0 000 6z"
      stroke="#38bdf8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z"
      stroke="#38bdf8"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 9. ÍCONE DE CANCELA & ESTACIONAMENTO HD
export const UpgradeHdParking: React.FC<IconProps> = ({ size = 48 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="8" y="8" width="48" height="48" rx="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="1.8" />
    <rect x="14" y="14" width="18" height="22" rx="4" fill="#1d4ed8" />
    <text x="23" y="30" fill="#f8fafc" fontSize="14" fontWeight="900" textAnchor="middle">
      P
    </text>
    <rect x="12" y="40" width="8" height="12" rx="1.5" fill="#f59e0b" />
    <rect x="14" y="42" width="4" height="3" rx="0.8" fill="#22c55e" />
    <path d="M18 41L52 28" stroke="#f8fafc" strokeWidth="4.5" strokeLinecap="round" />
    <path d="M18 41L52 28" stroke="#ef4444" strokeWidth="4.5" strokeDasharray="6 6" strokeLinecap="round" />
  </svg>
);

/**
 * Dispatcher Geral de Ilustrações de Melhorias
 */
export const UpgradeIllustration: React.FC<{ icone: string; size?: number }> = ({
  icone,
  size = 48,
}) => {
  switch (icone) {
    case 'electrical':
      return <UpgradeHdElectrical size={size} />;
    case 'cctv':
      return <UpgradeHdCctv size={size} />;
    case 'ac':
      return <UpgradeHdAc size={size} />;
    case 'pc':
      return <UpgradeHdDesk size={size} />;
    case 'printer':
      return <UpgradeHdPrinter size={size} />;
    case 'console':
      return <UpgradeHdConsole size={size} />;
    case 'monitor':
      return <UpgradeHdMonitor size={size} />;
    case 'parking':
      return <UpgradeHdParking size={size} />;
    default:
      return <UpgradeHdDesk size={size} />;
  }
};
