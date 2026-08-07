export type PrimaryPageKey = "dashboard" | "apresentacao" | "transparente" | "receitas" | "despesas" | "analise-loa" | "elaboracao-loa";

export type PrimaryPageLink = {
  key: PrimaryPageKey;
  label: string;
  href: string;
  icon: string;
};

export type NavigationSectionKey = "visao-analitica" | "painel-executivo" | "loa-transparente";
export type NavigationSection = {
  key: NavigationSectionKey;
  label: string;
  pages: PrimaryPageKey[];
};

export const NAVIGATION_SETTINGS_STORAGE_KEY = "painel_loa_navigation_settings_v1";

export const DEFAULT_NAVIGATION_SECTIONS: NavigationSection[] = [
  { key: "visao-analitica", label: "Visão Analítica", pages: ["dashboard", "analise-loa", "elaboracao-loa"] },
  { key: "painel-executivo", label: "Painel Executivo", pages: ["apresentacao"] },
  { key: "loa-transparente", label: "LOA Transparente", pages: ["transparente"] },
];

export const PRIMARY_PAGE_LINKS: PrimaryPageLink[] = [
  { key: "dashboard", label: "Visão Analítica", href: "/", icon: "dashboard" },
  { key: "analise-loa", label: "Análise LOA (subelemento)", href: "/analise-loa", icon: "pivot_table_chart" },
  { key: "elaboracao-loa", label: "Elaboração da LOA", href: "/elaboracao-loa", icon: "account_tree" },
  { key: "apresentacao", label: "Painel Executivo", href: "/apresentacao", icon: "slideshow" },
  { key: "transparente", label: "LOA Transparente", href: "/transparente", icon: "visibility" },
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
