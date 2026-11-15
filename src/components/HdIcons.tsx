import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  glow?: boolean;
}

/**
 * Ícones Vetoriais em Alta Definição (HD / SVG), modernos e nítidos.
 * Substituem o estilo pixel art na barra HUD para máxima legibilidade e visual gamer premium.
 */

// 1. COMPUTADORES (Monitor Gamer + RGB + Base Metálica)
export const HdIconPc: React.FC<IconProps> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hdPcScreenGrad" x1="4" y1="4" x2="28" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0284c7" />
        <stop offset="0.6" stopColor="#0369a1" />
        <stop offset="1" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="hdPcBezel" x1="2" y1="2" x2="30" y2="22" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="1" stopColor="#1e3a8a" />
      </linearGradient>
      <linearGradient id="hdPcStand" x1="16" y1="20" x2="16" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#64748b" />
        <stop offset="1" stopColor="#334155" />
      </linearGradient>
    </defs>
    {/* Borda Externa do Monitor Gamer */}
    <rect x="2.5" y="3.5" width="27" height="17" rx="3" fill="#0b1329" stroke="url(#hdPcBezel)" strokeWidth="1.6" />
    {/* Tela interna com gradiente */}
    <rect x="4.5" y="5.5" width="23" height="13" rx="1.5" fill="url(#hdPcScreenGrad)" />
    {/* Gráfico de onda de desempenho na tela */}
    <path
      d="M6 13.5h3.5l2-4 2.5 6 2-3 2 1.5h6"
      stroke="#38bdf8"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* LED de Ligado */}
    <circle cx="16" cy="19.2" r="0.9" fill="#4ade80" />
    {/* Suporte Vertical */}
    <path d="M14 20.5v4.5h4v-4.5" fill="url(#hdPcStand)" />
    {/* Base do Monitor */}
    <path d="M10 27h12l-1.5-2h-9L10 27z" fill="#475569" stroke="#64748b" strokeWidth="0.8" />
    <path d="M8 27.5h16" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

// 2. CAIXA PIX (Símbolo Oficial PIX Estilizado + Carteira Neon)
export const HdIconPix: React.FC<IconProps> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hdPixDiamond" x1="7" y1="7" x2="25" y2="25" gradientUnits="userSpaceOnUse">
        <stop stopColor="#34d399" />
        <stop offset="0.5" stopColor="#10b981" />
        <stop offset="1" stopColor="#059669" />
      </linearGradient>
      <linearGradient id="hdPixRing" x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
        <stop stopColor="#10b981" />
        <stop offset="1" stopColor="#0284c7" />
      </linearGradient>
    </defs>
    {/* Fundo com cantos arredondados */}
    <rect x="2.5" y="2.5" width="27" height="27" rx="7" fill="#04221b" stroke="url(#hdPixRing)" strokeWidth="1.6" />
    {/* Diamante do PIX */}
    <path
      d="M16 6.5l4.8 4.8c.8.8.8 2.1 0 2.9L16 19l-4.8-4.8c-.8-.8-.8-2.1 0-2.9L16 6.5z"
      fill="url(#hdPixDiamond)"
    />
    <path
      d="M16 13l4.8 4.8c.8.8.8 2.1 0 2.9L16 25.5l-4.8-4.8c-.8-.8-.8-2.1 0-2.9L16 13z"
      fill="url(#hdPixDiamond)"
      opacity="0.85"
    />
    {/* Linhas brancas de conexão */}
    <path
      d="M13.2 13.8L16 16.6l2.8-2.8"
      stroke="#ffffff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M13.2 18.2L16 15.4l2.8 2.8"
      stroke="#ffffff"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 3. LOJA / BOMBONIERE (Carrinho de Compras Moderno + Itens Gamer)
