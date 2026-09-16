---
name: Sistema de Emendas Parlamentares — Osasco
description: Governança institucional, controle de cotas e admissibilidade para a Câmara de Osasco
colors:
  primary: "#1B365D"
  primary-light: "#3B82F6"
  accent: "#FBBF24"
  health: "#10B981"
  health-bg: "#D1FAE5"
  neutral-bg: "#F8FAFC"
  surface: "#FFFFFF"
  text-main: "#0F172A"
  text-muted: "#64748B"
  border-subtle: "#E2E8F0"
typography:
  display:
    fontFamily: "Outfit, sans-serif"
    fontSize: "clamp(2rem, 5vw, 3rem)"
    fontWeight: 800
    lineHeight: 1.1
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Outfit, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Outfit, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.35
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.6
  mono:
    fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace"
    fontSize: "0.875rem"
    fontWeight: 700
    lineHeight: 1.4
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "20px"
  "2xl": "24px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "#0F172A"
  button-health:
    backgroundColor: "{colors.health}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  card-glass:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: "24px"
---

# Design System: Sistema de Emendas Parlamentares — Osasco

## Overview

**Creative North Star: "The Civic Registry: Rigorous Governance with Tactile Clarity"**

O sistema de design foi construído para o controle e tramitação de emendas parlamentares impositivas (LOA 2027) da Câmara Municipal de Osasco. O design equilibra a autoridade solene do poder público com a agilidade e precisão de um software financeiro moderno. A atmosfera visual combina tons de azul institucional (*Navy #1B365D* e *Civic Blue #3B82F6*), tipografia híbrida (Outfit para títulos e Inter para densidade de leitura) e tratamento translúcido de vidro e cartões estruturados (*Glass Cards*).

**Key Characteristics:**
- **Densidade com Alta Escaneabilidade:** Visualização clara de 21 vereadores, cotas individuais (R$ 1,5M) e status de admissibilidade sem poluição visual.
- **Hierarquia Funcional de Cores:** Azul institucional para governança, Verde esmeralda para os 50% obrigatórios de Saúde, Âmbar para alertas e Vermelho estrito para críticas impeditivas do TCESP.
- **Tipografia Numérica Distinta:** Valores monetários e identificadores `AAAA-VVEE` e AUDESP renderizados em fonte monoespaçada legível.

## Colors

A paleta é corporativa, neutra e altamente contrastante, inspirada nas cores oficiais do brasão do município de Osasco e nas exigências de acessibilidade governamental.

### Primary
- **Institutional Navy** (`#1B365D`): Cor primária de autoridade, utilizada em cabeçalhos principais, botões primários e cartões institucionais.
- **Civic Blue** (`#3B82F6`): Azul de ação, utilizado em links, seleções ativas, etapas do wizard e focos interativos.

### Secondary
- **Health Emerald** (`#10B981` / `#D1FAE5`): Destaque funcional obrigatório para a reserva mínima de 50% em Saúde (Função 10) e aprovações de admissibilidade.
- **Warning Amber** (`#FBBF24` / `#FEF3C7`): Utilizado em alertas preventivos e itens que demandam atenção parlamentar.

### Neutral
- **Canvas Slate** (`#F8FAFC`): Fundo geral das páginas com acabamento suave.
- **Pure Surface** (`#FFFFFF`): Fundo de cartões, modais, formulários e tabelas.
- **Deep Navy Text** (`#0F172A`): Cor padrão de textos de alta ênfase.
- **Slate Muted** (`#64748B`): Textos auxiliares, legendas de etapas e metadados.
- **Border Subtle** (`#E2E8F0`): Linhas divisórias e contornos de cartões.

### Named Rules
**The Health Green Guarantee.** A cor verde esmeralda é estritamente reservada para o indicador de Saúde (50% mínimo da LOM) e para status de conformidade / admissibilidade plena. Nunca a utilize para elementos decorativos neutros.

**The Critique Color Strictness.** Vermelho é usado exclusivamente para críticas impeditivas de consolidação (ex: objeto genérico, estouro de cota) e nunca para estados normais de interface.

## Typography

**Display / Headline Font:** `Outfit`, sans-serif  
**Body / Interface Font:** `Inter`, sans-serif  
**Data & Code Font:** `ui-monospace`, `SFMono-Regular`, `Consolas`, monospace  

**Character:** A combinação de *Outfit* com *Inter* une modernidade geométrica nos títulos com excelente legibilidade e densidade de informação no corpo de formulários e tabelas.

### Hierarchy
- **Display** (800, `clamp(2rem, 5vw, 3rem)`, `1.1`): Cabeçalhos heróicos do portal e títulos principais de painéis.
- **Headline** (700, `1.5rem` / 24px, `1.25`): Títulos de seções, páginas do wizard e modais de detalhes.
- **Title** (700, `1.125rem` / 18px, `1.35`): Nomes de parlamentares, cabeçalhos de cartões e abas de navegação.
- **Body** (400, `0.9375rem` / 15px, `1.6`): Textos de justificativa, descrições de objetos e instruções gerais (máx. 75ch).
- **Label / Metric** (900, `0.6875rem` / 11px, letter-spacing `0.08em`, uppercase): Rótulos de campo, metadados normativos e etiquetas de rastreabilidade.
- **Mono Data** (700, `0.875rem` / 14px, `1.4`): IDs `AAAA-VVEE`, códigos AUDESP e valores monetários conciliados.

### Named Rules
**The Monospace Identifier Rule.** Todo identificador determinístico de emenda (`2027-1701`), código AUDESP (`20271701`) e valor financeiro (R$) deve ser exibido com fonte monoespaçada para garantir clareza visual e alinhamento numérico.

## Layout

- **Modelo Espacial:** Grid responsivo de 12 colunas com contêiner centralizado (`max-w-7xl`, ~1280px).
- **Espaçamento e Ritmo:** Escala base modular de 8px (8px, 16px, 24px, 32px).
- **Barra de Navegação Fixa:** Header superior com efeito de desfoque translúcido (`backdrop-blur-xl bg-white/95`) fixado no topo para acesso permanente a ações de dossiê e consolidação.
- **Wizard Passo-a-Passo:** Stepper sequencial com barra de progresso e validações por etapa antes do avanço.

## Elevation & Depth

O sistema utiliza elevação sutil baseada em camadas tonais (*Tonal Layering*) e sombras suaves com cor de dispersão do tema, complementado por efeitos de vidro (*Glassmorphism*).

### Shadow Vocabulary
- **Card Rest** (`box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05)`): Elevação padrão de cartões de conteúdo.
- **Glass Floating** (`box-shadow: 0 10px 25px -5px rgba(27, 54, 93, 0.08)`): Cartões de destaque, cabeçalhos fixos e menus suspensos.
- **Modal Overlay** (`box-shadow: 0 25px 50px -12px rgba(15, 23, 42, 0.25)`): Modais de cadastro e visualizadores de PDF.

### Named Rules
**The Flat-At-Rest Rule.** As superfícies permanecem limpas e com elevação mínima em repouso. Sombras mais profundas e elevações ocorrem como resposta a estados interativos (hover e foco) ou para isolamento modal.

## Shapes

- **Bordas e Cantos:** Cantos generosamente arredondados (`rounded-2xl` - 16px a 24px) para cartões de conteúdo e contêineres principais; `rounded-xl` (12px) para botões e campos de entrada.
- **Avatares e Badges de Código:** Quadrados com cantos arredondados (`rounded-xl` / `rounded-2xl`) exibindo a foto oficial ou o código numérico de 2 dígitos do vereador (`01` a `21`).

## Components

### Buttons
- **Shape:** Raio de 12px (`rounded-xl`).
- **Primary:** Fundo `#1B365D`, texto branco, padding `10px 20px`, peso font-bold, transição `all 0.2s`. Hover: fundo `#0F172A` e sombra difusa.
- **Success / Consolidação:** Fundo `#059669` (Emerald 600), texto branco com ícone de verificação.

### Cards & Glass Containers
- **Glass Card:** Fundo `rgba(255,255,255,0.85)` com `backdrop-blur-md`, borda de 1px `#E2E8F0` e raio de 16px.
- **Conciliation Banner:** Fundo gradiente escuro de alta densidade (`from-slate-900 to-slate-800`), texto branco com métricas de conciliação tripla destacadas em verde esmeralda.

### Inputs & Selects
- **Estilo:** Fundo `#F8FAFC`, borda de 1px `#CBD5E1`, raio de 12px, padding `10px 16px`.
- **Foco:** Fundo branco, borda `#3B82F6` com anel de foco suave.

### Status Badges & Chips
- **Consolidada / Admissível:** Fundo `#D1FAE5`, texto `#065F46`, font-black, uppercase, raio de 6px.
- **Em Análise:** Fundo `#FEF3C7`, texto `#92400E`.
- **Inadmissível / Crítico:** Fundo `#FEE2E2`, texto `#991B1B`.

## Do's and Don'ts

### Do:
- **Do** exibir sempre o identificador determinístico `AAAA-VVEE` acompanhado do número AUDESP de 8 dígitos.
- **Do** manter a barra de conciliação tripla visível durante a edição do cronograma e do plano de aplicação.
- **Do** fornecer visualização e download em PDF inline para pareceres técnicos e jurídicos.
- **Do** utilizar a ordenação alfabética oficial e o código numérico fixo de 2 dígitos (`01`..`21`) para os 21 vereadores de Osasco.

### Don't:
- **Don't** permitir a consolidação para o Bloco B enquanto houver críticas impeditivas (*CRIT_*) ativas no motor de regras.
- **Don't** utilizar classes utilitárias improvisadas ou cores genéricas fora da paleta corporativa municipal.
- **Don't** ocultar a fundamentação legal (LOM art. 150 / TCESP) nos avisos de inconsistência e críticas.
