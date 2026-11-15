import React from 'react';

interface ProductIconProps {
  size?: number;
  className?: string;
}

/**
 * Ilustrações Vetoriais em Alta Definição (HD / SVG) para os Itens de Venda da Lan House.
 * Substitui o visual pixelado antigo por ilustrações modernas com gradientes, luz volumétrica e brilho.
 */

// 1. CAFÉ EXPRESSO GAMER (Xícara Cerâmica Fumegante com Pires)
export const ProductHdCoffee: React.FC<ProductIconProps> = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="cupGrad" x1="14" y1="20" x2="48" y2="50" gradientUnits="userSpaceOnUse">
        <stop stopColor="#334155" />
        <stop offset="0.5" stopColor="#1e293b" />
        <stop offset="1" stopColor="#0f172a" />
      </linearGradient>
      <linearGradient id="coffeeLiquid" x1="18" y1="23" x2="44" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#78350f" />
        <stop offset="0.6" stopColor="#451a03" />
        <stop offset="1" stopColor="#291104" />
      </linearGradient>
      <linearGradient id="cremaGlow" x1="22" y1="22" x2="38" y2="26" gradientUnits="userSpaceOnUse">
        <stop stopColor="#d97706" />
        <stop offset="1" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="saucerGrad" x1="8" y1="48" x2="54" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#475569" />
        <stop offset="0.5" stopColor="#1e293b" />
        <stop offset="1" stopColor="#0f172a" />
      </linearGradient>
    </defs>
    {/* Vapor Quente */}
    <path
      d="M24 16c-2-3 0-6-1-9M31 15c-1.5-3.5.5-6.5-.5-10M38 16c-2-3 0-6-1-9"
      stroke="#cbd5e1"
      strokeWidth="2"
      strokeLinecap="round"
      opacity="0.65"
    />
    {/* Pires Inferior */}
    <ellipse cx="31" cy="52" rx="23" ry="5.5" fill="url(#saucerGrad)" stroke="#38bdf8" strokeWidth="1.2" />
    <ellipse cx="31" cy="51" rx="17" ry="3.5" fill="#0f172a" opacity="0.6" />
    {/* Alça da Xícara */}
    <path
      d="M44 26c6 0 10 3.5 10 9s-4 9-10 9"
      fill="none"
      stroke="#475569"
      strokeWidth="4.5"
      strokeLinecap="round"
    />
    <path
      d="M44 26c6 0 10 3.5 10 9s-4 9-10 9"
      fill="none"
      stroke="#38bdf8"
      strokeWidth="1.2"
      strokeLinecap="round"
      opacity="0.8"
    />
    {/* Corpo da Xícara */}
    <path
      d="M15 22h32l-3.2 23c-.5 3.5-3.5 6-7 6H25.2c-3.5 0-6.5-2.5-7-6L15 22z"
      fill="url(#cupGrad)"
      stroke="#38bdf8"
      strokeWidth="1.4"
    />
    {/* Superfície do Café com Crema */}
    <ellipse cx="31" cy="23" rx="15" ry="4" fill="url(#coffeeLiquid)" />
    <ellipse cx="30" cy="23" rx="10" ry="2.2" fill="url(#cremaGlow)" opacity="0.75" />
    <circle cx="27" cy="22.5" r="1.5" fill="#fef3c7" opacity="0.7" />
    {/* Brilho de Reflexo na Cerâmica */}
    <path d="M19 26l2 16" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round" />
    {/* Emblema Gamer Dourado na Xícara */}
    <path d="M31 32l1.5 3 3.5.5-2.5 2.5.6 3.5-3.1-1.6-3.1 1.6.6-3.5-2.5-2.5 3.5-.5 1.5-3z" fill="#facc15" opacity="0.9" />
  </svg>
);

