export type PrimaryPageKey = "dashboard" | "apresentacao" | "transparente" | "receitas" | "despesas";

export type PrimaryPageLink = {
  key: PrimaryPageKey;
  label: string;
  href: string;
  icon: string;
};

export const PRIMARY_PAGE_LINKS: PrimaryPageLink[] = [
  { key: "dashboard", label: "Visão Analítica", href: "/", icon: "dashboard" },
  { key: "apresentacao", label: "Painel Executivo", href: "/apresentacao", icon: "slideshow" },
  { key: "transparente", label: "LOA Transparente", href: "/transparente", icon: "visibility" },
  { key: "receitas", label: "Receitas (Detalhe)", href: "/receitas", icon: "payments" },
  { key: "despesas", label: "Despesas (Detalhe)", href: "/despesas", icon: "account_balance_wallet" },
];

export function getPrimaryPageLinks(currentView?: string) {
  return PRIMARY_PAGE_LINKS.filter((item) => item.key !== currentView);
}
