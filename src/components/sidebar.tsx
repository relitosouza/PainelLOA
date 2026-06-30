"use client";

import Link from "next/link";
import { getPrimaryPageLinks } from "@/lib/page-navigation";
import type { FilterState } from "./filters";

export function Sidebar({
  view,
  mobileOpen,
  setMobileOpen,
  collapsed,
  setCollapsed,
}: {
  view: string;
  filters?: FilterState;
  setFilters?: (filters: FilterState) => void;
  options?: Record<string, string[]>;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}) {
  const primaryLinks = getPrimaryPageLinks(view);

  return (
    <aside
      className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#001a4b] text-white shrink-0 transition-transform duration-300 md:translate-x-0 ${
        collapsed ? "w-[84px]" : "w-[280px]"
      } ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}
      aria-label="Navegação principal"
    >
      {/* Header */}
      <div className="p-6">
        {!collapsed ? (
          <div className="flex items-center justify-between gap-3 mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
                <span
                  className="material-symbols-outlined text-white text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  account_balance
                </span>
              </div>
              <div className="min-w-0">
                {view === "transparente" && (
                  <h1 className="font-headline font-bold text-base leading-tight text-white whitespace-nowrap">
                    Portal Transparência
                  </h1>
                )}
                <p className="text-xs text-white/60 font-label">
                  Gestão Orçamentária
                </p>
              </div>
            </div>
            <button
              type="button"
              className="flex items-center justify-center p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all cursor-pointer border-0"
              onClick={() => setCollapsed(true)}
              aria-label="Recolher menu"
              title="Recolher menu"
            >
              <span className="material-symbols-outlined text-[18px]">menu</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4 mb-6">
            <div className="w-10 h-10 bg-white/15 rounded-lg flex items-center justify-center shrink-0">
              <span
                className="material-symbols-outlined text-white text-2xl"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                account_balance
              </span>
            </div>
            <button
              type="button"
              className="flex items-center justify-center p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all cursor-pointer border-0 w-10 h-10"
              onClick={() => setCollapsed(false)}
              aria-label="Expandir menu"
              title="Expandir menu"
            >
              <span className="material-symbols-outlined text-[18px]">menu_open</span>
            </button>
          </div>
        )}
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <div className="space-y-1">
          {primaryLinks.map((link) => {
            const isActive = !["importacao", "relatorios", "configuracoes"].includes(view) && view === link.key;
            return (
              <Link
                key={link.key}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                aria-current={isActive ? "page" : undefined}
                className={`flex items-center gap-3 py-3 px-4 font-medium transition-all ${
                  isActive
                    ? "bg-white/10 text-white border-l-4 border-white rounded-r-lg shadow-sm"
                    : "text-white/70 hover:bg-white/5 hover:text-white rounded-lg"
                }`}
              >
                <span
                  className="material-symbols-outlined"
                  style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}
                >
                  {link.icon}
                </span>
                {!collapsed && <span className="text-sm">{link.label}</span>}
              </Link>
            );
          })}
          <Link
            href="/importacao"
            onClick={() => setMobileOpen(false)}
            aria-current={view === "importacao" ? "page" : undefined}
            className={`flex items-center gap-3 py-3 px-4 font-medium transition-all ${
              view === "importacao"
                ? "bg-white/10 text-white border-l-4 border-white rounded-r-lg shadow-sm"
                : "text-white/70 hover:bg-white/5 hover:text-white rounded-lg"
            }`}
          >
            <span className="material-symbols-outlined">upload_file</span>
            {!collapsed && <span className="text-sm">Importações</span>}
          </Link>
          <Link
            href="/relatorios"
            onClick={() => setMobileOpen(false)}
            aria-current={view === "relatorios" ? "page" : undefined}
            className={`flex items-center gap-3 py-3 px-4 font-medium transition-all ${
              view === "relatorios"
                ? "bg-white/10 text-white border-l-4 border-white rounded-r-lg shadow-sm"
                : "text-white/70 hover:bg-white/5 hover:text-white rounded-lg"
            }`}
          >
            <span className="material-symbols-outlined">assessment</span>
            {!collapsed && <span className="text-sm">Relatórios</span>}
          </Link>
        </div>
      </nav>

      {/* Footer Links */}
      <div className="p-4 bg-black/20 border-t border-white/10 space-y-1">
        <Link
          href="/configuracoes"
          onClick={() => setMobileOpen(false)}
          aria-current={view === "configuracoes" ? "page" : undefined}
          className={`flex items-center gap-3 py-2 px-4 rounded-lg text-sm font-medium transition-all ${
            view === "configuracoes"
              ? "bg-white/10 text-white font-semibold"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          {!collapsed && <span>Configurações</span>}
        </Link>
        <a
          className="flex items-center gap-3 py-2 px-4 rounded-lg text-sm font-medium transition-all text-white/70 hover:bg-white/5 hover:text-white cursor-pointer"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            alert("Suporte: Portal de Transparência LOA v1.0");
          }}
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          {!collapsed && <span>Central de Ajuda</span>}
        </a>
      </div>
    </aside>
  );
}