// 2. SODA NEON LATA (Lata de Refrigerante Gelada com Reflexo Metálico)
export const ProductHdSoda: React.FC<ProductIconProps> = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="canBody" x1="18" y1="12" x2="46" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#ef4444" />
        <stop offset="0.4" stopColor="#dc2626" />
        <stop offset="0.8" stopColor="#991b1b" />
        <stop offset="1" stopColor="#450a0a" />
      </linearGradient>
      <linearGradient id="metalTop" x1="19" y1="10" x2="45" y2="15" gradientUnits="userSpaceOnUse">
        <stop stopColor="#e2e8f0" />
        <stop offset="0.5" stopColor="#94a3b8" />
        <stop offset="1" stopColor="#64748b" />
      </linearGradient>
    </defs>
    {/* Sombra da lata */}
    <ellipse cx="32" cy="56" rx="14" ry="3.5" fill="#000000" opacity="0.45" />
    {/* Corpo cilíndrico da lata */}
    <path
      d="M20 14h24v38c0 2-2 3.5-4 3.5H24c-2 0-4-1.5-4-3.5V14z"
      fill="url(#canBody)"
      stroke="#fca5a5"
      strokeWidth="1.2"
    />
    {/* Topo de alumínio */}
    <ellipse cx="32" cy="14" rx="12" ry="3.5" fill="url(#metalTop)" stroke="#cbd5e1" strokeWidth="1" />
    <ellipse cx="32" cy="13.8" rx="8" ry="2" fill="#475569" />
    {/* Anel de puxar (Lacre) */}
    <path d="M30 13h4l1-3h-6l1 3z" fill="#f8fafc" stroke="#94a3b8" strokeWidth="0.8" />
    <circle cx="32" cy="11.5" r="1.2" fill="#334155" />
    {/* Faixa Gráfica Diagonal Neon */}
    <path
      d="M20 28l24-10v8L20 36v-8zm0 14l24-10v7L20 49v-7z"
      fill="#ffffff"
      fillOpacity="0.25"
    />
    {/* Onda Neon Brilhante */}
    <path
      d="M21 34c4-3 10-3 15 1s8 0 8 0"
      stroke="#fde047"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Efeito de Gotículas de Gelo Geladas */}
    <circle cx="25" cy="22" r="1" fill="#fff" opacity="0.85" />
    <circle cx="28" cy="40" r="1.2" fill="#fff" opacity="0.85" />
    <circle cx="39" cy="30" r="1" fill="#fff" opacity="0.85" />
    <circle cx="23" cy="46" r="0.9" fill="#fff" opacity="0.85" />
    {/* Reflexo Vertical Metálico */}
    <path d="M24 16v36" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.4" />
  </svg>
);

// 3. FATIA DE PIZZA CALABRESA (Queijo Derretido, Rodelas de Calabresa e Ervas)
export const ProductHdPizza: React.FC<ProductIconProps> = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="crustGrad" x1="12" y1="12" x2="52" y2="18" gradientUnits="userSpaceOnUse">
        <stop stopColor="#d97706" />
        <stop offset="0.5" stopColor="#b45309" />
        <stop offset="1" stopColor="#78350f" />
      </linearGradient>
      <linearGradient id="cheeseGrad" x1="18" y1="18" x2="32" y2="52" gradientUnits="userSpaceOnUse">
        <stop stopColor="#fde047" />
        <stop offset="0.6" stopColor="#eab308" />
        <stop offset="1" stopColor="#ca8a04" />
      </linearGradient>
    </defs>
    {/* Sombra */}
    <path d="M12 16L32 56 52 16c-13 4-27 4-40 0z" fill="#000" opacity="0.3" filter="blur(2px)" />
    {/* Massa / Borda Crocante Superior */}
    <path
      d="M12 16c13 5 27 5 40 0 1.5 3 0 6-3 7-11 3-23 3-34 0-3-1-4.5-4-3-7z"
      fill="url(#crustGrad)"
      stroke="#78350f"
      strokeWidth="1.2"
    />
    {/* Corpo Triangular da Fatia com Queijo */}
    <path
      d="M14 20L32 55 50 20c-12 3-24 3-36 0z"
      fill="url(#cheeseGrad)"
      stroke="#ca8a04"
      strokeWidth="1.2"
      strokeLinejoin="round"
    />
    {/* Gotas de Queijo Derretido Escorrendo */}
    <path d="M30 52c0 2 2 4 2 4s2-2 2-4-4-1-4 0z" fill="#fde047" />
    <path d="M22 36c-1 3 1 5 2 5s2-2 1-5" fill="#fde047" />
    {/* Rodelas de Calabresa Suculentas */}
    <circle cx="28" cy="27" r="4.5" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1" />
    <circle cx="27" cy="26" r="3.2" fill="#b91c1c" />
    <circle cx="26" cy="25" r="0.8" fill="#fecaca" />
    <circle cx="29" cy="28" r="0.8" fill="#fecaca" />

    <circle cx="39" cy="33" r="4.2" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1" />
    <circle cx="38" cy="32" r="3" fill="#b91c1c" />
    <circle cx="37.5" cy="31.5" r="0.7" fill="#fecaca" />

    <circle cx="31" cy="42" r="3.8" fill="#991b1b" stroke="#7f1d1d" strokeWidth="1" />
    <circle cx="30.5" cy="41.5" r="2.6" fill="#b91c1c" />
    <circle cx="30" cy="41" r="0.6" fill="#fecaca" />

    {/* Folhinhas de Manjericão e Orégano */}
    <path d="M22 23c2-1 4 1 3 3-2 1-4-1-3-3z" fill="#15803d" />
    <path d="M37 24c1.5-1 3 .5 2 2-1.5 1-3-.5-2-2z" fill="#16a34a" />
    <circle cx="34" cy="34" r="0.8" fill="#15803d" />
    <circle cx="25" cy="35" r="0.7" fill="#15803d" />
    <circle cx="27" cy="48" r="0.6" fill="#15803d" />
  </svg>
);

