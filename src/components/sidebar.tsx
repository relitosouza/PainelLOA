import Link from "next/link";

const NAVIGATION = [
  ["dashboard", "▦", "Dashboard LOA"],
  ["importacao", "⇧", "Importação de Dados"],
  ["orgaos", "◆", "Órgãos / Secretarias"],
  ["unidades", "□", "Unidades Orçamentárias"],
  ["funcoes", "◉", "Funções"],
  ["subfuncoes", "◎", "Subfunções"],
  ["programas", "▤", "Programas"],
  ["acoes", "▶", "Ações"],
  ["natureza", "≡", "Natureza da Despesa"],
  ["processos", "⌕", "Processos Administrativos"],
  ["relatorios", "▥", "Relatórios"],
  ["configuracoes", "⚙", "Configurações"],
] as const;

export function Sidebar({ view, collapsed, mobileOpen, onToggle }: { view: string; collapsed: boolean; mobileOpen: boolean; onToggle(): void }) {
  return (
    <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`} aria-label="Navegação principal">
      <div className="brand"><div className="brand-mark">LOA</div><div><strong>Visualizador da LOA</strong><span>Gestão Orçamentária</span></div></div>
      <nav className="nav">
        <div className="nav-section">Visão executiva</div>
        {NAVIGATION.map(([path, icon, label], index) => (
          <div key={path}>
            {index === 2 && <div className="nav-section">Análises</div>}
            {index === 10 && <div className="nav-section">Administração</div>}
            <Link href={path === "dashboard" ? "/" : `/${path}`} className={`nav-link ${view === path ? "active" : ""}`} title={collapsed ? label : undefined}>
              <span className="nav-icon" aria-hidden="true">{icon}</span><span>{label}</span>
            </Link>
          </div>
        ))}
      </nav>
      <button className="sidebar-toggle" onClick={onToggle} aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>{collapsed ? "›" : "‹  Recolher menu"}</button>
    </aside>
  );
}

