"use client";

import { useState } from "react";
import { DashboardView } from "./dashboard-view";
import { ImportView } from "./import-view";
import { PresentationDashboard } from "./presentation-dashboard";
import { SettingsView } from "./settings-view";
import { Sidebar } from "./sidebar";

export function AppShell({ view }: { view: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  if (view === "apresentacao") return <PresentationDashboard />;
  return <div className="app"><a className="skip-link" href="#main-content">Pular para o conteúdo</a><Sidebar view={view} collapsed={collapsed} mobileOpen={mobileOpen} onToggle={() => setCollapsed((value) => !value)} /><main id="main-content" className={`main ${collapsed ? "collapsed" : ""}`}><div className="topbar"><div style={{ display: "flex", alignItems: "center", gap: 12 }}><button className="mobile-menu" onClick={() => setMobileOpen((value) => !value)} aria-label="Abrir menu">☰</button><div><div className="topbar-title">Visualizador da LOA</div><div className="topbar-subtitle">Lei Orçamentária Anual</div></div></div><div className="status-pill"><span className="status-dot" /> Ambiente institucional</div></div><div className="content">{view === "importacao" ? <ImportView /> : view === "configuracoes" ? <SettingsView /> : <DashboardView view={view} />}</div></main>{mobileOpen && <button aria-label="Fechar menu" onClick={() => setMobileOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 25, border: 0, background: "rgba(5,23,32,.35)" }} />}</div>;
}