// 4. ENERGÉTICO TURBO 473ML (Lata Alta Fosca com Raio Neon Verde e Ciano)
export const ProductHdEnergy: React.FC<ProductIconProps> = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="energyCan" x1="20" y1="8" x2="44" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0f172a" />
        <stop offset="0.5" stopColor="#022c22" />
        <stop offset="1" stopColor="#064e3b" />
      </linearGradient>
      <linearGradient id="boltGrad" x1="26" y1="20" x2="38" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4ade80" />
        <stop offset="0.5" stopColor="#22c55e" />
        <stop offset="1" stopColor="#06b6d4" />
      </linearGradient>
    </defs>
    {/* Sombra */}
    <ellipse cx="32" cy="57" rx="12" ry="3" fill="#000" opacity="0.45" />
    {/* Corpo alto da lata 473ml */}
    <path
      d="M21 11h22v42c0 2-1.8 3.5-3.5 3.5H24.5c-1.8 0-3.5-1.5-3.5-3.5V11z"
      fill="url(#energyCan)"
      stroke="#10b981"
      strokeWidth="1.4"
    />
    {/* Tampa de alumínio */}
    <ellipse cx="32" cy="11" rx="11" ry="3.2" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="1" />
    <ellipse cx="32" cy="10.8" rx="7.5" ry="1.8" fill="#475569" />
    <rect x="30" y="8.5" width="4" height="2" rx="0.5" fill="#f8fafc" />
    {/* Raio Neon Elétrico Central (Logo Turbo) */}
    <path
      d="M34 18l-8 14h7l-3 14 10-16h-7l5-12h-4z"
      fill="url(#boltGrad)"
      stroke="#bbf7d0"
      strokeWidth="1.2"
      strokeLinejoin="round"
      filter="drop-shadow(0 0 6px #22c55e)"
    />
    {/* Faixas Verticais Cibernéticas */}
    <path d="M24 16v34" stroke="#059669" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
    <path d="M40 16v34" stroke="#059669" strokeWidth="1" strokeDasharray="3 3" opacity="0.6" />
    {/* Reflexo Curvo da Lata */}
    <path d="M25 14v38" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" opacity="0.3" />
  </svg>
);