export const HdIconStore: React.FC<IconProps> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hdStoreBasket" x1="5" y1="8" x2="27" y2="24" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fbbf24" />
        <stop offset="1" stopColor="#d97706" />
      </linearGradient>
    </defs>
    {/* Cesta do Carrinho */}
    <path
      d="M4 6.5h4.2l3.2 13h13l3.2-9.5H10"
      stroke="#f59e0b"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Corpo com preenchimento translúcido */}
    <path
      d="M11.4 19.5h13l2.8-8.5H9.5l1.9 8.5z"
      fill="url(#hdStoreBasket)"
      fillOpacity="0.4"
    />
    {/* Garrafa / Lata de Energético dentro */}
    <rect x="13" y="9" width="3.5" height="6.5" rx="1" fill="#38bdf8" stroke="#7dd3fc" strokeWidth="0.8" />
    <rect x="18" y="7.5" width="4" height="8" rx="1.2" fill="#ef4444" stroke="#fca5a5" strokeWidth="0.8" />
    {/* Rodinhas do Carrinho */}
    <circle cx="13" cy="24.5" r="2.5" fill="#facc15" stroke="#78350f" strokeWidth="1" />
    <circle cx="23" cy="24.5" r="2.5" fill="#facc15" stroke="#78350f" strokeWidth="1" />
    <circle cx="13" cy="24.5" r="0.8" fill="#1e293b" />
    <circle cx="23" cy="24.5" r="0.8" fill="#1e293b" />
  </svg>
);

// 4. MELHORIAS (Foguete de Upgrade + Impulso Neon)
export const HdIconUpgrades: React.FC<IconProps> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hdRocketBody" x1="16" y1="3" x2="16" y2="23" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4ade80" />
        <stop offset="0.6" stopColor="#16a34a" />
        <stop offset="1" stopColor="#14532d" />
      </linearGradient>
    </defs>
    {/* Fogo do Propulsor */}
    <path
      d="M16 23c-2 2-2 5.5 0 7 2-1.5 2-5 0-7z"
      fill="#facc15"
    />
    <path
      d="M16 24.5c-1 1-1 3 0 4 1-1 1-3 0-4z"
      fill="#f97316"
    />
    {/* Aletas Laterais */}
    <path d="M10 18l-4 3v-5l4-2v4z" fill="#22c55e" stroke="#86efac" strokeWidth="1" />
    <path d="M22 18l4 3v-5l-4-2v4z" fill="#22c55e" stroke="#86efac" strokeWidth="1" />
    {/* Corpo Central do Foguete */}
    <path
      d="M16 3c-4.5 4-6 10-6 17l6 2.5 6-2.5c0-7-1.5-13-6-17z"
      fill="url(#hdRocketBody)"
      stroke="#86efac"
      strokeWidth="1.6"
      strokeLinejoin="round"
    />
    {/* Janela de Escotilha */}
    <circle cx="16" cy="11" r="2.8" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.2" />
    <circle cx="16" cy="11" r="1.4" fill="#0284c7" />
  </svg>
);

// 5. ESTATÍSTICAS (Painel Analítico de Barras + Curva de Crescimento)
export const HdIconStats: React.FC<IconProps> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hdBar1" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#38bdf8" />
        <stop offset="1" stopColor="#0369a1" />
      </linearGradient>
      <linearGradient id="hdBar2" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#818cf8" />
        <stop offset="1" stopColor="#4338ca" />
      </linearGradient>
      <linearGradient id="hdBar3" x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#4ade80" />
        <stop offset="1" stopColor="#15803d" />
      </linearGradient>
    </defs>
    {/* Eixo base */}
    <path d="M3 27h26" stroke="#475569" strokeWidth="1.8" strokeLinecap="round" />
    {/* Barras de Desempenho */}
    <rect x="5.5" y="17" width="5" height="9" rx="1.5" fill="url(#hdBar1)" stroke="#7dd3fc" strokeWidth="1" />
    <rect x="13.5" y="11" width="5" height="15" rx="1.5" fill="url(#hdBar2)" stroke="#a5b4fc" strokeWidth="1" />
    <rect x="21.5" y="5" width="5" height="21" rx="1.5" fill="url(#hdBar3)" stroke="#86efac" strokeWidth="1" />
    {/* Linha de Tendência de Lucro */}
    <path
      d="M6 15l7-5 6 3 7-8"
      stroke="#facc15"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="26" cy="5" r="2.2" fill="#fef08a" stroke="#ca8a04" strokeWidth="1" />
  </svg>
);

