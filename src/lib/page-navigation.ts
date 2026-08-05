export type PrimaryPageKey = "dashboard" | "apresentacao" | "transparente" | "receitas" | "despesas" | "analise-loa";

export type PrimaryPageLink = {
  key: PrimaryPageKey;
  label: string;
  href: string;
  icon: string;
};

export const PRIMARY_PAGE_LINKS: PrimaryPageLink[] = [
  { key: "dashboard", label: "Visão Analítica", href: "/", icon: "dashboard" },
  { key: "analise-loa", label: "Análise da LOA", href: "/analise-loa", icon: "pivot_table_chart" },
  { key: "apresentacao", label: "Painel Executivo", href: "/apresentacao", icon: "slideshow" },
  { key: "transparente", label: "LOA Transparente", href: "/transparente", icon: "visibility" },
];

export function getPrimaryPageLinks(_currentView?: string) {
  return PRIMARY_PAGE_LINKS;
}