// 5. COMBO BURGER PIXEL (Burger Gourmet com Pão Brioche, Cheddar e Alface)
export const ProductHdBurger: React.FC<ProductIconProps> = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bunTop" x1="14" y1="14" x2="50" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#f59e0b" />
        <stop offset="0.6" stopColor="#d97706" />
        <stop offset="1" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="pattyGrad" x1="12" y1="36" x2="52" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#572810" />
        <stop offset="0.5" stopColor="#3d1c0a" />
        <stop offset="1" stopColor="#241005" />
      </linearGradient>
    </defs>
    {/* Sombra */}
    <ellipse cx="32" cy="54" rx="20" ry="4" fill="#000" opacity="0.4" />
    {/* Pão Superior (Brioche Dourado) */}
    <path
      d="M14 27c0-9 8-15 18-15s18 6 18 15c0 1.5-1.5 2-3 2H17c-1.5 0-3-.5-3-2z"
      fill="url(#bunTop)"
      stroke="#b45309"
      strokeWidth="1.2"
    />
    {/* Gergelim no Pão */}
    <ellipse cx="26" cy="18" rx="1.2" ry="0.6" fill="#fef3c7" transform="rotate(-15 26 18)" />
    <ellipse cx="33" cy="16" rx="1.2" ry="0.6" fill="#fef3c7" transform="rotate(10 33 16)" />
    <ellipse cx="40" cy="19" rx="1.2" ry="0.6" fill="#fef3c7" transform="rotate(25 40 19)" />
    <ellipse cx="30" cy="22" rx="1.2" ry="0.6" fill="#fef3c7" transform="rotate(-5 30 22)" />
    <ellipse cx="37" cy="23" rx="1.2" ry="0.6" fill="#fef3c7" transform="rotate(15 37 23)" />

    {/* Folhas de Alface Onduladas */}
    <path
      d="M12 28c3 2 5-1 8 1s4-1 7 1 5-1 8 1 5-1 8 1 4-1 7 1c0 2-2 3-5 3H16c-3 0-5-1-4-4z"
      fill="#22c55e"
      stroke="#16a34a"
      strokeWidth="1"
    />

    {/* Rodelas de Tomate */}
    <rect x="18" y="32" width="13" height="3" rx="1.5" fill="#ef4444" stroke="#dc2626" strokeWidth="0.8" />
    <rect x="33" y="32" width="13" height="3" rx="1.5" fill="#ef4444" stroke="#dc2626" strokeWidth="0.8" />

    {/* Hambúrguer Artesanal Grelhado */}
    <rect x="13" y="36" width="38" height="7" rx="3.5" fill="url(#pattyGrad)" stroke="#241005" strokeWidth="1" />

    {/* Queijo Cheddar Derretido com Pontas */}
    <path
      d="M14 36h36l-3 4-6-1-5 5-7-5-6 3-9-6z"
      fill="#fbbf24"
      stroke="#f59e0b"
      strokeWidth="0.8"
    />

    {/* Pão Inferior */}
    <path
      d="M16 44h32c2 0 3 1 3 3 0 4-4 6-10 6H23c-6 0-10-2-10-6 0-2 1-3 3-3z"
      fill="url(#bunTop)"
      stroke="#b45309"
      strokeWidth="1.2"
    />
  </svg>
);

// 6. MOUSEPAD SPEED XL (Borda Costurada RGB com Fita Neon Luminosa)
export const ProductHdMousepad: React.FC<ProductIconProps> = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="padSurface" x1="10" y1="18" x2="54" y2="46" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1e293b" />
        <stop offset="0.6" stopColor="#0f172a" />
        <stop offset="1" stopColor="#020617" />
      </linearGradient>
      <linearGradient id="rgbBorder" x1="8" y1="16" x2="56" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="0.33" stopColor="#a855f7" />
        <stop offset="0.66" stopColor="#ec4899" />
        <stop offset="1" stopColor="#4ade80" />
      </linearGradient>
    </defs>
    {/* Sombra */}
    <rect x="8" y="20" width="48" height="30" rx="6" fill="#000" opacity="0.4" />
    {/* Borda RGB Neon Externa */}
    <rect
      x="8"
      y="18"
      width="48"
      height="28"
      rx="6"
      fill="none"
      stroke="url(#rgbBorder)"
      strokeWidth="2.5"
      filter="drop-shadow(0 0 6px rgba(168, 85, 247, 0.7))"
    />
    {/* Superfície Speed Microfibra */}
    <rect x="10" y="20" width="44" height="24" rx="4.5" fill="url(#padSurface)" />
    {/* Textura Geométrica / Logo Cibernético no canto */}
    <path
      d="M38 34l6-8 6 8-6 4-6-4z"
      stroke="#38bdf8"
      strokeWidth="1.2"
      fill="none"
      opacity="0.7"
    />
    <circle cx="44" cy="30" r="1.5" fill="#c084fc" />
    {/* Cabo USB de Alimentação RGB no Topo */}
    <rect x="16" y="14" width="6" height="4" rx="1" fill="#475569" stroke="#94a3b8" strokeWidth="0.8" />
    <path d="M19 14V9" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
    {/* LED de Status no Hub */}
    <circle cx="19" cy="16" r="1" fill="#38bdf8" />
  </svg>
);