// 6. CONQUISTAS (Troféu Dourado 3D com Estrela)
export const HdIconTrophy: React.FC<IconProps> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hdTrophyGold" x1="8" y1="4" x2="24" y2="20" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fef08a" />
        <stop offset="0.3" stopColor="#facc15" />
        <stop offset="0.8" stopColor="#eab308" />
        <stop offset="1" stopColor="#a16207" />
      </linearGradient>
    </defs>
    {/* Taça do Troféu */}
    <path
      d="M8.5 4h15v8c0 4.2-3.3 7.5-7.5 7.5S8.5 16.2 8.5 12V4z"
      fill="url(#hdTrophyGold)"
      stroke="#facc15"
      strokeWidth="1.6"
    />
    {/* Alças Laterais */}
    <path
      d="M8.5 6H5a3 3 0 00-3 3v2a4 4 0 004 4h2.5M23.5 6H27a3 3 0 013 3v2a4 4 0 01-4 4h-2.5"
      stroke="#facc15"
      strokeWidth="1.8"
      strokeLinecap="round"
    />
    {/* Haste Central */}
    <path d="M16 19.5v4.5" stroke="#ca8a04" strokeWidth="2.5" strokeLinecap="round" />
    {/* Base do Troféu */}
    <path d="M11 24h10l1.5 4H9.5L11 24z" fill="#78350f" stroke="#eab308" strokeWidth="1.2" />
    <rect x="8" y="27.5" width="16" height="1.5" rx="0.75" fill="#fde047" />
    {/* Estrela no Centro */}
    <path
      d="M16 7.5l.9 2 2.1.3-1.6 1.5.4 2.1-1.8-1-1.8 1 .4-2.1-1.6-1.5 2.1-.3.9-2z"
      fill="#ffffff"
    />
  </svg>
);

// 7. CONFIGURAÇÕES (Engrenagem Futurista com Chanfro Roxo)
export const HdIconSettings: React.FC<IconProps> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="hdGearPurple" x1="4" y1="4" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#e9d5ff" />
        <stop offset="0.4" stopColor="#c084fc" />
        <stop offset="1" stopColor="#7e22ce" />
      </linearGradient>
    </defs>
    {/* Círculo do Centro */}
    <circle cx="16" cy="16" r="4.2" fill="#1e1b4b" stroke="#c084fc" strokeWidth="2" />
    {/* Dentes da Engrenagem */}
    <path
      d="M16 3.5l1.8 2.8a9.4 9.4 0 012.8 1.1l3.1-1.2 2 3.4-2.3 2.3a9.4 9.4 0 011.1 2.8l3.1.8v4l-3.1.8a9.4 9.4 0 01-1.1 2.8l2.3 2.3-2 3.4-3.1-1.2a9.4 9.4 0 01-2.8 1.1L16 28.5l-1.8-2.8a9.4 9.4 0 01-2.8-1.1l-3.1 1.2-2-3.4 2.3-2.3a9.4 9.4 0 01-1.1-2.8L4.4 16.5v-4l3.1-.8a9.4 9.4 0 011.1-2.8L6.3 6.6l2-3.4 3.1 1.2a9.4 9.4 0 012.8-1.1L16 3.5z"
      fill="url(#hdGearPurple)"
      stroke="#f5d0fe"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    <circle cx="16" cy="16" r="1.8" fill="#a855f7" />
  </svg>
);
