export type PrimaryPageKey =
  | "dashboard"
  | "apresentacao"
  | "transparente"
  | "receitas"
  | "despesas"
  | "analise-loa"
  | "elaboracao-loa"
  | "importacao"
  | "relatorios"
  | "assistente-loa";

export type PrimaryPageLink = {
  key: PrimaryPageKey;
  label: string;
  href: string;
  icon: string;
};

export type NavigationSectionKey =
  | "visao-analitica"
  | "painel-executivo"
  | "loa-transparente"
  | "painel-receitas"
  | "painel-despesas"
  | "ferramentas";

export type NavigationSection = {
  key: NavigationSectionKey;
  label: string;
  pages: PrimaryPageKey[];
};

export const NAVIGATION_SETTINGS_STORAGE_KEY = "painel_loa_navigation_settings_v1";

export const DEFAULT_NAVIGATION_SECTIONS: NavigationSection[] = [
  { key: "visao-analitica", label: "Visão Analítica", pages: ["dashboard"] },
  { key: "loa-transparente", label: "Orçamento Transparente", pages: ["transparente"] },
  { key: "ferramentas", label: "Ferramentas", pages: ["assistente-loa"] },
];

export const PRIMARY_PAGE_LINKS: PrimaryPageLink[] = [
  { key: "dashboard", label: "Visão Analítica", href: "/", icon: "dashboard" },
  { key: "analise-loa", label: "Análise LOA (subelemento)", href: "/analise-loa", icon: "pivot_table_chart" },
  { key: "elaboracao-loa", label: "Elaboração da LOA", href: "/elaboracao-loa", icon: "account_tree" },
  { key: "apresentacao", label: "Painel Executivo", href: "/apresentacao", icon: "slideshow" },
  { key: "transparente", label: "Orçamento Transparente", href: "/transparente", icon: "visibility" },
  { key: "receitas", label: "Painel de Receitas Municipais", href: "/receitas", icon: "account_balance_wallet" },
  { key: "despesas", label: "Painel de Despesas Municipais", href: "/despesas", icon: "shopping_cart" },
  { key: "importacao", label: "Importações", href: "/importacao", icon: "upload_file" },
  { key: "relatorios", label: "Relatórios", href: "/relatorios", icon: "assessment" },
  { key: "assistente-loa", label: "Assistente LOA", href: "/assistente-loa", icon: "auto_awesome" },
];

export function getPrimaryPageLinks(_currentView?: string) {
  return PRIMARY_PAGE_LINKS;
}

export function getNavigationSections() {
  return DEFAULT_NAVIGATION_SECTIONS;
}

export function getNavigationLinks(sections: NavigationSection[]) {
  const byKey = new Map(PRIMARY_PAGE_LINKS.map((link) => [link.key, link]));
  return sections.flatMap((section) => section.pages.map((key) => byKey.get(key)).filter((link): link is PrimaryPageLink => Boolean(link)));
}