// 7. HEADSET RGB PRO (Headset Gamer Over-Ear com Anel Iluminado e Microfone)
export const ProductHdHeadset: React.FC<ProductIconProps> = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="headbandGrad" x1="14" y1="8" x2="50" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#334155" />
        <stop offset="0.5" stopColor="#0f172a" />
        <stop offset="1" stopColor="#334155" />
      </linearGradient>
      <linearGradient id="rgbRing" x1="10" y1="28" x2="22" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#38bdf8" />
        <stop offset="0.5" stopColor="#c084fc" />
        <stop offset="1" stopColor="#f43f5e" />
      </linearGradient>
    </defs>
    {/* Arco Superior Estofado */}
    <path
      d="M16 32C16 19 23 10 32 10s16 9 16 22"
      fill="none"
      stroke="url(#headbandGrad)"
      strokeWidth="6"
      strokeLinecap="round"
    />
    <path
      d="M20 26C20 18 25 13 32 13s12 5 12 13"
      fill="none"
      stroke="#1e293b"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Conectores Metálicos de Ajuste */}
    <rect x="14" y="27" width="4" height="6" rx="1" fill="#94a3b8" />
    <rect x="46" y="27" width="4" height="6" rx="1" fill="#94a3b8" />

    {/* Fone Esquerdo */}
    <rect x="11" y="31" width="10" height="17" rx="5" fill="#0f172a" stroke="#475569" strokeWidth="1.2" />
    <circle cx="16" cy="39.5" r="5" stroke="url(#rgbRing)" strokeWidth="1.6" fill="#090d16" filter="drop-shadow(0 0 4px #38bdf8)" />
    <rect x="9" y="33" width="3" height="13" rx="1.5" fill="#1e293b" />

    {/* Fone Direito */}
    <rect x="43" y="31" width="10" height="17" rx="5" fill="#0f172a" stroke="#475569" strokeWidth="1.2" />
    <circle cx="48" cy="39.5" r="5" stroke="url(#rgbRing)" strokeWidth="1.6" fill="#090d16" filter="drop-shadow(0 0 4px #c084fc)" />
    <rect x="52" y="33" width="3" height="13" rx="1.5" fill="#1e293b" />

    {/* Microfone Boom Flexível */}
    <path
      d="M16 43c0 7 6 12 14 12h3"
      fill="none"
      stroke="#64748b"
      strokeWidth="2.5"
      strokeLinecap="round"
    />
    {/* Cápsula do Microfone com LED Ciano */}
    <rect x="33" y="53" width="6" height="4" rx="1.5" fill="#0f172a" stroke="#38bdf8" strokeWidth="1" />
    <circle cx="38" cy="55" r="0.9" fill="#38bdf8" />
  </svg>
);

// 8. PROCESSADOR CPU GAMER (AMD Ryzen / Intel Core com IHS e Pinos de Ouro)
export const ProductHdCpu: React.FC<ProductIconProps> = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="ihsGrad" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#e2e8f0" />
        <stop offset="0.5" stopColor="#94a3b8" />
        <stop offset="1" stopColor="#64748b" />
      </linearGradient>
    </defs>
    {/* Placa de Circuito Verde / Substrato */}
    <rect x="10" y="10" width="44" height="44" rx="4" fill="#064e3b" stroke="#10b981" strokeWidth="1.5" />
    {/* Pinos Dourados nas bordas */}
    {[14, 20, 26, 32, 38, 44, 50].map((pos) => (
      <React.Fragment key={pos}>
        <circle cx={pos} cy="11.5" r="0.9" fill="#facc15" />
        <circle cx={pos} cy="52.5" r="0.9" fill="#facc15" />
        <circle cx="11.5" cy={pos} r="0.9" fill="#facc15" />
        <circle cx="52.5" cy={pos} r="0.9" fill="#facc15" />
      </React.Fragment>
    ))}
    {/* Tampa Metálica IHS */}
    <rect x="16" y="16" width="32" height="32" rx="3" fill="url(#ihsGrad)" stroke="#cbd5e1" strokeWidth="1.2" />
    {/* Triângulo de Alinhamento Dourado no Canto */}
    <polygon points="17,17 22,17 17,22" fill="#facc15" />
    {/* Gravação a Laser do Processador */}
    <rect x="22" y="24" width="20" height="3" rx="0.8" fill="#334155" />
    <path d="M22 30h14M22 34h10M22 38h16" stroke="#475569" strokeWidth="1.5" strokeLinecap="round" />
    {/* Logo Laranja Ryzen */}
    <circle cx="38" cy="34" r="3.5" fill="none" stroke="#f97316" strokeWidth="1.6" />
    <circle cx="38" cy="34" r="1.5" fill="#f97316" />
  </svg>
);

