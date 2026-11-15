import os
from fpdf import FPDF
from fpdf.enums import XPos, YPos

class RelatorioAcademicoPDF(FPDF):
    def __init__(self):
        super().__init__(orientation="portrait", unit="mm", format="A4")
        self.set_margins(16, 16, 16)
        self.set_auto_page_break(auto=True, margin=18)
        # Registra fontes TrueType do Windows para suporte total a Unicode e acentos
        self.add_font("CustomArial", fname="C:/Windows/Fonts/arial.ttf")
        self.add_font("CustomArial", style="B", fname="C:/Windows/Fonts/arialbd.ttf")
        self.add_font("CustomArial", style="I", fname="C:/Windows/Fonts/ariali.ttf")

    def header(self):
        if self.page_no() > 1:
            self.set_font("CustomArial", "B", 7.5)
            self.set_text_color(100, 116, 139) # slate-500
            self.cell(0, 5, "ARQUITETURA HÍBRIDA DE FRONTEND: PIXEL ART & ANALYTICS HD", align="L")
            self.set_font("CustomArial", "", 7.5)
            self.cell(0, 5, "SIMULADOR LAN HOUSE & CYBER CAFÉ", align="R", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
            self.set_draw_color(2, 132, 199) # sky-600
            self.set_line_width(0.4)
            self.line(16, 11, 194, 11)
            self.ln(4)

    def footer(self):
        self.set_y(-14)
        self.set_draw_color(226, 232, 240)
        self.set_line_width(0.3)
        self.line(16, self.get_y(), 194, self.get_y())
        self.ln(2)
        self.set_font("CustomArial", "", 8)
        self.set_text_color(148, 163, 184)
        self.cell(0, 5, "Documentação Técnica & Acadêmica • Engenharia de Software e Design de Interfaces", align="L")
        self.cell(0, 5, f"Página {self.page_no()}/{{nb}}", align="R")

    def section_title(self, num_str, title):
        self.ln(3)
        self.set_font("CustomArial", "B", 12)
        self.set_text_color(15, 23, 42) # slate-900
        # Marcador azul vertical
        x = self.get_x()
        y = self.get_y()
        self.set_fill_color(2, 132, 199)
        self.rect(x, y + 1, 3, 5, style="F")
        self.set_x(x + 5)
        self.cell(0, 7, f"{num_str}. {title}", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(1)

    def subsection_title(self, title):
        self.set_font("CustomArial", "B", 10)
        self.set_text_color(30, 41, 59) # slate-800
        self.cell(0, 6, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        self.ln(0.5)

    def paragraph(self, text):
        self.set_font("CustomArial", "", 9.2)
        self.set_text_color(51, 65, 85) # slate-700
        self.multi_cell(0, 5, text, align="J")
        self.ln(2)

    def callout_box(self, title, text, bg_rgb=(240, 253, 244), border_rgb=(34, 197, 94), text_rgb=(20, 83, 45)):
        self.set_fill_color(*bg_rgb)
        self.set_draw_color(*border_rgb)
        self.set_line_width(0.4)
        x = self.get_x()
        y = self.get_y()
        
        width = 178
        lines = len(text) // 80 + 3
        box_h = lines * 4.6 + 8
        
        self.rect(x, y, width, box_h, style="FD")
        self.set_fill_color(*border_rgb)
        self.rect(x, y, 3, box_h, style="F")
        
        self.set_xy(x + 5, y + 2.5)
        self.set_font("CustomArial", "B", 8.8)
        self.set_text_color(*text_rgb)
        self.cell(width - 8, 4.5, title, new_x=XPos.LMARGIN, new_y=YPos.NEXT)
        
        self.set_x(x + 5)
        self.set_font("CustomArial", "", 8.4)
        self.set_text_color(30, 41, 59)
        self.multi_cell(width - 8, 4.3, text, align="J")
        self.set_y(y + box_h + 3)


def gerar_relatorio():
    pdf = RelatorioAcademicoPDF()
    pdf.add_page()

    # --- CABEÇALHO / CAPA ---
    pdf.set_fill_color(224, 242, 254) # sky-100
    pdf.set_text_color(3, 105, 161) # sky-700
    pdf.set_font("CustomArial", "B", 7.5)
    pdf.cell(105, 5, "RELATÓRIO TÉCNICO DE ENGENHARIA DE SOFTWARE & DESIGN DE INTERFACES", fill=True, border=0, align="C")
    pdf.ln(7)

    pdf.set_font("CustomArial", "B", 16)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(0, 7.5, "Arquitetura Híbrida de Frontend:", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.cell(0, 7.5, "Simulação em Pixel Art & Analytics em Alta Resolução (HD)", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(1)

    pdf.set_font("CustomArial", "", 9.5)
    pdf.set_text_color(100, 116, 139)
    pdf.cell(0, 5, "Fundamentos de Computação Gráfica, Modelos Históricos (1-bit a 32-bit), Telemetria e POO Aplicada", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(3)

    # Box de Metadados
    pdf.set_fill_color(248, 250, 252)
    pdf.set_draw_color(226, 232, 240)
    pdf.set_line_width(0.3)
    y_meta = pdf.get_y()
    pdf.rect(16, y_meta, 178, 14, style="FD")
    
    col_w = 178 / 3
    pdf.set_xy(18, y_meta + 2)
    pdf.set_font("CustomArial", "B", 7.5)
    pdf.set_text_color(15, 23, 42)
    pdf.cell(col_w, 4, "PROJETO & SISTEMA", align="L")
    pdf.cell(col_w, 4, "AUTOR / DISCENTE", align="L")
    pdf.cell(col_w, 4, "DESTINATÁRIO / AVALIAÇÃO", align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)

    pdf.set_x(18)
    pdf.set_font("CustomArial", "", 8.5)
    pdf.set_text_color(51, 65, 85)
    pdf.cell(col_w, 5, "Simulador Lan House & Cyber Café", align="L")
    pdf.cell(col_w, 5, "Daniel (Desenvolvedor)", align="L")
    pdf.cell(col_w, 5, "Corpo Docente / Professor Orientador", align="L", new_x=XPos.LMARGIN, new_y=YPos.NEXT)
    pdf.ln(4)

    # --- SEÇÃO 1 ---
    pdf.section_title("1", "Resumo Executivo e o Dilema Arquitetural")
    pdf.paragraph(
        "No desenvolvimento de aplicações interativas web de simulação e gestão empresarial (tycoon / business simulators), "
        "surge um desafio clássico de Engenharia de Interface: a tensão entre a imersão estética retrô e a usabilidade de dados analíticos. "
        "Quando projetos tentam forçar 100% da interface do usuário em Pixel Art de baixa resolução, deparam-se com limitações críticas: "
        "valores monetários decimais ficam ilegíveis, tabelas com dezenas de registros causam severa fadiga visual, e componentes contemporâneos "
        "essenciais (como QR Codes de pagamento PIX e gráficos analíticos de tendência) sofrem com perda de precisão ou tornam-se inoperantes."
    )
    pdf.paragraph(
        "Para solucionar este impasse, adotou-se uma Arquitetura Híbrida de Duas Camadas Desacopladas. "
        "O mundo espacial é renderizado em HTML5 Canvas 2D nativo utilizando Pixel Art fiel, preservando a nostalgia visual das lan houses dos anos 2000. "
        "Simultaneamente, a camada de gestão operacional, HUD, modais de auditoria e caixas de checkout é executada no DOM do React em Alta Resolução (HD/Vetorial), "
        "incorporando tipografia anti-serrilhada (Inter), cartões de telemetria no padrão Microsoft Power BI e fluxo financeiro moderno estilo fintech."
    )

    pdf.callout_box(
        "Destaque Arquitetural: Separação Estrita de Responsabilidades",
        "• Camada 1 (Mundo/Simulação): HTML5 Canvas 2D • Tiles 32x32 • Y-Sorting de Profundidade • ctx.imageSmoothingEnabled = false.\n"
        "• Camada 2 (Gestão/Analytics/HUD): DOM / React / SVG • Splines Bézier Contínuas • Donut Visual • Checkout PIX Dinâmico com QR Code em Alta Resolução."
    )

    # --- SEÇÃO 2 ---
    pdf.section_title("2", "Modelos, Gerações e Limitações de Hardware em Pixel Art")
    pdf.paragraph(
        "O Pixel Art não é meramente um filtro ou preferência estilística; trata-se de uma disciplina formal de computação gráfica "
        "forjada pelas restrições de arquitetura de processadores (CPUs), processadores de imagem (PPUs/VDPs), registradores de paleta e "
        "larguras de barramento das eras de 8-bit, 16-bit e 32-bit. A tabela a seguir categoriza os modelos técnicos canônicos da história dos games:"
    )

    # TABELA DAS GERAÇÕES
    pdf.set_font("CustomArial", "", 8)
    with pdf.table(col_widths=(24, 25, 42, 87), borders_layout="ALL") as table:
        header_row = table.row()
        pdf.set_font("CustomArial", "B", 7.8)
        header_row.cell("Geração / Era")
        header_row.cell("Resolução")
        header_row.cell("Paleta & Cores")
        header_row.cell("Restrições de Hardware & Hallmarks Visuais")

        pdf.set_font("CustomArial", "", 7.6)
        r1 = table.row()
        r1.cell("1-Bit / 2-Bit\n(Monocromático\ne Game Boy DMG)")
        r1.cell("160x144 (DMG)\n128x64 (LCDs)")
        r1.cell("1 a 2 bits por pixel.\n2 a 4 tons (ex.: os 4 tons de verde do Game Boy).")
        r1.cell("Sem cores. Dependência total de Bayer Dithering (tramas de xadrez) e silhuetas de alto contraste para definir volume, iluminação e profundidade.")

        r2 = table.row()
        r2.cell("8-Bit\n(NES, Master System,\nFamicom)")
        r2.cell("256x240 (NES)\n256x192 (Sega)")
        r2.cell("Paleta mestre de 54/64 cores.\nSubpaletas de 3 cores + 1 transparente por sprite.")
        r2.cell("Limite estrito de 8 sprites por scanline (gerando o clássico flickering/piscamento). Tiles de 8x8 agrupados em blocos de atributos de 16x16 com paleta única compartilhada.")

        r3 = table.row()
        r3.cell("16-Bit\n(SNES, Mega Drive,\nNeo Geo Arcade)")
        r3.cell("256x224 (SNES)\n320x224 (MD)\n320x224 (NeoGeo)")
        r3.cell("Espaço RGB de 15 bits (32.768 cores).\nMD: 64 cores simultâneas.\nSNES: 256 cores na tela.\nNeo Geo: 4.096 cores.")
        r3.cell("O ápice do pixel art clássico. Planos múltiplos de parallax, rotação e escala por hardware (Mode 7 do SNES) e iluminação volumétrica com sombreamento manual rico.")

        r4 = table.row()
        r4.cell("32-Bit / 64-Bit 2D\n(PS1, Saturn, GBA,\nNintendo DS)")
        r4.cell("240x160 (GBA)\n320x240 a 640x480\n(PS1 / Saturn)")
        r4.cell("TrueColor 15 a 24 bits (16,7M cores).\nCanais de Alpha Blending RGBA (8 bits de opacidade).")
        r4.cell("Fim das restrições de paleta fixa. Transparências suaves e aditivas, sprites gigantes com centenas de frames de animação fluida (ex.: Castlevania SOTN, Metal Slug, Street Fighter III).")

        r5 = table.row()
        r5.cell("Pixel Moderno\n(Indie Contemporâneo\n'Neo-Pixel')")
        r5.cell("Viewports 16:9:\n384x216, 480x270\nou 640x360")
        r5.cell("RGBA 32-bit completo.\nPaletas autorais estilizadas (DawnBringer, Endesga).")
        r5.cell("Projetado para Integer Scaling exato (3x, 4x, 5x) em monitores 1080p e 4K. Integração com iluminação dinâmica 2D, shaders de pós-processamento, mapas normais e partículas.")

    pdf.ln(3)

    # --- SEÇÃO 3 ---
    pdf.section_title("3", "Princípios e Regras Canônicas de Computação Gráfica em Pixel Art")
    pdf.subsection_title("A. O Erro Crítico dos 'Mixels' (Mistura de Resoluções)")
    pdf.paragraph(
        "Um Mixel (Mixed Resolution Pixel) ocorre quando o desenvolvedor escala ou rotaciona sprites com fatores não-inteiros, "
        "fazendo com que um objeto na tela tenha 'pixels de tamanho visual diferente' de outro objeto adjacente. "
        "Isso quebra imediatamente a coesão óptica. No motor de Canvas da Lan House, o grid é travado em 32x32 pixels e "
        "o zoom de câmera utiliza estritamente matrizes afins escaladas em números inteiros (Integer Scaling), garantindo fidelidade absoluta."
    )

    pdf.subsection_title("B. Hand Anti-Aliasing (AA Manual) vs Filtros Bilineares Automáticos")
    pdf.paragraph(
        "Enquanto placas de vídeo modernas aplicam interpolação bilinear ou bicúbica que embaça o pixel art, a técnica profissional de "
        "Hand Anti-Aliasing consiste em posicionar manualmente pixels com tons intermediários de luminosidade nas quinas das diagonais. "
        "Isso engana a retina humana, criando a ilusão de curvas orgânicas sem comprometer a nitidez das bordas."
    )

    pdf.subsection_title("C. Perspectiva Adotada: Top-Down 3/4 (Ortogonal)")
    pdf.paragraph(
        "A simulação adota a consagrada perspectiva Top-Down 3/4. Diferente da isométrica dimétrica 2:1 (que exige matemática vetorial de projeção losangular), "
        "o Top-Down 3/4 permite navegação cartesiana simples no plano X/Y com profundidade vertical. Os computadores e clientes exibem suas faces frontais e laterais, "
        "tornando imediata a identificação do status de cada máquina (tela ligada com usuário logado vs tela preta em manutenção)."
    )

    pdf.subsection_title("D. Algoritmo de Oclusão Dinâmica (Depth Sorting por Y-Sorting)")
    pdf.paragraph(
        "Para que clientes caminhem realisticamente na frente e atrás das mesas e bancadas gamer, o motor executa ordenação "
        "por coordenada vertical antes de cada ciclo de renderização (requestAnimationFrame):"
    )
    pdf.set_fill_color(15, 23, 42)
    pdf.set_text_color(226, 232, 240)
    pdf.set_font("courier", "", 7.8)
    codigo_ysort = (
        "// Algoritmo de Depth Sorting executado a 60 FPS:\n"
        "const entidades = [...computadores, ...clientes, ...moveis];\n"
        "entidades.sort((a, b) => a.posicaoY - b.posicaoY);\n"
        "entidades.forEach(item => item.renderizar(ctx));"
    )
    pdf.multi_cell(178, 4.2, codigo_ysort, fill=True)
    pdf.ln(3)

    # --- SEÇÃO 4 ---
    pdf.section_title("4", "Engenharia da Camada Analítica HD (Padrão Power BI & Fintech)")
    pdf.paragraph(
        "Na camada de gestão operacional (modais de Estatísticas, Gerenciamento de PCs e Caixa), a aplicação abandona o pixel art e adota "
        "componentes em SVG vetorial de alta definição inspirados nas ferramentas analíticas de líderes da indústria de tecnologia:"
    )

    pdf.subsection_title("A. Visual Analytics no Padrão Microsoft Power BI")
    pdf.paragraph(
        "• Gráficos de Área Spline com Gradiente: Substituição de poligonais secas por curvas contínuas Bézier calculadas via "
        "algoritmo de Catmull-Rom, preenchidas com gradiente translúcido (ciano #00f2fe a transparente) e marcadores luminosos de pico.\n"
        "• Power BI Donut Visual: Gráfico de rosca trigonométrico com cutout central destacando o KPI do horário de maior movimento (19h • PICO) e legendas com indicadores coloridos.\n"
        "• Colunas de Faturamento com Meta: Barras com cantos arredondados, trilhas de capacidade de fundo (track slots) e linha tracejada de meta semanal (Meta: R$ 1.2k).\n"
        "• KPI Cards com Micro-Sparklines: Cartões com borda de acento colorido de 3px no topo e mini-gráficos de evolução embutidos para leitura instantânea."
    )

    pdf.subsection_title("B. Fluxo Financeiro e Caixa Digital (Padrão Fintech)")
    pdf.paragraph(
        "• QR Code PIX em Vetor SVG: QR code responsivo de alta precisão com padrões de dados nítidos e logotipo oficial do Banco Central / PIX.\n"
        "• Chave Copia e Cola: Campo de chave em fonte monoespaçada com botão de cópia integrado à Clipboard API nativa e toast de confirmação.\n"
        "• Calculadora de Troco Automática: Campo de valor recebido em dinheiro com chips rápidos de cédulas (R$ 20, R$ 50, R$ 100) e cálculo automático de saldo."
    )

    # --- SEÇÃO 5 ---
    pdf.section_title("5", "Integração com Princípios de Orientação a Objetos (POO)")
    pdf.paragraph(
        "A interface gráfica atua como a camada de visualização (View) estritamente conectada ao modelo de domínio orientado a objetos:"
    )

    with pdf.table(col_widths=(35, 45, 98), borders_layout="ALL") as table_poo:
        h_row = table_poo.row()
        pdf.set_font("CustomArial", "B", 7.8)
        h_row.cell("Conceito de POO")
        h_row.cell("Regra de Negócio (RN)")
        h_row.cell("Implementação Concreta no Frontend")

        pdf.set_font("CustomArial", "", 7.6)
        r_p1 = table_poo.row()
        r_p1.cell("Polimorfismo")
        r_p1.cell("RN09: Desconto de 5% PIX;\ntarifação de maquininhas.")
        r_p1.cell("O checkout consome o mapa PROCESSADORES_PAGAMENTO onde cada classe concreta de forma de pagamento encapsula sua própria fórmula de cálculo sem ifs aninhados.")

        r_p2 = table_poo.row()
        r_p2.cell("Máquina de Estados\nFinita (FSM)")
        r_p2.cell("RN01–RN05: Ciclo de vida\nde PCs e Sessões.")
        r_p2.cell("O rack de computadores no topo e os cards de telemetria adaptam cores de LED, gradientes de tela e botões de ação com base nos estados atômicos (LIVRE, OCUPADO, MANUTENÇÃO).")

        r_p3 = table_poo.row()
        r_p3.cell("Encapsulamento")
        r_p3.cell("RF05/RF06: Abertura e\nfechamento de sessões.")
        r_p3.cell("A UI não altera variáveis de tempo ou cobrança diretamente; ela despacha eventos de comando formais ao motor LanHouseEngine, que valida e congela tarifas.")

        r_p4 = table_poo.row()
        r_p4.cell("Auditoria e Log")
        r_p4.cell("RF10/RN10: Auditoria POO\ne rastreabilidade contábil.")
        r_p4.cell("Aba dedicada de auditoria com tabela de logs imutáveis que rastreiam operador, timestamp ISO, descrição de evento e identificador da regra de negócio associada.")

    pdf.ln(3)

    # --- SEÇÃO 6 ---
    pdf.section_title("6", "Template de Prompt / Especificação para Equipes e IAs")
    pdf.paragraph(
        "Para que outras equipes ou assistentes de IA repliquem com exatidão a mesma arquitetura de software, o seguinte prompt serve de especificação canônica:"
    )

    pdf.callout_box(
        "Prompt Reutilizável de Especificação de Frontend Híbrido",
        "\"Desenvolva uma aplicação web interativa de gestão e simulação utilizando a Arquitetura Híbrida de Frontend. "
        "A simulação espacial do ambiente deve ser renderizada através de HTML5 Canvas em Pixel Art autêntico, com grid estrito de tiles de 32x32, "
        "desativação de anti-aliasing (ctx.imageSmoothingEnabled = false) e algoritmo de profundidade Y-Sorting. "
        "Em contrapartida, toda a interface analítica do operador (HUD, telemetria de computadores, estoque, relatórios e caixa) "
        "deve ser construída no DOM do React em Alta Resolução (HD Vetorial / SVG), aplicando design system escuro com glassmorphism, "
        "tipografia Inter, gráficos analíticos no padrão Microsoft Power BI (cards de KPI com accent lines, splines de Catmull-Rom com gradiente, "
        "donut visual de pico com cutout central) e checkout fintech com QR Code PIX em vetor e cálculo polimórfico de descontos. "
        "Mantenha as regras de negócio de POO estritamente desacopladas da camada de apresentação.\"",
        bg_rgb=(241, 245, 249),
        border_rgb=(100, 116, 139),
        text_rgb=(15, 23, 42)
    )

    # --- SEÇÃO 7 ---
    pdf.section_title("7", "Considerações Finais")
    pdf.paragraph(
        "A experiência acumulada neste projeto comprova que a estética nostálgica do Pixel Art e o rigor técnico dos dashboards modernos "
        "podem coexistir harmonicamente em uma mesma aplicação. A divisão clara de papéis entre o Canvas (focado na simulação espacial expressiva) "
        "e o SVG/DOM (focado na tomada de decisão gerencial orientada a dados) consolida um padrão moderno, escalável e de elevada qualidade de software."
    )

    output_path = r"C:\Users\danie\.gemini\antigravity\scratch\lanhouse-pixel-web\documento_arquitetura_pixel_art_hd.pdf"
    pdf.output(output_path)
    print(f"PDF gerado com sucesso em: {output_path} ({os.path.getsize(output_path)} bytes)")

    # Também copia para o diretório de artefatos da conversa
    artifact_dir = r"C:\Users\danie\.gemini\antigravity\brain\01e76d80-d0f6-4bba-bf6f-11a7d8431c6f"
    if os.path.exists(artifact_dir):
        artifact_pdf_path = os.path.join(artifact_dir, "documento_arquitetura_pixel_art_hd.pdf")
        with open(output_path, "rb") as src, open(artifact_pdf_path, "wb") as dst:
            dst.write(src.read())
        print(f"Cópia do PDF salva no diretório de artefatos: {artifact_pdf_path}")

if __name__ == "__main__":
    gerar_relatorio()
