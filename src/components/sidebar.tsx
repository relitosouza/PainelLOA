"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { getNavigationLinks, getNavigationSections, NAVIGATION_SETTINGS_STORAGE_KEY, type NavigationSection } from "@/lib/page-navigation";
import type { FilterState } from "./filters";

export function Sidebar({
  id,
  isDesktop,
  view,
  mobileOpen,
  setMobileOpen,
  collapsed,
}: {
  id: string;
  isDesktop: boolean;
  view: string;
  filters?: FilterState;
  setFilters?: (filters: FilterState) => void;
  options?: Record<string, string[]>;
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}) {
  const searchParams = useSearchParams();
  const activeSubMenu = searchParams?.get("tab") || "ldo";
  const isReceitasActive = view === "receitas";
  const isDespesasActive = view === "despesas";

  const [receitasExpanded, setReceitasExpanded] = useState(true);
  const [despesasExpanded, setDespesasExpanded] = useState(true);
  const [navigationSections, setNavigationSections] = useState<NavigationSection[]>(getNavigationSections());

  useEffect(() => {
    const loadNavigation = () => {
      try {
        const saved = localStorage.getItem(NAVIGATION_SETTINGS_STORAGE_KEY);
        if (saved) setNavigationSections(JSON.parse(saved) as NavigationSection[]);
      } catch {
        setNavigationSections(getNavigationSections());
      }
    };
    loadNavigation();
    window.addEventListener("painel-loa-navigation-change", loadNavigation);
    return () => window.removeEventListener("painel-loa-navigation-change", loadNavigation);
  }, []);

  const linksBySection = navigationSections.map((section) => ({ section, links: getNavigationLinks([section]) }));
  const isVisible = isDesktop ? !collapsed : mobileOpen;

  return (
    <aside
      id={id}
      className={`fixed top-0 bottom-0 left-0 z-40 flex flex-col bg-[#001a4b] text-white shrink-0 w-[280px] will-change-transform transition-[transform,opacity] duration-300 ease-out motion-reduce:transition-none ${
        mobileOpen ? "translate-x-0" : "-translate-x-full pointer-events-none"
      } ${
        collapsed
          ? "md:-translate-x-full md:pointer-events-none"
          : "md:translate-x-0 md:pointer-events-auto"
      }`}
      inert={!isVisible ? true : undefined}
      aria-hidden={!isVisible}
      aria-label="Navegação principal"
      style={{
        opacity: isVisible ? 1 : 0,
      }}
    >
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center gap-3 mb-6">
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
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-4 py-2 space-y-1">
        <div className="space-y-1">
          {linksBySection.map(({ section, links }) => {
            if (links.length === 0) return null;
            return (
              <div key={section.key} className="space-y-1 pt-1">
                <span className={`px-4 text-[10px] font-bold tracking-wider text-white/40 uppercase block mb-1 ${collapsed ? "md:hidden" : ""}`}>
                  {section.label}
                </span>
                {links.map((link) => {
                  if (link.key === "receitas") {
                    return (
                      <div key={link.key} className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => setReceitasExpanded(!receitasExpanded)}
                          className={`w-full flex items-center justify-between py-2.5 px-4 font-medium transition-all rounded-xl text-white/80 hover:bg-white/5 hover:text-white ${
                            isReceitasActive ? "bg-white/10 text-white font-semibold" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                            <span className={`text-sm ${collapsed ? "md:hidden" : ""}`}>{link.label}</span>
                          </div>
                          <span className={`material-symbols-outlined text-sm transition-transform ${receitasExpanded ? "rotate-180" : ""} ${collapsed ? "md:hidden" : ""}`}>
                            expand_more
                          </span>
                        </button>

                        {receitasExpanded && (
                          <div className={`pl-9 pr-2 space-y-1 py-1 ${collapsed ? "md:hidden" : ""}`}>
                            <Link
                              href="/receitas?tab=ldo"
                              onClick={() => setMobileOpen(false)}
                              className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs transition-colors ${
                                isReceitasActive && (activeSubMenu === "ldo" || !activeSubMenu)
                                  ? "bg-white/15 text-white font-bold ring-1 ring-inset ring-white/20"
                                  : "text-white/70 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                              <span>Receitas LDO</span>
                            </Link>

                            <Link
                              href="/receitas?tab=loa"
                              onClick={() => setMobileOpen(false)}
                              className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs transition-colors ${
                                isReceitasActive && activeSubMenu === "loa"
                                  ? "bg-white/15 text-white font-bold ring-1 ring-inset ring-white/20"
                                  : "text-white/70 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                              <span>Receitas LOA</span>
                            </Link>

                            <Link
                              href="/receitas?tab=arrecadada"
                              onClick={() => setMobileOpen(false)}
                              className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs transition-colors ${
                                isReceitasActive && activeSubMenu === "arrecadada"
                                  ? "bg-white/15 text-white font-bold ring-1 ring-inset ring-white/20"
                                  : "text-white/70 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                              <span>Análise de Receita Arrecadada</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  }

                  if (link.key === "despesas") {
                    return (
                      <div key={link.key} className="space-y-0.5">
                        <button
                          type="button"
                          onClick={() => setDespesasExpanded(!despesasExpanded)}
                          className={`w-full flex items-center justify-between py-2.5 px-4 font-medium transition-all rounded-xl text-white/80 hover:bg-white/5 hover:text-white ${
                            isDespesasActive ? "bg-white/10 text-white font-semibold" : ""
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="material-symbols-outlined text-[20px]">{link.icon}</span>
                            <span className={`text-sm ${collapsed ? "md:hidden" : ""}`}>{link.label}</span>
                          </div>
                          <span className={`material-symbols-outlined text-sm transition-transform ${despesasExpanded ? "rotate-180" : ""} ${collapsed ? "md:hidden" : ""}`}>
                            expand_more
                          </span>
                        </button>

                        {despesasExpanded && (
                          <div className={`pl-9 pr-2 space-y-1 py-1 ${collapsed ? "md:hidden" : ""}`}>
                            <Link
                              href="/despesas?tab=loa"
                              onClick={() => setMobileOpen(false)}
                              className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs transition-colors ${
                                isDespesasActive && (activeSubMenu === "loa" || !activeSubMenu)
                                  ? "bg-white/15 text-white font-bold ring-1 ring-inset ring-white/20"
                                  : "text-white/70 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                              <span>Despesas LOA</span>
                            </Link>

                            <Link
                              href="/despesas?tab=execucao"
                              onClick={() => setMobileOpen(false)}
                              className={`flex items-center gap-2 py-1.5 px-3 rounded-lg text-xs transition-colors ${
                                isDespesasActive && activeSubMenu === "execucao"
                                  ? "bg-white/15 text-white font-bold ring-1 ring-inset ring-white/20"
                                  : "text-white/70 hover:text-white hover:bg-white/5"
                              }`}
                            >
                              <span className="w-1.5 h-1.5 rounded-full bg-secondary"></span>
                              <span>Análise de Despesa Executada</span>
                            </Link>
                          </div>
                        )}
                      </div>
                    );
                  }

                  const isActive = view === link.key;
                  return (
                    <Link
                      key={link.key}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 py-3 px-4 font-medium transition-all ${
                        isActive
                          ? "bg-white/12 text-white rounded-xl ring-1 ring-inset ring-white/15 shadow-sm"
                          : "text-white/70 hover:bg-white/5 hover:text-white rounded-xl"
                      }`}
                    >
                      <span className="material-symbols-outlined" style={{ fontVariationSettings: isActive ? "'FILL' 1" : undefined }}>
                        {link.icon}
                      </span>
                      <span className={`text-sm ${collapsed ? "md:hidden" : ""}`}>{link.label}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
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
              ? "bg-white/12 text-white font-semibold ring-1 ring-inset ring-white/15"
              : "text-white/70 hover:bg-white/5 hover:text-white"
          }`}
        >
          <span className="material-symbols-outlined text-[20px]">settings</span>
          <span className={`${collapsed ? "md:hidden" : ""}`}>Configurações</span>
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
          <span className={`${collapsed ? "md:hidden" : ""}`}>Central de Ajuda</span>
        </a>
      </div>
    </aside>
  );
}