// 9. PLACA DE VÍDEO GPU (GeForce RTX / Radeon com Ventoinhas e RGB)
export const ProductHdGpu: React.FC<ProductIconProps> = ({ size = 52 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="shroudGrad" x1="10" y1="18" x2="54" y2="46" gradientUnits="userSpaceOnUse">
        <stop stopColor="#1e293b" />
        <stop offset="0.5" stopColor="#0f172a" />
        <stop offset="1" stopColor="#020617" />
      </linearGradient>
    </defs>
    {/* Espelho Traseiro PCIe */}
    <rect x="8" y="16" width="4" height="32" rx="1" fill="#94a3b8" stroke="#cbd5e1" strokeWidth="0.8" />
    <rect x="12" y="44" width="22" height="4" rx="1" fill="#facc15" stroke="#ca8a04" strokeWidth="0.8" />
    {/* Corpo Principal da GPU (Carenagem) */}
    <rect x="12" y="20" width="44" height="24" rx="3.5" fill="url(#shroudGrad)" stroke="#38bdf8" strokeWidth="1.2" />
    {/* Dissipador de Calor com Aletas Metálicas */}
    {[16, 20, 24, 28, 32, 36, 40, 44, 48, 52].map((x) => (
      <line key={x} x1={x} y1="22" x2={x} y2="42" stroke="#334155" strokeWidth="0.9" />
    ))}
    {/* Ventoinha Esquerda com Aro RGB */}
    <circle cx="25" cy="32" r="8" fill="#090d16" stroke="#38bdf8" strokeWidth="1.4" filter="drop-shadow(0 0 4px #38bdf8)" />
    <circle cx="25" cy="32" r="3" fill="#334155" />
    {/* Pás da Ventoinha */}
    <path d="M25 24v5M25 35v5M17 32h5M30 32h5" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />

    {/* Ventoinha Direita com Aro RGB */}
    <circle cx="43" cy="32" r="8" fill="#090d16" stroke="#c084fc" strokeWidth="1.4" filter="drop-shadow(0 0 4px #c084fc)" />
    <circle cx="43" cy="32" r="3" fill="#334155" />
    {/* Pás da Ventoinha Direita */}
    <path d="M43 24v5M43 35v5M35 32h5M48 32h5" stroke="#64748b" strokeWidth="1.5" strokeLinecap="round" />

    {/* Letreiro Iluminado GEFORCE / RADEON no Topo */}
    <rect x="18" y="16.5" width="28" height="3" rx="1" fill="#0f172a" stroke="#22c55e" strokeWidth="0.8" />
    <path d="M22 18h20" stroke="#4ade80" strokeWidth="1.2" strokeLinecap="round" />
  </svg>
);

/**
 * Renderizador mestre de ícones HD dos produtos
 */
export const ProductIllustration: React.FC<{
  icone: string;
  size?: number;
  className?: string;
}> = ({ icone, size = 52, className }) => {
  switch (icone) {
    case 'coffee':
      return <ProductHdCoffee size={size} className={className} />;
    case 'soda':
      return <ProductHdSoda size={size} className={className} />;
    case 'pizza':
      return <ProductHdPizza size={size} className={className} />;
    case 'energy':
      return <ProductHdEnergy size={size} className={className} />;
    case 'burger':
      return <ProductHdBurger size={size} className={className} />;
    case 'mouse':
      return <ProductHdMousepad size={size} className={className} />;
    case 'headset':
      return <ProductHdHeadset size={size} className={className} />;
    case 'cpu':
      return <ProductHdCpu size={size} className={className} />;
    case 'gpu':
      return <ProductHdGpu size={size} className={className} />;
    default:
      return <ProductHdSoda size={size} className={className} />;
  }
};
